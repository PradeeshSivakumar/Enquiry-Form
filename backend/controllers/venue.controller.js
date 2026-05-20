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
    const { venue, booth_number, venue_date } = req.body;

    const validationError = validateVenue(venue);
    if (validationError) return res.status(400).json({ message: validationError });
    const detailValidationError = validateVenueDetails(booth_number, venue_date);
    if (detailValidationError) return res.status(400).json({ message: detailValidationError });

    res.status(201).json(await venueService.createVenue({ venue, booth_number, venue_date }));
  } catch (error) {
    next(error);
  }
}

async function updateVenue(req, res, next) {
  try {
    const { venue, booth_number, venue_date } = req.body;

    const validationError = validateVenue(venue);
    if (validationError) return res.status(400).json({ message: validationError });
    const detailValidationError = validateVenueDetails(booth_number, venue_date);
    if (detailValidationError) return res.status(400).json({ message: detailValidationError });

    res.json(await venueService.updateVenue(req.params.id, { venue, booth_number, venue_date }));
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

function validateVenue(venue) {
  const text = String(venue || '').trim();
  if (!text) return 'Venue is required.';

  const parts = text.split('-');
  if (parts.length !== 3) return 'Venue must include venue, city, and year.';

  const [venuePart, cityPart, yearPart] = parts.map(part => part.trim());
  if (!venuePart || !cityPart || !yearPart) return 'Venue, city, and year are required.';
  if (!/^[a-zA-Z0-9\s&().,]+$/.test(venuePart)) return 'Venue contains invalid characters.';
  if (!/^[a-zA-Z\s.]+$/.test(cityPart)) return 'City contains invalid characters.';
  if (!/^[0-9]{4}$/.test(yearPart)) return 'Year must be a 4-digit number.';

  const year = Number(yearPart);
  if (year < 1900 || year > 2099) return 'Year must be between 1900 and 2099.';

  return null;
}

function validateVenueDetails(boothNumber, venueDate) {
  const booth = String(boothNumber || '').trim();
  const date = String(venueDate || '').trim();

  if (!booth) return 'Booth number is required.';
  if (!/^[a-zA-Z0-9\s./-]+$/.test(booth)) return 'Booth number contains invalid characters.';
  if (!date) return 'Date is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Date must be in YYYY-MM-DD format.';

  if (!isValidIsoDate(date)) return 'Date is invalid.';

  return null;
}

function isValidIsoDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;
}

module.exports = {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue
};
