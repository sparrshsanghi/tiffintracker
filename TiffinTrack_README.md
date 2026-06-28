# 🍱 TiffinTrack

> **Modern delivery & payment management for home tiffin businesses.**
> घर के टिफ़िन व्यवसाय के लिए डिजिटल प्रबंधन प्रणाली।

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Functions-FFCA28?logo=firebase)](https://firebase.google.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)](https://tailwindcss.com)

---

## 📋 Overview

TiffinTrack is a role-based delivery and business management web app built for small home tiffin and catering businesses in India. It replaces paper-based order tracking, payment registers, and WhatsApp message drafting with a single mobile-friendly interface.

Three separate portals — **Owner**, **Delivery Person**, and **Customer** — each see only what they need, with real-time updates across all roles powered by Firebase Firestore.

---

## ✨ Features

| Feature | Owner | Delivery | Customer |
|---|:---:|:---:|:---:|
| View today's deliveries | ✅ | ✅ | ✅ |
| Update delivery status | ✅ | ✅ | — |
| Manage customers | ✅ | — | — |
| Track payments (monthly) | ✅ | — | ✅ |
| Confirm & notify payment | ✅ | — | — |
| Plan weekly menu | ✅ | — | — |
| View this week's menu | ✅ | — | ✅ |
| WhatsApp delivery alerts | ✅ | ✅ | — |
| In-app notifications | ✅ | — | ✅ |
| Payment reminders (WhatsApp) | ✅ | — | — |
| Send "I've Paid" to owner | — | — | ✅ |

---

## 👥 Role-Based Access

```
┌─────────────────────────────────────────────────────────────┐
│                     Role Select Screen                       │
├──────────────────┬──────────────────┬───────────────────────┤
│  👔 Business     │  🚴 Delivery     │  👤 Customer          │
│  Owner           │  Person          │  Portal               │
│                  │                  │                       │
│  PIN: Manager    │  PIN: Delivery   │  Phone number         │
│  (set in app)    │  (set by owner)  │  (registered)         │
│                  │                  │                       │
│  Full access     │  Orders only     │  Own data only        │
└──────────────────┴──────────────────┴───────────────────────┘
```

**Default credentials (first run):**
- Manager PIN: `0000`
- Delivery PIN: `1234`
- Customer: any registered phone number

> ⚠️ Change both PINs immediately from **Settings → Access PINs** after first login.

---

## 📖 User Guide / उपयोगकर्ता मार्गदर्शिका

### 👔 Owner / मालिक

**English**

1. Open the app → tap **Business Owner** → enter your PIN.
2. **Overview** tab shows today's delivery progress and this month's collection at a glance.
3. **Delivery** tab — tap *Mark → Out for Delivery* or *Mark → Delivered* for each customer. Customers are notified automatically.
4. **Customers** tab — add new customers with their name, phone, address, food order, plan (daily/monthly), and monthly rate. Tap **Pause** to skip a customer for a few days.
5. **Payments** tab — select a month using ‹ › arrows. For each unpaid customer, tap **Confirm & Notify** (full amount) or **Partial** (enter custom amount). The customer gets an in-app notification instantly.
6. **Menu** tab — enter each day's items (one per line). Tap **Share Weekly Menu on WhatsApp** to send the full week's plan to your customer group.
7. **Settings** tab — change the Delivery PIN and Manager PIN at any time.
8. Tap **Reset for New Day** on the Overview quick-actions each morning to reset delivery statuses.

---

**हिंदी**

1. ऐप खोलें → **Business Owner** चुनें → अपना PIN डालें।
2. **Overview** टैब पर आज की डिलीवरी की प्रगति और इस महीने का कलेक्शन एक नजर में देखें।
3. **Delivery** टैब — हर ग्राहक के लिए *Mark → Out for Delivery* या *Mark → Delivered* दबाएं। ग्राहक को अपने-आप सूचना मिल जाएगी।
4. **Customers** टैब — नए ग्राहक का नाम, फोन, पता, खाना, प्लान (daily/monthly) और महीने की रकम डालकर जोड़ें। कुछ दिनों के लिए रोकना हो तो **Pause** दबाएं।
5. **Payments** टैब — ‹ › से महीना चुनें। जिसने पेमेंट नहीं की, उनके लिए **Confirm & Notify** (पूरी रकम) या **Partial** (जितनी मिली उतनी) दबाएं। ग्राहक को तुरंत सूचना मिलेगी।
6. **Menu** टैब — हर दिन का खाना एक-एक लाइन में लिखें। **Share Weekly Menu on WhatsApp** दबाकर पूरे हफ्ते का मेनू WhatsApp ग्रुप पर भेजें।
7. **Settings** टैब — Delivery PIN और Manager PIN कभी भी बदल सकते हैं।
8. हर सुबह Overview के **Reset for New Day** बटन से डिलीवरी स्टेटस रीसेट करें।

---

### 🚴 Delivery Person / डिलीवरी कर्मचारी

**English**

1. Open the app → tap **Delivery Person** → enter the PIN given by the owner.
2. You will see a list of today's customers with their name, address, and food order.
3. Tap **Mark → Out for Delivery** when you leave, and **Mark → Delivered** once you hand over the food.
4. Use the **WhatsApp** button on each card to send the customer a quick status update.
5. Tap **↻ Refresh** to reload the latest list if the owner added or changed anything.
6. Tap **Reset** only if instructed by the owner (resets all statuses to Pending).

---

**हिंदी**

1. ऐप खोलें → **Delivery Person** चुनें → मालिक का दिया PIN डालें।
2. आज के सभी ग्राहकों की लिस्ट दिखेगी — नाम, पता और खाना।
3. घर से निकलते वक्त **Mark → Out for Delivery** दबाएं, और खाना देते वक्त **Mark → Delivered** दबाएं।
4. हर कार्ड पर **WhatsApp** बटन दबाकर ग्राहक को स्टेटस भेज सकते हैं।
5. अगर मालिक ने कुछ बदला हो, तो **↻ Refresh** दबाएं।
6. **Reset** केवल मालिक के कहने पर दबाएं।

---

### 👤 Customer / ग्राहक

**English**

1. Open the app → tap **I'm a Customer** → enter your registered mobile number.
2. **Home** tab — see today's delivery status and today's menu at a glance.
3. **Menu** tab — view the full week's menu. Today is highlighted.
4. **Payment** tab — see how much you have paid this month vs. the total due. Tap **Send "I've Paid" to Owner** to send the owner a WhatsApp confirmation once you've made a payment.
5. **Alerts** tab — all notifications from the owner appear here (payment confirmed, food on the way, food delivered). A badge shows unread count.
6. Tap **↻ Refresh** to get the latest status updates.

---

**हिंदी**

1. ऐप खोलें → **I'm a Customer** चुनें → अपना रजिस्टर्ड मोबाइल नंबर डालें।
2. **Home** टैब — आज की डिलीवरी की स्थिति और आज का मेनू एक नजर में देखें।
3. **Menu** टैब — पूरे हफ्ते का खाना देखें। आज का दिन हाइलाइट रहेगा।
4. **Payment** टैब — इस महीने कितना दिया और कितना बाकी है देखें। पेमेंट करने के बाद **Send "I've Paid" to Owner** दबाएं — मालिक को WhatsApp जाएगा।
5. **Alerts** टैब — मालिक की सभी सूचनाएं यहाँ दिखती हैं (पेमेंट कन्फर्म, खाना रास्ते में, खाना पहुंच गया)। अनपढ़ी सूचनाओं की गिनती बैज पर दिखती है।
6. नए अपडेट के लिए **↻ Refresh** दबाएं।

---

## 🛠️ Recommended Tech Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| Framework | React 18 (Vite) | Fast build, ecosystem |
| Styling | Tailwind CSS | Utility-first, mobile-first |
| State | React Context + `useState` | No heavy state library needed at this scale |
| Real-time | Firebase SDK (`onSnapshot`) | Push updates without polling |
| Hosting | Vercel | Zero-config React deployment |

### Backend
| Layer | Technology | Reason |
|---|---|---|
| Database | Firebase Firestore | Real-time, NoSQL, scales automatically |
| Functions | Firebase Cloud Functions v2 | Serverless, no infra to manage |
| Auth | Custom PIN (SHA-256 hash stored in Firestore) | Keeps existing UX, no OTP cost |
| Notifications | Firestore real-time listeners | Instant in-app alerts without FCM complexity |
| File Storage | Not needed (text/JSON only) | — |

> **Why not Node + Express?** For a single-business app with < 50 users, Cloud Functions eliminate server cost and maintenance entirely. If TiffinTrack scales to multiple businesses (SaaS), add an Express API layer on Cloud Run.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL — React Frontend                    │
│                                                              │
│   ┌────────────┐   ┌─────────────────┐   ┌──────────────┐  │
│   │  Manager   │   │ Delivery Person  │   │   Customer   │  │
│   │  Portal    │   │     Portal       │   │   Portal     │  │
│   └─────┬──────┘   └────────┬─────────┘   └──────┬───────┘  │
└─────────┼────────────────────┼────────────────────┼──────────┘
          │                    │                    │
          └────────────────────▼────────────────────┘
                        Firebase JS SDK
          ┌──────────────────────────────────────────────────┐
          │              FIREBASE — Backend                   │
          │                                                  │
          │  ┌──────────────────────────────────────────┐   │
          │  │             Firestore Database             │   │
          │  │  businesses/{id}/config                   │   │
          │  │  businesses/{id}/customers                │   │
          │  │  businesses/{id}/orders/{date}            │   │
          │  │  businesses/{id}/payments                 │   │
          │  │  businesses/{id}/menu/{weekStart}         │   │
          │  │  businesses/{id}/notifications/{phone}    │   │
          │  └──────────────────────────────────────────┘   │
          │                                                  │
          │  ┌──────────────────────────────────────────┐   │
          │  │         Cloud Functions v2 (HTTPS)        │   │
          │  │  POST /confirmPayment                     │   │
          │  │  POST /updateDeliveryStatus               │   │
          │  │  POST /changePIN                          │   │
          │  └──────────────────────────────────────────┘   │
          └──────────────────────────────────────────────────┘
```

### Data Flow — Payment Confirmation

```
Owner taps "Confirm & Notify"
        │
        ▼
Cloud Function: confirmPayment()
        │
        ├── Writes payment record to Firestore
        │
        └── Writes notification to notifications/{phone}/{notifId}
                │
                ▼
        Customer's app (onSnapshot listener)
        detects new notification → Alerts badge updates instantly
```

### Data Flow — Delivery Status Update

```
Delivery Person taps "Mark → Delivered"
        │
        ▼
Cloud Function: updateDeliveryStatus()
        │
        ├── Updates orders/{date}/{customerId}.status = "delivered"
        │
        └── Writes notification to notifications/{phone}/{notifId}
                │
                ▼
        Customer's Home tab updates in real-time (onSnapshot)
```

---

## 🗄️ Firestore Schema

```
businesses/
  {businessId}/                        # One document per business
    config/
      settings                         # Document
        mgrPinHash:    string          # SHA-256 of manager PIN
        delivPinHash:  string          # SHA-256 of delivery PIN
        businessName:  string
        ownerPhone:    string
        createdAt:     timestamp

    customers/
      {customerId}                     # One document per customer
        name:          string
        phone:         string          # Unique — used as customer login
        address:       string
        plan:          "daily" | "monthly"
        food:          string
        rate:          number          # Monthly charge in ₹
        active:        boolean
        createdAt:     timestamp

    orders/
      {date}/                          # e.g. "2026-06-28"
        {customerId}                   # One document per customer per day
          status:      "pending" | "out" | "delivered"
          updatedAt:   timestamp
          updatedBy:   "manager" | "delivery"

    payments/
      {customerId}_{month}             # e.g. "abc123_2026-06"
        records: [                     # Array of payment entries
          {
            id:        string
            amount:    number
            date:      string          # "28 Jun"
            confirmed: boolean
            recordedAt: timestamp
          }
        ]
        totalPaid:     number          # Denormalized sum for quick reads

    menu/
      {weekStart}                      # Monday date e.g. "2026-06-22"
        days: [                        # Array of 7 objects (Mon → Sun)
          {
            items: string[]            # ["Dal Tadka", "Rice", "Roti x4"]
            note:  string
          }
        ]
        updatedAt: timestamp

    notifications/
      {customerPhone}/
        {notifId}                      # Auto-ID
          type:    "payment" | "delivery"
          msg:     string
          icon:    string              # Emoji
          read:    boolean
          date:    string              # "28 Jun"
          createdAt: timestamp
```

---

## ☁️ Cloud Functions

### `confirmPayment` (HTTPS Callable)
```js
// Input
{
  businessId: string,
  customerId:  string,
  amount:      number,
  mgrPinHash:  string   // Verify caller is manager
}

// Actions
// 1. Verify PIN hash against Firestore config
// 2. Append payment record to payments/{customerId}_{month}
// 3. Update totalPaid
// 4. Write notification to notifications/{phone}/{auto-id}

// Output
{ success: boolean, totalPaid: number }
```

### `updateDeliveryStatus` (HTTPS Callable)
```js
// Input
{
  businessId:  string,
  customerId:  string,
  date:        string,    // "2026-06-28"
  newStatus:   "out" | "delivered",
  pinHash:     string     // Manager or delivery PIN hash
}

// Actions
// 1. Verify PIN (accepts either manager or delivery PIN)
// 2. Update orders/{date}/{customerId}.status
// 3. If "out" or "delivered" → write notification to customer

// Output
{ success: boolean }
```

### `changePIN` (HTTPS Callable)
```js
// Input
{
  businessId:    string,
  currentPinHash: string,
  newPinHash:    string,
  pinType:       "manager" | "delivery"
}

// Output
{ success: boolean }
```

---

## 🔒 Security Rules (Firestore)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // All writes go through Cloud Functions (server-side auth)
    // Frontend only reads its own business data

    match /businesses/{businessId}/{document=**} {
      // Allow read only — all writes are via Cloud Functions
      allow read: if true;
      allow write: if false;
    }
  }
}
```

> **Note:** In production, scope reads to authenticated sessions. Since PIN auth is custom, pass `businessId` as a query parameter and validate it server-side in Cloud Functions.

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Vercel CLI: `npm install -g vercel`

### 1. Firebase setup
```bash
firebase login
firebase init          # Select Firestore + Functions + Emulators
firebase emulators:start   # Local development
```

### 2. Frontend setup
```bash
npm create vite@latest tiffintrack -- --template react
cd tiffintrack
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install firebase
```

### 3. Environment variables (`.env`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BUSINESS_ID=               # Single business for now
```

### 4. Deploy
```bash
# Deploy Cloud Functions
cd functions && npm run deploy

# Deploy frontend to Vercel
vercel --prod
```

---

## 🗺️ Roadmap

### v1.0 — Current (Prototype)
- [x] 3-role login (Manager, Delivery, Customer)
- [x] Delivery tracking with WhatsApp integration
- [x] Customer management (add, edit, pause, delete)
- [x] Monthly payment tracking with confirmation notifications
- [x] Weekly menu planner with WhatsApp share
- [x] In-app customer notifications

### v1.1 — Backend Integration (Antigravity Build)
- [ ] Firebase Firestore real-time database
- [ ] Cloud Functions for payment confirmation and delivery status
- [ ] Real-time `onSnapshot` listeners (no more Refresh button)
- [ ] PIN hash stored securely in Firestore
- [ ] Data persists across sessions and devices

### v1.2 — UX Improvements
- [ ] PWA support (add to home screen, offline mode)
- [ ] SMS/WhatsApp notification via Twilio or MSG91
- [ ] Monthly income chart (collection trend over 6 months)
- [ ] Expense tracker → net profit view
- [ ] Customer feedback / rating

### v2.0 — Multi-Business (SaaS)
- [ ] Business registration and onboarding flow
- [ ] Multiple businesses on one platform
- [ ] Subscription billing for business accounts
- [ ] Express API layer on Cloud Run

---

## 📁 Project Structure (Planned)

```
tiffintrack/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # AuthScreen, RoleSelect
│   │   │   ├── manager/       # ManagerView, MenuPlanner, PaymentsTab
│   │   │   ├── delivery/      # DeliveryView
│   │   │   └── customer/      # CustomerView
│   │   ├── hooks/
│   │   │   ├── useDeliveries.js   # onSnapshot for orders
│   │   │   ├── usePayments.js
│   │   │   └── useNotifications.js
│   │   ├── lib/
│   │   │   ├── firebase.js    # Firebase app init
│   │   │   └── hash.js        # SHA-256 PIN hashing
│   │   └── App.jsx
│   └── package.json
│
├── functions/                 # Firebase Cloud Functions
│   ├── src/
│   │   ├── confirmPayment.js
│   │   ├── updateDeliveryStatus.js
│   │   └── changePIN.js
│   └── package.json
│
├── firestore.rules
├── firebase.json
└── README.md                  # This file
```

---

## 📄 License

MIT © 2026 — Built for small home businesses. Free to use, modify, and deploy.
