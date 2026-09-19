import React from 'react';
import { History, Sparkles, HelpCircle } from 'lucide-react';

export default function Header({ historyCount, onOpenHistory, aiStatus }) {
  return (
    <header style={{ marginBottom: '28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-lamp)',
              color: 'var(--color-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(231, 161, 60, 0.3)'
            }}
          >
            स
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '1.4rem',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  color: 'var(--color-paper)'
                }}
              >
                Saral
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-dim)',
                  backgroundColor: 'rgba(244, 241, 231, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                सरल
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {aiStatus === 'live-claude' ? (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-lamp)',
                backgroundColor: 'var(--color-lamp-light)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(231, 161, 60, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} /> Claude Vision
            </span>
          ) : aiStatus === 'live-gemini' ? (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-lamp)',
                backgroundColor: 'var(--color-lamp-light)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(231, 161, 60, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} /> Gemini Vision
            </span>
          ) : (
            <span
              title="Real-time Document Vision & OCR engine active. Add ANTHROPIC_API_KEY in .env for Claude LLM."
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-teal)',
                backgroundColor: 'var(--color-teal-light)',
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(76, 148, 142, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={12} /> Vision & OCR
            </span>
          )}

          <button
            onClick={onOpenHistory}
            className="btn-secondary"
            style={{
              fontSize: '0.9rem',
              padding: '6px 12px',
              minHeight: '38px',
              borderRadius: '20px'
            }}
            aria-label="View past explanations"
          >
            <History size={16} />
            <span>Past ({historyCount})</span>
          </button>
        </div>
      </div>

      <h1 className="brand-headline" style={{ marginBottom: '10px' }}>
        Paste it or photograph it. Get it explained like a person would.
      </h1>

      <p
        style={{
          color: 'var(--color-text-dim)',
          fontSize: '1.02rem',
          lineHeight: '1.55',
          maxWidth: '560px'
        }}
      >
        Clear, human explanations for medical bills, insurance letters, bank forms,
        and legal notices — in your language, read aloud.
      </p>
    </header>
  );
}
