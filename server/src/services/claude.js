import Anthropic from '@anthropic-ai/sdk';

const LANGUAGE_NAMES = {
  en: { english: 'English', native: 'English', actionPrefix: 'What you should do:' },
  hi: { english: 'Hindi', native: 'हिन्दी', actionPrefix: 'आपको क्या करना चाहिए:' },
  bn: { english: 'Bengali', native: 'বাংলা', actionPrefix: 'আপনার যা করা উচিত:' },
  ta: { english: 'Tamil', native: 'தமிழ்', actionPrefix: 'நீங்கள் செய்ய வேண்டியது:' },
  te: { english: 'Telugu', native: 'తెలుగు', actionPrefix: 'మీరు ఏమి చేయాలి:' },
  mr: { english: 'Marathi', native: 'मराठी', actionPrefix: 'तुम्ही काय करावे:' }
};

export async function generateExplanation({
  text,
  image, // { data: base64String, mediaType: 'image/jpeg' | 'image/png' | ... }
  language = 'en',
  readingLevel = 'simple' // 'simple' | 'clear'
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  const langConfig = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en;
  const targetLanguage = langConfig.english;
  const actionPrefix = langConfig.actionPrefix;

  // Reading level guidelines
  const levelInstructions =
    readingLevel === 'simple'
      ? 'Target reading level: VERY SIMPLE. Use very short, direct sentences and basic everyday vocabulary. Write as if explaining to a 10-year-old or an elderly person with limited formal schooling. Avoid any formal or legal jargon completely.'
      : 'Target reading level: CLEAR. Use plain, warm, natural conversational language with slightly more context, but completely free of technical, bureaucratic, legal, or medical jargon.';

  const systemPrompt = `You are Saral, an empathetic, highly skilled document explainer designed to help elderly citizens, low-literacy adults, and people reading in a second language understand dense, confusing official documents.

CRITICAL INSTRUCTIONS:
1. First, inspect the document (text or image). If there is NO readable document text, or if the input is completely blank, unintelligible scribbles, or irrelevant images containing no document content, you MUST reply with ONLY this exact sentinel word: NO_TEXT_FOUND
2. EXCLUSIVE TARGET LANGUAGE: You MUST write your entire response exclusively in ${targetLanguage} (${langConfig.native}). Do NOT mix in English words or transliteration, unless a specific proper noun (like a person's exact name or reference code) has no standard translation.
3. PRESERVE ACCURACY: Keep every critical factual detail exactly accurate — dates, deadlines, currency amounts, fees, penalty warnings, required documents, and names. NEVER invent, hallucinate, or assume details not present in the original document.
4. FORMATTING: Output flowing plain paragraphs ONLY. Do NOT use markdown bold/italics, bullet points (*, -, •), numbered lists, section headers (#, ##), or tables. Flowing conversational sentences only.
5. FINAL ACTION STEP: You MUST conclude your explanation with a final single paragraph that begins strictly with the phrase: "${actionPrefix}" followed by a direct statement naming the single most important next action the person must take.
6. ${levelInstructions}`;

  // If no API key is provided, run the intelligent mock generator for seamless demo/offline usage
  if (!apiKey || apiKey === 'mock' || apiKey.trim() === '') {
    console.log('Anthropic API key not provided — running in intelligent demo mode.');
    return generateDemoResponse({ text, image, language, readingLevel, actionPrefix });
  }

  const anthropic = new Anthropic({ apiKey });

  // Build message content
  const content = [];

  if (image && image.data) {
    // Validate supported media types
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
      text: 'Please examine this document image carefully. Read all readable text and provide a simplified explanation according to your instructions.'
    });
  } else if (text && text.trim()) {
    content.push({
      type: 'text',
      text: `Here is the document text to explain:\n\n${text.trim()}`
    });
  } else {
    return {
      rawText: 'NO_TEXT_FOUND',
      isNoText: true,
      explanation: '',
      actionableAdvice: ''
    };
  }

  try {
    const response = await anthropic.messages.create({
      model: modelName,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content
        }
      ]
    });

    const outputText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (outputText === 'NO_TEXT_FOUND' || outputText.includes('NO_TEXT_FOUND')) {
      return {
        rawText: 'NO_TEXT_FOUND',
        isNoText: true,
        explanation: '',
        actionableAdvice: ''
      };
    }

    return parseExplanationOutput(outputText, actionPrefix);
  } catch (error) {
    // If the error is model not found or invalid model name, try fallback model
    if (error?.status === 404 || error?.message?.includes('model')) {
      console.warn(`Model ${modelName} unavailable, attempting fallback model claude-3-7-sonnet-20250219...`);
      try {
        const fallbackResponse = await anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content }]
        });
        const outputText = fallbackResponse.content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n')
          .trim();
        if (outputText === 'NO_TEXT_FOUND' || outputText.includes('NO_TEXT_FOUND')) {
          return { rawText: 'NO_TEXT_FOUND', isNoText: true, explanation: '', actionableAdvice: '' };
        }
        return parseExplanationOutput(outputText, actionPrefix);
      } catch (fbErr) {
        console.error('Anthropic API Fallback Error:', fbErr);
        throw fbErr;
      }
    }
    console.error('Anthropic API Error:', error);
    throw error;
  }
}

function parseExplanationOutput(fullText, actionPrefix) {
  // Check if output has the actionPrefix
  let mainExplanation = fullText;
  let actionableAdvice = '';

  const prefixIndex = fullText.lastIndexOf(actionPrefix);
  if (prefixIndex !== -1) {
    mainExplanation = fullText.substring(0, prefixIndex).trim();
    actionableAdvice = fullText.substring(prefixIndex).trim();
  } else {
    // Check for English fallback prefix "What you should do:"
    const engIndex = fullText.lastIndexOf('What you should do:');
    if (engIndex !== -1) {
      mainExplanation = fullText.substring(0, engIndex).trim();
      actionableAdvice = fullText.substring(engIndex).trim();
    }
  }

  return {
    rawText: fullText,
    isNoText: false,
    explanation: mainExplanation,
    actionableAdvice: actionableAdvice
  };
}

// Intelligent demo response generator when ANTHROPIC_API_KEY is not set
function generateDemoResponse({ text, image, language, readingLevel, actionPrefix }) {
  const contentStr = (text || '').toLowerCase();

  // If user passed literally nothing
  if (!text && !image) {
    return { rawText: 'NO_TEXT_FOUND', isNoText: true, explanation: '', actionableAdvice: '' };
  }

  // Check if this looks like a medical bill / discharge summary
  const isMedical =
    contentStr.includes('hospital') ||
    contentStr.includes('discharge') ||
    contentStr.includes('patient') ||
    contentStr.includes('diagnosis') ||
    contentStr.includes('deductible') ||
    contentStr.includes('dr.');

  // Check if insurance notice
  const isInsurance =
    contentStr.includes('insurance') ||
    contentStr.includes('claim') ||
    contentStr.includes('policy') ||
    contentStr.includes('rejection') ||
    contentStr.includes('coverage');

  // Check if tenancy / eviction / legal notice
  const isTenancy =
    contentStr.includes('tenant') ||
    contentStr.includes('lease') ||
    contentStr.includes('rent') ||
    contentStr.includes('vacate') ||
    contentStr.includes('premises');

  let explanation = '';
  let advice = '';

  if (language === 'hi') {
    if (isMedical) {
      explanation =
        readingLevel === 'simple'
          ? 'यह अस्पताल से छुट्टी का कागज है। मरीज को तीन दिन तक बुखार और सीने के संक्रमण के लिए भर्ती रखा गया था। डॉक्टर ने खून की जांच की है और अब मरीज की हालत ठीक है। अस्पताल का कुल बिल अड़तीस हजार चार सौ रुपये बना था, जिसमें से बीमा कंपनी ने बत्तीस हजार रुपये सीधे अस्पताल को दे दिए हैं। अब मरीज के परिवार को बची हुई छह हजार चार सौ रुपये की रकम अस्पताल के काउंटर पर चुकानी है। मरीज को घर पर पांच दिन तक सुबह-शाम दी गई दवाइयां खानी हैं।'
          : 'यह अस्पताल का डिस्चार्ज सारांश और अंतिम बिल है। मरीज को तीव्र श्वसन संक्रमण के इलाज के लिए दिनांक दस से बारह तारीख तक भर्ती रखा गया था। अस्पताल का कुल स्वीकृत बिल अड़तीस हजार चार सौ रुपये है। इसमें से कैशलेस स्वास्थ्य बीमा द्वारा बत्तीस हजार रुपये का भुगतान स्वीकृत हो चुका है। शेष छह हजार चार सौ रुपये की सह-भुगतान राशि अस्पताल से छुट्टी के समय आपको नकद या यूपीआई द्वारा जमा करनी होगी। मरीज को अगले सात दिनों तक पूर्ण विश्राम और पर्चे में लिखी एंटीबायोटिक दवाइयां नियमित रूप से लेने की सलाह दी गई है।';
      advice = `${actionPrefix} अस्पताल के बिलिंग काउंटर पर जाकर बची हुई छह हजार चार सौ रुपये की राशि का भुगतान करें और अपनी अंतिम रसीद व दवाओं का पर्चा सुरक्षित अपने पास रख लें।`;
    } else if (isInsurance) {
      explanation =
        readingLevel === 'simple'
          ? 'यह आपकी बीमा कंपनी की चिट्ठी है। कंपनी का कहना है कि उन्होंने आपके अस्पताल के खर्चे का दावा अभी खारिज कर दिया है। इसका कारण यह है कि आपने डॉक्टर के कमरे में भर्ती होने से पहले का जांच पर्चा नहीं भेजा था। उन्होंने यह नहीं कहा कि वह कभी पैसे नहीं देंगे, बल्कि उन्होंने वह जरूरी कागज मांगा है। इसके लिए उन्होंने पंद्रह दिनों का समय दिया है। यदि आप वह पर्चा भेज देंगे तो आपके पैसे मिल सकते हैं।'
          : 'यह स्वास्थ्य बीमा कंपनी का क्लेम निरस्तीकरण संबंधी पत्र है। कंपनी ने पॉलिसी की धारा 4.2 का हवाला देते हुए बताया है कि अस्पताल में भर्ती होने से पहले की प्राथमिक ओपीडी पर्ची और डॉक्टर का प्रेस्क्रिप्शन संलग्न न होने के कारण वर्तमान क्लेम को रोका गया है। कंपनी ने सूचित किया है कि आवश्यक दस्तावेज आगामी पंद्रह कार्यदिवसों के भीतर अपलोड करने पर आपके क्लेम पर पुनर्विचार किया जाएगा।';
      advice = `${actionPrefix} अपने अस्पताल से प्रारंभिक डॉक्टर परामर्श पर्चा लेकर पंद्रह दिनों के भीतर बीमा कंपनी के पोर्टल पर अपलोड करें या अपने बीमा एजेंट से तुरंत संपर्क करें।`;
    } else if (isTenancy) {
      explanation =
        readingLevel === 'simple'
          ? 'यह मकान मालिक का कानूनी नोटिस है। मकान मालिक का कहना है कि आप पिछले दो महीने का किराया, जो कुल चौबीस हजार रुपये बनता है, तुरंत चुकाएं। मकान मालिक चाहता है कि यदि आप किराया नहीं दे सकते तो तीस दिन के अंदर मकान खाली कर दें। यदि आप समय पर किराया दे देते हैं, तो आपको घर खाली करने की कोई जरूरत नहीं होगी।'
          : 'यह आपके मकान मालिक के वकील द्वारा भेजा गया कानूनी सूचना पत्र है। इसमें पिछले दो माह का बकाया किराया कुल राशि चौबीस हजार रुपये आगामी सात दिनों के भीतर बैंक खाते में जमा करने का निर्देश दिया गया है। ऐसा न करने की स्थिति में तीस दिनों के भीतर परिसर खाली करने का नोटिस दिया गया है। यदि आप नियत समय में संपूर्ण किराया जमा कर देते हैं, तो किरायेदारी समझौता पूर्ववत जारी रहेगा।';
      advice = `${actionPrefix} सात दिनों के भीतर अपने मकान मालिक से मिलकर बकाया किराया चुकाएं और लिखित रसीद अवश्य प्राप्त करें।`;
    } else {
      explanation =
        'यह एक आधिकारिक पत्र है। इसमें आपको सूचित किया गया है कि आपके द्वारा जमा किए गए आवेदन पत्र की समीक्षा पूरी हो चुकी है। सभी कागजात सही पाए गए हैं। आगामी माह की पहली तारीख से आपकी सेवाएं सक्रिय कर दी जाएंगी। किसी भी प्रकार का कोई अतिरिक्त जुर्माना या शुल्क देय नहीं है।';
      advice = `${actionPrefix} इस पत्र की एक प्रति अपने पास सुरक्षित रख लें और अगले महीने की पहली तारीख को अपने खाते की स्थिति की जांच करें।`;
    }
  } else if (language === 'bn') {
    explanation =
      'এটি একটি গুরুত্বপূর্ণ সরকারি বিজ্ঞপ্তি। আপনার জমা দেওয়া আবেদনটি যাচাই করা হয়েছে। মোট তিরিশ দিনের মধ্যে আপনাকে স্থানীয় কার্যালয়ে মূল নথিপত্র নিয়ে উপস্থিত হতে অনুরোধ করা হচ্ছে। কোনো অতিরিক্ত জরিমানা বা ফি নেই।';
    advice = `${actionPrefix} তিরিশ দিনের মধ্যে আপনার আধার কার্ড এবং প্রয়োজনীয় নথিপত্র নিয়ে স্থানীয় সহায়তা কেন্দ্রে যোগাযোগ করুন।`;
  } else if (language === 'ta') {
    explanation =
      'இது ஒரு முக்கியமான அதிகாரப்பூர்வ ஆவணம் ஆகும். நீங்கள் சமர்ப்பித்த விண்ணப்பம் சரிபார்க்கப்பட்டது. அடுத்த முப்பது நாட்களுக்குள் உங்கள் அசல் ஆவணங்களுடன் அருகிலுள்ள அலுவலகத்தை அணுக வேண்டும். கூடுதல் கட்டணம் எதுவும் செலுத்த தேவையில்லை.';
    advice = `${actionPrefix} முப்பது நாட்களுக்குள் உங்கள் அடையாள அட்டையுடன் சம்பந்தப்பட்ட அலுவலகத்தை நேரில் தொடர்பு கொள்ளவும்.`;
  } else if (language === 'te') {
    explanation =
      'ఇది ఒక ముఖ్యమైన అధికారిక పత్రం. మీరు సమర్పించిన దరఖాస్తు విజయవంతంగా పరిశీలించబడింది. రాబోయే ముప్పై రోజుల్లో మీ అసలు పత్రాలతో సమీప కార్యాలయాన్ని సంప్రదించాల్సిందిగా కోరడమైనది. ఎటువంటి అదనపు రుసుము చెల్లించాల్సిన అవసరం లేదు.';
    advice = `${actionPrefix} ముప్పై రోజులలోపు మీ గుర్తింపు కార్డుతో సంబంధిత కార్యాలయాన్ని సంప్రదించండి.`;
  } else if (language === 'mr') {
    explanation =
      'हे एक अधिकृत कागदपत्र आहे. तुमच्या अर्जाची तपासणी पूर्ण झाली आहे. पुढील तीस दिवसांच्या आत तुम्हाला मूळ कागदपत्रांसह स्थानिक कार्यालयात उपस्थित राहण्याची विनंती करण्यात आली आहे. कोणतेही अतिरिक्त शुल्क आकारले जाणार नाही.';
    advice = `${actionPrefix} तीस दिवसांच्या आत आपल्या ओळखीच्या पुराव्यासह स्थानिक कार्यालयात संपर्क साधा.`;
  } else {
    // English default
    if (isMedical) {
      explanation =
        readingLevel === 'simple'
          ? 'This is a hospital discharge summary and bill. The patient stayed in the hospital for three days for a chest infection. The total bill came to $3,450. Your health insurance has already paid $2,800 directly to the hospital. You only need to pay the remaining balance of $650 at the discharge desk. The doctor has prescribed two medicines that should be taken twice every day for one week.'
          : 'This is a hospital discharge report and billing breakdown. The patient was admitted from October 12 to October 15 for treatment of acute bronchitis. The overall hospital charges totaled $3,450, of which your health insurance provider covered $2,800 under pre-authorized benefits. The outstanding co-pay balance of $650 is due upon exit. Follow-up instructions include taking the prescribed oral antibiotics for seven days and attending a clinic checkup next Monday.';
      advice = `${actionPrefix} Pay the remaining $650 balance at the hospital billing desk and keep your receipt along with the prescription for your follow-up visit.`;
    } else if (isInsurance) {
      explanation =
        readingLevel === 'simple'
          ? 'This is a letter from your insurance company about your recent claim. They have paused your claim because one page from your doctor is missing. They need the first doctor visit note showing when your symptoms started. They have not permanently rejected your claim. If you send this missing page within thirty days, they will review your claim and issue payment.'
          : 'This is a formal claim inquiry notice from your health insurer. The claim has been temporarily held under Clause 3.2 pending submission of the initial diagnostic consultation receipt. The insurance company requires documentation verifying the onset date of the medical condition before authorizing reimbursement of $1,250. You are granted a 30-day window to submit the required records.';
      advice = `${actionPrefix} Request the initial consultation note from your doctor and upload it to the insurance portal within 30 days.`;
    } else if (isTenancy) {
      explanation =
        readingLevel === 'simple'
          ? 'This is a notice from your landlord. It says that you have not paid the last two months of rent, totaling $1,800. The landlord is asking you to either pay this full amount within fourteen days or move out by the end of next month. If you pay the $1,800 within two weeks, your lease continues normally and you do not need to move.'
          : 'This is a formal 14-day notice to cure or quit regarding your residential tenancy agreement. The property manager specifies an unpaid rental balance of $1,800 representing past-due rent for July and August. You are required to satisfy the delinquent balance within fourteen business days. Failure to do so will result in formal lease termination and repossession of the premises by the end of next month.';
      advice = `${actionPrefix} Contact your landlord or property manager within 14 days to pay the $1,800 balance or establish an approved payment agreement in writing.`;
    } else {
      explanation =
        readingLevel === 'simple'
          ? 'This is an official notice confirming that your submitted form has been reviewed. Everything is in good order. Your account will become active on the first day of next month. There are no fines or penalties to pay. Keep this letter in a safe place for your personal records.'
          : 'This official correspondence confirms the successful processing of your submitted documentation. All requirements have been satisfied, and your registration will take effect on the first of next month. No further documentation or outstanding balances are required at this stage.';
      advice = `${actionPrefix} Store a copy of this confirmation letter safely in your files and check your account on the first of next month.`;
    }
  }

  const rawText = `${explanation}\n\n${advice}`;
  return {
    rawText,
    isNoText: false,
    explanation,
    actionableAdvice: advice
  };
}
