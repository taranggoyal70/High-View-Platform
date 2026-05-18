# Studentlytics

**AI-powered attendance and engagement tracking for universities and cohort programs.**

Upload a classroom recording. Get per-student attendance, engagement scores, and participation data — automatically, with no hardware changes and no behavior change from instructors.

---

## What It Does

Studentlytics processes classroom video recordings using face recognition and audio transcription to produce:

- **Attendance records** — who was present, confirmed by face recognition (95%+ accuracy)
- **Engagement scores** — multi-factor score per student: visual presence + verbal participation + interaction quality + consistency
- **Participation data** — words spoken, questions asked, camera-on time per student
- **Camera-off detection** — students speaking with camera off are marked present, not absent
- **At-risk alerts** — students who attend but never participate are flagged before they drop out

Processing a 60-minute class recording takes ~15 minutes. No cloud APIs. $0/video processing cost.

---

## The Problem

US universities lose ~15% of students to dropout each semester. By the time an instructor notices declining attendance, the student is already gone. Manual roll calls take 5-10 minutes of class time, produce no engagement data, and are easily gamed. LMS login logs tell you nothing about whether a student was actually paying attention.

The data to catch at-risk students early exists — it's sitting in every institution's recording archive. Studentlytics makes it actionable.

---

## Architecture

```
Video Recording (MP4/MOV/Zoom)
         │
         ▼
┌─────────────────────────────────┐
│      FastAPI Backend            │
│   (runs on-campus, local only)  │
│                                 │
│  ┌──────────────┐  ┌─────────┐  │
│  │ Face         │  │ Audio   │  │  ← runs in parallel
│  │ Recognition  │  │ Whisper │  │
│  │ (dlib HOG)   │  │ (tiny)  │  │
│  └──────────────┘  └─────────┘  │
│         │               │       │
│         └───────┬───────┘       │
│                 ▼               │
│      Engagement Scoring         │
│   visual(35%) + speech(35%)     │
│   + interaction(20%)            │
│   + consistency(10%)            │
└─────────────────────────────────┘
         │
         ▼
   React Dashboard
   (attendance, engagement, at-risk)
```

**No student biometric data ever leaves the institution's network.** All face encodings and video processing run locally. FERPA and BIPA compliant by architecture.

---

## Key Technical Decisions

| Decision | Why |
|---|---|
| Local dlib (not AWS Rekognition) | $0/video vs ~$6-8/video at scale. No biometric data in cloud. FERPA/BIPA compliant. |
| faster-whisper tiny + int8 | 4-8x faster than openai-whisper on CPU. Good enough for participation tracking. |
| Parallel audio thread | Audio transcription runs concurrently with face processing → 40% faster total processing |
| Adaptive detection scale | Full-res for ≤720px video (virtual meetings). 0.5x for 1280px. Prevents missing faces in small grid-view tiles. |
| Proportional speech attribution | Grid meetings (multiple faces visible) → speech distributed by each student's camera-on time fraction |
| 20% presence threshold | Student marked present if detected in ≥20% of sampled frames. Handles momentary frame drops. |

---

## Engagement Score Formula

```
visual        = (face_size / frame_height × 5) × match_confidence  [35%]
participation = words_spoken / max_words_in_class                   [35%]
interaction   = min(1.0, questions_asked × 0.05 / 0.2)             [20%]
consistency   = 0.02 if (camera_on AND zero words)                  [10%]
              = min(1.0, presence_ratio)                            [10%]

engagement_score = (visual + participation + interaction + consistency) × 100
```

Camera-off students who speak >50 words are marked `present_camera_off` with a reduced score (no visual component).

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- ffmpeg (`brew install ffmpeg` on Mac, `apt install ffmpeg` on Linux)
- cmake (`brew install cmake`) — required for dlib

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First run downloads the faster-whisper tiny model (~75MB). Subsequent runs use the cached model.

### Frontend

```bash
npm install
npm run dev
```

Open http://localhost:3006 (or next available port).

### Enroll Students

1. Go to **Students** page
2. Click any student card → upload a clear headshot photo
3. System builds face encoding (takes ~2 seconds per photo)

### Process a Recording

1. Go to **Sessions** page
2. Click **Upload Recording** on any session
3. Upload an MP4/MOV file
4. Wait ~15 min for a 60-min video
5. Results appear in the session card

---

## API Reference

```
POST /videos/upload          Upload video + start processing
GET  /videos/{id}/status     Poll processing status
GET  /videos                 List all processed videos

POST /students/photo         Enroll student face (multipart: file, student_id, student_name)
GET  /students/enrolled      List enrolled students

GET  /health                 Backend status + enrolled count
```

---

## Privacy & Compliance

All processing is local. See [YC_PRIVACY_COMPLIANCE.md](./YC_PRIVACY_COMPLIANCE.md) for:
- FERPA compliance approach
- BIPA consent framework
- GDPR data processing agreement template
- Student consent form template

---

## Stack

**Backend:** Python, FastAPI, dlib (face_recognition), faster-whisper, OpenCV, ffmpeg

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts, Framer Motion

**Infrastructure:** Runs entirely on-premise. No cloud dependencies for core processing.

---

## Roadmap

- [ ] LMS integration: Canvas, Blackboard, Google Classroom (attendance sync)
- [ ] Live video stream support (RTSP / Zoom SDK)
- [ ] Email alerts for at-risk students (configurable thresholds)
- [ ] Multi-session trend view per student
- [ ] Export to CSV / PDF for institutional reporting
- [ ] Consent management dashboard

---

## License

MIT

