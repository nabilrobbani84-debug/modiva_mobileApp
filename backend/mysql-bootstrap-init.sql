CREATE DATABASE IF NOT EXISTS modiva;
CREATE USER IF NOT EXISTS 'modiva_user'@'localhost' IDENTIFIED BY 'modiva123';
CREATE USER IF NOT EXISTS 'modiva_user'@'127.0.0.1' IDENTIFIED BY 'modiva123';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'modiva123';
GRANT ALL PRIVILEGES ON modiva.* TO 'modiva_user'@'localhost';
GRANT ALL PRIVILEGES ON modiva.* TO 'modiva_user'@'127.0.0.1';
FLUSH PRIVILEGES;
