import React, { useState } from 'react';
import { History, Sparkles, Key, X, Check } from 'lucide-react';

export default function Header({ historyCount, onOpenHistory, aiStatus, onKeyChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState(() => localStorage.getItem('saral_custom_key') || '');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmed = inputKey.trim();
    if (trimmed) {
      localStorage.setItem('saral_custom_key', trimmed);
      onKeyChange?.(trimmed);
      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        setIsModalOpen(false);
      }, 900);
    } else {
      localStorage.removeItem('saral_custom_key');
      onKeyChange?.('');
      setIsModalOpen(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('saral_custom_key');
    setInputKey('');
    onKeyChange?.('');
    setIsModalOpen(false);
  };

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
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer'
            }}
            title="Configure AI Vision Engine (Click to view or add Gemini API key)"
          >
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
          </button>

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

      {/* AI Engine Settings Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 14, 12, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="card-dark"
            style={{
              maxWidth: '480px',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-ink-border)',
              padding: '24px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="var(--color-lamp)" />
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-paper)', margin: 0 }}>
                  AI Engine Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Saral includes a built-in offline document intelligence & OCR engine.
              To enable ultra-fast multimodal Google Gemini 1.5 Flash Vision (free 15 requests/min), you can paste a Google Gemini API Key below.
            </p>

            <form onSubmit={handleSaveKey}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '6px'
                  }}
                >
                  Google Gemini / Claude API Key (Optional):
                </label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy... or sk-ant-..."
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-ink)',
                    color: 'var(--color-text-main)',
                    border: '1px solid var(--color-ink-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    fontSize: '0.95rem'
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '6px' }}>
                  🔒 Key is kept purely in your browser localStorage and never stored on any server.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {inputKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="btn-secondary"
                    style={{ fontSize: '0.88rem', padding: '6px 14px' }}
                  >
                    Reset to Default
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-lamp"
                  style={{ fontSize: '0.88rem', padding: '6px 18px' }}
                >
                  {savedMsg ? (
                    <>
                      <Check size={14} /> Saved!
                    </>
                  ) : (
                    'Save Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
