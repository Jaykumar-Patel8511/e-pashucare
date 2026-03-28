# e-PashuCare - Online Animal Health Case Booking System

Complete full-stack GTU final-year project for digitized veterinary service booking.

## Tech Stack

- Frontend: React + Vite + TypeScript + TailwindCSS + Framer Motion + Chart.js
- Backend: Node.js + Express + MongoDB + Mongoose + JWT + Socket.io + Nodemailer
- Smart Service: Python Flask API for nearest doctor assignment

## Features Implemented

- Farmer/Doctor/Admin role-based authentication with OTP verification
- Farmer registration with sabhasad/dairy details and GPS location
- Animal registration and sick animal case booking
- Automatic fee calculation based on membership, time window, and problem type
- Automatic payment deduction record creation
- Email notification to dairy secretary on deduction
- Smart nearest doctor assignment via Python API with Node fallback
- Real-time case updates (Pending, Assigned, Doctor On The Way, Treatment Completed)
- Doctor diagnosis and prescription report submission
- Admin analytics dashboard (total cases, emergency split, doctor workload, daily trend)
- Gujarati/English language toggle using React Context and translation file
- Responsive green-blue glassmorphism UI and Framer Motion animations

## Folder Structure

```text
frontend/
backend/
python-service/
```

## Run Instructions

## 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## 2) Python Service

```bash
cd python-service
pip install -r requirements.txt
python doctor_assignment.py
```

## 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Main APIs

- Auth: `/api/auth/register`, `/api/auth/verify-otp`, `/api/auth/login`
- Animals: `/api/animals`
- Cases: `/api/cases`, `/api/cases/my`, `/api/cases/:id/status`, `/api/cases/:id/assign`
- Reports: `/api/reports`
- Admin: `/api/admin/users/:role`, `/api/admin/analytics`
- Python: `/assign-doctor`

## Notes

- MongoDB must be running on local or update `MONGO_URI` in backend `.env`.
- Configure SMTP credentials in backend `.env` to send real emails.
- If Python service is unavailable, backend fallback logic assigns nearest doctor using MongoDB doctor locations.
