# BirdLens — Claude Code Context

This file is read automatically by Claude Code in every session.
Do not delete or rename it. Update it as the project evolves.

---

## What We Are Building

**BirdLens** is a browser-based bird sound detection app.
Users record a short audio clip (via browser mic) or upload an audio file (max 30 seconds).
The backend runs BirdNET-Analyzer to identify bird species in the audio.
Results show each detected species with: photo, common name, scientific name, confidence score, and a fun fact.
A global feed shows the last 10 runs from all visitors.
A stats bar at the top shows total recordings, detections, and unique species — always growing.

Full product specification: `docs/PRD.md`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), deployed to Vercel |
| Backend | Python 3.11, FastAPI, deployed to Hugging Face Spaces |
| ML | `birdnet_analyzer` Python library v2.4 (imported directly, not as a subprocess) |
| Database | Supabase (PostgreSQL) |
| Audio conversion | ffmpeg + soundfile library |
| Bird enrichment | Wikipedia REST API (no key needed), results cached in Supabase |

---

## Repository Structure

```
birdlens/
├── CLAUDE.md                  ← this file
├── README.md
├── .gitignore
├── docker-compose.yml         ← local dev only
├── docs/
│   └── PRD.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py            ← FastAPI app, route definitions
│       ├── analyzer.py        ← BirdNET wrapper, audio pipeline
│       ├── enrichment.py      ← Wikipedia fetch + species cache logic
│       ├── database.py        ← Supabase client, all DB queries
│       └── models.py          ← Pydantic request/response models
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── components/
        │   ├── StatsBar.jsx
        │   ├── LocationInput.jsx
        │   ├── RecordTab.jsx
        │   ├── UploadTab.jsx
        │   ├── ResultsCard.jsx
        │   ├── SpeciesCard.jsx
        │   └── GlobalFeed.jsx
        └── api/
            └── client.js      ← all fetch calls to backend
```

---

## Key Product Constraints (Do Not Change Without Asking)

- **Audio cap:** 30 seconds maximum. Reject server-side if exceeded.
- **Confidence threshold:** Show only detections ≥ 0.40 (40%). This is intentional — not the BirdNET default of 0.25.
- **Audio pipeline:** Browser sends raw audio blob → backend converts to 48kHz mono WAV using ffmpeg → passed to birdnet_analyzer → audio deleted immediately after analysis. No audio is persisted anywhere.
- **Stateless:** No user accounts in V1. No session identity. All runs are anonymous.
- **Global feed:** Last 10 runs from all users, newest first.
- **One run = one audio clip = multiple species detections.** Never split a single clip into multiple runs.
- **Location is optional.** If provided, pass lat/lon to BirdNET for regional filtering. If not, run against global species list.
- **Species enrichment is cached.** Fetch Wikipedia image + fun fact once per species, store in `species_cache` table. Never fetch the same species twice.

---

## Supabase Schema

```sql
-- Runs table
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER NOT NULL,
  source TEXT CHECK (source IN ('mic', 'upload')) NOT NULL,
  species_count INTEGER NOT NULL DEFAULT 0,
  detection_count INTEGER NOT NULL DEFAULT 0,
  lat FLOAT,
  lon FLOAT
);

-- Detections table
CREATE TABLE detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  species_common TEXT NOT NULL,
  species_scientific TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Species enrichment cache
CREATE TABLE species_cache (
  species_scientific TEXT PRIMARY KEY,
  species_common TEXT NOT NULL,
  image_url TEXT,
  fun_fact TEXT,
  cached_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Contracts

### POST /analyze
- Input: multipart/form-data with fields: `audio` (file), `duration` (int), `source` (string), `lat` (float, optional), `lon` (float, optional)
- Output: `{ run_id, duration_seconds, detections: [{ species_common, species_scientific, confidence, confidence_label, image_url, fun_fact }], stats: { total_runs, total_detections, unique_species } }`
- confidence_label mapping: ≥0.75 → "Very likely", 0.55–0.74 → "Likely", 0.40–0.54 → "Possible"

### GET /feed
- Output: `{ runs: [{ run_id, created_at, duration_seconds, source, top_species: [{ species_common, confidence }] }] }`
- Returns last 10 runs, newest first

### GET /stats
- Output: `{ total_runs, total_detections, unique_species }`

### GET /health
- Output: `{ status: "ok" }`

---

## Environment Variables

Backend needs these in `.env` (never commit the actual `.env`):
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

Frontend needs:
```
VITE_API_BASE_URL=   ← backend URL (localhost:8000 for dev, HF Space URL for prod)
```

---

## Local Development

Backend runs on `localhost:8000`.
Frontend runs on `localhost:5173` (Vite default).
Frontend calls backend via `VITE_API_BASE_URL`.
Use `docker-compose up` to run backend locally with all dependencies.

---

## Coding Preferences

- Python: type hints on all functions, docstrings on public functions
- No inline comments that just restate the code — only explain *why*, not *what*
- React: functional components only, no class components
- Keep components small and single-purpose
- Error states must be handled explicitly — no silent failures
- Every API error must return a JSON body with `error` (machine-readable key) and `message` (human-readable)
- Do not use `any` types in TypeScript / do not skip Pydantic validation in Python

---

## Build Phases

**Phase 1 (Backend Foundation):**
Project scaffold → BirdNET install + test on sample WAV → /analyze endpoint → audio conversion pipeline → Supabase writes → /feed and /stats endpoints → local end-to-end test

**Phase 2 (Frontend Core):**
React scaffold → StatsBar → RecordTab with MediaRecorder → UploadTab → ResultsCard with SpeciesCard → GlobalFeed → connect to backend

**Phase 3 (Enrichment + Polish):**
Wikipedia fetch in enrichment.py → species_cache reads/writes → location input → confidence labels + colour coding → loading/error states → empty states

**Phase 4 (Deployment):**
Dockerfile for HF Spaces → environment variable wiring → Vercel deploy → end-to-end test on production URLs → README finalised

---

## Current Phase

**Phase 4 — Deployment**

---

## Phase Completion Log

- **Phase 1 — Backend Foundation** ✅ completed 2026-06-03
  Scaffold → BirdNET install → audio conversion pipeline → /analyze + /feed + /stats endpoints → Supabase integration → local end-to-end test passing

- **Phase 2 — Frontend Core** ✅ completed 2026-06-03
  Vite + React scaffold → StatsBar (live stats from Supabase) → RecordTab (MediaRecorder, countdown, mic permission handling) → UploadTab (drag-and-drop, client-side duration check) → SpeciesCard + ResultsCard → GlobalFeed → LocationInput with localStorage → full loading/error states including backend-unreachable message

- **Phase 3 — Enrichment + Polish** ✅ completed 2026-06-03
  iNaturalist fun facts (two-step search→detail, HTML stripped, generic sentences skipped) → Wikipedia images (User-Agent header, 120×120, emoji placeholder) → species_cache re-enrichment for NULL rows → LocationInput geolocation (Nominatim reverse+forward geocode, {text,lat,lon} JSON) → lat/lon wired into /analyze FormData → UI polish (StatsBar icons, italic fun facts, bold feed species, muted tagline) → mobile responsive CSS
