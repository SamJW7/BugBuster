/**
 * BugBuster 9.0 - Main Application Entry & Event Controller
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

// Suppress benign browser ResizeObserver loop notification error
window.addEventListener('error', function(e) {
  if (
    e.message &&
    (e.message.includes('ResizeObserver loop') ||
     e.message.includes('ResizeObserver loop completed with undelivered notifications'))
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
});

(function(BB) {
  'use strict';

  // State initialization
  BB.currentMode = 'full';
  BB.currentLanguage = localStorage.getItem('bugbuster_lang') || 'taglish';

  BB.modeBuffers = {
    css: BB.SAMPLE_CSS_BUGGY,
    html: BB.SAMPLE_HTML_BUGGY,
    full: BB.SAMPLE_FULL_BUGGY
  };

  // DOM Elements
  const editor = document.getElementById('code-editor');
  const lineNumbers = document.getElementById('line-numbers');
  const highlightsLayer = document.getElementById('editor-highlights-layer');
  const teacherToggle = document.getElementById('teacher-toggle');
  const modalTeacherToggle = document.getElementById('modal-teacher-toggle');
  const tabBody = document.getElementById('right-tab-body');
  const btnScrollTop = document.getElementById('btn-scroll-top');
  const floatingGlobalTop = document.getElementById('floating-global-top');
  const mobileDrawerToggle = document.getElementById('mobile-drawer-toggle');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBackBtn = document.getElementById('drawer-back-btn');
  const drawerViewportCloseBtn = document.getElementById('drawer-viewport-close-btn');
  const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
  const drawerActionExport = document.getElementById('drawer-action-export');
  const mobileHeaderAutofix = document.getElementById('mobile-header-autofix');
  const btnSettingsOpen = document.getElementById('btn-settings-open');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const btnSettingsDone = document.getElementById('btn-settings-done');
  const btnSettingsReset = document.getElementById('btn-settings-reset');
  const settingsModal = document.getElementById('settings-modal');
  const diagFontSlider = document.getElementById('diag-font-slider');
  const mobileNavEditor = document.getElementById('mobile-nav-editor');
  const mobileNavInspector = document.getElementById('mobile-nav-inspector');
  const mobileModeBadge = document.getElementById('mobile-mode-badge');
  const desktopRotateBtn = document.getElementById('desktop-rotate-btn');
  const desktopRotateLabel = document.getElementById('desktop-rotate-label');

  // Unified Mode Switcher
  function setAppMode(targetMode, autoCloseOnMobile = false) {
    if (!targetMode) return;
    if (targetMode === BB.currentMode && !autoCloseOnMobile) return;

    if (editor) BB.modeBuffers[BB.currentMode] = editor.value;
    BB.currentMode = targetMode;

    document.querySelectorAll('.mode-btn').forEach(b => {
      if (b.getAttribute('data-mode') === targetMode) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('#setting-group-mode .theme-opt-btn').forEach(b => {
      if (b.getAttribute('data-mode') === targetMode) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    const titleElem = document.getElementById('panel-mode-title');
    const badgeElem = document.getElementById('panel-scope-badge');
    const diagScopeElem = document.getElementById('diag-scope-desc');
    const modalModeLabel = document.getElementById('active-modal-mode-label');
    const mobileModeIcon = document.getElementById('mobile-mode-icon');
    const mobileModeLabel = document.getElementById('mobile-mode-label');

    let modeNameEn = 'CSS Analyzer';
    let modeNameTl = 'CSS Mode';

    if (BB.currentMode === 'css') {
      modeNameEn = 'CSS Analyzer';
      modeNameTl = 'CSS Mode';
      if (titleElem) titleElem.textContent = 'CSS Stylesheet Editor';
      if (badgeElem) badgeElem.textContent = 'CSS Mode';
      if (diagScopeElem) diagScopeElem.textContent = 'CSS Standards, Specificity & Conflict Engine';
      if (modalModeLabel) modalModeLabel.textContent = 'CSS Analyzer (CSS3)';
      if (mobileModeIcon) mobileModeIcon.textContent = '🎨';
      if (mobileModeLabel) mobileModeLabel.textContent = 'CSS Mode';
      if (editor) editor.placeholder = 'Type or paste pure CSS stylesheet rules here (selectors, properties, media queries)...';
    } else if (BB.currentMode === 'html') {
      modeNameEn = 'HTML Analyzer';
      modeNameTl = 'HTML Mode';
      if (titleElem) titleElem.textContent = 'HTML5 Markup Editor';
      if (badgeElem) badgeElem.textContent = 'HTML5 Mode';
      if (diagScopeElem) diagScopeElem.textContent = 'HTML5 Standards & Hierarchy Engine';
      if (modalModeLabel) modalModeLabel.textContent = 'HTML5 Markup';
      if (mobileModeIcon) mobileModeIcon.textContent = '📄';
      if (mobileModeLabel) mobileModeLabel.textContent = 'HTML5';
      if (editor) editor.placeholder = 'Type or paste HTML markup here (<!DOCTYPE html>, <html>, <head>, <body>)...';
    } else {
      modeNameEn = 'Full Document';
      modeNameTl = 'Full Doc';
      if (titleElem) titleElem.textContent = 'Full Document Editor';
      if (badgeElem) badgeElem.textContent = 'HTML + CSS Mode';
      if (diagScopeElem) diagScopeElem.textContent = 'Dual HTML5 & Embedded <style> Engine';
      if (modalModeLabel) modalModeLabel.textContent = 'Full Document (HTML+CSS)';
      if (mobileModeIcon) mobileModeIcon.textContent = '🌐';
      if (mobileModeLabel) mobileModeLabel.textContent = 'Full Doc';
      if (editor) editor.placeholder = 'Type or paste complete HTML document with <style> blocks or CSS links...';
    }

    if (editor) editor.value = BB.modeBuffers[BB.currentMode] || '';
    BB.updateLineNumbers();
    BB.renderDiagnostics();
    BB.showToast(BB.currentLanguage === 'english' ? `Switched to ${modeNameEn}` : `Lumipat sa ${modeNameTl}`, '🔄');

    if (autoCloseOnMobile && window.innerWidth <= 840) {
      BB.closeSettingsModal();
    }
  }
  BB.setAppMode = setAppMode;

  // Unified Language Switcher
  function setAppLanguage(lang) {
    BB.currentLanguage = lang;
    localStorage.setItem('bugbuster_lang', lang);

    const headerTaglish = document.getElementById('lang-taglish');
    const headerEnglish = document.getElementById('lang-english');
    if (headerTaglish && headerEnglish) {
      if (lang === 'taglish') {
        headerTaglish.classList.add('active');
        headerEnglish.classList.remove('active');
      } else {
        headerEnglish.classList.add('active');
        headerTaglish.classList.remove('active');
      }
    }

    const modalTaglish = document.getElementById('modal-lang-taglish');
    const modalEnglish = document.getElementById('modal-lang-english');
    const activeLangLabel = document.getElementById('active-lang-label');
    if (modalTaglish && modalEnglish) {
      if (lang === 'taglish') {
        modalTaglish.classList.add('active');
        modalEnglish.classList.remove('active');
      } else {
        modalEnglish.classList.add('active');
        modalTaglish.classList.remove('active');
      }
    }
    if (activeLangLabel) {
      activeLangLabel.textContent = lang === 'taglish' ? 'Taglish (🇵🇭)' : 'English (🇺🇸)';
    }

    BB.renderDiagnostics();
    const mistakesInput = document.getElementById('mistakes-search');
    const tipsInput = document.getElementById('tips-search');
    BB.renderMistakes(mistakesInput ? mistakesInput.value : '', BB.currentMistakeCategory);
    BB.renderTips(tipsInput ? tipsInput.value : '', BB.currentTipCategory);
    BB.renderTemplates();
    BB.showToast(lang === 'english' ? 'Language set to English' : 'Naitakda sa Taglish ang wika', lang === 'english' ? '🇺🇸' : '🇵🇭');
  }
  BB.setAppLanguage = setAppLanguage;

  // Unified Teacher Mode Toggle
  function setTeacherMode(enabled) {
    if (teacherToggle) teacherToggle.checked = enabled;
    if (modalTeacherToggle) modalTeacherToggle.checked = enabled;
    localStorage.setItem('bugbuster_teacher', enabled ? 'true' : 'false');
    BB.renderDiagnostics();
    BB.showToast(enabled ? (BB.currentLanguage === 'english' ? 'Teacher Mode Enabled' : 'Naka-on ang Teacher Mode') : (BB.currentLanguage === 'english' ? 'Teacher Mode Disabled' : 'Naka-off ang Teacher Mode'), '🧑‍🏫');
  }
  BB.setTeacherMode = setTeacherMode;

  // Diagnostic Category Filter
  function setDiagFilter(filterType, btnElem) {
    BB.currentFilter = filterType;
    document.querySelectorAll('.diag-filter-btn').forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');
    BB.renderDiagnostics();
  }

  // Scroll Synchronization
  function syncEditorScroll() {
    if (!editor || !lineNumbers) return;
    const st = editor.scrollTop;
    const sl = editor.scrollLeft;
    lineNumbers.scrollTop = st;
    if (highlightsLayer) {
      highlightsLayer.scrollTop = st;
      highlightsLayer.scrollLeft = sl;
    }
    BB.updateGlobalScrollButton();
  }

  function scrollToTopAction() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });

    if (editor) {
      editor.scrollTo({ top: 0, behavior: 'smooth' });
      editor.scrollTop = 0;
      if (lineNumbers) lineNumbers.scrollTop = 0;
      if (highlightsLayer) highlightsLayer.scrollTop = 0;
      editor.setSelectionRange(0, 0);
    }

    if (tabBody) {
      tabBody.scrollTo({ top: 0, behavior: 'smooth' });
      tabBody.scrollTop = 0;
    }

    setTimeout(BB.updateGlobalScrollButton, 100);
    BB.showToast(BB.currentLanguage === 'english' ? 'Returned to Top' : 'Bumalik sa pinakataas', '⬆️');
  }

  // Bind All Event Listeners on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Editor Input & Scroll
    if (editor) {
      editor.addEventListener('input', () => {
        BB.modeBuffers[BB.currentMode] = editor.value;
        BB.updateLineNumbers();
        BB.renderDiagnostics();
      });
      editor.addEventListener('scroll', syncEditorScroll);
    }

    if (lineNumbers) {
      lineNumbers.addEventListener('scroll', () => {
        if (!editor) return;
        const st = lineNumbers.scrollTop;
        editor.scrollTop = st;
        if (highlightsLayer) highlightsLayer.scrollTop = st;
        BB.updateGlobalScrollButton();
      });
    }

    // Desktop Mode Buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setAppMode(btn.getAttribute('data-mode'), false);
      });
    });

    // Settings Modal Mode Buttons
    document.querySelectorAll('#setting-group-mode .theme-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setAppMode(btn.getAttribute('data-mode'), true);
      });
    });

    // Mobile Mode Badge
    if (mobileModeBadge) {
      mobileModeBadge.addEventListener('click', () => {
        BB.openSettingsModal();
      });
    }

    // Tabs Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        const panel = document.getElementById('tab-' + targetTab);
        if (panel) {
          panel.style.display = targetTab === 'preview' ? 'flex' : 'block';
          if (targetTab === 'preview' && typeof BB.updateDevicePreviewScale === 'function') {
            setTimeout(BB.updateDevicePreviewScale, 30);
          }
        }
        if (tabBody) tabBody.scrollTop = 0;
      });
    });

    // Diagnostics Filter Buttons
    const fAll = document.getElementById('filter-all');
    const fErr = document.getElementById('filter-errors');
    const fWarn = document.getElementById('filter-warnings');
    const fSugg = document.getElementById('filter-suggestions');

    if (fAll) fAll.addEventListener('click', function() { setDiagFilter('all', this); });
    if (fErr) fErr.addEventListener('click', function() { setDiagFilter('error', this); });
    if (fWarn) fWarn.addEventListener('click', function() { setDiagFilter('warning', this); });
    if (fSugg) fSugg.addEventListener('click', function() { setDiagFilter('suggestion', this); });

    // Language Buttons
    const btnHTag = document.getElementById('lang-taglish');
    const btnHEng = document.getElementById('lang-english');
    const btnMTag = document.getElementById('modal-lang-taglish');
    const btnMEng = document.getElementById('modal-lang-english');

    if (btnHTag) btnHTag.addEventListener('click', () => setAppLanguage('taglish'));
    if (btnHEng) btnHEng.addEventListener('click', () => setAppLanguage('english'));
    if (btnMTag) btnMTag.addEventListener('click', () => setAppLanguage('taglish'));
    if (btnMEng) btnMEng.addEventListener('click', () => setAppLanguage('english'));

    // Teacher Mode
    if (teacherToggle) teacherToggle.addEventListener('change', (e) => setTeacherMode(e.target.checked));
    if (modalTeacherToggle) modalTeacherToggle.addEventListener('change', (e) => setTeacherMode(e.target.checked));

    // Toolbar Buttons
    const btnAutofix = document.getElementById('btn-autofix-all');
    const btnFormat = document.getElementById('btn-format');
    const btnSampleBad = document.getElementById('btn-sample-bad');
    const btnSampleGood = document.getElementById('btn-sample-good');
    const btnClear = document.getElementById('btn-clear');
    const btnExport = document.getElementById('btn-export');

    if (btnAutofix) btnAutofix.addEventListener('click', BB.applyBulkAutoFix);
    if (btnFormat) btnFormat.addEventListener('click', BB.formatCode);
    
    if (btnSampleBad) {
      btnSampleBad.addEventListener('click', () => {
        let sample = BB.SAMPLE_CSS_BUGGY;
        if (BB.currentMode === 'html') sample = BB.SAMPLE_HTML_BUGGY;
        else if (BB.currentMode === 'full') sample = BB.SAMPLE_FULL_BUGGY;

        if (editor) {
          editor.value = sample;
          BB.modeBuffers[BB.currentMode] = sample;
        }
        BB.updateLineNumbers();
        BB.renderDiagnostics();
        BB.showToast(BB.currentLanguage === 'english' ? 'Loaded sample with deliberate W3C errors.' : 'Nai-load ang buggy test suite.', '🐞');
      });
    }

    if (btnSampleGood) {
      btnSampleGood.addEventListener('click', () => {
        let sample = BB.SAMPLE_CSS_CLEAN;
        if (BB.currentMode === 'html') sample = BB.SAMPLE_HTML_CLEAN;
        else if (BB.currentMode === 'full') sample = BB.SAMPLE_FULL_CLEAN;

        if (editor) {
          editor.value = sample;
          BB.modeBuffers[BB.currentMode] = sample;
        }
        BB.updateLineNumbers();
        BB.renderDiagnostics();
        BB.showToast(BB.currentLanguage === 'english' ? 'Loaded clean W3C template.' : 'Nai-load ang clean W3C template.', '✅');
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        if (editor) {
          editor.value = '';
          BB.modeBuffers[BB.currentMode] = '';
        }
        BB.updateLineNumbers();
        BB.renderDiagnostics();
        BB.showToast(BB.currentLanguage === 'english' ? 'Editor cleared.' : 'Nalinis ang editor.', '🗑️');
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (!editor) return;
        const isCssMode = BB.currentMode === 'css';
        const mime = isCssMode ? 'text/css;charset=utf-8' : 'text/html;charset=utf-8';
        const filename = isCssMode ? 'styles.css' : 'index.html';
        const blob = new Blob([editor.value], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        BB.showToast(BB.currentLanguage === 'english' ? `Exported and downloaded ${filename}` : `Nai-export ang ${filename}`, '💾');
      });
    }

    // Device Switcher Buttons
    document.querySelectorAll('.device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        BB.currentDevice = btn.getAttribute('data-device') || 'desktop';
        BB.desktopIsLandscape = false;
        if (desktopRotateLabel) desktopRotateLabel.textContent = 'Rotate Landscape';
        if (desktopRotateBtn) {
          desktopRotateBtn.style.display = (BB.currentDevice === 'mobile' || BB.currentDevice === 'tablet') ? 'inline-flex' : 'none';
        }
        BB.updateDevicePreviewScale();
      });
    });

    if (desktopRotateBtn) {
      desktopRotateBtn.addEventListener('click', () => {
        BB.desktopIsLandscape = !BB.desktopIsLandscape;
        if (desktopRotateLabel) {
          desktopRotateLabel.textContent = BB.desktopIsLandscape ? 'Rotate Portrait' : 'Rotate Landscape';
        }
        BB.updateDevicePreviewScale();
        BB.showToast(BB.desktopIsLandscape 
          ? (BB.currentLanguage === 'english' ? 'Rotated to Landscape' : 'Nai-rotate sa Landscape')
          : (BB.currentLanguage === 'english' ? 'Rotated to Portrait' : 'Nai-rotate sa Portrait'), '🔄');
      });
    }

    // Mistakes DB Search & Filters
    const mistakesSearch = document.getElementById('mistakes-search');
    if (mistakesSearch) {
      mistakesSearch.addEventListener('input', (e) => {
        BB.renderMistakes(e.target.value, BB.currentMistakeCategory);
      });
    }

    document.querySelectorAll('.mistake-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mistake-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        BB.currentMistakeCategory = btn.getAttribute('data-cat');
        BB.renderMistakes(mistakesSearch ? mistakesSearch.value : '', BB.currentMistakeCategory);
      });
    });

    // Tips Search & Filters
    const tipsSearch = document.getElementById('tips-search');
    if (tipsSearch) {
      tipsSearch.addEventListener('input', (e) => {
        BB.renderTips(e.target.value, BB.currentTipCategory);
      });
    }

    document.querySelectorAll('.tip-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tip-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        BB.currentTipCategory = btn.getAttribute('data-cat');
        BB.renderTips(tipsSearch ? tipsSearch.value : '', BB.currentTipCategory);
      });
    });

    // Global Scroll To Top Buttons
    if (floatingGlobalTop) floatingGlobalTop.addEventListener('click', scrollToTopAction);
    if (btnScrollTop) btnScrollTop.addEventListener('click', scrollToTopAction);

    if (tabBody) tabBody.addEventListener('scroll', BB.updateGlobalScrollButton);
    window.addEventListener('scroll', BB.updateGlobalScrollButton);
    window.addEventListener('resize', () => {
      BB.updateGlobalScrollButton();
      if (typeof BB.updateDevicePreviewScale === 'function') BB.updateDevicePreviewScale();
      if (window.innerWidth > 840) {
        document.body.classList.remove('mobile-view-editor', 'mobile-view-inspector');
      } else {
        BB.setMobileView(BB.currentMobileView);
      }
    });

    // Drawer Listeners
    if (mobileDrawerToggle) mobileDrawerToggle.addEventListener('click', BB.openMobileDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', BB.closeMobileDrawer);
    if (drawerBackBtn) drawerBackBtn.addEventListener('click', BB.showDrawerMenuHub);
    if (drawerViewportCloseBtn) drawerViewportCloseBtn.addEventListener('click', BB.closeMobileDrawer);
    if (mobileDrawerOverlay) {
      mobileDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === mobileDrawerOverlay) BB.closeMobileDrawer();
      });
    }

    document.querySelectorAll('.drawer-tool-card[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.getAttribute('data-tool');
        if (tool) BB.openDrawerTool(tool);
      });
    });

    if (drawerActionExport) {
      drawerActionExport.addEventListener('click', () => {
        if (btnExport) btnExport.click();
        BB.closeMobileDrawer();
      });
    }

    if (mobileHeaderAutofix) {
      mobileHeaderAutofix.addEventListener('click', BB.applyBulkAutoFix);
    }

    // Settings Modal Listeners
    if (btnSettingsOpen) btnSettingsOpen.addEventListener('click', BB.openSettingsModal);
    if (btnSettingsClose) btnSettingsClose.addEventListener('click', BB.closeSettingsModal);
    if (btnSettingsDone) btnSettingsDone.addEventListener('click', BB.closeSettingsModal);
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) BB.closeSettingsModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsModal && settingsModal.classList.contains('open')) {
        BB.closeSettingsModal();
      }
    });

    if (diagFontSlider) {
      diagFontSlider.addEventListener('input', (e) => {
        BB.applyDiagnosticFontSize(e.target.value);
      });
    }

    document.querySelectorAll('.font-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size');
        if (size) BB.applyDiagnosticFontSize(size);
      });
    });

    document.querySelectorAll('.theme-opt-btn[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        if (theme) BB.applyTheme(theme);
      });
    });

    if (btnSettingsReset) {
      btnSettingsReset.addEventListener('click', () => {
        BB.applyTheme('dark');
        BB.applyDiagnosticFontSize(14);
        BB.showToast(BB.currentLanguage === 'english' ? 'Reset to default theme & font size' : 'Naibalik sa default theme at font size', '↺');
      });
    }

    // Mobile Section Navigation Buttons
    if (mobileNavEditor) mobileNavEditor.addEventListener('click', () => BB.setMobileView('editor'));
    if (mobileNavInspector) mobileNavInspector.addEventListener('click', () => BB.setMobileView('inspector'));

    // Boot App Preferences
    BB.applyTheme(BB.currentTheme);
    BB.applyDiagnosticFontSize(BB.currentDiagFontSize);
    setAppLanguage(BB.currentLanguage);
    const savedTeacher = localStorage.getItem('bugbuster_teacher') !== 'false';
    setTeacherMode(savedTeacher);
    if (window.innerWidth <= 840) {
      BB.setMobileView(BB.currentMobileView);
    }

    // Initial Load into Editor
    if (editor) {
      editor.value = BB.modeBuffers[BB.currentMode] || BB.SAMPLE_FULL_BUGGY;
    }
    BB.updateLineNumbers();
    BB.renderDiagnostics();
    BB.renderMistakes();
    BB.renderTips();
    BB.renderTemplates();
  });

})(window.BugBuster);
