# Visiting Card Management

This directory stores assets related to visiting card management for the NiralTek Enquiry Form application.

## Overview

The visiting card management system includes:

### Database Structure

1. **visiting_cards table** - Stores metadata and tracking information about uploaded visiting cards
   - `id` - Unique identifier
   - `filename` - Original filename with timestamp
   - `url` - URL path to the uploaded file
   - `file_size` - Size of the file in bytes
   - `mime_type` - MIME type (image/jpeg, image/png, etc.)
   - `uploaded_by` - User ID (optional, for multi-user tracking)
   - `uploaded_at` - Timestamp of upload
   - `is_active` - Boolean flag for soft deletes

2. **enquiries table** - Enhanced with visiting card relationship
   - `visiting_card_id` - Foreign key to visiting_cards table
   - `visiting_card_url` - URL for backward compatibility

### File Structure

```
uploads/
├── visiting-cards/     # Actual uploaded visiting card files
└── [timestamp]-[name]  # Named files with timestamp prefix

src/assets/
└── visiting-card/      # Asset storage for templates or defaults
```

### API Endpoints

#### Upload Visiting Card
```
POST /api/enquiries/visiting-card
- Accepts multipart form data with 'visitingCard' file
- Returns: { id, url, filename, uploadedAt }
```

#### List All Visiting Cards
```
GET /api/visiting-cards
- Returns array of active visiting cards
- Includes: id, filename, url, file_size, mime_type, uploaded_at
```

#### Get Specific Visiting Card
```
GET /api/visiting-cards/:id
- Returns single visiting card metadata
```

#### Delete Visiting Card
```
DELETE /api/visiting-cards/:id
- Soft delete (marks as_active = false)
- Removes file from filesystem
```

#### Submit Enquiry with Visiting Card
```
POST /api/enquiries
- Multipart form with enquiry data and optional visitingCard file
- Automatically creates visiting_cards entry and links to enquiry
```

## File Constraints

- **Maximum File Size**: 5MB
- **Allowed Types**: Image files only (JPEG, PNG, GIF, WebP, etc.)
- **File Format**: `[timestamp]-[sanitized-name].[extension]`

## Database Migrations

Run the updated schema to create the visiting_cards table:
```sql
-- See database/schema.sql for full schema
```

## Usage Examples

### Angular Service
```typescript
// Upload visiting card
this.enquiryService.uploadVisitingCard(file).subscribe(
  response => console.log('Uploaded:', response.url)
);

// Submit enquiry with visiting card
this.enquiryService.submitEnquiry(formData).subscribe(
  response => console.log('Enquiry saved:', response.payload)
);
```

### Retrieving Visiting Cards
```typescript
// Get all visiting cards
this.http.get('/api/visiting-cards').subscribe(cards => {
  console.log('Available cards:', cards);
});
```

## Soft Delete Strategy

Visiting cards are soft-deleted (marked as inactive) rather than permanently deleted to:
- Preserve historical enquiry data integrity
- Allow for recovery if needed
- Maintain referential integrity with enquiries

## Notes

- Uploaded files are stored in `uploads/visiting-cards/`
- Database records are indexed on `uploaded_at` for efficient queries
- Email is indexed for quick enquiry lookups
- Consider implementing cleanup jobs for old inactive records
