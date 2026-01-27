# Cat Care Community PWA - Requirements

## Overview
A Progressive Web App (PWA) to support a cat care community, enabling volunteers to upload daily photos of cats, track their wellbeing, and maintain a shared record of each cat's status. The app leverages modern web technologies, AI-based image recognition, and a user-friendly interface to streamline cat tracking and care.

## Technology Stack
- **Frontend**: Vite (bundler), [Enchanted Web Components](https://github.com/HCL-TECH-SOFTWARE/enchanted-web-components) for UI
- **Backend**: Node.js (REST API, image processing)
- **Image Processing**: Leptonica (image pre-processing), Tesseract (OCR/text recognition)
- **AI/ML**: Use open-source or free AI models for cat recognition; fallback to paid APIs if no free solution exists
- **Deployment**: Plan for free-tier serverless or container hosting (e.g., Vercel, Netlify, Render, Railway)

## Core Features
### 1. Cat Photo Upload & Recognition
- Upload photos (in-memory, not direct-to-disk by default)
- Run image recognition to match cat faces/markings
- If recognized, prompt user to confirm or select correct cat
- If unrecognized, allow user to create new cat entry or match to existing
- Use Tesseract for extracting any text in images (e.g., collar tags)

### 2. Cat Profile Management
Each cat profile includes:
- Name
- Marking description
- Spay/neuter status
- Vaccinations given
- Building frequently found at
- Last seen by (volunteer name)
- Last day fed (AM/PM)
- Days not seen (auto-tracked)

### 3. Photo Rotation & Cleanup
- Limit number of stored photos per cat (e.g., keep last 7 days or N photos)
- After upload, show user all photos for that cat and allow swipe left/right (Tinder-style) to keep/delete
- Prompt user to select which photo(s) to keep if limit exceeded
- Delete old/unselected photos to save storage

### 4. Unrecognized Cat Workflow
- Store photos of unrecognized cats in a separate category
- Allow community users to review and categorize unrecognized cats
- Users can assign a new name or match to an existing cat profile

### 5. AI/ML Integration
- Use open-source models for cat face/marking recognition (e.g., TensorFlow.js, ONNX models)
- If no free solution is viable, integrate with a paid AI API (with fallback and cost warning)
- Use Tesseract for text extraction from images

### 6. PWA Features
- Installable on mobile/desktop
- Offline support for photo upload and review (sync when online)
- Push notifications for feeding reminders, missing cats, or new unrecognized cats

### 7. Volunteer & Community Features
- Volunteer login (email/social, or anonymous with code)
- Track last seen/fed by volunteer
- Community leaderboard for most active volunteers
- Commenting or notes per cat

## Data Model (Simplified)
- **Cat**: id, name, markings, spayNeuter, vaccinations, building, lastSeenBy, lastFed, daysNotSeen, photos[]
- **Photo**: id, catId, url, date, uploader, recognized (bool), ocrText
- **Volunteer**: id, name, email, activityLog[]

## Storage & Cleanup Plan
- Store photos in cloud storage (e.g., S3, Firebase, or free-tier alternative)
- Enforce per-cat photo limit (configurable)
- Prompt user to select which photos to keep after upload
- Auto-delete oldest/unselected photos
- Unrecognized cat photos expire after X days if not categorized

## Free Server Deployment Plan
- Use Vercel, Netlify, Render, or Railway for Node.js backend and static frontend
- Use free-tier cloud storage for images (with rotation/cleanup)
- Document deployment steps for each platform
- Monitor usage to avoid exceeding free limits

## Security & Privacy
- Only allow authenticated volunteers to upload/manage data
- Do not expose private volunteer info
- Allow users to request data deletion

## Stretch Goals
- Mobile push notifications
- Cat health analytics (weight, injuries, etc.)
- Integration with local shelters/vets

---
This requirements document is a living artifact. Update as features and constraints evolve.
