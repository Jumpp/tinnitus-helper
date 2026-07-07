# Tinnitus Helper — App Plan

## Summary

Convert the existing single-file `index.html` frequency therapy web app into a polished, monetised mobile app for iOS and Android. Use web technologies throughout, compiled to native via Capacitor.

---

## Tech Stack

| Layer          | Choice                                  | Rationale                                                                                                         |
| -------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Framework      | **React + TypeScript**                  | Familiar web stack, great ecosystem                                                                               |
| Build          | **Vite**                                | Fast, minimal config                                                                                              |
| Native wrapper | **Capacitor**                           | Web-first; deploy to iOS, Android, and web from one codebase                                                      |
| Styling        | **Tailwind CSS + custom design tokens** | Utility-first, easy dark theme                                                                                    |
| Auth           | **Supabase Auth**                       | Email/password + OAuth (Apple, Google); free tier generous; works great with Capacitor                            |
| Database       | **Supabase Postgres**                   | Store user profiles, calibration history, session logs                                                            |
| Payments       | **RevenueCat**                          | The de-facto standard for in-app subscriptions on both stores; handles receipt validation, entitlements, webhooks |
| State          | **Zustand**                             | Lightweight, no boilerplate                                                                                       |
| Routing        | **React Router v6**                     | Standard SPA routing                                                                                              |
| Icons          | **Lucide React**                        | Clean, consistent                                                                                                 |
| Animations     | **Framer Motion**                       | Polished transitions between screens                                                                              |

---

## Views / Screens

### 1. Onboarding / Landing (`/`)

- App name, tagline, hero illustration or waveform animation
- "What is this?" — brief explanation of sub-threshold stimulation
- CTA: **Get Started** (→ sign up) / **Log In**
- No paywall here — let them see the value first

### 2. Auth (`/auth`)

- Sign up / log in with email+password
- Social: Sign in with Apple (required for iOS), Sign in with Google
- Password reset flow
- On success → first time calibration

### 3. Calibration (`/calibrate`)

- Quick **high-frequency hearing screen** during onboarding: test 2, 3, 4, 6, 8, 12 kHz per ear
- Only bands where loss is detected are shown in the Session view — no unnecessary UI clutter
- One frequency + ear at a time, with clear instructions
- Progress indicator: "Step 3 of 6"
- Saves calibration snapshot to Supabase (with timestamp)
- "Why calibrate?" tooltip/modal
- Prompt to recalibrate if using different device/headphones or if >30 days since last calibration

### 4. Therapy Session (`/session`)

- Main experience — the core of the app
- **Only shows bands where the user has calibrated loss** — determined during onboarding screen; bands without detected loss are hidden by default
- Bands can be added/removed on the fly without going back to a calibration wizard — the threshold for each band is always adjustable inline
- Waveform / frequency visualiser (simple animated bars, not a real spectrum)
- Per-band on/off toggles, L/R level controls
- Frequency bands split into two groups:
  - **Usual suspects** (shown by default after onboarding screen): 4, 6, 8, 12 kHz — covers the classic NIHL/tinnitus range
  - **Fringe** (hidden behind an "Add band" option): 2, 3 kHz — for users with more extensive or atypical loss
- oscillation rate (hidden advanced setting, default in prototype)
- Session timer with start/pause/stop
- **Live level adjustment without stopping the session** — user can nudge thresholds up/down mid-session as the tinnitus becomes audible or inaudible, same as the current prototype behaviour
- "Recalibrate this band" shortcut per row
- Lock screen audio support via Capacitor media session plugin
- Background audio must keep playing when screen locks (critical)

### 5. Progress / Dashboard (`/progress`)

- Gamification: streak counter (days in a row), compare to previous sessions (give a point score out of a 100)
- Calibration history chart — are the threshold levels changing over time?
- biological age of hearing (optional, fun metric)?
- Badges / milestones (7-day streak, 10 hours total, etc.) (optional)

### 6. Account & Subscription (`/account`)

- Profile: email, display name
- Subscription status (active / trial / expired), plan name, renewal date
- Upgrade / manage subscription → RevenueCat paywall sheet
- Restore purchases button (required by both stores)
- Sign out, delete account
- Link to privacy policy, terms

---

## Subscription / Monetisation

- **Free tier**: 3 sessions total (enough to feel the value)
- **Monthly**: ~$9.99/month
- **Yearly**: ~$69.99/year (~42% saving)
- Managed entirely by RevenueCat — entitlements checked on app launch
- Paywall presented after free sessions are exhausted, and accessible from Account
- RevenueCat webhooks → Supabase edge function → update `users.subscription_status`

---

## Gamification Details

- **Streaks**: session logged each day → streak increments; resets if >36 h gap
- **Threshold delta**: after each calibration, compare to previous; if average threshold level has decreased (same audibility at lower volume), flag it as improvement
- **Verdicts** (keep them honest / conservative):
  - "Consistent stimulation — keep going"
  - "Left ear showing lower thresholds at 8 kHz"
  - "No measurable change yet — that's normal early on"
- **Badges**: stored in Supabase, displayed in Progress tab

---

## UI Design Direction

- **Dark, medical-grade aesthetic** — not clinical white, not gamer RGB. Think: deep navy/charcoal backgrounds, soft blue/teal accents, smooth gradients
- **Typography**: Inter or SF Pro-style system font; tabular numbers for all counters
- **Motion**: subtle entrance animations, haptic feedback on iOS/Android for button presses
- **Accessibility**: minimum 44 × 44 pt tap targets, WCAG AA contrast

---

## Device APIs (via Capacitor plugins)

| Need                                      | Plugin                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep screen awake during session          | `@capacitor-community/keep-awake`                                                                                                                                              |
| Background audio / lock screen controls   | `@capacitor-community/background-runner` or Media Session API                                                                                                                  |
| Haptic feedback                           | `@capacitor/haptics` (built-in)                                                                                                                                                |
| Device volume read (auto-compensate gain) | `@capacitor-community/volume-buttons` or native bridge — read system volume, apply as inverse gain multiplier so perceived loudness stays constant regardless of device volume |
| Secure token storage                      | `@capacitor/preferences`                                                                                                                                                       |
| Push notifications (streak reminders)     | `@capacitor/push-notifications`                                                                                                                                                |

> **Note on volume**: iOS/Android don't allow apps to _set_ system volume, but the volume level can be _read_ via a Capacitor native bridge. We read it on session start and whenever it changes, then apply an inverse gain multiplier in Web Audio so the calibrated thresholds stay accurate regardless of what the device volume is set to. This replaces the current manual "Volume fine-tune" slider — it becomes fully automatic.

---

## Project Structure (proposed)

```
tinnitus-helper-app/
├── src/
│   ├── components/       # Shared UI components
│   ├── views/            # Route-level screens
│   │   ├── Landing.tsx
│   │   ├── Auth.tsx
│   │   ├── Calibrate.tsx
│   │   ├── Session.tsx
│   │   ├── Progress.tsx
│   │   └── Account.tsx
│   ├── store/            # Zustand slices
│   ├── lib/              # Supabase client, RevenueCat helpers, audio engine
│   ├── hooks/            # useAudio, useSession, useSubscription
│   └── main.tsx
├── android/              # Generated by Capacitor
├── ios/                  # Generated by Capacitor
├── index.html
├── vite.config.ts
├── capacitor.config.ts
└── package.json
```

---

## App Store Requirements (checklist)

- [ ] Sign in with Apple (mandatory if any social login on iOS)
- [ ] Privacy policy URL
- [ ] "Restore purchases" button in Account
- [ ] No mention of competitor prices in app
- [ ] Health/wellness app category — no specific medical claims
- [ ] App icon (1024×1024) + all required sizes
- [ ] Screenshots for 6.7", 6.1", iPad Pro
- [ ] Google Play: target API 34+, 64-bit support (Capacitor handles this)

---

## Development Phases

### Phase 1 — Foundation (2–3 weeks)

- Vite + React + TypeScript + Tailwind scaffold
- Capacitor setup (iOS + Android)
- Supabase project: auth, users table, calibrations table, sessions table
- Auth flow (email + Apple + Google)
- Design tokens and base component library

### Phase 2 — Core App (3–4 weeks)

- Audio engine ported from `index.html` → `lib/audio.ts`
- Calibration wizard
- Therapy session screen with background audio
- Local session persistence

### Phase 3 — Monetisation + Progress (2–3 weeks)

- RevenueCat integration, paywall screen
- Session + calibration data synced to Supabase
- Progress dashboard, streak logic
- Gamification: threshold delta verdicts, badges

### Phase 4 — Polish + Store (2 weeks)

- Animations (Framer Motion)
- Haptics
- Onboarding flow
- App icons, splash screens
- TestFlight + Google Play internal testing
- Store listings

---

## Open Questions

1. **Apple review**: tinnitus therapy apps have been approved before; frame as "hearing rehabilitation aid", avoid "cure" or "treat" language
2. **Trial strategy**: 3 free sessions vs. 7-day free trial — trial is easier to A/B test
3. **Pricing localisation**: RevenueCat handles this automatically
4. **Web version**: keep the GitHub Pages version free/open? Or redirect to app?
5. **Analytics**: Posthog (privacy-friendly) vs. nothing

Notes:

- Move the tremolo speed from 6-9Hz to avoid "burning" that frequency. Maybe start with a lower value, and ramp it up/down. We could change every minute or so. We dont want to make the change too drastic, lets change to a neighboring hz, so 6hz,7hz,8hz, 9hz,8hz,7hz,6hz.
- Oscillation intensity 40% seems to be the best
- When pressing the card, isolate that track so you can easily see if that frequency is the one being heard. This should can/should not interfere with other buttons (volume sliders, toggle) in that card.