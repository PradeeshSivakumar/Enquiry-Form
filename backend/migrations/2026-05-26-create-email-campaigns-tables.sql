-- Migration: Create Email Campaigns tables, templates, sidebar items, and role permissions

CREATE TABLE IF NOT EXISTS campaign_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  template_id INT NULL,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  open_count INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES campaign_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  visitor_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Sent',
  opened_at TIMESTAMP NULL DEFAULT NULL,
  error_message VARCHAR(255) NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES enquiries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed email templates
INSERT INTO campaign_templates (id, name, subject, body) VALUES
(1, 'Product Introduction', 'Introducing our latest enterprise solutions for {{company}}', '<p>Dear {{name}},</p><p>We are delighted to share with you our new suite of business solutions tailored specifically for companies in your sector. Based on your department ({{department}}), we believe these tools will help streamline your daily operations.</p><p>Best regards,<br>The Enterprise Team</p>'),
(2, 'Follow-up', 'Following up on our recent conversation', '<p>Dear {{name}},</p><p>It was a pleasure speaking with you recently about {{company}}. I wanted to follow up and see if you have any questions or require further assistance from our {{department}} division.</p><p>Best regards,<br>The Enterprise Team</p>'),
(3, 'Meeting Request', 'Meeting Request: Let''s discuss collaboration', '<p>Dear {{name}},</p><p>I hope this email finds you well. I would like to schedule a brief 15-minute call to discuss how we can collaborate and create value for {{company}}.</p><p>Looking forward to hearing from you soon.</p><p>Best regards,<br>The Enterprise Team</p>'),
(4, 'Thank You', 'Thank you for connecting with us', '<p>Dear {{name}},</p><p>Thank you for taking the time to connect with us. It''s a pleasure learning more about {{company}} and your role.</p><p>Best regards,<br>The Enterprise Team</p>'),
(5, 'Event Invitation', 'Invitation: Upcoming Executive Briefing', '<p>Dear {{name}},</p><p>We are hosting an exclusive briefing for leaders in the {{department}} field next week. As an valued representative of {{company}}, we would be honored to have you join us.</p><p>Best regards,<br>The Enterprise Team</p>')
ON DUPLICATE KEY UPDATE name=VALUES(name), subject=VALUES(subject), body=VALUES(body);

-- Insert Email Campaigns sidebar item
INSERT INTO sidebar_items (id, section_id, name, route, icon, sort_order, is_active) VALUES
(8, 3, 'Email Campaigns', '/email-campaigns', '<svg class=\"h-5 w-5 shrink-0\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" stroke-width=\"2\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" /></svg>', 6, 1)
ON DUPLICATE KEY UPDATE section_id=VALUES(section_id), name=VALUES(name), route=VALUES(route), icon=VALUES(icon), sort_order=VALUES(sort_order), is_active=VALUES(is_active);

-- Insert module for Email Campaigns
INSERT INTO modules (name, module_key, sidebar_item_id, sort_order, is_active) VALUES
('Email Campaigns', 'email_campaigns', 8, 8, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), module_key=VALUES(module_key), sidebar_item_id=VALUES(sidebar_item_id), sort_order=VALUES(sort_order), is_active=VALUES(is_active);

-- Map permissions for Admin Role
INSERT INTO role_permissions (role_id, module_id, can_view, can_add, can_edit, can_delete, can_export, can_view_details, can_manage_permissions)
SELECT 1, id, 1, 1, 1, 1, 1, 1, 1 FROM modules WHERE module_key = 'email_campaigns'
ON DUPLICATE KEY UPDATE can_view=1, can_add=1, can_edit=1, can_delete=1, can_export=1, can_view_details=1, can_manage_permissions=1;
