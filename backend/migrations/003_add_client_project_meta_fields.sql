-- Add metadata fields used during client/project onboarding

ALTER TABLE clients
  ADD COLUMN instagram VARCHAR(120) NULL AFTER phone,
  ADD COLUMN domain_main VARCHAR(255) NULL AFTER instagram,
  ADD COLUMN hosting_provider VARCHAR(120) NULL AFTER domain_main,
  ADD COLUMN hosting_panel_url VARCHAR(500) NULL AFTER hosting_provider,
  ADD COLUMN hosting_login VARCHAR(190) NULL AFTER hosting_panel_url,
  ADD COLUMN hosting_password VARCHAR(255) NULL AFTER hosting_login,
  ADD COLUMN github_url VARCHAR(500) NULL AFTER hosting_password,
  ADD COLUMN cms_org_name VARCHAR(190) NULL AFTER github_url,
  ADD COLUMN cms_org_id VARCHAR(120) NULL AFTER cms_org_name,
  ADD COLUMN cms_project_name VARCHAR(190) NULL AFTER cms_org_id,
  ADD COLUMN cms_url VARCHAR(500) NULL AFTER cms_project_name,
  ADD COLUMN cms_app_id VARCHAR(190) NULL AFTER cms_url,
  ADD COLUMN notes TEXT NULL AFTER cms_app_id;

ALTER TABLE projects
  ADD COLUMN domain_main VARCHAR(255) NULL AFTER description,
  ADD COLUMN github_url VARCHAR(500) NULL AFTER domain_main,
  ADD COLUMN cms_org_name VARCHAR(190) NULL AFTER github_url,
  ADD COLUMN cms_org_id VARCHAR(120) NULL AFTER cms_org_name,
  ADD COLUMN cms_project_name VARCHAR(190) NULL AFTER cms_org_id,
  ADD COLUMN cms_url VARCHAR(500) NULL AFTER cms_project_name,
  ADD COLUMN cms_app_id VARCHAR(190) NULL AFTER cms_url,
  ADD COLUMN notes TEXT NULL AFTER cms_app_id;
