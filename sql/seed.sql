-- seed.sql for INC Event Management
CREATE DATABASE IF NOT EXISTS inc_events CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE inc_events;

-- users table
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  designation VARCHAR(255),
  last_visit DATETIME DEFAULT NULL,
  monthly_visit_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- events table
CREATE TABLE IF NOT EXISTS events (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(512) NOT NULL,
  description TEXT,
  start_datetime DATETIME,
  end_datetime DATETIME,
  issue_date DATE,
  location VARCHAR(512),
  level ENUM('jila','block') DEFAULT 'jila',
  event_type VARCHAR(50),
  created_by INT,
  photos TEXT,
  media_photos TEXT,
  video_path VARCHAR(1024),
  attendees_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- event_views table
CREATE TABLE IF NOT EXISTS event_views (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed TINYINT(1) DEFAULT 0,
  updated_details TINYINT(1) DEFAULT 0,
  accepted TINYINT(1) DEFAULT 0,
  updated_at DATETIME DEFAULT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- sample users
INSERT INTO users (name, code, role, designation) VALUES
('Admin Demo', '1111', 'admin', 'प्रशासक'),
('Jila Adhyaksh Demo', '2222', 'user', 'जिला अध्यक्ष'),
('Block User Demo', '3333', 'user', 'ब्लॉक कार्यालय');

-- sample events
INSERT INTO events (name, description, start_datetime, end_datetime, issue_date, location, level, event_type, created_by, attendees_count)
VALUES
('जन-सभा - मेरठ', 'जन-सभा का विवरण...', '2025-10-20 10:00:00', '2025-10-20 12:00:00', '2025-10-15', 'मेरठ', 'jila', 'सभा', 1, 1500),
('रैली - गाजीपुर', 'रैली विवरण...', '2025-09-10 09:00:00', '2025-09-10 11:00:00', '2025-09-05', 'गाजीपुर', 'block', 'रैली', 2, 900);

-- event_views
INSERT INTO event_views (event_id, user_id, viewed, updated_details, accepted, updated_at) VALUES
(1, 2, 1, 1, 0, NOW()),
(1, 3, 1, 0, 0, NOW()),
(2, 2, 1, 0, 0, NOW());
