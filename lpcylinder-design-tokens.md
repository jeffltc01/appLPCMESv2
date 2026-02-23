# LP Cylinder Design Tokens

Extracted from https://lpcylinder.com/ (WordPress + BeTheme + Quality-Steel child theme)

---

## 1. Color Palette

### Brand / Primary Colors

| Token / Name         | Hex       | Usage                                                       |
|----------------------|-----------|-------------------------------------------------------------|
| **Primary Dark**     | `#123046` | Primary buttons, links (`a` tag color), nav active, titles  |
| **Primary Navy**     | `#132046` | Footer background, heading colors (h1-h6), `.primary-color` |
| **Brand Blue**       | `#2b3b84` | BeTheme "theme color", icon boxes, accent elements, selection bg, button default bg, HR color, progress bars |
| **Secondary Blue**   | `#017cc5` | Secondary buttons, active menu items, dropdown/sub-menu bg, link hover, `.secondary-background` |
| **Link Hover Blue**  | `#007cc3` | Button hover states, action bar link hover                  |
| **Accent Blue**      | `#0095eb` | WooCommerce theme buttons, action bar links, sliding top links |
| **Highlight Blue**   | `#0089f7` | Image link hover color                                      |

### Background Colors

| Token / Name             | Hex / Value                | Usage                                        |
|--------------------------|----------------------------|----------------------------------------------|
| **Page Background**      | `#FCFCFC`                  | `html`, `#Wrapper`, `#Content` background    |
| **White**                | `#FFFFFF` / `#fff`         | Top bar, cards, button text, various sections|
| **Light Blue Tint**      | `#e0eff8`                  | Highlight sections, contact box bg, dropcap, `.fourth-background` |
| **Header Wrapper**       | `#000119`                  | `#Header_wrapper`, `#Intro` background       |
| **Footer**               | `#132046`                  | `#Footer` background                         |
| **Subheader**            | `rgba(247,247,247,1)` / `#F7F7F7` | `#Subheader` background              |
| **Sliding Top**          | `#545454`                  | `#Sliding-top` background                    |
| **Action Bar**           | `#292b33`                  | Action bar background                        |
| **Menu Dropdown**        | `#F2F2F2`                  | Sub-menu background, menu highlight bg       |
| **Card Border**          | `#e5e5e5`                  | Card/box border color (inline styles)        |
| **Input Background**     | `rgba(255,255,255,1)`      | Form input backgrounds                       |
| **Input Focus BG**       | `rgba(233,245,252,1)` / `#e9f5fc` | Input focus state background          |

### Text Colors

| Token / Name          | Hex       | Usage                                          |
|-----------------------|-----------|-------------------------------------------------|
| **Body Text**         | `#868686` | Default body text, paragraphs, `.mfn-woo-body-color` |
| **Body Text (Bootstrap)** | `#212529` | Bootstrap base body text color             |
| **Heading Color**     | `#161922` | All headings h1-h6, WooCommerce headings       |
| **Sub Text / Meta**   | `#a8a8a8` | Meta text, dates, subtitles, timestamps         |
| **Menu Text**         | `#646464` | Top bar menu items                              |
| **Menu Active**       | `#017cc5` | Active/current menu items                       |
| **Submenu Hover**     | `#2e2e2e` | Dropdown menu item hover                        |
| **Footer Text**       | `#cccccc` / `#ccc` | Footer body text, widget links           |
| **Footer Headings**   | `#ffffff` | Footer headings and hover links                 |
| **Footer Copyright**  | `rgba(255, 255, 255, 0.25)` | Footer copyright text              |
| **Subheader Title**   | `#444444` | Subheader title                                 |
| **Breadcrumb**        | `rgba(68,68,68,0.6)` | Breadcrumb text                          |
| **Link Color (red)**  | `#e41e2f` | Default link color (BeTheme `a` tag)            |
| **Action Bar Text**   | `#bbbbbb` | Action bar contact details                      |
| **Input Text**        | `#626262` | Form input text                                 |
| **Input Focus Text**  | `#1982c2` | Form input focus text color                     |
| **Placeholder Text**  | `#929292` | Input placeholders                              |
| **Caption Text**      | `#6c757d` | Table captions, gray utility                    |

### Accent / Utility Colors

| Token / Name          | Hex       | Usage                                          |
|-----------------------|-----------|-------------------------------------------------|
| **Theme Red**         | `#aa121f` | `.theme-red`, `.sixth-background`              |
| **Theme Waikawa**     | `#606ca3` | `.theme-waikawa`, `.third-background`          |
| **Theme Gray**        | `#868686` | `.theme-gray`, `.fifth-background`             |
| **Theme Light Gray**  | `#e0eff8` | `.theme-light-gray`                            |
| **Input Border**      | `#EBEBEB` | Form input borders                              |
| **Input Focus Border**| `#d5e5ee` | Form input focus border                         |
| **Image Frame Border**| `#f8f8f8` | Image frame borders                             |
| **Overlay BG**        | `rgba(1,124,197,0.95)` | Overlay menu background                |
| **Selection BG**      | `#2b3b84` | Text selection highlight                        |

---

## 2. CSS Custom Properties (Variables)

### Bootstrap/Child Theme Variables (`:root`)

```css
:root {
  --blue: #123046;
  --indigo: #6610f2;
  --purple: #6f42c1;
  --pink: #e83e8c;
  --red: #dc3545;
  --orange: #fd7e14;
  --yellow: #ffc107;
  --green: #28a745;
  --teal: #20c997;
  --cyan: #17a2b8;
  --white: #fff;
  --gray: #6c757d;
  --gray-dark: #343a40;
  --black: #000;
  --primary: #123046;
  --secondary: #017cc5;
  --success: #28a745;
  --info: #17a2b8;
  --warning: #ffc107;
  --danger: #dc3545;
  --light: #f8f9fa;
  --dark: #343a40;
  --theme-waikawa: #606ca3;
  --theme-light-gray: #e0eff8;
  --theme-gray: #868686;
  --theme-red: #aa121f;
  --breakpoint-xs: 0;
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  --font-family-sans-serif: "Roboto", Helvetica, Arial, sans-serif;
  --font-family-monospace: SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
}
```

### WordPress Preset Variables

```css
:root {
  --wp--preset--font-size--small: 13px;
  --wp--preset--font-size--medium: 20px;
  --wp--preset--font-size--large: 36px;
  --wp--preset--font-size--x-large: 42px;
  --wp--preset--font-size--normal: 16px;
  --wp--preset--font-size--huge: 42px;

  --wp--preset--spacing--20: 0.44rem;
  --wp--preset--spacing--30: 0.67rem;
  --wp--preset--spacing--40: 1rem;
  --wp--preset--spacing--50: 1.5rem;
  --wp--preset--spacing--60: 2.25rem;
  --wp--preset--spacing--70: 3.38rem;
  --wp--preset--spacing--80: 5.06rem;

  --wp--preset--shadow--natural: 6px 6px 9px rgba(0, 0, 0, 0.2);
  --wp--preset--shadow--deep: 12px 12px 50px rgba(0, 0, 0, 0.4);
  --wp--preset--shadow--sharp: 6px 6px 0px rgba(0, 0, 0, 0.2);
  --wp--preset--shadow--crisp: 6px 6px 0px rgb(0, 0, 0);
}
```

### BeTheme Body Variables

```css
body {
  --mfn-icon-box-icon: #2b3b84;
  --mfn-sliding-box-bg: #2b3b84;
  --mfn-clients-tiles-hover: #ffffff;
  --mfn-woo-body-color: #868686;
  --mfn-woo-heading-color: #868686;
  --mfn-woo-themecolor: #ffffff;
  --mfn-woo-bg-themecolor: #ffffff;
  --mfn-woo-border-themecolor: #ffffff;
}
```

---

## 3. Typography

### Font Families

| Usage             | Font Stack                                                                                             |
|-------------------|--------------------------------------------------------------------------------------------------------|
| **Body / Default** | `"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif` |
| **Headings (h1-h4)** | Same as body (Roboto system stack)                                                                |
| **Headings (h5-h6)** | Same as body (Roboto system stack)                                                                |
| **Menu / Navigation** | Same as body (Roboto system stack)                                                               |
| **Blockquote**     | Same as body (Roboto system stack)                                                                   |
| **Monospace**      | `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`               |

Google Fonts loaded: `Roboto:400,400italic,500` and `Roboto:700,900,300italic`

### Font Sizes & Weights

| Element         | Size   | Line Height | Weight | Letter Spacing |
|-----------------|--------|-------------|--------|----------------|
| **Body**        | 14px   | 25px        | 400    | 0px            |
| **Body .big**   | 16px   | 28px        | 400    | 0px            |
| **h1**          | 58px   | 50px        | 900    | 1px            |
| **h2**          | 46px   | 34px        | 700    | 1px            |
| **h3**          | 36px   | 29px        | 700    | 1px            |
| **h4**          | 24px   | 25px        | 700    | 1px            |
| **h5**          | 24px   | 25px        | 300    | 1px            |
| **h6**          | 20px   | 25px        | 700    | 1px            |
| **Menu items**  | 15px (1.2rem) | —    | 300-400 | 0px           |
| **Menu item spans** | 1.2rem | 20px   | 300    | —              |
| **Subheader title** | 30px | 35px      | 400    | 1px            |
| **Intro title** | 70px   | 70px        | 400    | 0px            |
| **Footer links**| 18px   | 1           | —      | —              |
| **List items**  | 18px   | —           | —      | —              |
| **Text base**   | 18px   | —           | —      | —              |
| **Buttons**     | 14px   | 14px        | 600    | —              |
| **Mobile body** | 1rem (16px) | —      | —      | —              |
| **Mobile buttons** | 12px | 15px       | —      | —              |

### Font Weights Used

- **300** — Light (h5, menu item spans)
- **400** — Regular (body, menu, subheader, intro)
- **500** — Medium (loaded via Google Fonts)
- **600** — Semi-bold (buttons)
- **700** — Bold (h2, h3, h4, h6, `dt`, Roboto loaded weight)
- **900** — Black (h1, Roboto loaded weight)

---

## 4. Button Styles

### Custom Button Classes

```css
/* Primary solid button (dark navy) */
.blue-button {
  background-color: #123046 !important;
  color: white !important;
}
.blue-button:hover {
  background-color: #017cc5 !important;
  color: white !important;
}

/* Primary bordered button (dark navy with white border) */
.blue-b-button {
  background-color: #123046 !important;
  color: white !important;
  border: 0.5px solid white !important;
}
.blue-b-button:hover {
  background-color: white !important;
  color: #123046 !important;
}

/* Ghost/outline button (white with dark border) */
.gray-button,
.white-button {
  background-color: #fff !important;
  color: #123046 !important;
}
.gray-button:hover,
.white-button:hover {
  background-color: #123046 !important;
  color: #fff !important;
}

/* Outlined ghost button */
.gray-b-button,
.white-b-button,
.red-button {
  background-color: #fff !important;
  color: #123046 !important;
  border: 0.5px solid #123046 !important;
}
.gray-b-button:hover,
.white-b-button:hover,
.red-button:hover {
  background-color: #123046 !important;
  color: white !important;
}
```

### Base Button Styling

```css
.button,
.btn {
  font-weight: 600;
  padding: 15px 30px;
  border-radius: 0;         /* Square corners, no rounding */
  line-height: 20px;
}
```

### Bootstrap Button Overrides

```css
.btn-primary {
  color: #fff;
  background-color: #123046;
  border-color: #123046;
}
.btn-primary:hover {
  background-color: #0a1b28;
  border-color: #08141d;
}

.btn-secondary {
  color: #fff;
  background-color: #017cc5;
  border-color: #017cc5;
}
.btn-secondary:hover {
  background-color: #01649f;
  border-color: #015c92;
}
```

### BeTheme Custom Button System

```css
/* Theme button */
.button_theme {
  color: #ffffff;
  background-color: #0095eb;
  border-color: transparent;
}
.button_theme:hover {
  color: #ffffff;
  background-color: #007cc3;
  border-color: transparent;
}

/* Default button */
.button (custom) {
  color: #626262;
  background-color: #dbdddf;
  border-color: transparent;
}

/* Action button */
.action_button {
  background-color: #f7f7f7;
  color: #747474;
}

/* Footer button */
.footer_button {
  color: #2b3b84 !important;
  background-color: transparent;
}

/* Custom button dimensions */
font-family: Roboto;
font-size: 14px;
line-height: 14px;
font-weight: 400;
letter-spacing: 0px;
padding: 12px 20px;
border-width: 0px;
border-radius: 0px;
```

---

## 5. Spacing Patterns

### WordPress Spacing Scale

| Token  | Value     |
|--------|-----------|
| `--20` | 0.44rem   |
| `--30` | 0.67rem   |
| `--40` | 1rem      |
| `--50` | 1.5rem    |
| `--60` | 2.25rem   |
| `--70` | 3.38rem   |
| `--80` | 5.06rem   |

### Layout Widths

| Element            | Value     |
|--------------------|-----------|
| Max content width  | 1250px    |
| Wrapper max-width  | 1270px    |
| Mobile max-width   | 550px     |
| Sidebar width      | 23%       |
| Sections group     | 77%       |

### Common Padding Values (from inline styles)

| Context                        | Value                      |
|--------------------------------|----------------------------|
| Section padding (large)        | `80px 20px 80px 100px`     |
| Section padding (dark navy)    | `80px 44px`                |
| Section padding (highlight)    | `120px 60px 120px 140px`   |
| Card inner padding             | `40px 20px`                |
| Footer widgets                 | `50px 0 30px 0`            |
| Footer social icon padding     | `8px`                      |
| Footer link padding            | `7px 0`                    |
| Sub-menu padding               | `15px` top/bottom          |
| Button padding                 | `15px 30px`                |
| Button padding (custom theme)  | `12px 20px`                |
| Mobile button padding          | `5px 8px`                  |

### Common Margins

| Context                | Value     |
|------------------------|-----------|
| Footer margin-top      | 25px      |
| Heading margin-bottom  | 0.5rem    |
| Paragraph margin-bottom| 1rem      |
| Body line-height       | 1.5       |

---

## 6. Breakpoints

| Name   | Value   |
|--------|---------|
| xs     | 0       |
| sm     | 576px   |
| md     | 768px   |
| lg     | 992px   |
| xl     | 1200px  |
| BeTheme sticky | 1240px |

---

## 7. Shadows

```css
/* Sticky header */
box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.1);

/* GDPR banner */
box-shadow: 0 15px 30px 0 rgba(1, 7, 39, 0.13);

/* WordPress presets */
--wp--preset--shadow--natural: 6px 6px 9px rgba(0, 0, 0, 0.2);
--wp--preset--shadow--deep: 12px 12px 50px rgba(0, 0, 0, 0.4);
--wp--preset--shadow--sharp: 6px 6px 0px rgba(0, 0, 0, 0.2);
--wp--preset--shadow--crisp: 6px 6px 0px rgb(0, 0, 0);
```

---

## 8. Other Notable Styles

### Border Radius
- **Buttons**: `0` (square corners throughout the site)
- **Bootstrap default .btn**: `0.25rem`
- **Alert boxes**: `0`
- **GDPR banner**: `5px`

### Transitions
- Button transitions: `color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out`
- Footer link transitions: `0.3s`

### Helper Classes

```css
.primary-color        { color: #132046; }
.primary-background   { background-color: #123046; color: #fff; }
.secondary-background { background-color: #017cc5; color: #fff; }
.third-background     { background-color: #606ca3; }
.fourth-background    { background-color: #e0eff8; }
.fifth-background     { background-color: #868686; }
.sixth-background     { background-color: #aa121f; }
.white-text, .white-text * { color: #fff !important; }
.text-base            { color: #132046; font-size: 18px; }
.title                { color: #123046 !important; }
```

---

## Summary: Key Brand Colors at a Glance

```
Primary Dark Navy:    #123046
Primary Navy:         #132046
Brand Blue:           #2b3b84
Secondary Blue:       #017cc5
Accent Blue:          #0095eb
Link Hover Blue:      #007cc3
Header Background:    #000119
Body Gray:            #868686
Heading Dark:         #161922
Light Blue Tint:      #e0eff8
Waikawa Purple:       #606ca3
Red Accent:           #aa121f
Page Background:      #FCFCFC
Link Red:             #e41e2f
```
