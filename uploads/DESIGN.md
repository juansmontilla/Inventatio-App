---
name: Traction Logic
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#1e1200'
  on-tertiary: '#ffffff'
  tertiary-container: '#35260c'
  on-tertiary-container: '#a38c6a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fadfb8'
  tertiary-fixed-dim: '#ddc39d'
  on-tertiary-fixed: '#271902'
  on-tertiary-fixed-variant: '#564427'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  input-text:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 20px
  element-gap: 16px
  form-stack: 24px
  input-height: 48px
---

## Brand & Style

The brand personality is rooted in **utilitarian professionalism**. It is designed for users in high-activity industrial or automotive environments where speed and accuracy are paramount. The visual language avoids decorative clutter, favoring a **minimalist, corporate** aesthetic that emphasizes data integrity and ease of use.

The goal is to evoke a sense of reliability and sturdiness. By using generous whitespace and a restricted color palette, the interface reduces cognitive load, allowing workers to focus on inventory tasks without distraction. The style is clean and modern, leveraging subtle depth to guide the eye through complex forms.

## Colors

The palette is anchored by **Deep Charcoal Blue** (Primary), providing a stable and professional foundation. The primary color is used for headers, key navigational elements, and main buttons to signify authority and importance.

**Muted Amber** (Accent) is used sparingly for critical status indicators or to highlight the final "Save" action, ensuring it stands out against the cooler neutral tones. **Slate Grays** (Secondary) handle borders and secondary information, maintaining a soft contrast that doesn't overwhelm the user. The background is a crisp, cool white to maximize the legibility of the charcoal-colored text.

## Typography

This design system utilizes **Inter** for its exceptional legibility and neutral, technical character. The hierarchy is optimized for form-heavy mobile interfaces:

- **Headlines:** Uses heavy weights for screen titles to provide instant context.
- **Labels:** Set in `label-bold` to ensure field descriptors are easily scannable, even at a glance in low-light environments.
- **Input Text:** Scaled to 16px to prevent iOS auto-zoom on focus and maintain high readability.
- **Numeric Data:** All numeric values (Quantity, DOT) should use default proportional figures for clarity.

## Layout & Spacing

The layout follows a **fluid-to-safe-area** model designed primarily for mobile portrait orientation. It utilizes a vertical stack rhythm to accommodate the inventory form's linear flow.

- **Margins:** A standard 20px lateral margin ensures content does not feel cramped against the screen edges.
- **Vertical Rhythm:** Elements are spaced in multiples of 8px. Groups of related fields (e.g., Brand and Tread Pattern) use 16px gaps, while distinct sections (e.g., General Info vs. Photos) use 24px or 32px margins to create clear visual separation without the need for heavy dividers.
- **Touch Targets:** All interactive elements, including dropdowns and buttons, maintain a minimum height of 48px for easy operation.

## Elevation & Depth

To maintain a professional, industrial feel, depth is conveyed through **low-contrast outlines** and **tonal layering** rather than heavy shadows.

- **Level 0 (Background):** The base layer uses the background color.
- **Level 1 (Form Fields/Cards):** Surfaces are flat white with a 1px border (#E2E8F0). On focus, the border transitions to the primary deep blue with a subtle 4px ambient blue glow (0% opacity to 10%).
- **Primary Action:** The "Save" button uses a slight drop shadow (Y: 2px, Blur: 4px, 10% opacity) to provide a tactile "pressable" feel, distinguishing it from the flat informational fields.

## Shapes

The design system employs a **Rounded** (Level 2) shape language. This provides a balance between the precision of a professional tool and the modern friendliness of a contemporary app.

- **Inputs & Buttons:** 8px (`0.5rem`) corner radius.
- **Photo Placeholders:** 8px corner radius to match the input fields.
- **Container Cards:** 16px (`1rem`) corner radius for larger groupings if secondary containers are used.

## Components

### Input Fields
Inputs consist of a bold label positioned above the field. The field container is white with a light gray border. Placeholder text should be muted gray (#94A3B8).

### Dropdowns (Selects)
Use the same styling as input fields but include a chevron icon on the right side. The dropdown menu should appear as a bottom sheet on mobile for better ergonomic reach.

### Photo Grid
For the "Fotos" section, use a 2x2 grid of squares. Each square features a dashed border with a centered "Camera" or "Plus" icon when empty. Once a photo is taken, the image fills the square with an "8px" corner radius.

### Primary Button (Grabar)
The "Grabar" (Save) button is full-width, utilizing the primary Deep Charcoal Blue with white text. It should be pinned to the bottom of the viewport or placed at the end of the scrollable form with significant padding to ensure it is the focal point of the completion flow.

### Status Chips
Use small, rounded chips for "Condition" or "State" previews (e.g., "New", "Used", "Damaged"), color-coded with muted versions of green, yellow, or red respectively.