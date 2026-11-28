# Monetization research (roadmap item R)

Researcher, 2026-11-28. Research only, nothing gets built. Every number has a source and a date. "Checked" = the date we read it (2026-11-28 unless noted). **Opinion** and **guess** are marked.

**Short answer:** free app with a fair Pro subscription (Play Billing / StoreKit), plus labelled partner perks from our own JSON file. Nheil's own paid programs come next. No ads.

---

## 1. How lifting apps make money

| App | Free tier | Pro price (US) | Trial | Lifetime |
|---|---|---|---|---|
| Hevy | Unlimited logging, no ads, 4 routines, 7 custom exercises, 3-month graphs | $2.99/mo (a $3.99 SKU too), $23.99/yr | none published | $74.99 |
| Strong | Unlimited logging, no ads, 3 templates, some charts | $4.99/mo, $19.99/6 mo, $29.99/yr | none published | $99.99 |
| Boostcamp | Full tracker + most of a 14,000+ program library, RPE logging, weekly report | $14.99/mo, $59.99/yr | 7 days (yearly only) | not offered |
| JEFIT | Yes, with ads | $12.99/mo, $69.99/yr | 7-day Adaptive Plan trial | none |
| Fitbod | None | $15.99/mo, $95.99/yr | 7 days, card needed | none |
| SensAI | None | $6.99/mo, $69.99/yr | 7 days, no card | none |
| JuggernautAI | None | ~$35–44/mo | 14 days | none |

Sources: Hevy and Strong and JEFIT/Fitbod/SensAI from [SensAI price table (competitor source), prices checked 2026-09-08](https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison); Strong detail from [SensAI Strong review, 2026-10-04](https://www.sensai.fit/blog/strong-app-review-2026) and [Strong App Store page](https://apps.apple.com/app/strong/id464254577) (checked 2026-11-28); Hevy SKUs from [App Pricing Lab, crawled 2026-04-15](https://apppricinglab.com/iap/apple/1458862350); Boostcamp from [Boostcamp "Is it free?", updated 2026-10-15](https://www.boostcamp.app/is-boostcamp-free); JEFIT from [App Store](https://apps.apple.com/us/app/id449810000) (checked 2026-11-28); JuggernautAI from `competitors.md` (checked 2026-11-24).

**What gets paywalled (pattern):**
- Loggers (Hevy, Strong): logging is free; Pro buys *limits removed* (routines, charts, calculators) and extras.
- Coaches (Fitbod, JuggernautAI, MacroFactor): no free tier at all; the coaching *is* the product.
- Boostcamp: content free, *auto-progression* and analytics paid.
- Strong promises your data stays available if you stop paying ([SensAI, 2026-10-04](https://www.sensai.fit/blog/strong-app-review-2026)).

**Side business:** Hevy Coach charges trainers $25/mo for 1–10 clients, up to $160/mo for 51–100 ([Capterra](https://www.capterra.com/p/10015732/Hevy-Coach/pricing/), checked 2026-11-28).

---

## 2. Subscription vs one-time vs freemium

**Benchmarks, Health & Fitness, 2025 data** ([RevenueCat State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps), checked 2026-11-28):

| Metric | Median | Top quartile |
|---|---|---|
| Download → paid within 35 days | 2.9% | 6.2%+ |
| Download → trial (30 days) | 6.9% | — |
| Trial → paid | 37.7% | 51.4%+ |
| Median monthly price | $9.99 | — |
| Median yearly price | ~$39.94 | — |

- Trials start almost immediately: 82% on day 0 (same source).
- Hard paywalls convert downloads at roughly 5× freemium, but year-1 retention is about the same: yearly plans 28% freemium vs 27% hard paywall, monthly 8% vs 9% (same source).
- Cheaper plans keep more users: year-1 yearly retention is 36% low price vs 23% high price (same source).
- Yearly plans were 61% of H&F revenue in 2025 ([RocketShip HQ citing Adapty, updated 2026-10-27](https://www.rocketshiphq.com/paywall-optimization-fitness-apps/)).

**Lifetime deals** ([RevenueCat blog, 2025-11-12](https://revenuecat.com/blog/growth/lifetime-subscriptions)):
- About 18–24% of apps in most categories sell both a subscription and a lifetime option.
- Typical lifetime price is 5–12× yearly. Strong (3.3×) and Hevy (3.1×) sit lower.
- Risk: lifetime buyers bring no recurring revenue, and future server costs keep running.

**Complaints in reviews and forums:**
- **Trials that turn into a surprise yearly charge.** Fitbod on Trustpilot (3.0/5 from 38 reviews): a 2026-08-04 review describes a trial becoming an A$149.99 yearly charge with no reminder, and refunds being refused. A 2026-10-15 review says Apple cancellation was hard to find ([Trustpilot](https://www.trustpilot.com/review/fitbod.me), checked 2026-11-28).
- **Paying and then losing features.** JEFIT reviewers are unhappy about changes after they paid; one doesn't plan to renew ([App Store](https://apps.apple.com/us/app/id449810000), checked 2026-11-28).
- **The price itself** (Strong, JuggernautAI; see `competitors.md`).

**Options for Lift Log (opinion):**

| Model | Good | Bad |
|---|---|---|
| Hard paywall | Most revenue per download | We'd be one more paid coach app. Kills word of mouth from Nheil's gym audience |
| **Freemium + Pro sub** | Free coaching is our pitch. Recurring money pays for Supabase | Lower conversion (~3%) |
| One-time unlock only | Users love it | No recurring income; Velocity Coach and sync cost ongoing work |
| Sub + lifetime | Lifetime pleases sub-haters; cash up front | Cannibalizes subs if priced too low |

---

## 3. Store rules and fees (US)

**Google Play** (fees changed 2026-06-30 in the US, EEA and UK):

| Item | Fee |
|---|---|
| Auto-renewing subscriptions, any billing | 10% service fee |
| + Google Play Billing fee | +5% (so **15%** total in-app) |
| One-time purchases, first $1M/yr | 10% (+5% if Play Billing) |
| Registration | $25 one time |
| New personal accounts | Closed test, 12+ testers opted in 14 days in a row before production |

Sources: [Play fee page](https://support.google.com/googleplay/android-developer/answer/112622?hl=en), [Play fee table for new/existing installs](https://support.google.com/googleplay/android-developer/answer/16954621), [Android Developers Blog, 2026-06-24](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html?debug=true), [Blog, 2026-03-04](https://android-developers.googleblog.com/2026/03/a-new-era-for-choice-and-openness.html?debug=true), [registration fee](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en), [testing rule](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB). All checked 2026-11-28.

**Apple App Store:**

| Item | Fee |
|---|---|
| Small Business Program (under $1M proceeds/yr; must enroll) | **15%** on paid apps and in-app purchases |
| Developer Program | $99/year (individuals can't get the fee waiver) |

Sources: [Small Business Program](https://developer.apple.com/app-store/small-business-program/?page=2), [fee waiver page](https://developer.apple.com/support/fee-waiver). Checked 2026-11-28.

**US external payment links (both fast-moving, recheck before building):**
- **Apple:** since the April 2025 court order Apple takes **0%** on purchases made through a link out to the web ([MacRumors, 2026-08-13](https://www.macrumors.com/2026/08/13/app-store-fees-apple-link-outs/)). Its US guidelines have allowed buttons and links to outside purchases since 2025-05-01 ([MacRumors, 2025-05-01](https://www.macrumors.com/2025/05/01/apple-updates-u-s-app-review-guidelines-epic/)).
  - On 2026-08-13 Apple asked the court for a link-out fee of 15%, or **5% for small-business apps**. The court has not set it yet ([MacRumors](https://www.macrumors.com/2026/08/13/app-store-fees-apple-link-outs/)).
  - The Supreme Court hears Apple's appeal on **2027-01-11**. If Apple wins, the old fees could come back ([indietooling, 2026-11-15](https://indietooling.com/posts/apple-link-out-supreme-court)).
  - Apple reportedly still wants IAP offered *alongside* web checkout. That claim comes from a private conversation with Apple, not a published rule ([Superwall, 2026-06-03](https://superwall.com/blog/external-checkout-a-b-testing-and-trial-toggles-confirmed-apples-rules-for-ios)). A developer asking the same question on Apple's forums got no answer ([forum, 2026-08](https://developer.apple.com/forums/thread/841132)).
  - Even a tip link was rejected under 3.1.1 and App Review asked for IAP. The appeal was still pending ([forum, 2026-08-29](https://developer.apple.com/forums/thread/844046)).
- **Google:** linking out to the web does **not** avoid the fee. The 10% service fee still applies to web-link sales, and you must integrate Google's billing-choice APIs and report each sale within 24 hours ([Play billing choice](https://support.google.com/googleplay/android-developer/answer/17161464?hl=en), checked 2026-11-28). You only skip the 5% billing fee, and card fees eat that.
- **Web card fees:** Stripe charges 2.9% + 30¢ per US card payment, plus 0.7% for Stripe Billing subscriptions ([Stripe pricing](https://stripe.com/pricing?tp=1), checked 2026-11-28).

**What we keep from a $29.99/yr sale (estimate, before tax):**

| Route | Fee | We keep |
|---|---|---|
| Play Billing | 15% | ~$25.49 |
| Apple IAP (Small Business) | 15% | ~$25.49 |
| Web via Stripe (Android link) | 10% Play + ~3.6% + 30¢ | ~$25.61 |
| Web via Stripe (iPhone link, today) | 0% Apple + ~3.6% + 30¢ | ~$28.61 |

**Opinion:** on Android, web checkout is not worth the extra work. On iPhone it saves about $3 per yearly sale today, but the rule may change in 2027. Build store billing first.

---

## 4. Paying inside one HTML file in web views

Today the Android app loads `file:///android_asset/index.html` and the iPhone app uses `loadFileURL` (`app/.../MainActivity.java:42`, `ios/LiftLog/AppDelegate.swift:43`). Neither has a JavaScript bridge yet.

**Path A: native store billing through a small bridge (recommended)**
- **Android:** Play Billing Library in `MainActivity`, exposed to the page with `addWebMessageListener`. Google recommends it over `addJavascriptInterface` and says to lock it to allowed origins ([Android docs](https://developer.android.com/develop/ui/views/layout/webapps/native-api-access-jsbridge), checked 2026-11-28).
  - **Guess:** origin rules are awkward with `file://`. Switching to `WebViewAssetLoader` (an `https://appassets.androidplatform.net` origin) is probably needed. That changes the page origin, so localStorage would need a one-time copy. **Check this first, because it puts user data at risk.**
- **iPhone:** StoreKit 2 in Swift, reached through a `WKScriptMessageHandler`. The rest-timer vibration item (roadmap #5) needs the same kind of bridge, so build the bridge once.
- **Page side:** `window.LiftLogNative.buy('pro_yearly')` → native sheet → result → save `profile.pro = {plan, until, store}` (new field, nothing renamed). Add a "Restore purchases" button.
- **Checking receipts:** without a server check, anyone can edit localStorage. Options:
  - a Supabase Edge Function in Nheil's own project (fits the existing exception), or
  - RevenueCat or a similar service. That is a new third-party server, so it breaks rule 3 unless Nheil approves an exception.
  - **Opinion:** use Supabase. Accept that a determined user can unlock Pro offline; it isn't worth fighting.
- **Apple review risk:** Apple rejects apps that are "a repackaged website" (guideline 4.2). Native billing, notifications, vibration and share sheets all help us pass ([MobiLoud summary](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper), undated). I could not open Apple's guideline page itself (permission timed out).

**Path B: web checkout**
- A Stripe Payment Link opens in Safari or Chrome, a Stripe webhook goes to a Supabase function, and the function sets Pro on the account. The app reads it at sign-in.
- Good for the **GitHub Pages web version**, which has no store.
- On iPhone it is extra only (IAP likely still required, see section 3). On Android it saves almost nothing and needs Google's reporting APIs.
- Needs accounts (PR #8), so Pro would follow the account and not the device.

---

## 5. Income without a subscription

| Option | Money | Fit | Notes |
|---|---|---|---|
| **PR Perks + partner cards** (roadmap #7) | Flat fee per slot or affiliate % | High | Privacy-safe: static codes in our own `docs/partners.json`, links open in the browser, no user data sent |
| Affiliate links | Rogue 4% ([Rogue](https://support.roguefitness.com/hc/en-us/articles/48180736139796-Rogue-Fitness-Affiliate-Program)); Amazon sports 3%, health 1% ([Amazon](https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ/)); Gymreapers "up to 30%" ([Gymreapers](https://au.gymreapers.com/pages/affiliate-program)) | Medium | Tiny at low volume. Rogue needs "an active, regularly updated website" |
| Nheil's paid programs | Nheil sets the price | High | Unlocking it *in the app* is digital content, so store billing applies. Sold outside the app (PDF, coaching) is Nheil's own business |
| 1:1 coaching | Nheil sets the price | Medium | For trainers, the Hevy Coach model is $25–$160/mo ([Capterra](https://www.capterra.com/p/10015732/Hevy-Coach/pricing/)). TrainHeroic pays coaches monthly via PayPal for marketplace programs ([TrainHeroic](https://www.trainheroic.com/?p=239572), modified 2026-01-29) |
| Gym social tie-ins | Indirect | High | PR share cards (roadmap Now) bring new users. Creator codes for a free Pro month (**verify**: Apple offer codes and Play promo codes exist, but I didn't check the current rules this run) |

- **FTC rule for partner cards:** disclose clearly and right next to the link. "Affiliate link" on its own is not enough; "paid link" next to it is ([FTC Endorsement FAQ](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking?mode=jqm), checked 2026-11-28). The planned "Partner" / "Sponsored" label is a good start. **Opinion:** add the line "Lift Log earns a commission".
- **Unverified:** I believe Apple lets apps sell physical goods (gear) without IAP, so partner gear codes would be fine. I couldn't open the guidelines to confirm.

### Ads: considered, and why not
- Rule 3 bans tracking and third-party ad networks. Ad SDKs usually collect device IDs: JEFIT's App Store privacy label lists Device ID used for third-party advertising ([App Store](https://apps.apple.com/us/app/jefit-workout-plan-gym-tracker/id449810000), checked 2026-11-28).
- Ads during sets would also hurt the "coach every set" experience. Hevy and Strong advertise having no ads (section 1).
- **The privacy-safe form already exists:** direct-sold, labelled partner cards from our own JSON file (PR Perks). That is the only kind of ad we recommend.

---

## 6. Recommendation (opinion)

**Top 3**
1. **Freemium + Lift Log Pro subscription**, sold through Play Billing and StoreKit. This is the main income.
2. **PR Perks + partner cards** (direct-sold, no tracking), starting once there is an audience. Small money early, but it fits the brand.
3. **Nheil's own programs** as paid in-app packs, promoted on his gym social media. Do this after Pro works, because it reuses the same billing bridge.

**Free vs Pro**
- **Free forever:** everything that ships today, plus logging, history, backup and sync. That covers RPE suggestions, readiness, plateau fixer, pain log, ghost race, warm-ups and plate math, the 15-week plan, bodyweight tracker, weekly report and PR share cards.
  - Free coaching is our pitch against $60–$96/yr coach apps (section 1).
  - Taking features away is what makes reviewers angry (JEFIT).
  - Also promise "your data is never locked", like Strong.
- **Pro:** Nheil's Pro queue (PR forecast, "Only got X minutes", Cut coach, Ghost race a friend, Velocity Coach), plus partner cards off and extra themes.

**Suggested price (guess, to test):**
- **$4.99/mo or $29.99/yr**, with a 7-day trial on the yearly plan only.
- Optional **Founding Lifter lifetime at $79.99** for the first 90 days after launch. That's 2.7× yearly, near Hevy and Strong. RevenueCat would price it higher, so keep it time-limited.
- Why this level:
  - Same as Strong and above Hevy, both of which only log.
  - Half or less of Boostcamp ($59.99), Fitbod ($95.99) and the H&F median monthly price ($9.99).
  - Cheaper plans keep more users (section 2).
- Show the exact charge date, send a reminder before the trial ends, and give a one-tap path to cancel. Surprise trial charges are the top complaint (Fitbod).

**Must exist first (in order)**
1. Accounts merged (PR #8) and the privacy policy page (item 3, 2026-12-05).
2. Google Play launch: $25 account, 12-tester closed test for 14 days. Launch free and collect reviews before charging (opinion).
3. One native bridge in both wrappers, shared with the vibration work. On Android, settle the `file://` vs asset-loader origin question first, with a localStorage migration test.
4. Play Billing → `profile.pro` → receipt check in a Supabase Edge Function → Restore purchases.
5. At least 2 Pro features live (PR forecast and "Only got X minutes" are the easy ones). Then turn on the paywall.
6. iPhone: $99/yr Apple account, Small Business Program enrollment, StoreKit. Revisit web checkout after the Supreme Court ruling (argued 2027-01-11).

**Rough scale (illustrative guess):** 1,000 downloads × 2.9% paid × $29.99 × 85% ≈ **$740 a year**. Real money needs thousands of downloads, so growth (share cards, Nheil's social media) matters more than price fine-tuning.

## What I could not check
- Apple's App Review Guidelines page (permission timed out), and the Boostcamp and Fitbod App Store pages (blocked this run).
- Conversion numbers are category medians, not lifting-app-specific.
- No legal review. Store rules on link-outs are in court, so recheck before building.
