const { pool } = require('../config/db');

async function getStats() {
  const [rows] = await pool.execute(
    `SELECT
      (SELECT COUNT(*) FROM enquiries WHERE status = 0) AS totalEnquiries,
      (SELECT COUNT(*) FROM enquiries WHERE status = 0 AND lead_category = 'Potential') AS potentialLeads,
      (SELECT COUNT(*) FROM enquiries WHERE status = 0 AND lead_category = 'Non Potential') AS nonPotentialLeads,
      (SELECT COUNT(*) FROM product_master WHERE is_deleted = 0) AS totalProducts`
  );

  return {
    totalEnquiries: Number(rows[0] && rows[0].totalEnquiries || 0),
    potentialLeads: Number(rows[0] && rows[0].potentialLeads || 0),
    nonPotentialLeads: Number(rows[0] && rows[0].nonPotentialLeads || 0),
    totalProducts: Number(rows[0] && rows[0].totalProducts || 0)
  };
}

async function getRecentEnquiries() {
  const [rows] = await pool.execute(
    `SELECT
      e.id,
      e.full_name,
      e.company_name,
      COALESCE(vm.venue, e.venue_id, '-') AS venue,
      e.lead_category,
      e.interests,
      e.created_at
     FROM enquiries e
     LEFT JOIN venue_master vm ON vm.venue_id = e.venue_id
     WHERE e.status = 0
     ORDER BY e.created_at DESC
     LIMIT 10`
  );

  return rows.map((row) => ({
    ...row,
    interests: normalizeInterestsForResponse(row.interests)
  }));
}

async function getMonthlyTrends() {
  const [rows] = await pool.execute(
    `SELECT
      dateKey,
      DATE_FORMAT(dateKey, '%d %b') AS date,
      COUNT(*) AS count
     FROM (
       SELECT DATE(created_at) AS dateKey
       FROM enquiries
       WHERE status = 0
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
     ) AS daily
     GROUP BY dateKey
     ORDER BY dateKey`
  );

  return rows.map((row) => ({
    dateKey: row.dateKey,
    date: row.date,
    count: Number(row.count || 0)
  }));
}

async function getProductDistribution() {
  const [products] = await pool.execute(
    `SELECT name FROM product_master WHERE is_deleted = 0 ORDER BY name ASC`
  );

  const [enquiries] = await pool.execute(
    `SELECT interests FROM enquiries WHERE status = 0`
  );

  const distribution = new Map(products.map((product) => [product.name, 0]));

  enquiries.forEach((enquiry) => {
    normalizeInterestsForResponse(enquiry.interests).forEach((interest) => {
      if (distribution.has(interest)) {
        distribution.set(interest, distribution.get(interest) + 1);
      }
    });
  });

  return Array.from(distribution.entries()).map(([product, count]) => ({
    product,
    count
  }));
}

async function getVenueAnalytics() {
  const [rows] = await pool.execute(
    `SELECT
      COALESCE(vm.venue, e.venue_id, 'Unknown') AS venue,
      COUNT(e.id) AS count
     FROM enquiries e
     LEFT JOIN venue_master vm ON vm.venue_id = e.venue_id
     WHERE e.status = 0
     GROUP BY COALESCE(vm.venue, e.venue_id, 'Unknown')
     ORDER BY count DESC, venue ASC`
  );

  return rows.map((row) => ({
    venue: row.venue,
    city: extractVenueCity(row.venue),
    count: Number(row.count || 0)
  }));
}

function normalizeInterestsForResponse(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function extractVenueCity(venue) {
  const value = String(venue || '').trim();
  const knownCity = ['Chennai', 'Bangalore', 'Coimbatore', 'Hyderabad']
    .find((city) => value.toLowerCase().includes(city.toLowerCase()));

  if (knownCity) {
    return knownCity;
  }

  const parts = value.split('-').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : value || 'Unknown';
}

module.exports = {
  getStats,
  getRecentEnquiries,
  getMonthlyTrends,
  getProductDistribution,
  getVenueAnalytics
};
