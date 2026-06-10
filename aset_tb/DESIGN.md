---
name: ASET-TB
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7d9e5'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fe'
  surface-container: '#ebedf9'
  surface-container-high: '#e6e8f3'
  surface-container-highest: '#e0e2ed'
  on-surface: '#181c23'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3039'
  inverse-on-surface: '#eef0fb'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc0'
  primary: '#0059bb'
  on-primary: '#ffffff'
  primary-container: '#0070ea'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc7ff'
  secondary: '#006c4f'
  on-secondary: '#ffffff'
  secondary-container: '#67fcc6'
  on-secondary-container: '#007354'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#67fcc6'
  secondary-fixed-dim: '#44dfab'
  on-secondary-fixed: '#002116'
  on-secondary-fixed-variant: '#00513a'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#e0e2ed'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  button-text:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is anchored in a **Corporate / Modern** aesthetic tailored for the healthcare sector. It prioritizes clarity, patient safety, and emotional support. The visual language aims to reduce the cognitive load on patients—who may be managing complex medication schedules—by utilizing significant whitespace and a structured information hierarchy.

The emotional response should be one of "Guided Empowerment." The interface avoids clinical coldness by using soft geometry and a calming color palette, fostering a sense of reliability and optimism. This design system bridges the gap between a rigorous medical tool and a supportive daily companion.

## Colors

The palette is dominated by **Medical Blue** (#007BFF) for primary actions and navigation, symbolizing trust and authority. **Healing Teal** (#20C997) serves as the secondary color, used for health-related success states, progress indicators, and supportive highlights.

The neutral palette leans toward "Cool Grays" to maintain a sterile, clean environment without appearing harsh. Backgrounds utilize a soft off-white to reduce eye strain. High-contrast ratios are strictly maintained for all text elements to ensure accessibility for users with varying visual acuity.

## Typography

This design system utilizes a dual-font strategy. **Manrope** is used for headlines to provide a modern, balanced, and professional structure. For all body copy and labels, **Atkinson Hyperlegible Next** is employed to maximize readability—a critical requirement for patients who may experience fatigue or blurred vision as side effects.

Type scales are generous, avoiding small font sizes below 14px. Line heights are kept airy to prevent text-heavy medical instructions from feeling overwhelming. All interactive text elements feature increased letter spacing for better legibility at a glance.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for a mobile-first experience. A standard 12-column grid is used for desktop environments, while a 4-column grid governs mobile views. 

Spacing is governed by an 8px base unit. To achieve the "supportive and clean" feel, the design system mandates a "negative space first" approach—surrounding critical medical data and medication alerts with significant padding (minimum 24px) to ensure focus is maintained on one task at a time. Safe areas are strictly enforced for bottom-navigation and floating action buttons to prevent accidental taps.

## Elevation & Depth

Visual hierarchy in this design system is achieved through **Tonal Layers** and **Ambient Shadows**. Surfaces are categorized into three levels:
1.  **Floor:** The base background (#F8FAFC).
2.  **Surface:** White containers used for primary content cards.
3.  **Overlay:** Modals and menus.

Depth is communicated via extra-diffused, low-opacity shadows (Blur: 20px, Opacity: 6%) tinted with the Primary Blue to maintain a soft, cohesive look. This "soft-depth" approach avoids the clinical harshness of heavy borders while ensuring that interactive cards appear physically pressable.

## Shapes

The shape language is consistently **Rounded**, using a 0.5rem (8px) base radius for standard components and 1rem (16px) for larger container cards. This choice softens the "institutional" feel of a healthcare app, making the interface feel approachable and friendly. Icons should feature rounded caps and joins to align with the component geometry.

## Components

### Buttons
Buttons must have a minimum height of **48px** for mobile accessibility. Primary buttons use the Primary Blue with white text, while secondary buttons use a light Teal ghost style. All buttons feature the standard 8px rounded corners.

### Cards
Cards are the primary vessel for information. They should have a subtle 1px border (#E2E8F0) and the soft ambient shadow defined in the Elevation section. Padding within cards should be a minimum of 20px.

### Input Fields
Inputs must have large, clear labels positioned above the field. The active state is indicated by a 2px Primary Blue border. Error states must include both a red border and a specific icon to ensure accessibility for color-blind users.

### Medication Trackers
A custom component for "Dose Confirmation" should use a large, pill-shaped toggle or a high-contrast checkbox. The touch target for "Mark as Taken" must be at least 56px in height to accommodate users with dexterity challenges.

### Chips & Badges
Use chips for "Symptom Tags" or "Medication Status." These should have a pill-shape (100px radius) and use desaturated versions of the Primary and Secondary colors to remain secondary in the visual hierarchy.

### Progress Indicators
Linear progress bars should use the Healing Teal to represent treatment completion, providing positive reinforcement to the patient.