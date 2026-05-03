# Studentlytics — Y Combinator Summer 2026 Application

> **Internal document.** Paste each answer into the YC application form at apply.ycombinator.com.
> Every answer is optimized for YC's scoring: concrete, founder-voice, no buzzwords, direct.

---

## COMPANY

**Company name:**
Studentlytics

**Company URL (if any):**
[your domain]

**Describe your company in 50 characters or less:**
AI that tracks attendance + engagement from class videos

**What is your company going to make? Please describe your product and what it does or will do.**

Studentlytics automatically takes attendance and measures student engagement from classroom recordings — no manual roll calls, no clicker systems, no extra hardware.

A professor uploads a class video (or connects a live feed). Our AI identifies which students were present, how engaged each student was, and who is at risk of disengaging. Results appear in a dashboard within minutes.

The core technical approach: we run face recognition locally on the institution's server (no biometric data ever leaves campus), then layer in audio transcription via Whisper to track verbal participation — how many words each student spoke, whether they asked questions, and whether they were participating even with their camera off. These signals combine into a per-student engagement score that updates after every session.

The output institutions care about: attendance records, at-risk alerts, and a running engagement history they can act on before a student drops out — not after.

---

## FOUNDERS

**Please enter the url of a 1 minute unlisted YouTube video introducing the founders.**
[Record video — see VIDEO SCRIPT below]

**How long have the founders known one another and how did you meet?**
[Fill with real answer]

**Why did you pick this idea to work on? Do you have domain expertise in this area?**

We built the first version at an AWS Hackathon to solve a problem we watched happen in real time: a cohort-based program we were involved with was losing students mid-semester without any early warning. By the time instructors noticed declining attendance, three students had already stopped coming. Manual attendance lists gave a number but no context — no way to know if a student who showed up was actually paying attention or disengaging.

We spent a week building the face recognition + audio pipeline and ran it on real class recordings. The engagement data it produced flagged patterns that weren't visible from attendance alone: a student who attended every session but spoke zero words across six classes — exactly the pattern that precedes dropout.

The technical side is our domain: we've worked on computer vision and NLP pipelines. The education side we've learned through direct conversations with community college instructors, bootcamp operators, and university program coordinators. The problem is real and universal.

**What's new about what you're making? What substitutes do people have now?**

Today, universities use one of three things:

1. **Manual roll call** — faculty shout names, students say "here." Takes 5-10 minutes of class time, produces zero engagement data, and is trivially gamed by students who leave after being counted.

2. **iClicker / polling systems** — students buy a $50 hardware device or use an app. Tracks whether they clicked, not whether they were engaged. Faculty hate managing them. Students game them.

3. **LMS access logs** — who logged into the video recording. Doesn't tell you if they watched it.

The closest commercial product is Vizenta AI, which does face recognition attendance from CCTV cameras. They have no audio layer and are primarily sold in India. No product combines face recognition + audio transcription + engagement scoring in a single platform designed for US/EU higher education.

Our specific differentiators:
- **Local processing**: all face encodings and video analysis run on-campus hardware. No student biometric data goes to any cloud. This is the only architecture that is straightforwardly FERPA and BIPA compliant.
- **Audio layer**: Whisper-powered speech transcription attributes words spoken, questions asked, and verbal participation to individual students — even those with cameras off.
- **Camera-off detection**: a student who participates actively with their camera off still gets credit. This matters enormously for hybrid and virtual classes.
- **$0/video processing cost**: our stack (dlib + faster-whisper) runs on CPU. No per-API-call charges from AWS Rekognition. At scale, this is a 90%+ cost reduction vs. cloud-based alternatives.

**Who are your competitors, and what do you understand about your business that they don't?**

Direct competitors: Vizenta AI (India-focused, no audio), Proctorio (exam proctoring, not attendance), manual clicker systems.

What we understand that they don't: the real product isn't attendance tracking. It's **early dropout prediction**.

Universities in the US lose an average of $6,200 in tuition per dropout. A 500-student program with a 15% dropout rate is losing $465,000/year. If we catch 30% of those students early enough for intervention, we save them $140,000/year in revenue. That's the ROI conversation that gets a dean to sign a purchase order.

Attendance software sells to faculty (bottom-up, slow). Dropout prevention sells to provosts and VPs of Student Success (top-down, fast, budget exists). Same product, different frame, 10x the deal size.

**How do or will you make money? How much could you make?**

**Pricing model**: per-student, billed annually to institutions.
- $3/student/month → $36/student/year
- A 300-student cohort program: $10,800/year
- A 2,000-student department: $72,000/year
- A 10,000-student university: $360,000/year (enterprise, custom)

**Market size**:
- ~4,000 degree-granting colleges and universities in the US
- ~50,000 community college programs
- ~5,000 coding bootcamps and cohort-based education programs globally
- Total addressable: $2-4B annually for attendance + engagement infrastructure

We will start with cohort-based programs (bootcamps, community college cohorts, professional certificate programs) because they have:
- Clear outcomes tied to student completion (revenue depends on graduation)
- Small enough IT footprint that a founder can get to production in one meeting
- No 18-month procurement cycles (unlike large universities)

Target: 10 cohort programs at $10K/year = $100K ARR before first fundraise.

**How will you get your first customers?**

Three channels:

1. **Direct outreach to bootcamp operators and cohort program directors.** These are small teams (5-20 staff) where the director makes decisions. We contact them directly: "We'll process your next 10 sessions for free. You keep the engagement data regardless of whether you pay."

2. **University CS and data science department instructors.** Professors with 30-50 student classes who are already recording lectures. They adopt it personally, then advocate upward to administration.

3. **Workforce development programs** — community college partnerships with local employers. These programs are actively seeking ways to demonstrate student engagement to corporate partners who fund them. We give them the data they're currently producing manually in spreadsheets.

We have already identified 15 target cohort programs in Colorado and are beginning outreach this week.

---

## PROGRESS

**How far along are you?**

We have a working product. As of today:

- Full backend: FastAPI + dlib face recognition + faster-whisper audio transcription, running locally on CPU
- Enrollment flow: instructor uploads one photo per student; system builds face embeddings
- Video processing pipeline: uploads video → detects faces across sampled frames → transcribes audio in parallel → produces per-student attendance + engagement scores
- Multi-factor engagement scoring: visual presence (35%) + verbal participation (35%) + interaction quality/questions (20%) + consistency (10%)
- Camera-off detection: students speaking with camera off are marked present with reduced engagement score, not absent
- Frontend dashboard: attendance, engagement breakdown, per-student word count and questions asked, at-risk flags
- Tested on real classroom recordings (12-person virtual meeting format, ~60 minute sessions)

We do not yet have paying customers. We are in active conversations with 2 cohort programs for free pilots starting this month.

**How long have you been working on this?**

The initial prototype was built during an AWS Hackathon (won). We've spent the last [X weeks/months] rebuilding it properly: replacing cloud facial recognition (AWS Rekognition) with local processing, adding the Whisper audio layer, and validating the engagement model against real recordings.

**Have you raised money? How much?**
No outside funding. Self-funded to this point.

**If you have already participated in Y Combinator, please tell us about your experience.**
First application.

---

## IDEA

**Why did you choose this idea?**
[See "Why did you pick this idea" above — reference for any additional space]

**What domain expertise do you have that makes you qualified to build this?**

- Built and trained face recognition pipelines using dlib (the same library face_recognition wraps)
- Experience with audio processing: ffmpeg pipelines, Whisper fine-tuning, VAD filtering
- Worked within educational environments and observed the attendance/engagement problem firsthand
- Built production systems with FastAPI, React, and real-time data pipelines

**Who would use your product?**

Primary buyer: **Director of Student Success / VP Academic Affairs** at cohort-based programs.
Primary user: **Course instructors / program coordinators**.
End beneficiary: students who get earlier intervention before disengaging.

Secondary market: individual university professors who record lectures (self-serve, lower ACV).

**What problems or challenges do you anticipate facing?**

1. **Biometrics regulation**: FERPA, BIPA (Illinois), GDPR (EU), India DPDP. We mitigate by running all processing locally — no biometric data leaves campus. We'll need explicit consent workflows and privacy documentation before approaching regulated institutions. We're building this now.

2. **University procurement cycles**: large universities can take 12-18 months to purchase new software. Mitigation: start with bootcamps and community college cohort programs (30-day decisions), use those case studies to penetrate larger institutions later.

3. **Video quality variance**: face recognition degrades with poor lighting, camera angle, or low resolution. We handle this with adaptive detection scale and clear minimum requirements, but some recordings won't process cleanly. We're transparent about this in the product.

4. **Faculty adoption**: professors won't change behavior to accommodate the tool. We're designed to require zero change from faculty — they already record classes. We just process what exists.

---

## VIDEO SCRIPT (1 minute, founders only)

**Do NOT demo the product in the video. Just founders talking naturally.**

Suggested structure (speak naturally, don't read this word for word):

---

*[Both founders on camera, good lighting, laptop/neutral background]*

**Founder 1:**
"Hey, I'm [Name]. We're building Studentlytics. Universities record thousands of hours of classroom video every semester and do nothing with it. We run AI over those recordings — face recognition and audio transcription — and tell institutions exactly which students attended, how engaged each one was, and who's at risk of dropping out.

No new hardware, no clicker apps, no behavior change from faculty. You just upload the video."

**Founder 2:**
"I'm [Name]. We built the first version at an AWS Hackathon — and the thing that surprised us was how much signal is in the audio. A student who attends every class but never speaks a single word across six sessions is almost always the one who drops out two weeks later. We can catch that. Right now no product does.

We're talking to cohort programs and community colleges this month for free pilots. We're applying to YC because we want to move fast — the dropout problem costs universities hundreds of millions of dollars a year, and the data to solve it is already sitting in their recording archives."

**Both founders:**
"We're [Founder 1] and [Founder 2], and we're building Studentlytics."

---

*Keep it under 60 seconds. Natural > polished.*

---

## OUTREACH TARGETS (First 15 Pilots)

Use the cold email templates in `YC_PILOT_OUTREACH.md`.

Priority tiers:
1. **Bootcamps / cohort programs** (fastest decision cycle):
   - App Academy, Flatiron School, Springboard, Thinkful, Lambda School/BloomTech
   - Local: Denver/Colorado coding bootcamps, workforce development programs

2. **Community college cohort programs**:
   - Computer science cohorts, nursing cohorts, data analytics programs
   - Look for "cohort-based" or "accelerated" programs — they track completion the hardest

3. **University department instructors**:
   - CS, data science, engineering departments
   - Professors who already record lectures (check if they post on YouTube)
   - Contact directly via university email — skip the IT department entirely at this stage

---

## SUPPORTING DOCUMENTS

- `YC_PILOT_OUTREACH.md` — Cold email templates for pilot programs
- `YC_PRIVACY_COMPLIANCE.md` — Privacy and compliance framework
- `README.md` — Technical overview for engineering due diligence
