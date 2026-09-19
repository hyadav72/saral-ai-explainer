import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, Clock, FileText, CheckCircle2 } from 'lucide-react';
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
    native: 'English',
    speechCode: 'en-US'
  };

  // Reset and stop speech whenever result changes or card unmounts
  useEffect(() => {
    setIsPlaying(false);
    speechManager.stop();
    return () => {
      speechManager.stop();
    };
  }, [result.id, result.rawText, result.explanation]);

  const handleToggleAudio = () => {
    if (isPlaying) {
      speechManager.stop();
      setIsPlaying(false);
    } else {
      // Build speech text from explanation and actionable advice
      const speechText = result.actionableAdvice
        ? `${result.explanation}. ${result.actionableAdvice}`
        : result.explanation;

      speechManager.speak({
        text: speechText,
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
    const fullText = result.actionableAdvice
      ? `${result.explanation}\n\n${result.actionableAdvice}`
      : result.explanation;

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

  // Render structured text paragraphs and bullet points nicely
  const renderFormattedExplanation = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={index} style={{ height: '8px' }} />;
      }

      // Check if line is a bullet item
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.replace(/^[-•*]\s*/, '');
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              marginLeft: '8px',
              marginBottom: '6px'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-lamp)',
                display: 'inline-block',
                flexShrink: 0,
                marginTop: '8px'
              }}
            />
            <span style={{ fontSize: '1.08rem', lineHeight: '1.65' }}>
              {bulletText}
            </span>
          </div>
        );
      }

      // Check if line is a section header (e.g. "Document type:", "Important details:", "दस्तावेज़ का प्रकार:")
      const isHeader =
        trimmed.endsWith(':') ||
        trimmed.startsWith('Document type') ||
        trimmed.startsWith('What this document is') ||
        trimmed.startsWith('Important details') ||
        trimmed.startsWith('What it means') ||
        trimmed.startsWith('दस्तावेज़ का प्रकार') ||
        trimmed.startsWith('यह दस्तावेज़ क्या है') ||
        trimmed.startsWith('मुख्य विवरण') ||
        trimmed.startsWith('इसका क्या मतलब है');

      if (isHeader) {
        return (
          <div
            key={index}
            style={{
              fontWeight: '700',
              fontSize: '1.12rem',
              color: '#141B18',
              marginTop: index > 0 ? '14px' : '0',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {trimmed}
          </div>
        );
      }

      return (
        <p
          key={index}
          style={{
            fontSize: '1.08rem',
            lineHeight: '1.7',
            marginBottom: '10px'
          }}
        >
          {trimmed}
        </p>
      );
    });
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {result.documentType && (
            <span
              style={{
                backgroundColor: 'rgba(231, 161, 60, 0.2)',
                color: '#6B4208',
                fontSize: '0.85rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FileText size={13} />
              {result.documentType}
            </span>
          )}

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

      {/* Main Formatted Explanation Body */}
      <div
        style={{
          color: 'var(--color-paper-dark)',
          marginBottom: '20px'
        }}
      >
        {renderFormattedExplanation(result.explanation)}
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
        {/* Read Aloud Toggle Button with active state indicator */}
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
              <span>Stop</span>
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
