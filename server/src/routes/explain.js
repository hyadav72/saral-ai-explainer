import express from 'express';
import { generateExplanation } from '../services/claude.js';
import { historyStore } from '../services/store.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const {
      text,
      image,
      language = 'hi',
      readingLevel = 'simple',
      deviceId,
      fileName,
      isSample = false
    } = req.body;

    const hasText = Boolean(text && text.trim().length > 0);
    const hasImage = Boolean(image && image.data && image.data.length > 0);

    if (!hasText && !hasImage) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_INPUT',
        message: 'Please paste document text or upload a photo of your document.'
      });
    }

    // Call Multimodal Vision & Document Intelligence Engine
    const result = await generateExplanation({
      text,
      image,
      language,
      readingLevel,
      isSample
    });

    if (result.isNoText) {
      return res.status(200).json({
        success: false,
        code: 'UNREADABLE_DOCUMENT',
        message:
          result.unreadableMessage ||
          'मैं इस दस्तावेज़ को ठीक से पढ़ नहीं पाया। कृपया साफ़ फोटो अपलोड करें और दोबारा कोशिश करें।'
      });
    }

    // Save to persistent history store
    const excerpt = hasText
      ? text.trim().substring(0, 140)
      : `Photo: ${fileName || 'Uploaded document'}`;

    const savedRecord = historyStore.add({
      deviceId: deviceId || req.headers['x-device-id'] || 'anonymous',
      originalExcerpt: excerpt,
      language,
      readingLevel,
      mode: hasImage ? 'photo' : 'text',
      documentType: result.documentType || '',
      explanation: result.explanation,
      actionableAdvice: result.actionableAdvice,
      fileName: fileName || null
    });

    return res.status(200).json({
      success: true,
      id: savedRecord.id,
      timestamp: savedRecord.timestamp,
      documentType: result.documentType || '',
      explanation: result.explanation,
      actionableAdvice: result.actionableAdvice,
      rawText: result.rawText,
      language,
      readingLevel,
      mode: savedRecord.mode
    });
  } catch (error) {
    console.error('Explanation Route Error:', error);
    next(error);
  }
});

export default router;
