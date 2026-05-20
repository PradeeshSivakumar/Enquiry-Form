const { pool } = require('../config/db');

async function getVenues() {
  const [venues] = await pool.execute(
    `SELECT id, venue_id, venue, created_at, updated_at FROM venue_master ORDER BY created_at DESC`
  );

  return venues;
}

async function createVenue(venue) {
  const [rows] = await pool.execute(`SELECT venue_id FROM venue_master ORDER BY id DESC LIMIT 1`);
  let nextNum = 1;

  if (rows.length > 0) {
    const lastId = rows[0].venue_id;
    const match = lastId.match(/^VEN(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const venueId = `VEN${nextNum.toString().padStart(3, '0')}`;
  const [result] = await pool.execute(
    `INSERT INTO venue_master (venue_id, venue) VALUES (?, ?)`,
    [venueId, venue]
  );

  return { id: result.insertId, venue_id: venueId, message: 'Venue added successfully.' };
}

async function updateVenue(id, venue) {
  await pool.execute(
    `UPDATE venue_master SET venue = ? WHERE id = ?`,
    [venue, id]
  );

  return { message: 'Venue updated successfully.' };
}

async function deleteVenue(id) {
  const [venueRows] = await pool.execute('SELECT venue_id FROM venue_master WHERE id = ?', [id]);
  if (venueRows.length === 0) {
    const err = new Error('Venue not found.');
    err.statusCode = 404;
    throw err;
  }

  const [enquiries] = await pool.execute('SELECT id FROM enquiries WHERE venue_id = ? LIMIT 1', [venueRows[0].venue_id]);
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
