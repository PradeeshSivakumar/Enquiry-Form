const employeeService = require('../services/employee.service');

async function getEmployees(_req, res, next) {
  try {
    res.json(await employeeService.getEmployees());
  } catch (error) {
    next(error);
  }
}

async function createEmployee(req, res, next) {
  try {
    res.status(201).json(await employeeService.createEmployee(req.body));
  } catch (error) {
    next(error);
  }
}

async function updateEmployee(req, res, next) {
  try {
    res.json(await employeeService.updateEmployee(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    res.json(await employeeService.deleteEmployee(req.params.id));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
