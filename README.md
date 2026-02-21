# 📅 Real-Time Expert Session Booking System

A full-stack web application that allows users to browse experts, view available time slots, book sessions in real-time, and track their booking status — all with robust double-booking prevention and live slot updates.

---

## 🚀 Live Demo

> Both servers must be running locally. See [Getting Started](#-getting-started) below.

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:5000  

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Real-time** | Socket.io |
| **Validation** | express-validator |
| **Security** | Helmet, express-rate-limit, mongo-sanitize, hpp |
| **HTTP Client** | Axios |
| **Routing** | React Router v7 |
| **Notifications** | react-hot-toast |
| **Icons** | lucide-react |

---

## 📁 Project Structure

```
Booking/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── expertController.js    # Expert listing & detail logic
│   │   │   └── bookingController.js   # Booking CRUD + race-condition logic
│   │   ├── middleware/
│   │   │   ├── errorMiddleware.js     # Centralized error handler
│   │   │   └── validateMiddleware.js  # express-validator result handler
│   │   ├── models/
│   │   │   ├── Expert.js              # Expert schema + availableSlots
│   │   │   └── Booking.js             # Booking schema + unique index
│   │   ├── routes/
│   │   │   ├── expertRoutes.js        # GET /experts, GET /experts/:id
│   │   │   └── bookingRoutes.js       # POST/GET/PATCH /bookings
│   │   ├── seed.js                    # Demo data seeder (9 experts)
│   │   ├── server.js                  # Express app + Socket.io setup
│   │   └── socket.js                  # Socket.io singleton
│   ├── .env                           # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx             # Sticky glassmorphism navbar
    │   │   └── Spinner.jsx            # Animated loading spinner
    │   ├── pages/
    │   │   ├── ExpertsList.jsx        # Screen 1: Expert listing
    │   │   ├── ExpertDetail.jsx       # Screen 2: Expert detail + real-time slots
    │   │   ├── BookingPage.jsx        # Screen 3: Booking form
    │   │   └── MyBookings.jsx         # Screen 4: My bookings by email
    │   ├── services/
    │   │   └── api.js                 # Axios instance + all API functions
    │   ├── socket.js                  # Socket.io client singleton
    │   ├── App.jsx                    # Router setup
    │   ├── main.jsx                   # React entry point
    │   └── index.css                  # Global styles + design tokens
    ├── .env                           # Frontend environment variables
    └── package.json
```

---

## ✨ Features Implemented

### Screen 1 — Expert Listing
- Display experts with name, category, experience, and star rating
- **Real-time search** by name (debounced, case-insensitive)
- **Filter by category**: Technology, Finance, Healthcare, Marketing, Legal, Design
- **Pagination** with page indicator (Page X of Y)
- Loading skeleton spinner, error state with retry, empty state

### Screen 2 — Expert Detail
- Full expert profile: avatar, bio, rating, experience, category
- Available time slots **grouped by date**
- **Real-time slot updates via Socket.io** — when another user books a slot, it disappears instantly for everyone viewing the same expert
- Disabled/strikethrough visual on booked slots

### Screen 3 — Booking
- Form fields: Full Name, Email, Phone, Notes
- Pre-filled booking summary: Expert name, Date, Time Slot
- **Inline validation** with per-field error messages
- Success card + toast notification + auto-redirect to My Bookings
- Handles **409 Conflict** gracefully — toast warning + redirect back to pick another slot

### Screen 4 — My Bookings
- Look up all bookings by email address
- Booking cards showing: Expert name, category, date, time
- **Status badges**: Pending 🟡 / Confirmed 🟢 / Completed 🔵
- Loading, empty, and error states

---

## 🔌 API Reference

### Experts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/experts` | List experts with pagination, filter, search |
| `GET` | `/experts/:id` | Get single expert with available slots |

**Query Parameters for `GET /experts`:**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 9, max: 50) |
| `category` | string | Filter by category (e.g. `Technology`) |
| `search` | string | Case-insensitive name search |

**Example Response — `GET /experts`:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Dr. Priya Sharma",
      "category": "Technology",
      "experience": 12,
      "rating": 4.9
    }
  ],
  "pagination": {
    "total": 9,
    "totalPages": 3,
    "currentPage": 1,
    "limit": 3
  }
}
```

---

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bookings` | Create a new booking |
| `GET` | `/bookings?email=` | Get all bookings for an email |
| `PATCH` | `/bookings/:id/status` | Update booking status |

**`POST /bookings` — Request Body:**
```json
{
  "expertId": "64a1b2c3d4e5f6789012345",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "date": "2026-02-25",
  "timeSlot": "10:00",
  "notes": "I'd like to discuss cloud architecture."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking confirmed successfully!",
  "data": {
    "_id": "...",
    "expert": { "name": "Dr. Priya Sharma", "category": "Technology" },
    "date": "2026-02-25",
    "timeSlot": "10:00",
    "status": "Pending"
  }
}
```

**Conflict Response (409) — Double booking attempt:**
```json
{
  "success": false,
  "message": "This time slot has just been booked by someone else. Please choose a different slot."
}
```

**`PATCH /bookings/:id/status` — Request Body:**
```json
{ "status": "Confirmed" }
```
Allowed values: `Pending` | `Confirmed` | `Completed`

---

## ⚠️ Critical Requirements — Implementation Details

### 1. Double Booking Prevention (Race Condition)

The system uses **3 layers of defence**:

**Layer 1 — Atomic slot removal (application level)**  
Uses MongoDB's `findOneAndUpdate` with an `$elemMatch` condition to atomically find the expert AND remove the slot in a single atomic operation. If two concurrent requests arrive simultaneously, only one will successfully match and pull the slot. The other receives a `null` result and gets a 409 response — *before* any Booking document is created.

```js
const updatedExpert = await Expert.findOneAndUpdate(
  { _id: expertId, 'availableSlots': { $elemMatch: { date, slots: timeSlot } } },
  { $pull: { 'availableSlots.$.slots': timeSlot } }
);
if (!updatedExpert) return res.status(409).json({ ... });
```

**Layer 2 — MongoDB unique compound index (database level)**  
The `Booking` model has a unique index on `{ expert, date, timeSlot }`. Even if two requests somehow bypass Layer 1 simultaneously, MongoDB guarantees only one write succeeds. The second throws error code `11000`, caught and returned as 409.

```js
bookingSchema.index({ expert: 1, date: 1, timeSlot: 1 }, { unique: true });
```

**Layer 3 — Real-time UI update (client level)**  
On successful booking, the backend emits a `slotBooked` Socket.io event. All connected clients viewing that expert's page immediately remove the slot from their UI — preventing users from even attempting to book a slot that just got taken.

---

### 2. Real-Time Slot Updates

**Backend** emits on every successful booking:
```js
io.emit('slotBooked', { expertId, date, timeSlot });
```

**Frontend** listens on the Expert Detail page:
```js
socket.on('slotBooked', ({ expertId, date, timeSlot }) => {
  if (expertId === currentExpertId) {
    // Immediately remove the slot from the UI
    setExpert(prev => ({ ...prev, availableSlots: ... }));
  }
});
```

---

### 3. Security Measures

| Measure | Implementation |
|---|---|
| Security headers | `helmet()` — sets X-Content-Type-Options, X-Frame-Options, XSS filter, etc. |
| Rate limiting | `express-rate-limit` — 100 req/15min global, 10/15min on booking creation |
| NoSQL injection | `mongo-sanitize` on `req.body`, `req.params`, `req.query` |
| HTTP Parameter Pollution | `hpp()` middleware |
| Input validation | `express-validator` on all routes — MongoId, email, phone, date, timeSlot format |
| Stored XSS prevention | `stripHTML()` sanitizer on name and notes fields |
| Request size limit | `express.json({ limit: '10kb' })` — rejects oversized payloads |
| CORS whitelist | Only `CLIENT_URL` origin is allowed |
| ReDoS prevention | Search input capped at 100 chars, regex special chars escaped before `$regex` |
| Error info leakage | Stack traces hidden in production (`NODE_ENV=production`) |
| Past date booking | Custom validator rejects dates before today |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** — local instance OR MongoDB Atlas URI
- **npm** v9 or higher

---

### 1. Clone / Open the Project

```bash
cd "Booking"
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Seed the database** with 9 demo experts:

```bash
npm run seed
```

**Start the backend server:**

```bash
npm run dev
```

> ✅ You should see:  
> `🚀 Server running on http://localhost:5000`  
> `✅ MongoDB Connected: ...`

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Start the frontend dev server:**

```bash
npm run dev
```

> ✅ You should see:  
> `➜ Local: http://localhost:5173/`

---

### 4. Open the App

Open your browser and go to: **http://localhost:5173**

---

## 🧪 Testing Key Scenarios

### Normal Booking Flow
1. Open **http://localhost:5173**
2. Browse or search for an expert
3. Click an expert → view their available slots
4. Click a time slot → fill the booking form
5. Submit → see success message → redirected to My Bookings
6. Search your email → see the booking with **Pending** status

### Real-Time Update Test
1. Open the same Expert Detail page in **two browser windows**
2. Book a slot in window 1
3. Watch the same slot disappear **instantly** in window 2 (no refresh needed)

### Double Booking Prevention Test
1. Two users try to book the same slot at exactly the same moment
2. One gets **201 Confirmed** ✅
3. The other gets **409 Conflict** ⚠️ with a helpful message

---

## 🌱 Seed Data

The seed script populates **9 experts** across 6 categories:

| Name | Category |
|---|---|
| Dr. Priya Sharma | Technology |
| James Mitchell | Finance |
| Dr. Aisha Patel | Healthcare |
| Sarah Chen | Marketing |
| Robert Anderson | Legal |
| Maya Rodriguez | Design |
| David Kumar | Technology |
| Emily Watson | Finance |
| Dr. James Okafor | Healthcare |

Each expert has **5 dates** of availability with **multiple time slots** per day.

---

## 📊 Booking Status Flow

```
[User Books] → Pending → Confirmed → Completed
```

| Status | Meaning |
|---|---|
| **Pending** 🟡 | Booking created, awaiting expert/admin confirmation |
| **Confirmed** 🟢 | Session confirmed by expert or admin |
| **Completed** 🔵 | Session has taken place |

Status can be updated via: `PATCH /bookings/:id/status`

---

## 🔧 Available Scripts

### Backend

```bash
npm run dev     # Start with nodemon (auto-restart on file change)
npm run seed    # Seed database with 9 demo experts
```

### Frontend

```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build locally
```

---

## 📝 Design Decisions

### Why email-based lookup for My Bookings?
The assignment specification explicitly states *"Show bookings by email"* — this approach was chosen intentionally to keep scope focused. A full authentication system (JWT + login screen) was out of scope for this assignment.

### Why Socket.io over polling?
Socket.io provides true **push-based** real-time updates with no unnecessary network traffic. Polling would require repeated API calls every N seconds, wasting bandwidth and adding latency. Socket.io ensures instant slot removal the moment a booking is confirmed.

### Why atomic `findOneAndUpdate` for race conditions?
A naive "check-then-insert" approach has an inherent TOCTOU (Time-Of-Check-Time-Of-Use) race condition — two requests can both pass the check before either inserts. The `findOneAndUpdate` with `$elemMatch` is a **single atomic MongoDB operation**, making it impossible for two requests to both succeed.

### Why keep Pending as the initial status?
This mirrors real-world booking systems where an expert or administrator must confirm the appointment. Auto-confirming removes meaningful workflow and hides the status feature.
