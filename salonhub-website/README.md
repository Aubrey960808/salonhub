# SalonHub

A salon booking website for the South African market, supporting two booking
modes:

- **House calls** — makeup artists, barbers, nail technicians and braiders
  who travel to the client
- **Salon visits** — salons that list their own service menu

It's a static, front-end-only site (HTML / CSS / vanilla JS) so it can be
hosted for free on **GitHub Pages**. There's no real server: `localStorage`
in the visitor's browser acts as the "database," and it's pre-seeded with
20 provider profiles across different South African cities the first time
the site loads.

## What's included

- **Landing page** (`index.html`) — hero search, category shortcuts, and
  previews of salons / house-call pros
- **Sign up** (`signup.html`) — one form, toggled between "I want to book"
  and "I offer services" (which then branches into house call vs salon).
  Salon sign-ups must attach a business registration certificate (PDF or
  image) before they can submit.
- **Log in** (`login.html`) — with demo accounts listed on the page, plus a
  "Forgot password?" link
- **Forgot / reset password** (`forgot-password.html`, `reset-password.html`)
  — generates a time-limited reset link (30 minutes) and "sends" it by
  email + SMS through the simulated notification system below
- **Browse** (`browse.html`) — filter by booking type, category, city, and
  sort by price
- **Provider detail & booking** (`provider.html`) — service list, open time
  slots grouped by day, and a booking panel. Booking sends the client an
  email + SMS confirmation.
- **Customer dashboard** (`dashboard-customer.html`) — upcoming and past
  bookings, with the ability to cancel (which sends a cancellation
  notification)
- **Provider dashboard** (`dashboard-provider.html`) — accept/decline/complete
  bookings (accepting/declining notifies the client by email + SMS), add or
  remove services, add or remove availability slots, edit the public
  profile, and — for salons — upload or replace the business registration
  certificate
- **Admin dashboard** (`dashboard-admin.html`) — verify or unverify
  providers (with a dedicated "certificates to review" count and a link to
  open each salon's uploaded document), view all customers, remove
  accounts, and see every booking on the platform
- **Notifications inbox** (`notifications.html`) — every customer/provider
  can see the simulated emails and SMS sent to them, with an unread badge
  on the bell icon in the nav
- Favicon and a small in-nav logo mark (`assets/favicon.svg`)

## Salon verification & business registration certificates

Salon sign-ups (not house-call providers) must upload proof of business
registration — a CIPC certificate or equivalent — as part of the sign-up
form. That file is one of the checks an admin makes before flipping a
salon's account to "Verified" in the admin dashboard, where it appears as
a "View certificate" link next to that provider. Providers can also replace
their certificate later from their dashboard's Profile tab; doing so resets
them to "pending review" so an admin re-checks the new document.

The seeded demo salons already have a certificate *on file* for realism,
but since they weren't uploaded through a real file input, there's no
actual file behind them — the admin table shows their filename with a
"(seed data, no file)" note instead of a working link. Certificates
uploaded through the real sign-up form or the provider dashboard **do**
produce a real, openable file (stored as a data URL — see the limitation
below).

## Simulated email & SMS confirmations

Because GitHub Pages only serves static files, there's no real mail or SMS
server here. Instead, `js/notifications.js` logs every "sent" message
(booking requested/confirmed/declined/cancelled, and password-reset links)
into `localStorage`, and the bell icon + `notifications.html` page let you
see them as if you were the recipient. To make these send for real, wire
`NOTIFY.send()` in `js/notifications.js` up to an actual provider — e.g. a
small serverless function calling SendGrid or Postmark for email, and
Twilio for SMS. Every place in the app that needs to notify someone already
calls this one function, so the swap is contained to that file.

## Demo accounts

| Role     | Email                              | Password      |
|----------|-------------------------------------|---------------|
| Customer | customer@demo.com                   | demo1234      |
| Provider | thandi.nkosi@salonhub.app           | password123   |
| Admin    | admin@salonhub.app                  | admin123      |

(Every seeded provider uses the password `password123` — their email is
`firstname.lastname@salonhub.app`, all lowercase. Open `js/data.js` to see
the full list of 20 providers.)

## Running it locally

No build step needed. From this folder, run any static file server, e.g.:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser. Opening `index.html`
directly by double-clicking also works in most browsers, but a local server
avoids some browser restrictions on JavaScript modules.

## Deploying to GitHub Pages

1. Create a new GitHub repository and push this folder's contents to it
   (the `index.html` file should sit at the repo root, or in `/docs` if you
   prefer that layout).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick
   your default branch (e.g. `main`) and the `/ (root)` folder.
4. Save. GitHub will publish the site at
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## How data is stored (important limitation)

This is a front-end demo: all accounts, services, availability and bookings
are stored in the visitor's own browser via `localStorage`. That means:

- Data does **not** sync between devices or browsers — a booking made on
  your phone won't show up on your laptop.
- Clearing browser data / site data wipes everything back to the original
  seed.
- Anyone using the site has their own private copy of the "database" — two
  different visitors won't see each other's bookings, which also means an
  admin on one browser can't verify a provider who signed up on a different
  browser/device.

This is intentional for a GitHub Pages demo, since GitHub Pages can only
serve static files. To make it a real multi-user product, swap the
functions in `js/data.js` (`DB.getUsers`, `DB.saveUsers`, `DB.getBookings`,
`DB.saveBookings`, session handling) for calls to a real backend — a small
Node/Express + database API, or a backend-as-a-service like Supabase or
Firebase, would drop in cleanly since all the reads/writes already go
through that one `DB` object.

Uploaded business registration certificates are also stored client-side —
as base64 data URLs inside the same `localStorage` user record — capped at
3MB each to avoid hitting browser storage limits. A real backend should
instead upload these to proper file storage (e.g. S3, Supabase Storage) and
store a URL rather than the file itself.

## File structure

```
index.html
signup.html
login.html
browse.html
provider.html
dashboard-customer.html
dashboard-provider.html
dashboard-admin.html
css/
  style.css
js/
  data.js                 seed data + localStorage "database" layer
  app.js                  shared nav, auth guards, formatting helpers
  signup.js
  login.js
  browse.js
  provider.js
  dashboard-customer.js
  dashboard-provider.js
  dashboard-admin.js
```
