/**
 * BugBuster 9.0 - Code Editor, Syntax Highlighter & Gutter Controller
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  let activeHighlightTimeout = null;

  // 100% Offline Syntax Highlighting Tokenizer for HTML & CSS (VS Code Dark Modern / Light)
  BB.highlightCodeToLines = function(code, mode) {
    const rawLines = code.split('\n');
    const highlighted = [];
    let inHtmlComment = false;
    let inCssComment = false;
    let inStyle = (mode === 'css');

    function formatAttrs(attrStr) {
      if (!attrStr) return '';
      return attrStr.replace(/([a-zA-Z0-9_\-:@]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))|([a-zA-Z0-9_\-:@]+)/g, (m, name, val, boolName) => {
        if (boolName) {
          return `<span class="tok-attr-name">${BB.escapeHtml(boolName)}</span>`;
        }
        const eqIdx = val.indexOf('=');
        const eq = val.slice(0, eqIdx + 1);
        const vStr = val.slice(eqIdx + 1);
        return `<span class="tok-attr-name">${BB.escapeHtml(name)}</span><span class="tok-operator">${BB.escapeHtml(eq)}</span><span class="tok-string">${BB.escapeHtml(vStr)}</span>`;
      });
    }

    function formatCssLine(lineStr) {
      if (/^\s*\/\*/.test(lineStr) && lineStr.includes('*/')) {
        return lineStr.replace(/(\/\*[\s\S]*?\*\/)/g, m => `<span class="tok-comment">${BB.escapeHtml(m)}</span>`);
      }
      if (/^\s*\/\//.test(lineStr)) {
        return `<span class="tok-comment">${BB.escapeHtml(lineStr)}</span>`;
      }

      if (lineStr.includes('{')) {
        const braceIdx = lineStr.indexOf('{');
        const before = lineStr.slice(0, braceIdx);
        const after = lineStr.slice(braceIdx + 1);
        let res = `<span class="tok-selector">${BB.escapeHtml(before)}</span><span class="tok-punct">{</span>`;
        if (after.trim().length > 0) {
          res += formatCssLine(after);
        }
        return res;
      }

      if (lineStr.trim() === '}') {
        return lineStr.replace('}', '<span class="tok-punct">}</span>');
      }

      if (lineStr.includes(':')) {
        const colonIdx = lineStr.indexOf(':');
        const prop = lineStr.slice(0, colonIdx);
        const val = lineStr.slice(colonIdx + 1);

        let valHtml = BB.escapeHtml(val);
        valHtml = valHtml.replace(/(".*?"|'.*?)/g, m => `<span class="tok-string">${m}</span>`);
        valHtml = valHtml.replace(/(#[0-9a-fA-F]{3,8}\b)/g, m => `<span class="tok-val-number">${m}</span>`);
        valHtml = valHtml.replace(/(\b\-?[0-9]+(?:\.[0-9]+)?(?:px|rem|em|vh|vw|%|deg|s|ms|fr)?\b)/gi, m => `<span class="tok-val-number">${m}</span>`);
        valHtml = valHtml.replace(/\b(inherit|initial|unset|revert|auto|none|block|inline\-block|inline|flex|grid|absolute|relative|fixed|sticky|bold|normal|center|transparent|hidden|pointer|nowrap|underline|calc|rgba|rgb|var)\b/gi, m => `<span class="tok-val-keyword">${m}</span>`);
        valHtml = valHtml.replace(/;/g, '<span class="tok-punct">;</span>');

        return `<span class="tok-property">${BB.escapeHtml(prop)}</span><span class="tok-punct">:</span>${valHtml}`;
      }

      return `<span class="tok-selector">${BB.escapeHtml(lineStr)}</span>`;
    }

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (line === '') {
        highlighted.push('&nbsp;');
        continue;
      }

      if (inHtmlComment) {
        const endIdx = line.indexOf('-->');
        if (endIdx !== -1) {
          inHtmlComment = false;
          const cEnd = line.slice(0, endIdx + 3);
          const remainder = line.slice(endIdx + 3);
          highlighted.push(`<span class="tok-comment">${BB.escapeHtml(cEnd)}</span>` + (remainder ? BB.escapeHtml(remainder) : ''));
        } else {
          highlighted.push(`<span class="tok-comment">${BB.escapeHtml(line)}</span>`);
        }
        continue;
      }

      if (inCssComment) {
        const endIdx = line.indexOf('*/');
        if (endIdx !== -1) {
          inCssComment = false;
          const cEnd = line.slice(0, endIdx + 2);
          const remainder = line.slice(endIdx + 2);
          highlighted.push(`<span class="tok-comment">${BB.escapeHtml(cEnd)}</span>` + (remainder ? formatCssLine(remainder) : ''));
        } else {
          highlighted.push(`<span class="tok-comment">${BB.escapeHtml(line)}</span>`);
        }
        continue;
      }

      if (!inStyle && line.includes('<!--')) {
        const startIdx = line.indexOf('<!--');
        const endIdx = line.indexOf('-->', startIdx + 4);
        if (endIdx !== -1) {
          const before = line.slice(0, startIdx);
          const comm = line.slice(startIdx, endIdx + 3);
          const after = line.slice(endIdx + 3);
          highlighted.push((before ? BB.escapeHtml(before) : '') + `<span class="tok-comment">${BB.escapeHtml(comm)}</span>` + (after ? BB.escapeHtml(after) : ''));
          continue;
        } else {
          inHtmlComment = true;
          const before = line.slice(0, startIdx);
          const comm = line.slice(startIdx);
          highlighted.push((before ? BB.escapeHtml(before) : '') + `<span class="tok-comment">${BB.escapeHtml(comm)}</span>`);
          continue;
        }
      }

      if (!inStyle && /<style\b[^>]*>/i.test(line)) {
        inStyle = true;
        const styledLine = line.replace(/(<style\b[^>]*>)([\s\S]*)/i, (m, tagPart, rest) => {
          const formattedTag = tagPart.replace(/<style\b([^>]*)>/i, (tm, attrs) => {
            return `<span class="tok-tag-bracket">&lt;</span><span class="tok-tag">style</span>${formatAttrs(attrs)}<span class="tok-tag-bracket">&gt;</span>`;
          });
          return formattedTag + (rest ? formatCssLine(rest) : '');
        });
        highlighted.push(styledLine);
        continue;
      }

      if (inStyle && mode !== 'css' && /<\/style>/i.test(line)) {
        inStyle = false;
        const styledLine = line.replace(/([\s\S]*?)(<\/style>)/i, (m, before, closeTag) => {
          return (before ? formatCssLine(before) : '') + `<span class="tok-tag-bracket">&lt;/</span><span class="tok-tag">style</span><span class="tok-tag-bracket">&gt;</span>`;
        });
        highlighted.push(styledLine);
        continue;
      }

      if (inStyle) {
        if (line.includes('/*') && !line.includes('*/')) {
          inCssComment = true;
          const sIdx = line.indexOf('/*');
          const before = line.slice(0, sIdx);
          const comm = line.slice(sIdx);
          highlighted.push((before ? formatCssLine(before) : '') + `<span class="tok-comment">${BB.escapeHtml(comm)}</span>`);
          continue;
        }
        highlighted.push(formatCssLine(line));
        continue;
      }

      if (/<!DOCTYPE\b/i.test(line)) {
        const docFormatted = line.replace(/(<!DOCTYPE\s+html[^>]*>)/i, (m, dt) => `<span class="tok-doctype">${BB.escapeHtml(dt)}</span>`);
        highlighted.push(docFormatted);
        continue;
      }

      let htmlResult = '';
      let cursor = 0;
      const lineLen = line.length;

      while (cursor < lineLen) {
        const nextLt = line.indexOf('<', cursor);
        if (nextLt === -1) {
          htmlResult += BB.escapeHtml(line.slice(cursor));
          break;
        }

        if (nextLt > cursor) {
          htmlResult += BB.escapeHtml(line.slice(cursor, nextLt));
          cursor = nextLt;
        }

        if (line.startsWith('</', cursor)) {
          const closeGt = line.indexOf('>', cursor + 2);
          if (closeGt !== -1) {
            const tagContent = line.slice(cursor + 2, closeGt);
            htmlResult += `<span class="tok-tag-bracket">&lt;/</span><span class="tok-tag">${BB.escapeHtml(tagContent.trim())}</span><span class="tok-tag-bracket">&gt;</span>`;
            cursor = closeGt + 1;
          } else {
            const tagContent = line.slice(cursor + 2);
            htmlResult += `<span class="tok-tag-bracket">&lt;/</span><span class="tok-tag">${BB.escapeHtml(tagContent.trim())}</span>`;
            cursor = lineLen;
          }
          continue;
        }

        const openGt = line.indexOf('>', cursor + 1);
        if (openGt !== -1) {
          const tagFull = line.slice(cursor + 1, openGt);
          const isSelfClose = tagFull.endsWith('/');
          const innerClean = isSelfClose ? tagFull.slice(0, -1).trim() : tagFull.trim();
          const spaceIdx = innerClean.search(/\s/);
          let tagName = innerClean;
          let attrs = '';
          if (spaceIdx !== -1) {
            tagName = innerClean.slice(0, spaceIdx);
            attrs = innerClean.slice(spaceIdx);
          }

          htmlResult += `<span class="tok-tag-bracket">&lt;</span><span class="tok-tag">${BB.escapeHtml(tagName)}</span>`;
          if (attrs) {
            htmlResult += formatAttrs(attrs);
          }
          htmlResult += `<span class="tok-tag-bracket">${isSelfClose ? '/&gt;' : '&gt;'}</span>`;
          cursor = openGt + 1;
        } else {
          const remaining = line.slice(cursor);
          const incompleteMatch = remaining.match(/^<([a-zA-Z0-9_\-]+)?(.*)$/);
          if (incompleteMatch) {
            const tag = incompleteMatch[1] || '';
            const rest = incompleteMatch[2] || '';
            htmlResult += `<span class="tok-tag-bracket">&lt;</span>` + (tag ? `<span class="tok-tag">${BB.escapeHtml(tag)}</span>` : '') + BB.escapeHtml(rest);
          } else {
            htmlResult += BB.escapeHtml(remaining);
          }
          cursor = lineLen;
        }
      }

      highlighted.push(htmlResult || '&nbsp;');
    }

    return highlighted;
  };

  BB.updateLineNumbersAndHighlights = function() {
    const editor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const highlightsLayer = document.getElementById('editor-highlights-layer');
    const highlightsContent = document.getElementById('editor-highlights-content');
    if (!editor || !lineNumbers) return;

    const code = editor.value;
    const lines = code.split('\n');
    const totalLines = lines.length;

    const lineSeverityMap = new Map();
    const severityRank = { 'error': 3, 'warning': 2, 'suggestion': 1 };

    if (Array.isArray(BB.currentIssues)) {
      for (let i = 0; i < BB.currentIssues.length; i++) {
        const issue = BB.currentIssues[i];
        const ln = issue.line;
        if (typeof ln === 'number' && ln >= 1 && ln <= totalLines) {
          const current = lineSeverityMap.get(ln);
          if (!current || (severityRank[issue.severity] || 0) > (severityRank[current.severity] || 0)) {
            lineSeverityMap.set(ln, issue);
          }
        }
      }
    }

    const syntaxLines = BB.highlightCodeToLines(code, BB.currentMode);

    let gutterHtml = '';
    let highlightsHtml = '';

    for (let i = 1; i <= totalLines; i++) {
      const issue = lineSeverityMap.get(i);
      let gutterClasses = 'gutter-line';
      let hlClasses = 'editor-hl-line';
      let dotHtml = '';

      if (issue) {
        let titleText = `Line ${i}`;
        if (issue.severity === 'error') {
          gutterClasses += ' has-error';
          hlClasses += ' hl-error';
          titleText = `Line ${i}: [Error] ${issue.title} (Click circle dot to view issue card)`;
          dotHtml = `<span class="gutter-dot dot-error" onclick="window.jumpToDiagnosticCard(${i}, event)" title="${BB.escapeHtml(titleText)}"></span>`;
        } else if (issue.severity === 'warning') {
          gutterClasses += ' has-warning';
          hlClasses += ' hl-warning';
          titleText = `Line ${i}: [Warning] ${issue.title} (Click circle dot to view issue card)`;
          dotHtml = `<span class="gutter-dot dot-warning" onclick="window.jumpToDiagnosticCard(${i}, event)" title="${BB.escapeHtml(titleText)}"></span>`;
        } else if (issue.severity === 'suggestion') {
          gutterClasses += ' has-suggestion';
          hlClasses += ' hl-suggestion';
          titleText = `Line ${i}: [Suggestion] ${issue.title} (Click circle dot to view issue card)`;
          dotHtml = `<span class="gutter-dot dot-suggestion" onclick="window.jumpToDiagnosticCard(${i}, event)" title="${BB.escapeHtml(titleText)}"></span>`;
        }
      }

      const lineCode = syntaxLines[i - 1] || '&nbsp;';

      gutterHtml += `<div class="${gutterClasses}" id="gutter-line-${i}" data-line="${i}"><span class="gutter-dot-slot">${dotHtml}</span><span class="gutter-num">${i}</span></div>`;
      highlightsHtml += `<div class="${hlClasses}" id="hl-line-${i}" data-line="${i}">${lineCode}</div>`;
    }

    lineNumbers.innerHTML = gutterHtml;
    if (highlightsContent) {
      highlightsContent.innerHTML = highlightsHtml;
    }

    const st = editor.scrollTop;
    const sl = editor.scrollLeft;
    lineNumbers.scrollTop = st;
    if (highlightsLayer) {
      highlightsLayer.scrollTop = st;
      highlightsLayer.scrollLeft = sl;
    }
  };

  BB.updateLineNumbers = function() {
    BB.updateLineNumbersAndHighlights();
  };

  BB.triggerActiveLineHighlight = function(lineNum) {
    document.querySelectorAll('.active-jump').forEach(el => el.classList.remove('active-jump'));
    document.querySelectorAll('.hl-active-jump').forEach(el => el.classList.remove('hl-active-jump'));

    const gutterEl = document.getElementById(`gutter-line-${lineNum}`);
    const hlEl = document.getElementById(`hl-line-${lineNum}`);

    if (gutterEl) gutterEl.classList.add('active-jump');
    if (hlEl) hlEl.classList.add('hl-active-jump');

    if (activeHighlightTimeout) clearTimeout(activeHighlightTimeout);
    activeHighlightTimeout = setTimeout(() => {
      if (gutterEl) gutterEl.classList.remove('active-jump');
      if (hlEl) hlEl.classList.remove('hl-active-jump');
    }, 2200);
  };

  BB.jumpToLine = function(lineNum, evt) {
    if (evt) {
      if (typeof evt.preventDefault === 'function') evt.preventDefault();
      if (typeof evt.stopPropagation === 'function') evt.stopPropagation();
    }

    if (window.innerWidth <= 840 && typeof BB.setMobileView === 'function') {
      BB.setMobileView('editor');
    }

    const editor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const highlightsLayer = document.getElementById('editor-highlights-layer');
    const tabBody = document.getElementById('right-tab-body');
    if (!editor) return;

    const lines = editor.value.split('\n');
    if (lineNum < 1) lineNum = 1;
    if (lineNum > lines.length) lineNum = lines.length;

    let charPos = 0;
    for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
      charPos += lines[i].length + 1;
    }
    const lineLength = lines[lineNum - 1] ? lines[lineNum - 1].length : 0;

    const lineHeight = 22;
    const visibleHeight = editor.clientHeight || 400;
    const targetScroll = Math.max(0, (lineNum - 1) * lineHeight - Math.floor(visibleHeight / 3));

    const savedWinX = window.pageXOffset || window.scrollX || 0;
    const savedWinY = window.pageYOffset || window.scrollY || 0;
    const savedTabY = tabBody ? tabBody.scrollTop : 0;

    editor.scrollTop = targetScroll;
    if (lineNumbers) lineNumbers.scrollTop = targetScroll;
    if (highlightsLayer) highlightsLayer.scrollTop = targetScroll;

    try {
      editor.focus({ preventScroll: true });
    } catch (e) {
      editor.focus();
    }

    try {
      editor.setSelectionRange(charPos, charPos + lineLength);
    } catch (e) {}

    window.scrollTo({ top: savedWinY, left: savedWinX, behavior: 'instant' });
    if (tabBody) {
      tabBody.scrollTop = savedTabY;
    }

    requestAnimationFrame(() => {
      editor.scrollTop = targetScroll;
      if (lineNumbers) lineNumbers.scrollTop = targetScroll;
      if (highlightsLayer) highlightsLayer.scrollTop = targetScroll;
      window.scrollTo({ top: savedWinY, left: savedWinX, behavior: 'instant' });
      if (tabBody) tabBody.scrollTop = savedTabY;
    });

    BB.triggerActiveLineHighlight(lineNum);
    BB.showToast(BB.currentLanguage === 'english' ? `Focused Line ${lineNum}` : `Nai-focus sa Linya ${lineNum}`, '📍');
  };

  BB.formatCode = function() {
    const editor = document.getElementById('code-editor');
    if (!editor) return;
    let code = editor.value;
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    const formatted = [];

    lines.forEach(rawLine => {
      let line = rawLine.trim();
      if (!line) {
        formatted.push('');
        return;
      }

      if (line.startsWith('</') || line.startsWith('}') || line.startsWith('-->')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted.push(' '.repeat(indentLevel * indentSize) + line);

      if ((line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</') && !/<!DOCTYPE|<meta|<link|<img|<br|<hr|<input/i.test(line)) || line.endsWith('{')) {
        indentLevel++;
      }
    });

    editor.value = formatted.join('\n');
    BB.updateLineNumbers();
    if (typeof BB.renderDiagnostics === 'function') BB.renderDiagnostics();
    BB.showToast(BB.currentLanguage === 'english' ? 'Code aligned and formatted!' : 'Nai-format at nai-align ang code!', '✨');
  };

  // Expose global functions for direct inline HTML onclick bindings
  window.jumpToLine = BB.jumpToLine;
  window.formatCode = BB.formatCode;

})(window.BugBuster);
