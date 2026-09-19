import React from 'react';
import { SUPPORTED_LANGUAGES, READING_LEVELS } from '../constants/languages';

export default function ControlPills({
  selectedLanguage,
  onSelectLanguage,
  selectedLevel,
  onSelectLevel,
  disabled
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '18px' }}>
      {/* Target Language Selection */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-paper)',
            marginBottom: '8px'
          }}
        >
          Explain in this language:
        </label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}
          role="radiogroup"
          aria-label="Target language"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectLanguage(lang.id)}
                className={`pill-btn ${isSelected ? 'active-lamp' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '6px'
                }}
              >
                <span>{lang.label}</span>
                {lang.native !== lang.label && (
                  <span
                    style={{
                      fontSize: '0.82rem',
                      opacity: isSelected ? 0.9 : 0.65
                    }}
                  >
                    ({lang.native})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reading Level Selection */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--color-paper)',
            marginBottom: '8px'
          }}
        >
          Reading level:
        </label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}
          role="radiogroup"
          aria-label="Reading level"
        >
          {READING_LEVELS.map((level) => {
            const isSelected = selectedLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => onSelectLevel(level.id)}
                className={`pill-btn ${isSelected ? 'active-teal' : ''}`}
                title={level.description}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{level.title}</span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    opacity: isSelected ? 0.95 : 0.6,
                    fontWeight: 'normal'
                  }}
                >
                  — {level.description.split(',')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
