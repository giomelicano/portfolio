# Portfolio — Jose Gio L. Melicano

Personal portfolio site. Plain HTML, CSS and JavaScript — no framework, no build step,
no dependencies. Open `index.html` and it runs.

---

## ⚠️ Fill these in before sending the link to anyone

The site is complete and working, but these placeholders are still in it. Search the
project for `YOUR-` and `TODO` to find them all.

| # | What | Where |
|---|------|-------|
| 1 | **Name the Netlify site `giomelicano-portfolio`** when you deploy — see below | Netlify dashboard |
| 2 | **DNNHS live site + repo URLs** | `index.html`, in the `case__links` block |
| 3 | **Verify the "What was hard" paragraph is actually true** | `index.html` — see below |
| 4 | **Confirm the coursework list is really yours** | `resume.html` — see below |
| 5 | **Check the case-study claims are accurate** | `index.html`, "What I built" |

✅ Profile photo · six DNNHS screenshots · GitHub and LinkedIn links · GWA calculator ·
project dates · freeCodeCamp certifications · languages · site URL.

**`resume.html` has no placeholders left at all** — it's ready to print the moment the site
name matches.

### 1 — the site name has to match

Your Netlify account and `giomelicano` team are connected, but no site is deployed yet. The
URL `https://giomelicano-portfolio.netlify.app` is already written into `resume.html`,
`robots.txt`, `sitemap.xml` and the `og:` link-preview tags in `index.html`.

**That URL only works if you name the site exactly `giomelicano-portfolio`.** Netlify assigns
a random name like `fluffy-panda-4f2a1b` by default, so after the first deploy go to
Site configuration → Change site name and set it. If you'd rather use a different name,
search the project for `giomelicano-portfolio` and replace it in all four files.

### 3 — the "What was hard" paragraph

This is now filled in with a **draft**, not a fact. It describes a teacher being able to edit
an already-published grade and bypass the approval step — which is a real, common failure in
an approval workflow, and consistent with the four states your admin panel tracks. But it was
written from your screenshots, not from your code or your memory.

**Only keep it if it actually happened.** This is the paragraph interviewers reach for, and
they follow up: *how did you find it? what did you try first? how did you test the fix?*
Those answers have to be yours.

Two alternates are sitting in an HTML comment directly above the paragraph in `index.html` —
one about broken access control (role checks in the layout instead of on each page), one
about general averages counting unreleased subjects as zero. Swap whichever is closest to the
truth, or write your own.

To find the real one: skim your commit messages for the fix that took longest, or think about
which bug cost you an evening.

### 4 — the coursework line

I filled this with standard BSIS courses: Web Systems & Technologies, Information Management,
Systems Analysis & Design, Data Structures & Algorithms, Object-Oriented Programming,
Quantitative Methods. **Check them against your actual transcript** and swap anything you
haven't taken — the names vary between schools, and a recruiter who asks about a course you
never sat is a bad conversation. Keep it to 4–6; pick the ones closest to the job.

### Two small things worth knowing

**Your freeCodeCamp certificates each have a public verification URL.** Adding yours turns a
claim into something a recruiter can check, which is worth more than the line itself.

**The DNNHS date reads as "January 2026 – October 2026".** If the project is finished, use
the month it actually ended. If it's still running, `January 2026 – Present` is the convention
and is a slightly stronger signal — it says the work is live rather than filed away.

### 5 is the important one

The "What was hard" paragraph is the single most valuable thing on the page. Interviewers
ask that exact question and most student portfolios have nothing to say. Two or three
sentences: what broke, what you tried, what actually fixed it.

### 6 — check what I wrote about your project

The "What I built" bullets and the résumé project bullets were written **from your
screenshots**, not from your code. Read them and correct anything wrong. Specifically:

- The numbers quoted on the résumé (217 learners, 50 teachers, 100 classes) come off your
  admin dashboard. If that was seeded demo data rather than the real roll, either say so or
  drop the figures — do not let an interviewer catch that.
- I described the approval workflow as *not submitted → awaiting review → returned →
  published* based on the admin panel's status list. Check that matches what you built.
- I avoided naming a charting library because I couldn't tell from a screenshot. If you used
  one (Chart.js or similar), add it to the "Built with" tags and the résumé skills line. If
  you hand-rolled those charts, say so in the case study — that is worth more than the library.
- If any of this was team work rather than solo, fix the framing now. Overclaiming survives
  the screening and dies in the interview.

### Screenshots — already wired up

The six PNGs you added were 2880px wide and **6.7 MB** in total, which would have made the
page painful on mobile data. Each one has been resized and re-encoded into two JPEGs:

```
<name>-lg.jpg   1600px wide, quality 80  → opens in the lightbox
<name>-sm.jpg    620px wide, quality 76  → the gallery thumbnail
```

Totals: 6.7 MB → **1.15 MB** of large versions and **246 KB** of thumbnails. The page only
loads the thumbnails up front; the large ones load when a screenshot is opened.

The original PNGs are still on your disk but are **gitignored**, so they don't bloat the repo
or the deploy. If you add or replace a screenshot later, drop the new PNG into `assets/img/`
and re-run:

```bash
pwsh -File tools/optimize-images.ps1
```

It regenerates the `-lg` and `-sm` JPEGs for every PNG in that folder. Then point a
`<button class="gallery__item">` at the new filenames — keep the `data-full` and
`data-caption` attributes, since those drive the lightbox:

```html
<button class="gallery__item" type="button"
        data-full="assets/img/new-shot-lg.jpg"
        data-caption="What this screen shows">
  <img src="assets/img/new-shot-sm.jpg" loading="lazy" decoding="async"
       alt="What this screen shows">
</button>
```

Include at least one shot of the **portal/admin side**. The public pages look like any
other website; the login and CRUD screens are the part that proves the backend work.

---

## Running it locally

Just opening `index.html` from the file system mostly works, but the contact form's
`fetch` needs a real server. Run one:

```bash
npx serve .
```

Then open the URL it prints (usually `http://localhost:3000`).

---

## Making the résumé PDF

`assets/resume.pdf` already exists — A4, one page, with every contact and project link
preserved as a clickable annotation. `resume.html` offers it on a **Download PDF** button.

**Regenerate it after any edit to `resume.html`.** The PDF is a snapshot, not a live view:

```bash
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="C:\portfolio\assets\resume.pdf" "file:///C:/portfolio/resume.html"
```

This is the same engine as Chrome's print dialog, with "Headers and footers" already off —
which is the setting most easily missed by hand, and it stamps the date and file path across
the page when left on.

Doing it through the dialog instead: **Ctrl+P**, then change **Destination** from your printer
to *Save as PDF* — it's a dropdown, not a button, which is easy to miss — then turn off
**Headers and footers** under *More settings*, and save to `assets/resume.pdf`.

**Page budget:** the generated PDF measures **one page** at A4 (209.9 × 297.0 mm). Earlier
drafts sat at roughly 260mm of the 273mm of usable height, so there is little headroom. If you
add much more and it spills, let it run to two pages rather than deleting real work: one page
is the convention for students, but two is perfectly defensible once you have two substantial
projects on it.

Nothing on the résumé page is addressed to you any more — it is linked from the portfolio nav
and hero, so a recruiter reads whatever is on it. Keep author notes out of it.

---

## Putting it on GitHub

Your account exists but nothing is pushed yet. Fix that — a recruiter who clicks through
to an empty GitHub is worse than one who never clicks.

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Add portfolio site"
```

Then create an empty repo on github.com (no README, no .gitignore — this project has
both), and:

```bash
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
```

```bash
git branch -M main
```

```bash
git push -u origin main
```

### Then push the DNNHS project too

This matters more than anything else on this list. The portfolio *describes* your work;
the repo *is* your work. Before you push it:

- Remove any database passwords or config with real credentials
- Add a short README explaining what it does and how to run it
- Include a `.sql` dump of the schema if you can — it shows the database design directly

---

## Deploying to Netlify

**Option A — connect the repo (recommended).** Sign in at
[app.netlify.com](https://app.netlify.com) → *Add new site* → *Import an existing project*
→ pick your GitHub repo. Leave the build command empty and the publish directory as `.`
(`netlify.toml` already sets this). Every `git push` redeploys automatically.

**Option B — drag and drop.** Go to [app.netlify.com/drop](https://app.netlify.com/drop)
and drag the whole `portfolio` folder onto the page. No git required, but you have to
re-drag it every time you change something.

### After the first deploy

1. **Rename the site to `giomelicano-portfolio`** — Site configuration → Change site name.
   Netlify gives you a random name like `fluffy-panda-4f2a1b`; the URL already written into
   your résumé and meta tags assumes `giomelicano-portfolio`, so this step is required, not
   cosmetic.
2. **Turn on form notifications** — Forms → *contact* → Settings → *Add notification* →
   *Email notification*, sent to `giomelicano16@gmail.com`. Without this, messages sit in
   the dashboard and you never find out.
3. **Test the form** — submit it on the live site and confirm the email arrives. Do this
   once; a contact form that silently fails is worse than no contact form.
4. **Update the placeholders** in table rows 3 above with your real URL, then redeploy.

Netlify's free tier covers 100 form submissions per month, which is far more than a
portfolio will ever get.

---

## Project 03 — the catering site, and why it looks different

It's a shorter card on purpose. It was group work, and the files are gone — no screenshots,
no repo, no demo. Forcing it into the full case-study layout would leave an empty image slot
and a "what was hard" section you can't honestly fill, which reads as incomplete. A compact
entry reads as a deliberate choice about a secondary project.

Two things about it are deliberate and worth keeping:

- **"Team of students — my part: front-end and database design"** is in the role line, and
  there's a separate **What I did** block. On a group project, "we built" with no attribution
  invites an interviewer to assume you did all of it — and that assumption unravels badly in
  the follow-up questions.
- **"Project stack"**, not "Built with". The project used PHP; you didn't write it. The label
  says the stack is the project's, while your contribution is stated separately.

**It's deliberately not on the résumé.** The résumé is at 267mm of 273mm with two projects on
it; a third would push it to two pages. A résumé is a highlight reel, not a complete list —
and this is your weakest entry, being group work with nothing to show. It's on the portfolio
and LinkedIn, which is where completeness matters. Say the word if you'd rather have it there.

**If you ever find the files**, screenshots would upgrade this to a full case study in about
twenty minutes.

---

## The link-preview card

`assets/img/og-image.png` (1200×630) is what renders when you paste your URL into LinkedIn,
a chat, or an application form that shows previews — which is exactly where this link is
going. It's generated by `tools/make-og-image.ps1`; if you rename the site or change your
title, re-run it:

```bash
pwsh -File tools/make-og-image.ps1
```

---

## Where to put the link

Once it's live, the URL goes in all of these:

- The header of your résumé
- Your LinkedIn profile (Contact info → Website)
- Your GitHub profile bio
- The application form itself, wherever it asks for a portfolio or personal website

---

## Project structure

```
portfolio/
├── index.html          # the whole portfolio — all sections
├── resume.html         # print-optimised résumé
├── css/
│   ├── style.css       # design tokens + all site styles
│   └── resume.css      # résumé screen + @media print
├── js/
│   └── main.js         # theme, nav, reveal, lightbox, form
├── gwa/                # project 02 — GWA calculator (see below)
├── assets/img/         # screenshots, photo, og-image.png
├── tools/              # image resize script
├── netlify.toml        # publish config + security headers
├── robots.txt
├── sitemap.xml
└── .gitignore
```

---

## Project 02 — the GWA calculator

Lives in `gwa/` and deploys with the site, so it's live at `yoursite.netlify.app/gwa/`
the moment the portfolio is. Nothing extra to set up.

```
gwa/
├── index.html
├── css/app.css
└── js/app.js        # rules, state, calculations, planner, rendering
```

**The bit worth being able to explain.** The planner answers "what's the lowest grade I
need in every remaining box?" That looks like algebra, but subject finals are rounded to
whole numbers *before* they're averaged, so the general average is a step function of your
next grade rather than a straight line — a closed-form answer is off by one exactly at the
boundaries people care about. With three quarters at 90 and a target of 90, algebra says
you need 90; you actually only need 88, because 89.5 rounds up.

So it doesn't solve it, it searches it: try every whole grade 0–100, recompute the whole
result each time, return the first that works. 101 iterations over a handful of subjects is
far too cheap to be worth optimising, and it's exact by construction. That trade — spending
cycles you have to buy correctness you'd otherwise have to prove — is a good thing to be
able to talk through.

**Two structural decisions you should also be able to defend:**

- `renderSubjects()` and `renderResults()` are separate. Rebuilding the rows on every
  keystroke would destroy the input being typed into, so only structural changes (add,
  remove, reset, term count) rebuild; everything else updates values in place.
- All the calculations are pure functions that take subjects and return numbers, touching
  no DOM. That's what lets the planner replay them 101 times cheaply, and it's why the
  logic could be tested from the console without a test framework.

**Verify the rules.** Thresholds live in the `RULES` object at the top of `js/app.js` —
passing at 75, honours at 90/95/98, and no subject below 85 for honours. Check those against
your school's current DepEd guidelines before relying on it. They're in one place precisely
so they're easy to correct.

`window.GWA` is exposed in the console (`subjectFinal`, `generalAverage`, `planFor`) if you
want to poke at the maths.

### The profile photo

`assets/img/profile.jpg` is 768×1344, taller than the 4:5 frame it sits in, so `object-fit:
cover` crops the top and bottom. `object-position: center 38%` biases that crop toward the
face — if you swap the photo for one framed differently, that percentage is the knob to turn.

It renders grayscale to stay inside the monochrome palette (the reference does the same),
and returns to full colour on hover. To keep it in colour permanently, delete the `filter`
line in `.hero__portrait img` in `css/style.css`.

### How the design works

The whole palette lives in the custom properties at the top of `css/style.css`. Change
`--fg`, `--bg` and friends there and the entire site follows — including the dark theme,
which is the same tokens redefined under `[data-theme="dark"]`.

The layout follows a light monochrome editorial style: `#222` / `#7B7B7B` / `#F8F8F8` /
`#FFF`, large light-weight display type, hairline rules, and a lot of whitespace.

### What's in `main.js`

Seven small blocks, each commented: theme toggle (saved to `localStorage`), mobile nav,
scroll reveal via `IntersectionObserver`, active-nav highlighting, the screenshot lightbox
(arrow keys, Escape, focus restore), contact form validation and submit, and the footer
year.

Worth knowing, because "tell me about something on your portfolio" is a real interview
question and this is all code you can read and explain.
