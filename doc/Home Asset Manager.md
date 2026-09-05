# Home Asset Manager
## Product Requirements Document — MVP v1.0

**Product type:** Mobile-first web application / PWA  
**Target market:** India initially, expandable globally  
**Primary users:** Homeowners, renters, families, and people managing multiple household assets  
**Status:** Product Definition  
**Version:** 1.0

---

# 1. Product Overview

## 1.1 Product Vision

Home Asset Manager is a personal digital system for managing everything a person owns and needs to maintain at home.

The product combines:

- Asset inventory
- Purchase records
- Invoices and receipts
- Warranty tracking
- Maintenance schedules
- Repair history
- Product documents
- Asset valuation
- Notifications
- Household sharing

The core principle is:

> **The user should not have to remember what they own, where the documents are, when warranties expire, or when something needs maintenance.**

The application should proactively surface this information.

---

# 2. Problem Statement

Household asset information is currently fragmented.

A typical user may have:

- Purchase invoices in email
- Warranty cards in a drawer
- Manuals in different folders
- Service invoices in WhatsApp
- Serial numbers on physical products
- Maintenance history in memory
- Warranty dates that nobody remembers
- Multiple family members managing different purchases

When something breaks, the user often has to search through several places to answer simple questions:

> When did I buy this?

> Is it still under warranty?

> Where is the invoice?

> What model is this?

> When was it last serviced?

> How much did I pay?

> Who repaired it?

Home Asset Manager brings this information into one structured system.

---

# 3. Product Opportunity

Existing home inventory products primarily focus on **cataloguing possessions**.

Home Asset Manager should differentiate itself by focusing on:

### Asset → Document → Warranty → Maintenance → Action

Instead of simply telling the user:

> "You own a washing machine."

The application should tell them:

> "Your Bosch washing machine was purchased for ₹38,999. The warranty expires in 43 days. Its last service was 5 months ago. Your invoice is available. Maintenance is due in 12 days."

The product should become an **action-oriented home management system**, not a static inventory database.

---

# 4. Goals

## Primary Goals

1. Allow users to quickly add household assets.
2. Minimize manual data entry.
3. Automatically extract information from invoices and receipts.
4. Store important asset documents.
5. Track warranty periods.
6. Track maintenance and repair history.
7. Notify users about important upcoming events.
8. Give users a complete view of their household assets.
9. Allow users to share household information with family members.
10. Provide useful financial and maintenance insights.

## Secondary Goals

- Asset valuation
- Insurance documentation
- Resale preparation
- Product manuals
- Service provider records
- Household spending analytics

---

# 5. Non-Goals for MVP

The following should NOT be included in the first release:

- Marketplace
- Insurance purchasing
- Service-provider booking
- Product shopping
- Social network
- Smart-home integrations
- IoT integrations
- Automated resale marketplace
- Complex AI chatbot
- Banking integrations
- Payments

These can be considered after product-market validation.

---

# 6. Target Users

## Persona 1 — Homeowner

Owns many appliances and electronics.

Pain:

> "I don't remember when I bought this or whether the warranty is still active."

Needs:

- Warranty tracking
- Documents
- Maintenance reminders
- Asset history

---

## Persona 2 — Family Household

Multiple people purchase and maintain household products.

Pain:

> "My father bought the AC, my mother has the invoice, and I handle servicing."

Needs:

- Shared household
- Multiple users
- Asset ownership
- Shared documents
- Activity history

---

## Persona 3 — Tech/Organization-Focused User

Owns expensive electronics, computers, cameras, bikes, appliances, etc.

Pain:

> "I have invoices and warranty documents everywhere."

Needs:

- Digital records
- Search
- Documents
- Serial numbers
- Purchase information
- Asset valuation

---

## Persona 4 — Renter

Doesn't own the property but owns furniture, electronics and appliances.

Needs:

- Personal asset inventory
- Proof of ownership
- Warranty tracking
- Moving checklist
- Insurance documentation

---

# 7. Core Product Concept

Every asset has a centralized profile.

Example:

### Samsung 55" OLED TV

```text
Asset
├── Basic Information
│   ├── Brand
│   ├── Model
│   ├── Serial Number
│   └── Category
│
├── Purchase
│   ├── Date
│   ├── Price
│   └── Seller
│
├── Warranty
│   ├── Start Date
│   ├── End Date
│   └── Warranty Documents
│
├── Documents
│   ├── Invoice
│   ├── Warranty Card
│   ├── Manual
│   └── Other
│
├── Maintenance
│   ├── Service History
│   ├── Service Cost
│   └── Next Service
│
├── Notes
│
└── Activity History
```

---

# 8. MVP Features

## 8.1 Authentication

Users can:

- Create account
- Login
- Logout
- Reset password
- Verify email/mobile
- Continue with Google
- Continue with Apple

### Requirements

Authentication must support secure session management.

---

# 9. Onboarding

After registration:

### Step 1

```text
Welcome to Home Asset Manager

Keep your home's assets,
documents and maintenance
organized in one place.

[Get Started]
```

### Step 2

Ask:

```text
What do you want to manage?

☐ Appliances
☐ Electronics
☐ Furniture
☐ Vehicles
☐ Home Equipment
☐ Other
```

### Step 3

Offer:

```text
Add your first asset

[Scan Invoice]
[Add Manually]
```

The onboarding should lead directly into asset creation.

---

# 10. Dashboard

The dashboard is the primary screen.

### Information displayed

```text
Good Morning 👋

Total Assets
23

Total Purchase Value
₹12,45,000

────────────────────

At a Glance

2
Warranties Expiring

3
Maintenance Due

5
Documents Missing

────────────────────

Upcoming

AC Service
Due in 5 days

TV Warranty
Expires in 43 days

────────────────────

Recent Assets

Samsung OLED TV
LG AC
Bosch Washing Machine
Dyson Vacuum
```

### Dashboard actions

- Add Asset
- View Assets
- View Reminders
- Search
- Notifications

---

# 11. Asset Management

## Asset List

Users can view all assets.

### Filters

- All
- Appliances
- Electronics
- Furniture
- Vehicles
- Equipment
- Other

### Sorting

- Recently Added
- Purchase Date
- Purchase Price
- Warranty Expiry
- Maintenance Due
- Name

### Search

Search by:

- Product name
- Brand
- Model
- Serial number
- Category

---

# 12. Add Asset

The application should provide three methods.

## Method 1 — Scan Invoice

Primary CTA.

```text
Scan Invoice / Receipt

Take a photo of your invoice.
We'll extract the details automatically.

[Scan Invoice]
```

---

## Method 2 — Add Manually

Fields:

```text
Asset Name *
Category *
Brand
Model
Serial Number
Purchase Date
Purchase Price
Seller
Location
Warranty Start
Warranty End
Notes
```

---

## Method 3 — Add Without Invoice

Useful when the user does not have the original invoice.

The user can create the asset and add documents later.

---

# 13. Invoice Scanning

This is one of the product's most important features.

## Flow

```text
Camera
   ↓
Capture Invoice
   ↓
Upload
   ↓
OCR
   ↓
AI Extraction
   ↓
Validation
   ↓
User Review
   ↓
Create Asset
```

The system should attempt to extract:

- Seller
- Invoice number
- Invoice date
- Product name
- Brand
- Model
- Serial number
- Quantity
- Purchase price
- Taxes
- Total amount
- Warranty information, when present

---

# 14. AI Extraction

Example:

### Input

Invoice image.

### Output

```text
Product
Samsung 55" OLED TV

Brand
Samsung

Model
QA55S90CAKXXL

Purchase Date
03 Sep 2025

Purchase Price
₹69,999

Seller
Croma

Serial Number
01A1B2C3D4E5F6G7
```

The user MUST be able to review and edit extracted information before saving.

### Important requirement

AI should never silently create incorrect records.

Use:

```text
Extract → Review → Confirm
```

not:

```text
Extract → Automatically save
```

---

# 15. Asset Details

Each asset gets a dedicated page.

### Header

```text
Samsung 55" OLED TV
Electronics

🟢 Warranty Active
```

### Summary

```text
Purchase Price     ₹69,999
Current Value      ₹48,000

Purchased          03 Sep 2025
Warranty Until     03 Sep 2026
```

### Tabs

```text
Overview
Documents
Service
History
Notes
```

---

# 16. Documents

Users can attach documents to assets.

### Document types

- Invoice
- Receipt
- Warranty
- Manual
- Insurance
- Service invoice
- Purchase agreement
- Other

### Supported files

- PDF
- JPG
- PNG
- WEBP

### Document actions

- Preview
- Download
- Rename
- Replace
- Delete
- Share

---

# 17. Warranty Management

Each asset can have:

```text
Warranty Provider
Warranty Type
Start Date
End Date
Warranty Number
Warranty Document
```

### Warranty status

🟢 Active

🟡 Expiring Soon

🔴 Expired

### Reminder schedule

Default:

- 30 days before expiry
- 7 days before expiry
- 1 day before expiry

Users can customize reminder preferences.

---

# 18. Maintenance Management

Users can add maintenance schedules.

Example:

```text
LG AC

Maintenance
──────────────

Last Service
12 Aug 2026

Next Service
12 Feb 2027

Frequency
6 months
```

### Maintenance types

- Scheduled maintenance
- Cleaning
- Filter replacement
- Inspection
- Repair
- Part replacement
- Other

---

# 19. Service History

Example:

```text
12 Aug 2026
AC General Service
₹2,499

Technician:
ABC Services

Notes:
Filter cleaned
Gas pressure checked
```

Users can attach:

- Service invoice
- Photos
- Technician details
- Notes

---

# 20. Reminder System

Central reminder screen.

Categories:

### Due Today

```text
🔴 AC Service
Due today
```

### This Month

```text
🟡 Washing Machine Service
Due in 12 days
```

### Warranty

```text
🟠 Samsung TV Warranty
Expires in 43 days
```

Users can:

- Mark complete
- Snooze
- Change date
- Delete reminder

---

# 21. Notifications

Notification types:

### Warranty

> Your Samsung TV warranty expires in 30 days.

### Maintenance

> Your AC service is due in 7 days.

### Document

> Your Bosch washing machine has no invoice attached.

### System

> Your weekly home summary is ready.

Notifications should be useful and limited.

Avoid notification spam.

---

# 22. Home / Household

Users can create a household.

Example:

```text
Sunny's Home

Members
────────────

Sunny
Owner

Rahul
Member

Priya
Member
```

Members can have permissions.

### Roles

**Owner**

Full access.

**Admin**

Can add/edit assets and documents.

**Member**

Can view and optionally add assets.

---

# 23. Asset Ownership

Assets can optionally belong to:

- Me
- Spouse
- Parent
- Child
- Shared
- Other

This becomes particularly useful for family households.

---

# 24. Locations

Users can specify where an asset is located.

Examples:

```text
Living Room
Bedroom
Kitchen
Garage
Office
Storage
Other
```

This enables future features such as:

> "Show me everything in my garage."

---

# 25. Analytics

Analytics should be introduced after the basic asset workflow works.

### Dashboard

```text
Total Purchase Value
₹12,45,000

Estimated Current Value
₹8,75,000

Total Maintenance Spend
₹18,420
```

### Categories

```text
Electronics      ₹6,12,000
Appliances       ₹4,20,000
Furniture        ₹2,43,000
Other            ₹1,30,000
```

### Maintenance spending

Monthly/yearly charts.

---

# 26. Asset Value

Users can manually specify:

```text
Purchase Value
Current Estimated Value
```

Do NOT build automated market valuation in MVP.

Future versions can potentially estimate values using:

- Product age
- Purchase price
- Model
- Market data
- Resale listings

---

# 27. Search

Global search should support:

```text
Samsung
QA55
₹69,999
Living Room
Invoice
Warranty
```

Results can include:

- Assets
- Documents
- Services
- Reminders

---

# 28. Global Navigation

Recommended mobile navigation:

```text
Home
Assets
   +
Reminders
Documents
More
```

The central `+` button should provide:

```text
Add Asset
Scan Invoice
Add Document
Add Service
Add Reminder
```

---

# 29. UX Principles

## Principle 1 — Minimum Data Entry

The application should always prefer:

```text
Scan → Extract → Review
```

over:

```text
Fill 15 fields
```

---

## Principle 2 — Action Over Storage

Don't just show information.

Show what the user should do.

Bad:

> Warranty ends 12 October.

Better:

> Warranty expires in 39 days — check whether you need a service before expiry.

---

## Principle 3 — Progressive Disclosure

Don't overwhelm the user during asset creation.

Start with:

```text
Name
Category
Invoice
```

Then enrich the asset.

---

## Principle 4 — Trust

AI-generated data must be clearly identified as extracted information until the user confirms it.

---

# 30. Data Model

Core entities:

```text
User
Household
HouseholdMember

Asset
AssetCategory
AssetLocation
AssetOwner

Document

Warranty

MaintenanceSchedule
MaintenanceRecord

Reminder

Notification

Invoice
InvoiceItem

AssetActivity
```

### Simplified relationship

```text
User
 │
 └── Household
       │
       ├── Members
       │
       └── Assets
             │
             ├── Documents
             ├── Warranty
             ├── Maintenance
             ├── Reminders
             └── Activity
```

---

# 31. Suggested Asset Schema

```text
Asset
-------------------------
id
household_id
name
category_id
brand
model
serial_number
purchase_date
purchase_price
current_value
seller
location_id
owner_id
image_url
notes
created_at
updated_at
```

---

# 32. Document Schema

```text
Document
-------------------------
id
asset_id
type
name
file_url
mime_type
file_size
uploaded_by
created_at
```

---

# 33. Warranty Schema

```text
Warranty
-------------------------
id
asset_id
provider
warranty_number
start_date
end_date
document_id
created_at
updated_at
```

---

# 34. Maintenance Schema

```text
MaintenanceSchedule
-------------------------
id
asset_id
title
frequency
next_due_date
last_completed_date
enabled
```

```text
MaintenanceRecord
-------------------------
id
asset_id
type
title
description
cost
service_provider
service_date
next_service_date
document_id
created_by
```

---

# 35. API Architecture

Recommended REST API initially.

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Assets

```http
GET    /api/assets
POST   /api/assets
GET    /api/assets/:id
PATCH  /api/assets/:id
DELETE /api/assets/:id
```

### Documents

```http
GET    /api/assets/:id/documents
POST   /api/assets/:id/documents
DELETE /api/documents/:id
```

### Warranty

```http
GET   /api/assets/:id/warranty
POST  /api/assets/:id/warranty
PATCH /api/warranties/:id
```

### Maintenance

```http
GET  /api/assets/:id/maintenance
POST /api/assets/:id/maintenance
```

### Invoice processing

```http
POST /api/invoices/upload
POST /api/invoices/:id/process
GET  /api/invoices/:id
```

---

# 36. Finalized Technical Architecture

### Architecture Overview (Mobile-First Turborepo Monorepo)

```text
                      ┌──────────────────────────────────────────────┐
                      │            Turborepo Monorepo                │
                      └───────┬──────────────────────────────┬───────┘
                              │                              │
               ┌──────────────▼──────────────┐ ┌─────────────▼─────────────┐
               │   Mobile App (Android/iOS)  │ │      Web App / Portal     │
               │   React Native (Expo SDK)   │ │    Next.js (App Router)   │
               │   Tailored for Camera & OCR │ │   Desktop & Tablet Views  │
               └──────────────┬──────────────┘ └─────────────┬─────────────┘
                              │                              │
                              └──────────────┬───────────────┘
                                             │
                              ┌──────────────▼──────────────┐
                              │ Shared Packages (TS / Zod)  │
                              │ - Data Models & Validation  │
                              │ - API Client (Fetch/Query)  │
                              │ - Design & Currency Tokens  │
                              └──────────────┬──────────────┘
                                             │
               ┌─────────────────────────────▼─────────────────────────────┐
               │                 Backend & Cloud Services                  │
               │                                                           │
               │  • API / Server: Node.js / Express / Hono (TypeScript)    │
               │  • Database: PostgreSQL + Prisma ORM                      │
               │  • Auth: Supabase Auth (Email, Phone OTP via MSG91/Twilio)│
               │  • File Storage: S3 / Cloudflare R2 (Private Signed URLs) │
               │  • AI / OCR: Gemini 2.5 Flash Structured JSON Extraction  │
               │  • Task Queue: Redis + BullMQ (Warranty & Reminders)      │
               │  • Push Notifications: Firebase Cloud Messaging (FCM)     │
               └───────────────────────────────────────────────────────────┘
```

### Approved Tech Stack

```text
Monorepo Management:
Turborepo + pnpm workspaces

Mobile Application (Priority 1):
• Framework: React Native with Expo SDK (TypeScript)
• Platform Target: Android first (Google Play & APK), iOS ready
• Navigation: Expo Router (file-based navigation)
• Camera & Document Scanner: expo-camera / react-native-document-scanner-plugin
• Local Cache: MMKV / React Query (Offline-first support)
• UI Styling: NativeWind / Tailwind CSS + Design Tokens

Web Application (Priority 2):
• Framework: Next.js 14+ (App Router) with TypeScript
• Styling: Tailwind CSS + Radix UI primitives

Backend API:
• Runtime: Node.js / TypeScript Modular Monolith
• Framework: Express / Hono
• Database: PostgreSQL
• ORM: Prisma ORM
• Background Queues: Redis + BullMQ (for automated warranty expiry & maintenance cron triggers)

Storage & AI Pipeline:
• Object Storage: Cloudflare R2 / AWS S3 (private buckets, signed short-lived URLs)
• AI Invoice Extraction: Multimodal Gemini 2.5 Flash with structured JSON schemas
• Document Processing: Edge perspective crop + OCR + LLM structured normalization

Authentication & Push:
• Authentication: Email/Password, Mobile OTP (India SMS via MSG91), Google/Apple Sign-In
• Push Notifications: Firebase Cloud Messaging (FCM) + expo-notifications
```

### Monorepo Structure

```text
home-asset-manager/
├── apps/
│   ├── mobile/             # React Native (Expo) - Android First
│   ├── web/                # Next.js Web App
│   └── server/             # Node.js TypeScript API & Background Jobs
│
├── packages/
│   ├── db/                 # Prisma schema & PostgreSQL client
│   ├── validation/         # Shared Zod validation schemas
│   └── tokens/             # Design tokens, colors, INR currency formatters
│
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # Workspace packages definition
├── turbo.json              # Turborepo task pipeline
└── tsconfig.base.json      # Base TypeScript configuration
```

---

# 37. Security Requirements

This application will contain sensitive household information.

Requirements:

- HTTPS everywhere
- Encrypted data in transit
- Encrypted object storage
- Secure authentication
- Strong password hashing
- Authorization checks on every asset/document
- Household-level access control
- Signed/private document URLs
- File type validation
- File size limits
- Malware scanning where appropriate
- Audit logging for sensitive actions
- Account deletion
- Data export

Documents must NEVER be publicly accessible by predictable URLs.

---

# 38. Privacy

The product should clearly communicate:

> Your documents belong to you.

Users should be able to:

- Export their data
- Delete individual documents
- Delete individual assets
- Delete their entire account
- Remove household members

AI processing should be transparent.

The product should clearly state what happens to uploaded invoices and documents.

---

# 39. MVP Screen List

### Authentication

1. Splash
2. Welcome
3. Login
4. Register
5. Forgot Password
6. OTP Verification
7. Reset Password

### Main App

8. Dashboard
9. Asset List
10. Asset Search
11. Asset Categories
12. Add Asset
13. Scan Invoice
14. Invoice Processing
15. Review Extracted Data
16. Asset Details
17. Edit Asset

### Documents

18. Documents
19. Document Preview
20. Add Document

### Maintenance

21. Reminders
22. Add Reminder
23. Maintenance History
24. Add Service Record

### Household

25. Household
26. Members
27. Invite Member
28. Permissions

### Account

29. Profile
30. Settings
31. Notification Settings
32. Privacy
33. Data Export
34. Delete Account

---

# 40. MVP User Journey

The most important journey:

```text
User registers
      ↓
Dashboard
      ↓
"Add your first asset"
      ↓
Scan Invoice
      ↓
Take picture
      ↓
AI extracts information
      ↓
Review
      ↓
Confirm
      ↓
Asset created
      ↓
Warranty detected
      ↓
Reminder created
      ↓
Dashboard updated
```

Target:

### **First asset created in < 60 seconds.**

That should be one of the key product metrics.

---

# 41. MVP Success Metrics

## Activation

Percentage of new users who create their first asset.

Target:

**>60%**

## Invoice adoption

Percentage of assets created through invoice scanning.

Target:

**>50%**

## Time to first asset

Target:

**<60 seconds**

## Retention

30-day returning users.

Target:

**>25% initially**

## Reminder engagement

Percentage of users interacting with reminders.

Target:

**>30%**

## Assets per active user

Target:

**5+ assets**

---

# 42. Monetization

## Free

```text
20 assets
Basic documents
Basic reminders
Manual asset creation
```

## Pro

Potential price:

### India

₹99–199/month

### Global

$2.99–4.99/month

Features:

- Unlimited assets
- AI invoice extraction
- Advanced reminders
- Family sharing
- Advanced analytics
- More document storage
- Data export
- Priority processing

Do not put basic functionality behind a paywall before proving retention.

---

# 43. Future Roadmap

## Phase 2 — Intelligence

```text
AI invoice extraction
AI document classification
AI warranty detection
AI maintenance suggestions
```

## Phase 3 — Home Management

```text
Service providers
Maintenance booking
Repair records
Insurance records
```

## Phase 4 — Financial

```text
Asset depreciation
Home net worth
Maintenance spending
Replacement planning
```

## Phase 5 — Ecosystem

```text
Service marketplace
Insurance
Resale
Extended warranty
Product replacement
```

---

# 44. Potential Killer Features

## 44.1 "What needs attention?"

Instead of browsing the application:

```text
WHAT NEEDS ATTENTION?

🔴 1 urgent

AC warranty expires soon

🟡 3 upcoming

Washing machine service
RO filter replacement
TV warranty
```

---

## 44.2 AI Home Assistant

Eventually:

> "Which appliances are still under warranty?"

> "How much did I spend on maintenance this year?"

> "Show me everything I bought in 2025."

> "Where is my TV invoice?"

> "Which warranties expire next month?"

The assistant should query the user's structured asset data rather than behave like a generic chatbot.

---

## 44.3 Emergency Mode

Future feature:

> **"My appliance stopped working."**

The app shows:

```text
LG AC

Warranty:
ACTIVE

Invoice:
AVAILABLE

Serial:
XXXXXX

Last Service:
12 Aug 2026

Service Provider:
ABC Services

[View Warranty]
[View Invoice]
[Find Service]
```

This is a much stronger experience than simply storing documents.

---

# 45. Competitive Positioning

Do NOT position the product as:

> "An app to keep track of your belongings."

Position it as:

> **"Everything you own. Everything it needs. One place."**

Alternative:

> **"Know what you own. Know what's covered. Know what needs attention."**

The product's differentiation should come from:

1. Extremely fast asset creation
2. AI invoice extraction
3. Warranty intelligence
4. Maintenance automation
5. Action-oriented dashboard
6. Family/household collaboration
7. India-first localization

---

# 46. India-First Opportunities

For India, the application can eventually support:

- ₹ currency
- GST invoices
- Indian retailers
- WhatsApp document workflows
- UPI-related purchase references
- Indian warranty formats
- Indian appliance brands
- Indian service providers
- Regional languages
- WhatsApp notifications

However, these should come **after the basic product proves useful**.

---

# 47. MVP Development Priority

### P0 — Absolutely required

```text
Authentication
Dashboard
Asset CRUD
Categories
Invoice upload
OCR/AI extraction
Asset details
Documents
Warranty
Basic reminders
Search
```

### P1 — Important

```text
Maintenance
Service history
Household sharing
Notifications
Asset locations
```

### P2 — Later

```text
Analytics
Asset valuation
AI assistant
Insurance
Marketplace
Service booking
Resale
```

---

# 48. 30-Day Development Plan

## Week 1 — Foundation

```text
Day 1
Project setup

Day 2
Authentication

Day 3
Database schema

Day 4
Household + user model

Day 5
Asset CRUD

Day 6
Asset list/details

Day 7
Dashboard
```

## Week 2 — Documents

```text
Day 8
File storage

Day 9
Document upload

Day 10
Document preview

Day 11
Invoice upload

Day 12
OCR integration

Day 13
AI extraction

Day 14
Review extracted data
```

## Week 3 — Warranty + Maintenance

```text
Day 15
Warranty model

Day 16
Warranty UI

Day 17
Reminder engine

Day 18
Notification system

Day 19
Maintenance model

Day 20
Service history

Day 21
Asset timeline
```

## Week 4 — Polish + Beta

```text
Day 22
Search

Day 23
Filters

Day 24
Mobile UX

Day 25
Error handling

Day 26
Security review

Day 27
Performance

Day 28
Analytics

Day 29
Bug fixing

Day 30
Private beta
```

---

# 49. First Release Definition

The first release is successful if a user can do this:

```text
Register
   ↓
Add Home
   ↓
Scan an invoice
   ↓
AI extracts product details
   ↓
Confirm
   ↓
Asset created
   ↓
Invoice attached
   ↓
Warranty recorded
   ↓
Reminder scheduled
   ↓
Return later
   ↓
See exactly what needs attention
```

If this workflow feels excellent, **you have an MVP**.

If you add 50 more features without making this workflow excellent, you don't.

---

# 50. Product North Star

The long-term product should answer four questions instantly:

### 1. What do I own?

**Assets**

### 2. Where is the information?

**Documents**

### 3. Is it protected?

**Warranty / Insurance**

### 4. What do I need to do?

**Maintenance / Reminders**

Therefore:

> **Home Asset Manager = Inventory + Documents + Warranty + Maintenance + Intelligence**

The database is not the product.

**The product is reducing the mental load of managing the things you own.**