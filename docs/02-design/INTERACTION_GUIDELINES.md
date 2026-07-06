# Interaction Guidelines

## Purpose

This document defines interaction rules for Maa Sharda Version 2. It covers loading, empty states, errors, offline behavior, success, undo, AI placement, and accessibility.

## Current Implementation

The current product has working flows for login, customer views, manager views, approvals, notifications, timeline, and payments. Version 2 should standardize how those flows feel.

## Proposed Interaction Rules

## Loading

Rules:

- Use skeletons when layout is known.
- Use compact spinners only for button-level actions.
- Never show a blank screen during customer profile load.
- Preserve previous content during refresh when safe.
- Manager lists may show sectional skeleton rows.

Customer loading copy:

- Reassuring and short.
- Avoid technical language.

Manager loading copy:

- Direct and operational.

## Empty States

Rules:

- Explain what is missing.
- Offer one next action only when useful.
- Do not over-explain product features.

Customer examples:

- History: relationship events will appear after changes.
- Notifications: no new updates.
- AI: suggest supported request examples.

Manager examples:

- AI Inbox: no pending AI actions.
- Operations: no active exceptions.
- Payments: no payments due for selected scope.

## Error States

Rules:

- State what failed.
- State whether data was saved.
- Provide one recovery action.
- Avoid blame.
- Keep technical details out of customer-facing errors.

High-risk errors:

- Approval mutation failed
- Payment confirmation failed
- Customer profile unavailable
- Timeline load failed

These must clearly say whether the action was completed.

## Offline Behavior

Rules:

- Customer can view cached stable content where available.
- Customer cannot submit state-changing requests while offline.
- Manager cannot approve, reject, or confirm payment while offline.
- Offline banner must be persistent but not blocking for read-only views.

Offline messaging:

- Customer: "You are offline. Requests will be available when connection returns."
- Manager: "Offline. Decisions and payment confirmations are paused."

## Success States

Rules:

- Low-risk success uses a toast.
- High-risk success uses an inline result state.
- Approval success should update the card status immediately.
- Customer request submission should show pending approval clearly.

Examples:

- Payment confirmed: inline paid state plus notification confirmation.
- Request submitted: pending approval banner.
- Approval resolved: card moves out of pending list after visible confirmation.

## Undo

Rules:

- Undo is allowed only for reversible local UI actions.
- No undo for approved business mutations unless backend supports explicit reversal.
- Rejection notes and approvals should use confirmation before final action.
- Payment confirmation should not show undo unless a reversal flow exists.

## Confirmation

Use confirmation when:

- Approving AI action changes customer state.
- Rejecting customer request.
- Confirming payment.
- Deleting customer data if current product allows it.
- Changing manager PIN.

Do not use confirmation when:

- Opening detail screens.
- Viewing timeline events.
- Sending a harmless AI clarification.

## AI Interaction Rules

AI appears when:

- A customer uses natural language.
- A request needs extraction.
- A manager needs approval context.
- A timeline event needs explanation.
- A payment state needs customer-friendly explanation.

AI does not appear when:

- A direct button is clearer.
- The screen is authentication.
- The action is unsupported.
- The AI would imply autonomous business authority.

AI states:

1. Listening
2. Extracting
3. Clarifying
4. Confirming
5. Pending manager approval
6. Approved
7. Rejected
8. Unsupported

Confidence policy:

- High confidence: proceed to customer confirmation.
- Low confidence: ask one clarification.
- Unsupported: say the request is not supported yet.

## Approval Interaction Rules

Approval cards must show:

- Customer
- Intent
- Current value
- Requested value
- Effective date
- Reason
- Confidence
- Approve
- Reject

Approval detail must show:

- What changes
- Why it was requested
- What customer will be told
- Relevant customer context
- Relevant timeline events if helpful

## Timeline Interaction Rules

Rules:

- Newest first.
- Cards only.
- No filters in initial V2.
- No search in initial V2.
- No pagination in initial V2.
- Timeline is customer relationship history, not audit log.

Tap behavior:

- Customer: opens explanation-focused event detail.
- Manager: opens context-focused event detail.

## Accessibility

### Thumb Reach

Rules:

- Bottom navigation is primary.
- Primary actions should sit in the lower half when possible.
- Destructive actions should not be placed where accidental thumb taps are likely.
- Long forms should keep final action reachable after scroll.

### Touch Targets

Rules:

- Minimum target: 44 by 44 points.
- Icon-only buttons require accessible labels.
- Adjacent destructive and approving actions need clear separation.

### Contrast

Rules:

- Text must meet accessible contrast.
- Status cannot rely on color alone.
- Warning and danger states require text or icon reinforcement.

### Font Scaling

Rules:

- Text must support user font scaling.
- Buttons must not clip long labels.
- Cards must expand vertically rather than overlap.
- Bottom navigation labels should remain readable at larger text sizes.

### Focus And Keyboard

Rules:

- All actions must be reachable by keyboard or assistive technology.
- Focus order should match visual order.
- Modal sheets must trap focus until dismissed.

## Future Ideas

- Voice interaction guidelines.
- AI suggested replies with manager editing.
- Bulk approval interaction pattern.
- Offline read cache design.

