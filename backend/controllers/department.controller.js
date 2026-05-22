const departmentService = require('../services/department.service');

async function getActiveDepartments(_req, res, next) {
  try {
    res.json(await departmentService.getActiveDepartments());
  } catch (error) {
    next(error);
  }
}

async function getDepartments(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    res.json(await departmentService.getDepartments({ search }));
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    console.log('POST /api/departments - Received request body:', req.body);
    const department = normalizeDepartmentPayload(req.body);
    const validationError = validateDepartmentPayload(department);

    if (validationError) {
      console.log('POST /api/departments - Validation error:', validationError);
      return res.status(400).json({ message: validationError });
    }

    const result = await departmentService.createDepartment(department);
    console.log('POST /api/departments - Success:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('POST /api/departments - Error:', error);
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const department = normalizeDepartmentPayload(req.body);
    const validationError = validateDepartmentPayload(department);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    res.json(await departmentService.updateDepartment(req.params.id, department));
  } catch (error) {
    next(error);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    res.json(await departmentService.deleteDepartment(req.params.id));
  } catch (error) {
    next(error);
  }
}

function normalizeDepartmentPayload(body) {
  return {
    name: String(body.name || '').trim(),
    description: emptyToNull(body.description)
  };
}

function validateDepartmentPayload(department) {
  if (!department.name) {
    return 'Department name is required.';
  }

  if (department.name.length > 150) {
    return 'Department name cannot exceed 150 characters.';
  }

  if (department.description && department.description.length > 500) {
    return 'Department description cannot exceed 500 characters.';
  }

  return null;
}

function emptyToNull(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

module.exports = {
  getActiveDepartments,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
