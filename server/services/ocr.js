import Tesseract from 'tesseract.js';

export async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: () => {}
    });

    const cleanedText = text.trim().replace(/\s+/g, ' ');
    
    return cleanedText.length > 0 ? cleanedText : null;
  } catch (error) {
    console.error('OCR error:', error);
    return null;
  }
}
