# 📚 StudyNotion

> **StudyNotion** is a full-stack ed-tech platform built on the **MERN stack**. Students can browse, purchase, and rate courses; instructors can create and manage them — with JWT + OTP authentication, Razorpay payments, and Cloudinary-backed media uploads throughout.

---

## ✨ Features

- 👨‍🎓 **Student dashboard** — browse the catalog, purchase courses, track progress, and rate/review completed ones
- 👩‍🏫 **Instructor dashboard** — create, edit, and publish courses with nested sections and sub-sections
- 🔑 **Role-based access control** — Student / Instructor / Admin, enforced on both the API and the UI
- 🔒 **Secure authentication** — JWT sessions, email OTP verification on signup, and a token-based password-reset flow
- 💳 **Razorpay payment integration** — orders created and verified server-side via HMAC-SHA256 signature checks
- ☁️ **Cloudinary media uploads** — course thumbnails and profile pictures
- 📧 **Transactional email** — OTP, enrollment confirmation, payment receipts, and password-change notifications via Nodemailer

---

## 🛠 Tech Stack

- **Frontend**: React (Create React App), Redux Toolkit, React Router, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Auth**: JWT, bcrypt, per-IP rate limiting on auth-sensitive routes
- **Payments**: Razorpay
- **Media**: Cloudinary
- **Email**: Nodemailer

---

## 🚀 Running Locally

### Prerequisites
- Node.js (see `.nvmrc`)
- A MongoDB connection string (local or Atlas)
- Cloudinary, Razorpay, and SMTP credentials (see `server/.env.example`)

### 1. Install dependencies
```bash
npm install            # client, from the project root
cd server && npm install   # server
```

### 2. Configure environment variables

**`server/.env`** (see `server/.env.example` for the full list):
```
MAIL_HOST=
MAIL_USER=
MAIL_PASS=
JWT_SECRET=
FOLDER_NAME=
RAZORPAY_KEY=
RAZORPAY_SECRET=
CLOUD_NAME=
API_KEY=
API_SECRET=
MONGODB_URL=
PORT=4000
CLIENT_URL=http://localhost:3000
```

**`.env`** at the project root (for the client):
```
REACT_APP_BASE_URL=http://localhost:4000/api/v1
```

### 3. Run it
From the project root:
```bash
npm run dev
```
This runs the client (`http://localhost:3000`) and the server (`http://localhost:4000`) together.

---

## 📌 API Endpoints

All routes are prefixed with `/api/v1`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `POST /auth/sendotp`, `POST /auth/changepassword`, `POST /auth/reset-password-token`, `POST /auth/reset-password` |
| Profile | `GET /profile/getUserDetails`, `PUT /profile/updateProfile`, `PUT /profile/updateDisplayPicture`, `GET /profile/getEnrolledCourses`, `DELETE /profile/deleteProfile` |
| Courses | `POST /course/createCourse`, `GET /course/getAllCourses`, `POST /course/getCourseDetails`, `POST /course/editCourse`, `DELETE /course/deleteCourse`, `GET /course/getInstructorCourses` |
| Categories | `GET /course/showAllCategories`, `POST /course/createCategory`, `POST /course/getCategoryPageDetails` |
| Ratings | `POST /course/createRating`, `GET /course/getAverageRating`, `GET /course/getReviews` |
| Payments | `POST /payment/capturePayment`, `POST /payment/verifyPayment`, `POST /payment/sendPaymentSuccessEmail` |
| Contact | `POST /reach/contact` |

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt and never returned in API responses
- Signup requires email OTP verification
- Course create/edit/delete require authentication **and** an instructor-ownership check
- Razorpay payments are verified server-side via HMAC-SHA256; a `Payment` record makes enrollment idempotent against duplicate verification calls
- Login, signup, OTP, and password-reset endpoints are rate-limited per IP
- Changing a password invalidates existing sessions on other devices (a fresh token is issued to the device making the change)

---

## 👨‍💻 My Contributions

- Built the full MERN app end-to-end: REST API, MongoDB schema design, and a React + Redux Toolkit frontend
- Implemented JWT + email-OTP authentication with role-based access control for Students, Instructors, and Admins
- Integrated Razorpay with server-side signature verification and idempotent enrollment handling
- Added Cloudinary-based media uploads and Nodemailer-based transactional email flows
- Ran a self-review pass that found and fixed authorization gaps (missing ownership checks on course edit/delete) and payment-integrity bugs (duplicate-enrollment races, a broken reset-token invalidation)
