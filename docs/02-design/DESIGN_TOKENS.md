# Design Tokens

## Purpose

This document finalizes the Phase 3 visual tokens for Maa Sharda. These tokens make the app recognizable in one screenshot while keeping the customer experience warm and the owner experience fast.

## Color Palette

Use a warm food-adjacent palette with green trust accents. The app should not become a beige-only product.

| Token | Value | Use |
| --- | --- | --- |
| color-rice | `#FFFDF8` | Primary surfaces |
| color-paper | `#F4F6F1` | Warm sage app background |
| color-tamarind | `#8F3F23` | Premium customer brand blocks |
| color-saffron | `#E65100` | Primary brand action and logo |
| color-marigold | `#FFCF4A` | Badges, highlights, small attention states |
| color-leaf | `#2E7D32` | Success, paid, delivered, trust |
| color-mint | `#E7F4DF` | Soft success surfaces |
| color-ink | `#1F1A17` | Primary text |
| color-clay | `#A45D2D` | Secondary warm text and borders |
| color-muted | `#786B61` | Supporting text |
| color-line | `#E8DED0` | Borders and dividers |
| color-danger | `#B42318` | Destructive or failed states |

## Typography

Use system fonts for hackathon speed. The hierarchy should feel intentional even before a custom brand font is introduced.

| Role | Size | Weight | Use |
| --- | --- | --- | --- |
| display | 28-32 | 900 | Customer Today hero only |
| title-lg | 22-24 | 900 | Main screen title |
| title-md | 18-20 | 900 | Section headers |
| body | 14-16 | 600 | Normal readable copy |
| body-sm | 13-14 | 600 | Supporting copy |
| label | 11-12 | 900 | Uppercase metadata |
| numeric | 28-36 | 900 | Money and KPI values |

Rules:

- Do not use viewport-scaled type.
- Keep letter spacing normal except small uppercase labels.
- Customer text can be warm and reassuring.
- Owner text should be direct and operational.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| radius-card | 24-28 | Premium customer cards |
| radius-control | 16 | Buttons, inputs, nav items |
| radius-row | 14-16 | Compact manager rows |
| radius-pill | Full | Badges and chips |

Cards can exceed the base 8px radius only on premium customer surfaces. Manager lists should stay tighter.

## Elevation

| Token | Use |
| --- | --- |
| shadow-soft | Customer cards and Today surfaces |
| shadow-nav | Bottom navigation |
| shadow-sheet | Notification sheets and modals |

Rules:

- Elevation separates priority, not decoration.
- Do not nest cards inside cards.
- Avoid decorative gradient orbs and ornamental backgrounds.

## Icon Style

Use Lucide icons.

Rules:

- Stroke icons only.
- Use icons for utility buttons and navigation.
- Use text with icons for high-risk decisions.
- Never use icons as filler decoration.

## Premium Cards

Premium customer cards should use:

- `color-rice` surface.
- Warm border from `color-line`.
- 24-28px radius.
- Soft shadow.
- One clear purpose per card.

Operational manager cards should use:

- Higher density.
- Strong section labels.
- Clear status badges.
- Fewer decorative surfaces.
