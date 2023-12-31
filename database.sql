-- Tabela "users"
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  referinta FLOAT DEFAULT 255
);

-- Tabela "consum"
CREATE TABLE IF NOT EXISTS consum (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nume VARCHAR(255) NOT NULL,
  putere DECIMAL(10, 2) NOT NULL,
  timp DECIMAL(10, 2) NOT NULL,
  consum DECIMAL(10, 2) NOT NULL,
  data_calendar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

--
SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
