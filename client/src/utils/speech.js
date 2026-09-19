class SpeechManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
    this.startWatchdog = null;
  }

  isSupported() {
    return Boolean(this.synth && typeof SpeechSynthesisUtterance !== 'undefined');
  }

  getBestVoice(speechCode) {
    if (!this.synth) return null;
    const voices = this.synth.getVoices() || [];
    if (!voices.length) return null;

    // Direct match (e.g. 'hi-IN')
    let match = voices.find(
      (v) => v.lang === speechCode || v.lang.replace('_', '-') === speechCode
    );

    // Prefix match (e.g. 'hi')
    if (!match) {
      const prefix = speechCode.split('-')[0].toLowerCase();
      match = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    }

    return match || null;
  }

  speak({ text, speechCode = 'en-US', onStart, onEnd, onError }) {
    if (!this.isSupported()) {
      onError?.(
        'Speech synthesis is not supported on this browser. Try Chrome, Edge, or Safari.'
      );
      return;
    }

    // Stop any existing speech first
    this.stop();

    if (!text || !text.trim()) {
      return;
    }

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Rate set slightly slowed for elderly clarity
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = speechCode;

    // Pick best matching voice if available
    const voice = this.getBestVoice(speechCode);
    if (voice) {
      utterance.voice = voice;
    }

    let started = false;

    // Setup 1.2s watchdog timer to detect silent audio blocking / lack of voices
    this.startWatchdog = setTimeout(() => {
      if (!started && this.isPlaying) {
        console.warn('Speech synthesis onstart did not fire within 1.2s.');
        this.stop();
        onError?.(
          'Speech could not start audio on this device or browser. Please check device sound settings or test with a supported voice.'
        );
      }
    }, 1200);

    utterance.onstart = () => {
      started = true;
      if (this.startWatchdog) {
        clearTimeout(this.startWatchdog);
        this.startWatchdog = null;
      }
      this.isPlaying = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (this.startWatchdog) {
        clearTimeout(this.startWatchdog);
        this.startWatchdog = null;
      }
      onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isPlaying = false;
      if (this.startWatchdog) {
        clearTimeout(this.startWatchdog);
        this.startWatchdog = null;
      }
      console.warn('SpeechSynthesis error:', event);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        onError?.(
          `Speech playback issue (${event.error || 'unknown'}). Please check your browser audio permissions.`
        );
      } else {
        onEnd?.();
      }
    };

    this.currentUtterance = utterance;
    this.isPlaying = true;

    // Required for Chrome bug where long speech pauses or cancels
    try {
      this.synth.cancel(); // clear previous queue
      this.synth.speak(utterance);
    } catch (e) {
      this.isPlaying = false;
      clearTimeout(this.startWatchdog);
      onError?.('Failed to initiate speech playback.');
    }
  }

  stop() {
    if (this.startWatchdog) {
      clearTimeout(this.startWatchdog);
      this.startWatchdog = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        // ignore
      }
    }
    this.isPlaying = false;
    this.currentUtterance = null;
  }
}

export const speechManager = new SpeechManager();
