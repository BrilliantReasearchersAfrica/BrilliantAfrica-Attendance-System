📘 BrilliantAfrica Attendance System
A modern web-based attendance management system built with Node.js, Express, SQLite, and JavaScript. Designed for seamless employee tracking, reporting, and management.

🌟 Key Features
📊 Reports & Dashboards
Daily & Monthly Attendance

In/Out Logs & Overtime Reports

Late Clock-In & Leave Reports

Attendance Summary Dashboard

Export Reports (coming soon)

🔐 Authentication & Access
JWT-based authentication

Secure password hashing (bcrypt)

Role-based access (Admin/User)

Token expiration & session handling

🖥️ Interface
Responsive UI with Bootstrap 5

Web-friendly layout

Real-time updates 

📦 Database
SQLite3 with relational schema

Auto data seeding (employees, attendance, departments)

Integrity constraints and foreign key references

🛠️ Tech Stack
Backend: Node.js, Express.js, SQLite, JWT, bcrypt, CORS

Frontend: HTML5, CSS3, Bootstrap 5, JavaScript (ES6+), Font Awesome

🚀 Getting Started
✅ Prerequisites
Node.js (v14+)

npm (v6+)

Git


📦 Installation


git clone https://github.com//brilliantafrica-attendance.git
cd brilliantafrica-attendance
npm install

npm start , npm run dev
# OR
node src/server.js


🔑 Default Credentials

Email: fred@gmail.com
Password: 123@
Role: Admin

📚 API Overview

🔓 Auth


POST /api/auth/login – Login

GET /api/auth/profile – User profile (with Bearer token)

👥 Employees
GET /api/employees – List employees

POST /api/employees – Add employee

GET /api/employees/:id – View specific employee

🕒 Attendance
GET /api/attendance/daily – Daily attendance

GET /api/attendance/monthly – Monthly summaries

GET /api/attendance/late-clockin – Late arrivals

GET /api/attendance/overtime – Overtime logs

🏢 Departments
GET /api/departments – List all departments

🧪 Testing
Postman
Import API collection

Login: POST /api/auth/login

Use token in headers for protected routes

Manual
Login via browser

Navigate dashboard

Perform CRUD operations


📊 Sample Data Includes:

8 sample employees

Multiple departments

3 months of attendance logs

Holidays and leave records

Default admin account


👨‍💻 Authors

Your Name – GitHub Profile


🙏 Acknowledgments

Bootstrap

Font Awesome

SQLite

Express.js