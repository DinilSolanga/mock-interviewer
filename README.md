# Interview Buddy

An AI mock interview tool. Answer interview questions out loud and get scored, structured feedback on each answer.

**Live demo:** https://interview-buddy-eight-teal.vercel.app

> The backend is on Render's free tier, so the first request after a period of inactivity can take 30 to 60 seconds while it wakes up.

## Features

- **Spoken answers:** record your answer in the browser, then get a transcript plus feedback
- **Rubric-based grading:** behavioural questions are scored on the STAR framework (situation, task, action, result) plus clarity. "Tell me about yourself" is scored on structure, relevance, conciseness and impact
- **Rewrite suggestions:** concrete improvements for the weakest parts of each answer
- **Two session modes:** a single behavioural question, or a full set (intro plus 3 behavioural)
- **Live results:** answers are graded in the background and appear on the review page as they finish
- **Review dashboard:** radar chart of scores with a detail panel for each dimension

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts
**Backend:** Python, FastAPI, Pydantic, pydub/ffmpeg
**AI:** Google Gemini 2.5 Flash (transcription and feedback in one multimodal call)
**Database and Auth:** Supabase (Postgres, Auth, Row Level Security, Realtime)
**Deployment:** Vercel (frontend), Render with Docker (backend)

## How It Works

1. The browser records the answer with the MediaRecorder API and uploads it to the FastAPI backend.
2. The backend verifies the user's Supabase JWT, converts the audio from WebM to WAV, and sends it to Gemini with a grading prompt.
3. Gemini returns the transcript and scores as structured JSON, validated against a Pydantic schema.
4. The result is saved to Supabase using the user's own token, so Row Level Security ensures users can only access their own data.
5. The review page subscribes to Supabase Realtime and shows each answer as soon as it is saved.

## Running Locally

### Prerequisites

- Node.js and npm
- Python 3.12
- ffmpeg (`brew install ffmpeg` on macOS)
- A Supabase project and a Gemini API key

### Backend

```bash
cd BE
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `BE/.env`:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-publishable-key
GEMINI_API_KEY=your-gemini-api-key
```

API docs are available at http://localhost:8000/docs.

### Frontend

```bash
cd FE
npm install
npm run dev
```

Create `FE/.env.local`:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_API_URL=http://localhost:8000
```

The app runs at http://localhost:5173.

## Project Structure

```
BE/
  app/
    core/       config, JWT verification, Supabase client
    data/       question bank
    routers/    API endpoints (/questions, /answers)
    schemas/    Pydantic models for feedback
    services/   audio conversion and Gemini analysis
  Dockerfile
FE/
  src/
    components/ route guards
    context/    auth state
    lib/        Supabase client
    pages/      login, register, home, interview, review
```
