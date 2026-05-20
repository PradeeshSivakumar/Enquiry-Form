const productsService = require('../services/products.service');

async function getActiveProducts(_req, res, next) {
  try {
    res.json(await productsService.getActiveProducts());
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    res.json(await productsService.getProducts({ search }));
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(product);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    res.status(201).json(await productsService.createProduct(product));
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(product);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    res.json(await productsService.updateProduct(req.params.id, product));
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    res.json(await productsService.deleteProduct(req.params.id));
  } catch (error) {
    next(error);
  }
}

function normalizeProductPayload(body) {
  return {
    name: String(body.name || '').trim(),
    category: emptyToNull(body.category),
    description: emptyToNull(body.description)
  };
}

function validateProductPayload(product) {
  if (!product.name) {
    return 'Product name is required.';
  }

  if (product.name.length > 150) {
    return 'Product name cannot exceed 150 characters.';
  }

  if (product.category && product.category.length > 100) {
    return 'Category cannot exceed 100 characters.';
  }

  if (product.description && product.description.length > 500) {
    return 'Description cannot exceed 500 characters.';
  }

  return null;
}

function emptyToNull(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

module.exports = {
  getActiveProducts,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
