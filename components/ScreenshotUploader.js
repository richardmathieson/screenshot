'use client';

import { useState, useRef, useCallback } from 'react';

export default function ScreenshotUploader() {
  const [token, setToken] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [screenshots, setScreenshots] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [view, setView] = useState('capture');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBlob, setPreviewBlob] = useState(null);
  const canvasRef = useRef(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Please enter your Vercel Blob read/write token.');
      return;
    }
    setTokenSaved(true);
    setError(null);
    setSuccess('Token saved for this session.');
    setTimeout(() => setSuccess(null), 2000);
  };

  const captureScreen = useCallback(async () => {
    clearMessages();
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaType: 'screen' },
        preferCurrentTab: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      await new Promise((r) => setTimeout(r, 200));

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewBlob(blob);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Screen capture failed: ' + err.message);
      }
    } finally {
      setCapturing(false);
    }
  }, []);

  const uploadToVercel = useCallback(async () => {
    if (!previewBlob) return;
    if (!token.trim()) {
      setError('Set your Vercel Blob token in Settings first.');
      return;
    }

    clearMessages();
    setUploading(true);

    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;

    try {
      const response = await fetch(
        `https://blob.vercel-storage.com/${filename}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-version': '7',
            'content-type': 'image/png',
          },
          body: previewBlob,
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed (${response.status}): ${text}`);
      }

      const data = await response.json();
      const newScreenshot = {
        id: timestamp,
        url: data.url,
        pathname: data.pathname,
        uploadedAt: new Date().toISOString(),
        size: previewBlob.size,
      };

      setScreenshots((prev) => [newScreenshot, ...prev]);
      setPreviewUrl(null);
      setPreviewBlob(null);
      setSuccess('Screenshot uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [previewBlob, token]);

  const discardPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBlob(null);
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setSuccess('URL copied!');
    setTimeout(() => setSuccess(null), 1500);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return (
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' +
      d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    );
  };

  return (
    <div className="sb-container">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <header className="sb-header">
        <div className="sb-logo-row">
          <div className="sb-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <h1 className="sb-logo-text">SnapBlob</h1>
        </div>
        <p className="sb-tagline">Capture → Upload → Share</p>
      </header>

      {/* Nav */}
      <nav className="sb-nav">
        {['capture', 'gallery', 'settings'].map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); clearMessages(); }}
            className={`sb-nav-btn ${view === v ? 'sb-nav-btn-active' : ''}`}
          >
            {v === 'capture' && '📸 Capture'}
            {v === 'gallery' && `🖼 Gallery${screenshots.length ? ` (${screenshots.length})` : ''}`}
            {v === 'settings' && '⚙️ Settings'}
          </button>
        ))}
      </nav>

      {/* Messages */}
      {error && (
        <div className="sb-error-box">
          <span style={{ marginRight: 8 }}>⚠️</span>{error}
          <button onClick={() => setError(null)} className="sb-dismiss-btn">✕</button>
        </div>
      )}
      {success && (
        <div className="sb-success-box">
          <span style={{ marginRight: 8 }}>✓</span>{success}
        </div>
      )}

      {/* Token warning */}
      {!tokenSaved && view === 'capture' && (
        <div className="sb-warning-box">
          <strong>Setup required:</strong> Add your Vercel Blob token in Settings before uploading.
        </div>
      )}

      {/* CAPTURE VIEW */}
      {view === 'capture' && (
        <div className="sb-content">
          {!previewUrl ? (
            <div className="sb-capture-zone">
              <div className="sb-capture-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c4f042" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <p className="sb-capture-label">
                Select a screen, window, or tab to capture
              </p>
              <button
                onClick={captureScreen}
                disabled={capturing}
                className="sb-primary-btn"
                style={{ opacity: capturing ? 0.6 : 1 }}
              >
                {capturing ? (
                  <span className="sb-spinner-wrap">
                    <span className="sb-spinner" />
                    Waiting for selection…
                  </span>
                ) : (
                  'Take Screenshot'
                )}
              </button>
            </div>
          ) : (
            <div className="sb-preview-zone">
              <div className="sb-preview-header">
                <span className="sb-preview-title">Preview</span>
                <span className="sb-preview-size">
                  {previewBlob && formatBytes(previewBlob.size)}
                </span>
              </div>
              <div className="sb-preview-img-wrap">
                <img src={previewUrl} alt="Screenshot preview" className="sb-preview-img" />
              </div>
              <div className="sb-preview-actions">
                <button
                  onClick={uploadToVercel}
                  disabled={uploading || !tokenSaved}
                  className="sb-primary-btn"
                  style={{ opacity: uploading || !tokenSaved ? 0.6 : 1, flex: 1 }}
                >
                  {uploading ? (
                    <span className="sb-spinner-wrap">
                      <span className="sb-spinner" />
                      Uploading…
                    </span>
                  ) : (
                    'Upload to Vercel Blob'
                  )}
                </button>
                <button onClick={discardPreview} className="sb-secondary-btn">
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GALLERY VIEW */}
      {view === 'gallery' && (
        <div className="sb-content">
          {screenshots.length === 0 ? (
            <div className="sb-empty-state">
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🖼</div>
              <p style={{ color: '#888', fontSize: 14 }}>
                No screenshots uploaded yet. Capture one to get started.
              </p>
            </div>
          ) : (
            <div className="sb-gallery">
              {screenshots.map((s) => (
                <div key={s.id} className="sb-gallery-card">
                  <div className="sb-gallery-thumb-wrap">
                    <img src={s.url} alt={s.pathname} className="sb-gallery-thumb" />
                  </div>
                  <div className="sb-gallery-info">
                    <div className="sb-gallery-filename">{s.pathname}</div>
                    <div className="sb-gallery-meta">
                      {formatBytes(s.size)} · {formatTime(s.uploadedAt)}
                    </div>
                    <div className="sb-gallery-actions">
                      <button onClick={() => copyUrl(s.url)} className="sb-small-btn">
                        Copy URL
                      </button>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="sb-small-btn-link">
                        Open ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS VIEW */}
      {view === 'settings' && (
        <div className="sb-content">
          <div className="sb-settings-card">
            <h2 className="sb-settings-title">Vercel Blob Storage</h2>
            <p className="sb-settings-desc">
              Enter your <code className="sb-code">BLOB_READ_WRITE_TOKEN</code> from{' '}
              <span style={{ color: '#c4f042' }}>Vercel Dashboard → Storage → Your Blob Store → Tokens</span>.
              The token stays in memory only — it&apos;s never persisted or sent anywhere except Vercel&apos;s API.
            </p>
            <div className="sb-token-input-group">
              <input
                type="password"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenSaved(false);
                }}
                placeholder="vercel_blob_rw_xxxxxxxxxxxx"
                className="sb-token-input"
              />
              <button onClick={handleSaveToken} className="sb-primary-btn">
                {tokenSaved ? '✓ Saved' : 'Save Token'}
              </button>
            </div>
            {tokenSaved && (
              <div className="sb-token-status">
                <span className="sb-green-dot" /> Token active for this session
              </div>
            )}
          </div>

          <div className="sb-settings-card">
            <h2 className="sb-settings-title">How It Works</h2>
            <div className="sb-steps">
              {[
                { num: 1, title: 'Create a Blob Store', desc: 'Go to your Vercel Dashboard → Storage → Create → Blob Store' },
                { num: 2, title: 'Get a Token', desc: 'In your Blob Store settings, generate a read/write token' },
                { num: 3, title: 'Paste & Capture', desc: 'Paste the token above, then start capturing screenshots' },
              ].map((step) => (
                <div key={step.num} className="sb-step">
                  <div className="sb-step-num">{step.num}</div>
                  <div>
                    <strong style={{ color: '#e8e8e8' }}>{step.title}</strong>
                    <p className="sb-step-text">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="sb-footer">
        <span>SnapBlob — screenshots to Vercel Blob in one click</span>
      </footer>
    </div>
  );
}
