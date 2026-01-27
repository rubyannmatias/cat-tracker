# AI Recognition Usage Guide

Your Cat Care Community PWA now uses **Hybrid AI Recognition** combining MobileNet and color analysis.

## How It Works

### 1. Cat Detection
When you upload a photo, MobileNet first verifies it's actually a cat by checking for:
- Cat
- Tabby
- Persian
- Siamese
- Kitten
- Tiger cat
- Egyptian cat

If no cat is detected, the photo goes straight to "Create New Cat" flow.

### 2. Feature Extraction
For cat images, the system extracts:
- **Visual features**: Patterns, shapes, textures (via MobileNet)
- **Dominant colors**: Top 5 colors from the image

### 3. Database Comparison
Compares the uploaded photo with the most recent photo of each cat in your database:
- **Feature similarity**: 60% weight
- **Color similarity**: 40% weight

### 4. Matching Results
- **Confidence > 0.4**: Shows as potential match
- **Top 3 matches**: Displayed for volunteer to confirm
- **No good matches**: Option to create new cat or save as unrecognized

## Recognition Accuracy

### Expected Performance
- **Visually distinct cats**: 75-85% accuracy
- **Similar-looking cats**: 50-60% accuracy
- **Same cat, different lighting**: 70-80% accuracy

### Best Results When
- ✅ Good lighting in photos
- ✅ Cat is main subject (not far away)
- ✅ Clear view of cat's body/face
- ✅ Consistent photo angles

### Lower Accuracy When
- ⚠️ Multiple cats in one photo
- ⚠️ Very dark or blurry photos
- ⚠️ Cat is partially hidden
- ⚠️ Extreme lighting differences

## Understanding Confidence Scores

- **80-100%**: Very likely the same cat
- **60-79%**: Probably the same cat
- **40-59%**: Possibly the same cat (check carefully)
- **< 40%**: Not shown (too low confidence)

## Tips for Better Recognition

### For Volunteers
1. **Take clear photos** - Good lighting, cat in focus
2. **Capture distinctive features** - Markings, colors, patterns
3. **Consistent angles** - Front or side views work best
4. **One cat per photo** - Easier for AI to analyze

### For Administrators
1. **Build photo library** - More photos per cat = better matching
2. **Update old photos** - Replace poor quality photos
3. **Document markings** - Text descriptions help volunteers confirm
4. **Monitor false matches** - Adjust confidence threshold if needed

## Customizing Recognition

### Adjust Confidence Threshold

Edit `server/services/recognition.js`:

```javascript
// Current threshold: 0.4
if (confidence > 0.4) {
  matches.push(...);
}

// More strict (fewer matches, higher accuracy)
if (confidence > 0.6) {
  matches.push(...);
}

// More lenient (more matches, lower accuracy)
if (confidence > 0.3) {
  matches.push(...);
}
```

### Adjust Feature vs Color Weight

```javascript
// Current: 60% features, 40% colors
const confidence = (featureSimilarity * 0.6) + (colorSimilarity * 0.4);

// Prioritize colors (good for distinctly colored cats)
const confidence = (featureSimilarity * 0.4) + (colorSimilarity * 0.6);

// Prioritize features (good for similar colored cats)
const confidence = (featureSimilarity * 0.8) + (colorSimilarity * 0.2);
```

## Performance

### First Photo Upload
- **Initial load**: 5-10 seconds (MobileNet downloads ~16MB)
- **Subsequent uploads**: 1-3 seconds per photo

### Memory Usage
- **Base**: ~200MB (model loaded)
- **Per comparison**: ~10-20MB (temporary)

### Server Requirements
- **CPU**: Any modern processor
- **RAM**: 512MB minimum, 1GB recommended
- **Disk**: 50MB for model cache

## Troubleshooting

### "Not a cat detected" for cat photos
- Photo might be too dark or blurry
- Cat might be too small in frame
- Try retaking with better lighting

### Wrong cat suggested
- Cats might look similar to AI
- Use "Create New Cat" or "Save as Unrecognized"
- Add more photos of the correct cat to improve future matching

### Slow recognition
- First upload is always slower (model loading)
- Check server resources (CPU/RAM)
- Reduce image size before upload if very large

### No matches shown
- No cats in database yet, or
- Uploaded cat looks very different from existing cats
- This is normal - just create a new profile

## Future Improvements

As your database grows, you can:
1. **Train custom model** with your specific cats (see AI-IMPLEMENTATION.md)
2. **Add facial recognition** for individual cat faces
3. **Implement pattern detection** for unique markings
4. **Use ensemble models** combining multiple AI approaches

## Technical Details

### Models Used
- **MobileNet v2**: Image classification (224x224 input)
- **Sharp**: Image processing and color extraction

### Processing Pipeline
1. Resize image to 224x224
2. Extract MobileNet predictions (top 5 classes)
3. Downsample to 50x50 for color analysis
4. Quantize colors to reduce noise
5. Compare with database photos
6. Calculate weighted confidence score
7. Return top 3 matches

### Data Flow
```
Upload Photo
    ↓
Verify Cat (MobileNet)
    ↓
Extract Features + Colors
    ↓
Load Database Cats
    ↓
For Each Cat:
  - Load latest photo
  - Extract features + colors
  - Calculate similarity
    ↓
Sort by confidence
    ↓
Return top 3 matches
```

## Privacy & Data

- ✅ All processing happens on your server
- ✅ No data sent to external APIs
- ✅ No tracking or analytics
- ✅ Photos stored locally only

## Support

If recognition isn't working well:
1. Check server logs for errors
2. Verify MobileNet model loaded successfully
3. Ensure photos are valid image files
4. Try with different photos
5. Report issues with example photos

---

**Remember**: AI is a helper, not perfect. Volunteers should always confirm matches!
