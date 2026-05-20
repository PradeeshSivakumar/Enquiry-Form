const express = require('express');
const enquiryController = require('../controllers/enquiry.controller');
const authenticateToken = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/visiting-card', upload.single('visitingCard'), enquiryController.uploadVisitingCard);
router.post(
  '/',
  upload.fields([
    { name: 'visitingCard', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 }
  ]),
  enquiryController.createEnquiry
);
router.get('/', authenticateToken, enquiryController.getEnquiries);
router.put('/:id/category', authenticateToken, enquiryController.updateLeadCategory);
router.put('/:id/visiting-card', authenticateToken, upload.single('visitingCard'), enquiryController.updateVisitingCard);
router.delete('/:id/visiting-card', authenticateToken, enquiryController.removeVisitingCard);
router.put('/:id', authenticateToken, enquiryController.updateEnquiry);
router.delete('/:id', authenticateToken, enquiryController.deleteEnquiry);

module.exports = router;
