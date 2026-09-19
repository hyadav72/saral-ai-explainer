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
      ? 'TARGET AUDIENCE & TONE: VERY SIMPLE. Write as if you are a kind, patient teacher or family member explaining to an elderly citizen or someone with limited formal education. Use short, crisp sentences and warm everyday conversational vocabulary. If technical, medical, or legal terms appear, explain them immediately in plain everyday analogies. Focus directly on answering: "What does this mean for me?" and "What exact step should I take today?".'
      : 'TARGET AUDIENCE & TONE: CLEAR & COMPREHENSIVE. Provide a thorough, well-structured explanation in plain language. Break down financial calculations and legal clauses clearly while avoiding bureaucratic or obscure jargon. Keep the tone respectful, clear, and reassuring.';

  const systemPrompt = `You are Saral, an empathetic, highly skilled document explainer designed to bridge the literacy and language divide for everyday citizens.

CORE EXPLANATION PRINCIPLES:
1. FIRST IDENTIFY DOCUMENT TYPE: Inspect the document carefully and determine its real-world category (e.g. Marksheet / Academic Report Card, Hospital Discharge Bill, Health Insurance Query Notice, Tenancy Eviction Notice, Identity Document, Bank Statement, Government Scheme Letter, Invoice, or Certificate).
2. ZERO HALLUCINATION / 100% FACTUAL FIDELITY: Analyze ONLY the information visible in the document. Never guess, extrapolate, or invent names, dates, roll numbers, marks, penalty sums, or deadlines. If any specific detail is unreadable, faded, or absent, you MUST state: "${notVisibleText}".
3. UNREADABLE CHECK: If the document is completely illegible, blurry, blank, or contains no readable official document text, respond ONLY with this exact sentence: "${langConfig.unreadableMsg}"
4. EXCELLENCE IN EXPLAINING:
   - For Marksheets: Clearly identify the student, board/school, subjects, marks/grades, total score, percentage, and pass/fail outcome. Explain what the division or percentage means for the student.
   - For Medical Bills: Demystify complex diagnoses into simple everyday language. Break down gross hospital charges, insurance portion, and out-of-pocket balance due.
   - For Insurance Notices: Explain why the claim was questioned or held, decode the cited clause in plain terms, and state the exact required missing papers and calendar deadline.
   - For Tenancy / Legal Notices: Explain the core dispute, the exact outstanding balance, the cure window, and how to pay with written verification.
5. REQUIRED STRUCTURED LAYOUT: Format your output with clear, legible sections:
Document type:
[Exact detected document type]

What this document is:
[Warm, human explanation of what this document is based strictly on visible content]

Important details:
- [Detail 1: Name / ID / Reference number]
- [Detail 2: Key figures / Scores / Dates / Amounts]
- [Detail 3: Additional relevant visible terms]

What it means:
[Plain-language breakdown of the implications, pass/fail status, legal consequences, or financial breakdown]

What you should do:
${actionPrefix} [Clear, prioritized, practical next steps that the person must take based strictly on the document instructions]

6. EXCLUSIVE TARGET LANGUAGE: You MUST write your entire response exclusively in ${targetLanguage} (${langConfig.native}).
7. ${levelInstructions}`;

  // OPTIMIZED WORKFLOW:
  // If an AI Vision key is available, call the multimodal model directly for maximum speed and comprehension!
  // If no cloud API key is set, or if the cloud API fails, seamlessly use the local OCR & Document Intelligence engine.

  // 1. Multimodal AI: Anthropic Claude Vision
  if (anthropicKey && anthropicKey !== 'mock' && anthropicKey.length > 10) {
    try {
      console.log('⚡ Running Anthropic Claude multimodal document analysis...');
      const anthropic = new Anthropic({ apiKey: anthropicKey });

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
        content.push({
          type: 'text',
          text: 'Please carefully analyze this uploaded document image. Identify document type, extract all visible details with zero hallucination, explain it clearly, and output in the structured format.'
        });
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
      console.warn('Anthropic API error, falling back to next provider / local engine:', anthropicErr?.message || anthropicErr);
    }
  }

  // 2. Multimodal AI: Google Gemini Vision
  if (geminiKey && geminiKey.length > 10) {
    try {
      console.log('⚡ Running Google Gemini Vision document analysis...');
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
          text: 'Carefully analyze this uploaded document image. Identify the document type, extract visible details accurately without hallucinating, and provide a structured explanation.'
        });
      } else {
        parts.push({ text: `Analyze this document text:\n\n${text}` });
      }

      const result = await model.generateContent(parts);
      const outputText = result.response.text();
      return parseOutputResponse(outputText, actionPrefix, langConfig);
    } catch (geminiErr) {
      console.warn('Gemini API error, falling back to local OCR engine:', geminiErr?.message || geminiErr);
    }
  }

  // 3. Local OCR & Document Intelligence Engine (Runs offline or as zero-cost engine)
  console.log('⚡ Running Local Document Intelligence & OCR Engine...');

  let documentContent = text;

  if (image && image.data) {
    const ocrResult = await extractTextFromImage(image.data);
    console.log(`OCR extraction: ${ocrResult.wordsCount} words found, confidence ${ocrResult.confidence}%`);

    if (ocrResult.isUnreadable) {
      return {
        rawText: langConfig.unreadableMsg,
        isNoText: true,
        documentType: '',
        explanation: '',
        actionableAdvice: '',
        unreadableMessage: langConfig.unreadableMsg
      };
    }
    documentContent = ocrResult.text;
  }

  // If text is too short or empty
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

  // Run local intelligent document analyzer
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
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    if (
      line.toLowerCase().startsWith('document type') ||
      line.startsWith('दस्तावेज़ का प्रकार') ||
      line.startsWith('नथिर ধরন') ||
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
