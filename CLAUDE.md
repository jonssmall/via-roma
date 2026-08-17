# via-roma

Portfolio/demo website for **Via Roma**, a fictional semi-fancy traditional Italian
restaurant. Built to show prospective restaurant clients what a premium website for
their business could look like. Optimize every decision for "I'd want this for my
restaurant," not for showing off backend complexity.

This is a demo: no real restaurant, no real backend, no real payments. Everything
customer-facing must still *feel* completely real — no dead buttons, no placeholder
text, no visible demo/debug UI.

## Stack

Mirrors the [osprey-point](../osprey-point) project exactly:

| Layer | Choice |
| --- | --- |
| Site generator | Eleventy 3 |
| Asset pipeline / dev server | Vite via `@11ty/eleventy-plugin-vite` |
| Styling | Tailwind CSS 4 (CSS-first `@theme`, no `tailwind.config.js`) |
| Templating | Nunjucks layouts/partials + Markdown content |
| Language | TypeScript (config, global data, client scripts) |
| Client JS runtime | **None.** Vanilla TS modules only |

No frontend framework (React/Vue/Alpine/etc). Cart and reservation state are managed
with hand-written TS and `localStorage`, the same "progressive enhancement" philosophy
as Osprey Point's forms — just with more state to track. If a flow starts feeling like
it needs a reactive framework to stay maintainable, stop and raise it rather than
reaching for a dependency unilaterally.

When scaffolding, copy Osprey Point's config shape (`eleventy.config.ts`,
`addDataExtension("ts", …)` for global data, `--config=eleventy.config.ts` on every
npm script, root-absolute internal links) rather than reinventing it. See that
project's `CLAUDE.md`/`README.md` for the non-obvious gotchas (Vite 8's
`rolldownOptions`, `erasableSyntaxOnly`, etc.) — they apply here too.

No backend. Every "submission" (order, reservation, contact form) resolves entirely
client-side into a polished confirmation state.

## Brand direction

Semi-fancy, old-world Roman trattoria — warm and established, not trendy or corporate.
Think white tablecloths without excessive formality, candlelight, handmade pasta,
family-style hospitality.

**Avoid:** generic "Italian restaurant" clichés, red/white/green flag-color palettes,
cartoonish Italian imagery, rustic farmhouse aesthetics, minimalist luxury/startup
aesthetics, rounded-rectangle "everything is a card" SaaS design, excessive rounded
corners, animation for its own sake.

**Palette:** warm ivory/cream base, deep burgundy/wine, dark espresso brown, muted
olive green accents, brass/gold used sparingly.

**Type:** elegant serif for restaurant name, headings, section titles, and menu item
names; a highly readable sans-serif for nav, body copy, buttons, form labels. Never
sacrifice readability for elegance — check contrast.

**Design principles:** photography carries the personality; generous whitespace;
subtle decorative details (thin rules, small ornaments) instead of heavy chrome;
animation used sparingly and intentionally; usability over novelty.

## Non-obvious things

- **Headings never get a hardcoded color in `main.css`.** The base `h1,h2,h3,h4`
  rule only sets `font-display`/`font-semibold`, deliberately not a color —
  it used to also set `text-espresso-900`, which won every dark section
  because that rule targets the heading element directly, while a dark
  section's `text-cream-50` is set on the `<section>` and only reaches the
  heading via inheritance (which loses to any rule that sets the property
  directly, regardless of @layer order). That silently made every page's H1
  and two homepage/about H2s unreadable (near-black on near-black). Headings
  now inherit color from whatever section they're in; don't reintroduce a
  default color on the bare `h1`–`h4` selector.
- **The category sub-nav on `/menu/` and every "jump to section" scroll
  target derive their offset from real measurements, not hardcoded pixels.**
  `initStickyOffsets()` in `main.ts` measures the header's (and, on
  `/menu/`, the category sub-nav's) actual rendered height and writes it to
  `--header-height`/`--sticky-offset` on `:root`; `menu.njk`'s sub-nav uses
  `top-[var(--header-height)]` and each category section uses
  `scroll-mt-[var(--sticky-offset)]`. A hardcoded guess (what was there
  before) drifts out of sync with the header's real height — it's not fixed,
  it changes with viewport width and webfont swap — which both let the
  sub-nav stick partly behind the header and made category anchor-scrolls
  land short of their target. Don't hand-tune `top-[Npx]`/`scroll-mt-N`
  values here; fix the measurement in `initStickyOffsets()` instead if the
  offset is ever wrong.
- **GitHub Pages needs `PATH_PREFIX` handling in `eleventy.config.ts`,
  matching [osprey-point](../osprey-point).** This project's repo isn't named
  `<owner>.github.io`, so a Pages deploy serves it from
  `/<repo-name>/`, not `/`. Every template writes root-absolute paths
  (`href="/menu/"`), which 404 under a subpath unless rewritten at build
  time. `eleventy.config.ts` reads `PATH_PREFIX` from the environment, feeds
  it to Vite's `base` option (for `/assets/...` URLs) and to an
  `addTransform` that rewrites `href`/`src`/`action` in the rendered HTML
  (everything else). `.github/workflows/deploy.yml` sets
  `PATH_PREFIX: /${{ github.event.repository.name }}` before `npm run
  build`; local `npm run build`/`dev` leave it unset and serve from `/`.
  This was the actual cause of the "routes 404 on Pages" issue — the
  workflow was already setting the env var, but the config had no code that
  read it, so it silently did nothing.
- `src/.nojekyll` is passed through to `_site/.nojekyll`, but note it doesn't
  currently survive a build (Vite's `emptyOutDir: true` wipes it after
  Eleventy's passthrough copy runs, since nothing in the HTML references it
  for Vite to re-copy). This is a pre-existing gap in osprey-point's config
  too, not something specific to this project. It's harmless today because
  both repos deploy via `actions/upload-pages-artifact` +
  `actions/deploy-pages`, which never invokes Jekyll regardless of
  `.nojekyll` — it would only matter if either project switched to the
  legacy "deploy from a branch" Pages source.
- **One `<script type="module">` per page, no exceptions.** The Eleventy Vite
  plugin's HTML entry scanning does not reliably handle a second per-page
  `<script>` tag — adding one (e.g. for order-page-only JS) silently dropped
  `main.ts` from the production build of that page (site-wide mobile nav
  broke on `/order/`, no build error). Every page-specific behavior lives in
  its own module under `src/assets/ts/` but gets *imported and called* from
  `main.ts`, not linked with its own `<script>` tag — same "no-op if this
  page doesn't have the matching elements" pattern already used for the
  contact/reservation forms. See `main.ts`'s top-of-file comment.
- **Cart/order state lives in `localStorage` under `via-roma-order`**
  (`src/assets/ts/order.ts`), read entirely from `data-*` attributes on
  server-rendered menu markup — it does not import `menu.ts` itself. Menu
  items need a stable `slug` (see `_data/menu.ts`) since it's the cart line
  id.
- Tax is modeled at 9.25% (Knoxville/Knox County, TN's real combined rate) and
  delivery adds a flat $4.99 fee — both in `order.ts`'s `TAX_RATE`/
  `DELIVERY_FEE` constants, change them there if the numbers should differ.

## Fake data — use consistently, don't invent alternates

```
Via Roma
123 Via Roma
Knoxville, TN 37902
(865) 555-0147

Hours:
Mon–Thu   5:00 PM – 9:30 PM
Fri–Sat   5:00 PM – 10:30 PM
Sun       4:00 PM – 9:00 PM
```

Reservation time slots: 5:30, 6:00, 6:30, 7:00, 7:30, 8:00, 8:30 PM.

All content is fictional. Never imply Via Roma is a real, currently-operating
business. No real awards, no Michelin claims, no real chef names.

## Site structure

Routes: `/` `/menu` `/reservations` `/order` `/about` `/contact`

Nav order: Home, Menu, About, Reservations, Order Online, Contact.
Primary CTA everywhere: **Reserve a Table**. Secondary CTA: **Order Online**.

### Home
Hero (atmospheric photo + "Via Roma" / "Traditional Roman cooking, served with
warmth." + Reserve a Table / Explore the Menu) → short intro blurb with "Our Story"
CTA → 4–6 featured dishes (image, name, description — no price; prices are the
Menu page's job only) with "View Full Menu" → large reservation CTA band →
wine/dining program section → 3 believable (not gushing) quotes attributed to
fictional food critics and fictional local publications (not real outlets —
don't attribute a quote to an actual newspaper/magazine, and don't invent
awards or star ratings) → location/hours block with "Get Directions".

### Menu
Categories: Antipasti, Pasta, Secondi, Contorni, Dolci — realistic Italian dishes
(e.g. Cacio e Pepe, Carbonara, Bucatini all'Amatriciana, Saltimbocca alla Romana,
Branzino al Limone, Tiramisù). Each item: photo, name, description, price, dietary
indicators where relevant, hover/focus states, selectable for a detail view. Should
read as a real menu, not a database listing.

### Order (`/order`) — simulated, no real payments/integrations
1. Choose Pickup or Delivery
2. Browse categories → item detail/customization → add to cart
3. Cart: items, quantities, modifications, subtotal, tax, estimated total; edit
   quantities, remove items
4. Checkout: name, phone, email, pickup/delivery info; clearly-simulated payment step
   (no real card fields)
5. Confirmation: order number, name, estimated pickup/delivery time — should read like
   a real ordering system's confirmation screen

### Reservations — simulated, no real backend
Form: party size, date, time (from the slot list above), name, phone, email, optional
special requests → confirmation screen with the reservation details, an
add-to-calendar-style action (simulated), modify, and return home.

### About
Believable founding story built on family, tradition, handmade pasta, seasonal
ingredients, hospitality. No fabricated awards/press. Include a short "Our
Philosophy" section and interior/kitchen imagery.

### Contact
Address, phone, email, hours, contact form (with simulated success state — "Thank
you for contacting Via Roma. We'll get back to you shortly."), map treatment, parking
info, reservation CTA.

## Interactivity requirements

Every button does something real. Required: responsive mobile nav with active-page
indication (sticky where it helps); menu category filtering + item detail view; full
cart flow (add/remove/quantity); order-type selection; multi-step checkout with a real
confirmation; reservation form with date/guest/time selection; form validation with
visible error states and loading/success states on every form — nothing should submit
and silently do nothing.

Cart and reservation-in-progress state should survive a page reload (`localStorage`).

## Accessibility

Semantic HTML, correct heading hierarchy, labeled form controls, full keyboard
navigation, visible focus states (never removed — same rule as Osprey Point),
sufficient color contrast against the warm/dark palette, alt text on meaningful
images, real `<button>`/`<a>` elements (no div-buttons).

## Imagery

Cohesive, high-quality food/restaurant photography (pasta, wine, candlelit tables,
plated dishes, interiors). Avoid obviously-AI-looking food photos, stock-photo
cheesiness, and any imagery carrying a real restaurant's name/branding. If external
image URLs are used during development, keep them swappable (e.g. centralized in
front matter or a data file) rather than hardcoded inline everywhere.

## Definition of done

A visitor can: understand the restaurant from the homepage instantly; browse an
attractive menu; open an item's detail view; build and check out a simulated order;
make a simulated reservation and get a convincing confirmation; read the restaurant's
story; find location/hours/contact — all comfortably on a phone. No placeholder text,
broken links, dead buttons, empty sections, console errors, awkward mobile layouts, or
inconsistent spacing/typography anywhere.

If forced to cut scope, cut in this order (last item first): decorative/secondary
animation → about/contact polish → mobile refinement → online ordering → reservations
→ menu → homepage → overall visual design. Visual design and homepage are never
sacrificed for extra features.
