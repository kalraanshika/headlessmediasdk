# headless-media-sdk

# Take-Home Task: Headless Media SDK + Component Library

**Role:** Senior React / React Native Developer
**Format:** Take-home (async), AI coding tools explicitly allowed and encouraged
**Suggested window:** 3–5 days, expected effort ~8–12 hrs
**Data source:** [Pexels API](https://www.pexels.com/api/) (free key) — photos + videos. Unsplash API is an acceptable substitute if the candidate prefers.

## Scenario

Build a small headless media SDK ecosystem: a framework-agnostic core, thin
per-platform wrappers, an independent pure-UI component library per
platform, and one app that wires them together. No backend to build; Pexels
is the data source.

## Deliverables

### 1. Core SDK — `media-core` (framework-agnostic, zero UI)
- API client for Pexels: search, curated/trending list, pagination, single-item fetch
- Auth: API key handling (config/init call), no key leakage into logic that shouldn't need it
- Event pattern: the SDK emits events for activity — `download` and `view` at minimum — via a simple emitter (subscribe/unsubscribe). A default listener logs each event to the console; the app can also subscribe independently to track activity.
- Pure TypeScript — no React, no DOM, no React Native imports
- Typed responses, error handling, basic in-memory caching or request de-dupe

### 2. Platform wrappers
- `media-react` — React wrapper around `media-core` (provider + hooks). Naming, shape, and number of hooks are the candidate's call — this is part of what's being evaluated.
- `media-native` — same contract, React Native wrapper
- Wrappers contain **no business logic** — they only adapt `media-core` to each platform's idioms
- Wrappers are the only layer that imports `media-core`

### 3. Component library — pure UI, per platform
- `media-ui-react` and `media-ui-native`, each shipping:
  - **Grid** — with infinite scroll / load-more
  - **Lightbox** — image (+ video if time allows), focus/keyboard handling on web
  - **Reel Swiper** — vertical snap paging, active-item detection
- Headless pattern: hooks + prop-getters, no shipped styles, consumer supplies markup/CSS
- **Independent of `media-core` and the wrappers** — no imports from either. Components take data and callbacks purely as props; they don't know Pexels or the SDK exist.

### 4. UI App (React, web)
- The app is the only place that imports both `media-react` (for data/auth/events) and `media-ui-react` (for display), and wires one to the other
- Search bar → Grid → tap opens Lightbox → a Reels-style view for video results
- Plain, functional UI — visual polish is not being scored

### 5. Two "skills" for AI coding tools
- Two `SKILL.md`-style documents (Claude Code / Cursor / any agent-skill format the candidate prefers) that teach an AI coding assistant how to correctly consume `media-react` + `media-ui-react` when building UI
- Example split: one skill for "wiring data" (hooks, provider setup, auth, events), one for "using the components" (prop-getters, styling contract, a11y)
- These should be usable in practice: candidate should demonstrate the skill actually steering an AI tool while building deliverable #4

## Constraints (this is what's actually being tested)
- Dependency direction: `app → wrappers → core`, and separately `app → components`. Wrappers and components never import each other; components never import core; core never imports either.
- Core SDK must be portable — could theoretically power a CLI or a different UI with zero changes.
- Use of AI coding tools is expected — candidate should note in the README which parts were AI-assisted vs hand-written, and how the two skill docs were used/tested.

## Evaluation Criteria
| Area | What we're looking for |
|---|---|
| Architecture | Correct separation of core / wrapper / components / app; no leakage across boundaries |
| SDK design | Clean auth handling, typed contracts, sensible error/loading states, event emitter design |
| Headless components | Genuine headless pattern (prop-getters, no baked-in styles), not just styled components with props |
| Skills quality | Skill docs are specific enough to actually change AI output, not generic boilerplate |
| Judgment | Sensible scoping under time pressure — what they cut and why, documented |

## Submission
- GitHub repo link
- Live deployed URL of the app
- Deployed URL of the SDK docs
- Deployed URL of the components docs
- Link(s) to the ChatGPT/Claude discussion chats used while building
