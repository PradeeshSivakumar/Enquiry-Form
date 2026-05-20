const ROLES = Object.freeze({
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  SALES_MANAGER: 'Sales Manager',
  EMPLOYEE: 'Employee',
  VIEWER: 'Viewer'
});

const PRODUCT_MASTER_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.SALES_MANAGER
];

const LEAD_CATEGORIES = ['Potential', 'Non Potential', 'Others'];

module.exports = {
  ROLES,
  PRODUCT_MASTER_ROLES,
  LEAD_CATEGORIES
};
