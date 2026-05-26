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
    { name: 'visitingCard2', maxCount: 1 },
    { name: 'voiceNote', maxCount: 1 },
    { name: 'voiceNote2', maxCount: 1 }
  ]),
  enquiryController.createEnquiry
);
router.get('/', authenticateToken, enquiryController.getEnquiries);
router.get('/filtered', authenticateToken, enquiryController.getFilteredEnquiries);
router.put('/:id/category', authenticateToken, enquiryController.updateLeadCategory);
router.put('/:id/visiting-card', authenticateToken, upload.single('visitingCard'), enquiryController.updateVisitingCard);
router.delete('/:id/visiting-card', authenticateToken, enquiryController.removeVisitingCard);
router.put('/:id/visiting-card-2', authenticateToken, upload.single('visitingCard2'), enquiryController.updateVisitingCard2);
router.delete('/:id/visiting-card-2', authenticateToken, enquiryController.removeVisitingCard2);
router.put('/:id/voice-note', authenticateToken, upload.single('voiceNote'), enquiryController.updateVoiceNote);
router.delete('/:id/voice-note', authenticateToken, enquiryController.removeVoiceNote);
router.put('/:id/voice-note-2', authenticateToken, upload.single('voiceNote2'), enquiryController.updateVoiceNote2);
router.delete('/:id/voice-note-2', authenticateToken, enquiryController.removeVoiceNote2);
router.put('/:id', authenticateToken, enquiryController.updateEnquiry);
router.delete('/:id', authenticateToken, enquiryController.deleteEnquiry);

module.exports = router;
