import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { speechManager } from '../utils/speech';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

export default function ResultCard({
  result,
  onAudioBlocked
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find language speech code
  const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === result.language) || {
    label: 'English',
    speechCode: 'en-US'
  };

  // Stop speech when result changes or unmounts
  useEffect(() => {
    setIsPlaying(false);
    speechManager.stop();
    return () => {
      speechManager.stop();
    };
  }, [result.id, result.rawText]);

  const handleToggleAudio = () => {
    if (isPlaying) {
      speechManager.stop();
      setIsPlaying(false);
    } else {
      const fullSpeechText = `${result.explanation}. ${result.actionableAdvice}`;
      speechManager.speak({
        text: fullSpeechText,
        speechCode: langObj.speechCode,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
        onError: (errMessage) => {
          setIsPlaying(false);
          onAudioBlocked?.(errMessage);
        }
      });
    }
  };

  const handleCopy = () => {
    const fullText = `${result.explanation}\n\n${result.actionableAdvice}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format timestamp
  const dateFormatted = result.timestamp
    ? new Date(result.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <article
      className="card-paper"
      style={{
        marginBottom: '24px',
        animation: 'fadeIn 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Top Meta Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-paper-border)',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: 'rgba(20, 27, 24, 0.08)',
              color: 'var(--color-paper-dark)',
              fontSize: '0.82rem',
              fontWeight: '600',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {langObj.label} ({langObj.native})
          </span>
          <span
            style={{
              backgroundColor: 'rgba(76, 148, 142, 0.15)',
              color: '#1e534f',
              fontSize: '0.82rem',
              fontWeight: '600',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)'
            }}
          >
            {result.readingLevel === 'simple' ? 'Very Simple' : 'Clear'}
          </span>
        </div>

        {dateFormatted && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8rem',
              color: 'var(--color-paper-muted)'
            }}
          >
            <Clock size={13} />
            <span>{dateFormatted}</span>
          </div>
        )}
      </div>

      {/* Main Explanation Body */}
      <div
        style={{
          fontSize: '1.14rem',
          lineHeight: '1.75',
          color: 'var(--color-paper-dark)',
          marginBottom: '20px',
          whiteSpace: 'pre-line'
        }}
      >
        {result.explanation}
      </div>

      {/* Action Banner ("What you should do") */}
      {result.actionableAdvice && (
        <div
          style={{
            backgroundColor: 'rgba(231, 161, 60, 0.15)',
            borderLeft: '4px solid var(--color-lamp)',
            borderRadius: '0 8px 8px 0',
            padding: '14px 18px',
            marginBottom: '22px'
          }}
        >
          <div
            style={{
              fontSize: '1.08rem',
              lineHeight: '1.65',
              fontWeight: '600',
              color: '#5C3802'
            }}
          >
            {result.actionableAdvice}
          </div>
        </div>
      )}

      {/* Actions Toolbar: Read Aloud + Copy */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-paper-border)',
          paddingTop: '16px',
          gap: '12px'
        }}
      >
        <button
          type="button"
          onClick={handleToggleAudio}
          className={isPlaying ? 'btn-lamp' : 'btn-secondary'}
          style={{
            backgroundColor: isPlaying ? 'var(--color-lamp)' : '#2B3530',
            color: isPlaying ? 'var(--color-lamp-text)' : '#F4F1E7',
            padding: '10px 20px',
            minHeight: '44px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            fontSize: '0.98rem'
          }}
          aria-label={isPlaying ? 'Stop reading aloud' : 'Read explanation aloud'}
        >
          {isPlaying ? (
            <>
              <VolumeX size={18} />
              <span>Stop audio</span>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '4px' }}>
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
              </div>
            </>
          ) : (
            <>
              <Volume2 size={18} />
              <span>Read aloud</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-paper-dark)',
            border: '1px solid var(--color-paper-border)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem'
          }}
        >
          {copied ? (
            <>
              <Check size={16} color="#2A7B4C" />
              <span style={{ color: '#2A7B4C', fontWeight: '600' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
