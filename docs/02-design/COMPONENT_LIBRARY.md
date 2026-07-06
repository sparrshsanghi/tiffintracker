# Component Library Architecture

## Purpose

This document defines reusable product components for Maa Sharda Version 2. It is not a React, CSS, Tailwind, or Figma specification.

Components describe purpose, content, states, and reuse rules.

## Current Implementation

The current product has working UI pieces for customer cards, manager cards, approvals, payments, notifications, and timeline. Version 2 should turn these into intentional product components before implementation.

## Proposed Component Inventory

## App Shell Components

### Customer App Shell

Purpose:

- Provide premium customer layout with bottom navigation.

Contains:

- Screen content
- Top-right notification bell
- Customer bottom navigation

Rules:

- No top navigation menu.
- No side navigation.
- One primary screen question at a time.

### Manager App Shell

Purpose:

- Provide workflow console layout with bottom navigation.

Contains:

- Section title
- Attention count indicators
- Manager bottom navigation

Rules:

- Denser than customer shell.
- Prioritize scan speed and action clarity.

### Top Bar

Purpose:

- Show title, back action, and notifications where needed.

Variants:

- Customer top bar
- Manager top bar
- Detail top bar

Rules:

- Top bar is not navigation.
- Customer notification bell remains top-right.

### Bottom Navigation

Purpose:

- Primary app navigation.

Customer items:

- Today
- AI
- History
- Profile

Manager items:

- Dashboard
- Operations
- AI
- Business
- Settings

States:

- Active
- Inactive
- Badge
- Disabled during blocking load only

## Card Components

### Meal Card

Purpose:

- Show the customer's current meal status.

Content:

- Meal title
- Delivery state
- Preference indicator
- Time or day label
- Primary action if relevant

States:

- Active
- Paused
- Pending approval
- No meal today
- Loading
- Error

Rules:

- Used on Customer Today.
- May appear in manager customer context as a compact variant.

### Subscription Card

Purpose:

- Summarize customer subscription state.

Content:

- Active or paused state
- Meal preference
- Rate or plan summary
- Payment state summary

States:

- Active
- Paused
- Payment due
- Pending change

Rules:

- Customer Profile uses full variant.
- Today uses compact variant.

### Customer Card

Purpose:

- Represent one customer in manager workflows.

Content:

- Name
- Phone
- Status
- Meal preference
- Payment state
- Pending indicator

States:

- Active
- Paused
- Due
- Pending approval
- New

Rules:

- Used in Operations, Dashboard attention, and Business billing lists.

### Approval Card

Purpose:

- Summarize one approval decision.

Content:

- Customer
- Intent
- Current value
- Requested value
- Effective date
- Reason
- Confidence
- Age

Actions:

- Approve
- Reject
- Open detail

States:

- Pending
- Approved
- Rejected
- Needs clarification
- Loading decision

Rules:

- Inline card can approve only when all context is visible.
- Detail screen required when requested value or risk is unclear.

### Timeline Card

Purpose:

- Display one relationship event.

Content:

- Icon
- Title
- Description
- Date
- Optional related action

States:

- Standard
- Highlighted from notification
- Loading skeleton

Rules:

- Newest first.
- No filters in initial V2.
- No audit-log language.

### Payment Card

Purpose:

- Show billing or payment state.

Content:

- Month
- Amount due
- Amount paid
- Remaining amount
- Last payment

States:

- Due
- Partially paid
- Paid
- Overdue if supported later

Rules:

- Customer variant must be explanatory.
- Manager variant must be operational.

### Notification Row

Purpose:

- Show one customer-visible update.

Content:

- Title
- Short body
- Date
- Read state
- Related object indicator

States:

- Read
- Unread
- Loading

## Action Components

### Primary Button

Purpose:

- One main action per screen or card group.

States:

- Default
- Pressed
- Loading
- Disabled
- Success

### Secondary Button

Purpose:

- Non-primary action.

### Destructive Button

Purpose:

- Reject, delete, or cancel high-risk actions.

Rules:

- Requires confirmation when the effect is not easily reversible.

### Icon Button

Purpose:

- Compact recognizable action.

Use for:

- Notifications
- Back
- Close
- More
- Search

Rules:

- Must have accessible label.
- Minimum touch target follows accessibility guidelines.

### Floating Action

Purpose:

- High-frequency contextual action only.

Customer examples:

- Ask Maa AI from Today.

Manager examples:

- Add payment from Payments if it is the dominant task.

Rules:

- Do not use floating actions for multiple competing actions.

## Form Components

### Text Field

Purpose:

- Capture short input.

States:

- Empty
- Focused
- Filled
- Error
- Disabled

### Date Picker Field

Purpose:

- Capture effective date or pause range.

Rules:

- Always show interpreted date in plain language before approval.

### Request Composer

Purpose:

- Capture customer natural language request.

States:

- Empty
- Composing
- Extracting
- Clarifying
- Confirmation
- Pending approval

## Feedback Components

### Banner

Purpose:

- Show persistent state such as pending approval or offline.

### Toast

Purpose:

- Confirm low-risk success.

### Empty State

Purpose:

- Explain absence and provide one next action if useful.

### Error State

Purpose:

- Explain what failed and how to recover.

### Skeleton

Purpose:

- Preserve layout while loading.

## Future Ideas

- AI Summary Card
- Customer Health Card
- Manager Briefing Card
- Timeline Insight Card
- Suggested Reply Card

