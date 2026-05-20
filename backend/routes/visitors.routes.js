const express = require('express');
const visitorsController = require('../controllers/visitors.controller');

const router = express.Router();

router.get('/', visitorsController.getVisitingCards);
router.get('/:id', visitorsController.getVisitingCardById);
router.delete('/:id', visitorsController.deleteVisitingCard);

module.exports = router;
