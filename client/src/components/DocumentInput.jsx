import React, { useState, useRef } from 'react';
import { FileText, Camera, Upload, X, AlertCircle } from 'lucide-react';
import ControlPills from './ControlPills';
import SamplePicker from './SamplePicker';

function optimizeImage(file, maxDimension = 1600, quality = 0.88) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64Data = optimizedDataUrl.split(',')[1];
          const approxKb = Math.round((base64Data.length * 3) / 4 / 1024);

          resolve({
            dataUrl: optimizedDataUrl,
            base64Data,
            mediaType: 'image/jpeg',
            sizeDisplay: `${approxKb} KB`
          });
        } catch {
          resolve({
            dataUrl: rawDataUrl,
            base64Data: rawDataUrl.split(',')[1],
            mediaType: file.type || 'image/jpeg',
            sizeDisplay: (file.size / 1024).toFixed(1) + ' KB'
          });
        }
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          base64Data: rawDataUrl.split(',')[1],
          mediaType: file.type || 'image/jpeg',
          sizeDisplay: (file.size / 1024).toFixed(1) + ' KB'
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function DocumentInput({
  onSubmit,
  isLoading,
  selectedLanguage,
  setSelectedLanguage,
  selectedLevel,
  setSelectedLevel,
  errorMessage,
  onClearError
}) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'photo'
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfWarning, setPdfWarning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isSampleDoc, setIsSampleDoc] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    onClearError?.();
    setPdfWarning(false);

    if (!file) return;

    // Check for PDF upload
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setPdfWarning(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check max file size (8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('Photo is too large. Please choose an image smaller than 8MB.');
      return;
    }

    // Check supported image types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, WEBP, or GIF image.');
      return;
    }

    // Optimize and compress image for fast upload and instant OCR
    optimizeImage(file).then((opt) => {
      setImageFile({
        name: file.name,
        size: opt.sizeDisplay,
        mediaType: opt.mediaType,
        data: opt.base64Data
      });
      setImagePreview(opt.dataUrl);
      setIsSampleDoc(false);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setPdfWarning(false);
    setIsSampleDoc(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSample = (sample) => {
    setActiveTab('text');
    setInputText(sample.text);
    setImageFile(null);
    setImagePreview(null);
    setPdfWarning(false);
    setIsSampleDoc(true);
    onClearError?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (activeTab === 'text') {
      if (!inputText.trim()) {
        alert('Please paste or type document text first.');
        return;
      }
      onSubmit({
        mode: 'text',
        text: inputText.trim(),
        language: selectedLanguage,
        readingLevel: selectedLevel,
        isSample: isSampleDoc
      });
    } else {
      if (!imageFile) {
        alert('Please select or drop a photo of your document.');
        return;
      }
      onSubmit({
        mode: 'photo',
        image: {
          data: imageFile.data,
          mediaType: imageFile.mediaType
        },
        fileName: imageFile.name,
        language: selectedLanguage,
        readingLevel: selectedLevel,
        isSample: false // Real uploaded photo is NEVER a sample!
      });
    }
  };

  const canSubmit = activeTab === 'text' ? inputText.trim().length > 0 : Boolean(imageFile);

  return (
    <section className="card-dark" style={{ marginBottom: '24px' }}>
      {/* Mode Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-ink-border)',
          paddingBottom: '14px',
          marginBottom: '16px'
        }}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'text'}
          onClick={() => {
            setActiveTab('text');
            setPdfWarning(false);
          }}
          className={`pill-btn ${activeTab === 'text' ? 'active-lamp' : ''}`}
          style={{ flex: 1 }}
        >
          <FileText size={18} />
          <span>Paste text</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'photo'}
          onClick={() => {
            setActiveTab('photo');
            setPdfWarning(false);
          }}
          className={`pill-btn ${activeTab === 'photo' ? 'active-lamp' : ''}`}
          style={{ flex: 1 }}
        >
          <Camera size={18} />
          <span>Upload a photo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab 1: Textarea */}
        {activeTab === 'text' ? (
          <div>
            <div style={{ position: 'relative' }}>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  onClearError?.();
                }}
                placeholder="Paste confusing document text here... (e.g. medical discharge summary, insurance claim query, eviction notice, bank charges letter)"
                rows={6}
                disabled={isLoading}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-ink)',
                  color: 'var(--color-text-main)',
                  border: '1px solid var(--color-ink-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  lineHeight: '1.6',
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '130px'
                }}
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  title="Clear text"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(20, 27, 24, 0.8)',
                    color: 'var(--color-text-dim)',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    minHeight: '28px',
                    padding: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                marginTop: '6px'
              }}
            >
              <span>{inputText.length} characters</span>
              <span>All medical & legal terms welcome</span>
            </div>

            <SamplePicker onSelectSample={handleSelectSample} disabled={isLoading} />
          </div>
        ) : (
          /* Tab 2: Photo Upload */
          <div>
            {!imagePreview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${
                    dragOver ? 'var(--color-lamp)' : 'var(--color-ink-border)'
                  }`,
                  backgroundColor: dragOver
                    ? 'rgba(231, 161, 60, 0.08)'
                    : 'var(--color-ink)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(244, 241, 231, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--color-lamp)'
                  }}
                >
                  <Upload size={24} />
                </div>
                <p
                  style={{
                    color: 'var(--color-paper)',
                    fontWeight: '600',
                    fontSize: '1.05rem',
                    marginBottom: '4px'
                  }}
                >
                  Click to browse or drag & drop a photo
                </p>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.88rem' }}>
                  Supports JPG, PNG, WEBP, GIF (up to 8MB)
                </p>
              </div>
            ) : (
              /* Image Selected Preview */
              <div
                style={{
                  backgroundColor: 'var(--color-ink)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-ink-border)',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={imagePreview}
                    alt="Document preview"
                    style={{
                      width: '54px',
                      height: '54px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid var(--color-ink-border)'
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        color: 'var(--color-paper)',
                        maxWidth: '320px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {imageFile?.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {imageFile?.size} • Ready for AI vision analysis
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                  style={{
                    backgroundColor: 'rgba(217, 119, 87, 0.15)',
                    color: 'var(--color-rust)',
                    border: '1px solid rgba(217, 119, 87, 0.3)',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    minHeight: '36px'
                  }}
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {/* Explicit PDF Interception Warning */}
            {pdfWarning && (
              <div
                style={{
                  marginTop: '12px',
                  backgroundColor: 'rgba(217, 119, 87, 0.12)',
                  border: '1px solid var(--color-rust)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <AlertCircle
                  size={20}
                  color="var(--color-rust)"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: '600',
                      color: 'var(--color-paper)',
                      fontSize: '0.95rem'
                    }}
                  >
                    PDFs aren't supported yet
                  </div>
                  <div
                    style={{
                      color: 'var(--color-text-dim)',
                      fontSize: '0.88rem',
                      lineHeight: '1.4'
                    }}
                  >
                    Please take a screenshot or photo of the page instead.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Language & Reading Level Selectors */}
        <ControlPills
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          disabled={isLoading}
        />

        {/* Submit Button */}
        <div style={{ marginTop: '24px' }}>
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="btn-lamp"
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                <span>
                  {activeTab === 'photo' ? 'Reading photo...' : 'Explaining...'}
                </span>
              </>
            ) : (
              <span>Explain this document</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
