const enquiryService = require('../services/enquiry.service');
const departmentService = require('../services/department.service');
const leadCategoryService = require('../services/lead-category.service');

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
    await validatePayload(payload);

    // helpful logs for debugging multipart mapping issues
    console.log('[createEnquiry] req.body keys:', Object.keys(req.body || {}));
    console.log('[createEnquiry] req.files:', req.files);

    res.status(201).json(await enquiryService.createEnquiry(payload, req.files));
  } catch (error) {
    console.error('[createEnquiry] error:', error);
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

    if (!category || !(await leadCategoryService.existsByName(category))) {
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

async function updateVisitingCard2(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Visiting card 2 image is required.' });
    }

    res.json(await enquiryService.updateVisitingCard2(req.params.id, req.file));
  } catch (error) {
    next(error);
  }
}

async function removeVisitingCard2(req, res, next) {
  try {
    res.json(await enquiryService.removeVisitingCard2(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function updateVoiceNote(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Voice note file is required.' });
    }

    res.json(await enquiryService.updateVoiceNote(req.params.id, req.file));
  } catch (error) {
    next(error);
  }
}

async function removeVoiceNote(req, res, next) {
  try {
    res.json(await enquiryService.removeVoiceNote(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function updateVoiceNote2(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Voice note 2 file is required.' });
    }

    res.json(await enquiryService.updateVoiceNote2(req.params.id, req.file));
  } catch (error) {
    next(error);
  }
}

async function removeVoiceNote2(req, res, next) {
  try {
    res.json(await enquiryService.removeVoiceNote2(req.params.id));
  } catch (error) {
    next(error);
  }
}

async function updateEnquiry(req, res, next) {
  try {
    const interests = parseInterests(req.body.interests);
    const enquiry = { ...req.body, interests };

    if (!interests.length) {
      return res.status(400).json({ message: 'At least one product interest is required.' });
    }

    await validatePayload({
      fullName: enquiry.full_name || enquiry.fullName,
      email: enquiry.email,
      mobile: enquiry.mobile,
      interests,
      department: enquiry.department,
      leadCategory: enquiry.lead_category || enquiry.leadCategory
    });

    res.json(await enquiryService.updateEnquiry(req.params.id, enquiry));
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
    alternateMobile: emptyToNull(body.alternateMobile ?? body.alternate_mobile),
    officeNumber: emptyToNull(body.officeNumber ?? body.office_number),
    department: emptyToNull(body.department),
    interests: parseInterests(body.interests),
    referred_by: emptyToNull(body.referred_by ?? body.referredBy),
    remarks: emptyToNull(body.remarks),
    details: emptyToNull(body.details),
    leadCategory: emptyToNull(body.leadCategory),
    venueId: emptyToNull(body.venueId ?? body.venue_id)
  };
}

async function validatePayload(payload) {
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

if (payload.department) {

  const normalizedDepartment = payload.department
    ?.toString()
    .trim()
    .toLowerCase();

  const exists = await departmentService.existsByName(normalizedDepartment);

  if (!exists) {
    throw new Error('Invalid department.');
  }

}

  if (payload.leadCategory && !(await leadCategoryService.existsByName(payload.leadCategory))) {
    throw new Error('Invalid lead category.');
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
  updateVisitingCard2,
  removeVisitingCard2,
  updateVoiceNote,
  removeVoiceNote,
  updateVoiceNote2,
  removeVoiceNote2,
  updateEnquiry,
  deleteEnquiry
};
