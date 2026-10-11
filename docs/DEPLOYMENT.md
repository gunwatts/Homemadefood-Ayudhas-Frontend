# Deploying the website on GitHub Pages

The site is a static export: GitHub Pages serves plain HTML/JS, and the browser calls the API
on PythonAnywhere ([backend deployment](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/DEPLOYMENT.md)).
Deploy the backend first so you have its URL.

Default address: **https://gunwatts.github.io/Homemadefood-Ayudhas-Frontend/**
(admin: `…/Homemadefood-Ayudhas-Frontend/admin/`).

## 1. One-time repository settings

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → Variables → New repository variable**
   (these values are public; never put secrets here):
   - `API_BASE_URL` = `https://<user>.pythonanywhere.com` (required)
   - `PAGES_CNAME` = a custom domain such as `food.ayudhas.com` (optional; leave unset to use
     the github.io address)
3. **Actions → Deploy to GitHub Pages → Run workflow.**

The workflow runs typecheck, lint and unit tests, downloads the live catalogue for
pre-rendering, builds, refuses to publish a bundle that still points at `localhost:8000`, and
deploys. It runs on every push to `main`, on demand, and once a day so that products added in
the admin get their own search-friendly page. Without a custom domain it builds with the base
path `/<repository-name>`; with `PAGES_CNAME` it builds for the domain root and writes the
`CNAME` file.

## 2. Allow the site to call the API

On PythonAnywhere set `CORS_ALLOWED_ORIGINS=https://gunwatts.github.io` (origin only, no path)
and reload the web app. With a custom domain, add `https://food.ayudhas.com` as well.

## 3. Custom domain (optional)

`ayudhas.com` is already used by the brand website, so use a sub-domain. At the DNS provider add
a `CNAME` record `food` → `gunwatts.github.io`. Set the `PAGES_CNAME` variable, run the
workflow, then in **Settings → Pages** confirm the domain and tick **Enforce HTTPS**. Add the new
origin to the backend's `CORS_ALLOWED_ORIGINS`, and update `ADMIN_URL` in the backend `.env`.

## Building locally instead

```bash
NEXT_PUBLIC_API_BASE_URL=https://<user>.pythonanywhere.com \
NEXT_PUBLIC_SITE_URL=https://gunwatts.github.io \
NEXT_PUBLIC_BASE_PATH=/Homemadefood-Ayudhas-Frontend \
npm run build          # writes out/ (contains .nojekyll)
```
On Windows Git Bash, prefix the command with `MSYS2_ENV_CONV_EXCL=NEXT_PUBLIC_BASE_PATH` so the
base path isn't rewritten into a Windows path.

## How content updates reach visitors

Pages are pre-rendered from `src/data/catalogue.json`, a snapshot of `/api/catalogue` taken at
build time (the committed copy is used if the API can't be reached). In the browser, every page
refreshes from the live API, so price, visibility and text changes made in the admin appear
immediately. Products added after the last build open through `/product/?slug=…` until the
next (daily) build.
