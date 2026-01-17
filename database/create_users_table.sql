-- Kullanıcılar tablosunu oluştur
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- İlk admin kullanıcıyı ekle (şifre: admin123)
-- Şifre bcrypt ile hashlenmeli, bu sadece örnek amaçlıdır
INSERT INTO users (username, email, password) VALUES 
('admin', 'admin@kds.com', '$2a$10$XGp3g3YvU8h4kZy5kPF6HuXVfCJKXF3jqPbQWZ5Gv5HZjYF5YF5YF');
