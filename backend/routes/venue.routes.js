const express = require('express');
const venueController = require('../controllers/venue.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', venueController.getVenues);
router.post('/', authenticateToken, venueController.createVenue);
router.put('/:id', authenticateToken, venueController.updateVenue);
router.delete('/:id', authenticateToken, venueController.deleteVenue);

module.exports = router;
