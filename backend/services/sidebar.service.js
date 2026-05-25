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

  // Map items to their respective sections
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
  getSidebarNavigation
};
