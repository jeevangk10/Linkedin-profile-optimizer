CREATE DATABASE IF NOT EXISTS linkedin_optimizer
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE linkedin_optimizer;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(120),
  headline TEXT,
  about TEXT,
  location VARCHAR(120),
  industry VARCHAR(120),
  target_role VARCHAR(150),
  years_experience INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experiences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  company VARCHAR(160) NOT NULL,
  job_title VARCHAR(160) NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  current_position BOOLEAN DEFAULT FALSE,
  description TEXT,
  achievements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exp_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  institution VARCHAR(180) NOT NULL,
  degree VARCHAR(160),
  field_of_study VARCHAR(160),
  start_year INT,
  graduation_year INT,
  description TEXT,
  CONSTRAINT fk_edu_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  CONSTRAINT fk_skill_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  certification_name VARCHAR(180) NOT NULL,
  issuing_organization VARCHAR(180),
  issue_date DATE,
  CONSTRAINT fk_cert_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  project_name VARCHAR(180) NOT NULL,
  description TEXT,
  technologies VARCHAR(500),
  project_url VARCHAR(500),
  CONSTRAINT fk_project_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  target_role VARCHAR(150),
  score INT NOT NULL,
  analysis_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_analysis_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  job_title VARCHAR(180),
  job_description TEXT,
  analysis_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_analyses_profile_date ON analyses(profile_id, created_at);
CREATE INDEX idx_job_matches_profile_date ON job_matches(profile_id, created_at);
