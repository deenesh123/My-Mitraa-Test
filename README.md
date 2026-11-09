# MyMitraa TaskFlow — Architecture, Integration & Operations Guide

Enterprise Task Management, Productivity Suite, and Role-Based User Management Application.

---

## 1. Project Identity & Architecture

| Parameter | Approved Value |
|---|---|
| **Application Name** | `MyMitraa TaskFlow` |
| **Java Root Package** | `com.mymitraa.taskflow` |
| **Target Database** | `mymitraa_taskflow` (MongoDB) |
| **Target Backend Framework** | Java 21, Spring Boot 3.3.4, Maven |
| **Target Frontend Framework** | React 19, TypeScript, Vite, Tailwind CSS |
| **Email Service Provider** | Zoho Mail SMTP (`smtp.zoho.com`) |

### Production Architecture
```
React Frontend (Vite + TypeScript) 
        │
        ▼ (HTTPS REST / Bearer JWT)
Spring Boot Backend (`com.mymitraa.taskflow`) 
   ├─ Spring Data MongoDB ───► MongoDB Database (`mymitraa_taskflow`)
   ├─ Spring Mail Sender  ───► Zoho Mail SMTP Gateway (`smtp.zoho.com:465`)
   └─ Spring Security     ───► Stateless JWT Authentication Filter
```

### Development Architecture (AI Studio Preview Environment)
```
Browser / React Client
        │
        ▼
Express Full-Stack Dev Server (`server.ts` on port 3000)
   ├─ Vite Dev Middleware (Hot SPA rendering)
   ├─ REST API Endpoints (102 endpoints matching Spring Boot controllers)
   ├─ Zoho Mail Transporter (`server/emailService.ts`)
   └─ MongoDB File Persistence Store (`data/mymitraa_taskflow.json`)
```

---

## 2. Seven Business Modules Overview

### Module 1: Feedback History (Task Tracker)
- **Controllers**: `FeedbackHistoryController.java` (`/api/feedback/*`), `TaskController.java` (`/api/tasks/*`)
- **Domain Model**: `FeedbackHistory.java`, `Task.java`, `WorkLogEntry.java`
- **Key Endpoints**:
  - `POST /api/feedback/save_feedback`, `POST /api/tasks/save`
  - `POST /api/feedback/edit_feedback`, `PUT /api/tasks/update/{id}`
  - `GET /api/feedback/feedback_numerical_count`
  - `GET /api/feedback/get_all_feedback`, `PUT /api/tasks/getAll`
  - `GET /api/feedback/get_feedback_by_id/{id}`, `GET /api/tasks/get/{id}`
  - `DELETE /api/feedback/delete_feedback/{id}`, `DELETE /api/tasks/delete/{id}`
  - `POST /api/feedback/add_worklog_hours`

### Module 2: Global File Uploads (Document Management)
- **Controllers**: `GlobalFileUploadsController.java`, `DocumentController.java` (`/api/documents/*`)
- **Domain Model**: `GlobalFileUploads.java`, `Document.java`
- **Key Endpoints**:
  - `POST /api/documents/upload`, `POST /api/feedback/upload`
  - `GET /api/documents`, `GET /api/feedback/get_uploaded_files`
  - `GET /api/documents/{id}`
  - `DELETE /api/documents/{id}`, `DELETE /api/feedback/delete_file/{ticketNumber}`

### Module 3: Optima Leave Tracker (Leaves & WFH)
- **Controllers**: `OptimaLeaveTrackerController.java` (`/api/optima_leave_tracker/*`), `LeaveRequestController.java` (`/api/leave-requests/*`)
- **Domain Model**: `OptimaLeaveTracker.java`, `LeaveRequest.java`
- **Key Endpoints**:
  - `POST /api/optima_leave_tracker/save`
  - `GET /api/optima_leave_tracker/get/{id}`
  - `PUT /api/optima_leave_tracker/getAll`
  - `PUT /api/optima_leave_tracker/update/{id}`
  - `DELETE /api/optima_leave_tracker/delete/{id}`
  - `PUT /api/optima_leave_tracker/dashboard`

### Module 4: Optima Weekly Update Tracker
- **Controller**: `OptimaWeeklyUpdateTrackerController.java` (`/api/optima_weekly_update_tracker/*`)
- **Domain Model**: `OptimaWeeklyUpdateTracker.java`
- **Key Endpoints**:
  - `POST /api/optima_weekly_update_tracker/save`
  - `GET /api/optima_weekly_update_tracker/get/{id}`
  - `PUT /api/optima_weekly_update_tracker/getAll`
  - `POST /api/optima_weekly_update_tracker/update`
  - `DELETE /api/optima_weekly_update_tracker/delete/{id}`
  - `PUT /api/optima_weekly_update_tracker/send-weekly-mail` (Dispatches weekly report email via Zoho Mail)

### Module 5: Task Owner Email
- **Controller**: `TaskOwnerEmailController.java` (`/api/task_owner_email/*`), `TaskController.java` (`/api/tasks/owner-email/{id}`)
- **Domain Model**: `TaskOwnerEmail.java`
- **Key Endpoints**:
  - `POST /api/task_owner_email/save` (Records notification and sends email to task owner via Zoho Mail)
  - `GET /api/tasks/owner-email/{id}` (Dispatches task owner notification by task ID)

### Module 6: Meeting Time Tracker
- **Controller**: `MeetingTimeTrackerController.java` (`/api/meeting_time_tracker/*`), `MeetingController.java` (`/api/meetings/*`)
- **Domain Model**: `MeetingTimeTracker.java`, `Meeting.java`
- **Key Endpoints**:
  - `POST /api/meeting_time_tracker/save`
  - `GET /api/meeting_time_tracker/get/{id}`
  - `PUT /api/meeting_time_tracker/getAll`
  - `PUT /api/meeting_time_tracker/update/{id}`
  - `DELETE /api/meeting_time_tracker/delete/{id}`
  - `PUT /api/meeting_time_tracker/dashboard`

### Module 7: Dropdown Management
- **Controller**: `DropdownManagementController.java` (`/api/dropdown_management/*`, `/api/dropdowns/*`)
- **Domain Model**: `DropdownManagement.java`, `DropdownManagementVM.java`
- **Key Endpoints**:
  - `POST /api/dropdown_management/save`
  - `GET /api/dropdown_management/get/{id}`
  - `PUT /api/dropdown_management/getAll`
  - `PUT /api/dropdown_management/update/{id}`
  - `DELETE /api/dropdown_management/delete/{id}`

---

## 3. Zoho Mail SMTP Integration

### Standard Configuration
- **Host**: `smtp.zoho.com` (Personal/Pro) or `smtppro.zoho.com` (Zoho Workplace / Custom Domain)
- **Port**: `465` (SSL/TLS encrypted, recommended) or `587` (STARTTLS)
- **Protocol**: `smtps`
- **Authentication**: Required (Zoho email address + Zoho App Password)

### Required Environment Variables
```bash
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=user@zohomail.com
ZOHO_SMTP_PASSWORD=your-16-char-app-password
ZOHO_FROM_EMAIL=notifications@mymitraa.com
ZOHO_FROM_NAME="MyMitraa TaskFlow"
```

### Security Directives
- **Zero Exposure**: SMTP passwords and API tokens are never sent in API responses or rendered in frontend HTML.
- **Explicit Testing**: Live test emails require an explicit user action and an explicitly entered recipient email.
- **Audit Logs**: All sent notifications are logged with delivery timestamp, recipient, subject, and delivery status (`/api/email/logs`).

---

## 4. MongoDB Database Setup (`mymitraa_taskflow`)

The authoritative database for MyMitraa TaskFlow is MongoDB `mymitraa_taskflow`.

### Connection Configuration
```bash
MONGODB_URI=mongodb://localhost:27017/mymitraa_taskflow
MONGODB_DATABASE=mymitraa_taskflow
```

### Collections Schema
1. `tasks` / `feedback_history`: Task items, effort estimation, work log entries, subtasks.
2. `meetings` / `meeting_time_tracker`: Meeting records, attendees, duration.
3. `leaves` / `optima_leave_tracker`: Planned leaves, WFH requests, approval statuses.
4. `weekly_updates` / `optima_weekly_update_tracker`: Project milestones, weekly highlights, RAG status.
5. `documents` / `global_file_uploads`: Uploaded files metadata, MIME types, file sizes.
6. `dropdowns` / `dropdown_management`: Dynamic dropdown lookups (domain, value, module, comments).
7. `users` / `roles`: User accounts, hashed passwords, roles (`Super Admin`, `Admin`, etc.).
8. `task_owner_emails`: Outbound task assignment notification audit logs.

---

## 5. Build, Run & Verification Commands

### Frontend Development & Build
```bash
# Install dependencies
npm install

# Start full-stack development server on port 3000
npm run dev

# Run TypeScript type check
npm run lint

# Compile production bundle
npm run build
```

### Java Spring Boot Backend (Maven)
```bash
# Navigate to backend directory
cd backend/mymitraa_taskflow

# Clean and compile with Java 21
mvn clean compile

# Run tests
mvn test

# Package Spring Boot runnable JAR
mvn package -DskipTests

# Run Spring Boot application
java -jar target/taskflow-3.0.0.jar
```
