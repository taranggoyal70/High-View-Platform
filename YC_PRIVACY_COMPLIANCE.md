# Studentlytics — Privacy & Compliance Framework

> This document explains how Studentlytics handles student biometric data.
> Share with institutional partners to address privacy concerns before they become blockers.

---

## The Core Architecture Decision

**All face recognition processing happens locally — on your institution's hardware.**

No student photo, video, or face encoding is ever transmitted to Studentlytics servers or any third-party cloud service. This is not a privacy policy promise — it is an architectural constraint. There is no external endpoint to send data to.

This is intentionally different from how most competitors (AWS Rekognition, Microsoft Azure Face, Google Vision) work. Those services require uploading student biometric data to cloud servers. We don't.

---

## What Data We Process

| Data Type | Where It Lives | Who Can Access | Retention |
|---|---|---|---|
| Student photos (enrollment) | Your local server | Institution admin only | Deleted on request |
| Face encodings (128-dimension vectors) | Your local server | Not human-readable | Deleted on request |
| Video recordings | Your local server / your storage | Institution admin only | Never uploaded externally |
| Attendance results | Your local server + dashboard | Institution admin, instructors | Exported on request |
| Audio transcripts | Processed locally, stored in results | Institution admin only | Deleted on request |
| Student names / IDs | Your local server | Institution admin only | Deleted on request |

**What Studentlytics (the company) can see:** Anonymized aggregate usage statistics (number of videos processed, processing time). Never individual student data.

---

## Regulatory Compliance

### FERPA (Family Educational Rights and Privacy Act — US)

FERPA protects the privacy of student education records. Attendance records are education records under FERPA.

**How Studentlytics complies:**
- All data is processed and stored under the institution's control, not ours
- We are a "school official" under FERPA's legitimate educational interest exception when operating as a service provider under direct control of the institution
- Institutions retain full ownership and control of all student data
- We provide data deletion on request within 30 days
- No student data is shared with third parties

### BIPA (Biometric Information Privacy Act — Illinois)

BIPA requires written consent before collecting biometric identifiers (including face geometry/encodings) and prohibits profiting from biometric data.

**How Studentlytics complies:**
- We provide a consent collection template for institutions to use before enrollment
- Face encodings (the biometric identifier under BIPA) are stored only on institutional servers
- Studentlytics does not receive or store biometric data
- Institutions must obtain written consent before enrolling students — we provide the consent form template

**Note:** BIPA applies to Illinois institutions and any institution serving Illinois students. If you operate in Illinois, we require written consent before activation.

### GDPR (General Data Protection Regulation — EU/UK)

For European institutions or institutions with EU student data:

- All processing is local — no personal data leaves the institution's jurisdiction
- We operate as a data processor under the institution's instructions (data controller)
- We provide a Data Processing Agreement (DPA) template on request
- Students have the right to access, correct, and delete their data — institutions fulfill these requests through our admin dashboard

### COPPA (Children's Online Privacy Protection Act — US K-12)

Studentlytics is designed for higher education (18+ students). We do not operate in K-12 contexts and do not knowingly process data of minors under 13.

---

## Consent Framework

Before enrolling students in face recognition, institutions must:

1. **Notify students** that classroom attendance will be tracked using face recognition technology
2. **Obtain written or digital consent** from each student before their photo is enrolled
3. **Provide an opt-out mechanism** — students who decline face recognition must have an alternative attendance method available
4. **Inform students of their rights** to access or delete their biometric data

We provide:
- **Student consent form template** (PDF + digital form)
- **Instructor notice template** (email to send to students at course start)
- **Opt-out tracking field** in the enrollment dashboard

---

## Student Consent Form Template

---

**BIOMETRIC DATA CONSENT FORM**
[Institution Name] | [Program Name]

**What we collect:** A mathematical representation of your face (called a face encoding) derived from your photo. This is used to automatically track attendance in class recordings.

**How it's stored:** Your face encoding is stored only on [Institution]'s local servers. It is never transmitted to external services or shared with third parties.

**How it's used:** To identify your presence in class recordings and record your attendance and engagement metrics for your instructors.

**Your rights:**
- You may request a copy of your stored data at any time
- You may request deletion of your data at any time
- You may withdraw consent at any time; your attendance will then be tracked manually

**Opt-out:** If you do not consent, you will not be enrolled in face recognition. Your attendance will be recorded by an alternative method determined by your instructor.

I understand and consent to the above:

Name: _______________________
Student ID: ___________________
Signature: ____________________
Date: ________________________

---

## Security

- Face encodings are stored as encrypted JSON files on the institutional server
- Studentlytics software does not open any external network connections during video processing
- The processing server should be on the institution's internal network, not publicly exposed
- We recommend running on an air-gapped or VPN-restricted server for maximum security
- All logs are stored locally; no telemetry is sent externally

---

## Questions We Get Asked

**"Can Studentlytics access our student data remotely?"**
No. The processing runs entirely on your hardware. We have no remote access unless you explicitly grant it for support purposes.

**"What happens if we stop using Studentlytics?"**
Delete the software directory. All data — photos, encodings, results — is gone. Nothing remains with us.

**"Do you train AI models on our student data?"**
No. We use pre-trained models (dlib's face recognition model, OpenAI Whisper). We do not use any institutional data to train or improve our models.

**"Can a student's face encoding be used to reconstruct their photo?"**
No. Face encodings are 128-dimensional numerical vectors. They cannot be reverse-engineered into a photo.

**"Do you sell student data?"**
Never. Student data is not our product. Institutional subscriptions are our product.

---

## Contact for Compliance Questions

[Your name]
[email]
[phone]

For DPA requests, FERPA agreements, or BIPA compliance documentation, email with subject line: "Compliance Request — [Institution Name]"
