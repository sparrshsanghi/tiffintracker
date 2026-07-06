# Phase 3 Premium UX

## Goal

Make Maa Sharda feel like a polished product, not a college project. The backend is strong enough for the hackathon build; Phase 3 focuses on visual language, customer flagship experience, owner speed, motion, and launch polish.

## Sprint 3.0: Visual Language

Goal:

- Make Maa Sharda recognizable in one screenshot.

Scope:

- Warm color palette
- Typography hierarchy
- Icon style
- Illustrations
- Empty states
- Premium cards
- Animation language

Deliverables:

- `DESIGN_TOKENS.md`
- `BRAND_GUIDE.md`
- `MOTION_GUIDE.md`

## Sprint 3.1: Customer Experience

Principle:

- Customer wants comfort.

Navigation:

- Today
- AI
- History
- Profile

Rules:

- No Home tab.
- App opens directly to Today.
- Notifications use a top-right bell.

Today default:

- Good Evening 👋
- Today's Meal
- Animated Tiffin
- Rice
- Dal Fry
- Mix Veg
- ETA
- Delivery Partner
- Pause Meal

AI:

- Feels like WhatsApp.
- Starts with `Hi Maa 👋`.
- Input placeholder: `Type naturally...`.
- Suggestions appear above the keyboard.

Suggested messages:

- "I'll be home late."
- "Pause tomorrow."
- "Can I get extra chapati?"

History:

- Relationship timeline, not audit logs.
- Group by friendly dates such as Today and Yesterday.
- Use customer language.

Profile:

- Subscription
- Address
- Phone
- Family Members (future)
- Settings

## Sprint 3.2: Owner Experience

Principle:

- Owner wants speed.

Navigation:

- Dashboard
- Operations
- AI
- Business
- Settings

Dashboard:

- Revenue
- Deliveries
- Collections
- Pending approvals
- Quick actions

Operations:

- Customers
- Orders
- Today's route
- Meals
- Payments

AI:

- Current AI Inbox
- Approvals
- Customer conversations
- Timeline explanations

Business:

- Reports
- Menu
- Pricing
- Delivery
- Future analytics

Settings:

- PIN
- Business
- Notifications
- Exports

## Sprint 3.3: Motion

Signature motion:

- Daily Tiffin Reveal.

Other motion:

- Delivery rider moving along a route.
- Payment success with a tiffin click closed.
- AI approval stamped by the owner.
- Timeline entries sliding into place.

## Sprint 3.4: Performance

Before launch:

- Lazy load heavy sections.
- Optimize Firebase listeners.
- Compress images.
- Code split AI features.
- Reduce bundle size.
- Improve offline behavior.
- Ensure smooth 60 FPS animations.

## Sprint 3.5: Launch Polish

Deliverables:

- App icon
- Splash screen
- Screenshots
- README
- Demo script
- Judge walkthrough
- Test data
- Seed script
- Demo video

## AI Design Workflow

Use AI UI builders as accelerators, not decision-makers.

Workflow:

1. Finalize UX and information architecture.
2. Generate screen explorations with tools such as Lovable, Emergent, v0, or Bolt.
3. Borrow the strongest ideas.
4. Implement the final UI in React so it matches the backend and product vision.
5. Add custom animations, especially the tiffin reveal.

This keeps the speed of generated UI while preserving a cohesive and distinctive product.
