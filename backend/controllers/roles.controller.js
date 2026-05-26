const rolesService = require('../services/roles.service');

async function getRoles(req, res, next) {
  try {
    const search = req.query.search || '';
    res.json(await rolesService.getRoles({ search }));
  } catch (error) {
    next(error);
  }
}

async function getActiveRoles(_req, res, next) {
  try {
    res.json(await rolesService.getActiveRoles());
  } catch (error) {
    next(error);
  }
}

async function createRole(req, res, next) {
  try {
    res.status(201).json(await rolesService.createRole(req.body));
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    res.json(await rolesService.updateRole(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

async function deleteRole(req, res, next) {
  try {
    res.json(await rolesService.deleteRole(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function toggleRoleStatus(req, res, next) {
  try {
    res.json(await rolesService.toggleRoleStatus(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function getRolePermissions(req, res, next) {
  try {
    const roleId = req.params.id;
    // We can also accept role name directly via query param if needed
    // But usually ID is better. If we need to fetch by name for the logged-in user:
    if (isNaN(roleId)) {
       // Search by role name for auth context
       const roles = await rolesService.getRoles({ search: roleId });
       const matchedRole = roles.find(r => r.name.toLowerCase() === roleId.toLowerCase());
       if (!matchedRole) {
         return res.status(404).json({ message: 'Role not found' });
       }
       res.json(await rolesService.getRolePermissions(matchedRole.id));
       return;
    }
    
    res.json(await rolesService.getRolePermissions(roleId));
  } catch (error) {
    next(error);
  }
}

async function saveRolePermissions(req, res, next) {
  try {
    res.json(await rolesService.saveRolePermissions(req.params.id, req.body.permissions));
  } catch (error) {
    next(error);
  }
}

async function getModules(_req, res, next) {
  try {
    res.json(await rolesService.getModules());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoles,
  getActiveRoles,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  getRolePermissions,
  saveRolePermissions,
  getModules
};
