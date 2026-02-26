# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SwissCars.md is a multilingual car dealership website built with Next.js 16 and Supabase. It supports three languages (Romanian, Russian, English) with Romanian as the default locale.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests with Vitest
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## Architecture

### Route Structure

The app uses Next.js App Router with three main route groups:

- **`/app/[locale]/`** - Public-facing pages with i18n support (ro/ru/en)
- **`/app/admin/`** - Admin dashboard (protected, requires authentication)
- **`/app/login/`** - Authentication page (no i18n)

The default locale (ro) has no URL prefix; other locales use `/ru/` or `/en/` prefixes.

### Authentication

- **Login page**: `/login` - Email/password authentication
- **Admin routes**: Protected by `getUser()` check in admin layout
- **Auth actions**: `lib/actions/auth.ts` - `signIn()`, `signOut()`, `getUser()`
- **Auth callback**: `/auth/callback` - Handles Supabase auth redirects

### Internationalization

- **next-intl** handles i18n with configuration in `i18n/`
- Translation files live in `messages/{locale}.json`
- Use `routing.ts` for locale config, `navigation.ts` for typed links
- Content (car descriptions, features) stored as JSON objects with locale keys: `{ ro: "...", ru: "...", en: "..." }`
- Middleware (`middleware.ts`) handles locale routing, excludes `/admin`, `/api`, `/login`, `/auth`

### Data Layer

**Supabase** is used for:
- Database (cars, car_images, reviews, partners, leads_inquiries, settings)
- Storage (car images in `car-images` bucket)
- Auth (admin access)

Key patterns:
- `lib/supabase/server.ts` - Server-side client (uses cookies)
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/queries.ts` - Read-only queries with pagination support
- `lib/actions/*.ts` - Server Actions for mutations

### Security Features

- **XSS Protection**: `lib/utils/sanitize.ts` - DOMPurify wrapper for HTML sanitization
- **Rate Limiting**: `lib/utils/rateLimit.ts` - IP-based rate limiting (10 req/min for contact form)
- **Error Handling**: Error boundaries at global, locale, and admin levels

### Pagination

Paginated queries available:
- `getCarsPaginated()` - Public cars listing (12 per page)
- `getAllCarsPaginated()` - Admin cars listing (20 per page)
- `getAllReviewsPaginated()` - Admin reviews listing (20 per page)
- Leads page has built-in pagination (20 per page)

### Types

Zod schemas in `lib/types/index.ts` define Car, Review, and Partner types. These schemas handle form validation and type inference.

### Component Organization

```
components/
├── admin/          # Admin forms and tables (CarEditForm, ReviewForm, etc.)
├── analytics/      # Google Analytics
├── cars/           # Car listing, detail, and pagination components
├── home/           # Homepage sections (Hero, CarsGrid, ReviewsSlider)
├── layout/         # Header, Footer, MobileMenu
└── ui/             # Shared UI (Pagination, Preloader, WhatsAppFloat)
```

### Utilities

```
lib/utils/
├── errors.ts      # AppError class, error messages
├── rateLimit.ts   # IP-based rate limiting
└── sanitize.ts    # XSS protection with DOMPurify
```

### Testing

- **Framework**: Vitest with React Testing Library
- **Config**: `vitest.config.ts`
- **Setup**: `test-setup.ts` (mocks for next-intl, next/navigation, etc.)
- **Tests**: Located alongside source files (`*.test.ts`, `*.test.tsx`)

### Environment Variables

Required:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Path Aliases

The project uses `@/*` alias mapping to the project root (configured in tsconfig.json).

## Database Schema

### Tables
- `cars` - Vehicle listings with multilingual descriptions
- `car_images` - Image URLs linked to cars
- `reviews` - Customer reviews with multilingual content
- `partners` - Partner logos and links
- `leads_inquiries` - Contact form submissions
- `settings` - Site configuration (JSON key-value)

### Storage Buckets
- `car-images` - Public bucket for vehicle photos

## Admin Access

1. Navigate to `/login`
2. Sign in with admin credentials (configured in Supabase Auth)
3. Access admin dashboard at `/admin`

Admin features:
- Cars management (CRUD, image upload)
- Leads inbox
- Reviews management
- Partners management
- Homepage settings
- Site settings
