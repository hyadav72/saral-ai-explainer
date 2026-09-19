// Robust Web Speech API Manager for Saral
class SpeechManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.currentText = '';
    this.currentLang = 'en';
    this.activeUtterance = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;

    if (this.synth) {
      // Load voices immediately and listen for voice load events
      this.loadVoices();
      if (typeof this.synth.onvoiceschanged !== 'undefined') {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    try {
      const v = this.synth.getVoices();
      if (v && v.length > 0) {
        this.voices = v;
      }
    } catch (e) {
      console.warn('Error loading voices:', e);
    }
  }

  isSupported() {
    return Boolean(this.synth && typeof SpeechSynthesisUtterance !== 'undefined');
  }

  getBestVoice(speechCode) {
    if (!this.voices.length) {
      this.loadVoices();
    }
    if (!this.voices.length) return null;

    const normalizedCode = speechCode.toLowerCase().replace('_', '-');
    const primaryLang = normalizedCode.split('-')[0];

    // Priority 1: Exact match on lang code (e.g. 'hi-in' or 'bn-in')
    let match = this.voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === normalizedCode
    );
    if (match) return match;

    // Priority 2: Primary language match (e.g. starts with 'hi')
    match = this.voices.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(primaryLang)
    );
    if (match) return match;

    // Priority 3: Name matches language name (e.g. 'Hindi', 'Bengali', 'Tamil')
    const langNames = {
      hi: ['hindi', 'हिन्दी', 'devanagari', 'kalpana', 'hemant'],
      bn: ['bengali', 'bangla', 'বাংলা'],
      ta: ['tamil', 'தமிழ்'],
      te: ['telugu', 'తెలుగు'],
      mr: ['marathi', 'मराठी'],
      en: ['india', 'english']
    };

    const targetKeywords = langNames[primaryLang] || [];
    if (targetKeywords.length > 0) {
      match = this.voices.find((v) => {
        const voiceName = (v.name + ' ' + v.lang).toLowerCase();
        return targetKeywords.some((kw) => voiceName.includes(kw));
      });
      if (match) return match;
    }

    // Priority 4: Default system voice
    return this.voices.find((v) => v.default) || this.voices[0] || null;
  }

  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      .replace(/[*#_`~]/g, '') // remove markdown symbols
      .replace(/[-•–—]/g, ' ') // replace bullets with breath spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  speak({ text, speechCode = 'hi-IN', onStart, onEnd, onError }) {
    if (!this.isSupported()) {
      onError?.(
        'Speech synthesis is not supported on this browser. Try Chrome, Edge, or Safari.'
      );
      return;
    }

    // Stop any existing playback first
    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      return;
    }

    this.currentText = cleanText;
    this.currentLang = speechCode;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;
    this.onErrorCallback = onError;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = speechCode;
      utterance.rate = 0.92; // Slightly relaxed pace for elderly clarity
      utterance.pitch = 1.0;

      const voice = this.getBestVoice(speechCode);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        onStart?.();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.activeUtterance = null;
        window._saralActiveUtterance = null;
        onEnd?.();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.activeUtterance = null;
        window._saralActiveUtterance = null;

        // Ignore cancellations when user clicks stop
        if (event.error === 'canceled' || event.error === 'interrupted') {
          onEnd?.();
          return;
        }

        console.warn('Speech synthesis playback event error:', event.error);
        onError?.(
          'Speech playback encountered an issue on this browser/device. Please check audio permissions or system sound.'
        );
      };

      // Store globally to prevent Chromium garbage collection bug from cutting off speech
      this.activeUtterance = utterance;
      window._saralActiveUtterance = utterance;

      // Resume if previously paused in Chrome
      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
      this.isPlaying = true;
    } catch (err) {
      console.error('Speech speak error:', err);
      this.isPlaying = false;
      onError?.('Could not initiate speech playback.');
    }
  }

  pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      try {
        this.synth.pause();
        this.isPaused = true;
      } catch (e) {
        console.warn('Pause error:', e);
      }
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      try {
        this.synth.resume();
        this.isPaused = false;
      } catch (e) {
        console.warn('Resume error:', e);
      }
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.activeUtterance = null;
    window._saralActiveUtterance = null;
  }
}

export const speechManager = new SpeechManager();
