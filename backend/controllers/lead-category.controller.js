const leadCategoryService = require('../services/lead-category.service');

async function getActiveLeadCategories(_req, res, next) {
  try {
    res.json(await leadCategoryService.getActiveLeadCategories());
  } catch (error) {
    next(error);
  }
}

async function getLeadCategories(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    res.json(await leadCategoryService.getLeadCategories({ search }));
  } catch (error) {
    next(error);
  }
}

async function createLeadCategory(req, res, next) {
  try {
    console.log('POST /api/lead-categories - Received request body:', req.body);
    const leadCategory = normalizeLeadCategoryPayload(req.body);
    const validationError = validateLeadCategoryPayload(leadCategory);

    if (validationError) {
      console.log('POST /api/lead-categories - Validation error:', validationError);
      return res.status(400).json({ message: validationError });
    }

    const result = await leadCategoryService.createLeadCategory(leadCategory);
    console.log('POST /api/lead-categories - Success:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('POST /api/lead-categories - Error:', error);
    next(error);
  }
}

async function updateLeadCategory(req, res, next) {
  try {
    const leadCategory = normalizeLeadCategoryPayload(req.body);
    const validationError = validateLeadCategoryPayload(leadCategory);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    res.json(await leadCategoryService.updateLeadCategory(req.params.id, leadCategory));
  } catch (error) {
    next(error);
  }
}

async function deleteLeadCategory(req, res, next) {
  try {
    res.json(await leadCategoryService.deleteLeadCategory(req.params.id));
  } catch (error) {
    next(error);
  }
}

function normalizeLeadCategoryPayload(body) {
  return {
    name: String(body.name || '').trim(),
    description: emptyToNull(body.description)
  };
}

function validateLeadCategoryPayload(category) {
  if (!category.name) {
    return 'Lead category name is required.';
  }

  if (category.name.length > 150) {
    return 'Lead category name cannot exceed 150 characters.';
  }

  if (category.description && category.description.length > 500) {
    return 'Lead category description cannot exceed 500 characters.';
  }

  return null;
}

function emptyToNull(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

module.exports = {
  getActiveLeadCategories,
  getLeadCategories,
  createLeadCategory,
  updateLeadCategory,
  deleteLeadCategory
};
