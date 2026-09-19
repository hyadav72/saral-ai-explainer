import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DocumentInput from './components/DocumentInput';
import ResultCard from './components/ResultCard';
import HistoryDrawer from './components/HistoryDrawer';
import Toast from './components/Toast';
import { getOrCreateDeviceId } from './utils/deviceId';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [selectedLevel, setSelectedLevel] = useState('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiStatus, setAiStatus] = useState('demo-mode');

  const resultRef = useRef(null);

  const deviceId = getOrCreateDeviceId();

  // Load server status and history on initial mount
  useEffect(() => {
    // Health check
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.aiStatus) {
          setAiStatus(data.aiStatus);
        }
      })
      .catch((err) => {
        console.warn('Could not reach backend health check:', err);
      });

    // Fetch past explanations
    fetch(`/api/history?deviceId=${encodeURIComponent(deviceId)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setHistory(resData.data);
        }
      })
      .catch((err) => {
        console.warn('Could not load history:', err);
      });
  }, [deviceId]);

  // Handle document submission (text or photo)
  const handleSubmitDocument = async (payload) => {
    setIsLoading(true);
    setToast(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId
        },
        body: JSON.stringify({
          ...payload,
          deviceId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.code === 'NO_TEXT_FOUND') {
          setToast({
            type: 'error',
            title: "Couldn't read document",
            message: data.message || "We couldn't detect readable text in that document. Please try a clearer photo or paste the text directly."
          });
        } else {
          setToast({
            type: 'error',
            title: 'Explanation Notice',
            message: data.message || 'Something went wrong while simplifying this document. Please try again.'
          });
        }
        setIsLoading(false);
        return;
      }

      // Success
      setCurrentResult(data);

      // Update history list
      setHistory((prev) => [
        {
          id: data.id,
          deviceId,
          timestamp: data.timestamp,
          originalExcerpt: payload.text
            ? payload.text.substring(0, 140)
            : `Photo: ${payload.fileName || 'Uploaded image'}`,
          language: data.language,
          readingLevel: data.readingLevel,
          explanation: data.explanation,
          actionableAdvice: data.actionableAdvice
        },
        ...prev.filter((item) => item.id !== data.id)
      ]);

      // Scroll smoothly down to the result card
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (error) {
      console.error('Submission error:', error);
      setToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the explanation server. Please check your internet or local server.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await fetch(`/api/history/${id}?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE'
      });
      setHistory((prev) => prev.filter((item) => item.id !== id));
      if (currentResult?.id === id) {
        setCurrentResult(null);
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleAudioBlocked = (message) => {
    setToast({
      type: 'info',
      title: 'Speech Audio Notice',
      message: message || 'Speech audio could not start on this browser. Voice availability varies by device.'
    });
  };

  return (
    <main style={{ minHeight: '100%', width: '100%' }}>
      {/* Header */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        aiStatus={aiStatus}
      />

      {/* Document Input Section */}
      <DocumentInput
        onSubmit={handleSubmitDocument}
        isLoading={isLoading}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
      />

      {/* Result Card Section */}
      <div ref={resultRef}>
        {currentResult && (
          <ResultCard
            result={currentResult}
            onAudioBlocked={handleAudioBlocked}
          />
        )}
      </div>

      {/* History Drawer / Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setCurrentResult(item);
          setSelectedLanguage(item.language);
          setSelectedLevel(item.readingLevel);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onDeleteHistoryItem={handleDeleteHistory}
      />

      {/* Accessible Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Footer */}
      <footer
        style={{
          marginTop: '48px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-ink-border)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem',
          lineHeight: '1.6'
        }}
      >
        <p>
          <strong>Saral (सरल)</strong> — Built for HackDevengers 2.0 (Open Innovation Track, sponsored by Lovable).
        </p>
        <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>
          Empowering elders & vernacular speakers with human document clarity and text-to-speech.
        </p>
      </footer>
    </main>
  );
}
