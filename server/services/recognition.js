import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let model = null;

async function loadModel() {
  if (!model) {
    console.log('Loading MobileNet model...');
    model = await mobilenet.load();
    console.log('✅ MobileNet model loaded successfully');
  }
  return model;
}

async function extractImageFeatures(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath)
      .resize(224, 224)
      .removeAlpha()
      .toBuffer();
    
    const tensor = tf.node.decodeImage(imageBuffer, 3);
    const model = await loadModel();
    
    const predictions = await model.classify(tensor);
    
    tensor.dispose();
    
    return predictions;
  } catch (error) {
    console.error('Error extracting features:', error);
    return [];
  }
}

async function extractDominantColors(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(50, 50)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const colorCounts = {};
    
    for (let i = 0; i < data.length; i += 3) {
      const r = Math.round(data[i] / 51) * 51;
      const g = Math.round(data[i + 1] / 51) * 51;
      const b = Math.round(data[i + 2] / 51) * 51;
      
      const key = `${r},${g},${b}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
    
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return { r, g, b };
      });
    
    return sortedColors;
  } catch (error) {
    console.error('Error extracting colors:', error);
    return [];
  }
}

function compareFeatures(features1, features2) {
  if (!features1.length || !features2.length) return 0;
  
  const labels1 = features1.map(p => p.className.toLowerCase());
  const labels2 = features2.map(p => p.className.toLowerCase());
  
  let matchScore = 0;
  
  for (let i = 0; i < Math.min(labels1.length, labels2.length); i++) {
    if (labels1[i] === labels2[i]) {
      matchScore += (5 - i) / 5;
    } else if (labels1.includes(labels2[i]) || labels2.includes(labels1[i])) {
      matchScore += 0.3;
    }
  }
  
  return Math.min(matchScore / 3, 1);
}

function compareColors(colors1, colors2) {
  if (!colors1.length || !colors2.length) return 0;
  
  let totalSimilarity = 0;
  
  for (const c1 of colors1) {
    let maxSimilarity = 0;
    
    for (const c2 of colors2) {
      const rDiff = Math.abs(c1.r - c2.r);
      const gDiff = Math.abs(c1.g - c2.g);
      const bDiff = Math.abs(c1.b - c2.b);
      
      const similarity = 1 - ((rDiff + gDiff + bDiff) / (255 * 3));
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    totalSimilarity += maxSimilarity;
  }
  
  return totalSimilarity / colors1.length;
}

function isCatImage(predictions) {
  const catKeywords = [
    'tabby', 'persian', 'siamese', 'egyptian cat', 'tiger cat',
    'siamese cat', 'persian cat', 'tiger cat', 'abyssinian',
    'bengal', 'birman', 'british shorthair', 'maine coon',
    'ragdoll', 'russian blue', 'scottish fold', 'sphynx'
  ];
  
  // Look for high-confidence cat predictions
  const catPredictions = predictions.filter(p => {
    const className = p.className.toLowerCase();
    const isCat = catKeywords.some(keyword => className.includes(keyword));
    const hasHighConfidence = p.probability > 0.3;
    return isCat && hasHighConfidence;
  });
  
  if (catPredictions.length === 0) {
    return false;
  }
  
  // Must have at least one cat prediction with decent confidence
  const maxCatConfidence = Math.max(...catPredictions.map(p => p.probability));
  return maxCatConfidence > 0.3;
}

export async function recognizeCat(imagePath) {
  try {
    console.log('Starting cat recognition...');
    
    const uploadedFeatures = await extractImageFeatures(imagePath);
    
    console.log('MobileNet predictions:', uploadedFeatures.map(p => ({
      className: p.className,
      probability: p.probability
    })));
    
    if (!isCatImage(uploadedFeatures)) {
      console.log('Not a cat detected in image');
      return [];
    }
    
    console.log('Cat detected! Extracting colors...');
    const uploadedColors = await extractDominantColors(imagePath);
    
    const cats = db.prepare(`
      SELECT c.*, p.url as photo_url, p.id as photo_id
      FROM cats c
      INNER JOIN photos p ON p.cat_id = c.id
      WHERE p.recognized = 1
      GROUP BY c.id
      HAVING p.date = (SELECT MAX(date) FROM photos WHERE cat_id = c.id AND recognized = 1)
    `).all();
    
    if (cats.length === 0) {
      console.log('No cats in database to compare with');
      return [];
    }
    
    console.log(`Comparing with ${cats.length} cats in database...`);
    
    const matches = [];
    
    for (const cat of cats) {
      try {
        const catPhotoPath = path.join(__dirname, '../..', cat.photo_url);
        
        const catFeatures = await extractImageFeatures(catPhotoPath);
        const catColors = await extractDominantColors(catPhotoPath);
        
        const featureSimilarity = compareFeatures(uploadedFeatures, catFeatures);
        const colorSimilarity = compareColors(uploadedColors, catColors);
        
        const confidence = (featureSimilarity * 0.6) + (colorSimilarity * 0.4);
        
        if (confidence > 0.4) {
          matches.push({
            id: cat.id,
            name: cat.name,
            markings: cat.markings,
            building: cat.building,
            spayNeuter: Boolean(cat.spay_neuter),
            confidence: confidence,
            photos: [{ url: cat.photo_url }]
          });
        }
      } catch (error) {
        console.error(`Error processing cat ${cat.id}:`, error.message);
      }
    }
    
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const topMatches = matches.slice(0, 3);
    console.log(`Found ${topMatches.length} potential matches`);
    
    return topMatches;
    
  } catch (error) {
    console.error('Recognition error:', error);
    return [];
  }
}
