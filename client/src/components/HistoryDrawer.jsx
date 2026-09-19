import React from 'react';
import { X, Clock, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="card-dark"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-ink-surface)',
          border: '1px solid var(--color-ink-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--color-ink-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--color-lamp)" />
            <h2
              style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                color: 'var(--color-paper)'
              }}
            >
              Past Explanations
            </h2>
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-dim)',
                backgroundColor: 'rgba(244, 241, 231, 0.08)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              {history.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-dim)',
              width: '36px',
              height: '36px',
              minHeight: '36px',
              padding: 0
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* List Content */}
        <div
          style={{
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--color-text-dim)'
              }}
            >
              <BookOpen
                size={36}
                color="var(--color-text-muted)"
                style={{ margin: '0 auto 12px' }}
              />
              <p style={{ fontWeight: '600', marginBottom: '4px' }}>No saved explanations yet</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                Documents you explain will be stored here so you can review and listen to them anytime.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === item.language) || {
                label: 'English'
              };
              const dateStr = new Date(item.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--color-ink)',
                    border: '1px solid var(--color-ink-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--color-lamp-light)',
                          color: 'var(--color-lamp)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}
                      >
                        {langObj.label}
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(244, 241, 231, 0.08)',
                          color: 'var(--color-text-dim)',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        {item.readingLevel === 'simple' ? 'Very simple' : 'Clear'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                        {dateStr}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHistoryItem(item.id);
                        }}
                        title="Delete from history"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'var(--color-text-muted)',
                          padding: '4px',
                          minHeight: 'auto'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--color-text-muted)',
                      fontStyle: 'italic',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    "{item.originalExcerpt}"
                  </div>

                  {/* Explanation Snippet */}
                  <div
                    style={{
                      fontSize: '0.94rem',
                      color: 'var(--color-paper)',
                      lineHeight: '1.5',
                      marginBottom: '10px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.explanation}
                  </div>

                  {/* Re-open button */}
                  <button
                    type="button"
                    onClick={() => {
                      onSelectHistoryItem(item);
                      onClose();
                    }}
                    style={{
                      backgroundColor: 'rgba(244, 241, 231, 0.08)',
                      color: 'var(--color-lamp)',
                      border: '1px solid rgba(231, 161, 60, 0.25)',
                      padding: '6px 14px',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      minHeight: '34px',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <span>View & Listen</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
