const { pool } = require('../config/db');

async function getActiveLeadCategories() {
  const [leadCategories] = await pool.execute(
    `SELECT id, lead_category_id, name, description, created_at, updated_at
     FROM lead_categories
     WHERE is_deleted = 0
     ORDER BY name ASC`
  );

  return leadCategories;
}

async function getLeadCategories({ search = '' }) {
  const filters = ['is_deleted = 0'];
  const params = [];

  if (search) {
    const likeSearch = `%${search}%`;
    filters.push('(lead_category_id LIKE ? OR name LIKE ? OR description LIKE ?)');
    params.push(likeSearch, likeSearch, likeSearch);
  }

  const [leadCategories] = await pool.execute(
    `SELECT id, lead_category_id, name, description, created_at, updated_at
     FROM lead_categories
     WHERE ${filters.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return leadCategories;
}

async function createLeadCategory(leadCategory) {
  console.log('Service: createLeadCategory called with:', leadCategory);

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM lead_categories WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [leadCategory.name]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Lead category already exists.');
    err.statusCode = 400;
    throw err;
  }

  const leadCategoryId = await getNextLeadCategoryId();
  console.log('Service: Generated lead_category_id:', leadCategoryId);

  const [result] = await pool.execute(
    `INSERT INTO lead_categories (lead_category_id, name, description)
     VALUES (?, ?, ?)`,
    [leadCategoryId, leadCategory.name, leadCategory.description]
  );

  console.log('Service: Insert result:', result);

  return {
    id: result.insertId,
    lead_category_id: leadCategoryId,
    message: 'Lead category added successfully.'
  };
}

async function updateLeadCategory(id, leadCategory) {
  const [existingRows] = await pool.execute(
    `SELECT id FROM lead_categories WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Lead category not found.');
    err.statusCode = 404;
    throw err;
  }

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM lead_categories WHERE LOWER(name) = LOWER(?) AND id <> ? AND is_deleted = 0 LIMIT 1`,
    [leadCategory.name, id]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Lead category already exists.');
    err.statusCode = 400;
    throw err;
  }

  await pool.execute(
    `UPDATE lead_categories
     SET name = ?, description = ?
     WHERE id = ? AND is_deleted = 0`,
    [leadCategory.name, leadCategory.description, id]
  );

  return { message: 'Lead category updated successfully.' };
}

async function deleteLeadCategory(id) {
  const [result] = await pool.execute(
    `UPDATE lead_categories SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Lead category not found.');
    err.statusCode = 404;
    throw err;
  }

  return { message: 'Lead category deleted successfully.' };
}

async function existsByName(name) {
  if (!name) {
    return false;
  }

  const [rows] = await pool.execute(
    `SELECT id FROM lead_categories WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [name]
  );

  return rows.length > 0;
}

async function getNextLeadCategoryId() {
  const [rows] = await pool.execute(
    `SELECT lead_category_id FROM lead_categories ORDER BY id DESC LIMIT 1`
  );

  if (rows.length === 0) {
    return 'LCAT001';
  }

  const match = String(rows[0].lead_category_id || '').match(/^LCAT(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `LCAT${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  getActiveLeadCategories,
  getLeadCategories,
  createLeadCategory,
  updateLeadCategory,
  deleteLeadCategory,
  existsByName
};
