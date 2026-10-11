# Homemadefood-Ayudhas-Frontend

Mobile-first catalogue website for a village home-made sweets & pickles maker, published as a
static Next.js export on **GitHub Pages**. All live data comes from the
[Homemadefood-Ayudhas-Backend](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend) API
(FastAPI + Django ORM on PythonAnywhere).

Visitors browse products with product-only prices, build an order list and send an **order
request**: their WhatsApp number, PIN code and how they'd like to receive it (Delhivery, pickup
or a friend's handover). The owner confirms availability, delivery charges and payment on
WhatsApp. **No payments, no order confirmation, no shipment booking happen on the site.**

Live address (once deployed): https://gunwatts.github.io/Homemadefood-Ayudhas-Frontend/

| Task | Command |
|---|---|
| Develop | `cp .env.example .env.local`, then `npm install`, `npm run dev` (http://localhost:3000; API on :8000) |
| Type-check, lint, unit tests | `npm run typecheck`, `npm run lint`, `npm test` |
| Production build | `npm run build` (fetches the catalogue snapshot, then writes `out/`) |
| Build without the API | `npm run build:offline` (uses the committed snapshot) |
| Serve `out/` locally | `npm run serve` |
| End-to-end test | `npm run test:e2e`; see below |

## Structure

- `src/app/`: the routes.
  - Public pages: home, `products/`, `products/[slug]/` (pre-rendered), `product/?slug=` (for products added after the last build), `order/`, `story/`, `videos/`, `gallery/`, `contact/`, `privacy/`, `terms/`, sitemap and robots.
  - `admin/`: the owner admin, rendered client-side and not indexed.
- `src/components/`: page views, the order list and Place Order form, the callback form, the lightweight YouTube embed, and `admin/` (inboxes, product and content editors, account settings).
- `src/lib/`:
  - `api.ts`: fetch client with typed errors
  - `catalogue.tsx`: build snapshot plus live refresh
  - `cart.tsx`: order list kept in the visitor's browser
  - `format.ts`: integer-paise money and client-side phone/PIN checks; the server stays authoritative
  - `whatsapp.ts`: click-to-chat links (the visitor presses Send)
- `src/data/catalogue.json`: the catalogue snapshot used for pre-rendering, refreshed on every build.
- `scripts/fetch-catalogue.mjs`: writes that snapshot.
- `e2e/smoke.mjs`: a browser test of the full visitor and owner journey.
- `docs/`:
  - [DEPLOYMENT.md](docs/DEPLOYMENT.md): GitHub Pages setup
  - [ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md): for the owner
  - [GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md): content approval, compliance reminders, handover
  - [content-template.csv](docs/content-template.csv): product content template

## Configuration (build-time, public)

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend URL, e.g. `https://<user>.pythonanywhere.com` |
| `NEXT_PUBLIC_SITE_URL` | Site origin without a path, e.g. `https://gunwatts.github.io` |
| `NEXT_PUBLIC_BASE_PATH` | `/Homemadefood-Ayudhas-Frontend` for the project site; empty for a custom domain |

The deploy workflow sets all three from the `API_BASE_URL` and optional `PAGES_CNAME`
repository variables.

## End-to-end test

The test drives the installed Microsoft Edge (or Chrome, with `E2E_BROWSER_CHANNEL=chrome`)
through `playwright-core`, so no browser download is needed.

```bash
# backend (other repo): throwaway database with sample data and a local admin
uv run python manage.py migrate && uv run python manage.py createcachetable
uv run python manage.py seed_sample
ADMIN_PASSWORD='Local-Dev-Pass-2026' uv run python manage.py create_admin admin@localhost.test
uv run uvicorn app.main:app --port 8000

# this repo
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run build && npm run serve
npm run test:e2e          # screenshots in e2e/shots/
```
The order form allows 5 requests per IP every 10 minutes, so reset the backend database
between repeated runs.
