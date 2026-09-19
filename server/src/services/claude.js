import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractTextFromImage, parseDocumentLocally, I18N } from './ocrAnalyzer.js';

const LANGUAGE_CONFIG = {
  en: {
    english: 'English',
    native: 'English',
    actionPrefix: 'What you should do:',
    notVisibleMsg: 'Not clearly visible in the uploaded image.',
    unreadableMsg: "I couldn't read this document clearly. Please upload a clearer photo and try again."
  },
  hi: {
    english: 'Hindi',
    native: 'हिन्दी',
    actionPrefix: 'आपको क्या करना चाहिए:',
    notVisibleMsg: 'यह जानकारी साफ़ दिखाई नहीं दे रही है।',
    unreadableMsg: 'मैं इस दस्तावेज़ को ठीक से पढ़ नहीं पाया। कृपया साफ़ फोटो अपलोड करें और दोबारा कोशिश करें।'
  },
  bn: {
    english: 'Bengali',
    native: 'বাংলা',
    actionPrefix: 'আপনার যা করা উচিত:',
    notVisibleMsg: 'এই তথ্যটি পরিষ্কারভাবে দৃশ্যমান নয়।',
    unreadableMsg: 'আমি এই নথিটি স্পষ্টভাবে পড়তে পারিনি। অনুগ্রহ করে একটি পরিষ্কার ছবি আপলোড করে আবার চেষ্টা করুন।'
  },
  ta: {
    english: 'Tamil',
    native: 'தமிழ்',
    actionPrefix: 'நீங்கள் செய்ய வேண்டியது:',
    notVisibleMsg: 'இந்தத் தகவல் தெளிவாகத் தெரியவில்லை.',
    unreadableMsg: 'இந்த ஆவணத்தை என்னால் தெளிவாகப் படிக்க முடியவில்லை. தயவுசெய்து தெளிவான புகைப்படத்தைப் பதிவேற்றி மீண்டும் முயற்சிக்கவும்.'
  },
  te: {
    english: 'Telugu',
    native: 'తెలుగు',
    actionPrefix: 'మీరు ఏమి చేయాలి:',
    notVisibleMsg: 'ఈ సమాచారం స్పష్టంగా కనిపించడం లేదు.',
    unreadableMsg: 'నేను ఈ పత్రాన్ని స్పష్టంగా చదవలేకపోయాను. దయచేసి స్పష్టమైన ఫోటోను అప్‌లోడ్ చేసి మళ్ళీ ప్రయత్నించండి.'
  },
  mr: {
    english: 'Marathi',
    native: 'मराठी',
    actionPrefix: 'तुम्ही काय करावे:',
    notVisibleMsg: 'ही माहिती स्पष्टपणे दिसत नाही.',
    unreadableMsg: 'मला हे कागदपत्र नीट वाचता आले नाही. कृपया स्पष्ट फोटो अपलोड करा आणि पुन्हा प्रयत्न करा.'
  }
};

export async function generateExplanation({
  text,
  image, // { data: base64String, mediaType: 'image/jpeg' | 'image/png' | ... }
  language = 'hi',
  readingLevel = 'simple',
  isSample = false
}) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)?.trim();

  const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.hi;
  const targetLanguage = langConfig.english;
  const actionPrefix = langConfig.actionPrefix;
  const notVisibleText = langConfig.notVisibleMsg;

  // Level instructions
  const levelInstructions =
    readingLevel === 'simple'
      ? 'Target reading level: VERY SIMPLE. Use short, plain sentences and common everyday vocabulary. Avoid technical, legal, or bureaucratic jargon.'
      : 'Target reading level: CLEAR. Use plain, respectful conversational language with helpful context, completely free of dense jargon.';

  const systemPrompt = `You are Saral, an empathetic, highly accurate document explainer designed to help citizens, elderly people, and vernacular readers understand their real documents.

STRICT INSTRUCTIONS:
1. DOCUMENT TYPE DETECTION: Before explaining, inspect the document and identify what type of document it actually is (e.g. Marksheet / Report card, Identity document like Aadhaar/PAN, Bank statement/document, Insurance notice, Medical bill/summary, Legal notice, Government letter, Application form, Certificate, Invoice, or Other). Do NOT assume or force an incorrect document type.
2. ZERO HALLUCINATION / FACTUAL ACCURACY: Analyze ONLY the information visible in the document. Do NOT assume, infer, invent, or fabricate information that is not visible. If any value (like a marksheet score, student name, roll number, fee, or date) is unreadable or not visible, you MUST explicitly write: "${notVisibleText}". NEVER guess or make up marks, grades, names, dates, or numbers.
3. UNREADABLE CHECK: If the document is completely unreadable, too blurry, or contains no readable document content, reply ONLY with this exact sentence: "${langConfig.unreadableMsg}"
4. STRUCTURED RESPONSE: Format your output with clear sections:
Document type:
[Detected document type]

What this document is:
[Brief explanation of what this document is based strictly on visible content]

Important details:
- [Key detail 1 with name/subject/dates/numbers]
- [Key detail 2]
- [Key detail 3]

What it means:
[Plain-language explanation of the outcome, pass/fail status, or significance]

What you should do:
${actionPrefix} [One or two specific, practical next steps based ONLY on visible instructions]

5. EXCLUSIVE TARGET LANGUAGE: You MUST write your entire response exclusively in ${targetLanguage} (${langConfig.native}).
6. ${levelInstructions}`;

  // 1. If an image is uploaded, run OCR extraction first to inspect image content
  let ocrResult = null;
  if (image && image.data) {
    ocrResult = await extractTextFromImage(image.data);
    console.log(`OCR extraction completed: ${ocrResult.wordsCount} words found, confidence ${ocrResult.confidence}%`);

    // If OCR found no words at all, check if it's completely unreadable
    if (ocrResult.isUnreadable && !anthropicKey && !geminiKey) {
      return {
        rawText: langConfig.unreadableMsg,
        isNoText: true,
        documentType: '',
        explanation: '',
        actionableAdvice: '',
        unreadableMessage: langConfig.unreadableMsg
      };
    }
  }

  // 2. Multimodal AI Option A: Anthropic Claude Vision
  if (anthropicKey && anthropicKey !== 'mock' && anthropicKey.length > 10) {
    try {
      console.log('Using Anthropic Claude for vision/text document explanation...');
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      // Map model to valid model name
      let model = process.env.ANTHROPIC_MODEL || 'claude-3-7-sonnet-20250219';
      if (model.includes('claude-sonnet-4-6')) {
        model = 'claude-3-7-sonnet-20250219';
      }

      const content = [];

      if (image && image.data) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const mediaType = validTypes.includes(image.mediaType) ? image.mediaType : 'image/jpeg';
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: image.data
          }
        });
        const promptText = ocrResult?.text
          ? `Please analyze this uploaded document image. Read all text, identify the exact document type (e.g. marksheet, medical bill, id, notice), extract visible details accurately, and provide a structured explanation according to system instructions.\n\n(Supplementary OCR text detected: ${ocrResult.text.substring(0, 1000)})`
          : 'Please analyze this uploaded document image. Read all text, identify the exact document type (e.g. marksheet, medical bill, id, notice), extract visible details accurately, and provide a structured explanation according to system instructions.';

        content.push({ type: 'text', text: promptText });
      } else {
        content.push({
          type: 'text',
          text: `Please analyze this document text and provide a structured explanation according to system instructions:\n\n${text}`
        });
      }

      const response = await anthropic.messages.create({
        model,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content }]
      });

      const outputText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      return parseOutputResponse(outputText, actionPrefix, langConfig);
    } catch (anthropicErr) {
      console.error('Anthropic API Error:', anthropicErr?.message || anthropicErr);
      // Fall through to Gemini or OCR
    }
  }

  // 3. Multimodal AI Option B: Google Gemini Vision
  if (geminiKey && geminiKey.length > 10) {
    try {
      console.log('Using Google Gemini Vision for document explanation...');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt
      });

      const parts = [];
      if (image && image.data) {
        parts.push({
          inlineData: {
            mimeType: image.mediaType || 'image/jpeg',
            data: image.data
          }
        });
        parts.push({
          text: 'Analyze this uploaded document image accurately. Identify document type, extract visible details without hallucinating, and explain in structured format.'
        });
      } else {
        parts.push({ text: `Analyze this document text:\n\n${text}` });
      }

      const result = await model.generateContent(parts);
      const outputText = result.response.text();
      return parseOutputResponse(outputText, actionPrefix, langConfig);
    } catch (geminiErr) {
      console.error('Gemini API Error:', geminiErr?.message || geminiErr);
    }
  }

  // 4. Local OCR & Document Intelligence Analyzer (When no cloud API key is set, or as fallback)
  console.log('Using Local Document Intelligence & OCR Engine...');

  const documentContent = (image && image.data) ? ocrResult?.text : text;

  // If literally unreadable or empty
  if (!documentContent || documentContent.trim().length < 5) {
    return {
      rawText: langConfig.unreadableMsg,
      isNoText: true,
      documentType: '',
      explanation: '',
      actionableAdvice: '',
      unreadableMessage: langConfig.unreadableMsg
    };
  }

  // Real local analysis of extracted document text
  const localResult = parseDocumentLocally(documentContent, language, readingLevel);
  return localResult;
}

function parseOutputResponse(fullText, actionPrefix, langConfig) {
  if (
    fullText.includes('NO_TEXT_FOUND') ||
    fullText.includes(langConfig.unreadableMsg) ||
    fullText.length < 15
  ) {
    return {
      rawText: langConfig.unreadableMsg,
      isNoText: true,
      documentType: '',
      explanation: '',
      actionableAdvice: '',
      unreadableMessage: langConfig.unreadableMsg
    };
  }

  // Extract Document Type line if present
  let documentType = '';
  const lines = fullText.split('\n');
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i].trim();
    if (
      line.toLowerCase().startsWith('document type') ||
      line.startsWith('दस्तावेज़ का प्रकार') ||
      line.startsWith('নথির ধরন') ||
      line.startsWith('ஆவண வகை') ||
      line.startsWith('పత్రం రకం') ||
      line.startsWith('दस्तऐवजाचा प्रकार')
    ) {
      documentType = line.split(/[:\-]/)[1]?.trim() || '';
      break;
    }
  }

  // Extract actionable advice
  let mainExplanation = fullText;
  let actionableAdvice = '';

  const prefixIndex = fullText.lastIndexOf(actionPrefix);
  if (prefixIndex !== -1) {
    mainExplanation = fullText.substring(0, prefixIndex).trim();
    actionableAdvice = fullText.substring(prefixIndex).trim();
  } else {
    const engIndex = fullText.lastIndexOf('What you should do:');
    if (engIndex !== -1) {
      mainExplanation = fullText.substring(0, engIndex).trim();
      actionableAdvice = fullText.substring(engIndex).trim();
    }
  }

  return {
    rawText: fullText,
    isNoText: false,
    documentType,
    explanation: mainExplanation,
    actionableAdvice
  };
}
