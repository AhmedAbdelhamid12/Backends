# Design System & Asset Guide
## Swim Academy Pro - Web Redesign v1.0

This document provides comprehensive information about the design system, assets, and implementation details for the Swim Academy Pro web redesign.

---

## 🎨 Color Palette

### Primary Colors
```
Primary: #0ea5e9 (Sky Blue)
  - 50:  #f0f9ff  (Lightest)
  - 100: #e0f2fe
  - 200: #bae6fd
  - 300: #7dd3fc
  - 400: #38bdf8
  - 500: #0ea5e9  (Brand Color)
  - 600: #0284c7
  - 700: #0369a1
  - 800: #075985
  - 900: #0c3d66  (Darkest)
```

### Secondary Colors
```
Secondary: #a855f7 (Purple)
  - Used for accent elements and gradients
  - Complements primary blue
```

### Accent Colors
```
Accent: #ef4444 (Red)
  - Reserved for CTAs and important actions
  - High contrast for visibility
```

### Neutral Colors
```
Neutral: Gray Scale
  - 0:   #ffffff  (White)
  - 50:  #f9fafb
  - 100: #f3f4f6
  - 200: #e5e7eb
  - 300: #d1d5db
  - 400: #9ca3af
  - 500: #6b7280
  - 600: #4b5563
  - 700: #374151
  - 800: #1f2937
  - 900: #111827  (Black)
```

---

## 📐 Typography System

### Font Stack
- **Body**: Inter (400, 500, 600, 700)
- **Headings**: Inter (bold variants - 700, 800)
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Mono**: Fira Code (for code blocks)

### Font Sizes
```
xs:  12px   (Small labels)
sm:  14px   (Small text)
base: 16px  (Body text)
lg:  18px   (Large text)
xl:  20px   (Extra large)
2xl: 24px   (Section intro)
3xl: 30px   (Subheadings)
4xl: 36px   (Large headings)
5xl: 48px   (Major headings)
6xl: 60px   (Hero headline)
7xl: 72px   (Maximum size)
```

### Line Heights
- **Tight**: 1.2 (For headlines)
- **Snug**: 1.375 (For larger text)
- **Normal**: 1.5 (Default - body text)
- **Relaxed**: 1.625 (For accessibility)
- **Loose**: 2 (For spaced content)

---

## 📏 Spacing System (8px Baseline)

All spacing follows an 8px grid:
```
0:  0px
1:  4px
2:  8px
3:  12px
4:  16px
5:  20px
6:  24px
7:  28px
8:  32px
9:  36px
10: 40px
12: 48px
14: 56px
16: 64px
20: 80px
24: 96px
28: 112px
32: 128px
36: 144px
40: 160px
44: 176px
48: 192px
52: 208px
56: 224px
60: 240px
64: 256px
72: 288px
80: 320px
96: 384px
```

### Common Spacing Usage
- **Padding**: 16px, 24px, 32px, 48px
- **Margin**: 8px, 16px, 24px, 32px
- **Gap**: 16px, 24px, 32px
- **Section Spacing**: 64px (mobile), 96px (desktop)

---

## 🔘 Border Radius

```
none:  0px
sm:    2px
base:  4px
md:    6px
lg:    8px
xl:    12px
2xl:   16px
3xl:   24px
full:  9999px (Circles)
```

### Component Usage
- Buttons: `lg` (8px)
- Cards: `xl` (12px)
- Sections: `2xl` (16px)
- Images: `xl` (12px)
- Icons (circular): `full`

---

## 🎬 Animation System

### Duration Tokens
```
instant: 0ms      (No animation)
fast:    150ms    (Quick feedback)
small:   220ms    (Micro interactions)
base:    420ms    (Standard - Most animations)
slow:    600ms    (Entrance animations)
slower:  900ms    (Slow reveals)
```

### Easing Curves
```
linear:      linear                                  (No easing)
ease:        ease                                    (CSS ease)
easeIn:      cubic-bezier(0.4, 0, 1, 1)           (Accelerating)
easeOut:     cubic-bezier(0, 0, 0.2, 1)           (Decelerating)
easeInOut:   cubic-bezier(0.4, 0, 0.2, 1)         (Both)
spring:      cubic-bezier(0.22, 1, 0.36, 1)       (Spring-like - PRIMARY)
bounce:      cubic-bezier(0.68, -0.55, 0.265, 1.55) (Bouncy)
backOut:     cubic-bezier(0.175, 0.885, 0.32, 1.275) (Back exit)
```

### Stagger
- Default stagger: 80ms between children
- Used in container animations
- Creates sequential reveal effect

---

## 🌈 Shadows

```
none:  none
xs:    0 1px 2px 0 rgba(0, 0, 0, 0.05)
sm:    0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
base:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
md:    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
lg:    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
xl:    0 25px 50px -12px rgba(0, 0, 0, 0.25)
2xl:   0 25px 50px -12px rgba(0, 0, 0, 0.25)
inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)
```

### Component Usage
- Cards: `base` (default), `lg` (on hover)
- Buttons: `lg` (with shadow variant)
- Modals: `2xl`
- Icons: `none` or `sm`

---

## 📱 Breakpoints (Mobile-First)

```
xs: 0px      (Mobile)
sm: 480px    (Large Mobile)
md: 768px    (Tablet)
lg: 1024px   (Desktop)
xl: 1280px   (Large Desktop)
2xl: 1536px  (Extra Large Desktop)
```

### Tailwind Prefixes
- `sm:` - Apply at 480px and above
- `md:` - Apply at 768px and above
- `lg:` - Apply at 1024px and above
- `xl:` - Apply at 1280px and above

---

## 🎭 Animation Variants

### Container (Staggered Children)
```javascript
{
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
}
```

### Item (Fade + Slide In)
```javascript
{
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}
```

### Slide In Animations
- `slideInUp`: y: -40 → 0
- `slideInDown`: y: 40 → 0
- `slideInLeft`: x: -40 → 0
- `slideInRight`: x: 40 → 0

### Scale Animations
- `scaleIn`: scale: 0.9 → 1
- `rotateIn`: rotate: -10 → 0

---

## 🎯 Component Specifications

### Button
**Variants:**
- `primary` - Brand blue background
- `secondary` - Light gray background
- `accent` - Red background
- `outline` - Bordered style
- `ghost` - Text only

**Sizes:**
- `sm` - px-3 py-2 text-sm
- `md` - px-4 py-2.5 text-base (Default)
- `lg` - px-6 py-3 text-lg
- `xl` - px-8 py-4 text-xl

**States:**
- Default, Hover (+2% scale), Tap (-2% scale), Disabled (50% opacity)

### Card
- Background: White
- Border Radius: 12px
- Shadow: Base → Lg on hover
- Hover: Translate Y -4px
- Animation: Fade in on scroll

### Icon
**Sizes:**
- `sm` - 32px
- `md` - 48px (Default)
- `lg` - 64px
- `xl` - 80px

**Variants:**
- `default` - Blue background
- `secondary` - Purple background
- `accent` - Red background
- `white` - White text
- `neutral` - Gray text

**Animation:**
- Hover: Scale 1.1 + Rotate 5deg
- Tap: Scale 0.95

### Section
**Backgrounds:**
- `white` - Solid white
- `light` - Light gray
- `dark` - Dark gray with white text
- `gradient` - Blue→White→Purple
- `gradient-dark` - Dark gradient

**Props:**
- `fullHeight`: min-h-screen flex center
- `animated`: whileInView animation
- `id`: For navigation anchors

### Container
**Sizes:**
- `sm` - max-w-2xl (672px)
- `md` - max-w-4xl (896px)
- `lg` - max-w-6xl (1152px) - Default
- `xl` - max-w-7xl (1280px)
- `full` - 100% width

---

## 🎪 Hero Section Details

### Layout
- Responsive: Stack mobile, side-by-side desktop
- Hero height: 100vh (full screen)
- Text column: Left
- Image column: Right (hidden on mobile)

### Animations
- Eyebrow: Fade in
- Headline: Line-by-line reveal (staggered)
- Subheadline: Slide up
- Buttons: Slide up (staggered)
- Background elements: Continuous gentle animation

### Parallax
- Triggered on scroll
- `translateY` offset: scroll * 0.3
- Maximum 100px amplitude
- Applied to image background

---

## 🗂️ Services Grid

- 6 cards in 3-column grid (desktop)
- 2 columns (tablet)
- 1 column (mobile)
- Icon animation: Scale 1.15 + Rotate 10deg on hover
- Staggered entrance: 100ms between cards

---

## 📊 Stats Section

- 4 items in 4-column grid (desktop)
- Counter animation: 2-second count up
- Triggered on scroll into view
- Dark gradient background

---

## 🎠 Team Carousel

- 3 slides with testimonials
- Autoplay: 5-second interval
- Navigation: Previous/Next buttons + Dot indicators
- Transition: Spring animation (stiffness: 300, damping: 30)
- Directional slides based on navigation

---

## 📞 Footer

- 4 columns (desktop), stacked (mobile)
- Contact info: Email, Phone, Address
- Working hours: Daily breakdown
- Social links: Facebook, Twitter, Instagram
- Quick links: Home, Services, Features, Team
- Legal: Privacy, Terms, Cookies

---

## ♿ Accessibility Specifications

### Color Contrast
- Body text (70-100): 4.5:1 (WCAG AA)
- Headings (16-18): 3:1 (WCAG AA)
- Interactive: 4.5:1 minimum

### Focus States
- Outline: 2px solid primary-500
- Offset: 2px
- Box shadow: 0 0 0 3px rgba(primary, 0.1)

### ARIA Labels
- All buttons: `aria-label` or `aria-labelledby`
- Modals: `role="dialog"`
- Navigation: `aria-expanded` for toggles
- Carousels: `role="region"` with `aria-label`

### Keyboard Navigation
- Tab order: Logical flow (left to right, top to bottom)
- Escape: Close modals
- Enter: Activate buttons
- Arrow keys: Navigate carousel

### Reduced Motion
- All animations respect `prefers-reduced-motion: reduce`
- Animation durations set to 0.01ms
- Scroll behavior: auto

---

## 🚀 Performance Optimization Tips

1. **Images**: Use `<picture>` with srcset for responsive images
2. **Lazy Loading**: IntersectionObserver for off-screen images
3. **CSS Transforms**: Use transform/opacity for animations (GPU acceleration)
4. **Code Splitting**: Lazy load heavy sections with React.lazy
5. **Tailwind Purging**: Automatically removes unused styles
6. **SVG Icons**: Inline for small icons, external file for larger sets

---

## 📝 Implementation Checklist

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Test responsive breakpoints (mobile, tablet, desktop)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test color contrast with WebAIM or similar
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test reduced-motion preference
- [ ] Run Lighthouse audit
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Build production: `npm run build`
- [ ] Test production build: `npm run preview`

---

## 🔗 Resources

- Design Tokens: `src/design/tokens.js`
- Component Library: `src/components/`
- Tailwind Config: `tailwind.config.js`
- Icons: `src/components/primitives/Icon.jsx`
- Reference Site: https://xtratheme.com/elementor/business-2/

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained by**: Swim Academy Pro Team
