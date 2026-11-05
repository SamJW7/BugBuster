/**
 * BugBuster 9.0 - User Interface, Diagnostics, Mistakes DB, Health & Settings Controller
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  // State persistence keys (100% offline via localStorage)
  const STORAGE_THEME = 'bugbuster_theme';
  const STORAGE_FONT_SIZE = 'bugbuster_diag_font_size';
  const STORAGE_MOBILE_VIEW = 'bugbuster_mobile_view';

  BB.currentIssues = [];
  BB.currentFilter = 'all'; // 'all', 'error', 'warning', 'suggestion'
  BB.currentTipCategory = 'all';
  BB.currentMistakeCategory = 'all';
  BB.currentTheme = localStorage.getItem(STORAGE_THEME) || 'dark';
  BB.currentDiagFontSize = parseInt(localStorage.getItem(STORAGE_FONT_SIZE), 10) || 14;
  BB.currentMobileView = localStorage.getItem(STORAGE_MOBILE_VIEW) || 'editor';

  // 1. Diagnostics Card Rendering
  BB.renderDiagnostics = function() {
    const editor = document.getElementById('code-editor');
    const diagnosticsList = document.getElementById('diagnostics-list');
    const issuesCount = document.getElementById('issues-count');
    const statusBadge = document.getElementById('status-badge');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const teacherToggle = document.getElementById('teacher-toggle');
    const mobileIssuesBadge = document.getElementById('mobile-issues-badge');
    const cntAll = document.getElementById('cnt-all');
    const cntErrors = document.getElementById('cnt-errors');
    const cntWarnings = document.getElementById('cnt-warnings');
    const cntSuggestions = document.getElementById('cnt-suggestions');

    if (!editor || !diagnosticsList) return;

    const code = editor.value;
    BB.currentIssues = BB.analyzeCode(code, BB.currentMode);

    const errorList = BB.currentIssues.filter(i => i.severity === 'error');
    const warningList = BB.currentIssues.filter(i => i.severity === 'warning');
    const suggestionList = BB.currentIssues.filter(i => i.severity === 'suggestion');

    if (cntAll) cntAll.textContent = BB.currentIssues.length;
    if (cntErrors) cntErrors.textContent = errorList.length;
    if (cntWarnings) cntWarnings.textContent = warningList.length;
    if (cntSuggestions) cntSuggestions.textContent = suggestionList.length;

    if (issuesCount) {
      issuesCount.textContent = BB.currentIssues.length;
      if (errorList.length > 0) {
        issuesCount.style.background = '#f43f5e';
        if (statusDot) statusDot.style.background = '#f43f5e';
        if (statusText) statusText.textContent = `${errorList.length} Errors Found`;
        if (statusBadge) statusBadge.style.borderColor = '#f43f5e';
      } else if (warningList.length > 0) {
        issuesCount.style.background = '#f59e0b';
        if (statusDot) statusDot.style.background = '#f59e0b';
        if (statusText) statusText.textContent = `${warningList.length} Warnings`;
        if (statusBadge) statusBadge.style.borderColor = '#f59e0b';
      } else if (suggestionList.length > 0) {
        issuesCount.style.background = '#a855f7';
        if (statusDot) statusDot.style.background = '#a855f7';
        if (statusText) statusText.textContent = `${suggestionList.length} Suggestions`;
        if (statusBadge) statusBadge.style.borderColor = '#a855f7';
      } else {
        issuesCount.style.background = '#10b981';
        if (statusDot) statusDot.style.background = '#10b981';
        if (statusText) statusText.textContent = 'W3C Valid';
        if (statusBadge) statusBadge.style.borderColor = '#334155';
      }
    }

    if (mobileIssuesBadge) {
      mobileIssuesBadge.textContent = BB.currentIssues.length.toString();
    }

    let filtered = BB.currentIssues;
    if (BB.currentFilter === 'error') filtered = errorList;
    if (BB.currentFilter === 'warning') filtered = warningList;
    if (BB.currentFilter === 'suggestion') filtered = suggestionList;

    const isTeacher = teacherToggle ? teacherToggle.checked : true;
    const isEnglish = BB.currentLanguage === 'english';

    if (filtered.length === 0) {
      diagnosticsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <h3 style="font-size:15px; font-weight:700; color:#fff; margin-bottom:4px;">
            ${isEnglish ? 'Zero Issues Found!' : 'Walang Nakitang Problema!'}
          </h3>
          <p style="font-size:12px; color:var(--text-muted);">
            ${isEnglish ? 'Your HTML & CSS adheres cleanly to official W3C standards.' : 'Malinis at sumusunod sa W3C standards ang iyong source code.'}
          </p>
        </div>
      `;
    } else {
      diagnosticsList.innerHTML = filtered.map((issue, idx) => {
        const whyText = isEnglish ? issue.englishBakit : issue.taglishBakit;
        const rootCause = isEnglish ? issue.englishDahilan : issue.taglishDahilan;
        const domImpact = isEnglish ? issue.englishEpekto : issue.taglishEpekto;
        const solutionText = isEnglish ? issue.englishSolusyon : issue.taglishSolusyon;
        
        const badLabel = isEnglish ? 'Bad Code' : 'Maling Code';
        const goodLabel = isEnglish ? 'Fixed Code' : 'Tamang Code';

        return `
          <div class="issue-card ${issue.severity}" id="issue-card-line-${issue.line}" data-line="${issue.line}">
            <div class="issue-header">
              <div>
                <div class="issue-badge-group">
                  <span class="tag-badge ${issue.severity}">${issue.severity}</span>
                  <span class="tag-badge ${issue.category}">${issue.category}</span>
                  <span class="line-badge ${issue.severity}-badge" data-line="${issue.line}" onclick="window.jumpToLine(${issue.line}, event)">📍 Line ${issue.line}</span>
                </div>
                <div class="issue-title">${BB.formatFeedbackText(issue.title)}</div>
              </div>
            </div>

            <div class="issue-body">
              ${isTeacher ? `
                <div class="teacher-box">
                  <div class="teacher-row">
                    <span class="teacher-label">🔍 ${isEnglish ? 'Issue Explanation:' : 'Paliwanag ng Isyu:'}</span>
                    <span class="teacher-desc">${BB.formatFeedbackText(whyText)}</span>
                  </div>
                  <div class="teacher-row">
                    <span class="teacher-label">⚠️ ${isEnglish ? 'Root Cause & Standards Impact:' : 'Dahilan at Epekto sa Layout:'}</span>
                    <span class="teacher-desc">${BB.formatFeedbackText(rootCause)} ${BB.formatFeedbackText(domImpact)}</span>
                  </div>
                  <div class="teacher-row">
                    <span class="teacher-label">📜 ${isEnglish ? 'W3C Specification Standard:' : 'Pamantayan ng W3C:'}</span>
                    <span class="teacher-desc" style="font-family:var(--font-mono); font-size:11px; color:#93c5fd;">${BB.formatFeedbackText(issue.w3cRule)}</span>
                  </div>
                  <div class="teacher-row">
                    <span class="teacher-label">💡 ${isEnglish ? 'Recommended Fix:' : 'Inirerekomendang Solusyon:'}</span>
                    <span class="teacher-desc" style="color:#86efac; font-weight:600;">${BB.formatFeedbackText(solutionText)}</span>
                  </div>
                </div>
              ` : `
                <p style="color:#cbd5e1; font-size:12px;">${BB.formatFeedbackText(whyText)}</p>
              `}

              <div class="code-comparison">
                <div class="code-box bad">
                  <span class="code-label" style="color:#f87171;">✕ ${badLabel}</span>
                  <code>${BB.escapeHtml(issue.badCode)}</code>
                </div>
                <div class="code-box good">
                  <span class="code-label" style="color:#4ade80;">✓ ${goodLabel}</span>
                  <code>${BB.escapeHtml(issue.goodCode)}</code>
                </div>
              </div>
            </div>

            <div class="issue-actions">
              ${issue.autoFixType ? `
                <button class="btn btn-success" style="font-size:11px; padding:3px 9px;" onclick="window.applySingleFix(${idx})">
                  ⚡ ${isEnglish ? 'Quick Fix' : 'Auto-Fix'}
                </button>
              ` : ''}
              <button class="btn btn-outline" style="font-size:11px; padding:3px 8px;" onclick="window.copyIssueSnippet(${idx})">
                📋 ${isEnglish ? 'Copy Fix' : 'Kopyahin'}
              </button>
            </div>
          </div>
        `;  
      }).join('');
    }

    if (typeof BB.updatePreview === 'function') BB.updatePreview(code);
    BB.updateHealthMetrics(BB.currentIssues, code);
    if (typeof BB.updateLineNumbersAndHighlights === 'function') BB.updateLineNumbersAndHighlights();
  };

  // 2. Auto-Fix Single Issue
  BB.applySingleFix = function(issueIdx) {
    const issue = BB.currentIssues[issueIdx];
    if (!issue) return;

    const editor = document.getElementById('code-editor');
    if (!editor) return;

    let code = editor.value;

    if (issue.autoFixType === 'add_doctype') {
      code = '<!DOCTYPE html>\n' + code;
    } else if (issue.autoFixType === 'add_lang') {
      code = code.replace(/<html(?![^>]*\blang=)/i, '<html lang="en"');
    } else if (issue.autoFixType === 'add_viewport') {
      if (/<head>/i.test(code)) {
        code = code.replace(/<head>/i, '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
      }
    } else if (issue.autoFixType === 'fix_css_comment') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        lines[issue.line - 1] = lines[issue.line - 1].replace(/\/\/(.*)$/, '/* $1 */');
        code = lines.join('\n');
      }
    } else if (issue.autoFixType === 'remove_void_closing') {
      const regex = new RegExp(`</${issue.voidTag}>`, 'gi');
      code = code.replace(regex, '');
    } else if (issue.autoFixType === 'add_img_alt') {
      code = code.replace(/<img\b(?![^>]*\balt=)([^>]*)>/i, '<img$1 alt="Image description">');
    } else if (issue.autoFixType === 'add_rel_noopener') {
      code = code.replace(/<a\b(?=[^>]*target=["']_blank["'])(?![^>]*rel=)([^>]*)>/i, '<a$1 rel="noopener noreferrer">');
    } else if (issue.autoFixType === 'add_semicolon') {
      const lines = code.split('\n');
      if (lines[issue.line - 1] && !lines[issue.line - 1].includes(';')) {
        if (/\/\*.*\*\/$/.test(lines[issue.line - 1])) {
          lines[issue.line - 1] = lines[issue.line - 1].replace(/\s*(\/\*.*\*\/)$/, '; $1');
        } else {
          lines[issue.line - 1] = lines[issue.line - 1] + ';';
        }
        code = lines.join('\n');
      }
    } else if (issue.autoFixType === 'fix_calc_spacing') {
      if (issue.fixTarget && issue.fixReplacement) {
        code = code.replace(issue.fixTarget, issue.fixReplacement);
      } else {
        code = code.replace(/calc\(([^)]*)\)/gi, (m, expr) => 'calc(' + expr.replace(/([0-9a-zA-Z%]+)([\+\-])([0-9a-zA-Z%]+)/g, '$1 $2 $3') + ')');
      }
    } else if (issue.autoFixType === 'fix_unclosed_paren') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        if (/;$/.test(lines[issue.line - 1])) {
          lines[issue.line - 1] = lines[issue.line - 1].replace(/;$/, ');');
        } else {
          lines[issue.line - 1] = lines[issue.line - 1] + ');';
        }
        code = lines.join('\n');
      }
    } else if (issue.autoFixType === 'fix_css_unit') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        lines[issue.line - 1] = lines[issue.line - 1].replace(/:\s*([1-9]\d*)/, ': $1px');
        code = lines.join('\n');
      }
    } else if (issue.autoFixType === 'close_before_tag' || (issue.autoFixType === 'close_unclosed_tag' && issue.beforeTag)) {
      const lines = code.split('\n');
      const targetLineIdx = (issue.beforeLine || issue.line) - 1;
      const beforeTag = issue.beforeTag;
      const unclosedTag = issue.unclosedTag;
      let applied = false;

      if (targetLineIdx >= 0 && targetLineIdx < lines.length) {
        const lineText = lines[targetLineIdx];
        const closeTagRegex = new RegExp(`</${beforeTag}\\b[^>]*>`, 'i');
        if (closeTagRegex.test(lineText)) {
          lines[targetLineIdx] = lineText.replace(closeTagRegex, `</${unclosedTag}>$&`);
          code = lines.join('\n');
          applied = true;
        } else {
          for (let offset = -2; offset <= 2; offset++) {
            const adjIdx = targetLineIdx + offset;
            if (adjIdx >= 0 && adjIdx < lines.length && closeTagRegex.test(lines[adjIdx])) {
              lines[adjIdx] = lines[adjIdx].replace(closeTagRegex, `</${unclosedTag}>$&`);
              code = lines.join('\n');
              applied = true;
              break;
            }
          }
        }
      }

      if (!applied) {
        if (typeof issue.beforeTokenIndex === 'number' && issue.beforeTokenIndex >= 0 && issue.beforeTokenIndex <= code.length) {
          code = code.slice(0, issue.beforeTokenIndex) + `</${unclosedTag}>` + code.slice(issue.beforeTokenIndex);
          applied = true;
        } else if (targetLineIdx >= 0 && targetLineIdx < lines.length) {
          lines.splice(targetLineIdx, 0, `</${unclosedTag}>`);
          code = lines.join('\n');
          applied = true;
        }
      }
    } else if (issue.autoFixType === 'close_unclosed_tag') {
      if (code.includes('</body>')) {
        code = code.replace('</body>', `</${issue.unclosedTag}>\n</body>`);
      } else if (code.includes('</html>')) {
        code = code.replace('</html>', `</${issue.unclosedTag}>\n</html>`);
      } else {
        code = code + `\n</${issue.unclosedTag}>`;
      }
    } else if (issue.autoFixType === 'fix_inline_display') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        lines[issue.line - 1] = lines[issue.line - 1].replace(/display:\s*inline\b/i, 'display: inline-block');
        code = lines.join('\n');
      } else {
        code = code.replace(/display:\s*inline\b/i, 'display: inline-block');
      }
    } else if (issue.autoFixType === 'fix_zindex_pos') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        lines.splice(issue.line - 1, 0, '  position: relative;');
        code = lines.join('\n');
      } else {
        code = 'position: relative;\n' + code;
      }
    } else if (issue.autoFixType === 'fix_font_fallback') {
      const lines = code.split('\n');
      if (lines[issue.line - 1]) {
        lines[issue.line - 1] = lines[issue.line - 1].replace(/;?\s*$/, ', sans-serif;');
        code = lines.join('\n');
      }
    } else if (issue.autoFixType === 'fix_unclosed_bracket') {
      if (issue.fixTarget && issue.fixReplacement) {
        code = code.replace(issue.fixTarget, issue.fixReplacement);
      }
    } else if (issue.autoFixType === 'replace_text') {
      code = code.replace(issue.fixTarget, issue.fixReplacement);
    }

    const targetLine = issue.line || 1;
    editor.value = code;
    if (BB.modeBuffers) BB.modeBuffers[BB.currentMode] = code;
    if (typeof BB.updateLineNumbers === 'function') BB.updateLineNumbers();
    BB.renderDiagnostics();
    BB.showToast(BB.currentLanguage === 'english' ? 'Applied automatic fix!' : 'Nai-apply ang auto-fix!', '⚡');

    if (window.innerWidth <= 840) {
      BB.setMobileView('editor');
      BB.jumpToLine(targetLine);
    } else {
      BB.triggerActiveLineHighlight(targetLine);
    }
  };

  // 3. Bulk Auto Fix All Issues
  BB.applyBulkAutoFix = function() {
    const editor = document.getElementById('code-editor');
    if (!editor) return;
    let code = editor.value;
    let fixes = 0;

    // Add Doctype
    if (BB.currentMode !== 'css' && !/<!DOCTYPE\s+html>/i.test(code) && /<(html|head|body)\b/i.test(code)) {
      code = '<!DOCTYPE html>\n' + code;
      fixes++;
    }

    // Add Lang
    if (BB.currentMode !== 'css' && /<html/i.test(code) && !/<html[^>]*\blang=/i.test(code)) {
      code = code.replace(/<html(?![^>]*\blang=)/i, '<html lang="en"');
      fixes++;
    }

    // Remove void closings
    if (BB.currentMode !== 'css') {
      const voidList = ['img', 'br', 'hr', 'input', 'meta', 'link'];
      voidList.forEach(v => {
        const reg = new RegExp(`</${v}>`, 'gi');
        if (reg.test(code)) {
          code = code.replace(reg, '');
          fixes++;
        }
      });

      if (/<img\b(?![^>]*\balt=)/i.test(code)) {
        code = code.replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi, '<img$1 alt="Image description">');
        fixes++;
      }

      const unclosedIssues = BB.analyzeCode(code, BB.currentMode).filter(i => (i.autoFixType === 'close_before_tag' || (i.autoFixType === 'close_unclosed_tag' && i.beforeTag)) && i.unclosedTag && i.beforeTag);
      unclosedIssues.sort((a, b) => (b.beforeLine || b.line) - (a.beforeLine || a.line));
      unclosedIssues.forEach(iss => {
        const lArr = code.split('\n');
        const tIdx = (iss.beforeLine || iss.line) - 1;
        if (tIdx >= 0 && tIdx < lArr.length) {
          const reg = new RegExp(`</${iss.beforeTag}\\b[^>]*>`, 'i');
          if (reg.test(lArr[tIdx])) {
            lArr[tIdx] = lArr[tIdx].replace(reg, `</${iss.unclosedTag}>$&`);
            code = lArr.join('\n');
            fixes++;
          }
        }
      });
    }

    // CSS Fixes
    const lines = code.split('\n');
    let inStyle = (BB.currentMode === 'css');
    lines.forEach((l, idx) => {
      if (/<style/i.test(l)) inStyle = true;
      if (inStyle) {
        if (/^\s*\/\//.test(l) || (/\/\//.test(l) && !/https?:\/\//.test(l) && !/\/\*/.test(l))) {
          lines[idx] = l.replace(/\/\/(.*)$/, '/* $1 */');
          fixes++;
        }
        if (/backgroud-color/i.test(l)) {
          lines[idx] = l.replace(/backgroud-color/i, 'background-color');
          fixes++;
        }
        if (/widht\s*:/i.test(l)) {
          lines[idx] = l.replace(/widht\s*:/i, 'width:');
          fixes++;
        }
        if (/font-sizee\s*:/i.test(l)) {
          lines[idx] = l.replace(/font-sizee\s*:/i, 'font-size:');
          fixes++;
        }
        if (/-webkit-border-radius/i.test(l)) {
          lines[idx] = l.replace(/-webkit-border-radius/i, 'border-radius');
          fixes++;
        }
        if (/([a-zA-Z0-9_\-\.#]+)\s+:(hover|active|focus|visited)\b/.test(l)) {
          lines[idx] = l.replace(/\s+:(hover|active|focus|visited)\b/g, ':$1');
          fixes++;
        }
        if (/^(margin|padding|width|height)\s*:\s*([1-9]\d*)\s*(;|$)/i.test(l)) {
          lines[idx] = l.replace(/:\s*([1-9]\d*)/, ': $1px');
          fixes++;
        }
        if (/\bcalc\s*\([^)]*([0-9a-zA-Z%]+[\+\-][0-9a-zA-Z%]+)[^)]*\)/i.test(l)) {
          lines[idx] = l.replace(/\bcalc\(([^)]*)\)/gi, (m, expr) => 'calc(' + expr.replace(/([0-9a-zA-Z%]+)([\+\-])([0-9a-zA-Z%]+)/g, '$1 $2 $3') + ')');
          fixes++;
        }
      }
      if (/<\/style>/i.test(l) && BB.currentMode !== 'css') inStyle = false;
    });
    code = lines.join('\n');

    editor.value = code;
    if (typeof BB.updateLineNumbers === 'function') BB.updateLineNumbers();
    BB.renderDiagnostics();
    BB.showToast(BB.currentLanguage === 'english' ? `Repaired ${fixes} issues across HTML & CSS!` : `Naayos ang ${fixes} issues sa HTML & CSS!`, '⚡');
  };

  // 4. Render Mistakes DB
  BB.renderMistakes = function(searchQuery = '', cat = BB.currentMistakeCategory) {
    const mistakesList = document.getElementById('mistakes-list');
    if (!mistakesList) return;
    const q = searchQuery.toLowerCase().trim();
    const isEnglish = BB.currentLanguage === 'english';

    const totalAll = BB.MISTAKES_DATA.length;
    const totalHtml = BB.MISTAKES_DATA.filter(m => m.category === 'html').length;
    const totalCss = BB.MISTAKES_DATA.filter(m => m.category === 'css').length;
    const elCntAll = document.getElementById('mistake-cnt-all');
    const elCntHtml = document.getElementById('mistake-cnt-html');
    const elCntCss = document.getElementById('mistake-cnt-css');
    if (elCntAll) elCntAll.textContent = totalAll;
    if (elCntHtml) elCntHtml.textContent = totalHtml;
    if (elCntCss) elCntCss.textContent = totalCss;

    const filtered = BB.MISTAKES_DATA.filter(m => {
      const matchCat = (cat === 'all' || m.category === cat);
      const matchSearch = m.title.toLowerCase().includes(q) || 
                          (m.titleEn && m.titleEn.toLowerCase().includes(q)) || 
                          m.reasonTl.toLowerCase().includes(q) || 
                          m.reasonEn.toLowerCase().includes(q) ||
                          (m.rule && m.rule.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      mistakesList.innerHTML = `
        <div class="empty-state">
          <p style="font-size:12.5px; color:var(--text-muted);">${isEnglish ? 'No matching mistakes found in database.' : 'Walang nahanap na tugmang pagkakamali sa database.'}</p>
        </div>
      `;
      return;
    }

    mistakesList.innerHTML = filtered.map(m => `
      <div class="mistake-card-horiz cat-${m.category}">
        <div class="issue-header">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="tag-badge ${m.category}">${m.category.toUpperCase()}</span>
            <div class="issue-title" style="margin:0; font-size:13px; font-weight:700;">${BB.escapeHtml(isEnglish ? (m.titleEn || m.title) : m.title)}</div>
          </div>
          <span style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${BB.escapeHtml(m.rule || '')}</span>
        </div>
        <div class="issue-body">
          <p style="font-size:12px; color:#cbd5e1; margin:0 0 8px 0; line-height:1.5;">${BB.formatReasonText(isEnglish ? m.reasonEn : m.reasonTl)}</p>
          <div class="code-comparison">
            <div class="code-box bad">
              <span class="code-label" style="color:#f87171;">✕ ${isEnglish ? 'Mali / Bad Code' : 'Maling Code'}</span>
              <code>${BB.escapeHtml(m.bad)}</code>
            </div>
            <div class="code-box good">
              <span class="code-label" style="color:#4ade80;">✓ ${isEnglish ? 'Tama / Fixed Code' : 'Tamang Code'}</span>
              <code>${BB.escapeHtml(m.good)}</code>
            </div>
          </div>
        </div>
        <div class="issue-actions" style="padding:6px 14px; background:rgba(15,23,42,0.4); border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:flex-end; gap:6px;">
          <button class="btn btn-outline" style="font-size:11px; padding:3px 9px;" onclick="window.copyMistakeGood('${m.id}')">
            📋 ${isEnglish ? 'Copy Fix' : 'Kopyahin'}
          </button>
        </div>
      </div>
    `).join('');
  };

  // 5. Render Best Practices
  BB.renderTips = function(searchQuery = '', cat = 'all') {
    const tipsList = document.getElementById('tips-list');
    if (!tipsList) return;
    const q = searchQuery.toLowerCase().trim();
    const isEnglish = BB.currentLanguage === 'english';

    const filtered = BB.TIPS_DATA.filter(t => {
      const matchCat = (cat === 'all' || t.category === cat);
      const matchSearch = t.title.toLowerCase().includes(q) || t.descTl.toLowerCase().includes(q) || t.descEn.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      tipsList.innerHTML = `
        <div class="empty-state">
          <p style="font-size:12.5px; color:var(--text-muted);">${isEnglish ? 'No matching best practices found.' : 'Walang nahanap na tugmang best practice.'}</p>
        </div>
      `;
      return;
    }

    tipsList.innerHTML = filtered.map(t => `
      <div class="mistake-card-horiz cat-${t.category}">
        <div class="issue-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="tag-badge ${t.category}">${t.category.toUpperCase()}</span>
            <div class="issue-title" style="margin:0; font-size:13px; font-weight:700;">${t.title}</div>
          </div>
        </div>
        <div class="issue-body">
          <p style="font-size:12px; color:#cbd5e1; margin-bottom:8px;">${isEnglish ? t.descEn : t.descTl}</p>
          <div class="code-box good" style="max-height:140px;">
            <code>${BB.escapeHtml(t.code)}</code>
          </div>
        </div>
        <div class="issue-actions" style="padding:8px 14px; background:rgba(15,23,42,0.4); border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:flex-end; gap:6px;">
          <button class="btn btn-outline" style="font-size:11px; padding:3px 8px;" onclick="window.copyTipCode('${t.id}')">
            📋 ${isEnglish ? 'Copy Boilerplate' : 'Kopyahin'}
          </button>
        </div>
      </div>
    `).join('');
  };

  // 6. Render Starter Templates
  BB.renderTemplates = function() {
    const templatesList = document.getElementById('templates-list');
    if (!templatesList) return;
    const isEnglish = BB.currentLanguage === 'english';

    templatesList.innerHTML = BB.TEMPLATES_DATA.map((tmpl, idx) => `
      <div class="issue-card" style="margin-bottom:0;">
        <div class="issue-header">
          <div>
            <div class="issue-title" style="margin-top:0;">${tmpl.title}</div>
            <p style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">${tmpl.desc}</p>
          </div>
        </div>
        <div class="issue-body">
          <div class="code-box good" style="max-height:120px;">
            <code>${BB.escapeHtml(tmpl.code)}</code>
          </div>
        </div>
        <div class="issue-actions">
          <button class="btn btn-primary" style="font-size:11px; padding:4px 10px;" onclick="window.loadTemplate(${idx})">
            🚀 ${isEnglish ? 'Load Into Editor' : 'Gamitin sa Editor'}
          </button>
        </div>
      </div>
    `).join('');
  };

  // 7. Health Metrics
  BB.updateHealthMetrics = function(issues, code) {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warnCount = issues.filter(i => i.severity === 'warning').length;
    const suggCount = issues.filter(i => i.severity === 'suggestion').length;

    const healthGrade = document.getElementById('health-grade');
    const healthHeading = document.getElementById('health-status-heading');
    const healthDesc = document.getElementById('health-status-desc');
    const isEnglish = BB.currentLanguage === 'english';

    let grade = 'A+';
    let gradeColor = '#10b981';

    if (errorCount > 3) {
      grade = 'F';
      gradeColor = '#f43f5e';
    } else if (errorCount > 0) {
      grade = 'C';
      gradeColor = '#f59e0b';
    } else if (warnCount > 2) {
      grade = 'B';
      gradeColor = '#38bdf8';
    } else if (warnCount > 0 || suggCount > 2) {
      grade = 'A';
      gradeColor = '#10b981';
    }

    if (healthGrade) {
      healthGrade.textContent = grade;
      healthGrade.style.borderColor = gradeColor;
      healthGrade.style.color = gradeColor;
      healthGrade.style.background = gradeColor + '1a';
    }

    if (healthHeading && healthDesc) {
      if (grade === 'A+') {
        healthHeading.textContent = isEnglish ? 'Pristine W3C Compliance' : 'Perpektong W3C Compliance';
        healthDesc.textContent = isEnglish 
          ? (BB.currentMode === 'css' ? 'All CSS rules, properties, and selectors strictly comply with W3C CSS specifications.' : 'All HTML tags are properly closed, CSS rules are valid, and semantic accessibility rules are met.')
          : (BB.currentMode === 'css' ? 'Lahat ng CSS selectors, properties, at rules ay sumusunod sa W3C standards.' : 'Lahat ng HTML tags ay nakasara nang tama, valid ang CSS properties, at pumasa sa accessibility standards.');
      } else if (grade === 'A' || grade === 'B') {
        healthHeading.textContent = isEnglish ? 'Good Code Health (Minor Warnings)' : 'Magandang Code Health (May Kaunting Warnings)';
        healthDesc.textContent = isEnglish ? 'Structure is solid. Resolve minor warnings or suggestions to achieve full compliance.' : 'Maayos ang structure. Ayusin ang kaunting warnings o suggestions para sa 100% compliance.';
      } else {
        healthHeading.textContent = isEnglish ? 'Critical Standards Violations' : 'Kailangang Ayusin ang Syntax & Standards';
        healthDesc.textContent = isEnglish 
          ? (BB.currentMode === 'css' ? 'Critical CSS property conflicts, typos, or illegal syntax prevent correct rendering.' : 'Critical HTML or CSS syntax errors prevent proper layout rendering and browser parsing.')
          : (BB.currentMode === 'css' ? 'May mga critical CSS errors o property conflicts na sumisira sa rendering.' : 'May mga critical HTML o CSS errors na sumisira sa rendering at execution ng page.');
      }
    }

    const totalIssuesEl = document.getElementById('stat-total-issues');
    if (totalIssuesEl) totalIssuesEl.textContent = issues.length;

    const domLabelEl = document.getElementById('stat-dom-label');
    const domValEl = document.getElementById('stat-dom-elements');
    const cssLabelEl = document.getElementById('stat-css-label');
    const cssValEl = document.getElementById('stat-css-rules');
    const depthLabelEl = document.getElementById('stat-depth-label');
    const depthValEl = document.getElementById('stat-nesting-depth');

    if (BB.currentMode === 'css') {
      if (domLabelEl) domLabelEl.textContent = 'Selectors';
      const selectorCount = (code.match(/[^\{\}]+(?=\{)/g) || []).filter(s => s.trim().length > 0).length;
      if (domValEl) domValEl.textContent = selectorCount;

      if (cssLabelEl) cssLabelEl.textContent = 'Declarations';
      const declCount = (code.match(/[a-zA-Z\-]+\s*:\s*[^;\}]+;/g) || []).length;
      if (cssValEl) cssValEl.textContent = declCount;

      if (depthLabelEl) depthLabelEl.textContent = 'Rules Count';
      const ruleBlocks = (code.match(/\{[^}]*\}/g) || []).length;
      if (depthValEl) depthValEl.textContent = ruleBlocks;
    } else {
      if (domLabelEl) domLabelEl.textContent = 'DOM Tags';
      const domCount = (code.match(/<[a-zA-Z0-9]+/g) || []).length;
      if (domValEl) domValEl.textContent = domCount;

      if (cssLabelEl) cssLabelEl.textContent = 'CSS Rules';
      const cssCount = (code.match(/\{[^}]+\}/g) || []).length;
      if (cssValEl) cssValEl.textContent = cssCount;

      if (depthLabelEl) depthLabelEl.textContent = 'Max Nesting';
      let maxDepth = 0, currentDepth = 0;
      const tokens = code.match(/<\/?([a-zA-Z0-9]+)[^>]*>/g) || [];
      const voidList = new Set(['img', 'br', 'hr', 'input', 'meta', 'link']);
      tokens.forEach(t => {
        if (t.startsWith('</')) {
          currentDepth = Math.max(0, currentDepth - 1);
        } else if (!t.endsWith('/>')) {
          const tagName = t.match(/<([a-zA-Z0-9]+)/);
          if (tagName && !voidList.has(tagName[1].toLowerCase())) {
            currentDepth++;
            if (currentDepth > maxDepth) maxDepth = currentDepth;
          }
        }
      });
      if (depthValEl) depthValEl.textContent = maxDepth;
    }
  };

  // 8. Jump to Diagnostic Card from Gutter Dot
  BB.jumpToDiagnosticCard = function(lineNum, evt) {
    if (evt) {
      if (typeof evt.preventDefault === 'function') evt.preventDefault();
      if (typeof evt.stopPropagation === 'function') evt.stopPropagation();
    }

    if (typeof lineNum !== 'number') lineNum = parseInt(lineNum, 10);
    if (!lineNum || isNaN(lineNum)) return;

    if (window.innerWidth <= 840) {
      BB.setMobileView('inspector');
    }

    const diagTabBtn = document.querySelector('.tab-btn[data-tab="diagnostics"]');
    if (diagTabBtn && !diagTabBtn.classList.contains('active')) {
      diagTabBtn.click();
    }

    const targetIssue = BB.currentIssues && BB.currentIssues.find(iss => iss.line === lineNum);
    if (targetIssue) {
      const renderedCard = document.querySelector(`.issue-card[data-line="${lineNum}"]`);
      if (!renderedCard) {
        const filterAllBtn = document.getElementById('filter-all');
        if (filterAllBtn) {
          BB.currentFilter = 'all';
          document.querySelectorAll('.diag-filter-btn').forEach(b => b.classList.remove('active'));
          filterAllBtn.classList.add('active');
          BB.renderDiagnostics();
        }
      }
    }

    if (typeof BB.triggerActiveLineHighlight === 'function') {
      BB.triggerActiveLineHighlight(lineNum);
    }

    setTimeout(() => {
      const targetCard = document.querySelector(`.issue-card[data-line="${lineNum}"]`);
      if (targetCard) {
        const tabBodyEl = document.getElementById('right-tab-body');
        if (tabBodyEl && window.innerWidth > 840) {
          const cardOffset = targetCard.offsetTop - tabBodyEl.offsetTop - 30;
          tabBodyEl.scrollTo({ top: Math.max(0, cardOffset), behavior: 'smooth' });
        } else {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        document.querySelectorAll('.issue-card.card-active-jump').forEach(c => c.classList.remove('card-active-jump'));
        targetCard.classList.add('card-active-jump');
        setTimeout(() => {
          targetCard.classList.remove('card-active-jump');
        }, 2500);

        BB.showToast(BB.currentLanguage === 'english' ? `Navigated to Line ${lineNum} Issue` : `Pumunta sa Isyu ng Linya ${lineNum}`, '🎯');
      } else {
        BB.showToast(BB.currentLanguage === 'english' ? `Line ${lineNum}: No diagnostic issue` : `Linya ${lineNum}: Walang isyu sa diagnostics`, 'ℹ️');
      }
    }, 50);
  };

  // 9. Theme & Font Size Controls
  BB.applyTheme = function(theme) {
    BB.currentTheme = theme;
    localStorage.setItem(STORAGE_THEME, theme);

    document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    const activeThemeLabel = document.getElementById('active-theme-label');
    if (theme === 'light') {
      document.body.classList.add('theme-light');
      if (activeThemeLabel) activeThemeLabel.textContent = 'Light';
    } else if (theme === 'system') {
      document.body.classList.add('theme-system');
      if (activeThemeLabel) activeThemeLabel.textContent = 'System (Auto)';
    } else {
      document.body.classList.add('theme-dark');
      if (activeThemeLabel) activeThemeLabel.textContent = 'Dark';
    }

    document.querySelectorAll('.theme-opt-btn[data-theme]').forEach(btn => {
      if (btn.getAttribute('data-theme') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  };

  BB.applyDiagnosticFontSize = function(size) {
    const parsedSize = Math.min(22, Math.max(11, parseInt(size, 10) || 14));
    BB.currentDiagFontSize = parsedSize;
    localStorage.setItem(STORAGE_FONT_SIZE, parsedSize.toString());

    const root = document.documentElement;
    const editorCodeSize = Math.max(11, parsedSize - 0.5);
    const editorLineHeight = Math.round(editorCodeSize * 1.65);
    root.style.setProperty('--app-font-base', `${parsedSize}px`);
    root.style.setProperty('--editor-font-size', `${editorCodeSize}px`);
    root.style.setProperty('--editor-line-height', `${editorLineHeight}px`);

    root.style.setProperty('--ui-font-size-xs', `${Math.max(9, parsedSize - 3.5)}px`);
    root.style.setProperty('--ui-font-size-sm', `${Math.max(10, parsedSize - 2.5)}px`);
    root.style.setProperty('--ui-font-size-md', `${Math.max(11, parsedSize - 1.5)}px`);
    root.style.setProperty('--ui-font-size-base', `${parsedSize}px`);
    root.style.setProperty('--ui-font-size-lg', `${parsedSize + 1.5}px`);
    root.style.setProperty('--ui-font-size-xl', `${parsedSize + 2.5}px`);

    root.style.setProperty('--diag-font-size', `${parsedSize}px`);
    root.style.setProperty('--diag-title-size', `${parsedSize + 1}px`);
    root.style.setProperty('--diag-code-font-size', `${Math.max(11, parsedSize - 1)}px`);
    root.style.setProperty('--diag-teacher-label-size', `${Math.max(10.5, parsedSize - 1.5)}px`);
    root.style.setProperty('--diag-badge-size', `${Math.max(10, parsedSize - 3)}px`);

    const diagFontSlider = document.getElementById('diag-font-slider');
    const fontSizeIndicator = document.getElementById('font-size-indicator');
    if (diagFontSlider) diagFontSlider.value = parsedSize.toString();
    if (fontSizeIndicator) fontSizeIndicator.textContent = `${parsedSize}px`;

    const previewTitle = document.getElementById('preview-sample-title');
    const previewBody = document.getElementById('preview-sample-body');
    if (previewTitle) previewTitle.style.fontSize = `${parsedSize + 1}px`;
    if (previewBody) {
      previewBody.style.fontSize = `${parsedSize}px`;
      previewBody.style.lineHeight = '1.5';
    }
  };

  BB.setMobileView = function(view) {
    BB.currentMobileView = view;
    localStorage.setItem(STORAGE_MOBILE_VIEW, view);

    const mobileNavEditor = document.getElementById('mobile-nav-editor');
    const mobileNavInspector = document.getElementById('mobile-nav-inspector');
    const floatingGlobalTop = document.getElementById('floating-global-top');

    document.body.classList.remove('mobile-view-editor', 'mobile-view-inspector');
    if (view === 'inspector') {
      document.body.classList.add('mobile-view-inspector');
      if (mobileNavInspector) mobileNavInspector.classList.add('active');
      if (mobileNavEditor) mobileNavEditor.classList.remove('active');
      if (typeof BB.updateGlobalScrollButton === 'function') BB.updateGlobalScrollButton();
    } else {
      document.body.classList.add('mobile-view-editor');
      if (mobileNavEditor) mobileNavEditor.classList.add('active');
      if (mobileNavInspector) mobileNavInspector.classList.remove('active');
      if (floatingGlobalTop) floatingGlobalTop.classList.remove('visible');
      window.scrollTo(0, 0);
    }
  };

  // 10. Settings Modal
  BB.openSettingsModal = function() {
    const settingsModal = document.getElementById('settings-modal');
    const diagFontSlider = document.getElementById('diag-font-slider');
    const fontSizeIndicator = document.getElementById('font-size-indicator');
    if (settingsModal) {
      settingsModal.classList.add('open');
      if (diagFontSlider) diagFontSlider.value = BB.currentDiagFontSize.toString();
      if (fontSizeIndicator) fontSizeIndicator.textContent = `${BB.currentDiagFontSize}px`;
    }
  };

  BB.closeSettingsModal = function() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
      settingsModal.classList.remove('open');
    }
  };

  // 11. Mobile Drawer Engine
  BB.openMobileDrawer = function() {
    const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
    if (!mobileDrawerOverlay) return;
    mobileDrawerOverlay.classList.add('open');
    mobileDrawerOverlay.setAttribute('aria-hidden', 'false');
    BB.showDrawerMenuHub();
  };

  BB.closeMobileDrawer = function() {
    const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
    if (!mobileDrawerOverlay) return;
    mobileDrawerOverlay.classList.remove('open');
    mobileDrawerOverlay.setAttribute('aria-hidden', 'true');
    const drawerEl = document.getElementById('mobile-drawer');
    if (drawerEl) drawerEl.classList.remove('drawer-fullscreen');
  };

  BB.showDrawerMenuHub = function() {
    const drawerEl = document.getElementById('mobile-drawer');
    const drawerMenuHub = document.getElementById('drawer-menu-hub');
    const drawerViewport = document.getElementById('drawer-viewport');
    const drawerViewportContent = document.getElementById('drawer-viewport-content');
    if (drawerEl) drawerEl.classList.remove('drawer-fullscreen');
    if (drawerMenuHub) drawerMenuHub.style.display = 'flex';
    if (drawerViewport) drawerViewport.style.display = 'none';
    if (drawerViewportContent) drawerViewportContent.innerHTML = '';
  };

  BB.openDrawerTool = function(toolId) {
    const drawerMenuHub = document.getElementById('drawer-menu-hub');
    const drawerViewport = document.getElementById('drawer-viewport');
    const drawerViewportTitle = document.getElementById('drawer-viewport-title');
    const drawerViewportContent = document.getElementById('drawer-viewport-content');
    const drawerEl = document.getElementById('mobile-drawer');
    const editor = document.getElementById('code-editor');

    if (!drawerViewport || !drawerViewportContent) return;
    if (drawerMenuHub) drawerMenuHub.style.display = 'none';
    drawerViewport.style.display = 'flex';

    if (toolId === 'preview') {
      if (drawerEl) drawerEl.classList.add('drawer-fullscreen');
    } else {
      if (drawerEl) drawerEl.classList.remove('drawer-fullscreen');
    }

    const isEnglish = BB.currentLanguage === 'english';
    let title = 'Tool';

    if (toolId === 'preview') {
      title = 'Live Render Preview';
      let drawerDevice = 'mobile';
      let isMobileLandscape = false;

      drawerViewportContent.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; gap:8px;">
          <div style="display:flex; flex-direction:column; gap:6px; background:var(--bg-surface); padding:8px; border-radius:8px; border:1px solid var(--border-color);">
            <div style="display:flex; gap:4px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none;">
              <button class="btn btn-outline drawer-dev-btn" data-drawer-device="desktop" style="font-size:11px; padding:4px 8px; white-space:nowrap;">🖥️ Desktop</button>
              <button class="btn btn-outline drawer-dev-btn" data-drawer-device="tablet" style="font-size:11px; padding:4px 8px; white-space:nowrap;">📱 Tablet</button>
              <button class="btn btn-outline drawer-dev-btn active" data-drawer-device="mobile" style="font-size:11px; padding:4px 8px; white-space:nowrap; background:var(--primary); color:#0f172a; font-weight:700;">📲 Mobile</button>
              <button class="btn btn-outline drawer-dev-btn" data-drawer-device="fluid" style="font-size:11px; padding:4px 8px; white-space:nowrap;">↔️ Fluid</button>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.06);">
              <button class="btn btn-outline" id="drawer-rotate-btn" style="font-size:11px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; color:var(--primary); border-color:rgba(56,189,248,0.4);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                <span id="drawer-rotate-label">Rotate Landscape</span>
              </button>
              <span id="drawer-dim-badge" style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono);">Mobile · 375 × 667</span>
            </div>
          </div>
          <div id="drawer-preview-stage" style="flex:1; min-height:360px; background:#060911; border:1px solid var(--border-color); border-radius:8px; overflow:auto; display:flex; justify-content:center; align-items:flex-start; padding:10px; position:relative;">
            <div id="drawer-viewport-box" style="position:relative; overflow:hidden; border-radius:6px; background:#fff; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
              <div id="drawer-scale-wrapper" style="position:absolute; top:0; left:0; transform-origin:top left; background:#fff; width:100%; height:100%;">
                <iframe id="drawer-preview-frame" style="width:100%; height:100%; border:none; background:#fff; display:block;" sandbox="allow-scripts allow-same-origin"></iframe>
              </div>
            </div>
          </div>
        </div>
      `;

      const dp = document.getElementById('drawer-preview-frame');
      const stage = document.getElementById('drawer-preview-stage');
      const box = document.getElementById('drawer-viewport-box');
      const wrapper = document.getElementById('drawer-scale-wrapper');
      const dimBadge = document.getElementById('drawer-dim-badge');
      const rotateBtn = document.getElementById('drawer-rotate-btn');
      const rotateLabel = document.getElementById('drawer-rotate-label');

      const updateDrawerRenderCode = () => {
        if (!dp || !editor) return;
        const code = editor.value;
        if (BB.currentMode === 'css') {
          const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${code}</style></head><body style="padding:16px; font-family:system-ui, -apple-system, sans-serif; background:#0f172a; color:#f8fafc; line-height:1.6;"><div style="max-width:960px; margin:0 auto;"><header style="padding:12px; margin-bottom:16px; border-radius:8px; background:rgba(30,41,59,0.8); border:1px solid rgba(255,255,255,0.1);"><h3 style="margin:0; font-size:16px; color:#38bdf8;">CSS Live Sandbox</h3></header><div class="hero-card card" style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:16px; margin-bottom:14px;"><h2 class="card-title" style="margin:0 0 8px 0; font-size:18px;">Live Render Component</h2><p style="color:#94a3b8; font-size:13px; margin:0 0 12px 0;">Styles under test applied in real-time.</p><button class="button-primary" style="padding:6px 14px; border-radius:6px; background:#0284c7; color:#fff; border:none; font-weight:600;">Button</button></div></div></body></html>`;
          dp.src = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
        } else {
          dp.src = URL.createObjectURL(new Blob([code], { type: 'text/html;charset=utf-8' }));
        }
      };

      const updateDrawerDeviceScale = () => {
        if (!stage || !box || !wrapper) return;

        let targetW = 375;
        let targetH = 667;
        let label = 'Mobile · 375 × 667';

        if (drawerDevice === 'desktop') {
          targetW = 1200;
          targetH = 800;
          label = 'Desktop · 1200 × 800';
        } else if (drawerDevice === 'tablet') {
          targetW = 768;
          targetH = 1024;
          label = 'Tablet · 768 × 1024';
        } else if (drawerDevice === 'mobile') {
          if (isMobileLandscape) {
            targetW = 667;
            targetH = 375;
            label = 'Mobile Landscape · 667 × 375';
          } else {
            targetW = 375;
            targetH = 667;
            label = 'Mobile Portrait · 375 × 667';
          }
        } else if (drawerDevice === 'fluid') {
          box.style.width = '100%';
          box.style.height = '100%';
          box.style.minHeight = '320px';
          wrapper.style.position = 'relative';
          wrapper.style.width = '100%';
          wrapper.style.height = '100%';
          wrapper.style.transform = 'none';
          if (dimBadge) dimBadge.textContent = 'Fluid · 100% Responsive';
          return;
        }

        const availableW = Math.max(80, stage.clientWidth - 20);
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
        if (dimBadge) dimBadge.textContent = `${label} (${pct}%)`;
      };

      document.querySelectorAll('.drawer-dev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.drawer-dev-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = 'var(--text-muted)';
            b.style.fontWeight = 'normal';
          });
          btn.classList.add('active');
          btn.style.background = 'var(--primary)';
          btn.style.color = '#0f172a';
          btn.style.fontWeight = '700';

          drawerDevice = btn.getAttribute('data-drawer-device') || 'mobile';
          if (rotateBtn) {
            rotateBtn.style.display = drawerDevice === 'mobile' ? 'inline-flex' : 'none';
          }
          updateDrawerDeviceScale();
        });
      });

      if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
          isMobileLandscape = !isMobileLandscape;
          if (rotateLabel) {
            rotateLabel.textContent = isMobileLandscape ? 'Rotate Portrait' : 'Rotate Landscape';
          }
          updateDrawerDeviceScale();
        });
      }

      updateDrawerRenderCode();
      setTimeout(updateDrawerDeviceScale, 40);
    } else if (toolId === 'mistakes') {
      title = 'Mistakes DB';
      drawerViewportContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          <input type="text" id="drawer-mistakes-search" class="search-input" placeholder="Search mistakes..." style="margin-bottom:0;">
          <div id="drawer-mistakes-container" class="mistakes-horizontal-flow"></div>
        </div>
      `;
      const renderDrawerMistakes = (q = '') => {
        const mc = document.getElementById('drawer-mistakes-container');
        if (!mc) return;
        const filtered = BB.MISTAKES_DATA.filter(m => m.title.toLowerCase().includes(q.toLowerCase()) || m.reasonTl.toLowerCase().includes(q.toLowerCase()) || m.reasonEn.toLowerCase().includes(q.toLowerCase()));
        mc.innerHTML = filtered.map(m => `
          <div class="mistake-card-horiz cat-${m.category}">
            <div class="issue-header" style="padding:10px 12px;">
              <span class="tag-badge ${m.category}">${m.category.toUpperCase()}</span>
              <div style="font-size:12.5px; font-weight:700;">${BB.escapeHtml(isEnglish ? (m.titleEn || m.title) : m.title)}</div>
            </div>
            <div class="issue-body" style="padding:10px 12px; display:flex; flex-direction:column; gap:8px;">
              <p style="font-size:11.5px; color:#cbd5e1; margin:0 0 4px 0; line-height:1.45;">${BB.formatReasonText(isEnglish ? m.reasonEn : m.reasonTl)}</p>
              <div class="code-box bad" style="font-size:11px; margin-bottom:0;">
                <span class="code-label" style="color:#f87171; font-size:10px;">✕ ${isEnglish ? 'Mali / Bad Code' : 'Maling Code'}</span>
                <code>${BB.escapeHtml(m.bad)}</code>
              </div>
              <div class="code-box good" style="font-size:11px;">
                <span class="code-label" style="color:#4ade80; font-size:10px; margin-bottom:4px;">✓ ${isEnglish ? 'Tama / Fixed Code' : 'Tamang Code'}</span>
                <code>${BB.escapeHtml(m.good)}</code>
              </div>
            </div>
            <div class="issue-actions" style="padding:6px 12px; background:rgba(15,23,42,0.4); border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:flex-end; gap:6px;">
              <button class="btn btn-outline" style="font-size:11px; padding:3px 9px;" onclick="window.copyMistakeGood('${m.id}')">
                📋 ${isEnglish ? 'Copy Fix' : 'Kopyahin'}
              </button>
            </div>
          </div>
        `).join('');
      };
      renderDrawerMistakes();
      const dms = document.getElementById('drawer-mistakes-search');
      if (dms) dms.addEventListener('input', (e) => renderDrawerMistakes(e.target.value));
    } else if (toolId === 'tips') {
      title = 'Best Practices';
      drawerViewportContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${BB.TIPS_DATA.map(t => `
            <div class="mistake-card-horiz cat-${t.category}">
              <div class="issue-header" style="padding:8px 10px;">
                <span class="tag-badge ${t.category}">${t.category.toUpperCase()}</span>
                <span style="font-size:12px; font-weight:700;">${t.title}</span>
              </div>
              <div class="issue-body" style="padding:10px;">
                <p style="font-size:11.5px; color:#cbd5e1; margin-bottom:6px;">${isEnglish ? t.descEn : t.descTl}</p>
                <div class="code-box good" style="font-size:11px;"><code>${BB.escapeHtml(t.code)}</code></div>
              </div>
              <div class="issue-actions" style="padding:6px 12px; background:rgba(15,23,42,0.4); border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:flex-end; gap:6px;">
                <button class="btn btn-outline" style="font-size:11px; padding:3px 9px;" onclick="window.copyTipCode('${t.id}')">
                  📋 ${isEnglish ? 'Copy Code' : 'Kopyahin'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (toolId === 'templates') {
      title = 'Starter Templates';
      drawerViewportContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${BB.TEMPLATES_DATA.map((tmpl, idx) => `
            <div class="issue-card" style="margin:0;">
              <div class="issue-header" style="padding:8px 10px;">
                <div style="font-size:12px; font-weight:700;">${tmpl.title}</div>
              </div>
              <div class="issue-body" style="padding:8px 10px;">
                <p style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">${tmpl.desc}</p>
                <button class="btn btn-primary" style="font-size:11px; padding:4px 10px; width:100%; justify-content:center;" onclick="window.loadTemplate(${idx}); window.closeMobileDrawer();">
                  🚀 ${isEnglish ? 'Load Into Editor' : 'Gamitin sa Editor'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (toolId === 'health') {
      title = 'Code Health Grade';
      const errorCount = BB.currentIssues.filter(i => i.severity === 'error').length;
      const warnCount = BB.currentIssues.filter(i => i.severity === 'warning').length;
      let grade = errorCount > 0 ? (errorCount > 3 ? 'F' : 'C') : (warnCount > 2 ? 'B' : 'A+');
      let color = grade === 'A+' ? '#10b981' : (grade === 'B' ? '#38bdf8' : (grade === 'C' ? '#f59e0b' : '#f43f5e'));

      drawerViewportContent.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; align-items:center; gap:14px; background:var(--bg-surface); padding:14px; border-radius:10px; border:1px solid var(--border-color);">
            <div style="width:60px; height:60px; border-radius:50%; border:3px solid ${color}; color:${color}; background:${color}1a; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:900;">${grade}</div>
            <div>
              <div style="font-size:14px; font-weight:700; color:#fff;">${grade === 'A+' ? 'Pristine Compliance' : (grade === 'F' ? 'Critical Errors' : 'Good Code Health')}</div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${BB.currentIssues.length} total issues found in document.</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div class="stat-card"><div class="stat-val" style="font-size:16px;">${errorCount}</div><div class="stat-name">Errors</div></div>
            <div class="stat-card"><div class="stat-val" style="font-size:16px;">${warnCount}</div><div class="stat-name">Warnings</div></div>
          </div>
        </div>
      `;
    } else if (toolId === 'settings') {
      title = 'Settings & Font Size';
      BB.closeMobileDrawer();
      BB.openSettingsModal();
      return;
    }

    if (drawerViewportTitle) drawerViewportTitle.textContent = title;
  };

  // 12. Global Scroll Button Check
  BB.updateGlobalScrollButton = function() {
    const floatingGlobalTop = document.getElementById('floating-global-top');
    const editor = document.getElementById('code-editor');
    const tabBody = document.getElementById('right-tab-body');
    if (!floatingGlobalTop) return;

    if (window.innerWidth <= 840 && !document.body.classList.contains('mobile-view-inspector')) {
      floatingGlobalTop.classList.remove('visible');
      return;
    }
    const editorScrolled = editor && editor.scrollTop > 50;
    const panelScrolled = tabBody && tabBody.scrollTop > 100;
    const windowScrolled = window.scrollY > 120 || document.documentElement.scrollTop > 120;

    if (editorScrolled || panelScrolled || windowScrolled) {
      floatingGlobalTop.classList.add('visible');
    } else {
      floatingGlobalTop.classList.remove('visible');
    }
  };

  // Bind global functions for inline onclick handlers
  window.applySingleFix = BB.applySingleFix;
  window.copyIssueSnippet = function(idx) {
    const issue = BB.currentIssues[idx];
    if (!issue || !issue.goodCode) return;
    navigator.clipboard.writeText(issue.goodCode);
    BB.showToast(BB.currentLanguage === 'english' ? 'Fix snippet copied to clipboard!' : 'Nai-copy ang tamang snippet!', '📋');
  };
  window.copyMistakeGood = function(mistakeId) {
    const item = BB.MISTAKES_DATA.find(m => m.id === mistakeId);
    if (!item || !item.good) return;
    navigator.clipboard.writeText(item.good);
    BB.showToast(BB.currentLanguage === 'english' ? 'Fix code copied to clipboard!' : 'Nai-copy ang tamang code!', '📋');
  };
  window.copyTipCode = function(tipId) {
    const tip = BB.TIPS_DATA.find(t => t.id === tipId);
    if (!tip || !tip.code) return;
    navigator.clipboard.writeText(tip.code);
    BB.showToast(BB.currentLanguage === 'english' ? 'Boilerplate snippet copied to clipboard!' : 'Nai-copy ang boilerplate!', '📋');
  };
  window.loadTemplate = function(idx) {
    const editor = document.getElementById('code-editor');
    if (!editor) return;
    editor.value = BB.TEMPLATES_DATA[idx].code;
    if (BB.modeBuffers) BB.modeBuffers[BB.currentMode] = editor.value;
    if (typeof BB.updateLineNumbers === 'function') BB.updateLineNumbers();
    BB.renderDiagnostics();
    BB.showToast(BB.currentLanguage === 'english' ? `Loaded "${BB.TEMPLATES_DATA[idx].title}"` : `Nai-load ang "${BB.TEMPLATES_DATA[idx].title}"`, '🚀');
  };
  window.jumpToDiagnosticCard = BB.jumpToDiagnosticCard;
  window.jumpToLineFromGutter = BB.jumpToDiagnosticCard;
  window.setMobileView = BB.setMobileView;
  window.closeMobileDrawer = BB.closeMobileDrawer;

})(window.BugBuster);
