-- Happypets Animal Clinic Database Schema (MySQL Compatibility)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  species VARCHAR(100) NOT NULL,
  breed VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  dob DATE,
  age INT,
  sex VARCHAR(50),
  color VARCHAR(100),
  weight DECIMAL(8, 2),
  identifying_marks TEXT,
  medical_history TEXT,
  photo_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pet_id INT NOT NULL,
  service_id INT NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  problem_description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id),
  INDEX idx_app_user_id (user_id),
  INDEX idx_appointment_date (appointment_date)
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image VARCHAR(255),
  author_name VARCHAR(255),
  category VARCHAR(100),
  tags VARCHAR(255),
  views INT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_published (is_published)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  discount_price DECIMAL(10, 2),
  category VARCHAR(100) NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(255),
  rating DECIMAL(3, 2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_featured (is_featured)
);

-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_wishlist_user_id (user_id)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url VARCHAR(255),
  experience_years INT DEFAULT 0,
  specialties VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (name, role)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  coupon_code VARCHAR(100),
  shipping_address TEXT,
  billing_address TEXT,
  payment_method VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_status (status)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_order_id (order_id)
);

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vaccine_name VARCHAR(255) NOT NULL,
  batch_number VARCHAR(100),
  given_date DATE NOT NULL,
  next_due_date DATE,
  administered_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pet_id INT NOT NULL,
  vet_id INT NOT NULL,
  visit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  temperature DECIMAL(5,2),
  pulse INT,
  respiration INT,
  weight DECIMAL(8,2),
  clinical_findings TEXT,
  primary_diagnosis VARCHAR(255),
  differential_diagnoses TEXT,
  treatment_interventions TEXT,
  prescribed_medicines TEXT,
  attachments_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (vet_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  pet_id INT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Pending', 'Paid', 'Cancelled') DEFAULT 'Pending',
  issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NULL DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_type ENUM('Service', 'Product') NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create reminders_log table
CREATE TABLE IF NOT EXISTS reminders_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vaccination_id INT NOT NULL,
  pet_id INT NOT NULL,
  client_id INT NOT NULL,
  type ENUM('Email', 'SMS') DEFAULT 'Email',
  status ENUM('Sent', 'Failed') DEFAULT 'Sent',
  sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vaccination_id) REFERENCES vaccinations(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create consent_forms table
CREATE TABLE IF NOT EXISTS consent_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  pet_id INT NOT NULL,
  form_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Signed',
  content_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attachment_url VARCHAR(255),
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Insert Sample Services
INSERT INTO services (name, description, price, duration_minutes) VALUES
('General Checkup', 'Routine health checkup for your pet', 50.00, 30),
('Vaccination', 'Protective vaccination services', 75.00, 20),
('Grooming', 'Professional pet grooming and bathing', 100.00, 60),
('Emergency Care', '24/7 emergency veterinary care', 150.00, 45);

-- Insert Sample Products
INSERT INTO products (name, description, price, category, stock, is_featured) VALUES
('Premium Dog Food', 'High-quality nutritious dog food', 45.99, 'Food', 100, TRUE),
('Cat Litter Box', 'Durable and spacious litter box', 35.99, 'Accessories', 50, FALSE),
('Dog Bed', 'Comfortable orthopedic dog bed', 89.99, 'Bedding', 30, TRUE),
('Kitten Formula', 'Special formula for kittens', 28.99, 'Food', 75, TRUE),
('Rope Toy Set', 'Durable rope toys for dogs', 12.99, 'Toys', 200, FALSE),
('Pet Shampoo', 'Gentle and natural pet shampoo', 15.99, 'Grooming', 150, TRUE),
('Bird Cage', 'Large stainless steel bird cage', 199.99, 'Cages', 20, FALSE),
('Hamster Wheel', 'Silent running hamster wheel', 24.99, 'Accessories', 80, FALSE),
('Fish Tank Filter', 'Advanced aquarium filtration system', 79.99, 'Aquarium', 40, TRUE),
('Pet Carrier', 'Portable and lightweight pet carrier', 55.99, 'Travel', 60, TRUE),
('Chew Treats', 'Natural and healthy chew treats', 9.99, 'Treats', 300, FALSE),
('Pet Vitamins', 'Essential vitamins for pets', 22.99, 'Health', 100, TRUE);

-- Insert Sample Team Members
INSERT INTO team_members (name, role, bio, image_url, experience_years, specialties, sort_order)
VALUES
('Dr. Sarah Johnson', 'Lead Veterinarian', '15+ years caring for small animals with a focus on preventative medicine.', '/female-veterinarian-professional.jpg', 15, 'Wellness, Preventative Care', 1),
('Dr. Michael Chen', 'Surgical Specialist', 'Performs advanced orthopedic and soft tissue surgery with compassionate follow-up care.', '/male-veterinarian-professional.jpg', 12, 'Surgery, Trauma Care', 2),
('Emily Rodriguez', 'Grooming Expert', 'Certified groomer ensuring every pet leaves happy, healthy, and stylish.', '/female-groomer-professional.jpg', 8, 'Grooming, Styling', 3),
('James Patterson', 'Pet Nutritionist', 'Designs personalized nutrition plans for pets with special dietary needs.', '/male-nutritionist-professional.jpg', 10, 'Nutrition, Wellness Coaching', 4)
AS new
ON DUPLICATE KEY UPDATE 
  bio = new.bio,
  image_url = new.image_url,
  experience_years = new.experience_years,
  specialties = new.specialties,
  sort_order = new.sort_order,
  is_active = TRUE;

-- Insert Default Admin User
INSERT IGNORE INTO users (email, password, full_name, role, is_active)
VALUES (
  'admin@happypets.com.np',
  '$2b$10$IzW/1hEzZc5EkKvafrYUV.LyQrouxt7NfMahlxL/Q2wZrXzsdmqSu',
  'System Admin',
  'admin',
  TRUE
);
