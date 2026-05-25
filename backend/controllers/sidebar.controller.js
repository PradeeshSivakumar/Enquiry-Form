const sidebarService = require('../services/sidebar.service');

async function getSidebar(_req, res, next) {
  try {
    const navigation = await sidebarService.getSidebarNavigation();
    res.json(navigation);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSidebar
};
