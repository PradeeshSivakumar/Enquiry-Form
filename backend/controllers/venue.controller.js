const venueService = require('../services/venue.service');

async function getVenues(_req, res, next) {
  try {
    res.json(await venueService.getVenues());
  } catch (error) {
    next(error);
  }
}

async function createVenue(req, res, next) {
  try {
    const { venue } = req.body;

    if (!venue) {
      return res.status(400).json({ message: 'Venue is required.' });
    }

    res.status(201).json(await venueService.createVenue(venue));
  } catch (error) {
    next(error);
  }
}

async function updateVenue(req, res, next) {
  try {
    const { venue } = req.body;

    if (!venue) {
      return res.status(400).json({ message: 'Venue is required.' });
    }

    res.json(await venueService.updateVenue(req.params.id, venue));
  } catch (error) {
    next(error);
  }
}

async function deleteVenue(req, res, next) {
  try {
    res.json(await venueService.deleteVenue(req.params.id));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue
};
