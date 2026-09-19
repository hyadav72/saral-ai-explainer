import { createWorker } from 'tesseract.js';

// Cache worker for performance
let workerInstance = null;

async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker('eng');
  }
  return workerInstance;
}

export async function extractTextFromImage(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const worker = await getWorker();
    const ret = await worker.recognize(buffer);
    const rawText = (ret.data?.text || '').trim();

    // Count meaningful alphanumeric words
    const words = rawText.match(/[a-zA-Z0-9]{2,}/g) || [];
    const confidence = ret.data?.confidence || 0;

    return {
      text: rawText,
      wordsCount: words.length,
      confidence,
      isUnreadable: words.length < 3
    };
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

// Multilingual labels for document types and sections
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
      legal: 'Legal Notice / Agreement',
      invoice: 'Invoice / Purchase Bill',
      certificate: 'Certificate',
      application: 'Application / Registration Form',
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

  // Marksheet detection
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
    'university',
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
    'division',
    'subject code'
  ];
  const marksheetHits = marksheetTerms.filter((term) => lower.includes(term)).length;
  if (marksheetHits >= 2 || lower.includes('marksheet') || lower.includes('statement of marks')) {
    return 'marksheet';
  }

  // Identity / Aadhaar detection
  if (
    lower.includes('aadhaar') ||
    lower.includes('unique identification') ||
    lower.includes('government of india') && (lower.includes('dob') || lower.includes('uidai')) ||
    lower.includes('income tax department') ||
    lower.includes('permanent account number')
  ) {
    return 'identity';
  }

  // Medical bill / Discharge
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

  // Insurance
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

  // Bank
  if (
    lower.includes('bank') ||
    lower.includes('account number') ||
    lower.includes('ifsc') ||
    lower.includes('account statement') ||
    lower.includes('debit') && lower.includes('credit')
  ) {
    return 'bank';
  }

  // Legal notice / Agreement
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

  // Invoice / Bill
  if (
    lower.includes('invoice') ||
    lower.includes('gstin') ||
    lower.includes('tax invoice') ||
    lower.includes('bill to')
  ) {
    return 'invoice';
  }

  // Certificate
  if (
    lower.includes('certificate') ||
    lower.includes('certify that') ||
    lower.includes('hereby certify')
  ) {
    return 'certificate';
  }

  // Application
  if (
    lower.includes('application form') ||
    lower.includes('applicant') ||
    lower.includes('registration form')
  ) {
    return 'application';
  }

  return 'other';
}

// Local Document Intelligence Parser using extracted text
export function parseDocumentLocally(text, language = 'en', readingLevel = 'simple') {
  const i18n = I18N[language] || I18N.en;
  const docType = detectDocumentType(text);
  const docTypeLabel = i18n.types[docType] || i18n.types.other;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let whatIs = '';
  const details = [];
  let whatMeans = '';
  let whatToDo = '';

  if (docType === 'marksheet') {
    // Extract Student Info
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
      if (!courseName && (l.includes('class') || l.includes('standard') || l.includes('course') || l.includes('semester') || l.includes('bachelor') || l.includes('b.tech') || l.includes('b.a') || l.includes('cbse') || l.includes('board'))) {
        courseName = line;
      }
    }

    // Extract subjects and marks
    const subjectList = [];
    const commonSubjects = [
      'english',
      'hindi',
      'mathematics',
      'math',
      'science',
      'physics',
      'chemistry',
      'biology',
      'social science',
      'history',
      'geography',
      'computer',
      'economics',
      'accountancy',
      'business studies',
      'sanskrit'
    ];

    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const subj of commonSubjects) {
        if (lower.includes(subj)) {
          // Look for numbers in this line
          const numbers = line.match(/\b\d{1,3}\b/g);
          if (numbers && numbers.length > 0) {
            subjectList.push(`${line}`);
          }
          break;
        }
      }
    }

    // Extract total, percentage, pass/fail
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
        ? 'यह एक स्कूल या कॉलेज की अंकतालिका (मार्कशीट) है, जिसमें विद्यार्थी के परीक्षा परिणाम और अंकों का विवरण दिया गया है।'
        : 'यह एक शैक्षणिक अंकतालिका (स्टेटमेंट ऑफ मार्क्स) है, जिसमें विद्यार्थी द्वारा संबंधित परीक्षा में अर्जित किए गए विषयवार अंकों, कुल प्राप्तांक और परिणाम का अधिकृत विवरण दर्ज है।';

      details.push(`विद्यार्थी का नाम: ${studentName || i18n.notVisible}`);
      details.push(`अनुक्रमांक (Roll No): ${rollNo || i18n.notVisible}`);
      details.push(`कक्षा / परीक्षा: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) {
        details.push(`दिखाई दे रहे विषय व अंक: ${subjectList.slice(0, 5).join('; ')}`);
      } else {
        details.push(`विषय व अंक: ${i18n.notVisible}`);
      }
      details.push(`कुल प्राप्तांक: ${totalMarks || i18n.notVisible}`);
      details.push(`प्रतिशत / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`परिणाम (Result): ${resultStatus || i18n.notVisible}`);

      whatMeans = readingLevel === 'simple'
        ? 'यह दस्तावेज़ दिखाता है कि विद्यार्थी ने परीक्षा दी है और उनके अंक इसमें दर्ज हैं। यदि पास लिखा है तो विद्यार्थी अगली कक्षा में जा सकते हैं।'
        : 'यह आधिकारिक दस्तावेज़ प्रमाणित करता है कि विद्यार्थी ने उक्त परीक्षा संपन्न की है। कुल प्राप्तांक एवं श्रेणी के आधार पर अगली कक्षा या उच्च शिक्षा में प्रवेश की पात्रता निर्धारित होगी।';

      whatToDo = `${i18n.actionTitle} इस मूल अंकतालिका को सुरक्षित लैमिनेट या फाइल करके रखें और आगे के दाखिले या छात्रवृत्ति के लिए इसकी कुछ फोटोकॉपी करवा लें।`;
    } else {
      whatIs = readingLevel === 'simple'
        ? 'This is a school or college marksheet showing student examination scores and grades.'
        : 'This is an academic Statement of Marks detailing course performance, subject-wise scores, total marks, and examination result.';

      details.push(`Student Name: ${studentName || i18n.notVisible}`);
      details.push(`Roll / Reg No: ${rollNo || i18n.notVisible}`);
      details.push(`Class / Examination: ${courseName || i18n.notVisible}`);
      if (subjectList.length > 0) {
        details.push(`Visible Subjects & Scores: ${subjectList.slice(0, 5).join('; ')}`);
      } else {
        details.push(`Subjects & Marks: ${i18n.notVisible}`);
      }
      details.push(`Total Marks: ${totalMarks || i18n.notVisible}`);
      details.push(`Percentage / CGPA: ${percentage || i18n.notVisible}`);
      details.push(`Result Status: ${resultStatus || i18n.notVisible}`);

      whatMeans = readingLevel === 'simple'
        ? 'This document shows the marks obtained in the exams. If marked as passed, the student is qualified for the next class or degree.'
        : 'This official document certifies the academic completion of the designated coursework. Total aggregate scores determine eligibility for subsequent progression and admissions.';

      whatToDo = `${i18n.actionTitle} Preserve this original marksheet safely in your records and keep photocopies ready for academic admissions or verification.`;
    }
  } else if (docType === 'medical') {
    // Extract Medical Fields
    let patient = null;
    let hospital = null;
    let diagnosis = null;
    let totalAmt = null;

    for (const line of lines) {
      const l = line.toLowerCase();
      if (!patient && l.includes('patient')) patient = line;
      if (!hospital && (l.includes('hospital') || l.includes('clinic'))) hospital = line;
      if (!diagnosis && (l.includes('diagnosis') || l.includes('condition'))) diagnosis = line;
      if (!totalAmt && (l.includes('total') || l.includes('bill') || l.includes('amount') || l.includes('$') || l.includes('₹'))) totalAmt = line;
    }

    if (language === 'hi') {
      whatIs = 'यह अस्पताल का मेडिकल बिल या डिस्चार्ज सारांश है।';
      details.push(`अस्पताल का नाम: ${hospital || i18n.notVisible}`);
      details.push(`मरीज का नाम: ${patient || i18n.notVisible}`);
      details.push(`बीमारी / निदान: ${diagnosis || i18n.notVisible}`);
      details.push(`बिल राशि: ${totalAmt || i18n.notVisible}`);
      whatMeans = 'यह दस्तावेज़ अस्पताल में हुए इलाज, जांच और देय राशि का विवरण देता है।';
      whatToDo = `${i18n.actionTitle} अस्पताल की अंतिम रसीद और दवाओं की पर्ची सुरक्षित रख लें और डॉक्टर द्वारा दी गई सलाह का पालन करें।`;
    } else {
      whatIs = 'This is a hospital medical invoice or patient discharge summary.';
      details.push(`Hospital / Clinic: ${hospital || i18n.notVisible}`);
      details.push(`Patient: ${patient || i18n.notVisible}`);
      details.push(`Diagnosis: ${diagnosis || i18n.notVisible}`);
      details.push(`Total Charges: ${totalAmt || i18n.notVisible}`);
      whatMeans = 'This record documents the clinical treatment received and itemized fees charged.';
      whatToDo = `${i18n.actionTitle} Keep the hospital billing receipt and discharge prescription in a safe file for future reference.`;
    }
  } else if (docType === 'identity') {
    if (language === 'hi') {
      whatIs = 'यह एक आधिकारिक पहचान पत्र (जैसे आधार कार्ड या पैन कार्ड) है।';
      details.push(`कार्ड प्रकार: ${lines[0] || 'सरकारी पहचान पत्र'}`);
      details.push(`पहचान संख्या: सुरक्षित रखने के लिए केवल अंतिम अंक मान्य रखें`);
      details.push(`नाम व विवरण: दस्तावेज़ पर अंकित नाम के अनुसार`);
      whatMeans = 'यह कार्ड आपकी आधिकारिक पहचान और नागरिकता प्रमाणित करने के लिए प्रयोग होता है।';
      whatToDo = `${i18n.actionTitle} इस पहचान पत्र को सुरक्षित रखें और इसकी जानकारी किसी अनजान व्यक्ति के साथ साझा न करें।`;
    } else {
      whatIs = 'This is an official government identity card (such as Aadhaar or PAN card).';
      details.push(`Document: Official Government ID`);
      details.push(`Identity Number: Keep secure, masked for privacy`);
      details.push(`Details: As displayed on the identity card`);
      whatMeans = 'This document serves as proof of legal identity and residency.';
      whatToDo = `${i18n.actionTitle} Keep this ID card securely and never share sensitive numbers with unverified third parties.`;
    }
  } else {
    // Generic Document handling - ONLY based on actual visible text
    const samplePreview = lines.slice(0, 4).join(' — ');

    if (language === 'hi') {
      whatIs = `यह एक आधिकारिक दस्तावेज़ है। इसमें निम्नलिखित जानकारी दिखाई दे रही है:`;
      details.push(`शीर्षक / मुख्य पंक्ति: ${lines[0] || i18n.notVisible}`);
      if (lines[1]) details.push(`विवरण पंक्ति: ${lines[1]}`);
      if (lines[2]) details.push(`संदर्भ / दिनांक: ${lines[2]}`);
      whatMeans = 'यह दस्तावेज़ संबंधित कार्यालय या संस्था द्वारा आपको जानकारी अथवा निर्देश देने हेतु जारी किया गया है।';
      whatToDo = `${i18n.actionTitle} इस दस्तावेज़ में दी गई तारीख और निर्देशों की पुष्टि संबंधित संस्था से करें।`;
    } else {
      whatIs = `This is an official document containing the following visible text:`;
      details.push(`Header: ${lines[0] || i18n.notVisible}`);
      if (lines[1]) details.push(`Line item: ${lines[1]}`);
      if (lines[2]) details.push(`Reference / Date: ${lines[2]}`);
      whatMeans = 'This correspondence conveys instructions or records from the issuing organization.';
      whatToDo = `${i18n.actionTitle} Verify the reference numbers and dates with the issuing organization.`;
    }
  }

  // Construct structured explanation body
  const explanation = `${i18n.docTypeTitle}\n${docTypeLabel}\n\n${i18n.whatIsTitle}\n${whatIs}\n\n${i18n.detailsTitle}\n${details.map((d) => `- ${d}`).join('\n')}\n\n${i18n.meansTitle}\n${whatMeans}`;

  return {
    rawText: `${explanation}\n\n${whatToDo}`,
    isNoText: false,
    documentType: docTypeLabel,
    explanation,
    actionableAdvice: whatToDo
  };
}
