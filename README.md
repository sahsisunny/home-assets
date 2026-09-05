# 🏠 Home Asset Manager

> **Everything you own. Everything it needs. One place.**  
> A personal digital operating system for household assets, purchase invoices, warranty lifecycles, and automated maintenance schedules.

---

## 📱 Tech Stack & Target Platforms

- **Backend API**: Node.js & TypeScript Modular Monolith (Express) on **Port `4005`**
- **Web App**: Next.js 14+ (App Router) Desktop & Tablet Dashboard on **Port `3010`**
- **Mobile App**: React Native (Expo SDK 51) Android-First & iOS Ready on **Port `8088`**
- **Database & Storage**: **PostgreSQL 16** (via Docker on port `5435`) + **Prisma ORM**.
- **Cache & Queues**: Redis 7 (via Docker on port `6382`) for BullMQ reminder schedules.
- **AI OCR**: Gemini 2.5 Flash structured multimodal invoice extraction.
- **Type Safety**: End-to-end strict TypeScript models with shared Zod validation schemas.

---

## 🏗️ Architecture & Monorepo Layout

This project is organized as a **Turborepo Monorepo** managed with `pnpm`:

```text
home_assets/
├── apps/
│   ├── server/             # Node.js TypeScript API (Port 4005)
│   │   ├── src/routes/     # Auth, Assets, Invoices (OCR), Documents, Reminders, Services
│   │   ├── src/services/   # User store, Prisma connection, Gemini OCR extraction
│   │   └── src/types/      # Strict TypeScript data models (No 'any' types)
│   │
│   ├── web/                # Next.js 14+ Web Application (Port 3010)
│   │   ├── src/app/        # Login, Register, Dashboard, Assets, Analytics
│   │   └── src/constants/  # Centralized API endpoints
│   │
│   └── mobile/             # React Native (Expo SDK 51) (Port 8088)
│       ├── src/screens/    # Viewfinder, OTP, Dashboard, Details, Documents
│       └── src/constants/  # Centralized API endpoints
│
├── packages/
│   ├── db/                 # Prisma PostgreSQL ORM schema, client & seed
│   ├── validation/         # Shared Zod validation schemas
│   └── tokens/             # Shared API endpoints, design tokens, currency (₹) & date formatters
│
├── docker-compose.yml      # PostgreSQL 16 (5435), Redis 7 (6382) & Adminer (8090)
├── .env.example            # Environment configuration template
├── package.json            # Root workspace scripts
└── turbo.json              # Turborepo task pipeline
```

---

## ⚡ Prerequisites

Before starting, ensure you have:

1. **Docker & Docker Compose**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for PostgreSQL & Redis)
2. **Node.js**: `v18.0.0` or higher (`node -v`)
3. **pnpm**: `v8.0.0` or higher (`npm i -g pnpm`)
4. **Mobile Testing** *(Optional)*:
   - **Expo Go App** on your Android/iOS physical device, **OR**
   - Android Studio Virtual Device (AVD).

---

## 🚀 Step-by-Step Startup Flow

### Step 1: Install Dependencies & Setup Environment

```bash
# 1. Navigate to the project root
cd home_assets

# 2. Install monorepo dependencies
pnpm install

# 3. Create .env configuration
cp .env.example .env
```

---

### Step 2: Start PostgreSQL & Redis Containers 🐳

```bash
# Start Docker containers in detached mode
pnpm docker:up

# Sync Prisma schema to PostgreSQL & Seed Categories
pnpm db:push
pnpm db:seed
```

- **PostgreSQL 16**: Running on `localhost:5435`
- **Redis 7**: Running on `localhost:6382`
- **Adminer DB Browser**: `http://localhost:8090`

---

### Step 3: Start the Backend Server ⚡

```bash
pnpm dev:server
```

- **API URL**: **`http://localhost:4005`**
- **Health Check**: `http://localhost:4005/health`
- **Database Connection**: Directly queries PostgreSQL via Prisma ORM.

---

### Step 4: Start the Web Dashboard 🌐

Open a new terminal and run:

```bash
pnpm dev:web
```

- **URL**: **`http://localhost:3010`**
- **Features**: User Registration (`/register`), Login (`/login`), Asset Catalog (`/assets`), Document Vault (`/documents`), Service Logs (`/services`), Warranty Reminders (`/reminders`), and Analytics (`/analytics`).

---

### Step 5: Start the Mobile App (Android / iOS) 📱

Open a new terminal and run:

```bash
pnpm dev:mobile
```

- Metro Bundler runs on port **`8088`** (configured to prevent port collisions).
- Press **`a`** to open on an Android Emulator.
- Press **`w`** to open mobile in the web browser.
- Or scan the displayed QR code with the **Expo Go** app on your physical smartphone.

---

### 🔥 Run Everything Together (All Services)

To run Server, Web, and Mobile simultaneously with one command:

```bash
pnpm dev
```

---

## 👤 Real User Onboarding & Testing Flow

There is **no hardcoded or mock user data required**. You can test the complete real user flow:

1. **Register**: Go to `http://localhost:3010/register` (or Mobile Register screen) and sign up with your name, email, and password.
2. **PostgreSQL Provisioning**: A real user record in `prisma.user` and household in `prisma.household` are automatically created.
3. **Add Assets**: Add your first appliance or electronics asset manually or scan an invoice.
4. **Upload Invoices & Docs**: Attach warranty receipts, bills, and user manuals.
5. **Set Service Reminders**: Schedule upcoming AC servicing, RO filter replacements, or vehicle maintenance.
6. **Data Safety**: Stop the server (`Ctrl + C`) and restart it — all records are safely stored in PostgreSQL.


- **PostgreSQL 16**: `localhost:5435`
- **Redis 7**: `localhost:6382`
- **Adminer DB Browser**: `http://localhost:8090`

---

## ⚙️ Port Mapping Reference

| Service | Port | URL / Connection |
| :--- | :--- | :--- |
| **Backend API Server** | `4005` | `http://localhost:4005` |
| **Web Dashboard** | `3010` | `http://localhost:3010` |
| **Mobile Metro Bundler** | `8088` | `http://localhost:8088` |
| **Prisma Studio GUI** | `5558` | `http://localhost:5558` |
| **Adminer DB Web UI** | `8090` | `http://localhost:8090` |
| **PostgreSQL Database** | `5435` | `localhost:5435` |
| **Redis Cache & Queue** | `6382` | `localhost:6382` |

---

## 🛠️ Monorepo Commands Cheat Sheet

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start Server, Web, and Mobile in parallel |
| `pnpm dev:server` | Start Node.js API server (`:4005`) |
| `pnpm dev:web` | Start Next.js web application (`:3010`) |
| `pnpm dev:mobile` | Start Expo mobile app (`:8088`) |
| `pnpm build` | Build production bundles for all apps |
| `pnpm typecheck` | Run TypeScript strict checks across entire workspace |
| `pnpm docker:up` | Start PostgreSQL 16 & Redis containers |
| `pnpm docker:down` | Stop Docker containers |
| `pnpm db:push` | Sync Prisma schema with Docker PostgreSQL |
| `pnpm db:studio` | Launch Prisma Studio database GUI |

---

## 🌐 100% Free Cloud Deployment

You can deploy the complete application completely for **free** without any paid subscriptions:

| Layer | Recommended Free Platform | Setup Guide |
| :--- | :--- | :--- |
| **PostgreSQL Database** | **[Neon.tech](https://neon.tech)** (0.5 GB Free Serverless Postgres) | [Neon Setup](doc/DEPLOYMENT.md#1-step-1-deploy-postgresql-database-neontech---2-mins) |
| **Web Dashboard (Next.js)** | **[Vercel](https://vercel.com)** (Unlimited hobby hosting) | [Vercel Setup](doc/DEPLOYMENT.md#3-step-3-deploy-web-dashboard-vercel) |
| **Backend API (Node.js)** | **[Render.com](https://render.com)** (750 free web service hours/mo) | [Render Setup](doc/DEPLOYMENT.md#2-step-2-deploy-backend-server-rendercom) |
| **Mobile App (Android/iOS)** | **[Expo EAS](https://expo.dev)** (Free cloud `.apk` builds) | [Expo EAS Setup](doc/DEPLOYMENT.md#4-step-4-build--preview-mobile-app-expo-eas) |

> 📖 **Read the full step-by-step instructions in [doc/DEPLOYMENT.md](doc/DEPLOYMENT.md).**

---

## 📄 License
Private & Proprietary — Home Asset Manager v1.0.


