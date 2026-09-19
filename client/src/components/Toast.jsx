import React from 'react';
import { AlertCircle, X, Info } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        width: '90%',
        maxWidth: '520px',
        backgroundColor: isError ? '#3B1812' : '#1C2E28',
        border: `1px solid ${isError ? 'var(--color-rust)' : 'var(--color-teal)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
        animation: 'slideUp 0.25s ease'
      }}
      role="alert"
    >
      {isError ? (
        <AlertCircle size={20} color="var(--color-rust)" style={{ flexShrink: 0, marginTop: '2px' }} />
      ) : (
        <Info size={20} color="var(--color-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
      )}

      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontWeight: '600', color: 'var(--color-paper)', fontSize: '0.95rem', marginBottom: '2px' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dim)', lineHeight: '1.45' }}>
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          backgroundColor: 'transparent',
          color: 'var(--color-text-dim)',
          minHeight: 'auto',
          padding: '2px'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
