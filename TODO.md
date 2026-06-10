# Project TODOs & Next Steps

## 1. Environment Setup
- [ ] **Update Node.js**: Upgrade to the latest Node.js LTS version (or at least `^24.15.0`) to ensure full compatibility with Angular 22+ and the latest build tools.

## 2. Frontend UI/UX Exploration & Architecture (Tailwind CSS)
*Deep dive into the components and patterns required to build an incredibly intuitive, gorgeous, and modern user interface.*

### Core Components to Research & Implement:
- [ ] **Dashboards**: Design the overall application shell, including responsive sidebars, top navigation, and metric/stat cards.
- [ ] **Recycler Views (Virtual Scrolling)**: Implement highly performant lists for large datasets (likely leveraging `@angular/cdk/scrolling` combined with Tailwind styling).
- [ ] **Data Tables**: Build robust tables featuring pagination, column sorting, sticky headers, and inline row actions.
- [ ] **Search Boxes**: Create global and localized search inputs with debouncing, clear buttons, and autocomplete dropdowns.
- [ ] **Overlays & Modals**: Design accessible dialogs, slide-overs (drawers), popovers, and tooltips with proper focus management and backdrop blurs.
- [ ] **Call to Actions (CTAs)**: Design prominent, engaging buttons and banner sections to guide user flow.

### UX/UI Polish:
- [ ] **Micro-interactions & Animations**: Utilize Tailwind's transition and animation utilities to make interactions feel smooth and responsive.
- [ ] **Accessibility (A11y)**: Ensure all components meet WCAG AA standards (color contrast, ARIA labels, keyboard navigation).
- [ ] **Component Library Strategy**: Decide whether to build these from scratch using pure Tailwind CSS v4, or adopt a headless UI library (like Angular CDK, Spartan/ui, or PrimeNG configured for Tailwind) to speed up development while maintaining a bespoke look.
