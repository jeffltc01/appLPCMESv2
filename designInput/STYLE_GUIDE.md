# LP Cylinder MES v2 — Style Guide

> Derived from [lpcylinder.com](https://lpcylinder.com/) brand identity and the existing MES v1 application.
> Target stack: **React + TypeScript** with **Fluent UI v9** (per `REFERENCE_ARCHITECTURE.md`).

---

## 1. Brand Color Palette

### Primary Colors

| Token               | Hex       | Usage                                                        |
|----------------------|-----------|--------------------------------------------------------------|
| `brand-navy`        | `#123046` | Primary brand color — nav bars, page headers, primary buttons, sidebar |
| `brand-navy-deep`   | `#132046` | Footer backgrounds, modal headers, dark overlays             |
| `brand-blue`        | `#2B3B84` | Accent — active states, selected items, icon highlights       |
| `brand-blue-mid`    | `#017CC5` | Secondary buttons, links, active menu items                  |
| `brand-blue-light`  | `#0095EB` | Tertiary accents, progress bars, badge highlights            |

### Neutral Colors

| Token               | Hex       | Usage                                                        |
|----------------------|-----------|--------------------------------------------------------------|
| `neutral-white`     | `#FFFFFF` | Card backgrounds, input backgrounds, modal bodies            |
| `neutral-page`      | `#FCFCFC` | Page background                                              |
| `neutral-gray-100`  | `#F5F5F5` | Alternating table rows, disabled input fills, section bgs    |
| `neutral-gray-200`  | `#E8E8E8` | Borders, dividers                                            |
| `neutral-gray-300`  | `#D2D2D2` | Disabled text, placeholder text                              |
| `neutral-gray-600`  | `#6E6E6E` | Secondary/caption text                                       |
| `neutral-gray-900`  | `#242424` | Primary body text                                            |
| `neutral-dark`      | `#000119` | Hero/header wrappers (near-black navy)                       |

### Semantic Colors

| Token               | Hex       | Usage                                                        |
|----------------------|-----------|--------------------------------------------------------------|
| `semantic-info`     | `#E0EFF8` | Info banners, highlight sections, light blue tint backgrounds|
| `semantic-success`  | `#107C10` | Success messages, completed status badges                    |
| `semantic-warning`  | `#FFB900` | Warning banners, caution indicators                          |
| `semantic-danger`   | `#E41E2F` | Delete buttons, error states, destructive actions            |
| `semantic-danger-dark`| `#AA121F`| Danger hover state                                          |

### Status Colors (Order Workflow)

These map to order lifecycle statuses visible in the MES v1 Order Board:

| Status              | Background   | Text          | Notes                             |
|---------------------|-------------|---------------|-----------------------------------|
| New                 | `#E0EFF8`   | `#123046`     | Light blue bg, navy text          |
| Pickup Scheduled    | `#B3D4FC`   | `#123046`     | Medium blue bg                    |
| Received            | `#D4EDDA`   | `#155724`     | Light green bg                    |
| In Production       | `#FFF3CD`   | `#856404`     | Light amber bg                    |
| Ready to Ship       | `#CCE5FF`   | `#004085`     | Blue bg                           |
| Ready to Invoice    | `#D1ECF1`   | `#0C5460`     | Teal bg                           |
| Invoiced / Complete | `#F5F5F5`   | `#6E6E6E`     | Gray bg (archived feel)           |

---

## 2. Typography

### Font Family

```
Primary: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Monospace: "Roboto Mono", "Cascadia Code", "Consolas", monospace
```

Load from Google Fonts: weights **300, 400, 500, 700, 900**.

### Type Scale

| Element          | Size   | Weight | Letter-spacing | Line-height | Usage                                  |
|------------------|--------|--------|---------------|-------------|----------------------------------------|
| Display          | 32px   | 900    | 0.5px         | 1.2         | Main dashboard title                   |
| H1 / Page Title  | 24px   | 700    | 0.5px         | 1.3         | Page-level headers (e.g. "Order Board")|
| H2 / Section     | 20px   | 700    | 0.5px         | 1.3         | Section headings within a page         |
| H3 / Card Title  | 16px   | 600    | 0.25px        | 1.4         | Card headers, dialog titles            |
| Body             | 14px   | 400    | normal        | 1.5         | Default body text, form labels         |
| Body Strong      | 14px   | 600    | normal        | 1.5         | Emphasized inline text, column headers |
| Caption          | 12px   | 400    | 0.2px         | 1.4         | Timestamps, helper text, badges        |
| Overline         | 11px   | 500    | 1px           | 1.6         | All-caps field group labels            |

### Heading Style

All headings use `color: #123046` (brand-navy). Page-level headers sit inside a full-width navy bar with white text, matching the MES v1 pattern (dark banner at top of each view).

---

## 3. Fluent UI v9 Theme Overrides

Map brand colors into the Fluent UI `createTheme` token structure:

```typescript
import { createTheme } from "@fluentui/react-components";

export const lpcTheme = createTheme({
  colorBrandBackground: "#123046",
  colorBrandBackgroundHover: "#2B3B84",
  colorBrandBackgroundPressed: "#132046",
  colorBrandForeground1: "#123046",
  colorBrandForeground2: "#017CC5",
  colorBrandStroke1: "#123046",
  colorNeutralBackground1: "#FFFFFF",
  colorNeutralBackground2: "#FCFCFC",
  colorNeutralBackground3: "#F5F5F5",
  colorNeutralForeground1: "#242424",
  colorNeutralForeground2: "#6E6E6E",
  colorNeutralStroke1: "#E8E8E8",
  colorPaletteRedBackground3: "#E41E2F",
  colorPaletteRedForeground1: "#E41E2F",
  colorPaletteGreenBackground3: "#107C10",
  colorPaletteGreenForeground1: "#107C10",
  fontFamilyBase: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"Roboto Mono", "Cascadia Code", Consolas, monospace',
});
```

Wrap the app root in `<FluentProvider theme={lpcTheme}>`.

---

## 4. Layout & Spacing

### Spacing Scale (8px base grid)

| Token    | Value | Usage                                         |
|----------|-------|-----------------------------------------------|
| `xs`     | 4px   | Inline icon-to-text gap                       |
| `s`      | 8px   | Compact padding inside badges, chips          |
| `m`      | 16px  | Standard card padding, form field gap         |
| `l`      | 24px  | Section spacing, page gutter                  |
| `xl`     | 32px  | Major section breaks                          |
| `xxl`    | 48px  | Page top/bottom padding                       |

### Page Layout Structure

```
┌──────────────────────────────────────────────────┐
│  Top Bar (brand-navy #123046, 48px)              │
│  [Logo] [App Title: "LP Cylinder MES"]  [User]   │
├──────────────────────────────────────────────────┤
│  Nav / Sidebar (brand-navy-deep #132046)         │
│  ┌────────────────────────────────────────────┐  │
│  │  Content Area (neutral-page #FCFCFC)       │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Page Header Bar (brand-navy, white) │  │  │
│  │  ├──────────────────────────────────────┤  │  │
│  │  │  Page Body                           │  │  │
│  │  │  (cards, forms, tables on white bg)  │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  Footer Bar (brand-navy-deep #132046, 40px)      │
│  [Back] [Home]                                    │
└──────────────────────────────────────────────────┘
```

- **Sidebar** width: 240px collapsed to 48px (icon-only) on smaller viewports.
- **Content area** max-width: 1400px centered, with 24px horizontal padding.
- The v1 app uses a bottom navigation bar with back/home icons — v2 replaces this with a left sidebar for desktop and a bottom nav for tablet/touch interfaces.

### Responsive Breakpoints

| Name       | Width     | Behavior                                        |
|------------|-----------|------------------------------------------------|
| Mobile     | < 640px   | Single column, bottom nav, collapsible sections |
| Tablet     | 640–1024px| Compact sidebar (icon-only), stacked forms      |
| Desktop    | > 1024px  | Full sidebar, multi-column forms, data tables   |

---

## 5. Component Patterns

### 5.1 Buttons

| Variant        | Background    | Text       | Border         | Usage                            |
|----------------|--------------|------------|----------------|----------------------------------|
| Primary        | `#123046`    | `#FFFFFF`  | none           | Main CTA: "Save", "Submit"       |
| Secondary      | `#FFFFFF`    | `#123046`  | 1px `#123046`  | "Cancel", "Back"                 |
| Accent         | `#017CC5`    | `#FFFFFF`  | none           | "New Sale Order", "Add Item"     |
| Danger         | `#E41E2F`    | `#FFFFFF`  | none           | "Delete"                         |
| Disabled       | `#F5F5F5`    | `#D2D2D2`  | 1px `#E8E8E8`  | Inactive actions                 |

**Button Properties:**
- Border-radius: `4px` (slightly rounded — squared feel matching LP Cylinder site's `border-radius: 0` but softened for app UX)
- Padding: `8px 20px` (standard), `6px 12px` (compact/toolbar)
- Font-weight: `600`
- Font-size: `14px`
- Min-height: `36px`
- Hover: Darken background by 10%; subtle shadow `0 2px 4px rgba(0,0,0,0.15)`
- Active: Darken by 15%

### 5.2 Form Inputs

Match the MES v1 pattern of bordered input fields on a light background:

- Border: `1px solid #123046` (navy border — matches v1)
- Border-radius: `4px`
- Background: `#FFFFFF`
- Height: `36px`
- Font-size: `14px`
- Padding: `6px 10px`
- Focus: `2px solid #017CC5` outline, light blue glow `box-shadow: 0 0 0 2px rgba(1,124,197,0.2)`
- Error: `2px solid #E41E2F`
- Disabled: Background `#F5F5F5`, border `#E8E8E8`
- Label: `14px`, weight `600`, color `#242424`, positioned above the input

### 5.3 Dropdowns / Select

Consistent with v1's dropdown appearance:

- Same border and sizing as inputs
- Chevron icon in `#123046`
- Selected value bg in dropdown list: `#E0EFF8`
- Dropdown menu bg: `#FFFFFF`, border `1px solid #E8E8E8`

### 5.4 Data Tables

- Header row: Background `#123046`, text `#FFFFFF`, font-weight `600`
- Body rows: Alternating `#FFFFFF` / `#F5F5F5`
- Row hover: `#E0EFF8`
- Cell padding: `10px 12px`
- Border: `1px solid #E8E8E8` between rows
- Sortable column indicators use `#017CC5`

### 5.5 Cards (Order Board)

Based on the v1 Order Board tile pattern:

- Background: `#FFFFFF`
- Border: `1px solid #E8E8E8`
- Border-radius: `6px`
- Padding: `16px`
- Shadow: `0 1px 3px rgba(0,0,0,0.08)`
- Hover shadow: `0 4px 12px rgba(0,0,0,0.12)`
- Status badge (colored pill) at top-left inside the card
- Card header: SO number + route badge in bold

### 5.6 Page Header Bar

Full-width dark banner across the top of each view (matching v1's dark navy header):

- Background: `#123046`
- Text: `#FFFFFF`, 20px, weight 500
- Height: `48px`
- Padding: `0 24px`
- Right side: action buttons ("New Sale Order", etc.) as accent-colored buttons

### 5.7 Modal / Dialog

Matches v1's overlay dialog pattern:

- Overlay: `rgba(0, 1, 25, 0.5)` (dark navy-tinted scrim)
- Dialog header: Background `#132046`, text `#FFFFFF`, padding `12px 20px`
- Dialog body: Background `#FFFFFF`, padding `20px`
- Dialog footer: Background `#F5F5F5`, padding `12px 20px`, right-aligned buttons
- Close icon (X) in header, white, top-right
- Border-radius: `8px`
- Max-width: `720px` (standard), `960px` (wide/detail forms)
- Button order (left to right): Delete (danger) | Cancel (secondary) | Save (primary)

### 5.8 Tabs

Based on v1's "Header / Detail / Attachments" tab bar:

- Unselected tab: Color `#6E6E6E`, no underline
- Selected tab: Color `#123046`, weight `600`, `2px solid #017CC5` underline
- Tab bar border-bottom: `1px solid #E8E8E8`
- Font-size: `14px`
- Padding: `10px 16px`

### 5.9 Radio Buttons & Toggles

Used extensively for Yes/No fields in v1:

- Radio: `#123046` fill when selected, `#E8E8E8` border when unselected
- Label: Inline, `14px`, regular weight
- Group layout: Horizontal with `16px` gap between options

### 5.10 Badges & Status Pills

- Border-radius: `12px` (pill shape)
- Padding: `2px 10px`
- Font-size: `12px`, weight `600`
- Colors per status (see Status Colors table above)

### 5.11 Navigation Items (Sidebar)

- Default: Text `rgba(255,255,255,0.7)`, no background
- Hover: Background `rgba(255,255,255,0.08)`, text `#FFFFFF`
- Active: Background `#2B3B84`, text `#FFFFFF`, left border `3px solid #0095EB`
- Icon size: `20px`
- Item height: `44px`
- Padding: `0 16px`

### 5.12 Dashboard Tiles (Home Screen)

Based on v1's large navigation tiles:

- Background: `#2B3B84` (brand-blue) with subtle gradient to `#123046`
- Text: `#FFFFFF`, centered, `16px`, weight `600`
- Border-radius: `8px`
- Min-height: `80px`
- Shadow: `0 2px 8px rgba(0,0,0,0.2)`
- Hover: Brighten background, lift shadow `0 4px 16px rgba(0,0,0,0.25)`
- Grid: 6 columns desktop, 3 columns tablet, 2 columns mobile

---

## 6. Iconography

- **Icon library**: Fluent UI Icons (`@fluentui/react-icons`)
- **Icon size**: 20px inline / 24px standalone / 16px in compact contexts
- **Icon color**: Inherits text color by default; use `#017CC5` for interactive icons
- **Icon style**: Regular weight (not filled) for most UI; filled for active/selected states

---

## 7. Elevation & Shadows

| Level | Shadow                                      | Usage                          |
|-------|---------------------------------------------|--------------------------------|
| 0     | none                                        | Flat surfaces, inline elements |
| 1     | `0 1px 3px rgba(0,0,0,0.08)`               | Cards, raised surfaces         |
| 2     | `0 4px 12px rgba(0,0,0,0.12)`              | Hover cards, dropdown menus    |
| 3     | `0 8px 24px rgba(0,0,0,0.16)`              | Modals, dialogs                |
| 4     | `0 16px 48px rgba(0,0,0,0.22)`             | Popovers, tooltips on focus    |

---

## 8. Motion & Transitions

- Default transition: `150ms ease-in-out`
- Hover effects: `200ms ease`
- Modal entrance: Fade-in + scale from 95% over `250ms ease-out`
- Page transitions: Subtle fade, `200ms`
- Avoid heavy animations in data-heavy views (tables, boards) to maintain performance

---

## 9. Accessibility

- All interactive elements must have a minimum tap target of **44x44px** (the app is used on shop-floor tablets)
- Color contrast: Maintain WCAG AA minimum (4.5:1 for body text, 3:1 for large text)
- The navy-on-white combinations meet contrast requirements:
  - `#123046` on `#FFFFFF` = **13.5:1** (passes AAA)
  - `#FFFFFF` on `#123046` = **13.5:1** (passes AAA)
  - `#017CC5` on `#FFFFFF` = **4.6:1** (passes AA)
- Focus indicators: `2px solid #017CC5` outline with `2px` offset
- Form errors: Use both color AND icon/text to convey state (not color alone)
- Touch-friendly: Larger inputs (`36px+` height), generous padding on buttons

---

## 10. Logo Usage

- **Primary logo**: LP Cylinder logo (blue cylinder icon + "LP CYLINDER" wordmark)
- **App header**: Logo at left of top bar, followed by "MES" in a lighter weight or as a separate span
- Logo height in app header: `32px`
- On dark backgrounds: Use white variant of the logo
- Minimum clear space: Equal to the height of the cylinder icon on all sides

---

## 11. Do's and Don'ts

### Do

- Use the navy `#123046` as the dominant brand presence (header bars, sidebar, primary buttons)
- Keep form layouts dense but organized — this is a data-entry application used at pace
- Use the light blue tint `#E0EFF8` sparingly for highlighting important information
- Maintain the v1 mental model: dark header banner per page, tabbed detail views, card-based boards
- Design for touch on tablets (44px+ targets, generous spacing)

### Don't

- Don't use the red `#E41E2F` for anything other than destructive actions and errors
- Don't mix in colors outside this palette — the brand is built on navy/blue tones
- Don't use font sizes below 12px — readability matters on factory-floor devices
- Don't break the page-header-bar pattern; users rely on the dark banner for wayfinding
- Don't use pure black `#000000` for text — use `#242424` (neutral-gray-900) instead

---

## 12. CSS Custom Properties Reference

For projects using raw CSS or CSS modules alongside Fluent UI:

```css
:root {
  /* Brand */
  --lpc-brand-navy: #123046;
  --lpc-brand-navy-deep: #132046;
  --lpc-brand-blue: #2B3B84;
  --lpc-brand-blue-mid: #017CC5;
  --lpc-brand-blue-light: #0095EB;

  /* Neutrals */
  --lpc-white: #FFFFFF;
  --lpc-page-bg: #FCFCFC;
  --lpc-gray-100: #F5F5F5;
  --lpc-gray-200: #E8E8E8;
  --lpc-gray-300: #D2D2D2;
  --lpc-gray-600: #6E6E6E;
  --lpc-gray-900: #242424;
  --lpc-dark: #000119;

  /* Semantic */
  --lpc-info: #E0EFF8;
  --lpc-success: #107C10;
  --lpc-warning: #FFB900;
  --lpc-danger: #E41E2F;
  --lpc-danger-dark: #AA121F;

  /* Typography */
  --lpc-font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --lpc-font-mono: "Roboto Mono", "Cascadia Code", Consolas, monospace;

  /* Spacing */
  --lpc-space-xs: 4px;
  --lpc-space-s: 8px;
  --lpc-space-m: 16px;
  --lpc-space-l: 24px;
  --lpc-space-xl: 32px;
  --lpc-space-xxl: 48px;

  /* Elevation */
  --lpc-shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08);
  --lpc-shadow-2: 0 4px 12px rgba(0, 0, 0, 0.12);
  --lpc-shadow-3: 0 8px 24px rgba(0, 0, 0, 0.16);
  --lpc-shadow-4: 0 16px 48px rgba(0, 0, 0, 0.22);

  /* Radii */
  --lpc-radius-sm: 4px;
  --lpc-radius-md: 6px;
  --lpc-radius-lg: 8px;
  --lpc-radius-pill: 12px;

  /* Transitions */
  --lpc-transition-fast: 150ms ease-in-out;
  --lpc-transition-normal: 200ms ease;
  --lpc-transition-modal: 250ms ease-out;
}
```
