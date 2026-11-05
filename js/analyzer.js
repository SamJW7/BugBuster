/**
 * BugBuster 9.0 - W3C Standards Analyzer Engine (HTML5 & CSS3/CSS4)
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  // ======================================================================
  // COMPREHENSIVE W3C CSS3 & CSS4 VALIDATION & PARSING ENGINE
  // ======================================================================
  BB.analyzeCSSBlock = function(cssContent, baseLineOffset, isEmbedded, issues, getLineNumber, htmlContext) {
    if (!cssContent || !cssContent.trim()) return;

    const cssLines = cssContent.split('\n');
    const unreferencedSelectors = [];

    // 1. Unclosed Block Comments
    const openComments = (cssContent.match(/\/\*/g) || []).length;
    const closeComments = (cssContent.match(/\*\//g) || []).length;
    if (openComments > closeComments) {
      issues.push({
        severity: 'error',
        category: 'css',
        line: baseLineOffset,
        title: 'Unclosed CSS Block Comment (/* without */)',
        snippet: '/*',
        badCode: '/* Comment without closing tag',
        goodCode: '/* Comment */',
        taglishBakit: 'May binuksang "/*" comment sa CSS ngunit hindi ito naisara ng "*/".',
        taglishDahilan: 'Kailangan ang "*/" upang markahan ang dulo ng komento sa CSS.',
        taglishEpekto: 'Kainin ng komento ang buong natitirang bahagi ng stylesheet, kaya hindi gagana ang mga sumusunod na styles.',
        taglishSolusyon: 'Isara ang komento sa pamamagitan ng paglalagay ng "*/".',
        englishBakit: 'A CSS comment was opened with "/*" but not terminated with "*/".',
        englishDahilan: 'CSS syntax requires matching comment delimiters.',
        englishEpekto: 'Causes all subsequent style declarations to be commented out inadvertently.',
        englishSolusyon: 'Add "*/" to close the comment block.',
        w3cRule: 'W3C CSS Syntax Level 3 Section 4.1: Comments.',
        autoFixType: 'fix_css_comment'
      });
    }

    // 2. Curly Braces Balancing & Unclosed Rule Blocks Tracking
    let braceDepth = 0;
    const braceStack = [];
    for (let i = 0; i < cssLines.length; i++) {
      const l = cssLines[i];
      const currLineNum = baseLineOffset + i;
      const lineClean = l.replace(/\/\*[\s\S]*?\*\//g, '');
      for (let c = 0; c < lineClean.length; c++) {
        if (lineClean[c] === '{') {
          braceDepth++;
          braceStack.push({ line: currLineNum });
        } else if (lineClean[c] === '}') {
          braceDepth--;
          if (braceStack.length > 0) braceStack.pop();
          else {
            issues.push({
              severity: 'error',
              category: 'css',
              line: currLineNum,
              title: 'Unexpected Extra Closing "}" in CSS',
              snippet: '}',
              badCode: '}}',
              goodCode: '}',
              taglishBakit: 'May labis na closing brace "}" na walang kapares na opening brace.',
              taglishDahilan: 'Hindi balanse ang mga braces sa loob ng CSS.',
              taglishEpekto: 'Nagdudulot ito ng premature termination sa stylesheet parser.',
              taglishSolusyon: 'Tanggalin ang sobrang "}" brace.',
              englishBakit: 'Found an extra closing "}" brace without a matching opening "{" brace.',
              englishDahilan: 'Unbalanced curly brackets violate standard CSS syntax.',
              englishEpekto: 'Parser encounters a premature block termination error.',
              englishSolusyon: 'Remove the surplus "}" brace.',
              w3cRule: 'W3C CSS Syntax Level 3: Block syntax parsing rules.'
            });
          }
        }
      }
    }

    while (braceStack.length > 0) {
      const unclosed = braceStack.pop();
      issues.push({
        severity: 'error',
        category: 'css',
        line: unclosed.line,
        title: 'Unclosed CSS Rule Block (Missing "}")',
        snippet: '{ ...',
        badCode: '.selector { property: value;',
        goodCode: '.selector { property: value; }',
        taglishBakit: `May binuksang CSS rule block "{" sa Linya ${unclosed.line} na walang katugmang closing brace "}".`,
        taglishDahilan: 'Lahat ng rule blocks sa CSS ay kailangang magtapos sa "}".',
        taglishEpekto: 'Hindi ma-parse ng maayos ang stylesheet at magkakagulo ang mga styles.',
        taglishSolusyon: 'Maglagay ng closing "}" brace sa dulo ng rule block.',
        englishBakit: `The CSS rule block opened on line ${unclosed.line} is missing its terminating "}" curly brace.`,
        englishDahilan: 'Block rules must be cleanly balanced in standard CSS syntax.',
        englishEpekto: 'The CSS parser cannot determine where declarations end, dropping styles.',
        englishSolusyon: 'Add the missing "}" closing brace.',
        w3cRule: 'W3C CSS Syntax Level 3: Block syntax parsing rules.'
      });
    }

    // Helper: Calculate W3C Specificity [A, B, C]
    function calculateSpecificity(s) {
      if (!s || s.startsWith('@')) return [0, 0, 0];
      const ids = (s.match(/#[a-zA-Z0-9_\-]+/g) || []).length;
      const classes = (s.match(/\.[a-zA-Z0-9_\-]+/g) || []).length;
      const attrs = (s.match(/\[[^\]]+\]/g) || []).length;
      const pseudoClasses = (s.match(/(?<!:):(?!:)[a-zA-Z0-9_\-]+/g) || []).filter(
        pc => !/:(not|is|where|has)\b/i.test(pc)
      ).length;
      const b = classes + attrs + pseudoClasses;
      const pseudoElems = (s.match(/::[a-zA-Z0-9_\-]+|:(before|after|first-line|first-letter)\b/gi) || []).length;
      const cleaned = s
        .replace(/#[a-zA-Z0-9_\-]+/g, ' ')
        .replace(/\.[a-zA-Z0-9_\-]+/g, ' ')
        .replace(/\[[^\]]+\]/g, ' ')
        .replace(/::?[a-zA-Z0-9_\-]+/g, ' ')
        .replace(/[:>+~*()]/g, ' ');
      const typeWords = cleaned.split(/\s+/).filter(w => /^[a-zA-Z][a-zA-Z0-9]*$/.test(w));
      const c = typeWords.length + pseudoElems;
      return [ids, b, c];
    }

    // Helper: Check Specific Property Conflicts within a single rule block
    function checkBlockConflicts(selector, decls, selLine) {
      if (!decls || decls.length === 0) return;

      const propMap = {};
      decls.forEach(d => {
        if (!propMap[d.prop]) propMap[d.prop] = [];
        propMap[d.prop].push(d);
      });

      // Duplicate Properties check
      Object.keys(propMap).forEach(p => {
        if (propMap[p].length > 1) {
          const first = propMap[p][0];
          const second = propMap[p][1];
          issues.push({
            severity: 'warning',
            category: 'css',
            line: second.line,
            title: `Duplicate CSS Property "${p}" in Same Rule`,
            snippet: `${p}: ${second.val};`,
            badCode: `${p}: ${first.val};\n${p}: ${second.val};`,
            goodCode: `${p}: ${second.val};`,
            taglishBakit: `Dalawang beses na idineklara ang property na "${p}" sa parehong selector (${selector || 'rule'}).`,
            taglishDahilan: 'Ayon sa CSS cascade, ang huling deklarasyon lamang ang gagamitin at babalewalain ang nauna.',
            taglishEpekto: 'Maaaring magdulot ng kalituhan sa pag-maintain ng stylesheet.',
            taglishSolusyon: `Tanggalin ang lumang "${p}" declaration o pagsamahin ito.`,
            englishBakit: `The property "${p}" is declared multiple times within the same rule block.`,
            englishDahilan: 'In standard CSS cascade, the later declaration overrides the earlier one.',
            englishEpekto: 'Redundant code increases stylesheet weight and complicates maintenance.',
            englishSolusyon: `Consolidate or remove the duplicate "${p}" declaration.`,
            w3cRule: 'W3C CSS Cascading and Inheritance Level 4: The Cascade.'
          });
        }
      });

      const displayDecl = decls.find(d => d.prop === 'display');
      const isInline = displayDecl && displayDecl.val.trim() === 'inline';

      // CONFLICT 1: display: inline with width/height/min-width/max-width/min-height/max-height
      if (isInline) {
        const dimensionDecl = decls.find(d => /^(width|height|min-width|max-width|min-height|max-height)$/i.test(d.prop));
        if (dimensionDecl) {
          issues.push({
            severity: 'error',
            category: 'css',
            line: dimensionDecl.line,
            title: `Property Conflict: "${dimensionDecl.prop}" has No Effect on "display: inline"`,
            snippet: `${dimensionDecl.prop}: ${dimensionDecl.val};`,
            badCode: `display: inline;\n${dimensionDecl.prop}: ${dimensionDecl.val};`,
            goodCode: `display: inline-block;\n${dimensionDecl.prop}: ${dimensionDecl.val};`,
            taglishBakit: `Ang property na "${dimensionDecl.prop}" ay walang bisa sa mga elementong may "display: inline".`,
            taglishDahilan: 'Ayon sa W3C Box Model, ang lapad at taas ng non-replaced inline box ay itinatakda lamang ng text content nito.',
            taglishEpekto: 'Babalewalain ng browser ang sukat at hindi magbabago ang laki ng elemento sa screen.',
            taglishSolusyon: 'Palitan ang display ng "inline-block" o "block", o tanggalin ang dimension property.',
            englishBakit: `The "${dimensionDecl.prop}" property is declared on an element with "display: inline".`,
            englishDahilan: 'W3C Box Model specifies that inline boxes derive their dimensions exclusively from their content.',
            englishEpekto: 'Browsers ignore width and height on inline elements, rendering declarations ineffective.',
            englishSolusyon: 'Change display to "inline-block" or "block", or remove fixed dimensions.',
            w3cRule: 'W3C CSS Box Model Module Level 3 Section 3: Inline-level boxes.',
            autoFixType: 'fix_inline_display'
          });
        }

        // CONFLICT 2: display: inline with vertical margins
        const verticalMarginDecl = decls.find(d => /^(margin-top|margin-bottom)$/i.test(d.prop));
        if (verticalMarginDecl) {
          issues.push({
            severity: 'warning',
            category: 'css',
            line: verticalMarginDecl.line,
            title: `Property Conflict: "${verticalMarginDecl.prop}" Ignored on "display: inline"`,
            snippet: `${verticalMarginDecl.prop}: ${verticalMarginDecl.val};`,
            badCode: `display: inline;\n${verticalMarginDecl.prop}: ${verticalMarginDecl.val};`,
            goodCode: `display: inline-block;\n${verticalMarginDecl.prop}: ${verticalMarginDecl.val};`,
            taglishBakit: `Ang vertical margins tulad ng "${verticalMarginDecl.prop}" ay walang epekto sa "display: inline" elements.`,
            taglishDahilan: 'Sa CSS inline flow, ang top at bottom margins ay hindi nagtutulak ng katabing mga linya.',
            taglishEpekto: 'Walang espasyo o puwang na malilikha sa itaas o ibaba ng element.',
            taglishSolusyon: 'Gawing "display: inline-block;" o "display: block;" kung kailangan ng vertical margin.',
            englishBakit: `Vertical margin property "${verticalMarginDecl.prop}" has no effect on "display: inline" elements.`,
            englishDahilan: 'In standard CSS formatting, vertical margins do not displace adjacent line boxes in inline formatting contexts.',
            englishEpekto: 'No vertical separation is produced on the rendered page.',
            englishSolusyon: 'Set display to "inline-block" or "block" to respect vertical margins.',
            w3cRule: 'W3C CSS Box Model Level 3 Section 4: Margin properties.'
          });
        }
      }

      // CONFLICT 3: position: static (or default) with z-index
      const posDecl = decls.find(d => d.prop === 'position');
      const zIndexDecl = decls.find(d => d.prop === 'z-index');
      if (zIndexDecl) {
        const isStatic = !posDecl || posDecl.val.trim() === 'static';
        if (isStatic) {
          issues.push({
            severity: 'warning',
            category: 'css',
            line: zIndexDecl.line,
            title: 'Property Conflict: "z-index" has No Effect on "position: static"',
            snippet: `z-index: ${zIndexDecl.val};`,
            badCode: `${posDecl ? 'position: static;\n' : ''}z-index: ${zIndexDecl.val};`,
            goodCode: `position: relative;\nz-index: ${zIndexDecl.val};`,
            taglishBakit: 'Naglagay ka ng "z-index" ngunit ang elemento ay may "position: static" (o default na hindi positioned).',
            taglishDahilan: 'Ayon sa W3C CSS Positioning, ang z-index ay epektibo lamang sa *positioned elements* (relative, absolute, fixed, sticky).',
            taglishEpekto: 'Walang bisa ang z-index; hindi maiangat o maibaba ang stacking order ng element.',
            taglishSolusyon: 'Magdagdag ng "position: relative;" bago ang z-index upang paganahin ang stacking context.',
            englishBakit: 'The "z-index" property is specified on an element with "position: static" (or default unpositioned state).',
            englishDahilan: 'In standard CSS, z-index only affects positioned elements (relative, absolute, fixed, sticky).',
            englishEpekto: 'The stacking context is not created, and the element will not stack as intended.',
            englishSolusyon: 'Add "position: relative;" to establish a stacking context for z-index.',
            w3cRule: 'W3C CSS Positioned Layout Module Level 3 Section 4: The z-index property.',
            autoFixType: 'fix_zindex_pos'
          });
        }
      }

      // CONFLICT 4: display: flex / grid with float or clear
      const isFlexOrGrid = displayDecl && /^(flex|inline-flex|grid|inline-grid)$/i.test(displayDecl.val.trim());
      const floatDecl = decls.find(d => /^(float|clear)$/i.test(d.prop));
      if (isFlexOrGrid && floatDecl) {
        issues.push({
          severity: 'warning',
          category: 'css',
          line: floatDecl.line,
          title: `Property Conflict: "${floatDecl.prop}" has No Effect in Flex/Grid Layout`,
          snippet: `${floatDecl.prop}: ${floatDecl.val};`,
          badCode: `display: ${displayDecl.val};\n${floatDecl.prop}: ${floatDecl.val};`,
          goodCode: `display: ${displayDecl.val};\n/* Use flex/grid alignment properties instead */`,
          taglishBakit: `Gumamit ka ng "${floatDecl.prop}" sa container na naka-display ${displayDecl.val}.`,
          taglishDahilan: 'Ayon sa W3C Flexbox at Grid specs, ang float at clear ay ganap na binabalewala sa loob ng flex/grid contexts.',
          taglishEpekto: 'Babalewalain ng browser ang declaration.',
          taglishSolusyon: 'Alisin ang float/clear at gamitin ang flex properties tulad ng justify-content o align-items.',
          englishBakit: `The "${floatDecl.prop}" property is declared inside a ${displayDecl.val} container.`,
          englishDahilan: 'Per W3C specifications, float and clear have no effect on flex and grid items.',
          englishEpekto: 'Browsers discard the float/clear behavior.',
          englishSolusyon: 'Remove float and utilize standard flex/grid alignment properties.',
          w3cRule: 'W3C CSS Flexible Box Layout Module Level 1 Section 3: Flex Items.',
          autoFixType: 'replace_text',
          fixTarget: floatDecl.raw + ';',
          fixReplacement: ''
        });
      }

      // CONFLICT 5: Box alignment without display: flex or display: grid
      const alignmentDecl = decls.find(d => /^(justify-content|align-items|align-content|justify-items|flex-direction|flex-wrap)$/i.test(d.prop));
      if (alignmentDecl && !isFlexOrGrid) {
        issues.push({
          severity: 'warning',
          category: 'css',
          line: alignmentDecl.line,
          title: `Property Conflict: "${alignmentDecl.prop}" Requires "display: flex" or "display: grid"`,
          snippet: `${alignmentDecl.prop}: ${alignmentDecl.val};`,
          badCode: `${alignmentDecl.prop}: ${alignmentDecl.val};`,
          goodCode: `display: flex;\n${alignmentDecl.prop}: ${alignmentDecl.val};`,
          taglishBakit: `Inilagay mo ang "${alignmentDecl.prop}" nang walang "display: flex" o "display: grid".`,
          taglishDahilan: 'Ang mga alignment properties na ito ay gumagana lamang sa loob ng flexbox o grid formatting contexts.',
          taglishEpekto: 'Walang magiging epekto sa posisyon ng mga anak na elemento sa normal block flow.',
          taglishSolusyon: 'Magdagdag ng "display: flex;" o "display: grid;" sa selector.',
          englishBakit: `The alignment property "${alignmentDecl.prop}" is declared without display: flex or display: grid.`,
          englishDahilan: 'Box alignment properties only activate inside flexbox or CSS grid formatting contexts.',
          englishEpekto: 'The alignment declaration is completely inert in normal block flow.',
          englishSolusyon: 'Add "display: flex;" or "display: grid;" to the rule block.',
          w3cRule: 'W3C CSS Box Alignment Module Level 3: Scope of alignment properties.'
        });
      }
    }

    // 3. Line by Line Parsing & Rule Analysis
    let inBlock = false;
    let currentSelector = '';
    let currentSelectorLine = baseLineOffset;
    let currentDeclarations = [];
    const definedVariables = new Set();
    const variableUsages = [];
    const declaredKeyframes = new Map();
    const animationReferences = [];
    let hasFocusVisibleRule = false;
    const focusOutlineRemovals = [];
    const parsedStyleRules = [];

    for (let idx = 0; idx < cssLines.length; idx++) {
      const rawLine = cssLines[idx];
      const lineNum = baseLineOffset + idx;
      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      // Check illegal single-line // comments
      if (/^\s*\/\//.test(rawLine) || (/\/\//.test(rawLine) && !/https?:\/\//.test(rawLine) && !/\/\*/.test(rawLine))) {
        issues.push({
          severity: 'error',
          category: 'css',
          line: lineNum,
          title: 'Illegal Single-Line (//) Comment in CSS',
          snippet: trimmed,
          badCode: trimmed,
          goodCode: rawLine.replace(/\/\/(.*)$/, '/* $1 */').trim(),
          taglishBakit: 'Gumamit ka ng double-slash ("//") comment sa loob ng standard CSS.',
          taglishDahilan: 'Hindi sinusuportahan ng standard CSS parser ang single-line double-slash comments (pang-JavaScript o SCSS lamang ito).',
          taglishEpekto: 'Ituturing ng browser na syntax error ang linya at maaaring balewalain ang mga kasunod na CSS style declarations.',
          taglishSolusyon: 'Palitan ang "//" ng standard CSS comment syntax na "/* comment */".',
          englishBakit: 'You used a single-line double slash ("//") comment inside standard CSS.',
          englishDahilan: 'Standard CSS parsers do not support "//" comments; they are only valid in JavaScript or preprocessors like SCSS.',
          englishEpekto: 'The CSS engine encounters a syntax error and may discard subsequent style rules.',
          englishSolusyon: 'Replace "//" with standard CSS block comment syntax: /* comment */.',
          w3cRule: 'W3C CSS Syntax Level 3 Section 4.1: Comments must start with "/*" and end with "*/".',
          autoFixType: 'fix_css_comment'
        });
      }

      // Check @media query missing parentheses
      if (/^\s*@media\b/i.test(trimmed)) {
        const mediaHeader = trimmed.replace(/^\s*@media\s*/i, '').replace(/\{.*$/, '').trim();
        if (/\band\s+(?:min|max)-[a-z]+:\s*[^()]+(?!\))/i.test(mediaHeader) && !/\([^)]+\)/.test(mediaHeader)) {
          issues.push({
            severity: 'error',
            category: 'css',
            line: lineNum,
            title: 'Malformed @media query: Missing parentheses around media feature',
            snippet: trimmed,
            badCode: trimmed,
            goodCode: trimmed.replace(/(and\s+)([a-zA-Z-]+:\s*[^;{\s]+)/, '$1($2)'),
            taglishBakit: 'Kulang ng panaklong (parentheses) ang media feature sa @media query.',
            taglishDahilan: 'Ang W3C Media Queries syntax ay nag-aatas ng parentheses sa bawat feature tulad ng (min-width: 768px).',
            taglishEpekto: 'Babalewalain ng browser ang buong @media query block.',
            taglishSolusyon: 'Lagyan ng panaklong ang feature: halimbawa (min-width: 768px).',
            englishBakit: 'Media features in @media queries must be enclosed in parentheses.',
            englishDahilan: 'W3C Media Queries specification mandates parentheses around feature expressions.',
            englishEpekto: 'The entire media block is rejected as invalid by browsers.',
            englishSolusyon: 'Wrap the feature in parentheses: e.g. (min-width: 768px).',
            w3cRule: 'W3C Media Queries Level 4 Section 3: Syntax.'
          });
        }
      }

      // Check Selector Line
      const hasOpenBrace = trimmed.includes('{');
      const hasCloseBrace = trimmed.includes('}');

      if (hasOpenBrace) {
        inBlock = true;
        const selPart = trimmed.slice(0, trimmed.indexOf('{')).trim();
        currentSelector = selPart;
        currentSelectorLine = lineNum;
        currentDeclarations = [];

        if (selPart) {
          // Space before pseudo-class bug: e.g. a :hover vs a:hover
          const spacePseudoMatch = selPart.match(/([a-zA-Z0-9_\-\.#]+)\s+:(hover|active|focus|focus-visible|visited|disabled|checked|first-child|last-child)\b/);
          if (spacePseudoMatch) {
            const badSel = spacePseudoMatch[0];
            const fixedSel = badSel.replace(/\s+:/, ':');
            issues.push({
              severity: 'warning',
              category: 'css',
              line: lineNum,
              title: `Unintended Descendant Selector Bug: "${badSel}"`,
              snippet: selPart,
              badCode: selPart,
              goodCode: selPart.replace(badSel, fixedSel),
              taglishBakit: `May espasyo sa pagitan ng element at pseudo-class sa "${badSel}".`,
              taglishDahilan: 'Ang espasyo sa CSS selector ay nangangahulugang descendant combinator (naghahanap ng anak na may pseudo-class sa halip na ang mismong element).',
              taglishEpekto: 'Hindi magti-trigger ang hover o focus state kapag tinapatan ang mismong element.',
              taglishSolusyon: `Alisin ang espasyo upang maging "${fixedSel}".`,
              englishBakit: `Whitespace before pseudo-class in "${badSel}" creates an unintended descendant selector.`,
              englishDahilan: 'Whitespace functions as a descendant combinator in CSS, targeting child nodes instead of the element itself.',
              englishEpekto: 'Hover, focus, or active states fail to trigger on the intended element.',
              englishSolusyon: `Remove the space before the colon to make "${fixedSel}".`,
              w3cRule: 'W3C CSS Selectors Level 4 Section 3.1: Descendant Combinator vs Pseudo-classes.',
              autoFixType: 'replace_text',
              fixTarget: badSel,
              fixReplacement: fixedSel
            });
          }

          // Gap 3: Cross-Scope Case-Sensitivity Sync (.Button vs class="button")
          if (htmlContext && htmlContext.htmlClasses && !selPart.startsWith('@')) {
            const classInSel = selPart.match(/\.([a-zA-Z0-9_\-]+)/g);
            if (classInSel) {
              classInSel.forEach(cls => {
                const cleanCls = cls.slice(1);
                const lowerCls = cleanCls.toLowerCase();
                if (htmlContext.htmlClasses.has(lowerCls)) {
                  const htmlOriginal = htmlContext.htmlClasses.get(lowerCls);
                  if (htmlOriginal !== cleanCls) {
                    issues.push({
                      severity: 'warning',
                      category: 'css',
                      line: lineNum,
                      title: `Case-Sensitivity Mismatch on Class ".${cleanCls}" (HTML uses "${htmlOriginal}")`,
                      snippet: selPart,
                      badCode: `.${cleanCls} { ... }`,
                      goodCode: `.${htmlOriginal} { ... }`,
                      taglishBakit: `Magkaiba ang capitalization ng class sa CSS (.${cleanCls}) at sa HTML (class="${htmlOriginal}").`,
                      taglishDahilan: 'Kahit case-insensitive ang HTML tags, ang class names at IDs ay STRICTLY CASE-SENSITIVE sa parehong HTML at CSS.',
                      taglishEpekto: `HINDI gagana ang styles para sa class na ito dahil ituturing ng browser na magkaibang pangalan ang ".${cleanCls}" at "${htmlOriginal}".`,
                      taglishSolusyon: `I-match ang capitalization: gawing ".${htmlOriginal}" sa CSS.`,
                      englishBakit: `Case-sensitivity mismatch between CSS class ".${cleanCls}" and HTML class="${htmlOriginal}".`,
                      englishDahilan: 'While HTML tags are case-insensitive, class names and IDs are strictly case-sensitive in both HTML and CSS.',
                      englishEpekto: `Styles defined in .${cleanCls} will NOT apply to class="${htmlOriginal}" elements.`,
                      englishSolusyon: `Align the casing between CSS and HTML (e.g. update CSS to ".${htmlOriginal}").`,
                      w3cRule: 'W3C HTML5 & CSS Selectors Level 4: Case Sensitivity of Class and ID Selectors.',
                      autoFixType: 'replace_text',
                      fixTarget: '.' + cleanCls,
                      fixReplacement: '.' + htmlOriginal
                    });
                  }
                } else if (!cleanCls.startsWith('has-') && !cleanCls.startsWith('is-') && !cleanCls.startsWith('active')) {
                  unreferencedSelectors.push('.' + cleanCls);
                }
              });
            }

            const idInSel = selPart.match(/#([a-zA-Z0-9_\-]+)/g);
            if (idInSel) {
              idInSel.forEach(idSel => {
                const cleanId = idSel.slice(1);
                const lowerId = cleanId.toLowerCase();
                if (htmlContext.htmlIds && htmlContext.htmlIds.has(lowerId)) {
                  const htmlOriginal = htmlContext.htmlIds.get(lowerId);
                  if (htmlOriginal !== cleanId) {
                    issues.push({
                      severity: 'warning',
                      category: 'css',
                      line: lineNum,
                      title: `Case-Sensitivity Mismatch on ID "#${cleanId}" (HTML uses id="${htmlOriginal}")`,
                      snippet: selPart,
                      badCode: `#${cleanId} { ... }`,
                      goodCode: `#${htmlOriginal} { ... }`,
                      taglishBakit: `Magkaiba ang capitalization ng ID sa CSS (#${cleanId}) at sa HTML (id="${htmlOriginal}").`,
                      taglishDahilan: 'Ang element IDs ay strictly case-sensitive sa CSS at HTML.',
                      taglishEpekto: `Hindi maipapatupad ang styles dahil hindi magtutugma ang "#${cleanId}" sa id="${htmlOriginal}".`,
                      taglishSolusyon: `I-match ang capitalization: gawing "#${htmlOriginal}" sa CSS.`,
                      englishBakit: `Case-sensitivity mismatch between CSS ID "#${cleanId}" and HTML id="${htmlOriginal}".`,
                      englishDahilan: 'Element IDs are strictly case-sensitive across HTML and CSS.',
                      englishEpekto: `Styles defined in #${cleanId} will fail to match id="${htmlOriginal}".`,
                      englishSolusyon: `Align the casing to "#${htmlOriginal}".`,
                      w3cRule: 'W3C CSS Selectors Level 4: ID Selectors Case Sensitivity.',
                      autoFixType: 'replace_text',
                      fixTarget: '#' + cleanId,
                      fixReplacement: '#' + htmlOriginal
                    });
                  }
                } else {
                  unreferencedSelectors.push('#' + cleanId);
                }
              });
            }
          }

          if (/:focus-visible\b/i.test(selPart)) {
            hasFocusVisibleRule = true;
          }

          if (/^\s*@keyframes\b/i.test(selPart)) {
            const kfName = selPart.replace(/^\s*@keyframes\s+/i, '').trim();
            if (kfName) declaredKeyframes.set(kfName, lineNum);
          }

          // Deprecated single-colon pseudo-elements: :before -> ::before
          const singleColonPseudo = selPart.match(/(?<!:):(before|after|first-line|first-letter)\b/);
          if (singleColonPseudo) {
            const legacy = singleColonPseudo[0];
            const modern = ':' + legacy;
            issues.push({
              severity: 'suggestion',
              category: 'css',
              line: lineNum,
              title: `Deprecated Single-Colon Pseudo-Element: "${legacy}"`,
              snippet: selPart,
              badCode: selPart,
              goodCode: selPart.replace(legacy, modern),
              taglishBakit: `Gumamit ka ng lumang single-colon syntax "${legacy}" para sa pseudo-element.`,
              taglishDahilan: 'Sa modernong W3C CSS standard, ang double colon (::) ang opisyal na nagpapakilala ng pseudo-elements.',
              taglishEpekto: 'Gumagana pa ito para sa backward compatibility ngunit itinuturing na deprecated standard.',
              taglishSolusyon: `Palitan ng modernong "${modern}".`,
              englishBakit: `The single-colon pseudo-element syntax "${legacy}" is deprecated in modern CSS specifications.`,
              englishDahilan: 'CSS3 introduces the double-colon syntax (::) to distinguish pseudo-elements from pseudo-classes.',
              englishEpekto: 'Supported for legacy backwards compatibility, but non-conforming to modern CSS3/4 guidelines.',
              englishSolusyon: `Update "${legacy}" to the modern double-colon syntax "${modern}".`,
              w3cRule: 'W3C CSS Selectors Level 3 & 4 Section 7: Pseudo-elements Syntax (::).',
              autoFixType: 'replace_text',
              fixTarget: legacy,
              fixReplacement: modern
            });
          }

          // Redundant tag on ID: e.g. div#header
          const tagIdMatch = selPart.match(/\b([a-zA-Z0-9]+)#([a-zA-Z0-9_\-]+)\b/);
          if (tagIdMatch && !selPart.includes(':')) {
            issues.push({
              severity: 'suggestion',
              category: 'css',
              line: lineNum,
              title: `Redundant Element Tag on ID: "${tagIdMatch[0]}"`,
              snippet: selPart,
              badCode: tagIdMatch[0],
              goodCode: `#${tagIdMatch[2]}`,
              taglishBakit: `Inilagay ang tag name na "${tagIdMatch[1]}" bago ang ID selector na "#${tagIdMatch[2]}".`,
              taglishDahilan: 'Dahil ang bawat ID ay unique sa buong dokumento, hindi na kailangan pang unlapan ng tag name.',
              taglishEpekto: 'Nagpapataas ng specificity nang walang dagdag na pakinabang.',
              taglishSolusyon: `Gamitin na lamang ang "#${tagIdMatch[2]}".`,
              englishBakit: `The element tag "${tagIdMatch[1]}" is redundantly prefixed to the ID selector "#${tagIdMatch[2]}".`,
              englishDahilan: 'Since IDs are required to be unique per document, tag qualifications add unnecessary specificity.',
              englishEpekto: 'Inflates selector specificity without functional benefit.',
              englishSolusyon: `Simplify to "#${tagIdMatch[2]}".`,
              w3cRule: 'W3C CSS Selectors Level 4: Maintainable Specificity.'
            });
          }

          // Semicolon used as selector separator: .header; .nav
          if (selPart.includes(';')) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: 'Invalid Semicolon (;) in Selector List',
              snippet: selPart,
              badCode: selPart,
              goodCode: selPart.replace(/;/g, ','),
              taglishBakit: 'Gumamit ka ng semicolon (;) bilang pampaghiwalay ng mga selector.',
              taglishDahilan: 'Sa CSS, kuwit (comma ",") lamang ang pinapayagang maghiwalay ng mga selectors sa isang listahan.',
              taglishEpekto: 'Masisira ang buong rule set at hindi maipapatupad ang styles.',
              taglishSolusyon: 'Palitan ng kuwit (",") ang semicolon.',
              englishBakit: 'A semicolon (;) was used inside a selector list.',
              englishDahilan: 'CSS selectors must be grouped and separated using commas (,), not semicolons.',
              englishEpekto: 'Causes parser failure and drops the entire rule set.',
              englishSolusyon: 'Replace semicolon with a comma (,).',
              w3cRule: 'W3C CSS Selectors Level 4: Selector Lists.'
            });
          }

          // High Specificity Warning
          const idMatches = (selPart.match(/#[a-zA-Z0-9_\-]+/g) || []).length;
          const classMatches = (selPart.match(/\.[a-zA-Z0-9_\-]+/g) || []).length;
          if (idMatches >= 2 || classMatches >= 4) {
            issues.push({
              severity: 'warning',
              category: 'css',
              line: lineNum,
              title: `High Selector Specificity (${idMatches} IDs, ${classMatches} Classes)`,
              snippet: selPart,
              badCode: selPart,
              goodCode: `/* Refactor to simpler, modular class name */`,
              taglishBakit: `Masyadong mataas ang specificity ng selector na "${selPart}".`,
              taglishDahilan: 'Ang labis na pagpapatong ng IDs at classes ay nagdudulot ng specificity war na mahirap i-override.',
              taglishEpekto: 'Pinahihirapan ang responsive design at style refactoring.',
              taglishSolusyon: 'Gamitin ang iisang malinaw na BEM o component class sa halip na mahabang chain.',
              englishBakit: `The selector "${selPart}" has excessively high specificity.`,
              englishDahilan: 'Chaining multiple IDs and classes creates specificity traps that make future overrides difficult.',
              englishEpekto: 'Hinders modular maintainability and responsive design adaptations.',
              englishSolusyon: 'Refactor into a direct, single component class name.',
              w3cRule: 'W3C CSS Cascading and Inheritance Level 4: Specificity calculations.'
            });
          }
        }
      }

      // Check for Declarations inside block
      let declContent = rawLine;
      if (declContent.includes('{')) declContent = declContent.slice(declContent.indexOf('{') + 1);
      if (declContent.includes('}')) declContent = declContent.slice(0, declContent.indexOf('}'));
      const cleanDecl = declContent.trim();

      if (inBlock && cleanDecl && !cleanDecl.startsWith('/*') && !cleanDecl.startsWith('@')) {
        // Immediate Semicolon Check
        if (cleanDecl.includes(':') && !declContent.trim().endsWith(';')) {
          issues.push({
            severity: 'error',
            category: 'css',
            line: lineNum,
            title: 'Missing Semicolon (;) in CSS Declaration',
            snippet: cleanDecl,
            badCode: cleanDecl,
            goodCode: cleanDecl + ';',
            taglishBakit: 'Walang semicolon (;) sa dulo ng CSS property declaration.',
            taglishDahilan: 'Kailangan ang semicolon bilang pormal na tagapaghiwalay (separator) ng bawat property sa CSS.',
            taglishEpekto: 'Hindi mababasa ng browser ang mga kasunod na properties sa loob ng parehong rule block dahil magsasama ang mga ito.',
            taglishSolusyon: 'Maglagay ng semicolon (;) sa pinakadulo ng linya.',
            englishBakit: 'The CSS property declaration is missing a terminating semicolon (;).',
            englishDahilan: 'CSS syntax requires semicolons to separate individual property declarations within a rule block.',
            englishEpekto: 'The CSS parser merges this declaration with the next one, causing both rules to fail to parse.',
            englishSolusyon: 'Add a semicolon (;) to the end of the declaration line.',
            w3cRule: 'W3C CSS Syntax Specification Section 4: Declaration Delimiters.',
            autoFixType: 'add_semicolon'
          });
        }

        // Check overuse of !important
        if (/!important/i.test(cleanDecl)) {
          issues.push({
            severity: 'suggestion',
            category: 'css',
            line: lineNum,
            title: 'Suggestion: Avoid !important in Standard Rules',
            snippet: cleanDecl,
            badCode: cleanDecl,
            goodCode: cleanDecl.replace(/\s*!important/gi, '').trim(),
            taglishBakit: 'Gumamit ka ng "!important" rule sa CSS declaration na ito.',
            taglishDahilan: 'Sinisira ng !important ang natural na CSS cascade, specificity hierarchy, at inheritance.',
            taglishEpekto: 'Nagiging mahirap i-override at i-maintain ang mga styles sa paglaki ng application.',
            taglishSolusyon: 'Gumamit ng mas angkop na CSS selector specificity sa halip na gumamit ng !important.',
            englishBakit: 'The "!important" directive is applied to this CSS declaration.',
            englishDahilan: 'Using !important disrupts the natural CSS cascade order and selector specificity hierarchy.',
            englishEpekto: 'Creates maintainability barriers and makes future overrides arduous.',
            englishSolusyon: 'Refactor using clean selector specificity instead of forcing priority.',
            w3cRule: 'W3C CSS Cascading and Inheritance Level 4: Maintainable Specificity.'
          });
        }

        // Check double colon (::) in property declaration (e.g. color:: red;)
        if (/^[a-zA-Z\-]+\s*::\s*[^;]+/.test(cleanDecl)) {
          issues.push({
            severity: 'error',
            category: 'css',
            line: lineNum,
            title: 'Invalid Double Colon (::) in CSS Declaration',
            snippet: cleanDecl,
            badCode: cleanDecl,
            goodCode: cleanDecl.replace('::', ':'),
            taglishBakit: 'Gumamit ka ng double colon ("::") sa loob ng CSS declaration.',
            taglishDahilan: 'Sa CSS, ang double colon (::) ay para lamang sa pseudo-elements (tulad ng ::before at ::after). Single colon (:) lamang ang naghihiwalay sa property at value.',
            taglishEpekto: 'Syntax error ito kaya ibabasura ng browser ang buong declaration.',
            taglishSolusyon: 'Palitan ng single colon (:) ang double colon (::).',
            englishBakit: 'A double colon (::) was used in a CSS property declaration.',
            englishDahilan: 'Double colons are reserved for pseudo-elements (like ::before). Property declarations must use a single colon (:).',
            englishEpekto: 'Syntax parsing failure causes browsers to reject this style declaration.',
            englishSolusyon: 'Replace "::" with a single ":" colon.',
            w3cRule: 'W3C CSS Syntax Level 3 Section 4: Declaration Delimiters.',
            autoFixType: 'replace_text',
            fixTarget: '::',
            fixReplacement: ':'
          });
        }

        // Check missing colon: property without colon
        if (!cleanDecl.includes(':') && /^[a-zA-Z\-]+\s+[a-zA-Z0-9#\-\s%]+;?$/.test(cleanDecl)) {
          issues.push({
            severity: 'error',
            category: 'css',
            line: lineNum,
            title: 'Missing Colon (:) in CSS Declaration',
            snippet: cleanDecl,
            badCode: cleanDecl,
            goodCode: cleanDecl.replace(/^([a-zA-Z\-]+)\s+/, '$1: '),
            taglishBakit: 'Walang colon (:) sa pagitan ng property name at property value.',
            taglishDahilan: 'Sa CSS syntax, ang colon ":" ang naghihiwalay sa pangalan ng property at sa value nito.',
            taglishEpekto: 'Ituturing itong syntax error ng browser at babalewalain ang buong linya.',
            taglishSolusyon: 'Maglagay ng colon (:) pagkatapos ng property name.',
            englishBakit: 'A colon (:) is missing between the property identifier and its value.',
            englishDahilan: 'Standard CSS syntax requires a colon to separate declaration property and value.',
            englishEpekto: 'Syntax parsing failure causes the browser to reject the declaration.',
            englishSolusyon: 'Insert a colon (:) after the property name.',
            w3cRule: 'W3C CSS Syntax Level 3 Section 4: Declaration Syntax.'
          });
        }

        const rawParts = cleanDecl.split(';');
        const declParts = [];
        rawParts.forEach((rp) => {
          let segment = rp.trim();
          if (!segment) return;
          const subMatches = Array.from(segment.matchAll(/(?:^|\s+)([a-zA-Z\-]+)\s*:/g));
          if (subMatches.length > 1) {
            for (let sm = 0; sm < subMatches.length; sm++) {
              const matchStart = subMatches[sm].index + (subMatches[sm][0].startsWith(' ') ? 1 : 0);
              const nextStart = sm + 1 < subMatches.length ? subMatches[sm + 1].index : segment.length;
              const subPart = segment.slice(matchStart, nextStart).trim();
              declParts.push(subPart);
              if (sm < subMatches.length - 1) {
                issues.push({
                  severity: 'error',
                  category: 'css',
                  line: lineNum,
                  title: 'Missing Semicolon (;) Between CSS Declarations',
                  snippet: subPart,
                  badCode: subPart,
                  goodCode: subPart + ';',
                  taglishBakit: 'Walang semicolon (;) sa pagitan ng dalawang CSS declarations sa iisang linya.',
                  taglishDahilan: 'Kinakailangan ang semicolon upang paghiwalayin ang bawat magkakasunod na deklarasyon.',
                  taglishEpekto: 'Pagsasamahin ng CSS parser ang dalawang property at hindi ito gagana.',
                  taglishSolusyon: 'Maglagay ng semicolon (;) sa pagitan ng mga deklarasyon.',
                  englishBakit: 'Missing semicolon delimiter between multiple declarations on the same line.',
                  englishDahilan: 'CSS declarations must be separated with semicolons when chained together.',
                  englishEpekto: 'Causes parser delimiter failure and drops both declarations.',
                  englishSolusyon: 'Separate declarations with a semicolon (;).',
                  w3cRule: 'W3C CSS Syntax Level 3 Section 4: Delimiters.'
                });
              }
            }
          } else {
            declParts.push(segment);
          }
        });

        declParts.forEach((part) => {
          const partTrimmed = part.trim();
          if (!partTrimmed || partTrimmed.startsWith('/*')) return;
          if (!partTrimmed.includes(':')) return;

          const colonIdx = partTrimmed.indexOf(':');
          const rawProp = partTrimmed.slice(0, colonIdx).trim().toLowerCase();
          const rawVal = partTrimmed.slice(colonIdx + 1).trim();

          if (!rawProp || rawProp.startsWith('/*')) return;

          currentDeclarations.push({
            prop: rawProp,
            val: rawVal,
            raw: partTrimmed,
            line: lineNum,
            isImportant: /!important/i.test(rawVal)
          });

          if (rawProp.startsWith('--')) {
            definedVariables.add(rawProp);
          }
          const varMatches = rawVal.match(/var\(\s*(--[a-zA-Z0-9_\-]+)\s*\)/g);
          if (varMatches) {
            varMatches.forEach(v => {
              const m = v.match(/--[a-zA-Z0-9_\-]+/);
              if (m) variableUsages.push({ name: m[0], line: lineNum, raw: partTrimmed });
            });
          }

          // 1. Missing Value / Hanging colon
          if (!rawVal || rawVal === ';') {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Missing Value for Property "${rawProp}"`,
              snippet: partTrimmed,
              badCode: `${rawProp}: ;`,
              goodCode: `${rawProp}: inherit;`,
              taglishBakit: `Walang inilagay na value para sa property na "${rawProp}".`,
              taglishDahilan: 'Ang bawat CSS declaration ay kailangang may valid na value pagkatapos ng colon.',
              taglishEpekto: 'Syntax error; babalewalain ng browser ang declaration.',
              taglishSolusyon: `Maglagay ng angkop na value para sa "${rawProp}".`,
              englishBakit: `No value specified for CSS property "${rawProp}".`,
              englishDahilan: 'CSS declarations require a non-empty value following the colon separator.',
              englishEpekto: 'Rejected by parser as incomplete declaration syntax.',
              englishSolusyon: `Supply a valid value for property "${rawProp}".`,
              w3cRule: 'W3C CSS Syntax Level 3 Section 4.3.'
            });
            return;
          }

          // 2. Property Typo Check
          if (BB.COMMON_CSS_TYPOS[rawProp]) {
            const correctProp = BB.COMMON_CSS_TYPOS[rawProp];
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Misspelled CSS Property: "${rawProp}"`,
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: `${correctProp}: ${rawVal};`,
              taglishBakit: `Mali ang spelling ng CSS property name na "${rawProp}".`,
              taglishDahilan: 'Hindi kinikilala ng standard CSS engine ang mga maling baybay na property names.',
              taglishEpekto: 'Hindi gagana o ganap na babalewalain ng browser ang style rule na ito.',
              taglishSolusyon: `Palitan ang maling spelling at gawing "${correctProp}: ${rawVal};".`,
              englishBakit: `The CSS property name "${rawProp}" is misspelled.`,
              englishDahilan: 'Web browsers only recognize official W3C standardized property names.',
              englishEpekto: 'The browser discards this declaration, causing styles to fail silently.',
              englishSolusyon: `Fix the property spelling to "${correctProp}".`,
              w3cRule: 'W3C CSS Cascading Style Sheets Specification: Valid Property Identifiers.',
              autoFixType: 'replace_text',
              fixTarget: rawProp,
              fixReplacement: correctProp
            });
          } else if (!BB.STANDARD_CSS_PROPERTIES.has(rawProp) && !rawProp.startsWith('--') && !rawProp.startsWith('-webkit-') && !rawProp.startsWith('-moz-') && !rawProp.startsWith('-ms-')) {
            const closestProp = BB.findClosestWord(rawProp, Array.from(BB.STANDARD_CSS_PROPERTIES));
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Unknown / Invalid CSS Property: "${rawProp}"`,
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: closestProp ? `${closestProp}: ${rawVal};` : `/* Remove invalid property "${rawProp}" */`,
              taglishBakit: `Hindi opisyal na W3C standard CSS property ang "${rawProp}".`,
              taglishDahilan: closestProp 
                ? `Maaaring typo ito para sa "${closestProp}". Lahat ng CSS property names ay kailangang valid W3C identifiers.`
                : 'Lahat ng CSS property names ay kailangang opisyal na kinikilala ng W3C standard.',
              taglishEpekto: 'Ituturing itong syntax error ng browser kaya hindi lilitaw o babalewalain ang style declaration na ito.',
              taglishSolusyon: closestProp ? `Palitan ang "${rawProp}" ng "${closestProp}".` : `Iwasto ang property name sa standard W3C CSS property.`,
              englishBakit: `The property "${rawProp}" is not a recognized W3C CSS property.`,
              englishDahilan: closestProp 
                ? `Likely an incomplete or misspelled property string for "${closestProp}". CSS engines require standard W3C identifiers.`
                : 'CSS layout engines reject unrecognized property names as syntax errors.',
              englishEpekto: 'Browsers discard the declaration, causing styles to fail silently.',
              englishSolusyon: closestProp ? `Change "${rawProp}" to "${closestProp}".` : `Replace with a valid W3C property identifier.`,
              w3cRule: 'W3C CSS Cascading Style Sheets Specification: Valid Property Identifiers.',
              autoFixType: closestProp ? 'replace_text' : null,
              fixTarget: rawProp,
              fixReplacement: closestProp || ''
            });
          }

          // Value Dictionary Validation
          const cleanValKeyword = rawVal.replace(/\s*!important/i, '').trim().toLowerCase();
          if (
            BB.STANDARD_PROPERTY_KEYWORDS[rawProp] &&
            !cleanValKeyword.startsWith('var(') &&
            !cleanValKeyword.startsWith('env(') &&
            !cleanValKeyword.startsWith('attr(')
          ) {
            if (!BB.STANDARD_PROPERTY_KEYWORDS[rawProp].has(cleanValKeyword)) {
              const closestKeyword = BB.findClosestWord(cleanValKeyword, Array.from(BB.STANDARD_PROPERTY_KEYWORDS[rawProp]));
              issues.push({
                severity: 'error',
                category: 'css',
                line: lineNum,
                title: `Invalid Value "${rawVal}" for Property "${rawProp}"`,
                snippet: partTrimmed,
                badCode: `${rawProp}: ${rawVal};`,
                goodCode: closestKeyword ? `${rawProp}: ${closestKeyword};` : `${rawProp}: inherit;`,
                taglishBakit: `Hindi valid na value ang "${rawVal}" para sa CSS property na "${rawProp}".`,
                taglishDahilan: closestKeyword 
                  ? `Maaaring typo o kulang na spelling ito para sa standard keyword na "${closestKeyword}".`
                  : `Ang property na "${rawProp}" ay tumatanggap lamang ng mga opisyal na W3C keyword values.`,
                taglishEpekto: 'Syntax error ito ayon sa W3C; babalewalain ng browser ang value kaya hindi gagana ang layout.',
                taglishSolusyon: closestKeyword 
                  ? `Palitan ang "${rawVal}" ng tamang keyword na "${closestKeyword}".` 
                  : `Pumili ng valid na W3C keyword value para sa "${rawProp}".`,
                englishBakit: `The value "${rawVal}" is not recognized for CSS property "${rawProp}".`,
                englishDahilan: closestKeyword 
                  ? `Likely an incomplete or misspelled keyword for "${closestKeyword}".`
                  : `The "${rawProp}" property strictly expects official W3C keyword values.`,
                englishEpekto: 'The CSS parser rejects the invalid value and discards the declaration.',
                englishSolusyon: closestKeyword 
                  ? `Change "${rawVal}" to "${closestKeyword}".` 
                  : `Provide a valid W3C keyword for "${rawProp}".`,
                w3cRule: `W3C CSS Specification: Valid values for ${rawProp}.`,
                autoFixType: closestKeyword ? 'replace_text' : null,
                fixTarget: rawVal,
                fixReplacement: closestKeyword || ''
              });
            }
          }

          // Strict Unit Matching on Numeric Values
          const unitMatches = Array.from(rawVal.matchAll(/(?:^|[\s,(])([+-]?\d+(?:\.\d+)?)([a-zA-Z%]+)(?=[\s,);]|$)/g));
          for (const um of unitMatches) {
            const numStr = um[1];
            const unitStr = um[2].toLowerCase();
            if (!BB.VALID_CSS_UNITS.has(unitStr) && !['n', 'even', 'odd'].includes(unitStr)) {
              issues.push({
                severity: 'error',
                category: 'css',
                line: lineNum,
                title: `Invalid Measurement Unit: "${unitStr}" in "${um[0].trim()}"`,
                snippet: partTrimmed,
                badCode: `${rawProp}: ${rawVal};`,
                goodCode: `${rawProp}: ${rawVal.replace(new RegExp(`\\b${numStr}${unitStr}\\b`), numStr + 'px')};`,
                taglishBakit: `Hindi kinikilala sa W3C standards ang measurement unit na "${unitStr}" sa "${numStr}${unitStr}".`,
                taglishDahilan: 'Sa standard CSS, tanging ang mga opisyal na units tulad ng px, rem, em, %, vh, vw, deg, s ang pinapayagan.',
                taglishEpekto: 'Ituturing itong syntax error ng browser at ibabasura ang buong style declaration.',
                taglishSolusyon: `Palitan ang "${unitStr}" ng valid unit tulad ng "px" o "rem".`,
                englishBakit: `The measurement unit "${unitStr}" in "${numStr}${unitStr}" is not a valid CSS unit.`,
                englishDahilan: 'W3C specifications only permit standardized length, time, or angle units.',
                englishEpekto: 'The browser rejects the declaration as invalid syntax.',
                englishSolusyon: `Replace "${unitStr}" with a standard unit (e.g., "${numStr}px" or "${numStr}rem").`,
                w3cRule: 'W3C CSS Values and Units Level 3: Distance and Angle Units.',
                autoFixType: 'replace_text',
                fixTarget: numStr + unitStr,
                fixReplacement: numStr + 'px'
              });
              break;
            }
          }

          // Missing Length Units on Non-zero numbers
          const isLengthProp = /^(margin|margin-top|margin-right|margin-bottom|margin-left|padding|padding-top|padding-right|padding-bottom|padding-left|width|height|font-size|top|left|right|bottom|min-width|min-height|max-width|max-height|border-radius|border-width|gap|column-gap|row-gap|letter-spacing)$/i.test(rawProp);
          if (isLengthProp && /^[1-9]\d*$/.test(rawVal.replace(/\s*!important/i, '').trim())) {
            const numericVal = rawVal.replace(/\s*!important/i, '').trim();
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Missing Length Unit (px, rem, em, %) on "${rawProp}"`,
              snippet: partTrimmed,
              badCode: `${rawProp}: ${numericVal};`,
              goodCode: `${rawProp}: ${numericVal}px;`,
              taglishBakit: `Walang nakasaad na sukat o unit (tulad ng px, rem, em) ang numerong "${numericVal}" sa property na ito.`,
              taglishDahilan: 'Sa standard CSS, tanging ang numerong 0 lamang ang pinapayagang walang nakalagay na unit.',
              taglishEpekto: 'Ituturing ng browser na invalid ang declaration at hindi ito ipapatupad.',
              taglishSolusyon: `Dugtungan ng unit tulad ng "${numericVal}px;".`,
              englishBakit: `A non-zero numeric length was specified without a measurement unit on "${rawProp}".`,
              englishDahilan: 'In standard CSS, only 0 is permitted without a unit; all other numeric lengths require explicit units.',
              englishEpekto: 'The browser treats this property declaration as invalid and ignores it completely.',
              englishSolusyon: `Append an explicit unit such as "px", "rem", or "%" (e.g. ${numericVal}px;).`,
              w3cRule: 'W3C CSS Values and Units Module Level 3: Non-zero lengths require a valid unit identifier.',
              autoFixType: 'fix_css_unit'
            });
          }

          // Negative values where forbidden
          if (/^(padding|padding-top|padding-right|padding-bottom|padding-left|width|height|min-width|min-height|border-radius|border-width|font-size)\s*:\s*-\d/i.test(partTrimmed)) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Invalid Negative Value for "${rawProp}"`,
              snippet: partTrimmed,
              badCode: partTrimmed,
              goodCode: `${rawProp}: 0;`,
              taglishBakit: `Bawal ang negative value sa CSS property na "${rawProp}".`,
              taglishDahilan: 'Ayon sa W3C specification, ang sukat ng padding, width, height, at radius ay hindi pwedeng maging negatibo.',
              taglishEpekto: 'Ituturing na syntax error ang property at ibabasura ito ng browser.',
              taglishSolusyon: 'Palitan ng positive value o 0 ang sukat.',
              englishBakit: `Negative lengths are not permitted for property "${rawProp}".`,
              englishDahilan: 'Properties governing container dimensions and padding strictly forbid negative values.',
              englishEpekto: 'The CSS engine rejects this declaration as invalid syntax.',
              englishSolusyon: 'Use positive values or 0.',
              w3cRule: 'W3C CSS Values and Units Level 3: Negative lengths.'
            });
          }

          // Units on unitless properties (e.g. z-index: 10px, opacity: 100%)
          if (rawProp === 'z-index' && /[a-zA-Z%]/.test(rawVal)) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: 'Invalid Unit on "z-index" (Must Be an Integer)',
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: `z-index: ${rawVal.replace(/[^0-9\-]/g, '') || '1'};`,
              taglishBakit: 'Naglagay ka ng unit (tulad ng px o %) sa "z-index".',
              taglishDahilan: 'Ang z-index ay dapat purong buong numero (integer) lamang at walang measurement unit.',
              taglishEpekto: 'Hindi kikilalanin ng browser ang stacking layer.',
              taglishSolusyon: `Alisin ang unit (halimbawa: z-index: ${rawVal.replace(/[^0-9\-]/g, '') || '1'};).`,
              englishBakit: 'The "z-index" property contains a unit identifier.',
              englishDahilan: 'Z-index strictly requires a unitless integer value representing stacking priority.',
              englishEpekto: 'Invalid syntax causes the browser to disregard the layer priority.',
              englishSolusyon: `Remove units to make a pure integer (e.g. z-index: ${rawVal.replace(/[^0-9\-]/g, '') || '1'};).`,
              w3cRule: 'W3C CSS Positioned Layout Module Level 3: Integer stacking index.'
            });
          }

          if (rawProp === 'opacity' && (/%/.test(rawVal) || /px/i.test(rawVal))) {
            issues.push({
              severity: 'warning',
              category: 'css',
              line: lineNum,
              title: 'Unit Used on "opacity" (Expected Number 0 to 1)',
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: 'opacity: 1;',
              taglishBakit: 'Gumamit ka ng unit o percentage sa "opacity".',
              taglishDahilan: 'Ang modernong CSS opacity ay tumatanggap ng decimal number mula 0 (transparent) hanggang 1 (opaque).',
              taglishEpekto: 'Maaaring magkamali ang rendering sa ilang mga browser.',
              taglishSolusyon: 'Gumamit ng decimal number tulad ng "opacity: 0.8;" o "opacity: 1;".',
              englishBakit: 'Units or percentages applied to the "opacity" property.',
              englishDahilan: 'Standard CSS opacity expects a unitless decimal number between 0.0 and 1.0.',
              englishEpekto: 'May result in rendering discrepancies across older engines.',
              englishSolusyon: 'Use a decimal number between 0 and 1 (e.g. opacity: 0.8;).',
              w3cRule: 'W3C CSS Color Module Level 4: Opacity values.'
            });
          }

          // Hex Color Validation
          const valNoUrls = rawVal.replace(/url\s*\([^)]*\)/gi, 'url()');
          if (/#([0-9a-zA-Z]+)/.test(valNoUrls)) {
            const hexMatch = valNoUrls.match(/#([0-9a-zA-Z]+)/);
            if (hexMatch) {
              const hexCode = hexMatch[1];
              const isValidHex = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{4}$|^[0-9a-fA-F]{6}$|^[0-9a-fA-F]{8}$/.test(hexCode);
              if (!isValidHex) {
                issues.push({
                  severity: 'error',
                  category: 'css',
                  line: lineNum,
                  title: `Invalid Hex Color Code: "#${hexCode}"`,
                  snippet: partTrimmed,
                  badCode: `#${hexCode}`,
                  goodCode: '#38bdf8',
                  taglishBakit: `Ang hex color code na "#${hexCode}" ay may maling haba o naglalaman ng mga invalid na character.`,
                  taglishDahilan: 'Ang valid na hex color ay dapat binubuo ng 3, 4, 6, o 8 hexadecimal characters lamang (0 hanggang 9 at A hanggang F).',
                  taglishEpekto: 'Hindi maipapakita ng browser ang kulay at magiging default o transparent ang elemento.',
                  taglishSolusyon: 'Palitan ito ng valid na hexadecimal color format tulad ng "#38bdf8" o "#ffffff".',
                  englishBakit: `The hexadecimal color notation "#${hexCode}" contains invalid characters or an incorrect length.`,
                  englishDahilan: 'Valid CSS hex colors must consist of exactly 3, 4, 6, or 8 hexadecimal characters (0–9, a–f).',
                  englishEpekto: 'The browser cannot compute the color value and falls back to transparent or inherited defaults.',
                  englishSolusyon: 'Use a standard hexadecimal color notation such as "#38bdf8" or "#ffffff".',
                  w3cRule: 'W3C CSS Color Module Level 4: Hexadecimal Color Notation.'
                });
              }
            }
          }

          // Missing Generic Font Fallback
          if (rawProp === 'font-family') {
            const hasGeneric = /\b(sans-serif|serif|monospace|cursive|fantasy|system-ui)\b/i.test(rawVal);
            if (!hasGeneric) {
              issues.push({
                severity: 'suggestion',
                category: 'css',
                line: lineNum,
                title: 'Missing Generic Font Family Fallback (e.g. , sans-serif)',
                snippet: partTrimmed,
                badCode: `font-family: ${rawVal};`,
                goodCode: `font-family: ${rawVal}, sans-serif;`,
                taglishBakit: 'Walang generic font family fallback tulad ng "sans-serif", "serif", o "monospace".',
                taglishDahilan: 'Kung wala ang napiling font sa computer o smartphone ng user, gagamit ang browser ng generic fallback.',
                taglishEpekto: 'Maaaring mag-fallback sa hindi akmang font style ang iyong typography.',
                taglishSolusyon: `Magdagdag ng ", sans-serif" o ", serif" sa dulo ng font stack.`,
                englishBakit: 'The font-family declaration does not include a generic font family fallback keyword.',
                englishDahilan: 'When user machines lack specified proprietary fonts, browsers depend on generic family categories for graceful fallback.',
                englishEpekto: 'Typography may degrade unexpectedly to default system serif or unstyled faces.',
                englishSolusyon: 'Append a generic family keyword like ", sans-serif" or ", serif" to the font stack.',
                w3cRule: 'W3C CSS Fonts Module Level 4 Section 5: Generic Font Families.',
                autoFixType: 'fix_font_fallback'
              });
            }
          }

          // Large Fixed Width
          if (rawProp === 'width' && /^[8-9]\d\dpx$|^[1-9]\d{3,}px$/.test(rawVal)) {
            const num = parseInt(rawVal, 10);
            if (num >= 800) {
              issues.push({
                severity: 'warning',
                category: 'css',
                line: lineNum,
                title: `Responsive Risk: Large Fixed Width (${rawVal}) Causes Mobile Overflow`,
                snippet: partTrimmed,
                badCode: `width: ${rawVal};`,
                goodCode: `width: 100%;\nmax-width: ${rawVal};`,
                taglishBakit: `Ang fixed width na "${rawVal}" ay mas malapad kaysa sa karamihan ng mobile phone screens (320px–420px).`,
                taglishDahilan: 'Ang fixed pixel dimensions na lampas 800px ay nagdudulot ng horizontal scrollbar sa mobile browsers.',
                taglishEpekto: 'Nasisira ang mobile responsive usability.',
                taglishSolusyon: `Gumamit ng "width: 100%; max-width: ${rawVal};" o responsive media queries.`,
                englishBakit: `The fixed width of ${rawVal} exceeds standard mobile viewport dimensions (320px–420px).`,
                englishDahilan: 'Hardcoded pixel widths above viewport boundaries cause horizontal scrolling and layout breakage on mobile devices.',
                englishEpekto: 'Fails mobile accessibility and responsiveness criteria.',
                englishSolusyon: `Refactor to "width: 100%; max-width: ${rawVal};" or use viewport-relative units.`,
                w3cRule: 'W3C Mobile Web Best Practices: Designing for Flexible Viewport Widths.'
              });
            }
          }

          // Deprecated Vendor Prefix
          if (rawProp === '-webkit-border-radius' || rawProp === '-moz-border-radius') {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Deprecated Vendor Prefix "${rawProp}" (Use "border-radius")`,
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: `border-radius: ${rawVal};`,
              taglishBakit: `Ang vendor prefix na "${rawProp}" ay deprecated na at hindi na kinakailangan.`,
              taglishDahilan: 'Lahat ng modernong browsers ay sumusuporta na sa standard na "border-radius" property mula pa noong CSS3.',
              taglishEpekto: 'Hindi ito gagana sa modernong Firefox at Chrome nang walang standard declaration.',
              taglishSolusyon: `Palitan ng standard na "border-radius: ${rawVal};".`,
              englishBakit: `Deprecated vendor prefix "${rawProp}" is used instead of standard "border-radius".`,
              englishDahilan: 'Vendor-prefixed border radii have been obsolete since standard CSS3 adoption.',
              englishEpekto: 'Modern browsers will disregard the prefixed declaration.',
              englishSolusyon: `Replace with standard "border-radius: ${rawVal};".`,
              w3cRule: 'W3C CSS Backgrounds and Borders Module Level 3: border-radius.',
              autoFixType: 'replace_text',
              fixTarget: rawProp,
              fixReplacement: 'border-radius'
            });
          }

          // Modern backdrop-filter missing -webkit- prefix
          if (rawProp === 'backdrop-filter') {
            const hasWebkit = cssContent.includes('-webkit-backdrop-filter');
            if (!hasWebkit) {
              issues.push({
                severity: 'warning',
                category: 'css',
                line: lineNum,
                title: 'Cross-Browser: Missing "-webkit-backdrop-filter" for Safari Compatibility',
                snippet: partTrimmed,
                badCode: `backdrop-filter: ${rawVal};`,
                goodCode: `-webkit-backdrop-filter: ${rawVal};\nbackdrop-filter: ${rawVal};`,
                taglishBakit: 'Gumamit ka ng "backdrop-filter" ngunit kulang ng "-webkit-backdrop-filter".',
                taglishDahilan: 'Ang Safari sa iOS at macOS ay nangangailangan pa rin ng "-webkit-" vendor prefix para sa backdrop blur.',
                taglishEpekto: 'Maaaring maging flat o walang blur effect ang element sa mga iPhone at Mac browsers.',
                taglishSolusyon: `Maglagay ng "-webkit-backdrop-filter: ${rawVal};" bago ang standard declaration.`,
                englishBakit: `The "backdrop-filter" property is used without the "-webkit-backdrop-filter" prefix.`,
                englishDahilan: 'WebKit browsers (Safari on iOS and macOS) require the vendor prefix for hardware-accelerated blur effects.',
                englishEpekto: 'Glassmorphism blur effects fail to render on Apple devices.',
                englishSolusyon: `Include "-webkit-backdrop-filter: ${rawVal};" alongside the standard rule.`,
                w3cRule: 'W3C CSS Filter Effects Module Level 2 & WebKit Compatibility.'
              });
            }
          }

          // Modern Font-Weight Validation
          if (rawProp === 'font-weight') {
            const cleanWeight = rawVal.replace(/\s*!important/i, '').trim();
            if (/^[0-9]+(?:\.[0-9]+)?$/.test(cleanWeight)) {
              const wNum = parseFloat(cleanWeight);
              if (wNum < 1 || wNum > 1000) {
                issues.push({
                  severity: 'error',
                  category: 'css',
                  line: lineNum,
                  title: `Invalid Numeric font-weight: "${cleanWeight}" (Allowed range is 1 to 1000)`,
                  snippet: partTrimmed,
                  badCode: `font-weight: ${cleanWeight};`,
                  goodCode: 'font-weight: 400;',
                  taglishBakit: `Ang font-weight na "${cleanWeight}" ay lampas sa pinapayagang range.`,
                  taglishDahilan: 'Sa CSS Fonts Module Level 4, ang numeric weights ay dapat 1 hanggang 1000 lamang.',
                  taglishEpekto: 'Hindi kikilalanin ng browser ang weight na ito.',
                  taglishSolusyon: 'Gumamit ng numero mula 1 hanggang 1000.',
                  englishBakit: `Numeric font-weight "${cleanWeight}" is outside the valid 1-1000 range.`,
                  englishDahilan: 'W3C CSS Fonts Module Level 4 defines numeric weights strictly between 1 and 1000.',
                  englishEpekto: 'The browser discards the property declaration as invalid syntax.',
                  englishSolusyon: 'Use a numeric value between 1 and 1000.',
                  w3cRule: 'W3C CSS Fonts Module Level 4 Section 2.2: Font Weight Values.'
                });
              }
            } else if (/^[0-9]+[a-zA-Z%]+$/.test(cleanWeight)) {
              issues.push({
                severity: 'error',
                category: 'css',
                line: lineNum,
                title: `Invalid Unit on "font-weight: ${cleanWeight}"`,
                snippet: partTrimmed,
                badCode: `font-weight: ${cleanWeight};`,
                goodCode: `font-weight: ${parseFloat(cleanWeight) || 400};`,
                taglishBakit: 'Naglagay ka ng measurement unit (px, %, atbp.) sa font-weight.',
                taglishDahilan: 'Ang font-weight ay unitless number o keyword lamang.',
                taglishEpekto: 'Babalewalain ng browser ang font-weight.',
                taglishSolusyon: 'Alisin ang unit sa numero.',
                englishBakit: `Unit identifier attached to font-weight value "${cleanWeight}".`,
                englishDahilan: 'The font-weight property expects a unitless number or standard keyword.',
                englishEpekto: 'Disregarded as invalid syntax.',
                englishSolusyon: 'Remove the unit identifier.',
                w3cRule: 'W3C CSS Fonts Module Level 4: Font Weight Values.'
              });
            }
          }

          // Invalid Common Values (display: center, float: center, text-align: middle)
          const cleanLower = rawVal.replace(/\s*!important/i, '').trim().toLowerCase();
          if (rawProp === 'display' && (cleanLower === 'center' || cleanLower === 'middle')) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Invalid value "display: ${cleanLower}"`,
              snippet: partTrimmed,
              badCode: `display: ${cleanLower};`,
              goodCode: 'display: flex;\njustify-content: center;',
              taglishBakit: 'Walang "display: center" sa CSS specification.',
              taglishDahilan: 'Para i-center ang nilalaman, gamitin ang "display: flex; justify-content: center;" o margins.',
              taglishEpekto: 'Babalewalain ng browser ang deklarasyon.',
              taglishSolusyon: 'Gumamit ng flexbox o grid para sa centering.',
              englishBakit: 'CSS does not define a "center" keyword for display.',
              englishDahilan: 'Centering in CSS is accomplished via Flexbox/Grid alignment or margins.',
              englishEpekto: 'Treated as syntax error and ignored.',
              englishSolusyon: 'Use "display: flex; justify-content: center;".',
              w3cRule: 'W3C CSS Display Module Level 3.'
            });
          }

          if (rawProp === 'float' && (cleanLower === 'center' || cleanLower === 'middle')) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Invalid value "float: ${cleanLower}"`,
              snippet: partTrimmed,
              badCode: `float: ${cleanLower};`,
              goodCode: 'margin: 0 auto;',
              taglishBakit: 'Walang "float: center" sa CSS.',
              taglishDahilan: 'Ang float ay tumatanggap lamang ng left, right, none, inline-start, inline-end.',
              taglishEpekto: 'Babalewalain ng browser ang float.',
              taglishSolusyon: 'Gamitin ang "margin: 0 auto;" para mag-center.',
              englishBakit: 'Float does not accept "center" or "middle".',
              englishDahilan: 'Float only moves boxes to the left or right edge.',
              englishEpekto: 'Discarded as invalid syntax.',
              englishSolusyon: 'Use "margin: 0 auto;".',
              w3cRule: 'W3C CSS Level 2: Float.'
            });
          }

          if (rawProp === 'text-align' && cleanLower === 'middle') {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: 'Invalid value "text-align: middle"',
              snippet: partTrimmed,
              badCode: 'text-align: middle;',
              goodCode: 'text-align: center;',
              taglishBakit: 'Ang "middle" ay para sa vertical-align, hindi sa text-align.',
              taglishDahilan: 'Gumamit ng "text-align: center" para sa horizontal centering.',
              taglishEpekto: 'Babalewalain ng browser ang text-align.',
              taglishSolusyon: 'Palitan ng "text-align: center;".',
              englishBakit: '"middle" is not a valid text-align keyword.',
              englishDahilan: 'Horizontal centering uses "center"; "middle" is for vertical-align.',
              englishEpekto: 'Ignored by CSS parser.',
              englishSolusyon: 'Use "text-align: center;".',
              w3cRule: 'W3C CSS Text Module Level 3.'
            });
          }

          if (rawProp === 'cursor' && cleanLower === 'hand') {
            issues.push({
              severity: 'warning',
              category: 'css',
              line: lineNum,
              title: 'Obsolete cursor keyword: "cursor: hand"',
              snippet: partTrimmed,
              badCode: 'cursor: hand;',
              goodCode: 'cursor: pointer;',
              taglishBakit: 'Ang "cursor: hand" ay lumang Internet Explorer proprietary keyword.',
              taglishDahilan: 'Ang standard W3C keyword ay "cursor: pointer".',
              taglishEpekto: 'Maaaring hindi gumana sa ilang modernong browsers.',
              taglishSolusyon: 'Palitan ng "cursor: pointer;".',
              englishBakit: '"cursor: hand" is legacy non-standard Internet Explorer syntax.',
              englishDahilan: 'The official standardized CSS keyword is "cursor: pointer".',
              englishEpekto: 'Fails cross-browser compatibility.',
              englishSolusyon: 'Use "cursor: pointer;".',
              w3cRule: 'W3C CSS User Interface Module Level 4: Cursor.'
            });
          }

          // Track Animation Names
          if (rawProp === 'animation-name') {
            rawVal.split(',').forEach(n => {
              const cl = n.trim().replace(/\s*!important/i, '');
              if (cl && cl !== 'none') animationReferences.push({ name: cl, line: lineNum, raw: partTrimmed });
            });
          } else if (rawProp === 'animation') {
            const segs = rawVal.split(',');
            segs.forEach(seg => {
              const parts = seg.trim().split(/\s+/);
              const ign = new Set(['infinite', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'alternate', 'forwards', 'backwards', 'both', 'none', 'running', 'paused', '!important']);
              for (const p of parts) {
                const cp = p.replace(/;$/, '').trim();
                if (!cp || ign.has(cp.toLowerCase()) || /^[0-9]+(?:\.[0-9]+)?(?:s|ms)$/i.test(cp) || /^[0-9]+$/.test(cp)) continue;
                if (/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(cp)) {
                  animationReferences.push({ name: cp, line: lineNum, raw: partTrimmed });
                  break;
                }
              }
            });
          }

          // Track outline: none on focus
          if ((rawProp === 'outline' && (cleanLower === 'none' || cleanLower === '0')) || (rawProp === 'outline-width' && cleanLower === '0')) {
            if (/:focus\b/i.test(currentSelector) && !/:focus-visible\b/i.test(currentSelector)) {
              focusOutlineRemovals.push({ selector: currentSelector, line: lineNum, raw: partTrimmed });
            }
          }

          // Unclosed Function Parentheses
          const openParenCount = (rawVal.match(/\(/g) || []).length;
          const closeParenCount = (rawVal.match(/\)/g) || []).length;
          if (openParenCount > closeParenCount && /\b(calc|var|rgb|rgba|hsl|hsla|min|max|clamp|url)\s*\(/i.test(rawVal)) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: 'Unclosed Function in CSS Declaration (Missing ")")',
              snippet: partTrimmed,
              badCode: `${rawProp}: ${rawVal};`,
              goodCode: `${rawProp}: ${rawVal});`,
              taglishBakit: `May binuksang function tulad ng calc( o var( sa "${rawProp}" na hindi naisara ng ")".`,
              taglishDahilan: 'Lahat ng CSS mathematical at functional notations ay kailangang may kapares na closing parenthesis bago ang semicolon.',
              taglishEpekto: 'Ituturing itong syntax error ng browser kaya hindi gagana ang buong style declaration.',
              taglishSolusyon: 'Maglagay ng closing ")" parenthesis bago ang semicolon.',
              englishBakit: `A CSS functional notation in "${rawProp}" is missing a closing ")" parenthesis.`,
              englishDahilan: 'CSS functions such as calc(), var(), and rgb() require balanced closing parentheses.',
              englishEpekto: 'The browser parser rejects the declaration as incomplete syntax.',
              englishSolusyon: 'Add the missing closing ")" parenthesis.',
              w3cRule: 'W3C CSS Values and Units Level 3: Functional Notations.',
              autoFixType: 'fix_unclosed_paren'
            });
          }

          // W3C calc() Operator Spacing Rule
          if (/\bcalc\s*\([^)]*([0-9a-zA-Z%]+[\+\-][0-9a-zA-Z%]+)[^)]*\)/i.test(rawVal)) {
            const badCalcMatch = rawVal.match(/\bcalc\s*\([^)]*([0-9a-zA-Z%]+[\+\-][0-9a-zA-Z%]+)[^)]*\)/i);
            const goodCalc = badCalcMatch ? badCalcMatch[0].replace(/([0-9a-zA-Z%]+)([\+\-])([0-9a-zA-Z%]+)/g, '$1 $2 $3') : '';
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: 'Missing Whitespace Around Operator in calc() (+ or -)',
              snippet: partTrimmed,
              badCode: badCalcMatch ? badCalcMatch[0] : partTrimmed,
              goodCode: goodCalc || 'calc(100% - 20px)',
              taglishBakit: 'Walang espasyo sa paligid ng "+" o "-" operator sa loob ng calc().',
              taglishDahilan: 'Sa W3C standard, kailangan may space sa magkabilang gilid ng "+" at "-" sa calc() para hindi mapagkamalang sign ng kasunod na unit.',
              taglishEpekto: 'Ituturing itong invalid expression ng browser at hindi mag-kakalkula ang sukat.',
              taglishSolusyon: 'Maglagay ng espasyo sa magkabilang gilid ng operator (halimbawa: calc(100% - 20px)).',
              englishBakit: 'Missing whitespace around "+" or "-" operator inside calc().',
              englishDahilan: 'W3C CSS Values and Units specification mandates whitespace on both sides of "+" and "-" in calc().',
              englishEpekto: 'Without whitespace, the calculation expression fails to parse and is dropped.',
              englishSolusyon: 'Add a space before and after the operator (e.g. calc(100% - 20px)).',
              w3cRule: 'W3C CSS Values and Units Module Level 3 Section 8.1.1: calc() Operator Spacing.',
              autoFixType: 'fix_calc_spacing',
              fixTarget: badCalcMatch ? badCalcMatch[0] : '',
              fixReplacement: goodCalc
            });
          }

          // Invalid Length Unit Typo
          const unitTypoMatch = rawVal.match(/\b([1-9]\d*)(xp|remm|pix|pxx)\b/i);
          if (unitTypoMatch) {
            const badUnitVal = unitTypoMatch[0];
            const fixedUnitVal = badUnitVal.replace(/(xp|pix|pxx)$/i, 'px').replace(/remm$/i, 'rem');
            issues.push({
              severity: 'error',
              category: 'css',
              line: lineNum,
              title: `Invalid CSS Unit Typo: "${badUnitVal}"`,
              snippet: partTrimmed,
              badCode: badUnitVal,
              goodCode: fixedUnitVal,
              taglishBakit: `May typo sa measurement unit na "${badUnitVal}".`,
              taglishDahilan: 'Hindi kinikilala ng CSS engine ang unit na ito (bale px o rem marahil ang ibig sabihin).',
              taglishEpekto: 'Babalewalain ng browser ang buong deklarasyon.',
              taglishSolusyon: `Palitan ng tamang unit tulad ng "${fixedUnitVal}".`,
              englishBakit: `The measurement unit in "${badUnitVal}" is misspelled.`,
              englishDahilan: 'Browsers only parse official W3C units like px, rem, em, %, vh, vw.',
              englishEpekto: 'The declaration is discarded as invalid syntax.',
              englishSolusyon: `Change to standard unit "${fixedUnitVal}".`,
              w3cRule: 'W3C CSS Values and Units: Valid Length Units.',
              autoFixType: 'replace_text',
              fixTarget: badUnitVal,
              fixReplacement: fixedUnitVal
            });
          }
        });
      }

      if (hasCloseBrace) {
        checkBlockConflicts(currentSelector, currentDeclarations, currentSelectorLine);
        if (currentSelector && currentDeclarations.length > 0) {
          parsedStyleRules.push({
            selector: currentSelector,
            decls: [...currentDeclarations],
            line: currentSelectorLine
          });
        }
        currentDeclarations = [];
        inBlock = false;
      }
    }

    // Undefined CSS Variables Check
    variableUsages.forEach(usage => {
      if (!definedVariables.has(usage.name)) {
        issues.push({
          severity: 'warning',
          category: 'css',
          line: usage.line,
          title: `Undefined CSS Custom Property: "${usage.name}"`,
          snippet: usage.raw,
          badCode: usage.raw,
          goodCode: `:root { ${usage.name}: #38bdf8; }`,
          taglishBakit: `Ginamit ang CSS variable na "${usage.name}" ngunit hindi ito nadeklara sa alinmang :root o selector block.`,
          taglishDahilan: 'Kapag walang deklarasyon ang custom property, babagsak ito sa initial value nito o magiging transparent.',
          taglishEpekto: 'Maaaring hindi lumabas ang kulay o layout na inaasahan.',
          taglishSolusyon: `I-define ang "${usage.name}" sa :root { ${usage.name}: ...; }.`,
          englishBakit: `The CSS custom property "${usage.name}" is referenced but never defined.`,
          englishDahilan: 'Referencing an undefined custom property resolves to an initial fallback.',
          englishEpekto: 'May lead to unexpected styling fallback or transparent backgrounds.',
          englishSolusyon: `Declare the variable in :root { ${usage.name}: ...; }.`,
          w3cRule: 'W3C CSS Custom Properties for Cascading Variables Module Level 1.'
        });
      }
    });

    // Validate Animation References against declared @keyframes
    if (declaredKeyframes.size > 0) {
      animationReferences.forEach(animRef => {
        if (!declaredKeyframes.has(animRef.name)) {
          let bestMatch = null;
          const normRef = animRef.name.toLowerCase().replace(/[-_]/g, '');

          declaredKeyframes.forEach((_, keyframeName) => {
            const normKey = keyframeName.toLowerCase().replace(/[-_]/g, '');
            if (normRef === normKey) {
              bestMatch = keyframeName;
            } else if (normKey.includes(normRef) || normRef.includes(normKey)) {
              bestMatch = keyframeName;
            }
          });

          if (bestMatch) {
            issues.push({
              severity: 'error',
              category: 'css',
              line: animRef.line,
              title: `Animation Name Typo: "${animRef.name}" (Declared keyframe is "@keyframes ${bestMatch}")`,
              snippet: animRef.raw,
              badCode: animRef.raw,
              goodCode: animRef.raw.replace(new RegExp(`\\b${animRef.name}\\b`), bestMatch),
              taglishBakit: `Mali ang spelling ng animation na "${animRef.name}". Ang tamang idineklarang pangalan sa @keyframes ay "${bestMatch}".`,
              taglishDahilan: 'Ang mga animation names sa CSS ay case-sensitive at dapat tugmang-tugma sa @keyframes.',
              taglishEpekto: 'Hindi gagana o tatakbo ang animation dahil hindi mahanap ng browser ang mga keyframes.',
              taglishSolusyon: `Palitan ang "${animRef.name}" ng "${bestMatch}".`,
              englishBakit: `Animation name "${animRef.name}" does not match declared "@keyframes ${bestMatch}".`,
              englishDahilan: 'CSS animation identifiers must match a declared @keyframes rule name exactly.',
              englishEpekto: 'The animation will not run because keyframes cannot be found.',
              englishSolusyon: `Change "${animRef.name}" to "${bestMatch}".`,
              w3cRule: 'W3C CSS Animations Level 1: Animation Name Identifiers.'
            });
          } else {
            issues.push({
              severity: 'warning',
              category: 'css',
              line: animRef.line,
              title: `Undeclared Animation Keyframes: "${animRef.name}"`,
              snippet: animRef.raw,
              badCode: animRef.raw,
              goodCode: `@keyframes ${animRef.name} {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}`,
              taglishBakit: `Ginamit ang animation na "${animRef.name}" ngunit walang @keyframes na may ganitong pangalan.`,
              taglishDahilan: 'Kailangan ng @keyframes definition upang magkaroon ng visual motion ang animation.',
              taglishEpekto: 'Walang magiging visual motion ang elemento.',
              taglishSolusyon: `Gumawa ng @keyframes ${animRef.name} { ... }.`,
              englishBakit: `Animation "${animRef.name}" is referenced without a corresponding @keyframes definition.`,
              englishDahilan: 'CSS animations require keyframe rule definitions.',
              englishEpekto: 'The animation has no keyframes to execute.',
              englishSolusyon: `Declare @keyframes ${animRef.name} { ... }.`,
              w3cRule: 'W3C CSS Animations Level 1: Keyframe Blocks.'
            });
          }
        }
      });
    }

    // Evaluation of Focus Outline Removals
    focusOutlineRemovals.forEach(item => {
      if (hasFocusVisibleRule) {
        issues.push({
          severity: 'info',
          category: 'accessibility',
          line: item.line,
          title: 'Accessibility Note: Focus outline removed with :focus-visible fallback',
          snippet: item.raw,
          badCode: item.raw,
          goodCode: item.raw,
          taglishBakit: `Tinanggal ang outline sa :focus sa selector na "${item.selector}", ngunit may :focus-visible sa stylesheet.`,
          taglishDahilan: 'Ang pagkakaroon ng :focus-visible ay tumutulong upang mapanatili ang keyboard navigation visibility.',
          taglishEpekto: 'Mag-ingat pa rin sa mas lumang browsers na hindi sumusuporta sa :focus-visible.',
          taglishSolusyon: 'Siguraduhing may sapat na contrast ang focus indicator sa lahat ng devices.',
          englishBakit: `Rule "${item.selector}" removes outline on :focus, but :focus-visible is present in the stylesheet.`,
          englishDahilan: 'Mitigated by :focus-visible for keyboard users in modern browsers.',
          englishEpekto: 'Acceptable progressive enhancement pattern, but older browsers may lose focus indicators.',
          englishSolusyon: 'Ensure :focus-visible provides clear high-contrast focus rings.',
          w3cRule: 'W3C WCAG 2.1 Success Criterion 2.4.7: Focus Visible.'
        });
      } else {
        issues.push({
          severity: 'warning',
          category: 'accessibility',
          line: item.line,
          title: `Accessibility Concern: "${item.selector}" removes focus outline with no :focus-visible`,
          snippet: item.raw,
          badCode: item.raw,
          goodCode: `${item.selector}:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }`,
          taglishBakit: `Tinanggal ang focus outline nang walang :focus-visible o alternatibong styling.`,
          taglishDahilan: 'Hindi malalaman ng mga gumagamit ng keyboard kung aling element ang aktibo.',
          taglishEpekto: 'Bumagsak sa WCAG accessibility criteria (Focus Visible).',
          taglishSolusyon: `Maglagay ng :focus-visible outline o box-shadow.`,
          englishBakit: `Rule "${item.selector}" removes focus outline with no :focus-visible fallback in stylesheet.`,
          englishDahilan: 'Keyboard navigation becomes invisible when default focus indicators are stripped.',
          englishEpekto: 'Direct barrier for keyboard-only assistive navigation users.',
          englishSolusyon: 'Provide a visible focus indicator using :focus-visible.',
          w3cRule: 'W3C WCAG 2.1 Success Criterion 2.4.7: Focus Visible.'
        });
      }
    });

    // Specificity Conflict & Shadowing Analysis across Style Rules
    for (let r1 = 0; r1 < parsedStyleRules.length; r1++) {
      const ruleA = parsedStyleRules[r1];
      const specA = calculateSpecificity(ruleA.selector);
      const scoreA = specA[0] * 10000 + specA[1] * 100 + specA[2];

      for (let r2 = r1 + 1; r2 < parsedStyleRules.length; r2++) {
        const ruleB = parsedStyleRules[r2];
        const specB = calculateSpecificity(ruleB.selector);
        const scoreB = specB[0] * 10000 + specB[1] * 100 + specB[2];

        if (scoreA > scoreB) {
          const normA = ruleA.selector.trim();
          const normB = ruleB.selector.trim();
          if (normA.endsWith(normB) || (normA.includes(normB) && normA !== normB)) {
            const propsA = new Set(ruleA.decls.map(p => p.prop));
            const commonProps = ruleB.decls.filter(p => propsA.has(p.prop)).map(p => p.prop);

            if (commonProps.length > 0) {
              issues.push({
                severity: 'info',
                category: 'css',
                line: ruleB.line,
                title: `Specificity Conflict: "${ruleB.selector}" is shadowed by earlier "${ruleA.selector}"`,
                snippet: `${ruleB.selector} { ... }`,
                badCode: `${ruleB.selector} { ... }`,
                goodCode: `/* Refactor specificity between "${ruleA.selector}" and "${ruleB.selector}" */`,
                taglishBakit: `Ang selector na "${ruleB.selector}" (specificity [${specB.join(', ')}]) ay nadeklara pagkatapos ng "${ruleA.selector}" (specificity [${specA.join(', ')}]), ngunit hindi nito ma-o-override ang [${commonProps.join(', ')}].`,
                taglishDahilan: 'Mas mataas ang specificity ng naunang ID selector, kaya babalewalain ng browser ang huling style.',
                taglishEpekto: 'Hindi makikita ang pagbabago sa browser kahit nasa huli ang rule.',
                taglishSolusyon: `Dagdagan ang specificity ng "${ruleB.selector}" o alisin ang ID sa naunang selector.`,
                englishBakit: `Rule "${ruleB.selector}" (specificity [${specB.join(', ')}]) is declared after "${ruleA.selector}" (specificity [${specA.join(', ')}]), but cannot override properties [${commonProps.join(', ')}].`,
                englishDahilan: 'The earlier rule has higher specificity (IDs take priority), regardless of cascade position.',
                englishEpekto: 'Styles written later will fail to take effect on matching elements.',
                englishSolusyon: `Adjust specificity hierarchy between the two selectors.`,
                w3cRule: 'W3C CSS Selectors Level 4: Specificity and Cascade.'
              });
            }
          }
        }
      }
    }

    // Consolidated Quiet Notice for Unused Selectors in HTML document
    if (isEmbedded && unreferencedSelectors.length > 0) {
      const uniqueUnused = Array.from(new Set(unreferencedSelectors));
      if (uniqueUnused.length > 0) {
        issues.push({
          severity: 'info',
          category: 'css',
          line: baseLineOffset,
          title: `Notice: ${uniqueUnused.length} CSS Selectors Not Referenced in Current HTML`,
          snippet: `${uniqueUnused.slice(0, 5).join(', ')}${uniqueUnused.length > 5 ? '...' : ''}`,
          badCode: `/* Selectors not found in HTML: */\n${uniqueUnused.slice(0, 4).join(', ')}`,
          goodCode: `/* Reference these in HTML elements or retain for future use */`,
          taglishBakit: `May ${uniqueUnused.length} CSS selectors na nadeklara sa stylesheet ngunit hindi kasalukuyang ginagamit sa HTML (${uniqueUnused.slice(0, 4).join(', ')}).`,
          taglishDahilan: 'Normal ito sa mga template o modular stylesheets. Walang sira sa page, ngunit mainam itong suriin para malinis ang unused styles.',
          taglishEpekto: 'Walang epekto sa visual rendering; kaunting dagdag laki lamang sa stylesheet.',
          taglishSolusyon: 'Gamitin ang mga class/ID na ito sa HTML kung kailangan, o panatilihin para sa iba pang bahagi ng site.',
          englishBakit: `Found ${uniqueUnused.length} CSS selectors not referenced in this HTML document (${uniqueUnused.slice(0, 4).join(', ')}).`,
          englishDahilan: 'Common when designing reusable styles. Does not cause rendering errors, but useful for style cleanup audits.',
          englishEpekto: 'No rendering impact; slightly increases stylesheet size.',
          englishSolusyon: 'Reference these classes in HTML where appropriate, or clean up unneeded styles.',
          w3cRule: 'W3C Web Performance Best Practices: Clean Unused CSS Selectors.'
        });
      }
    }
  };

  // ======================================================================
  // FULL DOCUMENT & HTML STANDARDS ANALYZER
  // ======================================================================
  BB.analyzeCode = function(code, mode = 'full') {
    const issues = [];
    if (!code || !code.trim()) return issues;

    // Build line index offsets for O(log N) line number lookup
    const lineOffsets = [0];
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '\n') {
        lineOffsets.push(i + 1);
      }
    }
    function getLineNumber(index) {
      let low = 0, high = lineOffsets.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (lineOffsets[mid] <= index) {
          if (mid === lineOffsets.length - 1 || lineOffsets[mid + 1] > index) {
            return mid + 1;
          }
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return 1;
    }

    // In pure CSS Analyzer Mode: Run dedicated comprehensive CSS engine directly
    if (mode === 'css') {
      BB.analyzeCSSBlock(code, 1, false, issues, getLineNumber);
      issues.sort((a, b) => a.line - b.line);
      return issues;
    }

    const lines = code.split('\n');

    // 1. DOCUMENT LEVEL CHECKS (W3C HTML5 Specification)
    const hasDoctype = /<!DOCTYPE\s+html>/i.test(code);
    const isFullDocument = /<(html|head|body)\b/i.test(code);
    if (!hasDoctype && isFullDocument) {
      issues.push({
        severity: 'error',
        category: 'html',
        line: 1,
        title: 'Missing <!DOCTYPE html> Declaration',
        snippet: code.slice(0, 40),
        badCode: '<html>\n  <head>...',
        goodCode: '<!DOCTYPE html>\n<html lang="en">\n  <head>...',
        taglishBakit: 'Walang <!DOCTYPE html> declaration sa pinakaunang linya ng dokumento.',
        taglishDahilan: 'Kailangang malaman ng web browser na modernong HTML5 rendering standard ang dapat gamitin.',
        taglishEpekto: 'Kung wala ito, mag-ti-trigger ang browser ng Quirks Mode, na nagdudulot ng sira at hindi pantay na rendering sa CSS box model.',
        taglishSolusyon: 'Idagdag ang <!DOCTYPE html> sa pinakaunang linya (Line 1) bago ang <html> tag.',
        englishBakit: 'The document is missing the required <!DOCTYPE html> declaration on line 1.',
        englishDahilan: 'Browsers require the doctype declaration to render the document in modern HTML5 standards mode.',
        englishEpekto: 'Without <!DOCTYPE html>, browsers fall back to Quirks Mode, leading to inconsistent CSS rendering and broken box models.',
        englishSolusyon: 'Add <!DOCTYPE html> at the very first line before the <html> tag.',
        w3cRule: 'W3C HTML5 Specification Section 8.1.1: The DOCTYPE preamble is mandatory at the beginning of HTML documents.',
        autoFixType: 'add_doctype'
      });
    }

    const htmlTagMatch = code.match(/<html\b([^>]*)>/i);
    if (htmlTagMatch) {
      const htmlLine = getLineNumber(htmlTagMatch.index);
      const htmlAttrs = htmlTagMatch[1];
      if (!/\blang=["'][a-zA-Z\-]+["']/i.test(htmlAttrs)) {
        issues.push({
          severity: 'warning',
          category: 'html',
          line: htmlLine,
          title: 'Missing "lang" Attribute on <html>',
          snippet: htmlTagMatch[0],
          badCode: '<html>',
          goodCode: '<html lang="en">',
          taglishBakit: 'Walang "lang" attribute (tulad ng lang="en" o lang="fil") na nakalagay sa <html> root tag.',
          taglishDahilan: 'Ginagamit ng screen readers, translation tools, at search engines ang lang attribute upang matukoy ang pangunahing wika ng nilalaman.',
          taglishEpekto: 'Bumababa ang accessibility score at maaaring magkamali ang screen readers sa pagbigkas ng mga salita sa pahina.',
          taglishSolusyon: 'Lagyan ng lang="en" o lang="fil" ang iyong opening <html> tag.',
          englishBakit: 'The <html> root element is missing a valid "lang" attribute (e.g., lang="en").',
          englishDahilan: 'Screen readers, translation tools, and search engines rely on the lang attribute to configure language-specific pronunciation rules.',
          englishEpekto: 'Fails WCAG 3.1.1 accessibility audits and causes screen readers to mispronounce content.',
          englishSolusyon: 'Add lang="en" to your opening <html> tag.',
          w3cRule: 'W3C Accessibility WCAG 2.1 Success Criterion 3.1.1: Language of Page requirement.',
          autoFixType: 'add_lang'
        });
      }
    }

    const headMatch = code.match(/<head\b[^>]*>/i);
    if (headMatch) {
      const headLine = getLineNumber(headMatch.index);
      const hasTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.test(code);
      if (!hasTitle) {
        issues.push({
          severity: 'warning',
          category: 'html',
          line: headLine,
          title: 'Missing <title> Element in <head>',
          snippet: '<head>...</head>',
          badCode: '<head>\n  <meta charset="UTF-8">\n</head>',
          goodCode: '<head>\n  <meta charset="UTF-8">\n  <title>My Web Page</title>\n</head>',
          taglishBakit: 'Walang <title> tag sa loob ng <head> section ng dokumento.',
          taglishDahilan: 'Ang <title> ay kailangan ng browser para sa browser tab title, bookmarking, at search engine search results.',
          taglishEpekto: 'Bagsak sa W3C document structure requirements at hindi magpapakita ng tamang pamagat sa browser tab.',
          taglishSolusyon: 'Magdagdag ng <title>Pamagat ng Pahina</title> sa loob ng <head> tag.',
          englishBakit: 'The document is missing a <title> element inside the <head> section.',
          englishDahilan: 'The <title> tag is mandatory in HTML5 to provide metadata for browser tabs, bookmarks, and search engines.',
          englishEpekto: 'Violates W3C document structure standards and leaves the browser tab with a blank or raw URL title.',
          englishSolusyon: 'Add a descriptive <title>Page Title</title> inside the <head> tag.',
          w3cRule: 'W3C HTML5 Specification Section 4.2.2: The title element is required in the document head.'
        });
      } else {
        const titleContent = (code.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
        if (!titleContent.trim()) {
          issues.push({
            severity: 'warning',
            category: 'html',
            line: headLine,
            title: 'Empty <title> Element in <head>',
            snippet: '<title></title>',
            badCode: '<title></title>',
            goodCode: '<title>Meaningful Page Title</title>',
            taglishBakit: 'Walang nakasulat na pamagat sa loob ng <title> tag.',
            taglishDahilan: 'Ang walang laman na title ay nagdudulot ng blangkong browser tab at pagbaba sa accessibility.',
            taglishEpekto: 'Hindi makikilala ng mga user at screen readers ang pamagat ng webpage.',
            taglishSolusyon: 'Maglagay ng makabuluhang pamagat sa loob ng <title> tag.',
            englishBakit: 'The <title> element contains no textual content.',
            englishDahilan: 'Empty titles fail accessibility checks and leave user browser tabs unlabelled.',
            englishEpekto: 'Impedes document identification in browser histories, search results, and screen readers.',
            englishSolusyon: 'Provide a descriptive, meaningful page title inside <title>...</title>.',
            w3cRule: 'W3C HTML5 Specification: Titles must have non-empty text content.'
          });
        }
      }

      if (!/<meta[^>]*\bname=["']viewport["']/i.test(code)) {
        issues.push({
          severity: 'suggestion',
          category: 'html',
          line: headLine,
          title: 'Suggestion: Add Responsive Viewport Meta Tag',
          snippet: '<head>...</head>',
          badCode: '<head>\n  <title>My Site</title>\n</head>',
          goodCode: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Site</title>\n</head>',
          taglishBakit: 'Walang <meta name="viewport"> tag sa loob ng <head> section.',
          taglishDahilan: 'Kailangan ng mga mobile device ang viewport tag upang mai-scale nang maayos ang lapad ng pahina ayon sa screen ng smartphone o tablet.',
          taglishEpekto: 'Kung wala ito, magmumukhang maliit o zoomed-out ang pahina sa mga mobile phone dahil desktop resolution ang gagamitin.',
          taglishSolusyon: 'Idagdag ang <meta name="viewport" content="width=device-width, initial-scale=1.0"> sa loob ng <head> tag.',
          englishBakit: 'The document is missing a responsive viewport <meta> tag inside the <head> element.',
          englishDahilan: 'Mobile browsers require viewport metadata to correctly size the viewport relative to the device screen dimensions.',
          englishEpekto: 'Mobile devices will render the page as a shrunk-down desktop layout, impairing readability and touch navigation.',
          englishSolusyon: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside the <head> element.',
          w3cRule: 'W3C Mobile Web Best Practices: Configure the viewport for device screen dimensions.',
          autoFixType: 'add_viewport'
        });
      }
    }

    // Check for multiple <body> elements
    const bodyMatches = Array.from(code.matchAll(/<body\b[^>]*>/gi));
    if (bodyMatches.length > 1) {
      for (let b = 1; b < bodyMatches.length; b++) {
        issues.push({
          severity: 'error',
          category: 'html',
          line: getLineNumber(bodyMatches[b].index),
          title: 'Multiple <body> Elements Detected',
          snippet: bodyMatches[b][0],
          badCode: bodyMatches[b][0],
          goodCode: '<!-- Only one <body> allowed per HTML document -->',
          taglishBakit: 'Mayroong higit sa isang <body> element sa HTML document.',
          taglishDahilan: 'Ayon sa W3C standard, isa lamang ang pinapayagang <body> element sa buong pahina.',
          taglishEpekto: 'Sinisira nito ang standard DOM tree structure at nagdudulot ng rendering bugs.',
          taglishSolusyon: 'Alisin ang labis na <body> tag at pagsamahin ang content sa iisang body.',
          englishBakit: 'Multiple <body> tags are defined in the document.',
          englishDahilan: 'HTML5 documents can contain only a single <body> element representing document content.',
          englishEpekto: 'Corrupts the DOM document model and causes unexpected styling breaks.',
          englishSolusyon: 'Consolidate all page content into a single <body> element.',
          w3cRule: 'W3C HTML5 Specification Section 4.3: Only one body element is permitted.'
        });
      }
    }

    // 2. EMBEDDED CSS STYLES DETECTION
    const styleBlockRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    const styleRanges = [];
    const pendingStyles = [];

    while ((styleMatch = styleBlockRegex.exec(code)) !== null) {
      const styleContent = styleMatch[1];
      const styleStartIdx = styleMatch.index + styleMatch[0].indexOf(styleContent);
      styleRanges.push({ start: styleMatch.index, end: styleMatch.index + styleMatch[0].length });

      const currentStyleLineOffset = getLineNumber(styleStartIdx);
      pendingStyles.push({ content: styleContent, lineOffset: currentStyleLineOffset });
    }

    // 3. ROBUST HTML TOKENIZER, TAG STACK & W3C VALIDATOR
    const tagStack = [];
    const idCounts = {};
    const htmlClasses = new Map();
    const htmlIds = new Map();
    let headingLevels = [];

    function isIgnoredRange(index) {
      for (let r = 0; r < styleRanges.length; r++) {
        if (index >= styleRanges[r].start && index < styleRanges[r].end) return true;
      }
      return false;
    }

    const tokens = [];
    let cursor = 0;
    const codeLen = code.length;

    while (cursor < codeLen) {
      if (isIgnoredRange(cursor)) {
        cursor++;
        continue;
      }

      const nextLt = code.indexOf('<', cursor);
      if (nextLt === -1) {
        break;
      }

      if (isIgnoredRange(nextLt)) {
        cursor = nextLt + 1;
        continue;
      }

      cursor = nextLt;
      const tagStartIdx = cursor;
      const tagLine = getLineNumber(tagStartIdx);

      // Comments <!-- ... -->
      if (code.startsWith('<!--', cursor)) {
        const commentEnd = code.indexOf('-->', cursor + 4);
        if (commentEnd !== -1) {
          cursor = commentEnd + 3;
        } else {
          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: 'Unclosed HTML Comment: <!-- (Missing "-->")',
            snippet: code.slice(cursor, Math.min(codeLen, cursor + 30)),
            badCode: code.slice(cursor).trim(),
            goodCode: code.slice(cursor).trim() + ' -->',
            taglishBakit: 'May binuksang "<!--" comment sa HTML na hindi naisara ng "-->".',
            taglishDahilan: 'Lahat ng HTML comments ay dapat magtapos sa "-->".',
            taglishEpekto: 'Kainin ng komento ang natitirang bahagi ng HTML dokumento.',
            taglishSolusyon: 'Maglagay ng "-->" sa dulo ng komento.',
            englishBakit: 'An HTML comment opened with "<!--" was not closed with "-->".',
            englishDahilan: 'HTML comments require terminating "-->" delimiters.',
            englishEpekto: 'Causes all following markup to be commented out and ignored by the browser.',
            englishSolusyon: 'Add "-->" to close the comment block.',
            w3cRule: 'W3C HTML5 Specification Section 8.1.6: Comments.'
          });
          cursor = codeLen;
        }
        continue;
      }

      // CDATA <![CDATA[ ... ]]>
      if (code.startsWith('<![CDATA[', cursor)) {
        const cdataEnd = code.indexOf(']]>', cursor + 9);
        if (cdataEnd !== -1) {
          cursor = cdataEnd + 3;
        } else {
          cursor = codeLen;
        }
        continue;
      }

      // DOCTYPE <!DOCTYPE ...>
      if (/^<!doctype\b/i.test(code.slice(cursor, cursor + 12))) {
        const docEnd = code.indexOf('>', cursor);
        if (docEnd !== -1) {
          cursor = docEnd + 1;
        } else {
          cursor = codeLen;
        }
        continue;
      }

      // Closing Tag </tag ...>
      if (code.startsWith('</', cursor)) {
        const closeMatch = code.slice(cursor).match(/^<\/([a-zA-Z0-9_\-]+)/);
        if (closeMatch) {
          const closingTagName = closeMatch[1].toLowerCase();
          const afterTagName = cursor + closeMatch[0].length;
          let closeEnd = -1;
          let nextTagStart = -1;

          for (let k = afterTagName; k < codeLen; k++) {
            if (code[k] === '>') {
              closeEnd = k;
              break;
            }
            if (code[k] === '<') {
              nextTagStart = k;
              break;
            }
          }

          if (closeEnd !== -1) {
            tokens.push({
              type: 'closing',
              tag: closingTagName,
              line: tagLine,
              raw: code.slice(cursor, closeEnd + 1),
              index: cursor
            });
            cursor = closeEnd + 1;
          } else {
            const endPos = nextTagStart !== -1 ? nextTagStart : codeLen;
            const rawClose = code.slice(cursor, endPos).trim();
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Unclosed Closing Tag: </${closingTagName} (Missing ">")`,
              snippet: rawClose,
              badCode: rawClose,
              goodCode: `</${closingTagName}>`,
              taglishBakit: `Kulang ng closing ">" angle bracket ang closing tag na "</${closingTagName}".`,
              taglishDahilan: 'Dapat laging nagtatapos sa ">" ang bawat closing tag sa HTML.',
              taglishEpekto: 'Nagdudulot ng syntax error sa DOM parser.',
              taglishSolusyon: `Maglagay ng ">" upang maging </${closingTagName}>.`,
              englishBakit: `The closing tag </${closingTagName} is missing its closing ">" bracket.`,
              englishDahilan: 'HTML end tags must be terminated with a ">" delimiter.',
              englishEpekto: 'Syntax error that breaks tree construction.',
              englishSolusyon: `Add the closing ">" bracket to make </${closingTagName}>.`,
              w3cRule: 'W3C HTML5 Specification: End tag syntax.'
            });
            tokens.push({
              type: 'closing',
              tag: closingTagName,
              line: tagLine,
              raw: `</${closingTagName}>`,
              index: cursor
            });
            cursor = endPos;
          }
        } else {
          cursor += 2;
        }
        continue;
      }

      // Opening Tag <tag ...>
      const openMatch = code.slice(cursor).match(/^<([a-zA-Z0-9_\-]+)/);
      if (openMatch) {
        const openingTagName = openMatch[1].toLowerCase();
        let k = cursor + openMatch[0].length;
        let inQuote = null;
        let tagClosed = false;
        let closePos = -1;
        let nextLtPos = -1;

        while (k < codeLen) {
          const ch = code[k];
          if (inQuote) {
            if (ch === inQuote) {
              inQuote = null;
            }
          } else {
            if (ch === '"' || ch === '\'') {
              inQuote = ch;
            } else if (ch === '>') {
              tagClosed = true;
              closePos = k;
              break;
            } else if (ch === '<') {
              nextLtPos = k;
              break;
            }
          }
          k++;
        }

        if (tagClosed) {
          const isSelfClosing = code[closePos - 1] === '/';
          const rawAttrs = code.slice(cursor + openMatch[0].length, isSelfClosing ? closePos - 1 : closePos);
          tokens.push({
            type: 'opening',
            tag: openingTagName,
            attrs: rawAttrs,
            isSelfClosing: isSelfClosing,
            line: tagLine,
            raw: code.slice(cursor, closePos + 1),
            index: cursor
          });
          cursor = closePos + 1;
        } else {
          const endPos = nextLtPos !== -1 ? nextLtPos : codeLen;
          const rawUnclosed = code.slice(cursor, endPos).trim();
          const rawAttrs = code.slice(cursor + openMatch[0].length, endPos);

          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: `Unclosed Tag Syntax: <${openingTagName} (Missing ">")`,
            snippet: rawUnclosed,
            badCode: rawUnclosed,
            goodCode: `<${openingTagName}>`,
            taglishBakit: `Mayroong unclosed opening tag bracket na "${rawUnclosed}" sa Linya ${tagLine} na kulang ng closing ">".`,
            taglishDahilan: 'Lahat ng HTML opening tags ay dapat magtapos sa ">" bracket bago magsimula ang susunod na tag o nilalaman.',
            taglishEpekto: 'Maaaring hindi mabasa ng browser ang element at magdulot ng abnormal na layout.',
            taglishSolusyon: `Maglagay ng ">" sa dulo ng <${openingTagName}> tag (halimbawa: <${openingTagName}>).`,
            englishBakit: `The opening tag "<${openingTagName}" is missing its closing ">" angle bracket.`,
            englishDahilan: 'HTML syntax mandates that all element tags must be properly terminated with ">".',
            englishEpekto: 'Prevents the parser from recognizing element boundaries and corrupts subsequent markup.',
            englishSolusyon: `Add the missing ">" bracket to close the <${openingTagName}> tag.`,
            w3cRule: 'W3C HTML5 Specification Section 8.1.2: Elements and Tag Syntax.',
            autoFixType: 'fix_unclosed_bracket',
            fixTarget: rawUnclosed,
            fixReplacement: rawUnclosed + '>'
          });

          tokens.push({
            type: 'opening',
            tag: openingTagName,
            attrs: rawAttrs,
            isSelfClosing: false,
            line: tagLine,
            raw: `<${openingTagName}>`,
            index: cursor
          });
          cursor = endPos;
        }
        continue;
      }

      cursor++;
    }

    // Process all structured tokens through W3C Validator and Tag Stack
    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      const tagLine = token.line;

      // CLOSING TAG
      if (token.type === 'closing') {
        const closingTagName = token.tag;

        if (BB.VOID_ELEMENTS.has(closingTagName)) {
          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: `Illegal Closing Tag: </${closingTagName}> on Void Element`,
            snippet: token.raw,
            badCode: `<${closingTagName}>...</${closingTagName}>`,
            goodCode: `<${closingTagName}>`,
            taglishBakit: `Naglagay ka ng closing tag na </${closingTagName}> sa isang void element.`,
            taglishDahilan: `Ang <${closingTagName}> ay isang void element sa HTML5 na walang nilalaman, kaya bawal itong lagyan ng hiwalay na closing tag.`,
            taglishEpekto: 'Lumalabag ito sa W3C HTML5 standard at nagdudulot ng abnormal na pagbuo ng DOM tree.',
            taglishSolusyon: `Tanggalin ang </${closingTagName}> closing tag.`,
            englishBakit: `An illegal closing tag </${closingTagName}> was encountered on a void element.`,
            englishDahilan: `The <${closingTagName}> element is a void element in HTML5 and must not possess an end tag.`,
            englishEpekto: 'Violates W3C HTML5 syntax rules and causes unexpected DOM tree reconstructions.',
            englishSolusyon: `Remove the closing </${closingTagName}> tag.`,
            w3cRule: 'W3C HTML5 Specification Section 4.3: Void elements must not have closing tags.',
            autoFixType: 'remove_void_closing',
            voidTag: closingTagName
          });
          continue;
        }

        if (tagStack.length === 0) {
          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: `Unexpected Stray Closing Tag: </${closingTagName}>`,
            snippet: token.raw,
            badCode: token.raw,
            goodCode: `<!-- Remove unexpected </${closingTagName}> -->`,
            taglishBakit: `Walang kapares na opening tag ang closing tag na </${closingTagName}>.`,
            taglishDahilan: 'Hindi maaaring magsara ng element kung hindi ito unang binuksan sa DOM.',
            taglishEpekto: 'Ituturing ng browser na syntax error ang tag na ito.',
            taglishSolusyon: `Tanggalin ang stray tag na </${closingTagName}> o buksan muna ito gamit ang <${closingTagName}>.`,
            englishBakit: `The closing tag </${closingTagName}> has no corresponding opening tag in the document.`,
            englishDahilan: 'Closing tags require a matching unclosed ancestor element on the stack.',
            englishEpekto: 'Causes HTML syntax errors and corrupts document tree hierarchy.',
            englishSolusyon: `Remove the stray </${closingTagName}> tag or add the matching opening tag.`,
            w3cRule: 'W3C HTML5 Syntax: Tag pairs must match.'
          });
        } else {
          while (
            tagStack.length > 0 &&
            BB.OPTIONAL_CLOSE_TAGS.has(tagStack[tagStack.length - 1].tag) &&
            tagStack[tagStack.length - 1].tag !== closingTagName
          ) {
            tagStack.pop();
          }

          if (tagStack.length === 0) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Unexpected Stray Closing Tag: </${closingTagName}>`,
              snippet: token.raw,
              badCode: token.raw,
              goodCode: `<!-- Remove unexpected </${closingTagName}> -->`,
              taglishBakit: `Walang kapares na opening tag ang closing tag na </${closingTagName}>.`,
              taglishDahilan: 'Hindi maaaring magsara ng element kung hindi ito unang binuksan sa DOM.',
              taglishEpekto: 'Ituturing ng browser na syntax error ang tag na ito.',
              taglishSolusyon: `Tanggalin ang stray tag na </${closingTagName}> o buksan muna ito gamit ang <${closingTagName}>.`,
              englishBakit: `The closing tag </${closingTagName}> has no corresponding opening tag in the document.`,
              englishDahilan: 'Closing tags require a matching unclosed ancestor element on the stack.',
              englishEpekto: 'Causes HTML syntax errors and corrupts document tree hierarchy.',
              englishSolusyon: `Remove the stray </${closingTagName}> tag or add the matching opening tag.`,
              w3cRule: 'W3C HTML5 Syntax: Tag pairs must match.'
            });
          } else {
            const topOfStack = tagStack[tagStack.length - 1];
            if (topOfStack.tag === closingTagName) {
              tagStack.pop();
            } else {
              let matchIdx = -1;
              for (let s = tagStack.length - 1; s >= 0; s--) {
                if (tagStack[s].tag === closingTagName) {
                  matchIdx = s;
                  break;
                }
              }

              if (matchIdx !== -1) {
                for (let u = tagStack.length - 1; u > matchIdx; u--) {
                  const unclosed = tagStack[u];
                  if (BB.OPTIONAL_CLOSE_TAGS.has(unclosed.tag)) {
                    continue;
                  }
                  issues.push({
                    severity: 'error',
                    category: 'html',
                    line: unclosed.line,
                    title: `Unclosed Tag: <${unclosed.tag}> (Unclosed before </${closingTagName}> on Line ${tagLine})`,
                    snippet: unclosed.raw,
                    badCode: `${unclosed.raw}\n  ...\n${token.raw}`,
                    goodCode: `${unclosed.raw}\n  ...\n</${unclosed.tag}>\n${token.raw}`,
                    taglishBakit: `Ang element na <${unclosed.tag}> na binuksan sa Linya ${unclosed.line} ay hindi naisara bago isara ang </${closingTagName}> sa Linya ${tagLine}.`,
                    taglishDahilan: 'Dapat maayos at sunud-sunod na nakapugad (nested) ang mga HTML tags. Ang huling binuksan ay dapat unang isara (LIFO).',
                    taglishEpekto: 'Sinisira nito ang hierarchy ng page at nagdudulot ng layout shifts.',
                    taglishSolusyon: `Isara ang <${unclosed.tag}> gamit ang </${unclosed.tag}> bago ang </${closingTagName}>.`,
                    englishBakit: `The opening tag <${unclosed.tag}> on line ${unclosed.line} was never closed before </${closingTagName}> on line ${tagLine}.`,
                    englishDahilan: 'HTML elements must strictly follow proper last-in-first-out (LIFO) hierarchical nesting.',
                    englishEpekto: 'Leads to severe layout anomalies, unintended element wrapping, and DOM corruption.',
                    englishSolusyon: `Add a closing </${unclosed.tag}> tag before closing </${closingTagName}>.`,
                    w3cRule: 'W3C HTML5 Specification Section 8.2: Proper Tag Nesting and Tree Construction.',
                    autoFixType: 'close_before_tag',
                    unclosedTag: unclosed.tag,
                    beforeTag: closingTagName,
                    beforeLine: tagLine,
                    beforeTokenIndex: token.index
                  });
                }
                tagStack.splice(matchIdx);
              } else {
                issues.push({
                  severity: 'error',
                  category: 'html',
                  line: tagLine,
                  title: `Mismatched Closing Tag: </${closingTagName}> (Expected </${topOfStack.tag}> opened on Line ${topOfStack.line})`,
                  snippet: token.raw,
                  badCode: `<${topOfStack.tag}> ... ${token.raw}`,
                  goodCode: `<${topOfStack.tag}> ... </${topOfStack.tag}>`,
                  taglishBakit: `Maling closing tag: Binuksan ang <${topOfStack.tag}> sa Linya ${topOfStack.line} ngunit isinara gamit ang </${closingTagName}> sa Linya ${tagLine}.`,
                  taglishDahilan: 'Dapat magkatugma ang pangalan ng opening tag at closing tag.',
                  taglishEpekto: 'Nagdudulot ng syntax error sa DOM parser.',
                  taglishSolusyon: `Palitan ang </${closingTagName}> ng </${topOfStack.tag}>.`,
                  englishBakit: `Mismatched tag pair: opening tag <${topOfStack.tag}> on line ${topOfStack.line} was closed with </${closingTagName}> on line ${tagLine}.`,
                  englishDahilan: 'Closing tags must exactly match the name of their corresponding opening tags.',
                  englishEpekto: 'Corrupts the DOM hierarchy, leading to unpredictable layout anomalies.',
                  englishSolusyon: `Change the closing tag </${closingTagName}> to </${topOfStack.tag}>.`,
                  w3cRule: 'W3C HTML5 Syntax: Tag nesting and closing tag name alignment.'
                });
              }
            }
          }
        }
      }

      // OPENING TAG
      if (token.type === 'opening') {
        const openingTagName = token.tag;
        const rawAttrs = token.attrs || '';
        const isSelfClosing = token.isSelfClosing;

        if (BB.OBSOLETE_ELEMENTS.has(openingTagName)) {
          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: `Deprecated Obsolete HTML Element: <${openingTagName}>`,
            snippet: token.raw,
            badCode: token.raw,
            goodCode: `<div class="styled-box">...</div>`,
            taglishBakit: `Gumamit ka ng lumang tag na <${openingTagName}> na tinanggal na sa modernong HTML5.`,
            taglishDahilan: 'Ang tag na ito ay ganap nang deprecated at inalis ng W3C pabor sa modernong CSS styling rules.',
            taglishEpekto: 'Maaaring hindi na ito suportahan ng mga modernong web browser at lumalabag ito sa HTML5 web standards.',
            taglishSolusyon: `Palitan ang <${openingTagName}> ng modernong semantic tag (tulad ng <div>, <p>, o <span>) at gumamit ng CSS para sa styling.`,
            englishBakit: `The deprecated HTML tag <${openingTagName}> is used in the markup.`,
            englishDahilan: 'This tag was marked obsolete by the W3C in HTML5 in favor of clean CSS presentation separation.',
            englishEpekto: 'Modern browsers may drop support, and the document fails standard HTML5 validation.',
            englishSolusyon: `Replace <${openingTagName}> with semantic HTML elements and style with modern CSS.`,
            w3cRule: 'W3C HTML5 Specification: Obsolete Features and Non-conforming Elements.'
          });
        } else if (!BB.VALID_HTML5_ELEMENTS.has(openingTagName) && !openingTagName.includes('-') && !openingTagName.startsWith('!')) {
          issues.push({
            severity: 'error',
            category: 'html',
            line: tagLine,
            title: `Unknown / Invalid HTML Element: <${openingTagName}>`,
            snippet: token.raw,
            badCode: token.raw,
            goodCode: `<div>...</div>`,
            taglishBakit: `Hindi kinikilala sa W3C HTML5 standard ang element na <${openingTagName}>.`,
            taglishDahilan: 'Maaaring may typo sa pangalan ng tag. Kung custom element ito, kailangan itong maglaman ng hyphen (hal. <my-component>).',
            taglishEpekto: 'Ituturing ito ng browser bilang generic inline element na walang semantic meaning.',
            taglishSolusyon: `Iwasto ang spelling ng <${openingTagName}> sa isang valid na HTML5 tag.`,
            englishBakit: `The HTML element <${openingTagName}> is not recognized in the W3C HTML5 specification.`,
            englishDahilan: 'Likely a typo in the tag name. Custom elements require a hyphen (e.g. <custom-card>).',
            englishEpekto: 'Parsed as an unknown HTMLUnknownElement with no default semantics.',
            englishSolusyon: `Correct the element name to a standard HTML5 tag.`,
            w3cRule: 'W3C HTML5 Specification: Standard Element Identifiers.'
          });
        }

        // Attribute Analysis
        if (rawAttrs.trim()) {
          const attrRegex = /([a-zA-Z0-9_\-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/g;
          let attrMatch;
          const seenAttrs = new Set();

          while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
            const attrName = attrMatch[1].toLowerCase();
            const attrVal = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] || ''));

            if (seenAttrs.has(attrName)) {
              issues.push({
                severity: 'error',
                category: 'html',
                line: tagLine,
                title: `Duplicate Attribute "${attrName}" on <${openingTagName}>`,
                snippet: token.raw,
                badCode: token.raw,
                goodCode: `<${openingTagName} ${attrName}="${attrVal}">`,
                taglishBakit: `Ulit-ulit na inilagay ang attribute na "${attrName}" sa parehong tag.`,
                taglishDahilan: 'Bawal ang duplicate attributes sa iisang HTML element ayon sa W3C standards.',
                taglishEpekto: 'Maaaring balewalain ng browser ang isa sa mga values o magdulot ng hindi inaasahang resulta.',
                taglishSolusyon: `Pagsamahin o tanggalin ang sobrang "${attrName}" attribute.`,
                englishBakit: `The attribute "${attrName}" is duplicated on the <${openingTagName}> element.`,
                englishDahilan: 'HTML5 syntax rules mandate that attributes must be unique on each element.',
                englishEpekto: 'Creates ambiguous document parsing and invalidates HTML5 standards compliance.',
                englishSolusyon: `Remove the duplicate "${attrName}" attribute.`,
                w3cRule: 'W3C HTML5 Specification Section 8.1.2.3: Attribute Uniqueness on Elements.'
              });
            } else {
              seenAttrs.add(attrName);
            }

            if (BB.OBSOLETE_ATTRIBUTES[attrName]) {
              issues.push({
                severity: 'warning',
                category: 'html',
                line: tagLine,
                title: `Obsolete Attribute "${attrName}" on <${openingTagName}>`,
                snippet: `${attrName}="${attrVal}"`,
                badCode: `${attrName}="${attrVal}"`,
                goodCode: `style="..."`,
                taglishBakit: `Ang attribute na "${attrName}" ay obsolete na sa modernong HTML5.`,
                taglishDahilan: BB.OBSOLETE_ATTRIBUTES[attrName],
                taglishEpekto: 'Hindi na ito inirerekomenda at pinalitan na ng CSS styling properties.',
                taglishSolusyon: BB.OBSOLETE_ATTRIBUTES[attrName],
                englishBakit: `The attribute "${attrName}" is obsolete in HTML5.`,
                englishDahilan: BB.OBSOLETE_ATTRIBUTES[attrName],
                englishEpekto: 'Lacks modern CSS flexibility and fails standard HTML5 validation audits.',
                englishSolusyon: BB.OBSOLETE_ATTRIBUTES[attrName],
                w3cRule: 'W3C HTML5 Specification: Obsolete Attributes.'
              });
            }

            if (attrName === 'class' && attrVal) {
              attrVal.trim().split(/\s+/).forEach(cls => {
                if (cls) htmlClasses.set(cls.toLowerCase(), cls);
              });
            }

            if (attrName === 'id' && attrVal) {
              htmlIds.set(attrVal.toLowerCase(), attrVal);
              if (idCounts[attrVal]) {
                issues.push({
                  severity: 'error',
                  category: 'html',
                  line: tagLine,
                  title: `Duplicate Document ID: "${attrVal}"`,
                  snippet: token.raw,
                  badCode: `<${openingTagName} id="${attrVal}">...`,
                  goodCode: `<${openingTagName} id="${attrVal}-${tagLine}">...`,
                  taglishBakit: `Ang ID attribute value na "${attrVal}" ay ginamit nang higit sa isang beses sa pahina.`,
                  taglishDahilan: 'Ang bawat "id" attribute ay dapat natatangi (unique) sa buong HTML document.',
                  taglishEpekto: 'Maaaring magkamali ang document.getElementById(), masira ang CSS target selectors, at mabigo ang keyboard accessibility.',
                  taglishSolusyon: `Gumawa ng unique na ID para sa bawat elemento, o gamitin ang class="${attrVal}" kung nais itong gamitin sa maraming elemento.`,
                  englishBakit: `The element ID "${attrVal}" is assigned to multiple elements within the document.`,
                  englishDahilan: 'HTML5 specifications mandate that ID attribute values must be globally unique within the document tree.',
                  englishEpekto: 'Causes document.getElementById() to fail unpredictably, breaks anchor fragment links, and disrupts accessibility labels.',
                  englishSolusyon: `Assign unique ID values to each element, or switch to class="${attrVal}" for styling shared components.`,
                  w3cRule: 'W3C HTML5 Specification Section 3.2.5.1: Element ID Uniqueness Constraint.'
                });
              } else {
                idCounts[attrVal] = true;
              }
            }
          }
        }

        // Structural Attributes Checks
        if (openingTagName === 'link') {
          const hasRel = /\brel\s*=/i.test(rawAttrs);
          const hasHref = /\bhref\s*=/i.test(rawAttrs);
          if (!hasRel && !hasHref) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: 'Empty or Incomplete <link> Tag (Missing both "rel" and "href")',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: '<link rel="stylesheet" href="styles.css">',
              taglishBakit: 'Walang "rel" at "href" attributes ang <link> tag.',
              taglishDahilan: 'Ang <link> element ay walang silbi kung walang "rel" at "href" attributes ayon sa W3C HTML5 standard.',
              taglishEpekto: 'Hindi maglo-load ang external stylesheet o resource at ituturing itong validation error ng browser.',
              taglishSolusyon: 'Maglagay ng rel="stylesheet" at href="styles.css" sa loob ng <link> tag.',
              englishBakit: 'The <link> element is empty or missing both mandatory "rel" and "href" attributes.',
              englishDahilan: 'According to W3C/WHATWG standards, <link> elements require a relation specification (rel) and a destination URI (href).',
              englishEpekto: 'The browser cannot fetch or apply the external resource.',
              englishSolusyon: 'Specify rel="stylesheet" and href="styles.css" on the <link> tag.',
              w3cRule: 'W3C HTML5 Specification Section 4.2.4: The link element must specify rel and href.',
              autoFixType: 'replace_text',
              fixTarget: token.raw,
              fixReplacement: '<link rel="stylesheet" href="styles.css">'
            });
          } else if (!hasRel) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: 'Missing "rel" Attribute on <link> Tag',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('<link', '<link rel="stylesheet"'),
              taglishBakit: 'Walang "rel" attribute ang <link> tag.',
              taglishDahilan: 'Kailangan ang "rel" (relationship) upang malaman ng browser ang uri ng koneksyon tulad ng stylesheet.',
              taglishEpekto: 'Hindi gagamitin ng browser ang tinukoy na link bilang CSS stylesheet.',
              taglishSolusyon: 'Maglagay ng rel="stylesheet" sa loob ng <link> tag.',
              englishBakit: 'The <link> tag is missing a "rel" (relationship) attribute.',
              englishDahilan: 'W3C HTML5 specification mandates the "rel" attribute on <link> elements to define relationship.',
              englishEpekto: 'The external stylesheet will not be parsed or applied by the browser.',
              englishSolusyon: 'Add rel="stylesheet" to the <link> element.',
              w3cRule: 'W3C HTML5 Specification Section 4.2.4: The link element requires a rel attribute.'
            });
          } else if (!hasHref) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: 'Missing "href" Attribute on <link> Tag',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('<link', '<link href="styles.css"'),
              taglishBakit: 'Walang "href" attribute ang <link> tag.',
              taglishDahilan: 'Kailangan ang "href" upang ituro ang file path o URL ng external resource.',
              taglishEpekto: 'Walang maikakabit na file kaya walang epekto ang link.',
              taglishSolusyon: 'Maglagay ng href="..." sa <link> tag.',
              englishBakit: 'The <link> element is missing an "href" URL attribute.',
              englishDahilan: 'Without an href attribute, the <link> element has no resource destination.',
              englishEpekto: 'The link element performs no action and violates HTML5 syntax.',
              englishSolusyon: 'Add href="styles.css" specifying the resource path.',
              w3cRule: 'W3C HTML5 Specification Section 4.2.4: href attribute on link elements.'
            });
          }
        }

        if (openingTagName === 'img') {
          if (!/\bsrc\s*=/i.test(rawAttrs)) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: 'Missing Mandatory "src" Attribute on <img> Element',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('<img', '<img src="image.jpg"'),
              taglishBakit: 'Walang mandatory "src" attribute ang <img> tag.',
              taglishDahilan: 'Ayon sa W3C HTML5 standard, ang "src" attribute ay mandatory para sa bawat <img> tag upang malaman kung aling imahe ang dapat i-load.',
              taglishEpekto: 'Walang maipapakitang larawan ang browser at nagdudulot ito ng broken image placeholder.',
              taglishSolusyon: 'Maglagay ng src="image.png" sa loob ng <img> tag.',
              englishBakit: 'The <img> element is missing its mandatory "src" attribute.',
              englishDahilan: 'The HTML5 specification defines "src" as a required attribute on <img> elements to supply the image source address.',
              englishEpekto: 'Browsers render a broken empty frame and fire network error events.',
              englishSolusyon: 'Add a valid src="..." attribute pointing to the image file.',
              w3cRule: 'W3C HTML5 Specification Section 4.8.3: The img element must have a src attribute.'
            });
          }

          if (!/\balt\s*=/i.test(rawAttrs)) {
            issues.push({
              severity: 'warning',
              category: 'html',
              line: tagLine,
              title: 'Missing "alt" Attribute on <img> Tag',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('>', ' alt="Image description">'),
              taglishBakit: 'Walang "alt" (alternative text) attribute ang <img> tag.',
              taglishDahilan: 'Kailangan ang alt attribute upang ilarawan ang larawan para sa mga gumagamit ng screen reader at kapag nabigong mag-load ang larawan.',
              taglishEpekto: 'Bagsak ito sa accessibility compliance (WCAG 2.1 Success Criterion 1.1.1 Non-text Content).',
              taglishSolusyon: 'Magdagdag ng makabuluhang alt="..." attribute sa <img> tag (halimbawa: alt="Deskripsyon ng larawan").',
              englishBakit: 'The <img> element is missing an "alt" (alternative text) attribute.',
              englishDahilan: 'The alt attribute conveys essential meaning to screen readers and provides fallback text when images fail to load.',
              englishEpekto: 'Fails accessibility compliance audits (WCAG 2.1 Success Criterion 1.1.1 Non-text Content).',
              englishSolusyon: 'Add a descriptive alt="..." attribute to the <img> tag (e.g., alt="Description of image").',
              w3cRule: 'W3C WCAG 2.1 Success Criterion 1.1.1: Non-text Content Alternative Text.',
              autoFixType: 'add_img_alt'
            });
          }
        }

        if (openingTagName === 'a') {
          const hasHref = /\bhref\s*=/i.test(rawAttrs);
          if (!hasHref && !/\bid\s*=/i.test(rawAttrs) && !/\bname\s*=/i.test(rawAttrs)) {
            issues.push({
              severity: 'warning',
              category: 'html',
              line: tagLine,
              title: 'Missing "href" Attribute on Anchor (<a>) Link',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('<a', '<a href="#"'),
              taglishBakit: 'Walang "href" attribute ang <a> anchor tag.',
              taglishDahilan: 'Ang anchor <a> na walang href ay hindi maituturing na interactive hyperlink sa modernong HTML5.',
              taglishEpekto: 'Hindi ito maaaring ma-click o ma-navigate gamit ang keyboard tab, at walang normal na link behavior.',
              taglishSolusyon: 'Magdagdag ng href="#" o valid na destination URL sa <a> tag.',
              englishBakit: 'The anchor (<a>) element is missing a mandatory "href" attribute.',
              englishDahilan: 'Without an href attribute, an <a> element acts as a placeholder hyperlink rather than an interactive control.',
              englishEpekto: 'The element cannot be focused via keyboard navigation and lacks standard hyperlink behavior.',
              englishSolusyon: 'Add an href="..." attribute with a destination URL or anchor fragment.',
              w3cRule: 'W3C HTML5 Specification Section 4.5.1: The a element and href attribute.'
            });
          } else if (/\bhref=["']\s*["']/i.test(rawAttrs)) {
            issues.push({
              severity: 'warning',
              category: 'html',
              line: tagLine,
              title: 'Empty href Attribute in Anchor (<a>) Link',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: '<a href="#section">Link</a>',
              taglishBakit: 'Walang nakalagay na destination URL sa href="" attribute ng <a> anchor tag.',
              taglishDahilan: 'Kapag walang laman ang href, magre-refresh lamang ang kasalukuyang pahina kapag pinindot ito ng gumagamit.',
              taglishEpekto: 'Nagdudulot ito ng nakalilitong user experience at naitatala bilang dead o broken link ng web crawlers.',
              taglishSolusyon: 'Maglagay ng valid na web address (URL) o anchor bookmark link (halimbawa: href="#section").',
              englishBakit: 'The href attribute on this anchor (<a>) tag is completely empty.',
              englishDahilan: 'An empty href attribute causes the entire page to reload to the top when clicked by a user.',
              englishEpekto: 'Degrades user experience, disrupts application state, and generates dead-link warnings for SEO crawlers.',
              englishSolusyon: 'Provide a valid destination URL or an internal anchor bookmark (e.g., href="#section").',
              w3cRule: 'W3C HTML5 Anchor Element Specification: Valid Destination Reference.'
            });
          }

          if (/target=["']_blank["']/i.test(rawAttrs) && !/rel=["'][^"']*noopener[^"']*["']/i.test(rawAttrs)) {
            issues.push({
              severity: 'suggestion',
              category: 'html',
              line: tagLine,
              title: 'Suggestion: Add rel="noopener noreferrer" to target="_blank"',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: token.raw.replace('target="_blank"', 'target="_blank" rel="noopener noreferrer"'),
              taglishBakit: 'Naka-set sa target="_blank" ang external link nang walang rel="noopener noreferrer" attribute.',
              taglishDahilan: 'Kung walang rel="noopener", maaaring ma-access ng binuksang bagong tab ang orihinal na pahina gamit ang window.opener (reverse tabnabbing security vulnerability).',
              taglishEpekto: 'Nagdudulot ito ng posibleng security risk sa mas lumang browsers at nagpapababa ng audit performance scores.',
              taglishSolusyon: 'Idagdag ang rel="noopener noreferrer" attribute sa <a> tag.',
              englishBakit: 'The anchor link opens in a new tab via target="_blank" without specifying rel="noopener noreferrer".',
              englishDahilan: 'Without rel="noopener", the newly opened page can gain partial control over the originating window via window.opener (reverse tabnabbing).',
              englishEpekto: 'Exposes potential security vulnerabilities in legacy browsers and reduces Lighthouse audit performance.',
              englishSolusyon: 'Add rel="noopener noreferrer" to the anchor (<a>) tag.',
              w3cRule: 'W3C Web Application Security & Tabnabbing Prevention Guidelines.',
              autoFixType: 'add_rel_noopener'
            });
          }

          // Accessible Name Check
          const ariaLabel = (rawAttrs.match(/\baria-label=["']([^"']*)["']/i) || [])[1] || (rawAttrs.match(/\btitle=["']([^"']*)["']/i) || [])[1];
          const afterOpen = token.index + token.raw.length;
          const closeIdx = code.toLowerCase().indexOf('</a>', afterOpen);
          if (closeIdx !== -1) {
            const innerSnippet = code.slice(afterOpen, closeIdx);
            const hasImgAlt = /<img\b(?=[^>]*\balt=["'][^"']+["'])/i.test(innerSnippet);
            const hasAria = /aria-label=["'][^"']+["']/i.test(innerSnippet);
            const textOnly = innerSnippet.replace(/<[^>]*>/g, '').trim();
            if (!textOnly && !ariaLabel && !hasImgAlt && !hasAria) {
              issues.push({
                severity: 'warning',
                category: 'accessibility',
                line: tagLine,
                title: 'Empty <a> Anchor Link with No Accessible Text',
                snippet: token.raw,
                badCode: '<a href="..."></a>',
                goodCode: '<a href="...">Descriptive Link Text</a>',
                taglishBakit: 'Walang nakasulat na text, aria-label, o imahe na may alt text sa loob ng <a> anchor link.',
                taglishDahilan: 'Kailangan ng mga gumagamit ng screen reader at visual users ang malinaw na accessible name para malaman kung ano ang link.',
                taglishEpekto: 'Walang clickable area ang link at hindi maipapaliwanag ng assistive technology ang patutunguhan nito.',
                taglishSolusyon: 'Maglagay ng malinaw na pangalan o text sa loob ng <a>...</a>.',
                englishBakit: 'The anchor (<a>) link contains no textual label, aria-label, or image with alt text across its lines.',
                englishDahilan: 'WCAG 2.1 requires all interactive link elements to provide a meaningful accessible name.',
                englishEpekto: 'The link provides zero clickable target area and screen readers cannot announce its destination.',
                englishSolusyon: 'Add descriptive text, an aria-label, or an image with an alt attribute inside the link.',
                w3cRule: 'W3C WCAG 2.1 Success Criterion 4.1.2: Name, Role, Value.'
              });
            }
          }
        }

        // Form Input Accessible Label Check
        if (openingTagName === 'input' || openingTagName === 'textarea' || openingTagName === 'select') {
          const inputType = (rawAttrs.match(/\btype=["']([^"']*)["']/i) || [])[1] || 'text';
          const isIgnoredType = ['hidden', 'submit', 'button', 'reset', 'image'].includes(inputType.toLowerCase());
          if (!isIgnoredType) {
            const hasAria = /aria-label=["'][^"']+["']|aria-labelledby=["'][^"']+["']/i.test(rawAttrs);
            const inputId = (rawAttrs.match(/\bid=["']([^"']*)["']/i) || [])[1];
            const hasAssociatedLabel = inputId && new RegExp(`<label\\b[^>]*\\bfor=["']${inputId}["']`, 'i').test(code);
            let insideLabel = false;
            for (let s = tagStack.length - 1; s >= 0; s--) {
              if (tagStack[s].tag === 'label') { insideLabel = true; break; }
            }

            if (!hasAria && !hasAssociatedLabel && !insideLabel) {
              issues.push({
                severity: 'warning',
                category: 'accessibility',
                line: tagLine,
                title: `Missing Accessible Label on <${openingTagName}> Form Field`,
                snippet: token.raw,
                badCode: token.raw,
                goodCode: inputId 
                  ? `<label for="${inputId}">Label Name</label>\n${token.raw}` 
                  : `<label>Label Name ${token.raw}</label>`,
                taglishBakit: `Walang nakakabit na <label> o aria-label sa <${openingTagName}> form input mo.`,
                taglishDahilan: 'Kailangan ng screen readers ang label para maipaliwanag kung anong impormasyon ang hinihingi sa user.',
                taglishEpekto: 'Bumabagsak ito sa WCAG accessibility criteria (Labels or Instructions).',
                taglishSolusyon: `Maglagay ng <label for="..."> o aria-label="Pangalan" sa input.`,
                englishBakit: `The <${openingTagName}> form field lacks an accessible name or associated <label>.`,
                englishDahilan: 'Form inputs require a programmatic label so assistive technologies can describe the field.',
                englishEpekto: 'Fails WCAG 2.1 Success Criterion 3.3.2 (Labels or Instructions).',
                englishSolusyon: `Add an associated <label for="..."> or an aria-label="..." attribute.`,
                w3cRule: 'W3C WCAG 2.1 Success Criterion 3.3.2: Labels or Instructions.'
              });
            }
          }
        }

        // Empty <button> Check
        if (openingTagName === 'button') {
          const btnAria = (rawAttrs.match(/\baria-label=["']([^"']*)["']/i) || [])[1] || (rawAttrs.match(/\btitle=["']([^"']*)["']/i) || [])[1];
          const afterBtnOpen = token.index + token.raw.length;
          const closeBtnIdx = code.toLowerCase().indexOf('</button>', afterBtnOpen);
          if (closeBtnIdx !== -1) {
            const innerBtnSnippet = code.slice(afterBtnOpen, closeBtnIdx);
            const hasText = innerBtnSnippet.replace(/<[^>]*>/g, '').trim();
            const hasAriaInside = /aria-label=["'][^"']+["']/i.test(innerBtnSnippet);
            if (!hasText && !btnAria && !hasAriaInside) {
              issues.push({
                severity: 'warning',
                category: 'accessibility',
                line: tagLine,
                title: 'Empty <button> with No Accessible Text or Name',
                snippet: token.raw,
                badCode: token.raw + innerBtnSnippet + '</button>',
                goodCode: `<button aria-label="Action Name">${innerBtnSnippet}</button>`,
                taglishBakit: 'Walang text o aria-label sa loob ng <button> element.',
                taglishDahilan: 'Kailangan ng screen reader users ang pangalan ng button para malaman kung anong aksyon ang gagawin nito.',
                taglishEpekto: 'Ituturing itong unlabelled button sa accessibility tree ng browser.',
                taglishSolusyon: 'Maglagay ng text o magdagdag ng aria-label="..." sa button.',
                englishBakit: 'The <button> element has no accessible text, aria-label, or title.',
                englishDahilan: 'Interactive buttons require an accessible name so assistive devices can announce their purpose.',
                englishEpekto: 'Fails WCAG 2.1 Criterion 4.1.2 (Name, Role, Value).',
                englishSolusyon: 'Provide button text content or an aria-label="..." attribute.',
                w3cRule: 'W3C WCAG 2.1 Success Criterion 4.1.2: Name, Role, Value.'
              });
            }
          }
        }

        if (/^h[1-6]$/.test(openingTagName)) {
          const currentHLevel = parseInt(openingTagName.slice(1), 10);
          if (currentHLevel === 1 && headingLevels.includes(1)) {
            issues.push({
              severity: 'warning',
              category: 'html',
              line: tagLine,
              title: 'Multiple <h1> Elements in Document',
              snippet: token.raw,
              badCode: token.raw,
              goodCode: `<h2>...</h2>`,
              taglishBakit: 'Mayroong higit sa isang <h1> heading sa dokumento.',
              taglishDahilan: 'Inirerekomenda ng W3C at SEO standards na isa lamang ang pangunahing <h1> tag bawat pahina upang malinaw ang outline ng dokumento.',
              taglishEpekto: 'Nagiging magulo ang heading structure para sa mga gumagamit ng screen reader.',
              taglishSolusyon: 'Gawing <h2> o mas mababang heading level ang pangalawang <h1>.',
              englishBakit: 'More than one <h1> element was found in the document.',
              englishDahilan: 'Accessibility guidelines recommend having only one primary <h1> per document to define the main page topic.',
              englishEpekto: 'Confuses document outline navigation for assistive technology users.',
              englishSolusyon: 'Use <h2> through <h6> for subsequent section headings.',
              w3cRule: 'W3C Accessibility WCAG 2.1 Technique G141: Organizing a page using headings.'
            });
          } else if (headingLevels.length > 0) {
            const prevHLevel = headingLevels[headingLevels.length - 1];
            if (currentHLevel > prevHLevel + 1) {
              issues.push({
                severity: 'suggestion',
                category: 'html',
                line: tagLine,
                title: `Skipped Heading Level: <h${prevHLevel}> to <h${currentHLevel}>`,
                snippet: token.raw,
                badCode: `<h${prevHLevel}>...</h${prevHLevel}>\n<h${currentHLevel}>...</h${currentHLevel}>`,
                goodCode: `<h${prevHLevel}>...</h${prevHLevel}>\n<h${prevHLevel + 1}>...</h${prevHLevel + 1}>`,
                taglishBakit: `Lumaktaw ang heading level mula <h${prevHLevel}> diretso sa <h${currentHLevel}> nang hindi dumaan sa <h${prevHLevel + 1}>.`,
                taglishDahilan: 'Dapat sunud-sunod ang antas ng mga heading para sa maayos na visual at semantic hierarchy.',
                taglishEpekto: 'Nagbibigay ito ng babala sa accessibility audits (WCAG 1.3.1).',
                taglishSolusyon: `Gamitin ang tamang kasunod na antas na <h${prevHLevel + 1}>.`,
                englishBakit: `The heading hierarchy skipped a level from <h${prevHLevel}> directly to <h${currentHLevel}>.`,
                englishDahilan: 'Headings should follow a structured sequence without missing intermediate tiers.',
                englishEpekto: 'Triggers accessibility audit flags under WCAG 1.3.1 (Info and Relationships).',
                englishSolusyon: `Change <h${currentHLevel}> to <h${prevHLevel + 1}> to preserve hierarchical order.`,
                w3cRule: 'W3C WCAG 2.1 Success Criterion 1.3.1: Heading Hierarchy.'
              });
            }
          }
          headingLevels.push(currentHLevel);
        }

        // Nesting constraints against immediate parent
        if (tagStack.length > 0) {
          const currentParent = tagStack[tagStack.length - 1];

          if (currentParent.tag === 'p' && BB.BLOCK_ELEMENTS.has(openingTagName)) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Invalid Nesting: Block Element <${openingTagName}> inside <p> Paragraph`,
              snippet: token.raw,
              badCode: `<p>\n  <${openingTagName}>...</${openingTagName}>\n</p>`,
              goodCode: `<div>\n  <p>...</p>\n  <${openingTagName}>...</${openingTagName}>\n</div>`,
              taglishBakit: `Naglagay ka ng block-level container (<${openingTagName}>) sa loob ng <p> paragraph element.`,
              taglishDahilan: 'Ayon sa W3C content model, ang <p> tag ay para lamang sa phrasing (inline) content.',
              taglishEpekto: 'Awtomatikong puputulin at isasara ng browser ang <p> tag bago ang block element, na sumisira sa layout.',
              taglishSolusyon: `Ilipat ang <${openingTagName}> sa labas ng <p> tag, o palitan ito ng inline element tulad ng <span>.`,
              englishBakit: `A block-level element (<${openingTagName}>) was placed directly inside a <p> paragraph tag.`,
              englishDahilan: 'The W3C HTML5 specification strictly restricts paragraphs to phrasing (inline) content models.',
              englishEpekto: 'The browser parser prematurely closes the <p> element, breaking the intended DOM tree structure.',
              englishSolusyon: `Move <${openingTagName}> outside of the <p> element, or use an inline element like <span>.`,
              w3cRule: 'W3C HTML5 Content Model: Paragraphs strictly permit Phrasing Content only.'
            });
          }

          if (currentParent.tag === 'span' && BB.BLOCK_ELEMENTS.has(openingTagName)) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Invalid Nesting: Block Element <${openingTagName}> inside inline <span>`,
              snippet: token.raw,
              badCode: `<span><${openingTagName}>...</${openingTagName}></span>`,
              goodCode: `<div><${openingTagName}>...</${openingTagName}></div>`,
              taglishBakit: `Naglagay ka ng block element na <${openingTagName}> sa loob ng inline <span> tag.`,
              taglishDahilan: 'Ang <span> ay inline element at hindi maaaring maglaman ng block-level containers.',
              taglishEpekto: 'Sumisira sa CSS layout flow at nagdudulot ng rendering bugs.',
              taglishSolusyon: `Palitan ang <span> ng <div> o ilabas ang <${openingTagName}>.`,
              englishBakit: `A block element (<${openingTagName}>) is nested inside an inline <span> tag.`,
              englishDahilan: 'Inline elements cannot contain block-level children in W3C HTML5.',
              englishEpekto: 'Breaks inline formatting context and corrupts DOM flow.',
              englishSolusyon: `Replace <span> with a block container like <div>.`,
              w3cRule: 'W3C HTML5 Phrasing Content Rules.'
            });
          }

          if ((currentParent.tag === 'a' || currentParent.tag === 'button') && (openingTagName === 'a' || openingTagName === 'button')) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Invalid Nesting: Interactive <${openingTagName}> inside <${currentParent.tag}>`,
              snippet: token.raw,
              badCode: `<${currentParent.tag}><${openingTagName}>...</${openingTagName}></${currentParent.tag}>`,
              goodCode: `<${currentParent.tag}>...</${currentParent.tag}> <${openingTagName}>...</${openingTagName}>`,
              taglishBakit: `Naglagay ka ng interactive element (<${openingTagName}>) sa loob ng isa pang interactive element (<${currentParent.tag}>).`,
              taglishDahilan: 'Mahigpit na ipinagbabawal ng W3C standard ang pagpupugad ng mga interactive click elements sa isa\'t isa.',
              taglishEpekto: 'Nagdudulot ng matinding keyboard accessibility bugs at hindi nahuhulaang click event handling.',
              taglishSolusyon: `Paghiwalayin ang <${openingTagName}> at <${currentParent.tag}>.`,
              englishBakit: `An interactive element (<${openingTagName}>) is nested inside another interactive element (<${currentParent.tag}>).`,
              englishDahilan: 'The HTML5 specification explicitly forbids nested interactive content.',
              englishEpekto: 'Causes severe focus trap issues, keyboard navigation failures, and conflicting click handlers.',
              englishSolusyon: 'Separate the elements so they are siblings rather than nested.',
              w3cRule: 'W3C HTML5 Specification Section 3.2.5.2.7: Interactive Content Nesting Constraints.'
            });
          }

          // List Content Model
          if ((currentParent.tag === 'ul' || currentParent.tag === 'ol') && !['li', 'script', 'template'].includes(openingTagName)) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Invalid List Child: <${openingTagName}> directly inside <${currentParent.tag}>`,
              snippet: token.raw,
              badCode: `<${currentParent.tag}><${openingTagName}>...</${openingTagName}></${currentParent.tag}>`,
              goodCode: `<${currentParent.tag}><li><${openingTagName}>...</${openingTagName}></li></${currentParent.tag}>`,
              taglishBakit: `Tanging <li> lamang ang pinapayagang maging direktang anak ng <${currentParent.tag}> list.`,
              taglishDahilan: 'Ayon sa W3C HTML5 Content Model, ang mga listahan ay dapat direktang naglalaman ng list items (<li>).',
              taglishEpekto: 'Masisira ang accessibility navigation ng mga screen readers.',
              taglishSolusyon: `Ibalot ang <${openingTagName}> sa loob ng <li>...</li>.`,
              englishBakit: `Only <li> elements are permitted as direct children of <${currentParent.tag}>.`,
              englishDahilan: 'W3C list content models require list items to be directly wrapped in <li>.',
              englishEpekto: 'Screen readers fail to announce proper list item counts.',
              englishSolusyon: `Wrap the <${openingTagName}> element inside an <li> container.`,
              w3cRule: 'W3C HTML5 Specification: List Content Model.'
            });
          }

          // Table Content Model
          if (currentParent.tag === 'table' && !['caption', 'colgroup', 'col', 'thead', 'tbody', 'tfoot', 'tr', 'script', 'template'].includes(openingTagName)) {
            issues.push({
              severity: 'error',
              category: 'html',
              line: tagLine,
              title: `Invalid Table Child: <${openingTagName}> directly inside <table>`,
              snippet: token.raw,
              badCode: `<table><${openingTagName}>...</table>`,
              goodCode: `<table><tr><td><${openingTagName}>...</td></tr></table>`,
              taglishBakit: `Bawal ang direktang <${openingTagName}> sa loob ng <table>.`,
              taglishDahilan: 'Kailangan ng standard tabular structure (tulad ng <tr> at <td>) sa loob ng <table>.',
              taglishEpekto: 'Maaaring i-foster parent ng browser ang element palabas ng table.',
              taglishSolusyon: 'Ilagay sa loob ng <tr><td> ang nilalaman.',
              englishBakit: `Direct children of <table> must be table structural containers or <tr>.`,
              englishDahilan: 'HTML table content model requires tabular cell containers.',
              englishEpekto: 'Browsers force foster-parenting of content outside the table.',
              englishSolusyon: 'Place content within standard <tr><td> cells.',
              w3cRule: 'W3C HTML5 Specification: Table Content Model.'
            });
          }
        }

        // Push non-void element to stack
        if (!BB.VOID_ELEMENTS.has(openingTagName)) {
          if (isSelfClosing) {
            issues.push({
              severity: 'warning',
              category: 'html',
              line: tagLine,
              title: `Invalid Self-Closing Syntax on Non-Void Element: <${openingTagName}/>`,
              snippet: token.raw,
              badCode: token.raw,
              goodCode: `<${openingTagName}></${openingTagName}>`,
              taglishBakit: `Gumamit ka ng self-closing syntax na "/>" sa non-void element na <${openingTagName}/>.`,
              taglishDahilan: 'Sa HTML5, tanging ang mga void elements (tulad ng <img>, <br>, <input>) lamang ang pinapayagang mag-self close.',
              taglishEpekto: 'Ituturing ito ng browser bilang regular na opening tag at hahanapin ang kapares na closing tag.',
              taglishSolusyon: `Maglagay ng pormal na closing tag na </${openingTagName}>.`,
              englishBakit: `Self-closing syntax ("/>") was used on the non-void element <${openingTagName}/>.`,
              englishDahilan: 'In standard HTML5, self-closing tags are only recognized on void elements.',
              englishEpekto: 'The browser treats it as a standard opening tag and expects an explicit </${openingTagName}> end tag.',
              englishSolusyon: `Use standard opening and closing tags: <${openingTagName}></${openingTagName}>.`,
              w3cRule: 'W3C HTML5 Specification Section 8.1.2: Elements and Void Elements.'
            });
          }

          tagStack.push({
            tag: openingTagName,
            line: tagLine,
            raw: token.raw
          });
        }
      }
    }

    // 4. CHECK UNCLOSED TAGS REMAINING ON STACK
    while (tagStack.length > 0) {
      const unclosedTag = tagStack.pop();
      if (BB.OPTIONAL_CLOSE_TAGS.has(unclosedTag.tag)) {
        continue;
      }
      issues.push({
        severity: 'error',
        category: 'html',
        line: unclosedTag.line,
        title: `Unclosed HTML Tag: <${unclosedTag.tag}> (Missing </${unclosedTag.tag}>)`,
        snippet: unclosedTag.raw,
        badCode: `${unclosedTag.raw}\n... (Document ended without closing tag)`,
        goodCode: `${unclosedTag.raw}\n...\n</${unclosedTag.tag}>`,
        taglishBakit: `Ang element na <${unclosedTag.tag}> na binuksan sa Linya ${unclosedTag.line} ay hindi kailanman naisara sa buong dokumento.`,
        taglishDahilan: 'Lahat ng non-void HTML tags ay dapat may katumbas na closing tag </' + unclosedTag.tag + '> upang maging valid ayon sa W3C standards.',
        taglishEpekto: 'Sinisira nito ang kabuuang DOM tree ng page at maaaring magdulot ng sira sa layout ng buong website.',
        taglishSolusyon: `Magdagdag ng closing tag na </${unclosedTag.tag}> kung saan dapat magtapos ang element.`,
        englishBakit: `The opening tag <${unclosedTag.tag}> on line ${unclosedTag.line} was never closed before the end of the document.`,
        englishDahilan: 'All non-void HTML elements require a matching end tag according to official W3C standards.',
        englishEpekto: 'Corrupts the DOM tree, causing styles and scripts to bleed into subsequent sections.',
        englishSolusyon: `Add a closing </${unclosedTag.tag}> tag where the element should terminate.`,
        w3cRule: 'W3C HTML5 Specification Section 8.2: Tree Construction & Mandatory End Tags.',
        autoFixType: 'close_unclosed_tag',
        unclosedTag: unclosedTag.tag
      });
    }

    // 5. RUN EMBEDDED CSS BLOCKS WITH COLLECTED HTML CONTEXT
    pendingStyles.forEach(s => {
      BB.analyzeCSSBlock(s.content, s.lineOffset, true, issues, getLineNumber, { htmlClasses, htmlIds });
    });

    issues.sort((a, b) => a.line - b.line);
    return issues;
  };

})(window.BugBuster);
