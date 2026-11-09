# MY MiTRAA TaskFlow — Local Windows 10 Run & Setup Guide

This guide provides end-to-end instructions for running **MY MiTRAA TaskFlow** locally on Windows 10 Pro with the authoritative **Java Spring Boot** backend, **MongoDB** database (`mymitraa_taskflow`), **Zoho Mail SMTP**, and **React Vite** frontend.

---

## 1. Prerequisites & Environment Requirements

| Technology | Minimum Version | Verified Target | Purpose |
|---|---|---|---|
| **Java JDK** | 17 (LTS) or 21 (LTS) | Eclipse Temurin 21 / OpenJDK 17 | Authoritative backend runtime |
| **Apache Maven** | 3.8.0+ | Maven 3.9.9+ | Spring Boot build & dependency management |
| **Node.js & npm** | Node 20.x or 22.x, npm 10+ | Node v22.23.2, npm 10.9.8 | Frontend build & dev server |
| **MongoDB Community** | 6.0+ or 7.0+ | MongoDB 7.0 Community Server | Single application database (`mymitraa_taskflow`) |
| **MongoDB Compass** | (Optional GUI) | Latest | Visual inspection of collections & indexes |

### Checking Installed Tool Versions in PowerShell / Command Prompt:
```powershell
java -version
mvn -version
node -v
npm -v
mongod --version
```

---

## 2. MongoDB Installation & Database Configuration

MongoDB is the **sole application database**. No SQL, SQLite, or JSON database is used.

### A. Install MongoDB on Windows
1. Download **MongoDB Community Server (msi)** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. Run the installer and choose **"Complete"** installation.
3. Ensure **"Install MongoDB as a Service"** is checked (runs automatically on port `27017`).
4. Data directory defaults to: `C:\Program Files\MongoDB\Server\7.0\data\`.

### B. Verify MongoDB Service is Running
In Windows PowerShell (Run as Administrator):
```powershell
Get-Service -Name MongoDB
```
If not running, start it:
```powershell
Start-Service -Name MongoDB
```

### C. Connect to MongoDB Shell or Compass
- Connection String: `mongodb://localhost:27017`
- Database Name: `mymitraa_taskflow` (Spring Boot creates this automatically upon saving the first document).

---

## 3. Environment Variables Configuration

Copy `.env.example` in the project root to create your local `.env`:

```powershell
Copy-Item .env.example .env
```

### Configure Settings in `.env`:
```ini
# Server Ports
PORT=3000
SERVER_PORT=8080

# Backend Connection
BACKEND_API_BASE_URL=http://localhost:8080

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/mymitraa_taskflow
MONGODB_DATABASE=mymitraa_taskflow

# Security
JWT_SECRET=dGhpc2lzYXZlcnlzZWN1cmVqd3RzZWNyZXRmb3JteW1pdHJhYXRhc2tmbG93YXBwbGljYXRpb24yMDI2
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Local Document / Attachment Storage
UPLOAD_PATH=C:/mymitraa_uploads

# Zoho Mail SMTP Gateway
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=your-email@zohomail.com
ZOHO_SMTP_PASSWORD=your-16-char-zoho-app-password
ZOHO_FROM_EMAIL=notifications@mymitraa.com
ZOHO_FROM_NAME="MY MiTRAA TaskFlow"
```

Create the attachment storage folder on Windows:
```powershell
New-Item -ItemType Directory -Force -Path "C:\mymitraa_uploads"
```

---

## 4. Zoho Mail SMTP Setup

To configure automated email dispatches for task assignments and weekly sprint status reports:

1. Log in to your Zoho Mail account at [mail.zoho.com](https://mail.zoho.com).
2. Go to **Settings > Security & Privacy > Two-Factor Authentication**.
3. Generate a dedicated **Application-Specific Password** (16 characters, e.g. `abcd efgh ijkl mnop`).
4. Enter your Zoho email into `ZOHO_SMTP_USER` and the app password into `ZOHO_SMTP_PASSWORD` in your `.env`.
5. If Zoho credentials are not yet entered, the system operates in **safe dry-run simulation mode** (`simulated: true`), recording notifications to audit logs without sending live emails.

---

## 5. Starting the Spring Boot Backend

Open a terminal in the backend directory:

```powershell
cd C:\Users\LENOVO\Downloads\MyMitraa-TaskFlow\backend\mymitraa_taskflow
```

### A. Clean and Compile
```powershell
mvn clean compile
```

### B. Run Tests
```powershell
mvn test
```

### C. Start the Spring Boot Service
```powershell
mvn spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.

### Verify Backend Health:
Open `http://localhost:8080/api/health` in your browser. Expected JSON:
```json
{
  "code": 200,
  "message": "HEALTH_OK",
  "data": {
    "status": "UP",
    "app": "mymitraa-taskflow",
    "version": "3.0.0",
    "database": "mymitraa_taskflow",
    "databaseConnected": true
  }
}
```

---

## 6. Initial Administrator Creation Procedure

Do NOT use hardcoded credentials in production. To bootstrap your initial administrator account securely:

### Option A: Via Auth Registration Endpoint (curl / PowerShell)
Send a POST request to register your admin user:
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -ContentType "application/json" -Body (@{
    name = "Deenesh Sabat"
    email = "deenesh123@gmail.com"
    username = "deenesh123"
    password = "YourSecurePassword123!"
    role = "Super Admin"
    team = "Management"
} | ConvertTo-Json)
```

The backend hashes the password using **BCrypt** with unique salt and stores the user in MongoDB collection `users`.

### Option B: Via MongoDB Compass / mongosh
If inserting directly into MongoDB:
```javascript
use mymitraa_taskflow;

// Note: Ensure the password is a valid BCrypt hash generated with strength 10
db.users.insertOne({
  username: "deenesh123",
  email: "deenesh123@gmail.com",
  name: "Deenesh Sabat",
  password: "$2a$10$YourGeneratedBCryptHashHere",
  role: "Super Admin",
  roles: ["Super Admin"],
  team: "Management",
  status: "Active",
  avatar: "DS",
  enabled: true,
  created_date: "08-Nov-2026",
  last_login: "Never"
});
```

---

## 7. Starting the Frontend Application

Open a second terminal window in the project root:

```powershell
cd C:\Users\LENOVO\Downloads\MyMitraa-TaskFlow
```

### A. Install Node Dependencies
```powershell
npm install
```

### B. Run TypeScript Checks & Production Build
```powershell
npm run lint
npm run build
```

### C. Start Development Server
```powershell
npm run dev
```

The Vite frontend development server runs on **`http://localhost:3000`**.
Requests to `/api/*` are automatically reverse-proxied to Spring Boot on `http://localhost:8080`.

---

## 8. Core Modules & Endpoint Mapping

| Business Module | Spring Boot Controller | Primary Endpoints | Database Collection |
|---|---|---|---|
| **Authentication** | `AuthController.java` | `POST /api/auth/login`<br>`POST /api/auth/register`<br>`GET /api/auth/current`<br>`POST /api/auth/change-password` | `users` |
| **User Management** | `UserController.java` | `GET /api/users/getAll`<br>`POST /api/users/save`<br>`PUT /api/users/update/{id}`<br>`DELETE /api/users/delete/{id}` | `users` |
| **Task Tracker** | `TaskController.java`<br>`FeedbackHistoryController.java` | `POST /api/tasks/save`<br>`PUT /api/tasks/getAll`<br>`GET /api/feedback/feedback_numerical_count`<br>`POST /api/feedback/add_subtask` | `feedback`<br>`tasks` |
| **Meeting Tracker** | `MeetingTimeTrackerController.java` | `PUT /api/meeting_time_tracker/getAll`<br>`POST /api/meeting_time_tracker/save`<br>`PUT /api/meeting_time_tracker/dashboard` | `meeting_time_tracker` |
| **Leaves & WFH** | `OptimaLeaveTrackerController.java`<br>`LeaveRequestController.java` | `PUT /api/optima_leave_tracker/getAll`<br>`POST /api/optima_leave_tracker/save`<br>`PUT /api/optima_leave_tracker/dashboard` | `optima_leave_tracker` |
| **Weekly Updates** | `OptimaWeeklyUpdateTrackerController.java` | `PUT /api/optima_weekly_update_tracker/getAll`<br>`POST /api/optima_weekly_update_tracker/save`<br>`PUT /api/optima_weekly_update_tracker/send-weekly-mail` | `optima_weekly_update_tracker` |
| **Task Owner Email** | `TaskOwnerEmailController.java` | `POST /api/task_owner_email/save`<br>`GET /api/tasks/owner-email/{id}` | `task_owner_email` |
| **Dropdown Management** | `DropdownManagementController.java` | `PUT /api/dropdown_management/getAll`<br>`POST /api/dropdown_management/save` | `dropdown_management` |
| **Documents** | `DocumentController.java` | `GET /api/documents`<br>`POST /api/documents/upload` | `documents` |

---

## 9. Troubleshooting Common Local Issues

### 1. `MongoSocketOpenException` / Connection Refused
- **Cause**: MongoDB service is not started on Windows.
- **Solution**: Open PowerShell as Admin and run: `Start-Service MongoDB`. Verify port `27017` is listening: `netstat -ano | findstr 27017`.

### 2. `Invalid username/email or password` on Login
- **Cause**: Password mismatch or user has not yet been registered.
- **Solution**: Register a new user via `POST /api/auth/register` with matching password, or verify existing credentials in MongoDB Compass `users` collection.

### 3. Port `8080` Already in Use
- **Cause**: Another service or previous Spring Boot instance is holding port 8080.
- **Solution**: Change `SERVER_PORT=8081` in your `.env`, and update `BACKEND_API_BASE_URL=http://localhost:8081`.

### 4. Port `3000` Already in Use
- **Cause**: Another Node.js app is using port 3000.
- **Solution**: Set `PORT=3001` in your `.env`.

### 5. Zoho Mail Authentication Failure
- **Cause**: Standard account password used instead of a 16-character Zoho App Password, or Two-Factor Authentication (2FA) blocked the login.
- **Solution**: Generate an App Password in Zoho Mail settings.

---

## 10. Production Packaging & Deployment

To package the complete system for standalone deployment on Windows Server or cloud hosting:

### A. Build Spring Boot Executable JAR
```powershell
cd backend\mymitraa_taskflow
mvn clean package -DskipTests
```
The output JAR will be generated at:
`backend\mymitraa_taskflow\target\mymitraa-taskflow-3.0.0.jar`

### B. Run Spring Boot JAR in Production
```powershell
java -jar target\mymitraa-taskflow-3.0.0.jar --spring.profiles.active=prod
```

### C. Build Production Frontend Assets
```powershell
cd ..\..
npm run build
```
Static assets will be compiled into `dist/` ready to be served by NGINX, IIS, or the Express production static runner (`npm run preview`).
