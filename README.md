# 🏅🍺 Beerlympics

The all-in-one app for hosting your annual backyard Beer Olympics — **Partiful-style invites & RSVP**, **team drafting**, a brand-new **fluid tournament engine** that keeps everyone playing instead of waiting, a **real-time scoreboard**, and **in-app photo/video capture** for the highlight reel.

Built with **Next.js 15** (App Router) + **Convex** (real-time backend) + **Resend** (email), deployable to **Vercel** in minutes.

---

## ✨ What's inside

| Feature | What it does |
| --- | --- |
| **Invites & RSVP** | A hype landing page, RSVP (yes/maybe/no) with +1s, and custom shareable invite links you can text manually **or** email via Resend. Guests pick a name + emoji. |
| **Teams** | Create or join a team, choose a name, theme, color, emoji, and motto. Captains manage the roster. |
| **Game library** | A curated library of 12 games (host can include/exclude any), each with a custom **animated neon SVG** and **encoded rules** that everyone who joins can browse at `/games`. |
| **The Circuit** *(new format)* | Every game runs its own tournament across **parallel stations**, and a **greedy dispatcher** seats the next match at every open table so nobody stands around. Placement in each game feeds one **grand total**. |
| **Beer Die gating** | Beer Die is deferred to the **Semifinals/Finals only** — its tables stay locked until you advance the day's phase, then it's seeded straight from the leaderboard as the climactic finale. |
| **Live scoreboard** | Real-time grand-total leaderboard with per-game breakdowns, an activity ticker, and a chromeless **TV / projector mode** at `/scoreboard/tv`. |
| **Media & highlight reel** | Capture photos/videos in-app (auto-timestamped), upload to a shared event folder, ⭐ the best for the highlight reel. |
| **Host dashboard** | One screen to run the whole day: advance phases, generate brackets, dispatch matches, open/close stations, award bonus points, manage teams/RSVPs/invites, and tune scoring. |

See **[docs/FORMAT.md](docs/FORMAT.md)** for how "The Circuit" tournament format works.

---

## 🚀 Quick start (local)

```bash
# 1. Install deps
npm install

# 2. Spin up Convex (creates your dev deployment + writes NEXT_PUBLIC_CONVEX_URL to .env.local)
npx convex dev          # leave running in one terminal; log in / create a project when prompted

# 3. Seed Beerlympics IV (Sat Jun 13, 2026) — 12-game library w/ rules, 4 phases, stations
npx convex run seed:run
#   → optional demo teams so the scoreboard isn't empty:
npx convex run seed:demo

# 4. Start Next.js
npm run dev:next        # http://localhost:3000
```

> `npm run dev` runs **both** Next.js and `convex dev` together via `concurrently`.

### Become the host
Open the app → tap your avatar (top-right) → **"I'm the host →"** → enter the host code.
The seeded event's host code is **`HOST`** (change it later in the Host → Settings, or set your own when creating an event from scratch).

---

## ✉️ Email (Resend) — optional but recommended

Invite emails and RSVP confirmations are sent from a **Convex action**, so the keys live on your **Convex deployment** (not Vercel):

```bash
npx convex env set RESEND_API_KEY re_xxxxxxxx
npx convex env set RESEND_FROM "Beerlympics <invites@yourdomain.com>"   # must be a Resend-verified domain
npx convex env set RESEND_REPLY_TO you@yourdomain.com                   # optional
```

No key set? The app still works — invite **links** are generated regardless; you just text them manually. Email sends are marked "failed" with a clear reason in the Host → Invites panel.

For testing without a domain, Resend allows `onboarding@resend.dev` as the `from` address.

---

## ▲ Deploy to Vercel

1. **Push to GitHub** and import the repo in Vercel.
2. In the Convex dashboard → **Settings → Deploy keys**, create a **Production** deploy key.
3. In Vercel project **Settings → Environment Variables**, add:
   - `CONVEX_DEPLOY_KEY` = the production deploy key
   - `NEXT_PUBLIC_APP_URL` = your production URL (e.g. `https://beerlympics.vercel.app`) — used to build invite links
4. Set the Vercel **Build Command** to:
   ```
   npx convex deploy --cmd 'npm run build'
   ```
   This pushes your Convex functions, regenerates `convex/_generated`, injects `NEXT_PUBLIC_CONVEX_URL`, and then builds Next.js.
5. Set your Resend env vars on the **production** Convex deployment:
   ```bash
   npx convex env set --prod RESEND_API_KEY re_xxxxxxxx
   npx convex env set --prod RESEND_FROM "Beerlympics <invites@yourdomain.com>"
   ```
6. Deploy. After the first deploy, run the seed once against prod if you want the default games:
   ```bash
   npx convex run --prod seed:run
   ```

---

## 🗂️ Project structure

```
convex/                 # Real-time backend (Convex functions)
  schema.ts             # Data model (events, users, players, teams, games, phases,
                        #   stations, matches, scoreEntries, media, invites, activity)
  engine.ts             # The Circuit: dispatcher, advancement, placement scoring
  tournament.ts         # Bracket generation, phase control, gating, dispatch
  matches.ts            # Result reporting, corrections, live board queries
  events / teams / rsvp / invites / games / phases / stations / scoring / media / activity / users
  email.ts              # Resend invite + RSVP-confirmation actions
  seed.ts               # `seed:run` (event) and `seed:demo` (teams)
src/
  app/                  # Next.js App Router pages
    page.tsx            #   Home (hero, countdown, RSVP CTA, live podium, feed)
    rsvp / i/[code]     #   RSVP + custom invite landing
    teams / [teamId]    #   Team drafting + detail
    play                #   The Circuit — live runner (you're up, now playing, station board)
    games/[gameId]      #   Per-game bracket
    scoreboard / tv     #   Live leaderboard + TV mode
    photos              #   Capture + gallery + highlight reel
    host                #   Host control center
  components/           # AppFrame (shell), primitives, pickers, feature components
  lib/                  # identity (device auth), format, team colors
```

---

## 🔐 Identity model

No passwords. Each device gets a stable id in `localStorage` and claims a name + emoji — perfect for a party where people pop in on their phones. The **host** unlocks extra controls by entering the event's host code. All host-only mutations are guarded server-side.

---

Made for game day. May the best team win. 🥇
