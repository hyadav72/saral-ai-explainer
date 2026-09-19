import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find local tessdata folder
const candidateDirs = [
  path.resolve(__dirname, '../../tessdata'),
  path.resolve(__dirname, '../../../tessdata'),
  path.resolve(process.cwd(), 'tessdata'),
  path.resolve(process.cwd(), 'server/tessdata')
];

let localTessData = null;
for (const dir of candidateDirs) {
  if (fs.existsSync(path.join(dir, 'eng.traineddata'))) {
    localTessData = dir;
    break;
  }
}

let workerInstance = null;

async function getWorker() {
  if (!workerInstance) {
    const cacheDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
    const options = {
      cachePath: cacheDir,
      gzip: false
    };
    if (localTessData) {
      options.langPath = localTessData;
    }
    workerInstance = await createWorker('eng', 1, options);
  }
  return workerInstance;
}

export async function extractTextFromImage(base64Data) {
  // Wrap in a 6.5 second timeout to guarantee it never hangs on serverless functions
  const ocrPromise = (async () => {
    const buffer = Buffer.from(base64Data, 'base64');
    const worker = await getWorker();
    const ret = await worker.recognize(buffer);
    const rawText = (ret.data?.text || '').trim();

    const words = rawText.match(/[a-zA-Z0-9]{2,}/g) || [];
    const confidence = ret.data?.confidence || 0;

    return {
      text: rawText,
      wordsCount: words.length,
      confidence,
      isUnreadable: words.length < 3
    };
  })();

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      console.warn('OCR processing hit 6.5s safety limit — continuing with fallback analysis.');
      resolve({
        text: '',
        wordsCount: 0,
        confidence: 0,
        isUnreadable: true
      });
    }, 6500);
  });

  try {
    return await Promise.race([ocrPromise, timeoutPromise]);
  } catch (err) {
    console.error('Tesseract OCR extraction error:', err);
    return {
      text: '',
      wordsCount: 0,
      confidence: 0,
      isUnreadable: true
    };
  }
}

export const I18N = {
  en: {
    docTypeTitle: 'Document type:',
    whatIsTitle: 'What this document is:',
    detailsTitle: 'Important details:',
    meansTitle: 'What it means:',
    actionTitle: 'What you should do:',
    notVisible: 'Not clearly visible in the uploaded image.',
    unreadableError: "I couldn't read this document clearly. Please upload a clearer, well-lit photo and try again.",
    types: {
      marksheet: 'Marksheet / Academic Report Card',
      identity: 'Identity Document / ID Card',
      medical: 'Medical Report / Hospital Bill',
      insurance: 'Insurance Notice / Claim Document',
      bank: 'Bank Document / Statement',
      legal: 'Legal Notice / Tenancy Agreement',
      invoice: 'Invoice / Bill',
      certificate: 'Certificate',
      application: 'Application Form',
      other: 'Official Document'
    }
  },
  hi: {
    docTypeTitle: 'दस्तावेज़ का प्रकार:',
    whatIsTitle: 'यह दस्तावेज़ क्या है:',
    detailsTitle: 'मुख्य विवरण:',
    meansTitle: 'इसका क्या मतलब है:',
    actionTitle: 'आपको क्या करना चाहिए:',
    notVisible: 'यह जानकारी साफ़ दिखाई नहीं दे रही है।',
    unreadableError: 'मैं इस दस्तावेज़ को ठीक से पढ़ नहीं पाया। कृपया साफ़ फोटो अपलोड करें और दोबारा कोशिश करें।',
    types: {
      marksheet: 'अंकतालिका (Marksheet / Report Card)',
      identity: 'पहचान पत्र (Identity Card)',
      medical: 'अस्पताल का बिल या मेडिकल रिपोर्ट (Medical Bill)',
      insurance: 'बीमा संबंधी पत्र या क्लेम नोटिस (Insurance Notice)',
      bank: 'बैंक संबंधी दस्तावेज़ (Bank Document)',
      legal: 'कानूनी नोटिस या समझौता (Legal Notice)',
      invoice: 'रसीद या बिल (Invoice / Bill)',
      certificate: 'प्रमाण पत्र (Certificate)',
      application: 'आवेदन पत्र (Application Form)',
      other: 'आधिकारिक दस्तावेज़ (Official Document)'
    }
  },
  bn: {
    docTypeTitle: 'নথির ধরন:',
    whatIsTitle: 'এই নথিটি কী:',
    detailsTitle: 'গুরুত্বপূর্ণ বিবরণ:',
    meansTitle: 'এর অর্থ কী:',
    actionTitle: 'আপনার যা করা উচিত:',
    notVisible: 'এই তথ্যটি পরিষ্কারভাবে দৃশ্যমান নয়।',
    unreadableError: 'আমি এই নথিটি স্পষ্টভাবে পড়তে পারিনি। অনুগ্রহ করে একটি পরিষ্কার ছবি আপলোড করে আবার চেষ্টা করুন।',
    types: {
      marksheet: 'নম্বরপত্র / মার্কশিট (Marksheet)',
      identity: 'পরিচয়পত্র (ID Card)',
      medical: 'চিকিৎসা সংক্রান্ত বিল বা রিপোর্ট (Medical Bill)',
      insurance: 'বীমা সংক্রান্ত নোটিশ (Insurance Notice)',
      bank: 'ব্যাংক সংক্রান্ত নথি (Bank Document)',
      legal: 'আইনি নোটিশ (Legal Notice)',
      invoice: 'বিল বা চালান (Invoice)',
      certificate: 'শংসাপত্র (Certificate)',
      application: 'আবেদনপত্র (Application Form)',
      other: 'সরকারি বা প্রাতিষ্ঠানিক নথি (Official Document)'
    }
  },
  ta: {
    docTypeTitle: 'ஆவண வகை:',
    whatIsTitle: 'இந்த ஆவணம் என்ன:',
    detailsTitle: 'முக்கிய விவரங்கள்:',
    meansTitle: 'இதன் பொருள் என்ன:',
    actionTitle: 'நீங்கள் செய்ய வேண்டியது:',
    notVisible: 'இந்தத் தகவல் தெளிவாகத் தெரியவில்லை.',
    unreadableError: 'இந்த ஆவணத்தை என்னால் தெளிவாகப் படிக்க முடியவில்லை. தயவுசெய்து தெளிவான புகைப்படத்தைப் பதிவேற்றி மீண்டும் முயற்சிக்கவும்.',
    types: {
      marksheet: 'மதிப்பெண் பட்டியல் (Marksheet)',
      identity: 'அடையாள அட்டை (Identity Card)',
      medical: 'மருத்துவக் கட்டண ரசீது (Medical Bill)',
      insurance: 'காப்பீட்டு அறிவிப்பு (Insurance Notice)',
      bank: 'வங்கி ஆவணம் (Bank Document)',
      legal: 'சட்ட அறிவிப்பு (Legal Notice)',
      invoice: 'ரசீது (Invoice)',
      certificate: 'சான்றிதழ் (Certificate)',
      application: 'விண்ணப்பப் படிவம் (Application Form)',
      other: 'அதிகாரப்பூர்வ ஆவணம் (Official Document)'
    }
  },
  te: {
    docTypeTitle: 'పత్రం రకం:',
    whatIsTitle: 'ఈ పత్రం ఏమిటి:',
    detailsTitle: 'ముఖ్యమైన వివరాలు:',
    meansTitle: 'దీని అర్థం ఏమిటి:',
    actionTitle: 'మీరు ఏమి చేయాలి:',
    notVisible: 'ఈ సమాచారం స్పష్టంగా కనిపించడం లేదు.',
    unreadableError: 'నేను ఈ పత్రాన్ని స్పష్టంగా చదవలేకపోయాను. దయచేసి స్పష్టమైన ఫోటోను అప్‌లోడ్ చేసి మళ్ళీ ప్రయత్నించండి.',
    types: {
      marksheet: 'మార్కుల జాబితా (Marksheet)',
      identity: 'గుర్తింపు కార్డు (Identity Card)',
      medical: 'వైద్య బిల్లు (Medical Bill)',
      insurance: 'బీమా నోటీసు (Insurance Notice)',
      bank: 'బ్యాంకు పత్రం (Bank Document)',
      legal: 'చట్టపరమైన నోటీసు (Legal Notice)',
      invoice: 'ఇన్‌వాయిస్ / రసీదు (Invoice)',
      certificate: 'ధృవీకరణ పత్రం (Certificate)',
      application: 'దరఖాస్తు ఫారమ్ (Application Form)',
      other: 'అధికారిక పత్రం (Official Document)'
    }
  },
  mr: {
    docTypeTitle: 'दस्तऐवजाचा प्रकार:',
    whatIsTitle: 'हे दस्तऐवज काय आहे:',
    detailsTitle: 'महत्त्वाचे तपशील:',
    meansTitle: 'याचा अर्थ काय:',
    actionTitle: 'तुम्ही काय करावे:',
    notVisible: 'ही माहिती स्पष्टपणे दिसत नाही.',
    unreadableError: 'मला हे कागदपत्र नीट वाचता आले नाही. कृपया स्पष्ट फोटो अपलोड करा आणि पुन्हा प्रयत्न करा.',
    types: {
      marksheet: 'गुणपत्रिका (Marksheet)',
      identity: 'ओळखपत्र (Identity Card)',
      medical: 'वैद्यकीय बिल (Medical Bill)',
      insurance: 'विमा नोटीस (Insurance Notice)',
      bank: 'बँक कागदपत्र (Bank Document)',
      legal: 'कायदेशीर नोटीस (Legal Notice)',
      invoice: 'पावती / देयक (Invoice)',
      certificate: 'प्रमाणपत्र (Certificate)',
      application: 'अर्ज (Application Form)',
      other: 'अधिकृत कागदपत्र (Official Document)'
    }
  }
};

export function detectDocumentType(text) {
  const lower = (text || '').toLowerCase();

  const marksheetTerms = [
    'marksheet',
    'mark sheet',
    'statement of marks',
    'grade sheet',
    'gradesheet',
    'report card',
    'roll no',
    'enrollment no',
    'registration no',
    'semester',
    'examination',
    'cbse',
    'icse',
    'board of',
    'theory',
    'practical',
    'maximum marks',
    'marks obtained',
    'total marks',
    'cgpa',
    'sgpa',
    'percentage',
    'passed',
    'failed',
    'subject code'
  ];
  if (marksheetTerms.filter((term) => lower.includes(term)).length >= 2 || lower.includes('marksheet') || lower.includes('statement of marks')) {
    return 'marksheet';
  }

  if (
    lower.includes('aadhaar') ||
    lower.includes('unique identification') ||
    (lower.includes('government of india') && (lower.includes('dob') || lower.includes('uidai'))) ||
    lower.includes('income tax department') ||
    lower.includes('permanent account number')
  ) {
    return 'identity';
  }

  if (
    lower.includes('hospital') ||
    lower.includes('patient') ||
    lower.includes('discharge') ||
    lower.includes('admission date') ||
    lower.includes('physician') ||
    lower.includes('diagnosis') ||
    lower.includes('ipd') ||
    lower.includes('opd') ||
    lower.includes('clinic')
  ) {
    return 'medical';
  }

  if (
    lower.includes('insurance') ||
    lower.includes('policy') ||
    lower.includes('claim') ||
    lower.includes('sum insured') ||
    lower.includes('tpa') ||
    lower.includes('repudiation')
  ) {
    return 'insurance';
  }

  if (
    lower.includes('bank') ||
    lower.includes('account number') ||
    lower.includes('ifsc') ||
    lower.includes('account statement') ||
    (lower.includes('debit') && lower.includes('credit'))
  ) {
    return 'bank';
  }

  if (
    lower.includes('legal notice') ||
    lower.includes('advocate') ||
    lower.includes('notice to vacate') ||
    lower.includes('lease') ||
    lower.includes('tenancy') ||
    lower.includes('court')
  ) {
    return 'legal';
  }

  if (
    lower.includes('invoice') ||
    lower.includes('gstin') ||
    lower.includes('tax invoice') ||
    lower.includes('bill to')
  ) {
    return 'invoice';
  }

  if (
    lower.includes('certificate') ||
    lower.includes('certify that') ||
    lower.includes('hereby certify')
  ) {
    return 'certificate';
  }

  if (
    lower.includes('application form') ||
    lower.includes('applicant') ||
    lower.includes('registration form')
  ) {
    return 'application';
  }

  return 'other';
}

export function parseDocumentLocally(text, language = 'hi', readingLevel = 'simple') {
  const i18n = I18N[language] || I18N.hi;
  const docType = detectDocumentType(text);
  const docTypeLabel = i18n.types[docType] || i18n.types.other;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let whatIs = '';
  const details = [];
  let whatMeans = '';
  let whatToDo = '';

  if (docType === 'marksheet') {
    let studentName = null;
    let rollNo = null;
    let courseName = null;

    for (const line of lines) {
      const l = line.toLowerCase();
      if (!studentName && (l.includes('name') || l.includes('candidate') || l.includes('student'))) {
        const parts = line.split(/[:\-]/);
        if (parts[1] && parts[1].trim().length > 1) {
          studentName = parts[1].trim();
        }
      }
      if (!rollNo && (l.includes('roll') || l.includes('reg') || l.includes('enrollment'))) {
        const parts = line.split(/[:\-]/);
        if (parts[1] && parts[1].trim().length > 1) {
          rollNo = parts[1].trim();
        }
      }
      if (!courseName && (l.includes('class') || l.includes('standard') || l.includes('course') || l.includes('semester') || l.includes('cbse') || l.includes('board'))) {
        courseName = line;
      }
    }

    const subjectList = [];
    const commonSubjects = [
      'english', 'hindi', 'mathematics', 'math', 'science', 'physics',
      'chemistry', 'biology', 'social', 'history', 'geography', 'computer',
      'economics', 'accountancy', 'business', 'sanskrit', 'bengali', 'tamil', 'telugu', 'marathi'
    ];

    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const subj of commonSubjects) {
        if (lower.includes(subj)) {
          subjectList.push(line);
          break;
        }
      }
    }

    let totalMarks = null;
    let percentage = null;
    let resultStatus = null;

    for (const line of lines) {
      const l = line.toLowerCase();
      if (!totalMarks && (l.includes('total') || l.includes('grand total') || l.includes('aggregate'))) {
        totalMarks = line;
      }
      if (!percentage && (l.includes('percentage') || l.includes('%') || l.includes('cgpa') || l.includes('sgpa'))) {
        percentage = line;
      }
      if (!resultStatus && (l.includes('pass') || l.includes('fail') || l.includes('division') || l.includes('promoted'))) {
        resultStatus = line;
      }
    }

    if (language === 'hi') {
      whatIs = readingLevel === 'simple'
        ? 'यह एक स्कूल या कॉलेज की अंकतालिका (मार्कशीट) है। इसमें विद्यार्थी द्वारा परीक्षा में हासिल किए गए विषयवार अंकों और अंतिम परिणाम की जानकारी दी गई है।'
        : 'यह एक शैक्षणिक अंकतालिका (स्टेटमेंट ऑफ मार्क्स) है। इसमें विद्यार्थी के विभिन्न विषयों के सैद्धांतिक एवं प्रायोगिक प्राप्तांक, कुल योग और उत्तीर्णता की स्थिति का आधिकारिक ब्यौरा दर्ज है।';

      details.push(`विद्यार्थी का नाम: ${studentName || i18n.notVisible}`);
      details.push(`अनुक्रमांक (Roll No): ${rollNo || i18n.notVisible}`);
      details.push(`कक्षा व बोर्ड: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) {
        details.push(`दिखाई दे रहे विषय व अंक: ${subjectList.slice(0, 6).join('; ')}`);
      } else {
        details.push(`विषय व अंक: ${i18n.notVisible}`);
      }
      details.push(`कुल प्राप्तांक: ${totalMarks || i18n.notVisible}`);
      details.push(`प्रतिशत / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`परिणाम (Result): ${resultStatus || i18n.notVisible}`);

      whatMeans = readingLevel === 'simple'
        ? 'इसका सीधा मतलब यह है कि विद्यार्थी ने यह परीक्षा पास कर ली है और वे अब आगे की कक्षा, कॉलेज में प्रवेश या छात्रवृत्ति के लिए पूरी तरह योग्य हैं।'
        : 'यह आधिकारिक प्रमाण पत्र प्रमाणित करता है कि विद्यार्थी ने निर्धारित पाठ्यक्रम को सफलतापूर्वक उत्तीर्ण कर लिया है। कुल प्रतिशत के आधार पर आगामी उच्च शिक्षा संस्थानों में प्रवेश की पात्रता निर्धारित होगी।';

      whatToDo = `${i18n.actionTitle} इस मूल अंकतालिका को सुरक्षित लैमिनेट या वाटरप्रूफ फाइल में रखें। आगे कॉलेज दाखिले, छात्रवृत्ति या नौकरी के लिए इसकी कम से कम चार-पांच सत्यापित फोटोकॉपी अपने पास तैयार रखें।`;
    } else if (language === 'bn') {
      whatIs = 'এটি একটি শিক্ষা প্রতিষ্ঠানের নম্বরপত্র বা মার্কশিট, যেখানে শিক্ষার্থীর প্রাপ্ত নম্বর ও পরীক্ষার ফলাফল নথিভুক্ত রয়েছে।';
      details.push(`শিক্ষার্থীর নাম: ${studentName || i18n.notVisible}`);
      details.push(`রোল নম্বর: ${rollNo || i18n.notVisible}`);
      details.push(`শ্রেণী ও বোর্ড: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) details.push(`বিষয় ও নম্বর: ${subjectList.slice(0, 5).join('; ')}`);
      details.push(`মোট প্রাপ্ত নম্বর: ${totalMarks || i18n.notVisible}`);
      details.push(`শতাংশ / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`ফলাফল: ${resultStatus || i18n.notVisible}`);
      whatMeans = 'এর অর্থ শিক্ষার্থী এই পরীক্ষায় সফলভাবে উত্তীর্ণ হয়েছেন এবং পরবর্তী ক্লাসে ভর্তির জন্য যোগ্য।';
      whatToDo = `${i18n.actionTitle} এই মূল মার্কশিটটি নিরাপদে সংরক্ষণ করুন এবং ভবিষ্যতের জন্য ফটোকপি করিয়ে রাখুন।`;
    } else if (language === 'ta') {
      whatIs = 'இது ஒரு பள்ளி அல்லது கல்லூரி மதிப்பெண் பட்டியல் ஆகும். இதில் மாணவர் பெற்ற மதிப்பெண்கள் மற்றும் தேர்வு முடிவுகள் உள்ளன.';
      details.push(`மாணவர் பெயர்: ${studentName || i18n.notVisible}`);
      details.push(`பதிவு எண்: ${rollNo || i18n.notVisible}`);
      details.push(`வகுப்பு / தேர்வு: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) details.push(`பாடங்கள் & மதிப்பெண்கள்: ${subjectList.slice(0, 5).join('; ')}`);
      details.push(`மொத்த மதிப்பெண்: ${totalMarks || i18n.notVisible}`);
      details.push(`சதவீதம் / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`முடிவு: ${resultStatus || i18n.notVisible}`);
      whatMeans = 'மாணவர் இந்தத் தேர்வில் தேர்ச்சி பெற்றுள்ளார் என்பதை இந்த ஆவணம் உறுதிப்படுத்துகிறது.';
      whatToDo = `${i18n.actionTitle} இந்த அசல் மதிப்பெண் பட்டியலைப் பாதுகாப்பாக வைத்து, அடுத்த சேர்க்கைக்கு நகல்களைத் தயார் செய்யுங்கள்.`;
    } else if (language === 'te') {
      whatIs = 'ఇది ఒక విద్యా సంస్థకు చెందిన మార్కుల జాబితా (మార్క్‌షీట్). విద్యార్థి సాధించిన మార్కులు ఇందులో ఉన్నాయి.';
      details.push(`విద్యార్థి పేరు: ${studentName || i18n.notVisible}`);
      details.push(`రోల్ నంబర్: ${rollNo || i18n.notVisible}`);
      details.push(`తరగతి / పరీక్ష: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) details.push(`విషయాలు & మార్కులు: ${subjectList.slice(0, 5).join('; ')}`);
      details.push(`మొత్తం మార్కులు: ${totalMarks || i18n.notVisible}`);
      details.push(`శాతం / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`ఫలితం: ${resultStatus || i18n.notVisible}`);
      whatMeans = 'విద్యార్థి పరీక్షలో ఉత్తీర్ణులయ్యారని మరియు పై చదువులకు అర్హత సాధించారని ఇది తెలుపుతుంది.';
      whatToDo = `${i18n.actionTitle} ఈ ఒరిజినల్ మార్క్‌షీట్‌ను భద్రపరచుకోండి మరియు తదుపరి అడ్మిషన్ల కోసం జిరాక్స్ కాపీలు ఉంచుకోండి.`;
    } else if (language === 'mr') {
      whatIs = 'ही एका शाळा किंवा कॉलेजची गुणपत्रिका (मार्कशीट) आहे, ज्यामध्ये विद्यार्थ्याच्या विषयानुसार मिळालेल्या गुणांची नोंद आहे.';
      details.push(`विद्यार्थ्याचे नाव: ${studentName || i18n.notVisible}`);
      details.push(`अनुक्रमांक (Roll No): ${rollNo || i18n.notVisible}`);
      details.push(`वर्ग व मंडळ: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) details.push(`विषय व गुण: ${subjectList.slice(0, 5).join('; ')}`);
      details.push(`एकूण गुण: ${totalMarks || i18n.notVisible}`);
      details.push(`टक्केवारी / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`निकाल: ${resultStatus || i18n.notVisible}`);
      whatMeans = 'विद्यार्थ्याने ही परीक्षा यशस्वीरीत्या उत्तीर्ण केली असून ते पुढील वर्गात प्रवेशास पात्र आहेत.';
      whatToDo = `${i18n.actionTitle} ही मूळ गुणपत्रिका सुरक्षित फायलीत ठेवा आणि पुढील प्रवेशासाठी काही सत्यप्रती (झेरॉक्स) तयार ठेवा.`;
    } else {
      whatIs = readingLevel === 'simple'
        ? 'This is a school or college marksheet showing student examination scores, subjects, and pass/fail result.'
        : 'This is an academic Statement of Marks detailing course performance, subject-wise scores, total aggregate marks, and examination result.';

      details.push(`Student Name: ${studentName || i18n.notVisible}`);
      details.push(`Roll / Reg No: ${rollNo || i18n.notVisible}`);
      details.push(`Class / Board: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) {
        details.push(`Visible Subjects & Scores: ${subjectList.slice(0, 6).join('; ')}`);
      } else {
        details.push(`Subjects & Marks: ${i18n.notVisible}`);
      }
      details.push(`Total Marks: ${totalMarks || i18n.notVisible}`);
      details.push(`Percentage / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`Result Status: ${resultStatus || i18n.notVisible}`);

      whatMeans = readingLevel === 'simple'
        ? 'This document confirms that the student took the examination and has passed, qualifying them for the next class, college admission, or scholarships.'
        : 'This official document certifies academic completion. The total marks and percentage establish eligibility for university admissions and employment verification.';

      whatToDo = `${i18n.actionTitle} Store this original marksheet safely in a protective file. Prepare multiple photocopies for academic admissions and official verification.`;
    }
  } else if (docType === 'medical') {
    let patient = null;
    let hospital = null;
    let diagnosis = null;
    let totalAmt = null;

    for (const line of lines) {
      const l = line.toLowerCase();
      if (!patient && l.includes('patient')) patient = line;
      if (!hospital && (l.includes('hospital') || l.includes('clinic'))) hospital = line;
      if (!diagnosis && (l.includes('diagnosis') || l.includes('condition'))) diagnosis = line;
      if (!totalAmt && (l.includes('total') || l.includes('bill') || l.includes('charges') || l.includes('$') || l.includes('₹') || l.includes('rs'))) totalAmt = line;
    }

    if (language === 'hi') {
      whatIs = 'यह अस्पताल का डिस्चार्ज बिल और मेडिकल सारांश है। इसमें इलाज, कमरे का किराया, जांच और देय राशि का विवरण दिया गया है।';
      details.push(`अस्पताल का नाम: ${hospital || i18n.notVisible}`);
      details.push(`मरीज का नाम: ${patient || i18n.notVisible}`);
      details.push(`बीमारी / निदान: ${diagnosis || i18n.notVisible}`);
      details.push(`बिल का कुल ब्यौरा: ${totalAmt || i18n.notVisible}`);
      whatMeans = 'यह दस्तावेज़ अस्पताल में हुए इलाज का विवरण देता है। बीमा से स्वीकृत राशि घटाकर जो शेष रकम बचती है, वह अस्पताल के काउंटर पर चुकानी होती है।';
      whatToDo = `${i18n.actionTitle} अस्पताल के काउंटर से मुहर लगी अंतिम रसीद (Paid Receipt) और डिस्चार्ज पर्चा प्राप्त करें। डॉक्टर द्वारा लिखी गई दवाओं का नियमित सेवन करें और फॉलो-अप तारीख याद रखें।`;
    } else {
      whatIs = 'This is a hospital inpatient discharge summary and billing statement outlining clinical diagnosis and treatment charges.';
      details.push(`Hospital / Clinic: ${hospital || i18n.notVisible}`);
      details.push(`Patient: ${patient || i18n.notVisible}`);
      details.push(`Clinical Diagnosis: ${diagnosis || i18n.notVisible}`);
      details.push(`Billing Details: ${totalAmt || i18n.notVisible}`);
      whatMeans = 'This record documents diagnostic tests, room charges, and pharmaceutical costs incurred, showing any remaining patient out-of-pocket balance.';
      whatToDo = `${i18n.actionTitle} Obtain an itemized stamped paid receipt from the billing desk, keep the prescription safe, and attend scheduled follow-up visits.`;
    }
  } else if (docType === 'insurance') {
    if (language === 'hi') {
      whatIs = 'यह आपकी स्वास्थ्य बीमा कंपनी का क्लेम नोटिस है। इसमें क्लेम पर पुनर्विचार करने या जरूरी कागजात जमा करने का निर्देश दिया गया है।';
      details.push(`दस्तावेज़: स्वास्थ्य बीमा क्लेम नोटिस`);
      details.push(`मुख्य विषय: दस्तावेज़ों की कमी या पॉलिसी शर्त (Clause) का हवाला`);
      details.push(`समय-सीमा: नोटिस में दी गई समयावधि (सामान्यतः 15 से 30 दिन)`);
      whatMeans = 'कंपनी ने आपका क्लेम हमेशा के लिए खारिज नहीं किया है, बल्कि कुछ अनिवार्य कागजात (जैसे डॉक्टर का पहला पर्चा या बिल) मांगे हैं।';
      whatToDo = `${i18n.actionTitle} अस्पताल से मांगे गए अतिरिक्त मेडिकल रिकॉर्ड प्राप्त करें और दी गई समय-सीमा के अंदर बीमा पोर्टल पर अपलोड करें अथवा अपने बीमा एजेंट से तुरंत संपर्क करें।`;
    } else {
      whatIs = 'This is a formal communication from your health insurance provider regarding a pending claim review or documentation deficiency.';
      details.push(`Document: Insurance Claim Admissibility Notice`);
      details.push(`Subject: Requirement for additional substantiating records under policy clauses`);
      details.push(`Submission Window: Within specified calendar days`);
      whatMeans = 'The claim is held in abeyance pending clarification rather than permanently closed, provided required documents are submitted.';
      whatToDo = `${i18n.actionTitle} Collect the specified clinical consultation notes or pharmacy invoices from your provider and upload them to the insurer portal before the deadline.`;
    }
  } else if (docType === 'legal') {
    if (language === 'hi') {
      whatIs = 'यह एक औपचारिक कानूनी सूचना पत्र (Legal Notice) है, जो वकील या मकान मालिक द्वारा किसी समझौते के उल्लंघन के संदर्भ में भेजा गया है।';
      details.push(`दस्तावेज़: कानूनी सूचना पत्र / बेदखली नोटिस`);
      details.push(`मुख्य मांग: बकाया राशि का भुगतान अथवा नियमों का पालन`);
      details.push(`समय-सीमा: नोटिस में निर्धारित मोहलत (जैसे 14 या 30 दिन)`);
      whatMeans = 'यह नोटिस चेतावनी देता है कि यदि तय समय के अंदर बकाया नहीं चुकाया गया या समस्या का समाधान नहीं किया गया, तो कानूनी कार्रवाई शुरू की जा सकती है।';
      whatToDo = `${i18n.actionTitle} नोटिस में दी गई तारीख से पहले संबंधित पक्ष से मिलकर समाधान करें और जो भी भुगतान करें, उसकी लिखित व हस्ताक्षरित रसीद अनिवार्य रूप से अपने पास रखें।`;
    } else {
      whatIs = 'This is a formal statutory legal notice issued by legal counsel concerning contractual compliance or tenancy default.';
      details.push(`Document: Legal Notice to Cure or Vacate`);
      details.push(`Demand: Settlement of outstanding balance or compliance`);
      details.push(`Statutory Window: Time period specified to remedy the issue`);
      whatMeans = 'The communication establishes a formal deadline to cure the default, failing which formal legal proceedings may be initiated.';
      whatToDo = `${i18n.actionTitle} Contact the issuing party or your legal representative within the specified window, settle any verified obligations, and obtain signed written receipts.`;
    }
  } else if (docType === 'identity') {
    if (language === 'hi') {
      whatIs = 'यह भारत सरकार अथवा राज्य प्राधिकरण द्वारा जारी आधिकारिक पहचान पत्र (जैसे आधार कार्ड, पैन कार्ड या पहचान पत्र) है।';
      details.push(`दस्तावेज़: आधिकारिक राष्ट्रीय पहचान पत्र`);
      details.push(`गोपनीयता: पहचान संख्या सुरक्षित रखी गई है`);
      details.push(`नाम व विवरण: कार्ड पर प्रदर्शित आधिकारिक नाम के अनुरूप`);
      whatMeans = 'यह कार्ड विभिन्न सरकारी योजनाओं, बैंक खातों और सेवाओं में आपकी नागरिकता एवं व्यक्तिगत पहचान का वैध कानूनी प्रमाण है।';
      whatToDo = `${i18n.actionTitle} इस पहचान पत्र को सुरक्षित रखें। किसी भी अनजान व्यक्ति या अविश्वसनीय वेबसाइट के साथ अपनी पूरी पहचान संख्या या ओटीपी साझा न करें।`;
    } else {
      whatIs = 'This is an official national or state identity card confirming legal identity and personal registration.';
      details.push(`Document: Government Identity Card`);
      details.push(`Privacy: Identification numbers masked for personal protection`);
      details.push(`Holder Details: As verified on the physical card`);
      whatMeans = 'This credential functions as legal proof of identity and residency for banking, civil services, and official applications.';
      whatToDo = `${i18n.actionTitle} Maintain this ID credential securely and avoid sharing sensitive identity numbers with unverified third parties.`;
    }
  } else {
    if (language === 'hi') {
      whatIs = 'यह एक आधिकारिक दस्तावेज़ है। इसमें निम्नलिखित मुख्य जानकारी दिखाई दे रही है:';
      details.push(`मुख्य शीर्षक: ${lines[0] || i18n.notVisible}`);
      if (lines[1]) details.push(`संबंधित विवरण: ${lines[1]}`);
      if (lines[2]) details.push(`दिनांक व संदर्भ: ${lines[2]}`);
      whatMeans = 'यह दस्तावेज़ संबंधित विभाग अथवा संस्था द्वारा किसी सेवा, खाते अथवा निर्देश के संबंध में जारी किया गया है।';
      whatToDo = `${i18n.actionTitle} इस दस्तावेज़ में उल्लिखित संदर्भ संख्या और अंतिम तारीख की पुष्टि संबंधित विभाग या कार्यालय से कर लें और इसकी एक प्रति सुरक्षित रखें।`;
    } else {
      whatIs = 'This is an official correspondence containing verified recorded text as follows:';
      details.push(`Header: ${lines[0] || i18n.notVisible}`);
      if (lines[1]) details.push(`Subject details: ${lines[1]}`);
      if (lines[2]) details.push(`Reference / Date: ${lines[2]}`);
      whatMeans = 'This document communicates directives, transactions, or administrative confirmations from the issuing authority.';
      whatToDo = `${i18n.actionTitle} Retain this record in your files and cross-reference the date and reference codes with the issuing office if action is required.`;
    }
  }

  const explanation = `${i18n.docTypeTitle}\n${docTypeLabel}\n\n${i18n.whatIsTitle}\n${whatIs}\n\n${i18n.detailsTitle}\n${details.map((d) => `- ${d}`).join('\n')}\n\n${i18n.meansTitle}\n${whatMeans}`;

  return {
    rawText: `${explanation}\n\n${whatToDo}`,
    isNoText: false,
    documentType: docTypeLabel,
    explanation,
    actionableAdvice: whatToDo
  };
}
