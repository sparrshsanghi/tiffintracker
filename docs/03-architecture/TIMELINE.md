# Customer Relationship Timeline

## Purpose

The customer relationship timeline is the permanent history of meaningful customer relationship events. It gives Maa Sharda a chronological memory of when a customer joined, paused, resumed, changed preferences, changed address, paid, or received a monthly bill.

Timeline is not an audit log. Audit logs explain operational accountability and system actions.

Timeline is not billing history. Payment and billing records remain the source of truth for financial calculations.

Timeline represents the customer relationship.

## Schema

Timeline entries live under the customer:

```text
businesses/default/customers/{customerId}/timeline/{eventId}
```

Each event has this shape:

```json
{
  "type": "pause",
  "title": "Meals Paused",
  "description": "Meals paused from 2026-07-10 to 2026-07-14.",
  "actor": "manager",
  "source": "maa_ai",
  "createdAt": "serverTimestamp()",
  "metadata": {
    "approvalId": "...",
    "from": "2026-07-10",
    "to": "2026-07-14"
  }
}
```

## Event Types

Supported timeline events:

- `onboarding_approved`: Customer Joined
- `pause`: Meals Paused
- `resume`: Meals Resumed
- `meal_change`: Meal Preference Updated
- `address_change`: Delivery Address Updated
- `payment_received`: Payment Received
- `monthly_bill_generated`: Monthly Bill Generated

## Write Rules

Timeline entries are append only.

Timeline entries are immutable.

Timeline entries are chronological by `createdAt`.

Timeline entries are written only after the business mutation succeeds.

Timeline writes must go through `appendTimelineEvent(customerId, event)` in `functions/src/helpers/timeline.js`.

Do not edit or delete timeline entries.

Do not duplicate timeline-writing logic in feature functions.

## Future Uses

The timeline is the memory layer for future relationship intelligence. It can support safer AI context, manager summaries, customer support context, lifecycle nudges, and long-term customer relationship views without making AI autonomous or turning audit logs into product history.
