import React from 'react';
import { SAMPLE_DOCUMENTS } from '../constants/sampleDocs';
import { Sparkles } from 'lucide-react';

export default function SamplePicker({ onSelectSample, disabled }) {
  return (
    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-ink-border)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          color: 'var(--color-text-dim)',
          marginBottom: '8px'
        }}
      >
        <Sparkles size={14} color="var(--color-lamp)" />
        <span>Or try a realistic confusing document:</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {SAMPLE_DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectSample(doc)}
            style={{
              backgroundColor: 'rgba(244, 241, 231, 0.05)',
              border: '1px solid var(--color-ink-border)',
              color: 'var(--color-paper)',
              fontSize: '0.85rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              minHeight: '36px',
              textAlign: 'left'
            }}
          >
            {doc.title}
          </button>
        ))}
      </div>
    </div>
  );
}
