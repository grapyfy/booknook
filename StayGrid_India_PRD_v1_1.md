# Product Requirements Document (PRD)
## **StayGrid India** — Hotel Property Management & OTA Channel Manager
### For Independent Hotels, Homestays & Budget Chains (10–200 Rooms)
### Version 1.1 | August 2026 | *Pain-Point & Robustness Update*

---

### Changelog: v1.0 → v1.1

This revision keeps the original strategy intact and adds five things the first draft under-served: **switching-cost removal** (Excel migration), **lead recovery** (missed calls, abandoned carts, OTA-API downtime), **owner-facing intelligence** (lite pricing guidance instead of waiting for a Phase-2 RMS), **guest self-service** (fewer front-desk interruptions), and **engineering robustness** (idempotency, conflict resolution, chaos/DR testing — the difference between a demo and something a hotel trusts with its bookings).

| Area | What Changed |
|------|-------------|
| Problem Statement | Added switching-cost and lead-leakage pain points |
| Personas | Added pain points + success criteria tied to new features |
| Core Features | Added **Module J–N** (5 new modules, 18 new features) |
| NFRs | Added a dedicated **Reliability & Data Integrity Engineering** table |
| Tech Stack | Added OCR, feature flags, idempotency/webhook infra |
| KPIs | Added leakage-recovery and migration-friction metrics |
| Rollout | Rebalanced Phase 1 to front-load the highest-leverage, lowest-effort fixes |
| Risks | Added risks specific to the new features |
| New Appendix | Pain-Point → Feature traceability matrix |

---

## 1. Executive Summary

### Product Vision
Build a **modern, mobile-first, GST-native hotel management platform** designed specifically for India's fragmented independent hospitality sector. Unlike legacy PMS tools built for Western markets and retrofitted for India, StayGrid India is engineered from the ground up for Indian compliance, payment behaviors, and guest communication norms — starting with **WhatsApp as the primary guest engagement channel** and **UPI as the default payment mode**.

### Problem Statement
India's 40,000+ independent hotels and 25,000+ registered homestays/B&Bs operate on a toxic combination of:
- **Excel + physical ledgers** for reservations, leading to double-bookings and revenue leakage
- **Manual OTA extranet management** — staff log into 4–6 separate OTA dashboards daily to update inventory and rates, causing overbookings during peak season
- **GST non-compliance risk** — 70% of small hotels struggle with monthly GSTR-1 filing because their billing software doesn't auto-classify SAC codes or generate e-invoices
- **Payment chaos** — fragmented UPI QR codes, cash, card machines, and OTA virtual cards reconciled manually at month-end
- **No guest data ownership** — OTAs own the guest relationship; hotels have zero ability to drive direct re-bookings or retargeting
- **Lead leakage nobody tracks** — a missed call during checkout rush, or a booking abandoned mid-payment, is a lost guest with no follow-up. Owners have no idea how much revenue disappears this way because it never shows up as a "booking" to lose
- **Fear of switching** — even hotels that hate their current system stay put because migrating years of guest history and reservations out of Excel or a legacy PMS feels risky and time-consuming; this is the single biggest barrier to adoption, bigger than price

### Target Market
| Segment | Room Count | Count (India est.) | Annual Tech Spend | Pain Level |
|---------|-----------|-------------------|-------------------|------------|
| Independent budget hotels | 10–50 rooms | ~28,000 properties | ₹30K–₹1.2L/year | Critical |
| Mid-size independent hotels | 51–100 rooms | ~8,000 properties | ₹1L–₹3L/year | High |
| Small budget chains (2–10 properties) | 10–200 rooms/chain | ~1,500 chains | ₹3L–₹15L/year | High |
| Homestays / B&Bs / serviced apartments | 2–20 rooms | ~25,000 properties | ₹15K–₹80K/year | Critical |

**Primary beachhead:** Tier-2 and Tier-3 cities (Jaipur, Udaipur, Kochi, Goa, Manali, Rishikesh, Pondicherry) where OTA dependency is 60–80% but direct booking potential is untapped.

---

## 2. Target Users & Personas

### Persona 1: Rajesh — Hotel Owner / General Manager
- **Profile:** 45-year-old, owns a 35-room budget hotel in Jaipur. Not tech-savvy but business-smart.
- **Goals:** Reduce OTA commission (currently 18–25%), increase direct bookings, stop revenue leakage from no-shows and walk-ins, file GST without hiring a CA every month.
- **Pain Points:** Current software (Excel + OTA extranets) takes 2 hours every morning. Can't see which room categories are selling across all channels in one view. Doesn't know if his rates are too low during a local festival or too high during off-season — he's guessing. Worried that switching systems means losing years of guest records.
- **Success Criteria:** Single dashboard showing real-time occupancy, revenue, and OTA performance. GST return auto-ready by the 10th of every month. A same-day rate suggestion when demand shifts. A migration that takes hours, not weeks, with zero data loss.

### Persona 2: Priya — Front Desk / Reservation Agent
- **Profile:** 24-year-old, English + Hindi speaking, uses WhatsApp constantly. Handles check-ins, check-outs, phone bookings, and guest complaints.
- **Goals:** Check guest in under 3 minutes. Send booking confirmation + digital KYC link via WhatsApp. Never double-book a room.
- **Pain Points:** Current system crashes during checkout rush. Has to manually type guest details into OTA extranet and police verification portal separately. Misses calls during rush hour and has no way to follow up — those callers just book elsewhere. Internet drops for an hour most afternoons and she can't check anyone in when that happens.
- **Success Criteria:** Color-coded calendar, one-click check-in with auto-filled guest details, WhatsApp template messages. Missed calls auto-follow-up on WhatsApp within minutes. Front desk keeps working (queued, syncs later) during an internet outage.

### Persona 3: Amit — Accountant / Back Office
- **Profile:** 32-year-old, manages books for 3 properties. Uses Tally for accounting but it's not integrated with hotel operations.
- **Goals:** Auto-reconcile OTA payouts (MMT/Goibibo pay net amount after 15–30 days). Generate GST invoices with correct SAC codes (996311 for accommodation). Track TCS on foreign guest bills.
- **Pain Points:** Manual reconciliation of OTA statements (PDFs/Excel) takes 3 days per month. Mismatch between folio total and bank receipt is common. When an OTA's API is down, bookings arrive by email and get typed in manually — errors slip in.
- **Success Criteria:** Auto-mapped OTA payout reconciliation, GSTR-1 ready export, Tally integration. A safety net that catches OTA bookings even when the direct sync fails, instead of relying on manual re-entry.

### Persona 4: Sneha — Multi-Property Admin (Small Chain)
- **Profile:** 28-year-old, operations manager for a 4-property budget chain across Rajasthan.
- **Goals:** Centralized rate and inventory control. Compare RevPAR across properties. Standardize guest experience.
- **Pain Points:** Logs into 4 different systems. Can't push rate changes across all properties + OTAs simultaneously. Has no visibility into how much commission she's paying local taxi drivers and travel agents who bring walk-ins — it's tracked on paper per property, if at all.
- **Success Criteria:** Single login, bulk rate update, cross-property guest history lookup, a shared view of local agent/referral commissions across all 4 properties.

### Persona 5: The Guest — Domestic Traveler / Foreign Tourist
- **Profile:** Books on phone, expects instant WhatsApp confirmation, wants UPI payment option, digital check-in to avoid front desk queues.
- **Goals:** Book in 3 clicks, pay via UPI/Google Pay, receive digital room key/QR code, communicate on WhatsApp for late check-in or extra towels.
- **Pain Points:** OTA booking confirmations are generic. Hotel doesn't respond to calls. Has to fill physical registration form and show physical ID at check-in. Wants to shift dates or add a night but has to call and wait, or can't reach anyone at all.
- **Success Criteria:** Direct booking with UPI, WhatsApp-based communication, digital KYC upload before arrival, and the ability to modify or extend a stay without a phone call.

---

## 3. Market & Competitive Analysis

### Competitor Landscape

| Competitor | Strengths | Weaknesses (Our Opportunity) |
|------------|-----------|------------------------------|
| **Codingclave HMS** | Indian-built, GST billing, MMT/Goibibo connect, affordable | UI feels dated (2015-era), no modern booking engine, limited WhatsApp automation, no housekeeping module, mobile experience poor |
| **eZee Absolute** | Mature product, strong OTA connectivity, global presence | Expensive for small hotels (₹1.5L+/year), not GST-native (retrofitted), complex UI, poor UPI integration, support is offshore |
| **Hotelogix** | Cloud PMS, good reporting, established brand | Pricing opaque, steep learning curve, Indian OTA integrations weaker than Booking.com/Expedia, limited WhatsApp |
| **RezLive / AxisRooms** | Strong channel manager, good OTA connections | PMS is weak — primarily a CM, not an all-in-one. Billing is basic. No GST depth. |
| **Hotelogix / DJUBO** | Booking engine + CM combo | DJUBO's PMS is lightweight; not suitable for 50+ room operations. Pricing model confusing. |
| **MS Excel + Manual** | Free, no learning curve | Revenue leakage, double bookings, zero analytics, GST nightmare |
| **Cloudbeds / other global cloud PMS entrants** | Polished UI, strong global OTA connectivity, well-funded | Priced in USD (expensive after conversion), no GST-native billing, no WhatsApp-first design, support in non-Indian time zones |

### Market Gaps to Exploit
1. **WhatsApp-native operations** — No competitor treats WhatsApp as the *primary* interface for guest communication, booking confirmations, check-in links, and feedback. India has 500M+ WhatsApp users.
2. **UPI-first payment architecture** — Competitors bolt UPI on top of card-first designs. We design for UPI, then add cards.
3. **True GST automation** — Not just "GST invoice" but auto-SAC mapping, HSN/SAC validation, GSTR-1 JSON export, e-invoice QR generation, and TCS handling for foreign guests.
4. **Mobile-first front desk** — Front desk staff in Indian budget hotels don't sit at a desktop all day. They need a tablet/phone-optimized interface.
5. **Affordable multi-property** — Chains with 3–10 properties are priced out by eZee/Hotelogix. We offer per-room pricing that scales down for small properties.
6. **On-premise option** — Many Tier-2 hotel owners distrust "cloud" due to data paranoia or poor internet. Hybrid cloud + local server option wins trust.
7. **Zero-fear switching** — No competitor treats data migration as a first-class product feature. A self-serve Excel/legacy-PMS importer with a visible "everything moved, nothing lost" confirmation turns the single biggest adoption blocker into a selling point.
8. **Lead-leakage recovery** — Nobody in this category tracks or recovers missed calls and abandoned bookings as a revenue channel; hotels don't even measure this loss today.

---

## 4. Core Features (MVP)

### Module A: Front Desk & Reservations

| Feature | Description | Priority |
|---------|-------------|----------|
| **Interactive Booking Calendar** | Drag-and-drop calendar with color-coded status (available, occupied, check-in today, check-out today, blocked, maintenance). Day/Week/Month views. | P0 |
| **Walk-in Reservations** | One-click walk-in booking with auto-suggest room allocation based on guest count + preference. | P0 |
| **Room Allocation Engine** | Smart room assignment based on room type, floor preference, smoking/non-smoking, adjoining rooms, and housekeeping status. | P0 |
| **Guest Profile & History** | CRM-lite: name, phone, email, ID details, past stays, preferences, special requests, blacklist flag. | P0 |
| **Group Bookings** | Block multiple rooms, split folio across rooms, group master billing. | P1 |
| **Waitlist & Overbooking Control** | Configurable overbooking limits by room type. Auto-waitlist with WhatsApp notification when room frees up. | P1 |
| **Digital KYC / e-Check-in** | Guest uploads ID (Aadhaar/passport) via WhatsApp link before arrival. Auto-populates registration form. Generates C-form alert for foreign nationals. | P0 |

### Module B: Channel Manager (OTA Sync)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Two-way API Sync** | Real-time inventory and rate push/pull with: **MakeMyTrip, Goibibo, Yatra, Booking.com, Airbnb, Agoda, Expedia**. | P0 |
| **Centralized Rate Management** | Base rate + OTA-specific markups/differentials. Bulk rate updates across all channels or selected channels. | P0 |
| **Stop-Sell & Min LOS** | Channel-specific stop-sell, minimum length of stay, and close-to-arrival controls. | P0 |
| **Auto-mapping** | Room type mapping wizard to align PMS room types with OTA room type codes. | P0 |
| **OTA Modification Handling** | Auto-ingest OTA booking modifications, cancellations, and no-shows. Update PMS calendar in real-time. | P0 |
| **Channel-level Reporting** | Revenue, bookings, ADR, commission paid per OTA. Identify most expensive channel. | P1 |
| **Rate Parity Alerts** | Flag if direct website rate > OTA rate (or vice versa based on strategy). | P2 |
| **Manual Booking Import Fallback** | When a direct OTA API is unavailable (negotiation pending) or temporarily down, staff forward the OTA confirmation email/PDF; OCR extracts guest name, dates, room type, and rate and creates a draft reservation for one-tap confirmation — instead of manual re-typing. | P1 |
| **Sync Failure Alerting** | If any channel's inventory push fails or lags beyond threshold, alert the property manager immediately (not just log it silently) so a stop-sell can be applied manually before an overbooking happens. | P0 |

### Module C: Direct Booking Engine

| Feature | Description | Priority |
|---------|-------------|----------|
| **White-label Booking Widget** | Embeddable iframe/widget for hotel websites. Mobile-optimized, loads in <2s. | P0 |
| **Promo Code & Package Engine** | Create seasonal promos, early bird, last-minute deals, package add-ons (breakfast, airport transfer). | P0 |
| **UPI + Card + PayLater** | Razorpay/Cashfree integration: UPI (intent + QR), credit/debit cards, net banking, Paytm/PhonePe, Buy Now Pay Later (Simpl, Lazypay). | P0 |
| **Partial Payment / Deposit** | Configurable advance payment % for direct bookings (e.g., 50% to confirm). | P1 |
| **Auto-confirmation** | Instant booking confirmation via WhatsApp + email with property details, map link, and digital check-in URL. | P0 |
| **Abandoned Cart Recovery** | If guest starts booking but doesn't pay, auto WhatsApp reminder after 30 mins. | P2 |

### Module D: Billing & Invoicing (GST-Native)

| Feature | Description | Priority |
|---------|-------------|----------|
| **GST-Compliant Folio** | Auto-calculation of CGST + SGST (intra-state) or IGST (inter-state) at 12% or 18% based on room tariff threshold (₹1,000–₹7,500 = 12%; >₹7,500 = 18%). SAC code 996311 auto-tagged. | P0 |
| **Split Billing** | Split folio by room, by guest, by payment mode, by date range. Corporate billing with credit limit tracking. | P0 |
| **e-Invoice Generation** | Generate IRN (Invoice Reference Number) via GST Suvidha Provider integration for B2B invoices >₹50,000. QR code on invoice. | P1 |
| **TCS for Foreign Guests** | Auto-calculation of 5% TCS on foreign remittances where applicable. | P1 |
| **Credit Note / Refund** | Full or partial refund with auto GST adjustment and reversal entry. | P0 |
| **POS Integration** | F&B, laundry, spa charges posted to room folio from POS system. | P1 |
| **GSTR-1 Export** | Monthly JSON/Excel export ready for GST portal upload. Summary + itemized. | P0 |
| **Tally Prime Integration** | One-click sync of daily revenue, guest ledger, and tax summaries to Tally. | P1 |

### Module E: Payments & Reconciliation

| Feature | Description | Priority |
|---------|-------------|----------|
| **UPI Deep Link + QR** | Generate dynamic UPI intent links and static/dynamic QR codes per folio. Guest scans and pays. Auto-reconciliation. | P0 |
| **Payment Gateway** | Razorpay / Cashfree / PayU native integration. Split payments (part UPI, part card). | P0 |
| **OTA Payout Reconciliation** | Upload OTA payout statements (MMT/Goibibo monthly PDF/Excel). Auto-match against bookings, flag discrepancies (commission mismatch, cancellations not refunded). | P1 |
| **Cash Register** | Track cash-in-hand, petty cash, shift-wise cash handover. | P0 |
| **Auto-settlement** | Auto-transfer daily collections to hotel bank account (T+1 or T+2). | P2 |

### Module F: Guest Communication (WhatsApp-First)

| Feature | Description | Priority |
|---------|-------------|----------|
| **WhatsApp Business API** | Official WABA integration (via Twilio / Gupshup / ValueFirst). Template messages for: booking confirmation, pre-arrival reminder, digital KYC link, check-in instructions, feedback request. | P0 |
| **Two-way Chat** | Front desk can reply to guest WhatsApp messages from within PMS inbox. Auto-assign to staff member. | P0 |
| **SMS Fallback** | If WhatsApp not delivered within 5 mins, auto-fallback to SMS via Exotel / MSG91. | P1 |
| **Email Templates** | Branded HTML emails for booking confirmation, invoice, and post-stay feedback. | P1 |
| **Automated Guest Journey** | Pre-arrival (day -1): Check-in link. During stay (day +0): WiFi password, F&B menu. Post-stay (day +1): Review request + 10% off next direct booking. | P1 |
| **Review Aggregation** | Collect Google Reviews / TripAdvisor via WhatsApp deep link. Track review scores. | P2 |
| **Missed Call Lead Recovery** | Detect missed/unanswered calls to the hotel's listed number (via click-to-call tracking number) and auto-send a WhatsApp message within 2 minutes with a direct booking link and a callback option. | P0 |
| **Abandoned Booking Recovery** | If a guest starts the direct booking flow but doesn't complete payment, send a WhatsApp nudge after 30 minutes and a second after 24 hours with a small time-bound incentive. | P1 |

### Module G: Housekeeping & Operations

| Feature | Description | Priority |
|---------|-------------|----------|
| **Room Status Tracking** | Dirty → Cleaning → Inspected → Ready. Updated via housekeeping staff mobile view. | P0 |
| **Task Assignment** | Assign rooms to housekeeping staff. Track time taken per room. | P1 |
| **Maintenance Alerts** | Mark room under maintenance with reason (AC issue, plumbing, etc.). Auto-block from sales. | P0 |
| **Amenity Tracking** | Track minibar consumption, linen change schedule, lost & found. | P2 |

### Module H: Multi-Property Dashboard & Reporting

| Feature | Description | Priority |
|---------|-------------|----------|
| **Centralized Dashboard** | Group-level view: total occupancy, RevPAR, ADR, revenue by property, OTA mix %. | P0 |
| **Role-based Access** | Super Admin (all properties), Property Manager (one property), Front Desk (reservations only), Accountant (reports only), Housekeeping (ops only). | P0 |
| **Standard Reports** | Daily revenue report, Night audit report, Guest arrival/departure list, OTA commission report, GST summary, Manager's report. | P0 |
| **Custom Report Builder** | Drag-and-drop report builder with filters (date range, room type, channel, guest nationality). Export to PDF/Excel. | P1 |
| **Audit Trail** | Log every rate change, booking modification, refund, and user login. Immutable. | P0 |
| **Revenue Leakage & Anomaly Alerts** | Flag unusual patterns automatically: refund spikes, a staff member repeatedly discounting rates, occupancy drop vs. same period last year, or a room sitting unsold for 3+ days with no reason logged. | P1 |

### Module I: User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | All properties, billing settings, user management, API keys, data export |
| **Property Manager** | Single property full access: rates, inventory, reports, staff management |
| **Front Desk Agent** | Reservations, check-in/out, guest communication, room status view |
| **Accountant** | View-only folios, billing reports, GST export, reconciliation |
| **Housekeeping Supervisor** | Room status updates, task assignment, maintenance alerts |
| **Housekeeping Staff** | Mark room clean/inspected (mobile-only view) |

---

### Module J: Zero-Fear Onboarding & Data Migration

*Directly targets the #1 adoption blocker: fear of losing data when switching from Excel or a legacy PMS.*

| Feature | Description | Priority |
|---------|-------------|----------|
| **Self-Serve Excel/CSV Importer** | Guided wizard maps common Excel column layouts (booking sheet, guest register) to StayGrid fields with a preview step before committing. Handles the messy real-world formats Indian hotels actually use, not just a clean template. | P0 |
| **Legacy PMS Export Assist** | Pre-built parsers for the most common outgoing systems (Codingclave, eZee, DJUBO exports) to shortcut migration for switchers. | P1 |
| **"Nothing Lost" Migration Report** | After import, an itemized report showing exactly what was migrated (bookings, guest profiles, historical revenue) vs. flagged for manual review, so the owner can verify before going live. | P0 |
| **Parallel-Run Mode** | Hotel can run StayGrid alongside their existing system for up to 14 days with one-way sync from old to new, so staff build trust before fully cutting over. | P1 |
| **White-Glove Onboarding Call** | Guided 60-minute video/phone setup session for the first 90 days of any paid plan, in Hindi or English. | P0 |

### Module K: Offline-First Resilience

*Directly targets unreliable Tier-2/3 internet — a hard blocker, not a nice-to-have, since a front desk that can't check guests in during an outage will abandon the software.*

| Feature | Description | Priority |
|---------|-------------|----------|
| **Offline Check-in/Check-out** | Core front-desk actions (check-in, check-out, room status, folio charges) work from local cache during an internet outage and queue for sync. | P0 |
| **Conflict-Safe Sync** | When connectivity returns, queued actions reconcile against the server with clear conflict resolution rules (e.g., last-confirmed-write wins for room status; flagged for manual review if two devices tried to assign the same room). | P0 |
| **Offline Payment Recording** | Cash and manually-keyed card payments can be logged offline and reconciled once online; UPI/gateway payments queue for verification. | P1 |
| **Low-Bandwidth Mode** | Lightweight interface variant (no images, minimal payload) auto-triggers on detected 2G/3G speeds. | P2 |

### Module L: Smart Pricing Assistant (Lite RMS for MVP)

*A full Revenue Management System is scoped for Phase 2 (Section 5), but owners need pricing help from day one — this is a lightweight, rules-based version that ships with MVP rather than making them wait 12+ months.*

| Feature | Description | Priority |
|---------|-------------|----------|
| **Demand-Based Rate Suggestions** | Based on the property's own historical occupancy pattern, day-of-week trends, and a curated calendar of regional festivals/events, suggest a rate range with one-tap apply (not automatic — owner stays in control). | P1 |
| **Competitor Rate Snapshot** | Manually-added or scraped public rate reference for 2–3 nearby properties the owner selects, shown alongside the suggestion for context. | P2 |
| **Low-Occupancy Alert** | If a date range is trending well below the property's typical booking pace, flag it early enough to act (promo, rate drop) instead of discovering it the week of. | P1 |

### Module M: Local Distribution & Lead Recovery

*Targets revenue leakage from missed calls (Module F) and the informal local-agent channel that most small hotels track on paper or not at all.*

| Feature | Description | Priority |
|---------|-------------|----------|
| **Local Agent / Referral Tracking** | Register local taxi drivers, tour operators, and walk-in referral sources with a trackable code or link; auto-calculate commission owed per booking for easy monthly payout and cross-property visibility (ties into Sneha's multi-property view). | P1 |
| **Call Tracking Number** | Optional virtual number that forwards to the front desk, enabling missed-call detection (feeds Module F's recovery automation) and call-source attribution for marketing spend. | P1 |
| **QR Code Walk-in Capture** | Physical QR code at reception/signage lets walk-in guests self-register interest even if front desk is busy, triggering a WhatsApp follow-up. | P2 |

### Module N: Guest Self-Service Portal

*Reduces front-desk interruptions and gives the guest control without a phone call — a direct fix for Persona 5's biggest frustration.*

| Feature | Description | Priority |
|---------|-------------|----------|
| **Self-Service Modification** | Guest can request date changes, extra nights, or cancellation directly via the WhatsApp confirmation link, subject to the hotel's configured policy (auto-approved within rules, else routed to front desk). | P1 |
| **Digital Folio & Bill Preview** | Guest can view a running bill during their stay via WhatsApp/link, reducing checkout-time disputes. | P1 |
| **Early/Late Checkout Request** | One-tap request via WhatsApp, auto-checked against room availability before confirming. | P2 |

---

## 5. Nice-to-Have / Phase 2 Features

| Feature | Business Case | Timeline |
|---------|---------------|----------|
| **Full Revenue Management System (RMS)** | Automated dynamic pricing (not just suggestions) with ML-based demand forecasting; evolves from the MVP's Smart Pricing Assistant (Module L) once enough historical data exists across properties | Q3 2027 |
| **Restaurant POS (F&B)** | Table management, KOT (Kitchen Order Ticket), split bills, room charge posting | Q2 2027 |
| **Banquet & Event Management** | Banquet hall booking, BEO (Banquet Event Order), catering menu, multi-stage billing | Q4 2027 |
| **Loyalty & CRM** | Points-based loyalty for direct bookings, birthday/anniversary auto-offers | Q3 2027 |
| **AI Chatbot** | WhatsApp chatbot for booking queries, FAQ, and modification requests | Q2 2027 |
| **OTA Meta-search Integration** | Google Hotel Ads, TripAdvisor connectivity for direct booking push | Q3 2027 |
| **Staff Attendance & Payroll** | Biometric integration, shift roster, auto-payroll calculation | Q4 2027 |
| **Guest App (PWA)** | Digital key, room service ordering, chat with front desk | Q1 2028 |

---

## 6. Non-Functional Requirements

| Category | Requirement | Rationale |
|----------|-------------|-----------|
| **Scalability** | Support 1,000+ properties, 50,000+ rooms, 100,000+ daily transactions on single tenant cluster | Indian market has 50,000+ addressable properties |
| **Uptime / Availability** | 99.95% SLA for cloud; 99.9% for on-premise with auto-failover to local mode | Hotels operate 24/7; downtime = lost revenue + angry guests |
| **Data Residency** | All guest data, PII, and financial data stored in **India-only** (AWS Mumbai / Azure Pune / GCP Mumbai) | IT Act 2000, PDP Bill compliance, hotel owner trust |
| **Security** | PCI-DSS Level 1 compliant payment handling (tokenization, no card data stored), AES-256 encryption at rest, TLS 1.3 in transit, RBAC, 2FA for admins | Payment data is highest risk vector |
| **Multi-tenancy** | True multi-tenant SaaS with tenant isolation at database row-level + separate schema option for enterprise chains | Cost efficiency + data isolation for chains |
| **Performance** | Page load <2s for core flows (calendar, check-in, billing). Mobile app response <1s. | Front desk staff are impatient; slow software = workarounds |
| **Backup & DR** | Automated hourly backups, 30-day point-in-time recovery, cross-region DR in secondary Indian region | GST data cannot be lost; business continuity |
| **Compliance** | GST Suvidha Provider integration, e-invoice compliant, FEMA (foreign exchange) for foreign guest billing, police verification C-form auto-generation | Regulatory non-compliance = fines + jail risk for owners |
| **Offline Capability** | On-premise deployment must function without internet for 72 hours; sync when connection resumes | Tier-2/3 India has unreliable broadband |
| **Localization** | UI in English + Hindi + Tamil + Bengali. Date format DD-MM-YYYY. Currency INR (₹). Number format Indian numbering system (lakhs, crores). | Mass market adoption requires local language |
| **Audit & Logs** | Immutable audit logs retained for 7 years. User action logging (who changed what rate when). | GST audit trail requirement |

### Reliability & Data Integrity Engineering

*A channel manager that double-books a room during peak season loses a customer permanently — these requirements exist to make that structurally unlikely, not just "handled in support."*

| Category | Requirement | Rationale |
|----------|-------------|-----------|
| **Idempotent OTA Sync** | Every inventory/rate push and webhook carries an idempotency key; retries after timeout never create duplicate bookings or double-apply a rate change. | Network flakiness + OTA API retries are routine, not edge cases |
| **Booking Conflict Resolution** | Explicit, documented rule set for what happens when two channels try to book the last room simultaneously (e.g., first-confirmed-wins, auto-waitlist the loser, instant guest notification with alternate room/refund path). | Ambiguity here is where double-bookings actually happen |
| **Webhook Retry & Backoff** | Exponential backoff with dead-letter queue for failed OTA/WhatsApp/payment webhooks; alerting after N failed attempts rather than silent drops. | Silent failures are worse than visible ones |
| **API Rate Limiting & Throttling** | Per-tenant and per-OTA rate limits to prevent one property's sync storm from degrading others (noisy-neighbor protection in multi-tenant architecture). | Protects platform-wide reliability as tenant count scales |
| **Staging/Sandbox Environment** | Full sandbox mirroring production for OTA integration testing before any channel goes live for a real property. | OTA certification requires this; also catches regressions pre-release |
| **Load Testing Cadence** | Quarterly load tests simulating peak season (e.g., Diwali/Christmas booking surge) at 3x current peak traffic. | Failure at exactly the highest-revenue moment is the worst-case scenario |
| **Chaos/Failure Drills** | Scheduled drills simulating OTA API outage, payment gateway downtime, and database failover to validate real recovery behavior, not just documented plans. | Untested DR plans routinely fail when actually needed |
| **RTO / RPO Targets** | Recovery Time Objective <1 hour, Recovery Point Objective <15 minutes for the core booking database. | Concrete, testable commitments beyond "we have backups" |
| **Security Audit Cadence** | Annual third-party penetration test; quarterly automated dependency/vulnerability scanning. | Payment + PII data demands ongoing verification, not a one-time PCI check |

---

## 7. Tech Stack Recommendation

### Frontend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Web App** | React 18 + TypeScript + Tailwind CSS | Component reusability, strong typing, rapid UI development, mobile-responsive by default |
| **State Management** | Zustand + React Query (TanStack Query) | Lightweight, excellent server-state caching for calendar/booking data |
| **Mobile Front Desk** | React Native OR PWA (Capacitor) | Front desk staff use Android tablets; PWA reduces app store friction |
| **Booking Engine** | Next.js 14 (SSR) | SEO-critical for direct bookings; fast initial load; embeddable widget architecture |

### Backend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **API Server** | Node.js (NestJS) + TypeScript | Fast I/O for real-time calendar updates, strong enterprise patterns, large Indian dev talent pool |
| **Real-time** | Socket.io (WebSockets) | Live calendar updates across devices, OTA sync notifications |
| **Queue / Background Jobs** | BullMQ (Redis-backed) | OTA sync jobs, WhatsApp message queuing, report generation, GST export |
| **Cache** | Redis Cluster | Session store, rate cache, availability calendar cache |
| **Search** | Elasticsearch | Guest search, booking lookup, fast filtering in large datasets |

### Database
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Primary DB** | PostgreSQL 15 (RDS / Cloud SQL / self-managed) | ACID compliance for financial data, excellent JSON support for flexible OTA metadata, mature Indian hosting support |
| **Read Replicas** | 2x async read replicas | Report queries don't slow down transactional writes |
| **Time-series / Analytics** | ClickHouse OR TimescaleDB | Occupancy trends, revenue analytics, fast aggregation over millions of rows |
| **File Storage** | AWS S3 (Mumbai region) + CDN | Guest ID documents, invoice PDFs, e-invoice QR codes |

### Hosting & DevOps
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Cloud** | AWS India (Mumbai) primary, AWS Hyderabad DR | Data residency, lowest latency for Indian users, compliance |
| **Containers** | Docker + Kubernetes (EKS) | Scalable microservices, blue-green deployments |
| **CI/CD** | GitHub Actions | Standard, cost-effective |
| **Monitoring** | Datadog / New Relic + PagerDuty | Uptime critical for hospitality |
| **On-premise Option** | Docker Compose on local Ubuntu server + Tailscale VPN for support access | Tier-2 hotel requirement; air-gapped possible |

### Third-Party APIs & Integrations

| Service | Provider Options | Purpose |
|---------|-----------------|---------|
| **Payment Gateway** | Razorpay (primary), Cashfree (backup), PayU | UPI, cards, net banking, settlements |
| **WhatsApp Business** | Gupshup / ValueFirst / Twilio (India) | Guest communication, templates, two-way chat |
| **SMS** | MSG91 / Exotel / Twilio | Fallback OTP, booking alerts |
| **OTA Connectivity** | AxisRooms API / Staah API / Direct OTA APIs | MMT, Goibibo, Yatra, Booking.com, Airbnb |
| **GST / E-invoice** | ClearTax / Cygnet / Masters India (GSP) | IRN generation, e-invoice QR, GSTR filing |
| **Email** | SendGrid / Amazon SES | Transactional emails |
| **Maps** | Google Maps API | Property location, directions in confirmation |
| **KYC Verification** | HyperVerge / IDfy | Aadhaar offline verification, passport MRZ scan |
| **Accounting** | Tally Prime API | Bi-directional sync |
| **OCR / Document Parsing** | AWS Textract / Google Document AI | Manual OTA booking import fallback (Module B), Excel migration parsing (Module J) |
| **Telephony / Call Tracking** | Exotel / Knowlarity | Missed-call detection and click-to-call tracking numbers (Modules F, M) |
| **Feature Flags** | Unleash (self-hosted) / LaunchDarkly | Safe rollout of new modules per tenant tier without full redeploys; instant kill-switch if an OTA integration misbehaves |

---

## 8. Monetization Model

### Pricing Strategy: **Hybrid SaaS with On-Premise Upsell**

| Tier | Target | Pricing (INR) | Includes |
|------|--------|---------------|----------|
| **Starter** | Homestays, B&Bs, 1–10 rooms | ₹999/month or ₹9,999/year | Front desk, basic booking engine, WhatsApp (100 msgs/mo), UPI payments, single user |
| **Professional** | Independent hotels, 11–50 rooms | ₹2,499/month or ₹24,999/year | + Channel Manager (5 OTAs), GST billing, multi-user (5), housekeeping, reports |
| **Business** | Mid-size hotels, 51–100 rooms | ₹4,999/month or ₹49,999/year | + All OTAs, unlimited WhatsApp, multi-property (up to 3), accountant access, API access |
| **Enterprise** | Chains, 101–200+ rooms | Custom (₹8,000–₹15,000/month) | Unlimited properties, on-premise option, dedicated account manager, custom integrations, SLA |
| **One-Time License** | Hotels wanting perpetual license | ₹1.5L–₹5L one-time + 18% AMC/year | On-premise deployment, lifetime license, 1-year support included |

### Additional Revenue Streams
- **WhatsApp message overage:** ₹0.50/message beyond plan limit
- **OTA commission savings share:** Optional "growth" plan where we charge 1% of direct booking revenue generated via our booking engine
- **Setup & Training:** ₹5,000–₹25,000 one-time onboarding (data migration, staff training, OTA mapping)
- **Hardware:** Optional tablet + thermal printer + UPI soundbox bundle (reseller margin)

---

## 9. Success Metrics / KPIs

### Product Metrics
| Metric | Target (M6) | Target (M12) |
|--------|-------------|--------------|
| **Monthly Active Properties** | 100 | 500 |
| **Average Rooms per Property** | 25 | 30 |
| **Daily Active Users (front desk)** | 300 | 1,500 |
| **OTA Sync Latency** | <60 seconds | <30 seconds |
| **Booking Engine Uptime** | 99.9% | 99.95% |
| **Check-in Time (walk-in)** | <3 minutes | <2 minutes |
| **Guest WhatsApp Delivery Rate** | 95% | 98% |
| **Missed-Call-to-Booking Recovery Rate** | 8% | 15% |
| **Abandoned Booking Recovery Rate** | 10% | 18% |
| **Excel/Legacy Migration Time (median)** | <4 hours | <2 hours |
| **Migration Data-Loss Incidents** | 0 | 0 |
| **Rate Suggestion Adoption Rate** | 25% | 45% |

### Business Metrics
| Metric | Target (M6) | Target (M12) |
|--------|-------------|--------------|
| **MRR (Monthly Recurring Revenue)** | ₹5L | ₹25L |
| **Churn Rate (monthly)** | <5% | <3% |
| **Net Revenue Retention** | 100% | 110% |
| **Direct Booking % (vs OTA)** for customers | 15% → 25% | 15% → 35% |
| **GST Filing Time** | 3 days → 30 mins | 3 days → 15 mins |
| **Customer Acquisition Cost** | ₹8,000 | ₹5,000 |
| **LTV:CAC Ratio** | >3:1 | >5:1 |

### North Star Metric
**"Revenue Under Management" (RUM)** — Total booking value processed through the platform. Target: ₹10 Cr RUM by Month 12.

---

## 10. Rollout Plan

### Phase 0: Foundation (Months 1–2)
- Finalize architecture and database schema
- Set up AWS Mumbai infrastructure
- Integrate Razorpay + WhatsApp Business API (sandbox)
- Build core booking calendar + guest profile

### Phase 1: MVP — "Front Desk & Billing" (Months 3–5)
- Front desk: calendar, walk-in, check-in/out, guest profile
- Billing: GST-compliant folio, split billing, UPI payments, invoice PDF
- Basic WhatsApp: booking confirmation template
- **Excel/CSV migration wizard + "Nothing Lost" report** — ship with MVP, not later, since it's the adoption unlock, not a polish item
- **Offline check-in/check-out with sync queue** — non-negotiable for Tier-2/3 reliability
- **Missed Call Lead Recovery** — high-leverage, low-engineering-cost win for early beta credibility
- **Beta target:** 5 hotels in Jaipur/Goa (friends/family network)

### Phase 2: Channel Manager & Booking Engine (Months 6–8)
- OTA two-way sync: MMT, Goibibo, Yatra (via AxisRooms/Staah middleware if direct APIs delayed)
- **Manual booking import fallback (OCR)** — ships alongside sync, not after, so gaps in Phase 2 API coverage don't force manual re-entry
- Direct booking engine widget + Abandoned Booking Recovery
- Rate management + stop-sell + Smart Pricing Assistant (lite)
- **Beta target:** 20 properties, measure OTA sync accuracy and idempotent-sync failure rate

### Phase 3: Operations & Scale (Months 9–11)
- Housekeeping module
- Multi-property dashboard + Local Agent/Referral Tracking
- Role-based access
- Advanced reporting + GSTR-1 export + Revenue Leakage & Anomaly Alerts
- Guest Self-Service Portal (modifications, digital folio)
- First quarterly load test + chaos drill
- **Launch target:** 100 paying properties

### Phase 4: Polish & Enterprise (Months 12–14)
- Mobile-optimized front desk app
- Tally integration
- On-premise deployment option
- Legacy PMS export parsers (Codingclave, eZee, DJUBO) for competitive-switch campaigns
- Enterprise sales motion for small chains
- First third-party penetration test
- **Target:** 500 properties, ₹25L MRR

### Beta Customer Strategy
1. **"Design Partners"** — 5 hotels that get free lifetime usage in exchange for weekly feedback calls and allowing us to shadow their staff.
2. **"Early Adopter Discount"** — First 50 customers get 50% off first year + free onboarding.
3. **"Referral Loop"** — Hotel owners know each other. Offer 1 free month for every successful referral.
4. **"OTA Co-marketing"** — Partner with MakeMyTrip/Goibibo account managers who visit hotels; they refer us as "recommended PMS" for commission savings.

---

## 11. Risks & Open Questions

### High Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **OTA API Access Denial** | Medium | Critical | Build via AxisRooms/Staah as middleware backup; direct API negotiations take 6–12 months |
| **GST Regulation Changes** | High | High | Build flexible tax engine (configurable rates, SAC codes); hire GST consultant as advisor |
| **Internet Reliability in Tier-3** | High | Medium | Invest heavily in on-premise option; offline-first PWA design |
| **Competitor Price War** | Medium | Medium | Differentiate on WhatsApp + UPI + mobile experience, not just price; land-and-expand model |
| **Data Security Breach (Payment)** | Low | Critical | Never store card data; use Razorpay tokenization; annual PCI audit |
| **Founding Team Attrition** | Low | High | Document architecture decisions; bus factor >1 for all critical systems |
| **OCR Extraction Errors (Booking Import)** | Medium | Medium | Always require one-tap human confirmation before a draft reservation goes live; never auto-commit OCR output directly to the calendar |
| **Missed-Call/Telephony Regulatory Compliance** | Low | Medium | Confirm TRAI/DND consent requirements before enabling call-tracking numbers; opt-in consent captured at booking |
| **Migration Data Corruption** | Low | Critical | Migration always writes to a staging area first; owner must explicitly approve the "Nothing Lost" report before go-live; original Excel/legacy data untouched |

### Open Questions
1. **Should we build our own channel manager or white-label AxisRooms/Staah?** Building takes 12+ months; white-labeling reduces margin but accelerates time-to-market. **Decision needed by Month 2.**
2. **WhatsApp Business API provider:** Gupshup (Indian, cheaper) vs. Twilio (global, reliable). Pricing and template approval speed vary.
3. **On-premise container strategy:** Docker Swarm (simpler for non-technical hotel IT) vs. K3s (Kubernetes light)?
4. **Payment settlement flow:** Should we aggregate payments in our Razorpay account and settle to hotels, or have hotels create their own Razorpay sub-merchant accounts? (Regulatory + trust implications)
5. **Police verification / C-form automation:** Can we integrate directly with state police portals (varies by state: Gujarat has API, Rajasthan is manual)? Scope for Phase 2?
6. **e-Invoice threshold:** Current threshold is ₹50,000 for B2B. If reduced to ₹20,000, engineering load increases. Monitor GST council decisions.

---

## Appendix A: Glossary
- **PMS:** Property Management System
- **CM:** Channel Manager
- **OTA:** Online Travel Agency (MakeMyTrip, Goibibo, etc.)
- **RMS:** Revenue Management System
- **RevPAR:** Revenue Per Available Room
- **ADR:** Average Daily Rate
- **LOS:** Length of Stay
- **Folio:** Guest bill/ledger
- **GSTR-1:** Monthly outward supply return under GST
- **SAC:** Service Accounting Code
- **IRN:** Invoice Reference Number (for e-invoicing)
- **TCS:** Tax Collected at Source
- **C-form:** Foreigner registration form submitted to police
- **OCR:** Optical Character Recognition — extracting text/data from scanned documents or images
- **Idempotency:** A property where retrying the same operation multiple times has the same effect as doing it once (prevents duplicate bookings on retry)
- **RTO / RPO:** Recovery Time Objective / Recovery Point Objective — how fast systems recover and how much data (by time) could be lost in a failure
- **Chaos Testing:** Deliberately simulating failures (e.g., an OTA API outage) in a controlled way to verify recovery actually works

---

## Appendix B: Pain-Point → Feature Traceability Matrix

*Every major pain point named in Sections 1–2 should map to a specific, buildable feature. Gaps in this table are gaps in the product.*

| Pain Point | Persona(s) | Feature(s) | Module |
|------------|-----------|------------|--------|
| Double-bookings from manual OTA management | Rajesh, Priya | Two-way API Sync, Idempotent OTA Sync, Booking Conflict Resolution | B, NFR |
| 2-hour morning routine across systems | Rajesh | Centralized Dashboard, Centralized Rate Management | H, B |
| Guessing on pricing | Rajesh | Smart Pricing Assistant (Demand-Based Rate Suggestions, Low-Occupancy Alert) | L |
| Fear of losing data when switching | Rajesh, Amit | Self-Serve Excel/CSV Importer, "Nothing Lost" Migration Report, Parallel-Run Mode | J |
| System crashes / no internet during rush | Priya | Offline Check-in/Check-out, Conflict-Safe Sync | K |
| Missed calls = lost bookings | Priya, Sneha | Missed Call Lead Recovery, Call Tracking Number | F, M |
| Manual OTA reconciliation takes 3 days | Amit | OTA Payout Reconciliation, GSTR-1 Export | E, D |
| OTA API not yet live / goes down | Amit | Manual Booking Import Fallback (OCR), Sync Failure Alerting | B |
| No visibility into local agent commissions | Sneha | Local Agent / Referral Tracking | M |
| Logging into 4 separate systems | Sneha | Centralized Dashboard, Role-based Access | H |
| Generic OTA confirmations, no direct line to hotel | Guest | WhatsApp Auto-confirmation, Two-way Chat | C, F |
| Physical registration + ID at check-in | Guest | Digital KYC / e-Check-in | A |
| Can't modify a booking without calling | Guest | Self-Service Modification, Early/Late Checkout Request | N |
| Abandoned booking mid-payment | Guest, Rajesh | Abandoned Booking Recovery | F |
| Revenue leakage nobody notices | Rajesh, Sneha | Revenue Leakage & Anomaly Alerts | H |

---

**Document Owner:** Product Lead, StayGrid India  
**Review Cycle:** Monthly during MVP; Quarterly post-launch  
**Next Review Date:** September 30, 2026

---

*This PRD is a living document. All features marked P0 are non-negotiable for MVP launch. P1 features are prioritized for immediate post-launch sprints. P2 features are Phase 2 candidates contingent on customer feedback and engineering bandwidth. v1.1 additions (Modules J–N, Reliability & Data Integrity Engineering, Appendix B) reflect a pain-point-first pass over v1.0 and should be re-validated against real design-partner feedback once Phase 0 beta hotels are onboarded.*
