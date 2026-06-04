# BirdLens

Browser-based bird sound detection powered by BirdNET-Analyzer.
Record or upload a clip → identify species instantly.

**Live demo:** https://birdlens.vercel.app  
**Built with:** BirdNET-Analyzer (Cornell Lab of Ornithology), FastAPI, React, Supabase, Hugging Face Spaces

---

## Architecture

| Layer | Technology | Host |
|---|---|---|
| Frontend | React (Vite) | Vercel |
| Backend | FastAPI + BirdNET-Analyzer | Hugging Face Spaces |
| Database | Supabase (PostgreSQL) | Supabase |
| Bird images | Wikipedia REST API | — |
| Fun facts | iNaturalist API | — |

```
Browser → Vercel (React)  →  HF Space (FastAPI + BirdNET)  →  Supabase (PostgreSQL)
```

---

## Local Development

**Prerequisites:** Python 3.11, Node 18+, ffmpeg

**Backend**

```bash
cd backend
cp .env.example .env          # fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
# .env already points to localhost:8000 for local dev
npm run dev                   # http://localhost:5173
```

**Docker (backend only)**

```bash
cd backend
docker build -t birdlens-backend .
docker run -p 7860:7860 --env-file .env birdlens-backend
```

---

## Product Decisions

See `docs/PRD.md` for the full specification and decision log.

## Roadmap

See `docs/PRD.md` → Section 14.
