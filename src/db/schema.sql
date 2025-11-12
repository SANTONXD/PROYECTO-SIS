CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin VARCHAR(100),
  destination VARCHAR(100),
  departure DATETIME,
  arrival DATETIME,
  total_seats INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  status ENUM('available','reserved','sold') DEFAULT 'available',
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  UNIQUE(flight_id, seat_number)
);

CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  flight_id INT NOT NULL,
  seat_id INT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (flight_id) REFERENCES flights(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);
