# Community Connect MVP

Community Connect is a social enterprise mobile MVP focused on improving quality of life, home safety, and social inclusion for older adults.

This implementation is built with Expo + React Native + Expo Router and Firebase (Authentication + Firestore) to support rapid delivery, cross-platform parity, and scalable feature growth.

## Why this stack

### Core stack

- React Native (Expo SDK 54): single codebase for iOS + Android with fast iteration and OTA support.
- Expo Router: file-based routing and clean module boundaries for future feature drops.
- Firebase Authentication: secure email/password onboarding with role-aware profiles.
- Cloud Firestore: real-time feeds (discussion, chat, events, wellbeing, moderation).
- Expo Notifications + Expo Calendar: reminders and device calendar sync for event flow.

### Why it fits this product

- Fast MVP velocity with production-ready cross-platform support.
- Real-time updates for social/community experiences.
- Easy to scale using Firebase Cloud Functions, FCM push pipelines, and Firestore rules/indexes.
- Clear handover path with well-structured code and service modules.

## Delivered MVP modules

### User onboarding and profiles

- Age-friendly sign up and sign in flow.
- Role selection: `senior`, `caregiver`, `organization`.
- Accessibility preferences stored per profile:
  - font scaling
  - high contrast mode

### Community discussion + moderation

- Real-time discussion feed.
- Post creation with basic content moderation filter.
- Flagging workflow and moderation queue integration.

### Private messaging

- One-to-one conversation creation.
- Real-time chat thread per conversation.

### Events and RSVP

- Event creation screen with date/time and duration.
- Real-time event listing with RSVP (`yes`, `maybe`, `no`).
- RSVP counters persisted in Firestore.
- Add-to-device-calendar flow.

### Wellbeing content + check-ins

- Role-filtered wellbeing tips feed.
- Daily mood check-in with optional note.
- Local daily reminder scheduling via notifications.

### Admin console

- Role-gated admin tab.
- Moderation queue for flagged community posts.
- Engagement stats (users/posts/events/chats/check-ins).
- Wellbeing tip publishing to selected audience roles.

## Architecture overview

### Routing

- `app/auth.tsx`: onboarding and sign-in.
- `app/(tabs)/*`: protected app modules.
- `app/chat/[conversationId].tsx`: private chat detail.
- `app/create-event.tsx`: event composer.

### Shared app foundation

- `providers/auth-provider.tsx`: auth state + profile state + push token refresh.
- `lib/firebase.ts`: Firebase bootstrapping.
- `services/*.ts`: domain-specific Firestore operations.
- `components/app/*`: reusable UI primitives (screen shell, typography, cards, loading).
- `hooks/use-app-theme.ts`: accessibility-aware app theming.

### Data model (Firestore)

- `users`
- `posts`
- `moderationReports`
- `conversations`
- `conversations/{id}/messages`
- `events`
- `events/{id}/rsvps`
- `wellbeingTips`
- `checkIns`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase environment

1. Copy `.env.example` to `.env`.
2. Fill all `EXPO_PUBLIC_FIREBASE_*` values from your Firebase project settings.

### 3. Configure Expo app identifiers

Update `app.json` placeholder values before building:

1. Set `expo.owner` to your Expo account or org.
2. Set `expo.extra.eas.projectId` to your EAS project ID.
3. Set `expo.ios.bundleIdentifier` and `expo.android.package` to your app IDs.
4. Optional: set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env` to override project ID lookup at runtime.

### 4. Firebase project configuration

1. Enable Email/Password authentication in Firebase Auth.
2. Create a Firestore database.
3. Deploy security rules from `firebase/firestore.rules`.

Example deploy commands:

```bash
npm run deploy:firestore
```

### 5. Run the app

```bash
npm run start
```

Shortcuts:

- `npm run android`
- `npm run ios`
- `npm run web`

## Admin setup

To access the admin panel, set a user profile role to `admin` in Firestore (`users/{uid}.role = "admin"`).

## Store review readiness notes

This MVP includes the essential flows needed for a closed beta submission:

- stable auth + role-based profile bootstrapping
- core social features (discussion, chat, events, wellbeing)
- notifications and calendar permissions usage descriptions in app config
- moderation and basic analytics through admin tooling

You should still complete the normal release tasks:

- production app icons and splash assets
- privacy policy + terms URLs
- finalized moderation policy copy
- production EAS build profiles and signing credentials

## WCAG AA support notes

Implemented accessibility support:

- larger text presets
- high-contrast profile option
- readable spacing and larger touch targets
- explicit labels for key interactive controls

Recommended next pass before public rollout:

- full screen-reader QA (VoiceOver/TalkBack)
- contrast audit with real device snapshots
- keyboard navigation checks on web target

## Proposed optimisation roadmap

### Recommended post-MVP priorities

1. Add cloud-function push pipeline (server-side push by audience role).
2. Add richer moderation (report reasons, strike system, blocked users).
3. Add event recurrence and reminders per RSVP.
4. Add pagination + offline-first caching strategy.
5. Add analytics dashboard expansion (retention cohorts, engagement funnels).

### Proposed delivery timeline (initial)

1. Week 1: product hardening, release candidate QA, Firebase rule validation.
2. Week 2: closed beta release, telemetry wiring, crash triage loop.
3. Week 3-4: UX refinement, performance tuning, moderation upgrades.
4. Week 5-6: first feature drop (advanced notifications + richer events).

## Testing note

Automated tests are intentionally not included in this milestone per request.
