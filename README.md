# 🐱 Cat Care Community PWA

A Progressive Web App (PWA) to support a cat care community, enabling volunteers to upload daily photos of cats, track their wellbeing, and maintain a shared record of each cat's status.

## Features

- **Photo Upload & Recognition**: Upload cat photos with AI-based recognition to match existing cats
- **Cat Profile Management**: Track name, markings, spay/neuter status, vaccinations, location, and feeding history
- **Photo Management**: Swipe through photos with automatic cleanup to manage storage
- **Unrecognized Cats**: Review and categorize unidentified cats
- **Volunteer System**: Simple login/registration for community volunteers
- **PWA Support**: Install on mobile/desktop with offline capabilities
- **OCR Integration**: Extract text from images (e.g., collar tags) using Tesseract

## Technology Stack

- **Frontend**: Vite, Web Components, PWA
- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Image Processing**: Sharp, Tesseract.js (OCR)
- **AI/ML**: TensorFlow.js with MobileNet for cat recognition

## Dependencies Explained

### Frontend Dependencies

#### Core Framework
- **`vite`** (^5.0.8) - Lightning-fast build tool and dev server for modern web apps
- **`vite-plugin-pwa`** (^0.17.4) - PWA plugin for Vite, generates service workers and manifest

#### UI Components
- **`@hcl-software/enchanted-web-components`** (^1.0.0) - Modern web components library for consistent UI

### Backend Dependencies

#### Server Framework
- **`express`** (^4.18.2) - Fast, minimalist web framework for Node.js
- **`cors`** (^2.8.5) - Enable Cross-Origin Resource Sharing for API access
- **`dotenv`** (^16.3.1) - Load environment variables from `.env` file

#### Database
- **`better-sqlite3`** (^9.2.2) - Fast, synchronous SQLite3 database for Node.js
  - Stores cat profiles, photos, volunteers, and activity logs
  - No external database server required

#### Authentication & Security
- **`bcrypt`** (^5.1.1) - Hash and verify passwords securely
- **`jsonwebtoken`** (^9.0.2) - Generate and verify JWT tokens for volunteer authentication

#### File Upload & Processing
- **`multer`** (^1.4.5-lts.1) - Middleware for handling multipart/form-data (file uploads)
- **`sharp`** (^0.33.1) - High-performance image processing library
  - Resize images for consistent display
  - Extract dominant colors for cat matching
  - Optimize uploaded photos
- **`uuid`** (^9.0.1) - Generate unique identifiers for uploaded files

#### AI & Machine Learning
- **`@tensorflow/tfjs-node`** (^4.15.0) - TensorFlow.js for Node.js with native bindings
  - Runs AI models on the server
  - Faster than browser-based TensorFlow
- **`@tensorflow-models/mobilenet`** (^2.1.1) - Pre-trained MobileNet model for image classification
  - Detects if uploaded image contains a cat
  - Extracts visual features for cat matching
  - Compares uploaded photos with existing cat database
- **`@tensorflow-models/coco-ssd`** (^2.2.3) - Object detection model (optional, for future enhancements)
  - Can detect multiple objects in images
  - Currently not actively used but available for expansion

#### OCR (Optical Character Recognition)
- **`tesseract.js`** (^5.0.4) - JavaScript OCR library
  - Extracts text from uploaded images
  - Useful for reading collar tags, medical notes, or text in photos
  - Stores extracted text in `ocr_text` field

### Development Dependencies

- **`nodemon`** (^3.0.2) - Auto-restart Node.js server on file changes during development
- **`concurrently`** (^8.2.2) - Run multiple npm scripts simultaneously (frontend + backend)

## How Dependencies Work Together

### Photo Upload Flow
1. **`multer`** receives uploaded photo
2. **`uuid`** generates unique filename
3. **`sharp`** resizes and processes image
4. **`tesseract.js`** extracts any text from the image
5. **`@tensorflow/tfjs-node`** + **`mobilenet`** analyze image for cat recognition
6. **`better-sqlite3`** stores photo metadata and recognition results

### Cat Recognition Flow
1. **`sharp`** resizes uploaded image to 224x224 for MobileNet
2. **`mobilenet`** classifies image and extracts features
3. **`sharp`** extracts dominant colors (top 5 colors)
4. Custom algorithm compares features + colors with existing cats in database
5. Returns top 3 matches with confidence scores

### Authentication Flow
1. Volunteer submits credentials
2. **`bcrypt`** verifies password hash
3. **`jsonwebtoken`** generates JWT token
4. Token stored in browser, sent with each API request
5. **`express`** middleware validates token on protected routes

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cat-tracker.git
cd cat-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

This will start:
- Frontend dev server at `http://localhost:5173`
- Backend API server at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run server
```

## Project Structure

```
cat-tracker/
├── src/                    # Frontend source
│   ├── components/         # Web Components
│   ├── main.js            # Entry point
│   └── style.css          # Global styles
├── server/                # Backend source
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Auth middleware
│   └── database/          # Database setup
├── public/                # Static assets
├── uploads/               # Uploaded photos (created automatically)
├── data/                  # SQLite database (created automatically)
└── docs/                  # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login/register volunteer
- `GET /api/auth/volunteers` - List all volunteers

### Cats
- `GET /api/cats` - List all cats
- `GET /api/cats/:id` - Get cat details
- `POST /api/cats` - Create new cat
- `PUT /api/cats/:id` - Update cat
- `DELETE /api/cats/:id` - Delete cat
- `GET /api/cats/:id/photos` - Get cat photos

### Photos
- `POST /api/photos/upload` - Upload photo
- `POST /api/photos/:id/assign` - Assign photo to cat
- `GET /api/photos/unrecognized` - List unrecognized photos
- `DELETE /api/photos/:id` - Delete photo

## Deployment

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod
```

### Render
Connect your repository and use the included `render.yaml` configuration.

### Railway
```bash
railway up
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - Secret key for JWT tokens
- `DATABASE_PATH` - Path to SQLite database
- `UPLOAD_DIR` - Directory for uploaded photos
- `MAX_PHOTOS_PER_CAT` - Maximum photos per cat (default: 7)
- `PHOTO_RETENTION_DAYS` - Days to keep unrecognized photos (default: 30)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Future Enhancements

- Advanced AI cat recognition using TensorFlow.js
- Push notifications for feeding reminders
- Cat health analytics
- Integration with local shelters/vets
- Mobile app versions

## License

See LICENSE file for details.

## Usage Guide

### First Time Setup

1. **Login as a Volunteer**
   - Enter your name and email
   - No password required - simple community access
   - Your credentials are saved locally

2. **Upload Your First Cat Photo**
   - Click "Upload Photo" in the navigation
   - Take a photo or select from gallery
   - The system will attempt to recognize the cat
   - If recognized, confirm the match or select correct cat
   - If not recognized, create a new cat profile

3. **Managing Cat Profiles**
   - View all cats from the "All Cats" page
   - Click on a cat to see detailed profile
   - Mark cats as fed (AM/PM)
   - Edit profile information
   - View and manage photos

4. **Photo Management**
   - Each cat can have up to 7 photos (configurable)
   - Swipe through photos using arrow buttons
   - Delete unwanted photos
   - Oldest photos are automatically removed when limit is exceeded

5. **Unrecognized Cats**
   - Review photos that couldn't be matched
   - Assign them to existing cats
   - Create new profiles for new cats

### Installing as PWA

**On Mobile (iOS/Android):**
1. Open the app in your browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. The app will work offline after installation

**On Desktop (Chrome/Edge):**
1. Look for the install icon in the address bar
2. Click "Install"
3. The app opens in its own window

## Data Model

### Cat Profile
```javascript
{
  id: 1,
  name: "Whiskers",
  markings: "Orange tabby with white paws",
  spayNeuter: true,
  vaccinations: "Rabies, FVRCP",
  building: "Building A",
  lastSeenBy: "John Doe",
  lastFed: "2024-01-28 AM",
  daysNotSeen: 0,
  photos: [...]
}
```

### Photo
```javascript
{
  id: 1,
  catId: 1,
  url: "/uploads/abc123.jpg",
  date: "2024-01-28T10:30:00.000Z",
  uploader: "John Doe",
  recognized: true,
  ocrText: "Tag #123"
}
```

### Volunteer
```javascript
{
  id: 1,
  name: "John Doe",
  email: "john@example.com"
}
```

## Advanced Configuration

### Customizing Photo Limits

Edit `.env`:
```env
MAX_PHOTOS_PER_CAT=10
PHOTO_RETENTION_DAYS=60
```

### Integrating Real AI Recognition

Replace the placeholder in `server/services/recognition.js` with TensorFlow.js:

```javascript
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export async function recognizeCat(imagePath) {
  const model = await cocoSsd.load();
  const image = await loadImage(imagePath);
  const predictions = await model.detect(image);
  
  // Filter for cat predictions
  const catPredictions = predictions.filter(p => p.class === 'cat');
  
  // Match against existing cats in database
  // Implement your matching logic here
  
  return matches;
}
```

### Adding Cloud Storage

For production, replace local file storage with cloud storage (S3, Cloudinary, etc.):

```javascript
// In server/routes/photos.js
import { v2 as cloudinary } from 'cloudinary';

const result = await cloudinary.uploader.upload(req.file.path);
const photoUrl = result.secure_url;
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Database Locked Error
- Ensure only one server instance is running
- Check file permissions on `data/` directory
- Restart the server

### Photos Not Uploading
- Check `uploads/` directory exists and is writable
- Verify file size is under 10MB
- Check browser console for errors
- Ensure `UPLOAD_DIR` path is correct

### OCR Not Working
- Tesseract downloads language data on first run
- Check internet connection for initial setup
- Verify image quality is sufficient for text recognition

### PWA Not Installing
- Ensure you're using HTTPS (or localhost)
- Check browser console for service worker errors
- Verify `manifest.json` is being served correctly
- Clear browser cache and try again

## Performance Optimization

### Database Indexing
Already included in `server/database/init.js`:
- Index on `photos.cat_id` for faster queries
- Index on `photos.recognized` for unrecognized photo filtering
- Index on `activity_log.volunteer_id` for activity tracking

### Image Optimization
Consider adding Sharp for image resizing:

```javascript
import sharp from 'sharp';

await sharp(req.file.path)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toFile(optimizedPath);
```

### Caching
Add Redis for session and data caching in production.

## Security Considerations

### Current Implementation
- JWT tokens for authentication
- File upload validation (type, size)
- SQL injection protection (parameterized queries)
- CORS enabled for API access

### Production Recommendations
1. **Use HTTPS**: Required for PWA features
2. **Secure JWT_SECRET**: Use strong random string
3. **Rate Limiting**: Add express-rate-limit
4. **Input Validation**: Add joi or zod for request validation
5. **File Scanning**: Add virus scanning for uploads
6. **CSRF Protection**: Add csurf middleware
7. **Helmet**: Add helmet.js for security headers

```bash
npm install helmet express-rate-limit
```

```javascript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
```

## Testing

### Manual Testing Checklist
- [ ] Volunteer can register/login
- [ ] Upload photo works
- [ ] Cat recognition suggests matches
- [ ] New cat profile can be created
- [ ] Cat profile can be edited
- [ ] Photos can be deleted
- [ ] Feeding status can be updated
- [ ] Unrecognized photos appear in queue
- [ ] PWA can be installed
- [ ] App works offline (after first load)

### Automated Testing (Future)
Consider adding:
- Jest for unit tests
- Supertest for API testing
- Playwright for E2E testing

## Monitoring & Analytics

### Recommended Tools
- **Uptime**: UptimeRobot (free)
- **Errors**: Sentry (free tier)
- **Analytics**: Plausible or Simple Analytics (privacy-friendly)
- **Logs**: Better Stack (formerly Logtail)

### Adding Error Tracking

```bash
npm install @sentry/node
```

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

## API Documentation

For detailed API documentation, see [`docs/API.md`](docs/API.md).

For deployment instructions, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Community & Support

### Getting Help
- Open an issue on GitHub for bugs
- Check existing issues for solutions
- Join discussions for feature requests

### Contributing
We welcome contributions! Areas where help is needed:
- AI/ML cat recognition implementation
- Mobile app development
- UI/UX improvements
- Documentation
- Testing
- Translations

## Roadmap

### Phase 1 (Current) ✅
- Basic cat tracking
- Photo upload and management
- Volunteer system
- PWA support
- OCR integration

### Phase 2 (Next)
- [ ] Real AI cat recognition with TensorFlow.js
- [ ] Push notifications
- [ ] Advanced search and filtering
- [ ] Export data (CSV, JSON)
- [ ] Bulk photo upload

### Phase 3 (Future)
- [ ] Cat health tracking (weight, injuries)
- [ ] Feeding schedule automation
- [ ] Integration with shelters/vets
- [ ] Mobile native apps
- [ ] Multi-language support
- [ ] Analytics dashboard

## License

See LICENSE file for details.

## Acknowledgments

Built with:
- [Vite](https://vitejs.dev/) - Fast build tool
- [Express](https://expressjs.com/) - Web framework
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite driver
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [Multer](https://github.com/expressjs/multer) - File upload handling

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for community cats everywhere 🐱