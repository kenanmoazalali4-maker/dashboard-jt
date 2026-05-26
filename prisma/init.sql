CREATE TABLE IF NOT EXISTS `dashboard_staff` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `discord_id` VARCHAR(32) NOT NULL UNIQUE,
  `username` VARCHAR(64) DEFAULT NULL,
  `avatar` VARCHAR(512) DEFAULT NULL,
  `permissions` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `dashboard_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant_name` VARCHAR(128) NOT NULL,
  `applicant_discord` VARCHAR(32) DEFAULT NULL,
  `applicant_age` INT DEFAULT NULL,
  `answers` LONGTEXT DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `reviewer_id` INT DEFAULT NULL,
  `reviewer_notes` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reviewer_id`) REFERENCES `dashboard_staff`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `dashboard_audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(32) DEFAULT NULL,
  `target_id` VARCHAR(64) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`staff_id`) REFERENCES `dashboard_staff`(`id`)
);

CREATE TABLE IF NOT EXISTS `dashboard_settings` (
  `key_name` VARCHAR(64) PRIMARY KEY,
  `value` TEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add المسؤول العام (super admin with all permissions)
INSERT IGNORE INTO `dashboard_staff` (`discord_id`, `permissions`)
VALUES ('480506940125085726', '["super_admin"]');
