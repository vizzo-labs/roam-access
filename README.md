# Roam Access — landing page

Pre-launch landing page for **Roam Access**, a community-driven accessibility
discovery platform for people with disability (PWD) in Australia.

The page has three jobs: act as a credibility anchor for grant applications and
outreach, drive visitors to the user-research survey (primary CTA), and capture
email signups (secondary CTA).

## Stack

Plain static HTML — **no build step**. Tailwind is loaded via the Play CDN and
fonts (Inter + JetBrains Mono) from Google Fonts, so the site is just files you
can open or serve anywhere. This is what makes it trivially hostable on GitHub
Pages.

```
.
├── index.html          # landing page (self-contained: SEO meta, JSON-LD, a11y)
├── privacy.html        # Privacy Policy
├── accessibility.html  # Accessibility Statement
├── 404.html            # branded, noindex "page not found"
├── robots.txt          # allows all crawlers; points to the sitemap
├── sitemap.xml         # single-URL XML sitemap
├── CNAME               # custom domain for GitHub Pages (roamaccess.com.au)
├── assets/
│   ├── roam-appicon-teal.svg    # favicon (scalable, brand mark r/a on teal)
│   ├── roam-appicon-teal.png    # favicon / apple-touch-icon fallback
│   ├── roam-logo-primary.png    # logo (Organization.logo in JSON-LD)
│   └── roam-og.png              # 1200x630 social-share image (og:image)
├── .nojekyll           # tell GitHub Pages to serve files as-is (skip Jekyll)
└── README.md
```

## Run locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages**.
3. Under **Build and deployment**, set **Source: Deploy from a branch**, pick
   your branch (e.g. `main`) and folder **`/ (root)`**, then **Save**.
4. The site goes live at `https://<user>.github.io/<repo>/` within a minute or two.

No Actions workflow is needed — GitHub Pages serves the static files directly.

### Custom domain (`roamaccess.com.au`)

The `CNAME` file already points the Pages site at `roamaccess.com.au`. To finish:

1. In your DNS, add either an `ALIAS`/`ANAME` (or four `A` records to GitHub's
   IPs `185.199.108–111.153`) for the apex `roamaccess.com.au`, or a `CNAME`
   record for `www` → `<user>.github.io`.
2. In **Settings → Pages → Custom domain**, confirm `roamaccess.com.au` and tick
   **Enforce HTTPS**.

All SEO URLs (canonical, `og:url`, sitemap, robots, JSON-LD) are already absolute
on `https://roamaccess.com.au/`. **If the domain ever changes, find-and-replace
`roamaccess.com.au` across `index.html`, `404.html`, `sitemap.xml`, `robots.txt`
and `CNAME`.**

## Before launch — things to wire up

These are intentional placeholders in `index.html`:

- **Survey link** — every "Take the survey" CTA points to `#survey-coming-soon`.
  Replace with the real survey URL.
- **Email form** — currently shows an in-component success state only and does
  not POST anywhere. Search for the `TODO` comment in the `<script>` to wire it
  to Mailchimp / ConvertKit / etc.
- **LinkedIn / Privacy Policy / Accessibility Statement** links point to `#`.
  When LinkedIn exists, also add its URL to `Organization.sameAs` in the JSON-LD
  (there's a `TODO` next to it).
- **ABN** placeholder in the footer.

## SEO

On-page SEO is built in and absolute to `https://roamaccess.com.au/`:

- **Title & meta description** tuned for the primary query ("accessible venues
  in Australia") while keeping the brand first.
- **Canonical** + `hreflang` (`en-au` / `x-default`) + `robots`
  (`index, follow, max-image-preview:large`).
- **Open Graph + Twitter** tags with a purpose-built **1200×630** share image
  (`assets/roam-og.png`), including `og:image:alt`, dimensions and `og:locale`.
- **Schema.org JSON-LD** (`@graph`: `Organization` + `WebSite` + `WebPage`) so
  search engines understand the entity, its area served (Australia) and logo.
- **`robots.txt`** (allows all, references the sitemap) and **`sitemap.xml`**.
- **`404.html`** is `noindex` so error pages never get indexed.
- Semantic HTML, one `<h1>`, logical headings and descriptive link text already
  carry strong on-page signals.

**After go-live:** verify the domain in Google Search Console + Bing Webmaster,
submit `https://roamaccess.com.au/sitemap.xml`, and check the card with the
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

**Biggest remaining win (performance/Core Web Vitals):** the page uses the
Tailwind Play CDN, which ships a large runtime and compiles in the browser
(slower LCP, possible layout shift). Pre-compiling Tailwind to a static CSS file
would meaningfully help ranking — it keeps the site equally GitHub-Pages-hostable
but adds a build step. Happy to do this on request.

## Accessibility (the whole point)

This is an accessibility brand, so the page itself is built to be exemplary —
WCAG 2.2 AA as the floor, AAA where it's reachable. The palette was reworked to
a WCAG-validated brand v2 (teal `#0A4F4F` 8.89:1 AAA, rust `#9C2D0E` 7.14:1 AA,
slate `#5A5651` 6.91:1 AAA on paper), verified to stay distinguishable under
deuteranopia / protanopia / tritanopia / achromatopsia.

The headline feature is a **built-in Accessibility settings panel** (floating
button, bottom-right): text size (100/112/125/150%), higher-contrast mode, and a
reduce-motion override — all persisted per device in `localStorage`. The page
dogfoods what the product stands for.

See the **"What was implemented for accessibility"** notes in the handoff for
the full list (skip links, focus management, `aria-current`, semantic landmarks,
form validation with plain-English errors, "Need this in another format?" offer,
etc.).
