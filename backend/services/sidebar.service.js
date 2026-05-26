const { pool } = require('../config/db');

async function getSidebarNavigation() {
  // Query all active sections sorted by sort_order
  const [sections] = await pool.execute(
    'SELECT id, name, sort_order FROM sidebar_sections WHERE is_active = 1 ORDER BY sort_order ASC'
  );

  // Query all active items sorted by sort_order
  const [items] = await pool.execute(
    'SELECT id, section_id, name, route, icon, sort_order FROM sidebar_items WHERE is_active = 1 ORDER BY sort_order ASC'
  );

  return mapSectionsAndItems(sections, items);
}

async function getSidebarNavigationForRole(roleName) {
  if (!roleName) return [];

  // Admin sees everything
  if (roleName.toLowerCase() === 'admin') {
    return getSidebarNavigation();
  }

  // Get role permissions
  const [roles] = await pool.execute(`SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND is_deleted = 0 AND is_active = 1 LIMIT 1`, [roleName]);
  if (roles.length === 0) {
    return []; // No active role found
  }

  const roleId = roles[0].id;

  const [sections] = await pool.execute(
    'SELECT id, name, sort_order FROM sidebar_sections WHERE is_active = 1 ORDER BY sort_order ASC'
  );

  // Join sidebar_items with role_permissions directly on page name
  const [items] = await pool.execute(`
    SELECT si.id, si.section_id, si.name, si.route, si.icon, si.sort_order
    FROM sidebar_items si
    INNER JOIN role_permissions rp ON si.name = rp.module_name
    WHERE si.is_active = 1 AND rp.role_id = ? AND rp.can_view = 1
    ORDER BY si.sort_order ASC
  `, [roleId]);

  return mapSectionsAndItems(sections, items).filter(section => section.items.length > 0);
}

function mapSectionsAndItems(sections, items) {
  return sections.map(section => {
    return {
      id: section.id,
      name: section.name,
      sort_order: section.sort_order,
      items: items
        .filter(item => item.section_id === section.id)
        .map(item => ({
          id: item.id,
          name: item.name,
          route: item.route,
          icon: item.icon,
          sort_order: item.sort_order
        }))
    };
  });
}

module.exports = {
  getSidebarNavigation,
  getSidebarNavigationForRole
};
