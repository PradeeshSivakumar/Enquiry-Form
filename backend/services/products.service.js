const { pool } = require('../config/db');

async function getActiveProducts() {
  const [products] = await pool.execute(
    `SELECT id, product_id, name, category, description, created_at, updated_at
     FROM product_master
     WHERE is_deleted = 0
     ORDER BY name ASC`
  );

  return products;
}

async function getProducts({ search = '' }) {
  const filters = ['is_deleted = 0'];
  const params = [];

  if (search) {
    filters.push('(product_id LIKE ? OR name LIKE ? OR category LIKE ? OR description LIKE ?)');
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch, likeSearch);
  }

  const [products] = await pool.execute(
    `SELECT id, product_id, name, category, description, created_at, updated_at
     FROM product_master
     WHERE ${filters.join(' AND ')}
     ORDER BY created_at DESC`,
    params
  );

  return products;
}

async function createProduct(product) {
  const [duplicateRows] = await pool.execute(
    `SELECT id FROM product_master WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 LIMIT 1`,
    [product.name]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Product name already exists.');
    err.statusCode = 400;
    throw err;
  }

  const productId = await getNextProductId();
  const [result] = await pool.execute(
    `INSERT INTO product_master (product_id, name, category, description)
     VALUES (?, ?, ?, ?)`,
    [productId, product.name, product.category || '', product.description || '']
  );

  return {
    id: result.insertId,
    product_id: productId,
    message: 'Product added successfully.'
  };
}

async function updateProduct(id, product) {
  const [existingRows] = await pool.execute(
    `SELECT id FROM product_master WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (existingRows.length === 0) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  const [duplicateRows] = await pool.execute(
    `SELECT id FROM product_master WHERE LOWER(name) = LOWER(?) AND id <> ? AND is_deleted = 0 LIMIT 1`,
    [product.name, id]
  );

  if (duplicateRows.length > 0) {
    const err = new Error('Product name already exists.');
    err.statusCode = 400;
    throw err;
  }

  await pool.execute(
    `UPDATE product_master
     SET name = ?, category = ?, description = ?
     WHERE id = ? AND is_deleted = 0`,
    [product.name, product.category || '', product.description || '', id]
  );

  return { message: 'Product updated successfully.' };
}

async function deleteProduct(id) {
  const [result] = await pool.execute(
    `UPDATE product_master SET is_deleted = 1 WHERE id = ? AND is_deleted = 0`,
    [id]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }

  return { message: 'Product deleted successfully.' };
}

async function getNextProductId() {
  const [rows] = await pool.execute(
    `SELECT product_id FROM product_master ORDER BY id DESC LIMIT 1`
  );

  if (rows.length === 0) {
    return 'PRD001';
  }

  const match = String(rows[0].product_id || '').match(/^PRD(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `PRD${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  getActiveProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
