const enquiryService = require('../services/enquiry.service');
const { LEAD_CATEGORIES } = require('../utils/constants');

async function uploadVisitingCard(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Visiting card image is required.' });
    }

    res.json(await enquiryService.uploadVisitingCard(req.file));
  } catch (error) {
    next(error);
  }
}

async function createEnquiry(req, res) {
  try {
    const payload = normalizePayload(req.body);
    validatePayload(payload);

    res.status(201).json(await enquiryService.createEnquiry(payload, req.files));
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
}

async function getEnquiries(_req, res, next) {
  try {
    res.json(await enquiryService.getEnquiries());
  } catch (error) {
    next(error);
  }
}

async function updateLeadCategory(req, res, next) {
  try {
    const { category } = req.body;

    if (!LEAD_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid lead category.' });
    }

    res.json(await enquiryService.updateLeadCategory(req.params.id, category));
  } catch (error) {
    next(error);
  }
}

async function updateVisitingCard(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Visiting card image is required.' });
    }

    res.json(await enquiryService.updateVisitingCard(req.params.id, req.file));
  } catch (error) {
    next(error);
  }
}

async function removeVisitingCard(req, res, next) {
  try {
    res.json(await enquiryService.removeVisitingCard(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function updateEnquiry(req, res, next) {
  try {
    const interests = parseInterests(req.body.interests);

    if (!interests.length) {
      return res.status(400).json({ message: 'At least one product interest is required.' });
    }

    res.json(await enquiryService.updateEnquiry(req.params.id, {
      ...req.body,
      interests
    }));
  } catch (error) {
    next(error);
  }
}

async function deleteEnquiry(req, res, next) {
  try {
    res.json(await enquiryService.deleteEnquiry(req.params.id));
  } catch (error) {
    next(error);
  }
}

function normalizePayload(body) {
  return {
    title: emptyToNull(body.title),
    fullName: String(body.fullName || '').trim(),
    companyName: emptyToNull(body.companyName),
    jobTitle: emptyToNull(body.jobTitle),
    email: String(body.email || '').trim(),
    mobile: String(body.mobile || '').trim(),
    officeNumber: emptyToNull(body.officeNumber ?? body.office_number),
    department: emptyToNull(body.department),
    interests: parseInterests(body.interests),
    remarks: emptyToNull(body.remarks),
    leadCategory: emptyToNull(body.leadCategory),
    venueId: emptyToNull(body.venueId ?? body.venue_id)
  };
}

function validatePayload(payload) {
  if (!payload.fullName) {
    throw new Error('Full name is required.');
  }
  if (!payload.email) {
    throw new Error('Email is required.');
  }
  if (!payload.mobile) {
    throw new Error('Mobile is required.');
  }
  if (!payload.interests.length) {
    throw new Error('At least one product interest is required.');
  }
}

function emptyToNull(value) {
  const text = String(value || '').trim();
  return text.length ? text : null;
}

function parseInterests(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = {
  uploadVisitingCard,
  createEnquiry,
  getEnquiries,
  updateLeadCategory,
  updateVisitingCard,
  removeVisitingCard,
  updateEnquiry,
  deleteEnquiry
};
