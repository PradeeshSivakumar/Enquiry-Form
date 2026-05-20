const visitorsService = require('../services/visitors.service');

async function getVisitingCards(_req, res, next) {
  try {
    res.json(await visitorsService.getVisitingCards());
  } catch (error) {
    next(error);
  }
}

async function getVisitingCardById(req, res, next) {
  try {
    res.json(await visitorsService.getVisitingCardById(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function deleteVisitingCard(req, res, next) {
  try {
    res.json(await visitorsService.deleteVisitingCard(req.params.id));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVisitingCards,
  getVisitingCardById,
  deleteVisitingCard
};
