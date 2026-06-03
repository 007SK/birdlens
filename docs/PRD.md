# BirdLens — Product Requirements Document

**Version:** 1.0  
**Status:** Ready for Development  
**Author:** [Your Name]  
**Last Updated:** June 2026  
**Repository:** [GitHub/GitLab link — add before publishing]

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [User Personas](#4-user-personas)
5. [User Journeys](#5-user-journeys)
6. [Feature Requirements — V1](#6-feature-requirements--v1)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Model](#8-data-model)
9. [API Specification](#9-api-specification)
10. [UI/UX Specification](#10-uiux-specification)
11. [Success Metrics](#11-success-metrics)
12. [Product Decisions Log](#12-product-decisions-log)
13. [Constraints and Risks](#13-constraints-and-risks)
14. [Roadmap](#14-roadmap)

---

## 1. Product Overview

**BirdLens** is a browser-based acoustic bird detection app powered by [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer), an open-source deep learning model developed by the Cornell Lab of Ornithology. Users record a short audio clip or upload an existing one, and BirdLens identifies bird species present in the audio — returning each species with a confidence score, a photograph, and a fun fact.

The app is stateless and public. No account is required. Every analysis contributes to a global, always-growing counter of detections that is displayed prominently to every visitor, creating ambient proof of real, ongoing usage.

**Inspired by:** A field deployment using a Raspberry Pi and a microphone, where BirdNET ran as a background process and pushed detections to a live dashboard. BirdLens reimagines this as a browser-first, user-initiated experience that anyone can try from any device.

---

## 2. Problem Statement

Casual curiosity about bird sounds has no good low-friction outlet. The BirdNET-Analyzer web interface is designed for researchers — it expects file uploads, returns confidence tables, and offers no enrichment. Dedicated birding apps require account creation and manual species lookups. There is no tool that lets someone hear a bird, pull out their phone or laptop, record ten seconds, and immediately know what they heard — with context that makes the result meaningful.

**The gap:** Between scientific-grade tools (too complex) and general nature apps (too broad), there is no simple, browser-native, ML-powered bird identification experience built around the moment of discovery.

---

## 3. Goals and Non-Goals

### V1 Goals

- Allow any user to record (via browser mic) or upload an audio clip (max 30 seconds) and receive bird species detections above 40% confidence
- Display each detected species with: common name, scientific name, confidence percentage, bird photograph, and a fun fact
- Show a global live feed of the last 10 runs from all visitors
- Display an always-growing aggregate stats bar (total recordings, total detections, unique species) that updates with every run
- Give users the option to provide their location to improve detection accuracy — no account required, stored only in browser localStorage
- Deploy to a publicly accessible URL suitable for sharing with anyone
- Maintain a clean, well-documented GitHub repository that demonstrates product and technical thinking

### Non-Goals for V1

- User accounts, login, or personal history
- Audio playback of recorded clips
- Real-time or continuous streaming analysis
- Filtering or searching past detections
- Notifications or alerts
- Mobile app (native iOS/Android)
- Video file input
- Admin dashboard or moderation tools

---

## 4. User Personas

### Persona 1 — The Curious Visitor (Primary)
**Who:** Someone who heard an unfamiliar bird sound — near a window, in a park, on a walk. They have a laptop or phone. They are not a birder and have no prior knowledge of BirdNET.  
**Goal:** Know what bird they just heard, quickly, without creating an account or downloading anything.  
**Friction they will not tolerate:** Signup walls, file format requirements, long wait times, results they can't interpret.

### Persona 2 — The Recruiter or Colleague (Portfolio Viewer)
**Who:** A product manager, hiring manager, or peer reviewing this project as a portfolio artifact. They may visit the URL once, spend 2–3 minutes, then move to the GitHub repo.  
**Goal:** Understand the product thinking — why these features, why this architecture, what would come next.  
**What they're evaluating:** Does this person think like a PM? Is the scope appropriate? Are the tradeoffs documented?

### Persona 3 — The Builder (You)
**Who:** The person running this for their own use — placing a mic near a window, recording sessions, building up detection history.  
**Goal:** Run this regularly and show accumulated stats as evidence of sustained real usage.  
**Context:** Using a dedicated Digitech Bluetooth recording mic; running the app from a personal laptop.

---

## 5. User Journeys

### Journey 1 — Record from Mic (Primary Flow)

```
User opens URL
  → Sees stats bar: "X detections · Y species · Z recordings"
  → Reads location prompt: optionally enters city/coordinates
  → Clicks "Record" tab
  → Sees: "Tap to start. Recordings are capped at 30 seconds."
  → Clicks Record button → browser requests mic permission (first time)
  → Countdown timer appears (00:30 counting down)
  → User clicks Stop when done, OR timer auto-stops at 30s
  → "Analysing..." loading state (2–5 seconds)
  → Results appear:
      - Run header: "30s recording · 3 species detected · just now"
      - Species cards ordered by confidence (highest first)
      - Each card: photo, common name, scientific name, confidence bar + label, fun fact
  → Run added to global feed at top
  → Stats bar increments
```

### Journey 2 — Upload Audio File

```
User clicks "Upload" tab
  → Drag-and-drop zone or file picker
  → Accepted formats shown: WAV, MP3, M4A (max 30 seconds)
  → User selects file
  → Client-side check: if duration > 30s, show error before upload
  → "Analysing..." loading state
  → Same results experience as Journey 1
```

### Journey 3 — Portfolio Viewer (Read-Only)

```
Visitor opens URL
  → Sees stats bar with real numbers
  → Scrolls to global feed: last 10 runs with species and timestamps
  → Does not record — just observes
  → Clicks through to GitHub repo from footer link
```

### Journey 4 — Return Visitor

```
User opens URL again
  → Location is pre-filled from localStorage (no prompt shown)
  → Small note: "Using saved location: [city]. Change?"
  → Proceeds directly to record or upload
```

---

## 6. Feature Requirements — V1

### Feature 1: Aggregate Stats Bar

**Priority:** P0 (must ship)

Displayed at the very top of the page, always visible, updates after every run.

| Field | Description |
|---|---|
| Total Recordings | Count of all runs ever submitted |
| Species Detected | Count of distinct species ever identified above 40% confidence |
| Total Detections | Count of all individual species-in-run detections above 40% confidence |

- Numbers are fetched fresh on every page load
- After a user completes a run, stats increment visually without a full page reload
- No manual refresh required

---

### Feature 2: Location Input

**Priority:** P0

- Shown as a single-line text input on first visit, above the record/upload interface
- Label: "Your location (optional — improves accuracy)"
- Accepts: city name (e.g. "Pune, India") or decimal coordinates (e.g. "18.52, 73.85")
- On submit: stored in browser localStorage, city name resolved to lat/lon server-side
- On return visits: auto-populated, shown with a "Change" link
- If left blank: BirdNET runs without location filter (global species list, slightly more noise in results)
- Helper text near the record/upload area: "Location helps BirdNET focus on species found in your region."

---

### Feature 3: Record (Mic Input)

**Priority:** P0

- Single "Start Recording" button
- On click: browser requests microphone permission if not already granted
- If permission denied: show clear message — "Microphone access is needed to record. Please allow it in your browser settings."
- Recording starts immediately on permission grant
- Countdown timer visible: starts at 30, counts down
- "Stop" button available at any point after 3 seconds (prevent accidental zero-length submissions)
- Auto-stops at 30 seconds
- On stop: audio sent to backend as WAV (converted client-side if needed)
- No audio is stored or played back — it is processed and discarded server-side

**Mic selection:** Uses browser's default audio input. No device picker in V1. If user wants a specific mic (e.g. Digitech), they set it as default in OS audio settings before visiting.

---

### Feature 4: Upload (File Input)

**Priority:** P0

- Tab-switched interface alongside Record
- Drag-and-drop zone with fallback file picker button
- Accepted formats: WAV, MP3, M4A, OGG
- Client-side duration check before upload: if > 30 seconds, show inline error — "This clip is [X] seconds. Please trim it to 30 seconds or under."
- Client-side file size limit: 10MB (soft guard before backend validation)
- Same analysis pipeline as mic recording once file is received

---

### Feature 5: Analysis and Results Display

**Priority:** P0

**Loading state:**
- "Analysing your recording..." with a subtle animated indicator
- Expected wait: 2–6 seconds on Hugging Face Spaces
- If analysis takes > 10 seconds: add message "BirdNET is waking up — this may take up to 30 seconds on first run"

**Results display — Run Header:**
```
[duration]s recording · [N] species detected · [timestamp]
```

**Results display — Species Card (one per detected species, ordered by confidence descending):**

| Element | Detail |
|---|---|
| Bird photograph | Sourced from Wikipedia API or eBird Media API, cached in database |
| Common name | Large, prominent (e.g. "Common Koel") |
| Scientific name | Smaller, below common name (e.g. "Eudynamys scolopaceus") |
| Confidence bar | Visual fill bar, colour-coded by level |
| Confidence label | Plain English: "Very likely" (75%+), "Likely" (55–74%), "Possible" (40–54%) |
| Confidence percentage | Shown numerically alongside label |
| Fun fact | 1–2 sentence fact about the species, sourced once and cached |

**Threshold:** Only species with confidence ≥ 40% are shown. If no species meet this threshold: show — "Nothing detected above the confidence threshold. Try recording in a quieter spot, or closer to the sound."

**If zero detections returned by model at any confidence:** Show — "No bird sounds detected in this clip."

---

### Feature 6: Global Feed — Last 10 Runs

**Priority:** P0

Displayed below the record/upload interface. Shows the 10 most recent runs from all visitors, newest first.

Each entry shows:
- Time elapsed since run (e.g. "4 minutes ago")
- Duration of recording (e.g. "30s")
- Top 2 species detected with confidence labels
- Source indicator: mic icon or upload icon

No user identity is shown. No location is shown unless the user explicitly provided it (in V1, location is used for analysis but not displayed in the feed — keeps it simple and avoids any privacy concern).

Feed updates after the current user completes a run (their entry appears at the top). For other users' new runs, the feed refreshes on page load — no live push updates in V1.

---

### Feature 7: Species Enrichment Cache

**Priority:** P1 (needed for cards but can stub with placeholder on day one)

- First time a species is detected, backend fetches: photo URL (Wikipedia API) + fun fact (Wikipedia extract or eBird species note)
- Result stored in `species_cache` table in Supabase
- All subsequent detections of the same species serve from cache — no external API call
- If enrichment fetch fails: show species name and confidence without photo or fun fact (graceful degradation, no broken UI)
- Cache has no expiry in V1 (set to 90-day refresh in V2)

---

## 7. Technical Architecture

### Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React, hosted on Vercel | Free hosting, fast CDN, clean deployment |
| Backend | Python FastAPI, hosted on Hugging Face Spaces | Free tier supports ML workloads, Docker support, designed for demo projects |
| ML Inference | `birdnet_analyzer` Python library (v2.4) | Imported directly — avoids running a separate process, cleaner integration |
| Database | Supabase (PostgreSQL) | Free tier (500MB), persistent across Space restarts, clean REST API |
| Audio conversion | `ffmpeg` (in Docker) + `soundfile` Python library | Normalise any browser audio format to 48kHz WAV for BirdNET |
| Bird enrichment | Wikipedia REST API (images + extracts) | No API key required, comprehensive species coverage |

### Architecture Diagram

```
Browser (any device)
    │
    ├── GET page assets ──────────────────► Vercel
    │                                        (React SPA)
    │
    ├── POST /analyze (audio + metadata) ──► Hugging Face Spaces
    │                                         (FastAPI + BirdNET)
    │                                              │
    │                                              ├── Run BirdNET inference
    │                                              ├── Fetch enrichment (if new species)
    │                                              ├── Write run + detections to Supabase
    │                                              └── Return JSON results
    │
    ├── GET /feed (last 10 runs) ──────────► Hugging Face Spaces
    │                                         (reads from Supabase)
    │
    └── GET /stats ────────────────────────► Hugging Face Spaces
                                              (aggregate query on Supabase)
```

### Key Technical Notes

**Audio pipeline:**
Browser records audio → MediaRecorder API outputs WebM/Opus blob → sent to backend as multipart form data → `ffmpeg` converts to 48kHz mono WAV → passed to `birdnet_analyzer.analyze()` → results returned as JSON → audio file deleted immediately after analysis. No audio is persisted.

**BirdNET configuration:**
- Model version: 2.4
- Minimum confidence threshold: 0.40
- Overlap: 0.5 seconds (catches calls that straddle segment boundaries)
- If lat/lon provided: passed to model for regional species filtering
- If no location: model runs against global species list (6,500+ species)

**Concurrency:**
BirdNET inference is CPU-bound and single-threaded per the library design. Hugging Face Spaces queues requests. Expected wait for a queued request: 3–8 seconds. This is acceptable for V1. FastAPI's async handling ensures the server remains responsive during inference.

**Cold starts:**
Hugging Face Spaces sleeps after ~15 minutes of inactivity. First request after sleep takes 30–60 seconds as the BirdNET model reloads. Frontend handles this with the extended wait message (see Feature 5 loading state).

---

## 8. Data Model

### Table: `runs`

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| created_at | TIMESTAMP | When the run was submitted |
| duration_seconds | INTEGER | Length of the audio clip (1–30) |
| source | ENUM('mic', 'upload') | How audio was provided |
| species_count | INTEGER | Number of species detected above threshold |
| detection_count | INTEGER | Total detection rows for this run |
| lat | FLOAT (nullable) | Latitude if user provided location |
| lon | FLOAT (nullable) | Longitude if user provided location |

### Table: `detections`

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| run_id | UUID (FK → runs.id) | Parent run |
| species_common | TEXT | e.g. "Common Koel" |
| species_scientific | TEXT | e.g. "Eudynamys scolopaceus" |
| confidence | FLOAT | Peak confidence across all segments (0.40–1.0) |
| created_at | TIMESTAMP | Inherited from run |

### Table: `species_cache`

| Column | Type | Description |
|---|---|---|
| species_scientific | TEXT (PK) | Scientific name as unique key |
| species_common | TEXT | Common name |
| image_url | TEXT | Cached URL from Wikipedia/eBird |
| fun_fact | TEXT | Cached 1–2 sentence fact |
| cached_at | TIMESTAMP | When enrichment was fetched |

### Aggregate Queries (no separate table needed)

```sql
-- Stats bar
SELECT COUNT(*) AS total_runs FROM runs;
SELECT COUNT(*) AS total_detections FROM detections;
SELECT COUNT(DISTINCT species_scientific) AS unique_species FROM detections;

-- Last 10 runs with top species
SELECT r.*, 
  array_agg(d.species_common ORDER BY d.confidence DESC) AS species_list
FROM runs r
JOIN detections d ON d.run_id = r.id
GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT 10;
```

---

## 9. API Specification

Base URL: `https://[hf-space-name].hf.space`

---

### POST `/analyze`

Accepts an audio clip and optional location metadata. Returns detection results.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| audio | File | Yes | Audio clip, any common format, max 10MB |
| duration | Integer | Yes | Client-reported duration in seconds (1–30) |
| source | String | Yes | "mic" or "upload" |
| lat | Float | No | Latitude from user location input |
| lon | Float | No | Longitude from user location input |

**Response: 200 OK**
```json
{
  "run_id": "uuid",
  "duration_seconds": 30,
  "detections": [
    {
      "species_common": "Common Koel",
      "species_scientific": "Eudynamys scolopaceus",
      "confidence": 0.92,
      "confidence_label": "Very likely",
      "image_url": "https://upload.wikimedia.org/...",
      "fun_fact": "The Common Koel is a brood parasite..."
    },
    {
      "species_common": "House Sparrow",
      "species_scientific": "Passer domesticus",
      "confidence": 0.78,
      "confidence_label": "Likely",
      "image_url": "https://upload.wikimedia.org/...",
      "fun_fact": "House Sparrows were introduced to..."
    }
  ],
  "stats": {
    "total_runs": 892,
    "total_detections": 3847,
    "unique_species": 134
  }
}
```

**Response: 400 Bad Request**
```json
{
  "error": "duration_exceeded",
  "message": "Audio exceeds 30 seconds. Please trim and resubmit."
}
```

**Response: 422 Unprocessable**
```json
{
  "error": "no_audio_detected",
  "message": "Could not process this file. Ensure it contains audio."
}
```

---

### GET `/feed`

Returns the last 10 runs with their top detections.

**Response: 200 OK**
```json
{
  "runs": [
    {
      "run_id": "uuid",
      "created_at": "2026-06-03T08:42:00Z",
      "duration_seconds": 30,
      "source": "mic",
      "top_species": [
        { "species_common": "Common Koel", "confidence": 0.92 },
        { "species_common": "House Sparrow", "confidence": 0.78 }
      ]
    }
  ]
}
```

---

### GET `/stats`

Returns aggregate counts for the stats bar.

**Response: 200 OK**
```json
{
  "total_runs": 892,
  "total_detections": 3847,
  "unique_species": 134
}
```

---

### GET `/health`

Used by Hugging Face to confirm the Space is awake. Returns 200 with `{"status": "ok"}`.

---

## 10. UI/UX Specification

### Page Structure (Single Page)

```
┌─────────────────────────────────────────────────────┐
│  STATS BAR (sticky, top)                            │
│  🐦 3,847 detections · 134 species · 892 recordings │
├─────────────────────────────────────────────────────┤
│  HEADER                                             │
│  BirdLens                                           │
│  Identify birds from sound, instantly.              │
├─────────────────────────────────────────────────────┤
│  LOCATION INPUT                                     │
│  📍 Your location (optional — improves accuracy)    │
│  [ Pune, India                              ] [Set] │
│                                                     │
├─────────────────────────────────────────────────────┤
│  RECORD / UPLOAD TABS                               │
│  [ 🎙 Record ]  [ ⬆ Upload ]                        │
│                                                     │
│  (Record tab active:)                               │
│  ┌───────────────────────────────────────────────┐  │
│  │  Tap to start. Recordings cap at 30 seconds. │  │
│  │  Location helps narrow results to your area. │  │
│  │                                              │  │
│  │           [ ● Start Recording ]             │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  RESULTS (appears after analysis)                   │
│                                                     │
│  30s recording · 2 species detected · just now      │
│  ┌─────────────────────────────────────────────┐    │
│  │ [photo]  Common Koel                        │    │
│  │          Eudynamys scolopaceus              │    │
│  │          ████████░░  92% · Very likely      │    │
│  │          "The Common Koel is a brood..."    │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │ [photo]  House Sparrow                      │    │
│  │          Passer domesticus                  │    │
│  │          ███████░░░  78% · Likely           │    │
│  │          "One of the most widely..."        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
├─────────────────────────────────────────────────────┤
│  GLOBAL FEED                                        │
│  Recent detections from all visitors                │
│                                                     │
│  4 min ago · 30s · 🎙  Common Koel · House Sparrow  │
│  22 min ago · 15s · ⬆  Asian Koel (Very likely)    │
│  1 hr ago · 30s · 🎙   Rock Pigeon · Jungle Myna   │
│  ...                                                │
│                                                     │
├─────────────────────────────────────────────────────┤
│  FOOTER                                             │
│  Built with BirdNET-Analyzer (Cornell Lab / TU      │
│  Chemnitz) · MIT Source · CC BY-NC-SA 4.0 Models    │
│  · View on GitHub                                   │
└─────────────────────────────────────────────────────┘
```

### Confidence Colour Coding

| Label | Range | Colour |
|---|---|---|
| Very likely | 75–100% | Green |
| Likely | 55–74% | Amber |
| Possible | 40–54% | Grey-blue |

### Responsive Behaviour

- Cards stack vertically on mobile (single column)
- Stats bar wraps to two lines on small screens
- Record button is large and tap-friendly (min 56px height) on mobile

---

## 11. Success Metrics

### Quantitative (measurable from Supabase)

| Metric | V1 Target |
|---|---|
| Total runs completed | 50 within first month of sharing |
| Unique species detected | 20+ (validates geographic/ecological diversity of usage) |
| Upload vs Record ratio | Track — no target, just informative |
| Runs with location set | Track — informs whether to make location more prominent in V2 |
| Zero-detection rate | < 30% of runs (flags audio quality or threshold issues) |

### Qualitative

- A visitor unfamiliar with BirdNET can complete a run without reading any instructions
- The stats bar shows non-zero numbers at all times after first week of use
- GitHub repo README clearly communicates product decisions to a technical reviewer in under 3 minutes

---

## 12. Product Decisions Log

This section documents why specific decisions were made — the reasoning matters as much as the outcome.

| Decision | Options Considered | Choice | Rationale |
|---|---|---|---|
| Stateless V1 (no user accounts) | Auth from day one vs. stateless vs. session-only | Stateless with global rolling feed | Auth adds 2–3 days of build time and creates friction for first-time visitors. A rolling public feed shows real activity without identity. Auth deferred to V2 with clear upgrade path. |
| 30-second audio cap | Uncapped, 60s cap, 30s cap | 30 seconds | BirdNET's internal 3-second segments mean 30s gives 10 analysis windows — sufficient for multi-species detection. Longer clips increase server load and wait time without proportional accuracy gain. Users can re-record for more coverage. |
| 40% confidence threshold | 25% (BirdNET default), 50%, 40% | 40% | 25% is designed for researchers who want maximum recall and will verify results. For a consumer experience, 25% produces too many implausible results. 50% was too aggressive — it discards real detections. 40% balances signal and noise for a general audience. |
| Location: optional not required | Required, optional, hidden | Optional, asked once, stored locally | Requiring location loses users who want to try immediately. Hiding it reduces accuracy silently. Asking once with clear value proposition ("improves accuracy") respects user choice while encouraging it. localStorage avoids re-prompting. |
| Record + Upload both in V1 | Record only, upload only, both | Both | Record serves the moment-of-discovery use case. Upload serves the "I recorded this earlier" use case. Both use identical backend logic. Frontend difference is ~2 hours of extra work. Excluding either case would limit the product unnecessarily. |
| One run = multiple species | One result per run vs. one result per species per run | Multiple species per run, grouped | BirdNET naturally returns multiple detections per clip. Surfacing them together (one run card with N species) matches how birding works — a morning outside yields multiple species, not one. Separating them into individual "runs" would misrepresent what happened. |
| Bird enrichment: live vs cached | Fetch Wikipedia/eBird on every detection vs. cache in DB | Cache after first fetch | Fetching live on every request adds latency and external API dependency per run. Species set is finite — BirdNET knows ~6,500 species. Cache means near-instant enrichment after first encounter, zero repeat API calls. |
| Hosting: backend | Railway, Render, Hugging Face Spaces, local laptop | Hugging Face Spaces (free) | HF Spaces is purpose-built for ML demos, supports Docker, free tier has no time limits (only sleep on inactivity). Cold start is manageable for a demo context. Railway is better for production but costs ~$10/month — not justified for V1. |
| Global feed: last 10 vs. last 24h vs. all-time | Time window, count window, all-time | Last 10 by recency | Time windows create empty states (if nobody used the app in 24h, the feed is empty). An all-time list grows unwieldy. Last 10 by recency always shows something, always feels current, and has a natural visual rhythm. |

---

## 13. Constraints and Risks

| Constraint / Risk | Impact | Mitigation |
|---|---|---|
| HF Spaces cold start (30–60s after inactivity) | Poor first experience for new visitors | Frontend shows "Waking up BirdNET..." message; builder opens the URL before sharing it with anyone |
| BirdNET model license: CC BY-NC-SA 4.0 | Non-commercial use only | This project is non-commercial. Attribution in footer and README required and included. |
| Browser mic access requires HTTPS | Recording won't work on HTTP | Vercel and HF Spaces both provide HTTPS automatically |
| Browser throttles audio when tab is backgrounded | Recording may pause if user switches tabs | UI note: "Keep this tab active while recording" shown when recording starts |
| No GPU on HF free tier | Inference is CPU-only, takes 2–5s per clip | Acceptable for V1. BirdNET is optimised for CPU. Show loading state. |
| Audio format variance across browsers | Safari outputs different format than Chrome | ffmpeg handles all common formats server-side; client sends whatever MediaRecorder produces |
| Supabase free tier: 500MB limit | Could be hit with heavy usage | Detection rows are tiny (~200 bytes each). 500MB supports ~2.5 million detections. Not a real constraint for V1. |

---

## 14. Roadmap

### V1 (This Document)
Record or upload audio → BirdNET analysis → species cards with image + fun fact → global last-10 feed → always-growing aggregate stats → deployed public URL → documented GitHub repo.

### V2 — Personalisation
- User accounts (email/password, or Google OAuth)
- Personal detection history: last 10 runs per user
- Named "stations" — user gives their location a name (e.g. "Balcony in Pune") and their detections show under that label in the feed
- Profile page: personal species list, total runs, most detected species
- Audio clip storage for high-confidence detections (≥ 75%) — 30-day retention

### V3 — Expansion
- Video file input: extract audio track via ffmpeg, run same pipeline
- Multi-species comparison: select two species from your history, see their calls side by side
- Seasonal patterns: show which species appear most in which months based on accumulated data
- Species rarity indicator: flag species that appear in fewer than 5% of runs at a given location
- Export: download your detection history as CSV

---

## Attribution and License

BirdLens is built on [BirdNET-Analyzer](https://github.com/birdnet-team/BirdNET-Analyzer) by the K. Lisa Yang Center for Conservation Bioacoustics, Cornell Lab of Ornithology, and Chemnitz University of Technology.

Source code for BirdLens: MIT License.  
BirdNET models used within BirdLens: CC BY-NC-SA 4.0 (non-commercial use).

If you use this project or its derivative for research, please cite:

> Kahl, S., Wood, C.M., Eibl, M., Klinck, H. (2021). BirdNET: A deep learning solution for avian diversity monitoring. *Ecological Informatics*, 61, 101236.

---

*This PRD was authored as part of a personal project demonstrating product management practice. Questions, feedback, and contributions are welcome via GitHub Issues.*
