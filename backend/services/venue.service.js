const { pool } = require('../config/db');

async function getVenues() {
  const hasDetails = await hasVenueDetailColumns();
  const extraColumns = hasDetails ? ', booth_number, venue_date' : ', NULL AS booth_number, NULL AS venue_date';
  const [venues] = await pool.execute(
    `SELECT id, venue_id, venue${extraColumns}, created_at, updated_at FROM venue_master ORDER BY created_at DESC`
  );

  return venues;
}

let venueDetailColumnsExist;

async function hasVenueDetailColumns() {
  if (venueDetailColumnsExist !== undefined) {
    return venueDetailColumnsExist;
  }

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'venue_master'
       AND COLUMN_NAME IN ('booth_number', 'venue_date')`
  );

  venueDetailColumnsExist = Number(rows[0]?.count || 0) === 2;
  return venueDetailColumnsExist;
}

function normalizeVenue(venue) {
  return String(venue || '')
    .split('-')
    .map(part => part.trim().replace(/\s+/g, ' '))
    .join('-')
    .toLowerCase();
}

async function assertVenueIsUnique(venue, excludeId = null) {
  const [venues] = await pool.execute(
    `SELECT id, venue FROM venue_master${excludeId ? ' WHERE id <> ?' : ''}`,
    excludeId ? [excludeId] : []
  );
  const normalizedVenue = normalizeVenue(venue);
  const duplicate = venues.find(row => normalizeVenue(row.venue) === normalizedVenue);

  if (duplicate) {
    const err = new Error('Venue already exists.');
    err.statusCode = 409;
    throw err;
  }
}

function splitVenueParts(venueStr) {
  if (!venueStr) return { venueName: '', city: '', year: '' };
  const parts = venueStr.split('-');
  if (parts.length >= 3) {
    const year = (parts[parts.length - 1] || '').trim();
    const city = (parts[parts.length - 2] || '').trim();
    const venueName = parts.slice(0, parts.length - 2).join('-').trim();
    return { venueName, city, year };
  }
  return { venueName: (venueStr || '').trim(), city: '', year: '' };
}

async function createVenue(venue) {
  await assertVenueIsUnique(venue.venue);

  const [rows] = await pool.execute(`SELECT venue_id FROM venue_master ORDER BY id DESC LIMIT 1`);
  let nextNum = 1;

  if (rows.length > 0) {
    const lastId = rows[0].venue_id;
    const match = lastId.match(/^VEN(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const hasDetails = await hasVenueDetailColumns();
  const venueId = `VEN${nextNum.toString().padStart(3, '0')}`;
  const columns = ['venue_id', 'venue', ...(hasDetails ? ['booth_number', 'venue_date'] : [])];
  const values = [venueId, venue.venue, ...(hasDetails ? [venue.booth_number, venue.venue_date] : [])];
  const placeholders = columns.map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO venue_master (${columns.join(', ')}) VALUES (${placeholders})`,
    values
  );

  // Sync to venue_details table - ensure everything is saved empty if falsy
  const { venueName, city, year } = splitVenueParts(venue.venue);
  await pool.execute(
    `INSERT INTO venue_details (venue_master_id, venue, city, year) VALUES (?, ?, ?, ?)`,
    [result.insertId, venueName || '', city || '', year || '']
  );

  return { id: result.insertId, venue_id: venueId, message: 'Venue added successfully.' };
}

async function updateVenue(id, venue) {
  await assertVenueIsUnique(venue.venue, id);

  const hasDetails = await hasVenueDetailColumns();
  const detailSet = hasDetails ? ', booth_number = ?, venue_date = ?' : '';
  const detailValues = hasDetails ? [venue.booth_number, venue.venue_date] : [];
  await pool.execute(
    `UPDATE venue_master SET venue = ?${detailSet} WHERE id = ?`,
    [venue.venue, ...detailValues, id]
  );

  // Sync to venue_details table - ensure everything is saved empty if falsy
  const { venueName, city, year } = splitVenueParts(venue.venue);
  const [rows] = await pool.execute('SELECT id FROM venue_details WHERE venue_master_id = ?', [id]);
  if (rows.length > 0) {
    await pool.execute(
      'UPDATE venue_details SET venue = ?, city = ?, year = ? WHERE venue_master_id = ?',
      [venueName || '', city || '', year || '', id]
    );
  } else {
    await pool.execute(
      'INSERT INTO venue_details (venue_master_id, venue, city, year) VALUES (?, ?, ?, ?)',
      [id, venueName || '', city || '', year || '']
    );
  }

  return { message: 'Venue updated successfully.' };
}

async function deleteVenue(id) {
  const [venueRows] = await pool.execute('SELECT venue_id FROM venue_master WHERE id = ?', [id]);
  if (venueRows.length === 0) {
    const err = new Error('Venue not found.');
    err.statusCode = 404;
    throw err;
  }

  const [enquiries] = await pool.execute('SELECT id FROM enquiries WHERE venue_id = ? AND status = 0 LIMIT 1', [venueRows[0].venue_id]);
  if (enquiries.length > 0) {
    const err = new Error('Cannot delete venue as it is being used in enquiries.');
    err.statusCode = 400;
    throw err;
  }

  await pool.execute('DELETE FROM venue_master WHERE id = ?', [id]);
  return { message: 'Venue deleted successfully.' };
}

module.exports = {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue
};
