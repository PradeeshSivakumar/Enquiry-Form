const dashboardService = require('../services/dashboard.service');

async function getStats(_req, res, next) {
  try {
    res.json(await dashboardService.getStats());
  } catch (error) {
    next(error);
  }
}

async function getRecentEnquiries(_req, res, next) {
  try {
    res.json(await dashboardService.getRecentEnquiries());
  } catch (error) {
    next(error);
  }
}

async function getMonthlyTrends(_req, res, next) {
  try {
    res.json(await dashboardService.getMonthlyTrends());
  } catch (error) {
    next(error);
  }
}

async function getProductDistribution(_req, res, next) {
  try {
    res.json(await dashboardService.getProductDistribution());
  } catch (error) {
    next(error);
  }
}

async function getVenueAnalytics(_req, res, next) {
  try {
    res.json(await dashboardService.getVenueAnalytics());
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
  getRecentEnquiries,
  getMonthlyTrends,
  getProductDistribution,
  getVenueAnalytics
};
