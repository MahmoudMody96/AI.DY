# AI.DY — خارطة الطريق التنفيذية (Phases 0.6 → 0.8)

> **آخر تحديث:** 2026-06-02
> **المشروع:** `D:\MAHMOUD\projects\AI.DY`
> **Live:** https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app
> **Stack:** Next.js 16 + Tailwind 4 + Supabase (Postgres + Auth + RLS) + TypeScript
> **Branch:** `main` (auto-deploy على Vercel)

---

## الحالة الحالية (آخر commit: `7a3cbba`)

| Component | Status |
|---|---|
| Next.js 16.2.6 + Turbopack | ✅ شغال |
| Tailwind 4 + CSS theme tokens | ✅ شغال |
| Supabase schema (19 tables) + RLS (46 policies) | ✅ migrated |
| Seed data (8 categories + 28 tools) | ✅ live |
| API routes: `/api/tools`, `/api/categories` | ✅ 200 OK |
| Homepage `/` (RTL, hero, categories, featured tools) | ✅ deployed |
| Console 404s على prefetch لـ `/tools`, `/categories/[slug]`, `/tools/[slug]` | ⚠️ 10 errors |
| Dynamic pages (listings/details) | ❌ مش موجودة |
| Component library | ❌ inline JSX في كل صفحة |
| Auth flow | ❌ مفيش users بعد |

**المشكلة الوحيدة اللي ظاهرة للـ user:** الـ 404s. حلها = Phase 0.6.

---

## Phase 0.6 — Dynamic Pages (الـ 404s + قيمة حقيقية)

**الهدف:** تحويل الـ links في الـ homepage لصفحات حقيقية بدل 404.

**الـ Outcome:** `/tools`, `/categories/[slug]`, `/tools/[slug]` كلهم شغالين. الـ console errors تختفي. الـ SEO والـ shareability يتحسّنوا.

**الـ Effort:** ~3-4 ساعات شغل. 3 commits (واحد لكل صفحة) عشان يبقى سهل نلاقي أي regression.

**Dependencies:** لا شيء — كل المطلوب موجود (Supabase schema, server client, API patterns).

---

### 0.6.1 — `/tools` (الـ Listing page)

**File:** `src/app/tools/page.tsx`

**Features:**
- عرض كل الـ 28 أداة في grid
- **Filter sidebar (sticky على desktop):**
  - Category (8 checkboxes)
  - Pricing type (free, freemium, paid)
  - Min rating (slider 0-5)
- **Sort dropdown:**
  - الأعلى تقييماً (default)
  - الأحدث
  - الأكثر شعبية (views)
  - أبجدياً (عربي)
- **Search bar:** بـ `q` query param، بتبحث في `name`, `name_en`, `tagline`, `description`
- **Pagination:** 12/24/48 items per page
- **URL state:** كل الفلters في الـ URL (`?category=ai-assistants&sort=newest&page=2`) عشان الـ shareable
- **Empty state:** لما الـ filter يرجع 0 results
- **Loading state:** Next.js `loading.tsx` بـ skeleton

**Data flow:**
```
searchParams → page component → Supabase query → render
                 ↓
              metadata (generateMetadata للـ SEO)
```

**Server component:** يجيب البيانات من Supabase مباشرة (مش من الـ API route، أسرع).

**Test:**
- `curl /tools` → 200 + 28 tool cards
- `curl /tools?category=image-generation` → 3 tools (Midjourney, DALL-E, Leonardo, Ideogram)
- `curl /tools?sort=newest&page=2` → باقي الـ tools

**Deliverable:** Commit `feat(tools): listing page with filters, sort, search, pagination`

---

### 0.6.2 — `/categories/[slug]` (Category detail)

**File:** `src/app/categories/[slug]/page.tsx`

**Features:**
- Hero section بـ category name + description + icon + عدد الأدوات
- Breadcrumb: الرئيسية > الفئات > [Category name]
- Grid أدوات الفئة
- لو الفئة فاضية → empty state
- Sub-categories لو `parent_id` مش null (future-proofing)

**Data flow:**
```
[slug] param → fetch category → fetch category tools → render
                       ↓
                  notFound() لو مش موجود
                       ↓
                generateMetadata للـ SEO
```

**Special case:** لو slug مش موجود → `notFound()` → 404 page (ده مهم للـ SEO).

**Test:**
- `curl /categories/ai-assistants` → 200 + 5 tools (ChatGPT, Claude, Gemini, Copilot, DeepSeek)
- `curl /categories/nonexistent` → 404

**Deliverable:** Commit `feat(categories): detail page with breadcrumb and tool grid`

---

### 0.6.3 — `/tools/[slug]` (Tool detail)

**File:** `src/app/tools/[slug]/page.tsx`

**Features:**
- **Hero:**
  - Logo (أول حاجة)
  - Name + tagline
  - Category badge
  - Rating (stars + count)
  - "زيارة الموقع" CTA → external link
- **Content sections:**
  - الوصف (description) — rich text
  - المميزات الرئيسية (من `features` column لو موجودة) — أو نضيفها في Phase تاني
  - التسعير (pricing_type + monthly_price + starting_price)
  - Tags
  - تاريخ آخر تحديث (`updated_at`)
- **Sidebar (sticky):**
  - Quick info card
  - Category link
  - Share buttons (Twitter, LinkedIn, copy link)
  - "ابعت ملاحظات" (يستخدم feedback table بعدين)
- **Related tools:** 4 tools من نفس الفئة (excluding current)
- **Structured data:** JSON-LD `SoftwareApplication` schema (مهم لـ Google rich results)

**Data flow:**
```
[slug] param → fetch tool with category → fetch related tools → render
                       ↓
                notFound() لو مش موجود أو مش published
                       ↓
                increment views_count (Server Action)
                       ↓
                generateMetadata + JSON-LD
```

**Test:**
- `curl /tools/chatgpt` → 200 + ChatGPT data + 4 related (Claude, Gemini, Copilot, DeepSeek)
- `curl /tools/nonexistent` → 404
- View source → فيه JSON-LD structured data

**Deliverable:** Commit `feat(tools): detail page with sidebar, related tools, and JSON-LD`

---

### 0.6.4 — Verification

1. `pnpm build` → لازم ينجح بدون errors
2. `pnpm dev` → test كل الـ routes محلي
3. Screenshots للـ 3 pages بـ Playwright
4. `git push` → Vercel auto-deploy
5. افتح `https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app/tools/chatgpt` → لازم يبقى 200
6. افتح Console → الـ 10 404s المفروض تختفي (الـ prefetches كلها هتنجح دلوقتي)

---

## Phase 0.7 — shadcn/ui + Reusable Components

**الهدف:** وقف كتابة JSX مكرر. نقل الـ homepage components لمكتبة مشتركة. تحسين الـ UX consistency.

**الـ Outcome:** كل صفحة تستخدم `<ToolCard>`, `<CategoryCard>`, `<RatingStars>` إلخ. الـ styling متناسق. Dark mode شغال.

**الـ Effort:** ~2-3 ساعات. Components كتير بس معظمها copy-paste من shadcn.

**Dependencies:** Phase 0.6 (عشان نـ refactor الـ homepage + الـ new pages كلها مرة واحدة).

---

### 0.7.1 — Setup shadcn/ui

**Steps:**
1. `pnpm dlx shadcn@latest init` (مش `npx` عشان pnpm)
2. اختر:
   - Style: **New York** (أحدث, أنضف)
   - Base color: **Slate** (محايد، يناسب الـ brand violet)
   - CSS variables: **Yes**
3. عدّل `components.json` لو محتاج (icon library: lucide — already in deps)
4. `tsconfig.json` paths alias `@/*` already configured ✅

**Verify:** `pnpm dlx shadcn@latest add button` ينجح.

---

### 0.7.2 — Install base components

```
pnpm dlx shadcn@latest add \
  button card input select \
  dialog tabs toast skeleton \
  badge avatar dropdown-menu \
  separator sheet tooltip
```

~14 components. كلها من shadcn registry.

**ملحوظة:** Tailwind 4 عنده quirks مع shadcn — لو في conflict، نشوف `references/shadcn-tailwind4` في docs.

---

### 0.7.3 — Domain components (نكتبها إحنا)

في `src/components/`:

```
src/components/
├── layout/
│   ├── site-header.tsx       # nav + logo + user menu (Phase 0.8)
│   ├── site-footer.tsx
│   └── container.tsx         # max-w-6xl wrapper
├── tools/
│   ├── tool-card.tsx         # extracted from homepage
│   ├── tool-grid.tsx
│   ├── tool-detail.tsx       # للـ /tools/[slug]
│   └── related-tools.tsx
├── categories/
│   ├── category-card.tsx
│   ├── category-grid.tsx
│   └── category-hero.tsx
├── ui/
│   ├── rating-stars.tsx
│   ├── pricing-badge.tsx
│   ├── pricing-label.tsx
│   ├── empty-state.tsx
│   ├── loading-skeleton.tsx
│   ├── error-state.tsx
│   └── search-bar.tsx
└── theme/
    └── theme-toggle.tsx      # dark/light
```

**Refactor homepage:** استبدل الـ inline JSX بـ:
```tsx
import { ToolCard } from "@/components/tools/tool-card";
import { CategoryGrid } from "@/components/categories/category-grid";
import { SiteHeader } from "@/components/layout/site-header";
```

**Deliverable:** Commit `refactor(ui): extract shadcn components and domain library`

---

### 0.7.4 — Dark mode

1. `next-themes` package install
2. `<ThemeProvider>` في `layout.tsx`
3. `ThemeToggle` component (sun/moon icons)
4. Add to `<SiteHeader>`

**Default:** light mode (RTL markets يفضلوا light)
**Persistence:** localStorage
**No flash:** `next-themes` بيدير الـ class على `<html>` قبل الـ paint.

**Test:** Toggle → كل الـ components تتغير، الـ gradient text، الـ shadows.

---

## Phase 0.8 — Auth Flow

**الهدف:** يقدر الـ user يعمل account. نبني الأساس اللي هيخلي "Save tool" و "Submit review" و "Follow category" ممكنين.

**الـ Outcome:** `/login`, `/signup`, `/forgot-password` شغالين بـ email + Google OAuth. Middleware يحمي routes معينة. User menu في الـ header.

**الـ Effort:** ~3-4 ساعات (أكبر phase لأن Auth فيه security considerations).

**Dependencies:** Phase 0.7 (عشان `dropdown-menu` للـ user menu).

---

### 0.8.1 — Supabase Auth setup

**في Supabase Dashboard:**
1. **Authentication → Providers:**
   - ✅ Email (default enabled)
   - ✅ Google OAuth:
     - Create OAuth app في Google Cloud Console
     - Authorized redirect URI: `https://qchnindfczaulufazivy.supabase.co/auth/v1/callback`
     - Copy Client ID + Secret → Supabase
2. **Authentication → URL Configuration:**
   - Site URL: `https://ai-dy-git-main-mahmouds-projects-97f3fe54.vercel.app`
   - Redirect URLs: أضف `http://localhost:3000/**` للـ dev
3. **Email templates:** (optional) عدّل الـ confirm email + reset password templates باسم "AI.DY"

**Migration جديد:** `100_auth_triggers.sql` — عند signup، أنشئ row في `public.profiles` تلقائيًا:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Vercel env vars:** (الـ anon + service role لازم يكونوا موجودين — تأكد من `.env.local` موجود في Vercel Dashboard)

---

### 0.8.2 — Auth pages

```
src/app/(auth)/
├── layout.tsx                # minimal layout, centered
├── login/
│   └── page.tsx              # email + password + Google button
├── signup/
│   └── page.tsx              # email + password + full name + Google
├── forgot-password/
│   └── page.tsx              # email only
└── auth/
    └── callback/
        └── route.ts          # OAuth callback handler
```

**`/login` components:**
- Email input (shadcn `<Input>`)
- Password input (with show/hide toggle)
- "Forgot password?" link
- "Login" button (shadcn `<Button>`)
- Divider
- "Continue with Google" button (Google logo SVG)
- Link to `/signup`

**Form validation:** Zod schemas
```ts
const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
});
```

**Server Actions:** في `src/app/(auth)/actions.ts`:
- `signInWithPassword(formData)`
- `signInWithGoogle()`
- `signUp(formData)`
- `resetPassword(email)`

---

### 0.8.3 — Auth middleware

**File:** `src/middleware.ts`

```ts
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // يطبق على كل routes ماعدا: api, _next/static, _next/image, favicon
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**`src/lib/supabase/middleware.ts`:**
- يجدد الـ session cookie (Supabase tokens بينتهوا)
- يحمي routes معينة بـ redirect to `/login`:
  - `/account/**` (future)
  - `/admin/**` (future)
  - `/submit/**` (future)

**للآن:** الـ middleware بس يجدد session. Protected routes نضيفها في Phase 0.9+.

---

### 0.8.4 — User menu in header

في `src/components/layout/site-header.tsx`:

```tsx
// Server component
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? {};
  
  return (
    <header>
      <Logo />
      <Nav />
      {user ? <UserMenu user={user} /> : <LoginButton />}
    </header>
  );
}
```

**`<UserMenu>`** (client component):
- shadcn `<DropdownMenu>`
- Avatar (من `user.user_metadata.avatar_url` أو initials)
- Items: Profile, Saved tools (future), Settings, Sign out
- "Sign out" → Server Action `signOut()` → redirect to `/`

---

### 0.8.5 — Testing

1. **Email flow:**
   - Sign up → check email → click confirmation link → redirect to `/`
   - Login → بيشتغل
   - Forgot password → email → reset link → new password
2. **Google flow:**
   - Click "Continue with Google" → Google consent → redirect back logged in
   - Profile auto-created via trigger
3. **Session:**
   - Close browser → reopen → لسه logged in
   - Sign out → cookies cleared → protected routes redirect
4. **Edge cases:**
   - Wrong password → error message
   - Existing email → error message
   - OAuth user بدون email_verified → handle gracefully

---

## الجدول الزمني المقترح

| Phase | Effort | Depends on | Risk |
|---|---|---|---|
| 0.6.1 `/tools` | 1.5h | — | Low |
| 0.6.2 `/categories/[slug]` | 30min | — | Low |
| 0.6.3 `/tools/[slug]` | 1.5h | — | Low (views_count increment) |
| 0.6.4 verify | 30min | 0.6.1-0.6.3 | — |
| **Phase 0.6 total** | **~4h** | — | |
| 0.7.1 shadcn init | 30min | 0.6 done | Medium (Tailwind 4 quirks) |
| 0.7.2 install components | 30min | 0.7.1 | Low |
| 0.7.3 domain components | 1.5h | 0.7.2 | Low |
| 0.7.4 dark mode | 30min | 0.7.3 | Low |
| **Phase 0.7 total** | **~3h** | 0.6 | |
| 0.8.1 Supabase setup | 1h | 0.7 | Medium (Google OAuth) |
| 0.8.2 auth pages | 1.5h | 0.8.1 | Low |
| 0.8.3 middleware | 30min | 0.8.2 | Low |
| 0.8.4 user menu | 30min | 0.8.2 + 0.7 | Low |
| 0.8.5 testing | 1h | 0.8.1-0.8.4 | Medium (email deliverability) |
| **Phase 0.8 total** | **~4.5h** | 0.7 | |

**Total effort:** ~11.5 ساعة شغل فعلي (3 phases).

---

## Open Questions

1. **Tool detail page — `views_count` increment:** نعمله في Server Action (كل page load) ولا بـ trigger DB على الـ SELECT؟ الـ trigger أنضف بس أعقد.
2. **Phase 0.7 — shadcn style:** New York (أنضف) vs Default (أسهل). افتراضياً: **New York**.
3. **Phase 0.8 — Google OAuth:** هل عندك Google Cloud Console access؟ لو لأ، نعمل Email-only للبداية ونضيف Google بعدين.
4. **DB password leaked:** الـ `Kemo_prompt@2026` لسه في git history. Supabase Dashboard → Settings → Database → Reset password. (اللي بيتطلب منك، مش أنا.)

---

## بعد الـ 3 phases (Phase 0.9+)

دي الـ roadmap لما الـ 3 phases دي تخلص:

- **Phase 0.9:** CI/CD (GitHub Actions: typecheck + lint + test + build)
- **Phase 1.0:** User features (Save tool, Submit review, Follow category)
- **Phase 1.1:** Blog (MDX) — `/blog`, `/blog/[slug]`
- **Phase 1.2:** Admin panel (`/admin`) — CRUD على tools و categories
- **Phase 1.3:** Search (Postgres full-text → أو Algolia/Meilisearch لو كبر)
- **Phase 1.4:** Analytics (Plausible أو Umami — بدون cookies)
- **Phase 2.0:** Public API (rate-limited, API keys)
- **Phase 2.1:** Mobile app (React Native + same Supabase backend)

---

## Acceptance Criteria per Phase

| Phase | Definition of Done |
|---|---|
| 0.6 | All 3 pages return 200, all 10 console 404s gone, build passes |
| 0.7 | shadcn installed, no inline JSX duplicates, dark mode toggle works |
| 0.8 | Email + Google signup works, session persists, user menu shows avatar, sign out works |

**كل phase ينتهي بـ:** Vercel deployment ناجح + screenshot للـ new feature + todo list updated.
