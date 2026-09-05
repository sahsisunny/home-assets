# 🌐 100% Free Tier Deployment Guide

This guide details how to deploy the entire **Home Asset Manager** stack completely for **free** using modern cloud hosting platforms.

---

## 🗺️ Recommended Free Architecture

| Layer | Service | Free Tier Limits | Why it's best |
| :--- | :--- | :--- | :--- |
| **Database** | **[Neon.tech](https://neon.tech)** or **[Supabase](https://supabase.com)** | 0.5 GB storage, serverless autoscaling | Native PostgreSQL 16 connection string, zero configuration with Prisma ORM |
| **Web Dashboard** | **[Vercel](https://vercel.com)** | Unlimited bandwidth & builds for hobby projects | Official Next.js creator, zero-config monorepo deployment with SSR/Edge |
| **Backend API** | **[Render.com](https://render.com)** or **[Railway](https://railway.app)** | 750 free instance hours/month | One-click Node.js Docker / Web service deployment directly from GitHub |
| **Mobile App** | **[Expo EAS](https://expo.dev)** | Free cloud builds for Android (`.apk`/`.aab`) & iOS | No local Android Studio / Xcode build machine needed |
| **Cache / Queue** | **[Upstash Redis](https://upstash.com)** | 10,000 requests/day | Serverless Redis with zero idle cost |

---

## 1️⃣ Step 1: Deploy PostgreSQL Database (Neon.tech - 2 Mins)

1. Sign up for free at **[neon.tech](https://neon.tech)** (using your GitHub account `sahsisunny`).
2. Create a new project named: `home-assets-db`.
3. Neon will give you a PostgreSQL connection string that looks like:
   ```text
   postgresql://username:password@ep-cool-pool-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Copy this connection string. It will be your `DATABASE_URL`.

---

## 2️⃣ Step 2: Deploy Backend Server (Render.com)

1. Sign up for free at **[render.com](https://render.com)** with GitHub.
2. Click **New +** → **Web Service**.
3. Select your GitHub repository: `sahsisunny/home-assets`.
4. Configure the Web Service:
   - **Name**: `home-assets-api`
   - **Root Directory**: `apps/server` (or leave root with build filter)
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm --filter @home-assets/db db:generate && pnpm --filter @home-assets/server build`
   - **Start Command**: `node apps/server/dist/index.mjs`
   - **Instance Type**: `Free`
5. Add **Environment Variables**:
   - `DATABASE_URL`: *(Your Neon PostgreSQL connection string from Step 1)*
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default assigned by Render)
   - `JWT_SECRET`: `your_random_secure_jwt_secret_key`
   - `GEMINI_API_KEY`: *(Optional Google AI Studio key for Invoice OCR)*
6. Click **Deploy Web Service**.
7. Once deployed, Render provides your public API URL (e.g., `https://home-assets-api.onrender.com`).
8. Run initial database migration against Neon from your local terminal:
   ```bash
   DATABASE_URL="your_neon_database_url" pnpm db:push
   DATABASE_URL="your_neon_database_url" pnpm db:seed
   ```

---

## 3️⃣ Step 3: Deploy Web Dashboard (Vercel)

1. Sign up for free at **[vercel.com](https://vercel.com)** with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository: `sahsisunny/home-assets`.
4. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: click **Edit** and choose `apps/web`.
   - **Build Command**: `pnpm build`
5. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://home-assets-api.onrender.com` (Your Render API URL from Step 2).
6. Click **Deploy**.
7. Vercel will build and give you a live production URL: `https://home-assets-web.vercel.app`.

---

## 4️⃣ Step 4: Build & Preview Mobile App (Expo EAS)

### A. Instant Preview with Expo Go (Zero Build)
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Update `apps/mobile/src/constants/api.ts` or set your production API URL.
3. Run locally: `pnpm dev:mobile` and scan the QR code.

### B. Generate Standalone Android APK (Free with EAS Build)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with your Expo account:
   ```bash
   eas login
   ```
3. Inside `apps/mobile`:
   ```bash
   cd apps/mobile
   eas build -p android --profile preview
   ```
4. Expo's cloud will compile your project and give you a direct download link to install the `.apk` on any Android smartphone!

---

## 🔄 Summary of Production URLs

Once deployed, your full-stack Home Asset Manager will be live:

- **Web Dashboard**: `https://home-assets-web.vercel.app`
- **Backend API**: `https://home-assets-api.onrender.com`
- **PostgreSQL Database**: `ep-cool-pool.us-east-2.aws.neon.tech` (Neon Free Tier)
- **Mobile Android App**: Direct `.apk` via Expo EAS Cloud
