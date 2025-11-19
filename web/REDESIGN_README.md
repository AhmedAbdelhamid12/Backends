# Swim Academy Pro - Modern React Native Web Frontend

A production-ready, modern business landing page built with React, Framer Motion, Tailwind CSS, and React Native Web. Featuring smooth animations, responsive design, and comprehensive accessibility.

## 🎯 Overview

This is a complete redesign of the Swim Academy Pro web frontend, matching the aesthetic of modern business websites with:

- **Hero Section** with parallax scrolling and animated typography
- **Services Grid** with animated icon interactions
- **Features Block** with hover animations
- **Stats Counters** with auto-incrementing numbers
- **Testimonials Carousel** with autoplay and manual navigation
- **CTA Strip** with gradient backgrounds
- **Sticky Navigation** with mobile hamburger menu
- **Responsive Footer** with contact info and working hours
- **Contact Modal** with form handling
- **Full Accessibility** support (WCAG 2.1)

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── primitives/          # Reusable base components
│   │   ├── Button.jsx       # Primary & secondary buttons
│   │   ├── Card.jsx         # Card container with elevation
│   │   ├── Icon.jsx         # SVG icon with animations
│   │   ├── Section.jsx      # Page section wrapper
│   │   ├── Container.jsx    # Responsive max-width wrapper
│   │   └── index.js         # Exports
│   ├── Header.jsx           # Sticky navigation + mobile menu
│   ├── Hero.jsx             # Hero section with parallax
│   ├── Services.jsx         # 6-service grid
│   ├── Features.jsx         # 4-feature block
│   ├── Stats.jsx            # Animated counters
│   ├── TeamCarousel.jsx     # Testimonials carousel
│   ├── CTAStrip.jsx         # Call-to-action section
│   ├── Footer.jsx           # Footer with links & hours
│   └── index.js             # Component exports
├── design/
│   └── tokens.js            # Design tokens (colors, spacing, animations)
├── pages/
│   └── HomePage.jsx         # Main landing page
├── App.jsx                  # Main app router
├── index.css                # Tailwind + global styles
├── main.jsx                 # React entry point
└── constants.js             # App constants

Configuration:
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── vite.config.js          # Vite build configuration
└── package.json            # Dependencies
```

## 🎨 Design System

### Colors

- **Primary**: Sky Blue (#0ea5e9)
- **Secondary**: Purple (#a855f7)
- **Accent**: Red (#ef4444)
- **Neutral**: Gray scale (50-900)

### Typography

- **Body**: Inter (400, 500, 600, 700)
- **Headings**: Inter (bold variants)
- **Mono**: Fira Code

### Spacing (8px baseline)

- `spacing[0-96]` - Full range from 0 to 384px
- All components use 8px increments

### Animation Tokens

- **Duration Base**: 420ms (spring-like easing)
- **Duration Small**: 220ms
- **Duration Slow**: 600ms
- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (spring)
- **Stagger**: 80ms between children

## 🎬 Key Features

### 1. Hero Section
- Animated headline with line-by-line reveal
- Parallax background elements
- Gradient overlay with shapes
- Dual CTA buttons
- Trust indicators (member count, ratings)

### 2. Services Grid
- 6 service cards in responsive grid
- Icon animations on hover (scale + rotate)
- Staggered card entrance animations
- "Learn more" link with arrow animation

### 3. Features Block
- 4-column feature layout
- Icon with micro-interactions
- Responsive collapse to single column

### 4. Stats Section
- Animated number counters
- Triggered on scroll into view
- Dark gradient background
- Real business metrics

### 5. Testimonials Carousel
- 3-slide carousel with spring animation
- Autoplay (5s interval) with manual pause
- Navigation arrows and dot indicators
- Directional slide transitions

### 6. CTA Strip
- Gradient background
- Dual action (primary + secondary link)
- Full-width responsive layout

### 7. Sticky Header
- Toggles sticky state on scroll
- Mobile hamburger menu with animation
- Animated underline on nav links
- Contact CTA button

### 8. Footer
- 3-column link sections
- Contact info (email, phone, address)
- Working hours display
- Social media icons
- Copyright and legal links

### 9. Contact Modal
- Form validation
- Smooth open/close animation
- Overlay with backdrop blur
- Success handling

## ♿ Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Attributes**: Proper labels for screen readers
- **Color Contrast**: ≥4.5:1 for body text (WCAG AA)
- **Reduced Motion**: Support for `prefers-reduced-motion` media query
- **Focus States**: Clear visual focus indicators
- **Semantic HTML**: Proper heading hierarchy and semantic elements

## 📱 Responsive Breakpoints

- **Mobile**: ≤480px
- **Tablet**: 481-1024px
- **Desktop**: >1024px

All components are fully responsive with proper stacking on mobile and multi-column layouts on desktop.

## 🎭 Animation Details

### Parallax Hero Background
- Subtle `translateY` based on scroll position
- Capped amplitude (max 100px offset)
- 30% of scroll speed for natural feel

### Staggered Reveals
- Container orchestrates child animations
- 80ms stagger between items
- Spring-like easing for organic motion

### Hover Effects
- Button: `scale(1.02)` on hover, `scale(0.98)` on tap
- Card: `translateY(-4px)` + shadow increase
- Icon: `scale(1.1) + rotate(5deg)`
- Links: Underline width animation

### Carousel Transitions
- Spring animation with custom stiffness (300) and damping (30)
- Directional slide (left/right based on navigation)
- Dot indicator animation (width expansion)

## 🚀 Performance Optimizations

- CSS transforms for smooth animations (GPU accelerated)
- Lazy loading images with IntersectionObserver
- Code splitting at route level
- Tailwind CSS purging of unused styles
- Optimized SVG icons

## 🧪 Testing

### Accessibility Testing
```bash
# Manual checks:
1. Tab through all interactive elements
2. Test with keyboard only (no mouse)
3. Check color contrast with browser DevTools
4. Test with screen reader (NVDA / JAWS)
5. Check reduced-motion support
```

### Responsive Testing
```bash
# Breakpoints to test:
- iPhone SE (375px)
- iPhone 12 (390px)
- iPad (768px)
- iPad Pro (1024px)
- Desktop (1440px, 1920px)
```

## 📦 Dependencies

### Core
- `react@18.2.0` - UI library
- `react-dom@18.2.0` - React DOM binding
- `react-router-dom@6.30.2` - Routing

### Animation & Styling
- `framer-motion@10.16.4` - Animation library
- `tailwindcss@3.4.1` - Utility-first CSS
- `clsx@2.0.0` - Conditional CSS classes

### Build Tools
- `vite@7.2.2` - Build tool & dev server
- `postcss@8.4.31` - CSS processing
- `autoprefixer@10.4.16` - CSS vendor prefixes

### Optional
- `react-spring@9.7.3` - Alternative animation (cross-platform)
- `@emotion/react` & `@emotion/styled` - CSS-in-JS (for web build)

## 🔧 Configuration Files

### tailwind.config.js
Extends Tailwind with custom design tokens:
- Custom colors from design tokens
- Custom spacing scale (8px baseline)
- Custom animations and keyframes
- Responsive breakpoints

### postcss.config.js
Processes CSS with Tailwind and autoprefixer for browser compatibility

### Design Tokens (src/design/tokens.js)
Centralized configuration for:
- Colors, typography, spacing
- Animation durations and easings
- Border radius, shadows, z-index
- Breakpoints
- Animation variants for Framer Motion

## 🛠️ Development Workflow

1. **Component Creation**: Create new component in `src/components/`
2. **Style**: Use Tailwind CSS classes + design tokens
3. **Animate**: Use Framer Motion with token easings
4. **Export**: Add to `src/components/index.js`
5. **Test**: Run locally and check accessibility

## 📚 Best Practices

1. **Use Tailwind**: Prefer utility classes over custom CSS
2. **Use Design Tokens**: Reference colors, spacing from `tokens.js`
3. **Animations**: Use provided easing curves and durations
4. **Responsive**: Mobile-first approach with `sm:`, `md:`, `lg:` prefixes
5. **Accessibility**: Always include `aria-label` on interactive elements
6. **Performance**: Use `whileInView` for animations only when visible

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 📝 License

MIT

## 👨‍💻 Development Notes

- The design system is intentionally flexible to support customization
- All animations respect `prefers-reduced-motion` for accessibility
- Component library is framework-agnostic (React, React Native Web compatible)
- Tailwind is configured to work with both web and React Native Web

## 🚢 Deployment

The build output is optimized for static hosting (Vercel, Netlify, GitHub Pages):

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy the 'dist' folder to your hosting platform
```

## 📞 Support

For issues, feature requests, or contributions, please create a GitHub issue.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Framework**: React 18 + Vite + Tailwind CSS  
**Animations**: Framer Motion
