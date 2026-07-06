# Motion Guide

## Purpose

Motion should make Maa Sharda feel premium without slowing the user down. The signature animation is the daily tiffin reveal because it is tied directly to the product.

## Motion Principles

- Motion clarifies state.
- Motion should be short.
- Motion should be interruptible.
- Motion should respect reduced motion.
- Decorative motion is avoided.

## Signature Motion: Daily Tiffin Reveal

Sequence:

1. Closed stack.
2. Latch lifts.
3. Top compartment opens.
4. Rice appears.
5. Middle compartment opens.
6. Dal appears.
7. Bottom compartment opens.
8. Vegetable appears.
9. Steam rises.
10. The final state remains open.

Duration:

- 1.0-1.5 seconds.

Playback rules:

- Play on first open of the day.
- Play after pull-to-refresh.
- Play after the meal changes.
- Otherwise keep the tiffin open.

Implementation note:

- Store a per-customer, per-day meal signature locally.
- If the signature changes, replay once.
- If reduced motion is enabled, reveal immediately.

## Other Motions

Delivery route:

- Rider moves along a short route only when the meal is out for delivery.
- Keep motion subtle and loop-free unless active tracking exists.

Payment success:

- Use a short tiffin click closed plus success state.
- Do not animate money values excessively.

Owner approval:

- Approval card gets a brief stamp/check transition.
- The card should then move out of the pending queue.

Timeline:

- New entries slide into place.
- Existing history should not constantly reanimate.

## Timing Tokens

| Token | Duration | Use |
| --- | --- | --- |
| motion-tap | 100-120ms | Button press |
| motion-fast | 160-180ms | Small reveal |
| motion-standard | 220-260ms | Sheet/card transition |
| motion-signature | 1000-1500ms | Daily tiffin reveal |

## Reduced Motion

When reduced motion is requested:

- Disable staged tiffin movement.
- Show final open tiffin state.
- Keep state changes visible through layout, text, and icon changes.
