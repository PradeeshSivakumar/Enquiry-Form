const campaignsService = require('../services/campaigns.service');

async function getCampaignDashboard(req, res, next) {
  try {
    const dashboard = await campaignsService.getCampaignDashboard();
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

async function getCampaigns(req, res, next) {
  try {
    const search = String(req.query.search || '').trim();
    const limit = Number(req.query.limit || 10);
    const offset = Number(req.query.offset || 0);
    const sortKey = String(req.query.sortKey || 'created_at');
    const sortDirection = String(req.query.sortDirection || 'DESC');

    const result = await campaignsService.getCampaigns(search, limit, offset, sortKey, sortDirection);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getCampaignById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid campaign ID.' });
    }
    const campaign = await campaignsService.getCampaignById(id);
    res.json(campaign);
  } catch (error) {
    next(error);
  }
}

async function getTemplates(req, res, next) {
  try {
    const templates = await campaignsService.getTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
}

async function createTemplate(req, res, next) {
  try {
    const { name, subject, body } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Template subject is required.' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Template body content is required.' });
    }

    const template = await campaignsService.createTemplate({ name, subject, body });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid template ID.' });
    }
    const { name, subject, body } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Template subject is required.' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Template body content is required.' });
    }

    const template = await campaignsService.updateTemplate(id, { name, subject, body });
    res.json(template);
  } catch (error) {
    next(error);
  }
}

async function deleteTemplate(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid template ID.' });
    }
    const result = await campaignsService.deleteTemplate(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function sendCampaign(req, res, next) {
  try {
    const { name, subject, body, templateId, visitorIds } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Campaign name is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Campaign subject is required.' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Campaign body content is required.' });
    }
    if (!visitorIds || !Array.isArray(visitorIds) || visitorIds.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required.' });
    }

    const result = await campaignsService.sendCampaign({
      name,
      subject,
      body,
      templateId: templateId ? Number(templateId) : null,
      visitorIds: visitorIds.map(Number)
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getVisitorRecipientHistory(req, res, next) {
  try {
    const visitorId = Number(req.params.visitorId);
    if (isNaN(visitorId)) {
      return res.status(400).json({ message: 'Invalid visitor ID.' });
    }
    const history = await campaignsService.getVisitorRecipientHistory(visitorId);
    res.json(history);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCampaignDashboard,
  getCampaigns,
  getCampaignById,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendCampaign,
  getVisitorRecipientHistory
};
