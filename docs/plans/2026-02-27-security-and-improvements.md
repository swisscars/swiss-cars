# SwissCars Security & Improvements Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix security vulnerabilities, critical bugs, i18n gaps, and performance issues found in the full codebase audit.

**Architecture:** Fixes are isolated — each task touches 1-3 files. No cross-task dependencies except where noted. Batched by severity so the most dangerous issues land first.

**Tech Stack:** Next.js 16 App Router, Supabase (SSR), next-intl, Zod, TypeScript, Vitest

---

## BATCH 1 — Critical Infrastructure & Security

### Task 1: Rename proxy.ts → middleware.ts

Next.js middleware **only** runs from a file named `middleware.ts` at the project root. The file is currently named `proxy.ts` so the entire middleware layer (i18n routing, admin auth redirect) is **not running in production**.

**Files:**
- Delete: `proxy.ts`
- Create: `middleware.ts`

**Step 1: Rename the file**

```bash
git mv proxy.ts middleware.ts
```

The file content is already correct (default export, proper `config` export). Only the filename needs to change.

**Step 2: Also rename the function for clarity (optional but conventional)**

Open `middleware.ts`, change line 8 from:
```ts
export default async function proxy(request: NextRequest) {
```
to:
```ts
export default async function middleware(request: NextRequest) {
```

**Step 3: Verify Next.js picks it up**

```bash
npm run dev
```

Visit `http://localhost:3000/ru` — it should serve the Russian locale (proves intl middleware runs). Visit `http://localhost:3000/admin` without being logged in — it should redirect to `/login` (proves auth middleware runs).

**Step 4: Commit**

```bash
git add middleware.ts proxy.ts
git commit -m "Fix: Rename proxy.ts to middleware.ts so Next.js loads the middleware"
```

---

### Task 2: Add auth guards to all mutation Server Actions

Server Actions are callable via HTTP POST to `/_next/action` by anyone, not just users who reached the admin UI. Every mutation action must verify the caller is authenticated before touching the database.

**Files to modify:**
- `lib/actions/cars.ts`
- `lib/actions/content.ts`
- `lib/actions/settings.ts`
- `lib/actions/translations.ts`
- `lib/actions/leads.ts` (admin-only mutations: `markLeadRead`, `markLeadImportant`, `deleteLead`, `markAllLeadsRead`)

**Auth helper pattern — add at the top of EACH mutation function:**

```ts
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Unauthorized');
```

**Step 1: Update `lib/actions/cars.ts`**

Add auth check to `saveCar` (after line 8) and `deleteCar` (after line 83):

`saveCar`:
```ts
export async function saveCar(carData: Car & { car_images?: { url: string, is_primary: boolean }[] }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // ... rest unchanged
```

`deleteCar`:
```ts
export async function deleteCar(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // ... rest unchanged
```

**Step 2: Update `lib/actions/content.ts`**

Add auth check to `saveReview`, `savePartner`, `deleteReview`, `deletePartner` (all 4 functions):

```ts
export async function saveReview(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // ... rest unchanged
```

Repeat the same pattern for the other 3 functions in the file.

**Step 3: Update `lib/actions/settings.ts`**

Add auth check to `saveSettings` only (`getSettings` is a read operation used publicly):

```ts
export async function saveSettings(key: string, value: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    // ... rest unchanged
```

**Step 4: Update `lib/actions/translations.ts`**

Add auth check to `updateI18nMessages` at the top.

**Step 5: Update `lib/actions/leads.ts`**

Add auth check to `markLeadRead`, `markLeadImportant`, `deleteLead`, `markAllLeadsRead`. Do NOT add to `submitLeadInquiry` — that is called by the public contact form.

**Step 6: Run tests**

```bash
npm test -- --run
```

Expected: 44 tests pass (no test covers auth, but we verify nothing else broke).

**Step 7: Commit**

```bash
git add lib/actions/cars.ts lib/actions/content.ts lib/actions/settings.ts lib/actions/translations.ts lib/actions/leads.ts
git commit -m "Security: Add auth guard to all mutation Server Actions"
```

---

### Task 3: Strict GTM ID validation

The GTM component checks `gtmId.startsWith('GTM-')` but a value like `GTM-X'); alert(1);//` passes that check and injects arbitrary JS into the script body. Replace the prefix check with a strict regex.

**File to modify:** `components/analytics/GTMScript.tsx`

**Step 1: Replace the validation check**

Change line 8 from:
```ts
if (!gtmId || !gtmId.startsWith('GTM-')) return null;
```
to:
```ts
if (!gtmId || !/^GTM-[A-Z0-9]+$/.test(gtmId)) return null;
```

Apply the same change to `GTMNoscript` (line 26):
```ts
if (!gtmId || !/^GTM-[A-Z0-9]+$/.test(gtmId)) return null;
```

**Step 2: Run tests**

```bash
npm test -- --run
```

Expected: 44 pass.

**Step 3: Commit**

```bash
git add components/analytics/GTMScript.tsx
git commit -m "Security: Strict regex validation for GTM ID to prevent script injection"
```

---

### Task 4: Validate Google Maps embed URL

The `google_maps_embed` setting value is used as an iframe `src` without any validation. An admin could point it at any URL.

**File to modify:** `components/contact/ContactPageClient.tsx`

**Step 1: Find the iframe block**

Search for `googleMapsEmbed` in the file. The iframe looks like:
```tsx
{googleMapsEmbed && (
    <iframe src={googleMapsEmbed} ... />
)}
```

**Step 2: Add URL validation**

Change to:
```tsx
{googleMapsEmbed && googleMapsEmbed.startsWith('https://www.google.com/maps/embed') && (
    <iframe src={googleMapsEmbed} ... />
)}
```

**Step 3: Run tests and commit**

```bash
npm test -- --run
git add components/contact/ContactPageClient.tsx
git commit -m "Security: Validate Google Maps embed URL before rendering iframe"
```

---

## BATCH 2 — Input Validation

### Task 5: Add Zod validation to submitLeadInquiry

The public `submitLeadInquiry` Server Action inserts data without runtime validation. A caller can pass arbitrary strings for `car_id`, `phone`, `name`, etc.

**File to modify:** `lib/actions/leads.ts`

**Step 1: Import Zod (already available — check `lib/types/index.ts` uses it)**

Add at the top of `lib/actions/leads.ts`:
```ts
import { z } from 'zod';
```

**Step 2: Add schema**

Before the `submitLeadInquiry` function, add:
```ts
const LeadInquirySchema = z.object({
    car_id: z.string().uuid(),
    car_name: z.string().min(1).max(200),
    name: z.string().min(1).max(100),
    phone: z.string().min(5).max(30),
    email: z.string().email().optional().or(z.literal('')),
    message: z.string().max(1000).optional(),
});
```

**Step 3: Add validation at the start of `submitLeadInquiry`**

After the rate limit check and before `createClient()`:
```ts
const parsed = LeadInquirySchema.safeParse(data);
if (!parsed.success) {
    return { success: false, error: 'Invalid form data' };
}
const validData = parsed.data;
```

Then replace all references to `data.car_id`, `data.name`, etc. with `validData.car_id`, `validData.name`, etc. in the insert call.

**Step 4: Run tests and commit**

```bash
npm test -- --run
git add lib/actions/leads.ts
git commit -m "Security: Add Zod validation to submitLeadInquiry Server Action"
```

---

### Task 6: Add types and validation to saveReview and savePartner

Both functions currently accept `any` with no validation.

**File to modify:** `lib/actions/content.ts`

**Step 1: Add Zod import**

```ts
import { z } from 'zod';
```

**Step 2: Add schemas**

```ts
const ReviewSchema = z.object({
    id: z.string().uuid().optional(),
    author_name: z.string().min(1).max(100),
    rating: z.number().int().min(1).max(5),
    text: z.object({
        ro: z.string().max(2000),
        ru: z.string().max(2000),
        en: z.string().max(2000),
    }),
    is_visible: z.boolean().default(true),
});

const PartnerSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(100),
    logo_url: z.string().url().optional().or(z.literal('')),
    website_url: z.string().url().optional().or(z.literal('')),
    is_visible: z.boolean().default(true),
});
```

**Step 3: Use schemas in the functions**

```ts
export async function saveReview(data: unknown) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const parsed = ReviewSchema.safeParse(data);
    if (!parsed.success) throw new Error('Invalid review data');

    const { id, ...reviewData } = parsed.data;
    // ... rest unchanged
```

Repeat for `savePartner`.

**Step 4: Run tests and commit**

```bash
npm test -- --run
git add lib/actions/content.ts
git commit -m "Security: Add Zod schemas and types to saveReview and savePartner"
```

---

### Task 7: Fix subscriber email validation

`subscribe()` uses `!email.includes('@')` which accepts `@` alone as valid.

**File to modify:** `lib/actions/subscribers.ts`

**Step 1: Add Zod import and replace validation**

Add:
```ts
import { z } from 'zod';
```

Change line 15-16 from:
```ts
if (!email || !email.includes('@')) {
    return { success: false, error: 'Invalid email address' };
}
```
to:
```ts
const emailParse = z.string().email().safeParse(email);
if (!emailParse.success) {
    return { success: false, error: 'Invalid email address' };
}
const safeEmail = emailParse.data;
```

Then use `safeEmail` in place of `email.toLowerCase()` in the rest of the function.

**Step 2: Run tests and commit**

```bash
npm test -- --run
git add lib/actions/subscribers.ts
git commit -m "Fix: Use Zod email validation in subscribe() action"
```

---

## BATCH 3 — Bug Fixes

### Task 8: Fix "View on site" link in admin inventory table

The Eye icon link in `CarsTable.tsx` hardcodes `/en/inventory/${car.slug}` but Romanian (the default locale) has no prefix — the correct URL is `/inventory/${car.slug}`.

**File to modify:** `app/admin/inventory/CarsTable.tsx`

**Step 1: Fix line 70**

Change:
```tsx
<Link href={`/en/inventory/${car.slug}`} target="_blank" className={styles.actionBtn}>
```
to:
```tsx
<Link href={`/inventory/${car.slug}`} target="_blank" className={styles.actionBtn}>
```

**Step 2: Commit**

```bash
git add app/admin/inventory/CarsTable.tsx
git commit -m "Fix: View on site link now uses default locale URL (no /en/ prefix)"
```

---

### Task 9: Revalidate homepage when a car is saved

When `is_featured` is toggled on a car, the homepage featured cars grid becomes stale because `saveCar` doesn't revalidate `/`.

**File to modify:** `lib/actions/cars.ts`

**Step 1: Add homepage revalidation**

In `saveCar`, add after line 75:
```ts
revalidatePath('/admin/inventory');
revalidatePath('/[locale]/inventory', 'page');
revalidatePath('/[locale]/inventory/[slug]', 'page');
revalidatePath('/', 'layout'); // <-- add this line
```

**Step 2: Run tests and commit**

```bash
npm test -- --run
git add lib/actions/cars.ts
git commit -m "Fix: Revalidate homepage cache when a car is saved or updated"
```

---

### Task 10: Add `is_available` filter to getCarBySlug

Sold cars are accessible by direct URL with no "sold" indicator, misleading buyers.

**File to modify:** `lib/supabase/queries.ts`

**Step 1: Add filter**

In `getCarBySlug` (line 129), add `.eq('is_available', true)`:

```ts
const { data, error } = await supabase
    .from('cars')
    .select('*, car_images(*)')
    .eq('slug', slug)
    .eq('is_available', true)   // <-- add this
    .single();
```

This makes sold cars return `null` → the page renders a 404 (`notFound()` is already called when `null` is returned).

**Step 2: Run tests and commit**

```bash
npm test -- --run
git add lib/supabase/queries.ts
git commit -m "Fix: getCarBySlug only returns available cars (sold cars show 404)"
```

---

### Task 11: Add `lpg` option to CarEditForm fuel type select

The Zod schema allows `lpg` as a valid `fuel_type` but the admin form has no option for it.

**File to modify:** `components/admin/CarEditForm.tsx`

**Step 1: Add the missing option**

In the fuel type `<select>` (around line 237-242), add:
```tsx
<option value="lpg">LPG</option>
```

after the `<option value="electric">Electric</option>` line.

**Step 2: Commit**

```bash
git add components/admin/CarEditForm.tsx
git commit -m "Fix: Add LPG fuel type option to admin CarEditForm"
```

---

## BATCH 4 — Performance

### Task 12: Optimize SimilarCars with a targeted DB query

`SimilarCars` currently calls `getCars()` which fetches the entire inventory, then filters in Node.js. This should be a targeted database query.

**Files to modify:**
- `lib/supabase/queries.ts` — add `getSimilarCars()`
- `components/cars/detail/SimilarCars.tsx` — use new query

**Step 1: Add `getSimilarCars` to `queries.ts`**

Add after `getCarBySlug`:

```ts
export async function getSimilarCars(
    brand: string,
    currentCarId: string,
    limit = 3
): Promise<Car[]> {
    if (!isSupabaseConfigured) return [];
    const supabase = await createClient();

    // Try same brand first
    const { data: sameBrand } = await supabase
        .from('cars')
        .select('*, car_images(*)')
        .eq('brand', brand)
        .neq('id', currentCarId)
        .eq('is_available', true)
        .limit(limit);

    if (sameBrand && sameBrand.length >= limit) {
        return sameBrand.slice(0, limit) as Car[];
    }

    // Fill remaining slots with other available cars
    const needed = limit - (sameBrand?.length ?? 0);
    const brandIds = (sameBrand ?? []).map((c) => c.id);

    const { data: others } = await supabase
        .from('cars')
        .select('*, car_images(*)')
        .neq('id', currentCarId)
        .not('id', 'in', `(${brandIds.join(',')})`)
        .eq('is_available', true)
        .limit(needed);

    return [...(sameBrand ?? []), ...(others ?? [])] as Car[];
}
```

**Step 2: Update `SimilarCars.tsx`**

Replace the entire file content:

```tsx
import { getSimilarCars } from '@/lib/supabase/queries';
import CarCard from '@/components/cars/CarCard';
import { getTranslations } from 'next-intl/server';

type Props = {
    currentCarId: string;
    brand: string;
};

export default async function SimilarCars({ currentCarId, brand }: Props) {
    const t = await getTranslations('common');
    const similar = await getSimilarCars(brand, currentCarId, 3);

    if (similar.length === 0) return null;

    return (
        <section style={{ padding: '60px 0', background: 'var(--color-gray)' }}>
            <div className="container">
                <div style={{ marginBottom: '40px' }}>
                    <p className="ui-subtitle">{t('similar_cars_subtitle')}</p>
                    <h2 className="ui-title">{t('similar_cars_title')}</h2>
                    <div className="ui-decor ui-decor--left" />
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px',
                }}>
                    {similar.map((car) => (
                        <CarCard key={car.id} car={car} />
                    ))}
                </div>
            </div>
        </section>
    );
}
```

**Note:** The `price` prop is no longer needed — remove it from the call site in `app/[locale]/inventory/[slug]/page.tsx`. Find the `<SimilarCars ... price={...} />` usage and remove the `price` prop.

**Step 3: Add translation keys**

In `messages/en.json`, `messages/ro.json`, `messages/ru.json` — add to the `"common"` namespace (or whichever namespace `t('common')` maps to):

en.json:
```json
"similar_cars_subtitle": "You might also like",
"similar_cars_title": "Similar Cars"
```

ro.json:
```json
"similar_cars_subtitle": "Poate te interesează",
"similar_cars_title": "Mașini Similare"
```

ru.json:
```json
"similar_cars_subtitle": "Вам может понравиться",
"similar_cars_title": "Похожие автомобили"
```

**Step 4: Run tests and commit**

```bash
npm test -- --run
git add lib/supabase/queries.ts components/cars/detail/SimilarCars.tsx messages/
git commit -m "Perf: Replace full inventory fetch in SimilarCars with targeted DB query"
```

---

### Task 13: Optimize getDashboardStats with server-side counting

`getDashboardStats` fetches all car and lead rows to count them in Node. Use Postgres-side counting instead.

**File to modify:** `lib/supabase/queries.ts`

**Step 1: Replace the cars and leads queries**

Find `getDashboardStats` (around line 254) and replace the `Promise.all` block:

```ts
const [
    availableCarsResult,
    soldCarsResult,
    unreadLeadsResult,
    totalLeadsResult,
    reviewsResult,
    partnersResult,
] = await Promise.all([
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_available', true),
    supabase.from('cars').select('*', { count: 'exact', head: true }).eq('is_available', false),
    supabase.from('leads_inquiries').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('leads_inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('partners').select('*', { count: 'exact', head: true }),
]);

const availableCars = availableCarsResult.count ?? 0;
const soldCars = soldCarsResult.count ?? 0;
return {
    totalCars: availableCars + soldCars,
    availableCars,
    soldCars,
    totalLeads: totalLeadsResult.count ?? 0,
    unreadLeads: unreadLeadsResult.count ?? 0,
    totalReviews: reviewsResult.count ?? 0,
    totalPartners: partnersResult.count ?? 0,
};
```

Remove the old `cars`, `leads`, `totalCars`, `availableCars`, `totalLeads`, `unreadLeads` variable declarations that are no longer needed.

**Step 2: Run tests and commit**

```bash
npm test -- --run
git add lib/supabase/queries.ts
git commit -m "Perf: getDashboardStats now uses server-side COUNT queries instead of in-memory filtering"
```

---

### Task 14: Optimize sitemap query

`sitemap.ts` calls `getCars()` which fetches full car data including all images. The sitemap only needs `slug` and `created_at`.

**File to modify:** `app/sitemap.ts`

**Step 1: Check current getCars call**

Open `app/sitemap.ts` and find the `getCars()` call (around line 25).

**Step 2: Replace with targeted query**

Add a direct Supabase query instead of using the `getCars()` helper. Add these imports at the top of `sitemap.ts`:

```ts
import { createClient } from '@/lib/supabase/server';
```

Replace the `getCars()` call with:
```ts
const supabase = await createClient();
const { data: cars } = await supabase
    .from('cars')
    .select('slug, updated_at')
    .eq('is_available', true)
    .order('updated_at', { ascending: false });
```

Then update the car URL mapping to use `car.updated_at` instead of whatever field it was using for `lastModified`.

**Step 3: Run tests and commit**

```bash
npm test -- --run
git add app/sitemap.ts
git commit -m "Perf: Sitemap only fetches slug and updated_at instead of full car data"
```

---

## BATCH 5 — i18n & SEO

### Task 15: Fix hardcoded strings in inventory page

**File to modify:** `app/[locale]/inventory/page.tsx`

**Step 1: Fix the car count text (line 40-42)**

The text `{totalCount} cars available` is in English only. Replace with a translation key. In the `InventoryPage` component, `t` is already available from `getTranslations('offers')`.

Add to `messages/en.json` (under `"offers"`):
```json
"cars_available": "{count} cars available"
```
Add to `messages/ro.json`:
```json
"cars_available": "{count} mașini disponibile"
```
Add to `messages/ru.json`:
```json
"cars_available": "{count} автомобилей в наличии"
```

Replace the hardcoded `<p>` with:
```tsx
<p style={{ color: 'var(--color-text-muted)', marginTop: '10px' }}>
    {t('cars_available', { count: totalCount })}
</p>
```

**Step 2: Run tests and commit**

```bash
npm test -- --run
git add app/[locale]/inventory/page.tsx messages/
git commit -m "i18n: Localize car count text on inventory page"
```

---

### Task 16: Fix hardcoded Romanian strings in car detail page and CarLeadForm

**Files to modify:**
- `app/[locale]/inventory/[slug]/page.tsx`
- `components/cars/detail/CarLeadForm.tsx`

**Step 1: Find the hardcoded strings in the detail page**

In `app/[locale]/inventory/[slug]/page.tsx`, find (around lines 204-205):
```tsx
<h3 className={styles.contactTitle}>Trimite o cerere</h3>
<p className={styles.contactSubtitle}>Te contactăm rapid cu detalii și disponibilitate.</p>
```

The `t` function from `next-intl` is already imported in this file. Add translation keys:

en.json (under `"car_detail"` namespace or the namespace used by this page):
```json
"contact_title": "Send an inquiry",
"contact_subtitle": "We'll get back to you quickly with details and availability."
```
ro.json:
```json
"contact_title": "Trimite o cerere",
"contact_subtitle": "Te contactăm rapid cu detalii și disponibilitate."
```
ru.json:
```json
"contact_title": "Отправить запрос",
"contact_subtitle": "Мы свяжемся с вами быстро с деталями и наличием."
```

Replace with:
```tsx
<h3 className={styles.contactTitle}>{t('contact_title')}</h3>
<p className={styles.contactSubtitle}>{t('contact_subtitle')}</p>
```

**Step 2: Fix CarLeadForm**

Open `components/cars/detail/CarLeadForm.tsx`. This is a Client Component so it uses `useTranslations`. Check which namespace it uses, then add the missing keys to the message files and replace each hardcoded Romanian string (placeholders, labels, button text, success/error messages) with translation keys.

**Step 3: Run tests and commit**

```bash
npm test -- --run
git add app/[locale]/inventory/[slug]/page.tsx components/cars/detail/CarLeadForm.tsx messages/
git commit -m "i18n: Replace hardcoded Romanian strings in car detail page and CarLeadForm"
```

---

### Task 17: Fix root layout lang attribute

The root layout sets `lang="ro"` for all locales. Screen readers and Google see all pages as Romanian regardless of the URL locale.

**Files to modify:**
- `app/layout.tsx`
- `app/[locale]/layout.tsx`

**Step 1: Check the locale layout**

Open `app/[locale]/layout.tsx`. It likely already receives `locale` as a param. The `<html>` tag should use `lang={locale}`.

If `app/[locale]/layout.tsx` renders its own `<html>` and `<body>` (common in App Router i18n setups), ensure it sets `lang={locale}`.

If the root layout (`app/layout.tsx`) sets `<html lang="ro">` and the locale layout does NOT have its own `<html>` tag, you need to move the `<html lang>` attribute to the locale layout.

**Step 2: Check `app/[locale]/layout.tsx`**

Open it and check if it has `<html lang={locale}>`. If yes, also remove/change `lang="ro"` in `app/layout.tsx` to `lang="ro"` → remove the `lang` attribute or set it to the actual locale.

The typical fix for App Router i18n is:
- `app/layout.tsx` — remove `lang` attribute or keep as fallback
- `app/[locale]/layout.tsx` — add `<html lang={locale}>` (requires the locale layout to render `html` and `body`)

**Step 3: Commit**

```bash
git add app/layout.tsx app/[locale]/layout.tsx
git commit -m "SEO: Set html lang attribute dynamically based on current locale"
```

---

## BATCH 6 — Inventory Filters Feature

### Task 18: Wire CarFilters to the inventory page backend

The `CarFilters` component exists and writes filter state to URL params (`brand`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `q`), but the inventory page ignores all params except `page`, and `getCarsPaginated` accepts no filter options.

**Files to modify:**
- `lib/supabase/queries.ts` — add filter params to `getCarsPaginated`
- `app/[locale]/inventory/page.tsx` — read filter params, pass to query, add `<CarFilters>`

**Step 1: Extend `getCarsPaginated` options**

In `lib/supabase/queries.ts`, find `getCarsPaginated`. The current options type likely only has `page` and `limit`. Extend it:

```ts
type CarFilters = {
    page?: number;
    limit?: number;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    q?: string;  // text search on brand + model
};

export async function getCarsPaginated(options?: CarFilters): Promise<PaginatedResult<Car>> {
    // ...
    let query = supabase
        .from('cars')
        .select('*, car_images(*)', { count: 'exact' })
        .eq('is_available', true);

    if (options?.brand) {
        query = query.ilike('brand', `%${options.brand}%`);
    }
    if (options?.minPrice) {
        query = query.gte('price', options.minPrice);
    }
    if (options?.maxPrice) {
        query = query.lte('price', options.maxPrice);
    }
    if (options?.minYear) {
        query = query.gte('year', options.minYear);
    }
    if (options?.maxYear) {
        query = query.lte('year', options.maxYear);
    }
    if (options?.q) {
        query = query.or(`brand.ilike.%${options.q}%,model.ilike.%${options.q}%`);
    }

    // Apply pagination after filters
    const countQuery = query;
    // ... (rest of count + data fetch)
```

**Important:** The current `getCarsPaginated` likely runs two separate queries (one for count, one for data). Both queries need the same filters applied. Structure carefully so the filter conditions are applied to both.

**Step 2: Update the inventory page to read all filter params**

In `app/[locale]/inventory/page.tsx`:

```ts
type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        page?: string;
        brand?: string;
        minPrice?: string;
        maxPrice?: string;
        minYear?: string;
        maxYear?: string;
        q?: string;
    }>;
};

export default async function InventoryPage({ params, searchParams }: Props) {
    const t = await getTranslations('offers');
    const resolved = await searchParams;
    const page = parseInt(resolved.page || '1', 10);

    const { data: cars, totalPages, totalCount } = await getCarsPaginated({
        page,
        limit: 12,
        brand: resolved.brand,
        minPrice: resolved.minPrice ? parseInt(resolved.minPrice) : undefined,
        maxPrice: resolved.maxPrice ? parseInt(resolved.maxPrice) : undefined,
        minYear: resolved.minYear ? parseInt(resolved.minYear) : undefined,
        maxYear: resolved.maxYear ? parseInt(resolved.maxYear) : undefined,
        q: resolved.q,
    });
    // ...
```

**Step 3: Add `<CarFilters>` to the inventory page layout**

Import and render `CarFilters` above `CarsGridPaginated`. The `CarFilters` component is already in `components/cars/list/CarFilters.tsx` and reads/writes URL params internally using `useSearchParams` + `router.push`.

```tsx
import CarFilters from '@/components/cars/list/CarFilters';
// ...
<CarFilters />
<CarsGridPaginated ... />
```

**Step 4: Run tests and commit**

```bash
npm test -- --run
git add lib/supabase/queries.ts app/[locale]/inventory/page.tsx
git commit -m "Feature: Wire inventory filters to backend — brand, price, year, text search"
```

---

## Summary

| Batch | Tasks | Issues Fixed |
|-------|-------|--------------|
| 1 — Critical Security | 1-4 | Middleware not running, unprotected Server Actions, GTM injection, iframe injection |
| 2 — Input Validation | 5-7 | Lead/review/partner validation, email validation |
| 3 — Bug Fixes | 8-11 | Wrong locale link, stale homepage cache, sold car pages, missing lpg |
| 4 — Performance | 12-14 | SimilarCars full-table scan, in-memory dashboard stats, sitemap over-fetch |
| 5 — i18n & SEO | 15-17 | Hardcoded Romanian strings, wrong lang attribute |
| 6 — Features | 18 | Inventory filters connected to backend |

**Total: 18 tasks, ~36 confirmed issues resolved**

Run after all tasks:
```bash
npm test -- --run
npm run build
```
Both must pass before marking complete.
