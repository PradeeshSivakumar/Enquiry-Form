-- Migration: Restructure Roles, Permissions, Modules, and Sidebar Items
-- Date: 2026-05-26

-- 1. Drop dependent tables to avoid FK constraint violations
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS sidebar_items;
DROP TABLE IF EXISTS sidebar_sections;

-- 2. Recreate Sidebar Sections
CREATE TABLE sidebar_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Recreate Sidebar Items containing the module_key column directly
CREATE TABLE sidebar_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  route VARCHAR(255) NOT NULL,
  icon TEXT NOT NULL,
  module_key VARCHAR(60) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sidebar_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Recreate Roles table
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Recreate Role Permissions using module_name (VARCHAR) directly instead of module_id
CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  module_name VARCHAR(100) NOT NULL,
  can_view TINYINT(1) NOT NULL DEFAULT 0,
  can_add TINYINT(1) NOT NULL DEFAULT 0,
  can_edit TINYINT(1) NOT NULL DEFAULT 0,
  can_delete TINYINT(1) NOT NULL DEFAULT 0,
  can_export TINYINT(1) NOT NULL DEFAULT 0,
  can_view_details TINYINT(1) NOT NULL DEFAULT 0,
  can_manage_permissions TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_role_module (role_id, module_name),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Seed Sidebar Sections
INSERT INTO sidebar_sections (id, name, sort_order, is_active) VALUES
(1, 'Dashboard', 1, 1),
(2, 'Services', 2, 1),
(3, 'Master', 3, 1);

-- 7. Seed Sidebar Items (with actual page names and module keys)
INSERT INTO sidebar_items (id, section_id, name, route, icon, module_key, sort_order, is_active) VALUES
(1, 1, 'Dashboard', '/dashboard', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19V5m0 14h16M8 16V9m4 7V6m4 10v-4" /></svg>', 'dashboard', 1, 1),
(2, 2, 'Visitors Directory', '/visitors-directory', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>', 'visitors_directory', 1, 1),
(3, 2, 'Email Campaigns', '/email-campaigns', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>', 'email_campaigns', 2, 1),
(4, 3, 'Employee Master', '/employee', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>', 'employees', 1, 1),
(5, 3, 'Department Master', '/departments', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h8m-8 6h16" /></svg>', 'departments', 2, 1),
(6, 3, 'Product Master', '/products', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" /><path stroke-linecap="round" stroke-linejoin="round" d="M3.29 7L12 12l8.71-5M12 22V12" /></svg>', 'products', 3, 1),
(7, 3, 'Venue Master', '/venue', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>', 'venues', 4, 1),
(8, 3, 'Lead Category Master', '/lead-categories', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>', 'lead_categories', 5, 1),
(9, 3, 'Role Master', '/roles', '<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 2C7.03 4.17 4 7.97 4 12.5c0 4.97 4.03 9.19 8 9.5 3.97-.31 8-4.53 8-9.5 0-4.53-3.03-8.33-8-10.5z" /></svg>', 'roles', 6, 1);

-- 8. Seed Default Roles
INSERT INTO roles (id, role_id, name, description, is_active, is_deleted) VALUES
(1, 'ROL001', 'Admin', 'System Administrator with full access', 1, 0),
(2, 'ROL002', 'Manager', 'Manager with access to most modules', 1, 0),
(3, 'ROL003', 'Employee', 'Regular employee access', 1, 0),
(4, 'ROL004', 'HR', 'Human Resources management', 1, 0),
(5, 'ROL005', 'Sales', 'Sales and lead management', 1, 0),
(6, 'ROL006', 'Visitor Manager', 'Manages visitors and venues', 1, 0);

-- 9. Auto-grant all capabilities to Admin (role_id = 1) based on page names
INSERT INTO role_permissions (role_id, module_name, can_view, can_add, can_edit, can_delete, can_export, can_view_details, can_manage_permissions)
SELECT 1, name, 1, 1, 1, 1, 1, 1, 1 FROM sidebar_items;
