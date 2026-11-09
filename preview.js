/**
 * BugBuster 9.0 - Live Render Sandbox & Device Auto-Scaler
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  BB.currentDevice = 'desktop';
  BB.desktopIsLandscape = false;

  BB.updatePreview = function(code) {
    const previewFrame = document.getElementById('preview-frame');
    if (!previewFrame) return;

    if (BB.currentMode === 'css') {
      const previewHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Live Sandbox</title>
  <style>
/* User Stylesheet Under Test */
${code}
  </style>
</head>
<body style="font-family:system-ui, -apple-system, sans-serif; padding:20px; background:#0f172a; color:#f8fafc; line-height:1.6;">
  <div class="container" style="max-width:960px; margin:0 auto;">
    <header class="glass-header" id="header" style="padding:14px 18px; margin-bottom:20px; border-radius:10px; background:rgba(30, 41, 59, 0.7); border:1px solid rgba(255,255,255,0.1);">
      <div id="nav" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <span class="badge" style="display:inline-flex; align-items:center; gap:6px; font-weight:700; font-size:12px;">🎨 CSS Live Sandbox</span>
        <nav id="menu" style="display:flex; gap:12px;">
          <a href="#home" class="nav-link" style="color:#38bdf8; text-decoration:none; font-size:13px; font-weight:600;">Home</a>
          <a href="#components" class="nav-link" style="color:#94a3b8; text-decoration:none; font-size:13px; font-weight:600;">Components</a>
        </nav>
      </div>
    </header>

    <main>
      <div class="hero-card card" style="background:#1e293b; border:1px solid #334155; border-radius:10px; padding:20px; margin-bottom:18px;">
        <span class="tag-label badge" style="margin-bottom:8px; display:inline-block;">Component Demo</span>
        <h2 class="card-title" style="margin:6px 0 10px 0; font-size:20px; font-weight:700;">Live Rendered Component</h2>
        <p style="color:#cbd5e1; font-size:13px; margin-bottom:14px;">
          This sandbox applies your active CSS selectors, colors, typography, and box model rules in real time.
        </p>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="button-primary" style="padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer;">Primary Button</button>
          <span class="floating-badge badge" style="padding:6px 12px; border-radius:6px; font-size:12px;">Badge State</span>
        </div>
      </div>

      <div class="custom-box" style="padding:16px; background:#1e293b; border-radius:8px; border:1px solid #334155; margin-bottom:18px;">
        <h3 style="font-size:15px; margin:0 0 6px 0; color:#38bdf8;">Container (.custom-box)</h3>
        <p style="font-size:12px; color:#94a3b8; margin:0;">Tests viewport widths, borders, and cross-browser effects.</p>
      </div>

      <div class="flex-item" style="padding:12px; border:1px dashed #475569; border-radius:6px; text-align:center;">
        <span style="font-size:12px; color:#94a3b8;">Flex child box (.flex-item)</span>
      </div>
    </main>
  </div>
</body>
</html>`;
      const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
      previewFrame.src = URL.createObjectURL(blob);
      return;
    }

    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    previewFrame.src = URL.createObjectURL(blob);
  };

  BB.getDesktopDevicePreset = function() {
    if (BB.currentDevice === 'mobile') {
      return BB.desktopIsLandscape
        ? { width: 667, height: 375, label: 'Mobile Landscape · 667 × 375' }
        : { width: 375, height: 667, label: 'Mobile Portrait · 375 × 667' };
    } else if (BB.currentDevice === 'tablet') {
      return BB.desktopIsLandscape
        ? { width: 1024, height: 768, label: 'Tablet Landscape · 1024 × 768' }
        : { width: 768, height: 1024, label: 'Tablet Portrait · 768 × 1024' };
    } else if (BB.currentDevice === 'desktop') {
      return { width: 1200, height: 800, label: 'Desktop · 1200 × 800' };
    } else {
      return { width: '100%', height: '100%', label: 'Fluid · 100%' };
    }
  };

  BB.updateDevicePreviewScale = function() {
    const stage = document.getElementById('preview-stage-container');
    const box = document.getElementById('preview-viewport-box');
    const wrapper = document.getElementById('preview-scale-wrapper');
    const dimBadge = document.getElementById('preview-dimension-badge');
    const scaleBadge = document.getElementById('preview-scale-badge');
    const desktopRotateBtn = document.getElementById('desktop-rotate-btn');
    if (!stage || !box || !wrapper) return;

    if (desktopRotateBtn) {
      desktopRotateBtn.style.display = (BB.currentDevice === 'mobile' || BB.currentDevice === 'tablet') ? 'inline-flex' : 'none';
    }

    const preset = BB.getDesktopDevicePreset();

    if (BB.currentDevice === 'fluid') {
      box.style.width = '100%';
      box.style.height = '100%';
      box.style.minHeight = '360px';
      wrapper.style.position = 'relative';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.transform = 'none';
      if (dimBadge) dimBadge.textContent = 'Fluid 100% · Responsive';
      if (scaleBadge) scaleBadge.textContent = 'Scale: 100%';
      return;
    }

    const stagePadding = 24;
    const availableW = Math.max(80, stage.clientWidth - stagePadding);
    const targetW = preset.width;
    const targetH = preset.height;

    const scale = Math.min(1, availableW / targetW);
    const renderedW = Math.round(targetW * scale);
    const renderedH = Math.round(targetH * scale);

    box.style.width = renderedW + 'px';
    box.style.height = renderedH + 'px';
    box.style.minHeight = renderedH + 'px';

    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = targetW + 'px';
    wrapper.style.height = targetH + 'px';
    wrapper.style.transform = `scale(${scale})`;

    const pct = Math.round(scale * 100);
    if (dimBadge) dimBadge.textContent = preset.label;
    if (scaleBadge) scaleBadge.textContent = `Scale: ${pct}%`;
  };

})(window.BugBuster);
