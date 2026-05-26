const express = require('express');
const campaignsController = require('../controllers/campaigns.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

// All campaign routes are protected by auth token
router.get('/dashboard', authenticateToken, campaignsController.getCampaignDashboard);
router.get('/', authenticateToken, campaignsController.getCampaigns);
router.get('/templates', authenticateToken, campaignsController.getTemplates);
router.get('/:id', authenticateToken, campaignsController.getCampaignById);
router.post('/templates', authenticateToken, campaignsController.createTemplate);
router.put('/templates/:id', authenticateToken, campaignsController.updateTemplate);
router.delete('/templates/:id', authenticateToken, campaignsController.deleteTemplate);
router.post('/send', authenticateToken, campaignsController.sendCampaign);
router.get('/visitor-history/:visitorId', authenticateToken, campaignsController.getVisitorRecipientHistory);

module.exports = router;
