const sidebarService = require('../services/sidebar.service');

async function getSidebar(req, res, next) {
  try {
    const role = req.user?.role;
    let navigation;
    if (role) {
      navigation = await sidebarService.getSidebarNavigationForRole(role);
    } else {
      navigation = await sidebarService.getSidebarNavigation();
    }
    res.json(navigation);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSidebar
};
