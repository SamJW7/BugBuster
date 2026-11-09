/**
 * BugBuster 9.0 - Utility Functions & Helpers
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  BB.getLevenshteinDistance = function(a, b) {
    if (!a || !b) return (a || '').length + (b || '').length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  BB.findClosestWord = function(target, list) {
    if (!target || !list || list.length === 0) return null;
    let minDistance = Infinity;
    let bestMatch = null;
    const lowerTarget = target.toLowerCase();
    for (const candidate of list) {
      const lowerCandidate = candidate.toLowerCase();
      if (lowerCandidate.startsWith(lowerTarget) || lowerTarget.startsWith(lowerCandidate)) {
        return candidate;
      }
      const dist = BB.getLevenshteinDistance(lowerTarget, lowerCandidate);
      if (dist < minDistance && dist <= Math.max(3, Math.floor(target.length / 2) + 1)) {
        minDistance = dist;
        bestMatch = candidate;
      }
    }
    return bestMatch;
  };

  BB.escapeHtml = function(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  BB.escapeQuotes = function(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '\\n');
  };

  BB.formatFeedbackText = function(text) {
    if (!text) return '';
    let safe = BB.escapeHtml(String(text));
    // Format HTML tags like &lt;h1&gt;, &lt;/div&gt;, &lt;!DOCTYPE html&gt;, etc. with inline code badges
    safe = safe.replace(/&lt;([a-zA-Z0-9_\-\/!\s="':.#]+)&gt;/g, '<code class="inline-code-tag">&lt;$1&gt;</code>');
    safe = safe.replace(/`([^`]+)`/g, '<code class="inline-code-tag">$1</code>');
    return safe;
  };

  BB.formatReasonText = function(str) {
    if (!str) return '';
    let escaped = BB.escapeHtml(str);
    // Highlight inline tag references like &lt;img&gt;, &lt;br&gt;, &lt;input&gt; so they render as distinct code badges
    escaped = escaped.replace(/&lt;([a-zA-Z0-9_\-\/]+)&gt;/g, '<span class="inline-code-tag">&lt;$1&gt;</span>');
    // Highlight inline backtick snippets `...`
    escaped = escaped.replace(/`([^`]+)`/g, '<span class="quoted-highlight">$1</span>');
    return escaped;
  };

  BB.showToast = function(msg, icon = '✨') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    if (toastIcon) toastIcon.textContent = icon;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    if (BB._toastTimer) clearTimeout(BB._toastTimer);
    BB._toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  };

})(window.BugBuster);
