# Development Guidelines

Welcome to the Refine development team! This document outlines the standards and best practices we follow to maintain a clean, scalable, and performant codebase.

---

## 🛠 Tech Stack Standards

- **React**: Functional components only. Use `shadcn/ui` for UI primitives.
- **Styling**: Tailwind CSS 4. Follow the utility-first approach. Use the `cn()` utility for conditional classes.
- **State Management**: 
  - Use `useState` for local component state.
  - Use `Context API` for global application state (Auth, Theme).
  - Use `SWR` or `React Query` for server-state caching (Planned).
- **TypeScript**: Strict mode enabled. Avoid `any`. Define interfaces in `types/` or locally if specific to a component.

---

## 📂 Project Structure & Naming

### Directory Layout
- `components/ui/`: Low-level, reusable atoms (Buttons, Inputs).
- `components/modules/`: Feature-specific organisms (LinkCard, AddModal).
- `hooks/`: Custom React hooks named `use[Feature].ts`.
- `lib/`: Pure utility functions and shared services.

### Naming Conventions
- **Components**: PascalCase (e.g., `LinkCard.tsx`).
- **Hooks**: camelCase (e.g., `useAuth.ts`).
- **Files**: kebab-case for everything else (e.g., `check-duplicate.ts`).
- **CSS Classes**: Tailwind utility classes first. Custom classes in `globals.css` should be avoided.

---

## 🚀 Git Flow & Commits

### Branching
- `main`: Production-ready code.
- `develop`: Integration branch for new features.
- `feature/[name]`: Individual feature development.
- `fix/[name]`: Bug fixes.

### Commit Messages
We follow the **Conventional Commits** specification:
- `feat: ...` for new features.
- `fix: ...` for bug fixes.
- `docs: ...` for documentation changes.
- `refactor: ...` for code changes that neither fix a bug nor add a feature.
- `style: ...` for UI/formatting changes.

---

## 🧪 Documentation & Testing

### Code Comments
- Write comments for "Why", not "What".
- Use JSDoc for complex utility functions.

### Testing (Future)
- **Unit Tests**: `Vitest` for utility functions in `lib/`.
- **E2E Tests**: `Playwright` for critical flows (Login -> Save Link -> Delete).

---

## 🛡 Security Practices

1. **Secrets**: Never commit `.env` files. Use `.env.example` as a template.
2. **API Routes**: Always wrap protected routes with the `withAuth` HOC.
3. **Database**: Always enable RLS on new tables. Test policies thoroughly in the Supabase dashboard.
4. **Scraping**: Be respectful of `robots.txt` and implement appropriate delays if needed.

---

## 🎨 UI/UX Guidelines

- **Responsiveness**: Mobile-first design. Test all components on small screens.
- **Loading States**: Always provide a `Skeleton` component for data-fetching states.
- **Toasts**: Use `sonner` or similar for success/error feedback on all user actions.
- **Accessibility (a11y)**: Use Radix UI primitives to ensure ARIA compliance.

---

## 📝 PR Checklist

- [ ] Does this follow the project's styling and naming conventions?
- [ ] Are all new functions typed correctly?
- [ ] Does this include necessary documentation updates?
- [ ] Have you tested the feature on both mobile and desktop viewports?
- [ ] Does it maintain or improve the current performance metrics?

---
*Last Updated: January 2026*
