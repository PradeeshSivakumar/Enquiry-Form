-- Migration: Add custom permission columns for view details and manage permissions
ALTER TABLE role_permissions 
ADD COLUMN can_view_details TINYINT(1) NOT NULL DEFAULT 0,
ADD COLUMN can_manage_permissions TINYINT(1) NOT NULL DEFAULT 0;

-- Auto-grant all special capabilities to the Admin role (roleid_diff = 1)
UPDATE role_permissions 
SET can_view_details = 1, can_manage_permissions = 1 
WHERE roleid_diff = 1;
