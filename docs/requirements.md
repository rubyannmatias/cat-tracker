# Cat Care Community PWA - Requirements

## Overview
A Progressive Web App (PWA) to support a cat care community, enabling volunteers to upload daily photos of cats, track their wellbeing, and maintain a shared record of each cat's status. The app leverages modern web technologies, AI-based image recognition, and a user-friendly interface to streamline cat tracking and care.

## Technology Stack
- **Frontend**: Vite (bundler), vanilla Web Components for UI
- **Backend**: Node.js with Express (REST API, image processing)
- **Database**: SQLite (better-sqlite3) - local file-based database
- **Image Processing**: 
  - Sharp - Image resizing, optimization, and color extraction
  - Tesseract.js - OCR/text recognition from images
  - heic2any - Client-side HEIC to JPG conversion
- **AI/ML**: 
  - TensorFlow.js with MobileNet - Cat image classification and feature extraction
  - Hybrid recognition: Visual features + color matching
- **Authentication**: JWT tokens (name/email based, no passwords)
- **File Upload**: Multer for multipart/form-data handling
- **Deployment**: Ready for Railway, Vercel, Netlify, or similar platforms

## Core Features
### 1. Cat Photo Upload & Recognition ✅ IMPLEMENTED
- **File Upload**: Supports JPG, PNG, GIF, WebP, and HEIC formats
- **HEIC Support**: Automatic client-side conversion to JPG with preview before upload
- **Image Recognition**: 
  - MobileNet-based visual feature extraction
  - Dominant color analysis (top 5 colors)
  - Hybrid matching algorithm combining features and colors
  - Returns top 3 matches with confidence scores
- **User Workflow**:
  - If recognized: Show matches with confidence scores, user confirms or creates new profile
  - If unrecognized: Option to create new profile or save as unrecognized
- **OCR Integration**: Tesseract.js extracts text from images (collar tags, notes)
- **Preview**: Image preview before upload (with HEIC conversion indicator)

### 2. Cat Profile Management ✅ IMPLEMENTED
Each cat profile includes:
- **Name** (unique, case-insensitive validation)
- **Gender** (Male/Female/Unknown)
- **Marking description** (detailed physical features)
- **Spay/neuter status**
- **Vaccinations given**
- **Health notes** (prominent display on profile page)
- **Building/Location** frequently found at
- **Last seen by** (volunteer name)
- **Last seen date** (tracked automatically)
- **Last fed** (AM/PM tracking with detailed feeding history)
- **Days not seen** (auto-calculated daily based on last_seen_date)
- **Photo gallery** (swipeable photo viewer)

**Features**:
- Comprehensive edit modal with all metadata fields
- Feeding status display with helpful messages ("Fed this morning", "Needs PM feeding", etc.)
- Health notes prominently displayed in dedicated section
- Last seen tracking with automatic days counter
- Photo swiper for browsing cat photos

### 3. Photo Management ✅ IMPLEMENTED
- **Photo Limit**: Configurable via environment variable (MAX_PHOTOS_PER_CAT, default: 7)
- **Photo Viewer**: Swipeable photo gallery on cat profile page
- **Storage**: Photos stored in `/uploads` directory with unique UUIDs
- **Primary Photo Selection**: 
  - ✅ Set any photo as primary for each cat
  - ✅ Primary photo badge (⭐ Primary) displayed on selected photos
  - ✅ "Set as Primary" button on non-primary photos
  - ✅ Cat cards show primary photo first, fallback to latest
  - ✅ Only one primary photo per cat (auto-management)
- **Deletion**: 
  - ✅ Delete unrecognized photos (with confirmation)
  - ✅ Delete photos from cat profile with confirmation
  - ✅ Physical file deletion when photo record is deleted
  - ⏳ Automatic rotation when limit exceeded (not yet implemented)

### 4. Unrecognized Cat Workflow ✅ IMPLEMENTED
- **Storage**: Unrecognized photos stored separately with `recognized = 0` and `cat_id = NULL`
- **Review Page**: Dedicated "Unrecognized" tab showing all uncategorized photos
- **Actions Available**:
  - **Assign to Cat**: Search existing cats by name and assign photo
  - **Create New Profile**: Create new cat profile directly from unrecognized photo with all metadata fields
  - **Delete Photo**: Remove unrecognized photo with confirmation
- **Search**: Name-based search with dropdown for easy cat selection
- **Metadata Display**: Shows upload date, uploader, and OCR text (if any)
- **Photo Assignment**: Uses normalized cat names (trimmed, lowercase) for matching

### 5. AI/ML Integration ✅ IMPLEMENTED
- **Cat Recognition**: 
  - TensorFlow.js with MobileNet model (pre-trained on ImageNet)
  - Visual feature extraction (224x224 image analysis)
  - Dominant color extraction using Sharp (top 5 colors)
  - Hybrid matching: 70% visual features + 30% color similarity
  - Confidence threshold: 0.3 minimum for matches
  - Returns top 3 matches sorted by confidence
- **OCR**: 
  - Tesseract.js for text extraction
  - Supports JPG, PNG, GIF, WebP (HEIC converted to JPG first)
  - Extracted text stored in database for search/reference
- **Performance**: 
  - Server-side processing for better performance
  - Graceful error handling (continues if OCR/recognition fails)
- **Documentation**: AI-IMPLEMENTATION.md and AI-USAGE.md guides available

### 6. PWA Features ✅ IMPLEMENTED
- **Installable**: PWA manifest configured for mobile and desktop installation
- **Service Worker**: Vite PWA plugin with auto-update
- **Offline Support**: 
  - ✅ Static assets cached
  - ✅ App shell available offline
  - ⏳ Photo upload queue (not yet implemented)
  - ⏳ Background sync (not yet implemented)
- **Mobile File Selection**: Fixed mobile gallery access (users can choose camera or gallery)
- **Mobile Optimization**:
  - Responsive design with mobile-first approach
  - Touch-optimized buttons (min 44px touch targets)
  - Mobile-friendly forms (single column on small screens)
  - Horizontal scrolling tables with smooth touch scrolling
  - HEIC support for iPhone users (auto-conversion)
- **Icons**: PWA icons (192x192, 512x512) configured
- ⏳ **Push Notifications**: Not yet implemented

### 7. Volunteer & Community Features ✅ IMPLEMENTED
- **Authentication**: 
  - ✅ Name and email based registration (no password required)
  - ✅ JWT token-based authentication
  - ✅ Auto-registration for new volunteers
  - ✅ Profile updates on login
  - ⏳ Social login (not implemented)
  - ⏳ Anonymous access codes (not implemented)
- **Activity Tracking**:
  - ✅ Last seen by volunteer (tracked per cat)
  - ✅ Photo uploader tracked
  - ✅ Activity log table in database
  - ⏳ Community leaderboard (not implemented)
- **Notes**: 
  - ✅ Health notes per cat (dedicated field)
  - ⏳ General commenting system (not implemented)

## Data Model (Implemented)
- **Cat**: id, name, markings, gender, spayNeuter, vaccinations, health_notes, building, lastSeenBy, last_seen_date, lastFed, daysNotSeen, created_at
- **Photo**: id, cat_id, url, date, uploader, recognized (bool), ocr_text, is_primary (bool)
- **Volunteer**: id, name, email, created_at
- **Activity Log**: id, volunteer_id, action, cat_id, timestamp

**Database**: SQLite with better-sqlite3 (synchronous, fast, no external server needed)
**Migrations**: Automatic schema updates on server start for new columns

## Storage & Cleanup Plan ⚠️ PARTIALLY IMPLEMENTED
- **Photo Storage**: 
  - ✅ Local filesystem (`/uploads` directory)
  - ✅ Unique UUID filenames to prevent conflicts
  - ✅ Support for JPG, PNG, GIF, WebP, HEIC (converted to JPG)
  - ⏳ Cloud storage integration (not implemented)
- **Photo Limits**:
  - ✅ Configurable via MAX_PHOTOS_PER_CAT environment variable
  - ⏳ Automatic enforcement (not implemented)
  - ⏳ User selection prompt (not implemented)
- **Cleanup**:
  - ✅ Manual deletion of unrecognized photos
  - ✅ Physical file deletion when photo record is deleted
  - ⏳ Automatic expiration of unrecognized photos (not implemented)
  - ⏳ Automatic rotation of old photos (not implemented)

## Deployment Plan ✅ DOCUMENTED
- **Platforms Supported**: Vercel, Netlify, Render, Railway
- **Documentation**: 
  - ✅ DEPLOYMENT.md with step-by-step guides
  - ✅ SETUP.md for local development
  - ✅ Environment variable configuration (.env.example)
- **Requirements**:
  - Node.js 18+
  - SQLite database (file-based, no external server)
  - File storage for uploads (local or cloud)
- **Mobile Installation**: Guide for installing PWA on iOS and Android
- **Database**: SQLite file can be backed up/restored easily
- ⏳ **Cloud Storage**: Not yet configured (currently using local filesystem)

## Security & Privacy
- Only allow authenticated volunteers to upload/manage data
- Do not expose private volunteer info
- Allow users to request data deletion

## Additional Features Implemented
- **View Modes**: Grid and table view for cat list with toggle
- **Search & Filter**: Real-time search across cat names, markings, building, gender
- **Sorting**: Cats sorted by days not seen (most urgent first)
- **Table View**: 
  - Comprehensive table with all metadata, horizontal scroll on mobile
  - **Color-coded feeding times**: 🌅 AM (amber) and 🌆 PM (blue) with legend
  - **Easy-to-read single column** for feeding status
- **Primary Photo Management**: 
  - Set any photo as primary for each cat
  - Primary photo badge (⭐ Primary) in photo swiper
  - Cat cards display primary photo first
  - Auto-management ensures only one primary per cat
- **Mobile File Selection**: Fixed mobile gallery access (removed camera-only restriction)
- **Error Handling**: User-friendly error messages with reporting information
- **Unique Names**: Cat names must be unique (case-insensitive validation)
- **Daily Updates**: Automatic daily update of days_not_seen counter
- **Responsive Design**: Mobile-first design with touch-optimized UI
- **HEIC Support**: Full support for iPhone photos with client-side conversion
- **AI Recognition Improvements**: Enhanced cat detection with better breed keywords and confidence thresholds

## Stretch Goals (Not Yet Implemented)
- ⏳ Mobile push notifications
- ⏳ Cat health analytics (weight, injuries, trends)
- ⏳ Integration with local shelters/vets
- ⏳ Photo rotation/cleanup automation
- ⏳ Community leaderboard
- ⏳ Commenting system
- ⏳ Offline photo upload queue with background sync
- ⏳ Cloud storage integration

---
This requirements document is a living artifact. Update as features and constraints evolve.
