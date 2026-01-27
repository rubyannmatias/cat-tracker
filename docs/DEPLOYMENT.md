# Deployment Guide

This guide covers deploying the Cat Care Community PWA to various free-tier hosting platforms.

## Prerequisites

- Git repository with your code
- Account on your chosen platform
- Environment variables configured

## Vercel Deployment

### Option 1: CLI Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set environment variables:
```bash
vercel env add JWT_SECRET
vercel env add DATABASE_PATH
vercel env add UPLOAD_DIR
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Configure environment variables in project settings
5. Deploy

**Note**: Vercel is primarily for static sites. For full-stack apps, consider using Vercel Serverless Functions or another platform.

## Netlify Deployment

### Option 1: CLI Deployment

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login:
```bash
netlify login
```

3. Initialize:
```bash
netlify init
```

4. Deploy:
```bash
netlify deploy --prod
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Visit [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables in site settings
7. Deploy

## Render Deployment

1. Push code to GitHub
2. Visit [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your repository
5. Render will detect `render.yaml` and configure automatically
6. Add environment variables if needed
7. Deploy

**Advantages**: 
- Free tier includes persistent disk storage
- Good for full-stack apps with databases
- Automatic SSL

## Railway Deployment

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Deploy:
```bash
railway up
```

5. Set environment variables:
```bash
railway variables set JWT_SECRET=your-secret-key
railway variables set DATABASE_PATH=/app/data/cats.db
railway variables set UPLOAD_DIR=/app/uploads
```

**Advantages**:
- Easy database setup
- Good free tier
- Automatic deployments from GitHub

## Environment Variables

All platforms require these environment variables:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-random-string
DATABASE_PATH=./data/cats.db
UPLOAD_DIR=./uploads
MAX_PHOTOS_PER_CAT=7
PHOTO_RETENTION_DAYS=30
```

### Generating JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Storage Considerations

### SQLite Database
- Render: Use persistent disk (free tier includes 1GB)
- Railway: Persistent storage included
- Vercel/Netlify: Consider using external database (Supabase, PlanetScale)

### Photo Uploads
- For production, consider using cloud storage:
  - AWS S3 (free tier)
  - Cloudinary (free tier)
  - Supabase Storage (free tier)

### Migrating to Cloud Storage

Update `server/routes/photos.js` to use cloud storage SDK instead of local filesystem.

Example for Cloudinary:
```javascript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

## Post-Deployment Checklist

- [ ] Test volunteer login/registration
- [ ] Upload a test photo
- [ ] Create a cat profile
- [ ] Verify photo assignment works
- [ ] Test photo deletion
- [ ] Check unrecognized photos view
- [ ] Verify PWA installation works
- [ ] Test offline functionality
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## Monitoring

### Free Monitoring Tools
- [UptimeRobot](https://uptimerobot.com) - Uptime monitoring
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

## Troubleshooting

### Database Issues
- Ensure DATABASE_PATH directory exists
- Check file permissions
- Verify SQLite is installed

### Photo Upload Issues
- Check UPLOAD_DIR permissions
- Verify file size limits
- Check disk space

### Build Failures
- Clear node_modules and reinstall
- Check Node.js version (18+)
- Review build logs for specific errors

## Scaling Considerations

As your community grows:
1. Migrate to PostgreSQL or MySQL
2. Use cloud storage for photos
3. Implement caching (Redis)
4. Add CDN for static assets
5. Consider containerization (Docker)
6. Set up CI/CD pipeline

## Cost Optimization

Free tier limits:
- **Vercel**: 100GB bandwidth/month
- **Netlify**: 100GB bandwidth/month
- **Render**: 750 hours/month
- **Railway**: $5 credit/month

Monitor usage and upgrade as needed.

---

# Mobile PWA Installation Guide

This section covers how to package and install your Cat Care Community PWA on mobile phones.

## Installing PWA on Mobile Devices

Your PWA can be installed directly from the browser once deployed with HTTPS. No app store submission required!

### Android (Chrome/Edge/Samsung Internet)

1. **Deploy your app** to any hosting platform (see deployment options above)
2. **Open the deployed URL** in Chrome, Edge, or Samsung Internet
3. **Install the app:**
   - **Method 1**: Tap the browser menu (⋮) → "Add to Home Screen" or "Install App"
   - **Method 2**: Look for the "Install" banner that appears at the bottom
   - **Method 3**: Tap the install icon in the address bar (if available)
4. **Confirm installation** - The app icon will appear on your home screen
5. **Launch** - Tap the icon to open the PWA as a standalone app

**Features on Android:**
- ✅ Full-screen experience (no browser UI)
- ✅ Offline functionality
- ✅ Push notifications (when implemented)
- ✅ Access to camera for photo uploads
- ✅ Appears in app drawer and recent apps

### iOS (Safari)

1. **Deploy your app** to any hosting platform with HTTPS
2. **Open the deployed URL** in Safari (must be Safari, not Chrome)
3. **Install the app:**
   - Tap the **Share button** (□↑) at the bottom of the screen
   - Scroll down and tap **"Add to Home Screen"**
   - Edit the name if desired
   - Tap **"Add"** in the top right
4. **Launch** - The app icon appears on your home screen

**Important iOS Notes:**
- ⚠️ Must use Safari browser (Chrome/Firefox won't work for PWA installation)
- ⚠️ HTTPS is strictly required
- ⚠️ Some PWA features are limited on iOS (e.g., push notifications)
- ✅ Offline functionality works
- ✅ Camera access works for photo uploads

## Local Network Testing (Before Deployment)

Test your PWA on mobile devices during development:

### Step 1: Configure Vite for Network Access

Update `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [
    VitePWA({
      // ... existing config
    })
  ],
  server: {
    host: '0.0.0.0',  // Expose to local network
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### Step 2: Find Your Computer's IP Address

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Look for something like: inet 192.168.1.100
```

**On Windows:**
```bash
ipconfig
# Look for IPv4 Address under your active network adapter
```

### Step 3: Start Development Server

```bash
npm run dev
```

You'll see output like:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### Step 4: Access from Mobile

1. **Connect your phone to the same WiFi network** as your computer
2. **Open browser** on your phone
3. **Navigate to** `http://YOUR_IP:5173` (e.g., `http://192.168.1.100:5173`)

**Limitations:**
- ⚠️ PWA features require HTTPS, so installation won't work over HTTP
- ⚠️ You can test functionality but not the full PWA experience
- ✅ Good for testing UI and basic features

## Building Native Apps from PWA

### Option 1: PWABuilder (Recommended for Beginners)

[PWABuilder](https://pwabuilder.com) converts your PWA to native app packages.

**Steps:**
1. **Deploy your PWA** to a live URL with HTTPS
2. **Visit** [pwabuilder.com](https://pwabuilder.com)
3. **Enter your PWA URL** and click "Start"
4. **Review the report** - Fix any issues highlighted
5. **Click "Package For Stores"**
6. **Select platforms:**
   - **Android**: Download APK or generate Google Play package
   - **iOS**: Download package for App Store submission
   - **Windows**: Generate MSIX package

**Android APK Installation:**
```bash
# Transfer APK to phone and install
# Or use ADB:
adb install your-app.apk
```

**Advantages:**
- ✅ No coding required
- ✅ Generates app store packages
- ✅ Includes app signing
- ✅ Free to use

### Option 2: Capacitor (For Advanced Users)

[Capacitor](https://capacitorjs.com) wraps your PWA in native containers.

**Installation:**
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init "Cat Tracker" "com.catcare.tracker"

# Build your web app
npm run build

# Copy web assets to native projects
npx cap copy

# Add platforms
npx cap add android
npx cap add ios
```

**Android Development:**
```bash
# Open in Android Studio
npx cap open android

# Or build APK from command line
cd android
./gradlew assembleDebug
# APK will be in: android/app/build/outputs/apk/debug/
```

**iOS Development:**
```bash
# Open in Xcode (macOS only)
npx cap open ios

# Build and run on simulator or device from Xcode
```

**Advantages:**
- ✅ Full native API access
- ✅ Better performance
- ✅ More control over app behavior
- ✅ Can add native plugins

**Disadvantages:**
- ⚠️ Requires native development tools (Android Studio/Xcode)
- ⚠️ More complex setup
- ⚠️ Need to maintain native code

### Option 3: Cordova (Legacy Option)

Similar to Capacitor but older. Not recommended for new projects.

## Recommended Deployment Workflow

For the Cat Care Community PWA, we recommend:

### Quick Start (Easiest)

```bash
# 1. Test locally
npm install
npm run dev

# 2. Build for production
npm run build

# 3. Deploy to Netlify
npm install -g netlify-cli
netlify login
netlify deploy --prod

# 4. Share the URL with volunteers
# Example: https://cat-tracker-community.netlify.app

# 5. Users install via browser (no app store needed!)
```

### For App Store Distribution

If you need to distribute via Google Play or Apple App Store:

1. **Deploy PWA** to production URL
2. **Use PWABuilder** to generate app packages
3. **Test thoroughly** on real devices
4. **Submit to stores:**
   - Google Play: $25 one-time fee
   - Apple App Store: $99/year

## Creating Proper App Icons

Replace the placeholder icons for better branding:

### Required Icons

- `public/pwa-192x192.png` - 192×192px (Android)
- `public/pwa-512x512.png` - 512×512px (Android)
- `public/apple-touch-icon.png` - 180×180px (iOS)
- `public/favicon.ico` - 32×32px (Browser)

### Icon Generation Tools

**Option 1: Favicon.io**
1. Visit [favicon.io](https://favicon.io/)
2. Choose "Text", "Image", or "Emoji"
3. Customize your icon
4. Download and replace files in `public/`

**Option 2: RealFaviconGenerator**
1. Visit [realfavicongenerator.net](https://realfavicongenerator.net/)
2. Upload a high-res image (at least 512×512px)
3. Customize for each platform
4. Download package and extract to `public/`

**Option 3: Create Manually**
```bash
# Using ImageMagick
convert cat-icon.png -resize 192x192 public/pwa-192x192.png
convert cat-icon.png -resize 512x512 public/pwa-512x512.png
convert cat-icon.png -resize 180x180 public/apple-touch-icon.png
```

### Icon Design Tips

- ✅ Use simple, recognizable design
- ✅ High contrast colors
- ✅ Avoid text (hard to read at small sizes)
- ✅ Square format with transparent background
- ✅ Test on both light and dark backgrounds
- 🐱 Cat emoji or silhouette works great!

## PWA Installation Checklist

Before sharing with users, verify:

- [ ] App is deployed with HTTPS
- [ ] `manifest.json` is properly configured
- [ ] Service worker is registered
- [ ] Icons are high-quality (not placeholders)
- [ ] App name and description are set
- [ ] Theme color matches your branding
- [ ] Tested installation on Android
- [ ] Tested installation on iOS Safari
- [ ] Offline functionality works
- [ ] Camera access works for photo uploads
- [ ] App appears correctly in app drawer/home screen

## Troubleshooting Mobile Installation

### "Add to Home Screen" Not Appearing

**Android:**
- Ensure you're using HTTPS (or localhost for testing)
- Check that `manifest.json` is valid
- Verify service worker is registered
- Try clearing browser cache
- Use Chrome DevTools → Application → Manifest to debug

**iOS:**
- Must use Safari browser
- HTTPS is strictly required (no exceptions)
- Check that icons are properly sized
- Ensure `apple-touch-icon` is present

### PWA Not Working Offline

- Verify service worker is registered (check DevTools)
- Check `vite.config.js` PWA configuration
- Ensure workbox caching is configured
- Test by enabling airplane mode after first load

### Camera Not Working

- Check browser permissions
- Ensure HTTPS is enabled
- Verify `capture="environment"` attribute on file input
- Test on actual device (not simulator)

### App Looks Wrong After Installation

- Check viewport meta tag in `index.html`
- Verify theme color in manifest
- Test on different screen sizes
- Check for CSS issues specific to standalone mode

## Distribution Methods

### Method 1: Direct URL (Recommended)

**Pros:**
- ✅ No app store approval needed
- ✅ Instant updates
- ✅ No fees
- ✅ Works on all platforms

**Cons:**
- ⚠️ Users must manually install
- ⚠️ Less discoverable
- ⚠️ No app store reviews/ratings

**Best for:** Community apps, internal tools, beta testing

### Method 2: App Stores

**Pros:**
- ✅ More discoverable
- ✅ User trust (app store vetting)
- ✅ Reviews and ratings
- ✅ Familiar installation process

**Cons:**
- ⚠️ Approval process required
- ⚠️ Store fees ($25-$99)
- ⚠️ Update delays
- ⚠️ Must follow store guidelines

**Best for:** Public apps, monetized apps, wide distribution

### Method 3: Hybrid (Both)

Deploy as PWA and also submit to app stores. Users can choose their preferred method.

## Next Steps

1. **Deploy your app** using one of the hosting platforms above
2. **Test installation** on your own device
3. **Share the URL** with your volunteer community
4. **Provide installation instructions** (link to this guide)
5. **Monitor usage** and gather feedback
6. **Iterate and improve** based on user needs

## Support Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**Your Cat Care Community PWA is ready to deploy and install on mobile devices!** 🐱📱
