# AI Cat Recognition Implementation Guide

This guide covers implementing real AI-based cat recognition without paid services.

## Option 1: TensorFlow.js + MobileNet (Recommended - Free)

### Overview
- **Cost**: 100% Free
- **Runs**: On your server (no external API calls)
- **Accuracy**: Good for basic cat detection
- **Setup Time**: ~30 minutes

### Installation

```bash
npm install @tensorflow/tfjs-node @tensorflow-models/mobilenet sharp
```

### Implementation

Update `server/services/recognition.js`:

```javascript
import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import fs from 'fs';
import { db } from '../database/init.js';

let model = null;

async function loadModel() {
  if (!model) {
    model = await mobilenet.load();
    console.log('✅ MobileNet model loaded');
  }
  return model;
}

async function extractFeatures(imagePath) {
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224)
    .toBuffer();
  
  const tensor = tf.node.decodeImage(imageBuffer, 3);
  const model = await loadModel();
  const predictions = await model.classify(tensor);
  
  tensor.dispose();
  
  return predictions;
}

function calculateSimilarity(features1, features2) {
  // Simple similarity based on top predictions
  const labels1 = features1.map(p => p.className);
  const labels2 = features2.map(p => p.className);
  
  const commonLabels = labels1.filter(l => labels2.includes(l));
  return commonLabels.length / Math.max(labels1.length, labels2.length);
}

export async function recognizeCat(imagePath) {
  try {
    const uploadedFeatures = await extractFeatures(imagePath);
    
    // Check if it's actually a cat
    const isCat = uploadedFeatures.some(p => 
      p.className.toLowerCase().includes('cat') || 
      p.className.toLowerCase().includes('tabby') ||
      p.className.toLowerCase().includes('persian') ||
      p.className.toLowerCase().includes('siamese')
    );
    
    if (!isCat) {
      console.log('Not a cat detected');
      return [];
    }
    
    // Get all cats with photos
    const cats = db.prepare(`
      SELECT c.*, p.url as photo_url, p.id as photo_id
      FROM cats c
      INNER JOIN photos p ON p.cat_id = c.id
      ORDER BY p.date DESC
    `).all();
    
    const matches = [];
    const seenCats = new Set();
    
    for (const cat of cats) {
      if (seenCats.has(cat.id)) continue;
      seenCats.add(cat.id);
      
      try {
        const catPhotoPath = cat.photo_url.replace('/uploads/', 'uploads/');
        const catFeatures = await extractFeatures(catPhotoPath);
        const similarity = calculateSimilarity(uploadedFeatures, catFeatures);
        
        if (similarity > 0.3) {
          matches.push({
            id: cat.id,
            name: cat.name,
            markings: cat.markings,
            building: cat.building,
            spayNeuter: Boolean(cat.spay_neuter),
            confidence: similarity,
            photos: [{ url: cat.photo_url }]
          });
        }
      } catch (error) {
        console.error(`Error processing cat ${cat.id}:`, error);
      }
    }
    
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, 3);
    
  } catch (error) {
    console.error('Recognition error:', error);
    return [];
  }
}
```

### Pros
- ✅ Completely free
- ✅ No API keys needed
- ✅ Works offline
- ✅ Fast processing

### Cons
- ⚠️ Basic feature matching (not cat-specific)
- ⚠️ Requires server resources
- ⚠️ May need fine-tuning

---

## Option 2: Face Recognition Library (Better Accuracy)

### Overview
- **Cost**: Free
- **Accuracy**: Better for individual cat identification
- **Best for**: Distinguishing between specific cats

### Installation

```bash
npm install face-api.js canvas
```

### Implementation

```javascript
import * as faceapi from 'face-api.js';
import canvas from 'canvas';
import fs from 'fs';

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
}

async function detectCatFace(imagePath) {
  const img = await canvas.loadImage(imagePath);
  const detections = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detections;
}
```

**Note**: This requires downloading model files first.

---

## Option 3: Custom ML Model (Advanced)

Train your own cat recognition model using your community's cat photos.

### Tools
- **Teachable Machine** (Google) - No code required
- **TensorFlow** - More control
- **PyTorch** - Python-based

### Steps

1. **Collect Training Data**
   - Gather 20-50 photos per cat
   - Ensure variety (angles, lighting)

2. **Use Teachable Machine**
   - Visit [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com)
   - Upload photos for each cat
   - Train model (free, in browser)
   - Export as TensorFlow.js model

3. **Integrate Model**
```javascript
import * as tf from '@tensorflow/tfjs-node';

const model = await tf.loadLayersModel('file://./models/model.json');

async function recognizeCat(imagePath) {
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224)
    .toBuffer();
  
  const tensor = tf.node.decodeImage(imageBuffer, 3)
    .expandDims(0)
    .toFloat()
    .div(255.0);
  
  const predictions = await model.predict(tensor);
  const probabilities = await predictions.data();
  
  // Map probabilities to cat IDs
  return probabilities;
}
```

---

## Option 4: Hybrid Approach (Recommended for Production)

Combine multiple techniques:

1. **MobileNet** - Verify it's a cat
2. **Color Analysis** - Match coat colors
3. **Pattern Detection** - Identify markings
4. **Size Estimation** - Compare cat sizes

### Color-Based Matching

```javascript
import sharp from 'sharp';

async function extractDominantColors(imagePath) {
  const { dominant } = await sharp(imagePath)
    .resize(100, 100)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Analyze RGB values
  return dominant;
}

function compareColors(color1, color2) {
  const rDiff = Math.abs(color1.r - color2.r);
  const gDiff = Math.abs(color1.g - color2.g);
  const bDiff = Math.abs(color1.b - color2.b);
  
  const totalDiff = rDiff + gDiff + bDiff;
  return 1 - (totalDiff / (255 * 3));
}
```

---

## Paid Options (If Free Options Don't Work)

### AWS Rekognition
- **Cost**: $1 per 1,000 images
- **Accuracy**: High
- **Setup**: Requires AWS account

```javascript
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";

const client = new RekognitionClient({ region: "us-east-1" });

async function detectCat(imageBytes) {
  const command = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MaxLabels: 10
  });
  
  const response = await client.send(command);
  return response.Labels;
}
```

### Google Cloud Vision
- **Cost**: $1.50 per 1,000 images (first 1,000 free/month)
- **Accuracy**: Very high

### Azure Computer Vision
- **Cost**: $1 per 1,000 images (first 5,000 free)

---

## Recommended Implementation Path

### Phase 1: Start Simple (Week 1)
1. Implement MobileNet for cat detection
2. Add color-based matching
3. Test with your community

### Phase 2: Improve (Week 2-3)
1. Collect feedback on accuracy
2. Add pattern detection
3. Fine-tune thresholds

### Phase 3: Advanced (Month 2+)
1. Train custom model with Teachable Machine
2. Implement face recognition for individual cats
3. Add confidence scoring

---

## Quick Start: MobileNet Implementation

### 1. Install Dependencies

```bash
npm install @tensorflow/tfjs-node @tensorflow-models/mobilenet sharp
```

### 2. Update Recognition Service

Replace `server/services/recognition.js` with the MobileNet implementation above.

### 3. Test

```bash
npm run dev
# Upload a cat photo
# Check console for "MobileNet model loaded"
```

### 4. Monitor Performance

- First load: ~5-10 seconds (model download)
- Subsequent recognitions: ~1-2 seconds per photo
- Memory usage: ~200-300MB

---

## Troubleshooting

### Model Loading Slow
- Cache the model after first load
- Use `@tensorflow/tfjs-node` (not browser version)

### Out of Memory
- Reduce image size before processing
- Process one image at a time
- Use `tensor.dispose()` to free memory

### Low Accuracy
- Collect more training photos
- Ensure good lighting in photos
- Focus on distinctive features (markings, colors)

---

## Performance Optimization

### Caching
```javascript
const featureCache = new Map();

async function getCachedFeatures(photoId, imagePath) {
  if (featureCache.has(photoId)) {
    return featureCache.get(photoId);
  }
  
  const features = await extractFeatures(imagePath);
  featureCache.set(photoId, features);
  return features;
}
```

### Background Processing
```javascript
import { Worker } from 'worker_threads';

function recognizeInBackground(imagePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./workers/recognition.js');
    worker.postMessage({ imagePath });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

---

## Summary

**For your cat tracker, I recommend:**

1. **Start with MobileNet** (free, easy, no API keys)
2. **Add color matching** for better accuracy
3. **Upgrade to custom model** once you have 100+ photos per cat

**No AWS Bedrock or paid services needed!** The free options work well for community cat tracking.

Would you like me to implement the MobileNet solution now?
