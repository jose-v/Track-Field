# Refined Pricing Structure Concept

## Core Principles

### Simplicity & Transparency
Easy-to-understand tiers with clear value. No hidden fees or complex credit systems for AI usage.

### Value-Based
Pricing reflects the features and benefits provided, especially the integrated AI assistance.

### Scalability
Tiers cater to individuals, growing coaches, and larger teams/organizations.

### AI as an Integrated Benefit
AI features are part of the value proposition of each tier, with more advanced/comprehensive AI capabilities unlocked at higher tiers.

---

## Tier 1: Athlete (Unattached)

**Target User:** Individual athletes training independently (not currently managed by a coach on the platform).

**Core Value Proposition:** Access to a smart training log, personal performance analytics, and AI-driven insights to optimize their individual training and recovery.

### Pricing Logic
- Flat monthly or discounted annual subscription fee
- **Student Discount:** A percentage discount (e.g., 25-40%) for verified students
  - Initial Verification: Could be manual (e.g., email a student ID)
  - Future: Explore automated verification services if volume warrants

### Key Features
- Full access to personal workout logging (create own, or use from a general library if available)
- Personal performance tracking and analytics dashboards
- Personalized AI assistant for insights on their own data (training, sleep, wellness, injury risk profile)
- Full gamification features (points, badges, streaks)
- Ability to be "invited" by a coach (at which point their direct subscription might be paused/handled by the coach's plan – see Coach Tier)

**AI Value Proposition:** AI acts as a personal performance and wellness advisor.

**Potential Ballpark (Illustrative - requires market research):**
- Monthly: $7 - $15
- Annually: $70 - $150

---

## Tier 2: Coach

**Target User:** Individual coaches managing one or more athletes.

**Core Value Proposition:** Powerful tools to create training plans, manage athletes efficiently, analyze performance, monitor injury risk, and leverage AI to enhance their coaching effectiveness.

### Pricing Logic
- Base monthly or discounted annual subscription fee
- **Includes 1 Athlete Slot for Free:** The coach's subscription inherently allows them to manage their own training (if they are also an athlete) or their first client athlete at no additional per-athlete cost
- **Per-Athlete Add-on Fee:** For each additional athlete managed beyond the first free slot, a flat fee (e.g., your suggested $5/month per athlete)
  - This scales with the coach's business
  - Stripe can handle this with a base subscription and quantity-based pricing for athlete "seats"

### Key Features
- All features available to an Athlete (for the coach's own use if applicable)
- **Workout Template Creation & Management:** Full access to create, share, and manage workout templates using the exercise library
- **Athlete Roster Management:** Add, view, and manage their roster of athletes
- **Training Plan Assignment:** Assign workout templates and longer-term training plans to their athletes
- **Comprehensive Athlete Analytics:** View detailed performance, wellness, and injury risk dashboards for each of their managed athletes
- **Coach-Focused AI Assistant:**
  - AI insights on their athletes' performance trends, fatigue patterns, and injury risks
  - AI suggestions for training modifications or exercise selections based on athlete data
  - AI assistance in drafting communications or summaries for athletes
- Communication tools for their athletes

### Referral Program (Optional Add-on)
If an athlete managed by a coach also signs up for their own paid "Athlete (Unattached)" subscription (perhaps for premium features beyond what the coach's management provides, or if they train independently as well), the coach could receive a small recurring credit (e.g., your $1 idea). This needs careful thought on how it interacts if the coach is already paying $5 for that athlete slot.

**Simpler initial approach:** The coach's per-athlete fee covers the athlete's access to the platform as a managed athlete.

**AI Value Proposition:** AI acts as a coaching assistant, providing deeper insights across their roster and saving time on analysis and planning.

**Potential Ballpark (Illustrative):**
- Base Monthly: $29 - $49 (includes 1 athlete slot)
- Per Additional Athlete: $5 / month

---

## Tier 3: Team (Schools, Universities, Clubs)

**Target User:** Organizations like high schools, university programs, or track and field clubs that have multiple coaches and a larger pool of athletes.

**Core Value Proposition:** A centralized platform for managing the entire track and field program, enabling consistent training methodologies, team-wide oversight, administrative controls, and advanced analytics.

### Pricing Logic
Packaged monthly or discounted annual subscription fees, tiered by capacity.

#### Example Sub-Tiers:
- **Team Starter:** e.g., Up to 3 Coaches, Up to 30 Athletes
- **Team Growth:** e.g., Up to 7 Coaches, Up to 75 Athletes
- **Team Pro/Performance:** e.g., Up to 15 Coaches, Up to 200 Athletes
- **Institution/Enterprise:** Custom pricing for larger needs

### Key Features
- All features available in the Coach Tier for each included coach seat
- **Administrative Dashboard:** For team managers to add/remove coaches, manage overall athlete rosters, and oversee billing
- **Team-Wide Analytics & Reporting:** View aggregated performance data, injury risk trends, and compliance across the entire team or specific groups
- **Centralized Communication Tools:** Announcements, group messaging for the entire organization
- (Potentially) Shared asset libraries (e.g., team-specific workout templates or exercise variations)
- (Potentially) Custom branding options for larger tiers

**AI Value Proposition:** AI provides insights at an organizational level, helps identify team-wide trends, supports program-wide consistency, and offers advanced reporting for administrators. Implicitly, AI usage limits would be higher or more flexible for these tiers.

**Potential Ballpark (Illustrative):**
- Team Starter: $79 - $129 / month
- Team Growth: $149 - $249 / month
- Team Pro: $299 - $499 / month

---

## General Considerations for All Tiers

### Free Trial
Offer a 14-day or 30-day free trial for the "Coach" and "Team Starter" tiers to allow users to experience the full value, especially the AI features.

### Annual Discount
Offer a discount (e.g., 10-20%, effectively 1-2 months free) for users who subscribe annually.

### Clarity on AI Usage
While avoiding "credits," be clear in your marketing that AI is an integral part of the value at each tier. You'll need to monitor your own API costs for AI services to ensure the pricing remains sustainable. If, in the extreme future, a very specific, computationally intensive AI feature is added, it could be an optional add-on, but the goal is to keep core AI integrated.

---

## Stripe Implementation

### Athlete & Coach Base
These can be standard subscriptions. The Coach tier's per-athlete add-on can be managed via Stripe's quantity-based subscriptions or metered billing.

### Team Tiers
These would likely be different subscription products in Stripe, each with its defined price and included coach/athlete limits.

You'll need robust logic in your app to check subscription status and entitlements (RLS in Supabase and frontend checks).

---

## Polishing Your Initial Concept

### Teams
The "set amount for X coaches -> X athletes" is good. I've fleshed this out into sub-tiers for Teams to offer more granular options. The key is that the Team plan covers a bundle of coaches and a total athlete capacity for the organization.

### Coaches
"1 athlete for free and then $5 per athlete thereafter" is a strong model. It's clear and scales. The "free" athlete is essentially covered by the coach's base subscription.

### Athletes
"Monthly/yearly fee if they are unattached, with a X% discount for proven students" is also solid. This captures individuals not tied to a paying coach or team.

This refined structure aims to maintain the simplicity you're looking for while providing clear differentiation and value at each level. The next step would be to conduct market research to set the actual dollar amounts for each tier and feature set. 