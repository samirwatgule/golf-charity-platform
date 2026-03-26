# Fairway Fund (Golf Charity Subscription Platform) 🏌️‍♂️💚

Welcome to **Fairway Fund**, a modern, production-ready SaaS platform that combines golf subscription tracking, monthly lottery draws, and automatic charity donations.

## 🌟 Overview
Fairway Fund changes how players interact with their golf scores. By subscribing to the platform:
1. **Play & Log**: Users log their golf scores (last 5 are kept in rolling storage).
2. **Win & Earn**: Every month, a draw takes place. Users with matching scores win real prize money from the pool!
3. **Give Back**: A guaranteed minimum of 10% of revenue goes directly to verified charities chosen by the users.

## 🚀 Tech Stack
This repository is structured as a **Monorepo** using npm workspaces.

**Frontend (`apps/web`)**
- React 18 & Vite
- Tailwind CSS (Custom Premium Glassmorphism UI)
- React Router DOM
- Framer Motion (Micro-animations)

**Backend (`apps/api`)**
- Node.js & Express
- Strict TypeScript (`tsc`)
- PostgreSQL (Database)
- Stripe Integrations (Webhooks & Sessions)
- JSON Web Tokens (JWT) for Role-based Auth

## 📂 Project Structure

```
├── apps/
│   ├── api/                # Express Backend API
│   │   ├── src/            # Controllers, Routes, Middleware, & Draw Logic
│   │   ├── schema.sql      # Complete PostgreSQL Schema & mock charities
│   │   └── package.json
│   │
│   └── web/                # React Frontend 
│       ├── src/
│       │   ├── components/ # Reusable UI components
│       │   ├── context/    # Global Auth State
│       │   ├── pages/      # Landing, Dashboard, Admin, Charity pages
│       │   └── lib/        # API client and Mock Data Layer
│       └── package.json
│
├── package.json            # Monorepo configuration
└── README.md
```

## 🛠 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Installation
Run the following from the root directory to install dependencies for both the frontend and backend:
```bash
npm install
```

### 2. Environment Variables
You need to set up environment variables for the backend to run properly. In the root of the project, create a `.env` file (you can use `.env.example` as a template):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgres://postgres:password@localhost:5432/fairway_fund"
JWT_ACCESS_SECRET="your_secure_access_secret_here"
JWT_REFRESH_SECRET="your_secure_refresh_secret_here"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="http://localhost:5173"
```

### 3. Database Initialization
Execute the SQL commands found in `apps/api/schema.sql` against your PostgreSQL database to create all required tables (Users, Subscriptions, Scores, Draws, Winners, Charities) and seed initial data.

Once the database is set up, seed the default Admin user by running:
```bash
cd apps/api
npx tsx src/scripts/seed_admin.ts
```

### 4. Running the Development Server
Since this is a monorepo, you can start both the Frontend and Backend concurrently from the root directory:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## 🔑 Admin Access
The platform includes a fully functional, secured Admin Control Panel to manage users, process monthly draws, verify winners, and add/deactivate supported charities.

- **URL**: `http://localhost:5173/admin`
- **Default Admin ID**: `admin`
- **Default Password**: `Admin@123`

*(Note: The platform is fully integrated with the PostgreSQL database and Node.js API. All former "Demo Mode" and mock data features have been completely removed for production readiness.)*

## 🛡 System Design Highlights
- **Strict FIFO Scores**: Implemented within PostgreSQL block transactions to ensure a player only ever has their latest 5 scores active in the lottery.
- **Advanced Draw Algorithm**: The draw engine supports a pure `RANDOM` mode and an `ALGORITHMIC` mode that queries the last 6 months of historical score frequencies to calculate weighted probabilities.
- **Fail-safe Subscriptions**: Connected precisely to Stripe `checkout.session.completed` and `customer.subscription.deleted` events via cryptographically verified webhooks.

## 📝 License
Built by Samir Watgule. All rights reserved.
