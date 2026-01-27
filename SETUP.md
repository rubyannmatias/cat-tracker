# Cat Tracker Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

### 3. Delete Old Database (If Exists)
If you have an existing database that's causing errors, delete it to start fresh:
```bash
rm -rf data/cats.db
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## First Time Setup

1. **Open the app** in your browser at http://localhost:5173
2. **Login/Register** with your name and email
3. **Upload a cat photo** to test the system
4. **Create cat profiles** with detailed metadata

## Features Available

### Cat Metadata Editing
- ✅ Name
- ✅ Markings & Description
- ✅ Building/Location
- ✅ Vaccinations
- ✅ Health Notes
- ✅ Spay/Neuter Status
- ✅ Last Fed (AM/PM)

### AI Recognition
- ✅ MobileNet-based cat detection
- ✅ Color similarity matching
- ✅ Hybrid confidence scoring
- ✅ Top 3 match suggestions

### Photo Management
- ✅ Upload photos
- ✅ Swipe through photos
- ✅ Delete photos
- ✅ Automatic cleanup (max 7 per cat)
- ✅ Save as unrecognized

### Tracking
- ✅ Days not seen (auto-calculated)
- ✅ Last seen by volunteer
- ✅ Feeding status (AM/PM)
- ✅ Activity log

## Troubleshooting

### Database Errors
If you see `SQLITE_ERROR: no such column`, delete the database and restart:
```bash
rm -rf data/cats.db
npm run dev
```

### MobileNet Not Found
Make sure you ran `npm install` to get all dependencies:
```bash
npm install
```

### Port Already in Use
Kill the process and restart:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
npm run dev
```

## Database Migrations

The app automatically handles database migrations on startup:
- Adds `last_seen_date` column if missing
- Adds `health_notes` column if missing

## Next Steps

1. **Test the app** with real cat photos
2. **Customize settings** in `.env` file
3. **Deploy** using deployment guide in `docs/DEPLOYMENT.md`
4. **Share** with your volunteer community

## Support

- See `README.md` for full documentation
- See `docs/AI-USAGE.md` for AI recognition details
- See `docs/DEPLOYMENT.md` for deployment instructions
