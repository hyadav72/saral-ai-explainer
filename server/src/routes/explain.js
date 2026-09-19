import express from 'express';
import { generateExplanation } from '../services/claude.js';
import { historyStore } from '../services/store.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const {
      text,
      image,
      language = 'en',
      readingLevel = 'simple',
      deviceId,
      fileName
    } = req.body;

    // Check if either text or image was supplied
    const hasText = Boolean(text && text.trim().length > 0);
    const hasImage = Boolean(image && image.data && image.data.length > 0);

    if (!hasText && !hasImage) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_INPUT',
        message: 'Please paste document text or upload a document photo to begin.'
      });
    }

    // Call Claude AI service
    const result = await generateExplanation({
      text,
      image,
      language,
      readingLevel
    });

    if (result.isNoText) {
      return res.status(200).json({
        success: false,
        code: 'NO_TEXT_FOUND',
        message: "We couldn't find readable document text in that input. Please try taking a clearer, well-lit photo or paste the text directly."
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
      explanation: result.explanation,
      actionableAdvice: result.actionableAdvice,
      fileName: fileName || null
    });

    return res.status(200).json({
      success: true,
      id: savedRecord.id,
      timestamp: savedRecord.timestamp,
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
