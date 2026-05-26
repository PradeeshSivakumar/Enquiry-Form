-- Migration: rename role_id to roleid_diff in role_permissions
START TRANSACTION;

-- Drop existing foreign key (name may vary). Using the known default name
-- role_permissions_ibfk_1; adjust if your DB uses a different constraint name.
ALTER TABLE role_permissions DROP FOREIGN KEY role_permissions_ibfk_1;

-- Rename column and convert to INT to match `roles.id`.
ALTER TABLE role_permissions CHANGE COLUMN role_id roleid_diff INT NOT NULL;

-- Recreate unique index on the new column (drop old index first if present)
ALTER TABLE role_permissions DROP INDEX uq_role_module;
ALTER TABLE role_permissions ADD UNIQUE KEY uq_role_module (roleid_diff, module_id);

-- Add proper foreign key constraint referencing roles(id)
ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (roleid_diff) REFERENCES roles(id) ON DELETE CASCADE;

COMMIT;

-- NOTE: If `DROP FOREIGN KEY IF EXISTS` or `DROP INDEX IF EXISTS` is not
-- supported by your MySQL version, you may need to DROP by explicit name or
-- check information_schema for the exact constraint name before running.
