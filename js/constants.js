/**
 * BugBuster 9.0 - Constants, Dictionaries & Test Suites
 * Pure Standalone Offline - Zero External Dependencies
 */
window.BugBuster = window.BugBuster || {};

(function(BB) {
  'use strict';

  BB.SAMPLE_CSS_BUGGY = `/* ========================================================
   Deliberate Buggy CSS Suite - W3C Diagnostic Testing
   ======================================================== */

// comment
:root {
  --primary-color: #38bdf8;
  --max-width: 1200px;
}


#header #nav #menu .nav-item .nav-link:hover {
  
  color: var(--primary-color);
}

a :hover {
  
  text-decoration: underline;
}


.badge:before {
  content: "★";
  display: inline-block;
}


.hero-card {
  backgroud-color: #f8fafc; 
  padding: 20px
  border-radius: 12px; 
  widht: 100%; 
  display: fle;
  margin: 10fl;
  width: 20x;
  font-sizee: 18px; 
}


.container {
  margin: 15; 
  padding-left: -10px; 
  width: 1400px; 
}


.tag-label {
  display: inline;
  width: 150px; 
  height: 40px; 
  margin-top: 15px; 
}

.floating-badge {
  position: static;
  z-index: 999; 
  color: #xyz999; 
}


.flex-item {
  display: flex;
  justify-content: center;
  float: left; 
}


body {
  font-family: Arial; 
  line-height: 1.6;
  color: #0f172a !important; 
}


.custom-box {
  -webkit-border-radius: 8px; 
  backdrop-filter: blur(10px);
}


.button-primary {
  background-color: #0284c7;
  color: #ffffff;
  background-color: #0369a1; 
}

.calc-box {
  width: calc(100%-30px); 
  max-height: calc(100vh - 40px; 
}`;

  BB.SAMPLE_CSS_CLEAN = `/* ========================================================
   Clean, Fully Compliant W3C CSS3 & CSS4 Stylesheet
   ======================================================== */

:root {
  --color-primary: #0284c7;
  --color-accent: #38bdf8;
  --color-surface: #0f172a;
  --color-card: #1e293b;
  --color-text: #f8fafc;
  --radius-md: 8px;
  --space-md: 16px;
}

/* 1. Modern Reset with Box Sizing */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-surface);
  min-height: 100vh;
}

/* 2. Responsive Container with clamp() */
.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-md);
}

/* 3. Balanced Selector Specificity */
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  background-color: var(--color-card);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: 24px;
}

.card-title {
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 700;
  color: #ffffff;
}

/* 4. Correct Modern Pseudo-Elements & Positioning */
.badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background-color: rgba(56, 189, 248, 0.15);
  color: var(--color-accent);
}

.badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--color-accent);
}

/* 5. Cross-Browser Glassmorphism with Webkit Prefix */
.glass-header {
  position: sticky;
  top: 0;
  z-index: 50;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  background-color: rgba(15, 23, 42, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 6. Mobile Responsive Media Query */
@media (max-width: 768px) {
  .card {
    padding: 16px;
  }
}`;

  BB.SAMPLE_HTML_BUGGY = `<!DOCTYPE html>
<html>
<head>
  <title>Buggy HTML Test Page</title>
  <link>
</head>
<body>
  <div id="main-header">
    <img src="banner.jpg"></img> 
    <img alt="Missing src attribute">
    <h1>Welcome to BugBuster 9.0</div> 
  </div>

  <p>
    This is an inline paragraph.
    <div>Invalid Block Inside Paragraph</div>
  </p>

  <a>Missing href attribute</a>
  <a href="">Empty Link</a>
  <a href="https://example.com" target="_blank">External Link</a>
  <div id="duplicate-id">Card 1</div>
  <div id="duplicate-id">Card 2</div> 

  <form>
    <input type="text" placeholder="Enter your name">
    <button><svg width="14" height="14"></svg></button>
  </form>
</body>
</html>`;

  BB.SAMPLE_HTML_CLEAN = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean W3C Compliant Page</title>
</head>
<body>
  <header id="main-header">
    <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300" alt="Colorful Abstract Gradient Banner" width="200" height="60">
    <h1>Welcome to Clean Standards</h1>
  </header>

  <main class="card">
    <p>This is a completely clean, semantic, and W3C compliant document.</p>
    <a href="https://w3.org" target="_blank" rel="noopener noreferrer">Visit W3C Official Website</a>
  </main>
</body>
</html>`;

  BB.SAMPLE_FULL_BUGGY = `<!DOCTYPE html>
<html>
<head>
  <title>BugBuster 9.0 Test Page</title>
  <link>
  <style>
    /* CSS Gap 1 & 2: Misspelled property, invalid keyword, and invalid measurement unit */
    .hero-banner {
      widht: 100%;
      display: fle;
      margin: 10fl;
      width: 20x;
    }

    /* CSS Gap 3: Case-sensitivity mismatch (.Button vs class="button") */
    .Button {
      color: #ffffff;
      background-color: #0284c7;
      padding: 10px 16px;
    }

    #Main-Header {
      color: #ff9000;
      font-size: 24px;
    }

    /* Unreferenced CSS selector */
    .unused-widget {
      opacity: 0.8;
    }

    /* CSS Gap 4: Missing semicolon & double colons */
    .card {
      backgroud-color: #f0f0f0;
      padding: 15px
      border-radius: 8px;
      color:: #334155;
    }

    /* CSS Gap 6: Unclosed parenthesis & bad calc spacing */
    .tag {
      display: inline;
      width: calc(100%-20px);
      max-height: calc(100vh - 40px;
    }
  </style>
</head>
<body>
  <!-- HTML Gap 3: Element missing mandatory structural attributes -->
  <div id="main-header">
    <img alt="Missing src image">
    <h1>Welcome to BugBuster 9.0</div> 
  </div>

  <p>
    This is an inline paragraph.
    <div>Invalid Block Inside Paragraph</div> 
  </p>

  <!-- HTML Gap 3: Anchor without href, Button with case mismatch -->
  <a>Incomplete anchor without href</a>
  <button class="button">Case Mismatch Button</button>

  <div id="duplicate-id">Card 1</div>
  <div id="duplicate-id">Card 2</div>

  <form>
    <input type="text" placeholder="Enter name">
    <button><svg width="12" height="12"></svg></button>
  </form>
</body>
</html>`;

  BB.SAMPLE_FULL_CLEAN = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clean W3C Compliant Document</title>
  <style>
    /* Clean, fully standard CSS */
    #main-header {
      color: #ff9000;
      font-size: 24px;
      margin: 10px;
    }
    .card {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <header id="main-header">
    <img src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300" alt="Colorful Abstract Gradient Banner" width="200" height="60">
    <h1>Welcome to Clean Standards</h1>
  </header>

  <main class="card">
    <p>This is a completely clean, semantic, and W3C compliant document.</p>
    <a href="https://w3.org" target="_blank" rel="noopener noreferrer">Visit W3C Official Website</a>
  </main>
</body>
</html>`;

  BB.MISTAKES_DATA = [
    {
      id: 'mistake-void-closing',
      title: "Closing Tags on Void Elements (/img, /br, /input)",
      titleEn: "Closing Tags on Void Elements (/img, /br, /input)",
      category: "html",
      bad: '<img src="logo.png"></img>',
      good: '<img src="logo.png" alt="Logo">',
      reasonTl: "Kasi sa HTML5, ang void elements tulad ng <img>, <br>, at <input> ay walang laman sa loob, kaya hindi na kailangan lagyan ng separate closing tag tulad ng </img>.",
      reasonEn: "Void elements like <img>, <br>, and <input> cannot hold inner text or children, so they do not take a closing tag like </img>.",
      rule: "W3C HTML5 Specification Section 4.3 (Void Elements)"
    },
    {
      id: 'mistake-block-in-inline',
      title: "Block Element Inside Inline Element (div inside p or span)",
      titleEn: "Block Element Inside Inline Element (div inside p or span)",
      category: "html",
      bad: '<p>Welcome!\n  <div>Special announcement</div>\n</p>',
      good: '<div>\n  <p>Welcome!</p>\n  <div>Special announcement</div>\n</div>',
      reasonTl: "Ang <p> at <span> ay inline text elements. Hindi sila pwedeng lagyan ng malalaking block container tulad ng <div> sa loob.",
      reasonEn: "Tags like <p> and <span> are inline elements and cannot wrap block-level containers like <div>.",
      rule: "W3C Content Model: Phrasing Content Rules"
    },
    {
      id: 'mistake-css-comment',
      title: "Single-line // Comments in Standard CSS",
      titleEn: "Single-line // Comments in Standard CSS",
      category: "css",
      bad: '.card {\n  // Ito ay comment (Invalid sa CSS!)\n  margin: 10px;\n}',
      good: '.card {\n  /* Ito ang tamang CSS comment */\n  margin: 10px;\n}',
      reasonTl: "Bawal ang // comment sa standard CSS. Pang-JavaScript o SCSS lang yan! Sa CSS, gamitin ang /* comment */.",
      reasonEn: "Double slash // comments only work in JavaScript or SCSS. In standard CSS, always use /* comment */.",
      rule: "W3C CSS Syntax Level 3 Section 4.1"
    },
    {
      id: 'mistake-css-semicolon',
      title: "Missing CSS Semicolon (;)",
      titleEn: "Missing CSS Semicolon (;)",
      category: "css",
      bad: '.button {\n  background: #38bdf8\n  color: #ffffff;\n}',
      good: '.button {\n  background: #38bdf8;\n  color: #ffffff;\n}',
      reasonTl: "Kapag nakalimutan mo ang semicolon (;) sa dulo ng property, pagdidikitin ng browser ang dalawang linya kaya parehong hindi gagana ang styles mo.",
      reasonEn: "Without a semicolon (;) at the end of the line, the browser merges this rule with the next line and breaks both styles.",
      rule: "W3C CSS Declaration Separators"
    },
    {
      id: 'mistake-css-unit',
      title: "Missing Units on Non-Zero Numbers (margin: 10)",
      titleEn: "Missing Units on Non-Zero Numbers (margin: 10)",
      category: "css",
      bad: '.box {\n  margin: 10;\n  padding: 20;\n}',
      good: '.box {\n  margin: 10px;\n  padding: 20px;\n}',
      reasonTl: "Kailangan may unit (tulad ng px, rem, o %) ang bawat non-zero number sa CSS. Tanging ang 0 lang ang pwedeng walang unit.",
      reasonEn: "In CSS, every non-zero number needs a measurement unit like px, rem, or %. Only 0 can be written without a unit.",
      rule: "W3C CSS Values and Units Level 3"
    },
    {
      id: 'mistake-inline-dimensions',
      title: "Conflict: Width / Height on display: inline Elements",
      titleEn: "Conflict: Width / Height on display: inline Elements",
      category: "css",
      bad: 'span.badge {\n  display: inline;\n  width: 120px; /* Ignored! */\n  height: 40px;  /* Ignored! */\n}',
      good: 'span.badge {\n  display: inline-block;\n  width: 120px;\n  height: 40px;\n}',
      reasonTl: "Hindi gagana ang width o height kapag naka display: inline ang element. Kung gusto mo itakda ang laki nito, gawin mo itong display: inline-block o block.",
      reasonEn: "Inline elements ignore width and height properties. Change the display to inline-block or block to set custom dimensions.",
      rule: "W3C CSS Box Model Level 3 Section 3 (Inline-level Boxes)"
    },
    {
      id: 'mistake-zindex-static',
      title: "Conflict: z-index on position: static Elements",
      titleEn: "Conflict: z-index on position: static Elements",
      category: "css",
      bad: '.modal-overlay {\n  position: static; /* o default */\n  z-index: 1000;    /* Walang epekto! */\n}',
      good: '.modal-overlay {\n  position: relative; /* o absolute/fixed */\n  z-index: 1000;\n}',
      reasonTl: "Hindi gagana ang z-index kapag naka position: static (o default). Magdagdag ng position: relative para gumana ang stacking layer nito.",
      reasonEn: "The z-index property only works on positioned elements. Add position: relative to activate stacking layers.",
      rule: "W3C CSS Positioned Layout Module Level 3 Section 4"
    },
    {
      id: 'mistake-pseudo-spacing',
      title: "Space before Pseudo-Class Bug (a :hover vs a:hover)",
      titleEn: "Space before Pseudo-Class Bug (a :hover vs a:hover)",
      category: "css",
      bad: '/* Mali: May space bago ang :hover */\na :hover {\n  color: #38bdf8;\n}',
      good: '/* Tama: Walang space */\na:hover {\n  color: #38bdf8;\n}',
      reasonTl: "Kapag may space sa pagitan ng element at :hover (tulad ng a :hover), aakalain ng browser na anak sa loob ng 'a' ang hinahanap mo sa halip na mismong link.",
      reasonEn: "A space before :hover makes it look for child elements inside rather than applying hover to the element itself.",
      rule: "W3C CSS Selectors Level 4 Section 3.1"
    },
    {
      id: 'mistake-font-fallback',
      title: "Missing Generic Font-Family Fallback",
      titleEn: "Missing Generic Font-Family Fallback",
      category: "css",
      bad: 'body {\n  font-family: Arial; /* Walang generic fallback! */\n}',
      good: 'body {\n  font-family: Arial, sans-serif; /* May fallback */\n}',
      reasonTl: "Dapat laging may generic fallback (sans-serif, serif, monospace) para kung wala ang font sa device ng user ay tama pa rin ang uri.",
      reasonEn: "Always supply a generic font family keyword (sans-serif, serif, monospace) as the final fallback in the font stack.",
      rule: "W3C CSS Fonts Module Level 4 Section 5"
    },
    {
      id: 'mistake-property-typo',
      title: "Common CSS Property Typos (e.g. backgroud-color)",
      titleEn: "Common CSS Property Typos (e.g. backgroud-color)",
      category: "css",
      bad: '.card {\n  backgroud-color: #38bdf8; /* Typo! */\n  widht: 100%;             /* Typo! */\n}',
      good: '.card {\n  background-color: #38bdf8;\n  width: 100%;\n}',
      reasonTl: "Kapag may typo sa spelling ng CSS property name, tahimik lang itong babalewalain ng browser kaya hindi lilitaw ang style mo.",
      reasonEn: "Browsers silently ignore misspelled CSS properties, causing your styles not to show up.",
      rule: "W3C CSS Cascading and Inheritance: Valid Property Identifiers"
    },
    {
      id: 'mistake-duplicate-id',
      title: "Duplicate Element ID Attributes",
      titleEn: "Duplicate Element ID Attributes",
      category: "html",
      bad: '<div id="header">Header 1</div>\n<div id="header">Header 2</div>',
      good: '<div id="header-top">Header 1</div>\n<div id="header-bottom">Header 2</div>',
      reasonTl: "Dapat unique ang bawat id sa buong HTML document. Kapag duplicate, magkakagulo ang CSS selectors at JavaScript functions mo.",
      reasonEn: "Element IDs must be unique across the entire page to prevent JavaScript and selector conflicts.",
      rule: "W3C HTML5 ID Uniqueness Requirement"
    },
    {
      id: 'mistake-img-alt',
      title: "Missing alt Attribute on <img> Tag",
      titleEn: "Missing alt Attribute on <img> Tag",
      category: "html",
      bad: '<img src="profile.jpg">',
      good: '<img src="profile.jpg" alt="User Profile Photo">',
      reasonTl: "Mahalaga ang alt text para malaman ng screen reader users at ng mga estudyante kung ano ang picture kapag mabagal ang net o sira ang image URL.",
      reasonEn: "The alt attribute is needed on <img> elements so screen readers can announce the image description and users know what it is if it fails to load.",
      rule: "WCAG 2.1 Guideline 1.1 Non-text Content & W3C HTML5 <img> Spec"
    }
  ];

  BB.TEMPLATES_DATA = [
    {
      title: "HTML5 Semantic Boilerplate",
      desc: "Clean starter with header, nav, main, article, and footer.",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Semantic HTML5 Layout</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f8fafc; color: #1e293b; }
    header { background: #0284c7; color: white; padding: 1rem 2rem; border-radius: 8px; }
    main { margin-top: 20px; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    footer { margin-top: 20px; text-align: center; color: #64748b; font-size: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <h1>My Semantic Website</h1>
    <nav><a href="#about" style="color:white;">About</a></nav>
  </header>
  <main>
    <article>
      <h2>Article Title</h2>
      <p>Clean and accessible semantic structure.</p>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 Semantic Web Design</p>
  </footer>
</body>
</html>`
    },
    {
      title: "Responsive Card Layout",
      desc: "Modern flexbox card component with badges and buttons.",
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Card Component</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 360px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .badge { background: #38bdf8; color: #0f172a; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
    h2 { margin: 12px 0 8px 0; font-size: 20px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
    .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 12px; }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Featured</span>
    <h2>Modern Web Design</h2>
    <p>Crafting accessible, standards-compliant experiences with pure HTML5 and modern CSS3.</p>
    <a href="#" class="btn">Learn More</a>
  </div>
</body>
</html>`
    }
  ];

  BB.TIPS_DATA = [
    {
      id: 'tip-semantic',
      category: 'html',
      title: "Semantic HTML Elements",
      descTl: "Gamitin ang tamang HTML5 tags gaya ng header, nav, main, section, article, at footer sa halip na panay div lang.",
      descEn: "Use semantic HTML5 elements such as header, nav, main, section, article, and footer instead of generic div tags.",
      code: "<header>\n  <nav>\n    <ul>\n      <li><a href='/'>Home</a></li>\n    </ul>\n  </nav>\n</header>"
    },
    {
      id: 'tip-alt',
      category: 'html',
      title: "Image Accessibility (Alt Attributes)",
      descTl: "Palaging maglagay ng descriptive alt attribute sa <img> para sa mga screen readers at kapag nabigong mag-load ang larawan.",
      descEn: "Always include a descriptive alt attribute on <img> tags to assist screen reader users and provide fallback text.",
      code: "<img src='hero.jpg' alt='Student coding on a laptop' width='600' height='400'>"
    },
    {
      id: 'tip-boxsizing',
      category: 'css',
      title: "CSS Box Sizing Reset",
      descTl: "Gamitin ang box-sizing: border-box upang isama ang padding at border sa kabuuang sukat ng elemento.",
      descEn: "Apply box-sizing: border-box universally to ensure padding and borders do not expand container widths unexpectedly.",
      code: "*,\n*::before,\n*::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}"
    },
    {
      id: 'tip-flexbox',
      category: 'css',
      title: "Modern Flexbox Centering",
      descTl: "Madaling i-center ang anumang child container gamit ang display: flex, justify-content: center, at align-items: center.",
      descEn: "Easily center elements horizontally and vertically using CSS Flexbox layout properties.",
      code: ".container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}"
    },
    {
      id: 'tip-heading',
      category: 'html',
      title: "Strict Heading Hierarchy (H1 to H6)",
      descTl: "Huwag lumaktaw ng heading levels (hal. H1 diretso sa H3). Isa lang dapat ang pangunahing H1 bawat page.",
      descEn: "Do not skip heading levels (e.g. jumping from H1 directly to H3). Have only one primary H1 element per document.",
      code: "<h1>Main Article Title</h1>\n<section>\n  <h2>Section Heading</h2>\n  <h3>Subsection Details</h3>\n</section>"
    }
  ];

  BB.VALID_HTML5_ELEMENTS = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote',
    'body', 'br', 'button', 'canvas', 'caption', 'circle', 'cite', 'clipPath', 'code', 'col', 'colgroup', 'data', 'datalist',
    'dd', 'defs', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'ellipse', 'em', 'embed', 'fieldset', 'figcaption',
    'figure', 'footer', 'form', 'g', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr',
    'html', 'i', 'iframe', 'image', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'line', 'linearGradient', 'link', 'main', 'map',
    'mark', 'mask', 'math', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output',
    'p', 'path', 'pattern', 'picture', 'polygon', 'polyline', 'pre', 'progress', 'q', 'radialGradient', 'rect', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section',
    'select', 'slot', 'small', 'source', 'span', 'stop', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
    'table', 'tbody', 'td', 'template', 'text', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr',
    'track', 'tspan', 'u', 'ul', 'use', 'var', 'video', 'wbr'
  ]);

  BB.VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  BB.OPTIONAL_CLOSE_TAGS = new Set([
    'p', 'li', 'dt', 'dd', 'td', 'th', 'tr', 'option', 'optgroup', 'colgroup', 'thead', 'tbody', 'tfoot'
  ]);

  BB.OBSOLETE_ELEMENTS = new Set([
    'applet', 'acronym', 'basefont', 'big', 'blink', 'center', 'dir', 'font', 'frame', 'frameset',
    'isindex', 'marquee', 'noframes', 'strike', 'tt'
  ]);

  BB.BLOCK_ELEMENTS = new Set([
    'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt', 'fieldset',
    'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
    'hr', 'li', 'main', 'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video'
  ]);

  BB.OBSOLETE_ATTRIBUTES = {
    'align': 'Use CSS "text-align" or flexbox instead of obsolete "align" attribute.',
    'bgcolor': 'Use CSS "background-color" instead of obsolete "bgcolor" attribute.',
    'border': 'Use CSS "border" instead of obsolete "border" attribute on table or image.',
    'cellpadding': 'Use CSS "padding" on table cells instead of obsolete "cellpadding" attribute.',
    'cellspacing': 'Use CSS "border-spacing" instead of obsolete "cellspacing" attribute.',
    'color': 'Use CSS "color" instead of obsolete "color" attribute.',
    'clear': 'Use CSS "clear" property instead of obsolete "clear" attribute on <br>.',
    'noshade': 'Use CSS border styling instead of obsolete "noshade" attribute on <hr>.',
    'size': 'Use CSS "height" or "width" instead of obsolete "size" attribute.'
  };

  BB.COMMON_CSS_TYPOS = {
    'backgroud-color': 'background-color',
    'backround-color': 'background-color',
    'backgound-color': 'background-color',
    'backgroundcolor': 'background-color',
    'backround': 'background',
    'colr': 'color',
    'colour': 'color',
    'widht': 'width',
    'widh': 'width',
    'heigth': 'height',
    'heigt': 'height',
    'font-weigth': 'font-weight',
    'fontweight': 'font-weight',
    'fontsize': 'font-size',
    'text-algn': 'text-align',
    'textalign': 'text-align',
    'pading': 'padding',
    'pad-top': 'padding-top',
    'margn': 'margin',
    'dislay': 'display',
    'displayy': 'display',
    'positon': 'position',
    'zindex': 'z-index',
    'curser': 'cursor'
  };

  BB.STANDARD_CSS_PROPERTIES = new Set([
    'align-content', 'align-items', 'align-self', 'all', 'animation', 'animation-delay', 'animation-direction',
    'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name', 'animation-play-state',
    'animation-timing-function', 'aspect-ratio', 'backdrop-filter', 'backface-visibility', 'background',
    'background-attachment', 'background-blend-mode', 'background-clip', 'background-color', 'background-image',
    'background-origin', 'background-position', 'background-repeat', 'background-size', 'block-size', 'border',
    'border-block', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius', 'border-bottom-right-radius',
    'border-bottom-style', 'border-bottom-width', 'border-collapse', 'border-color', 'border-image', 'border-inline',
    'border-left', 'border-left-color', 'border-left-style', 'border-left-width', 'border-radius', 'border-right',
    'border-right-color', 'border-right-style', 'border-right-width', 'border-spacing', 'border-style', 'border-top',
    'border-top-color', 'border-top-left-radius', 'border-top-right-radius', 'border-top-style', 'border-top-width',
    'border-width', 'bottom', 'box-decoration-break', 'box-shadow', 'box-sizing', 'break-after', 'break-before',
    'break-inside', 'caption-side', 'caret-color', 'clear', 'clip', 'clip-path', 'color', 'column-count',
    'column-fill', 'column-gap', 'column-rule', 'column-span', 'column-width', 'columns', 'content', 'counter-increment',
    'counter-reset', 'counter-set', 'cursor', 'direction', 'display', 'empty-cells', 'filter', 'flex', 'flex-basis',
    'flex-direction', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap', 'float', 'font', 'font-family',
    'font-feature-settings', 'font-kerning', 'font-optical-sizing', 'font-size', 'font-size-adjust', 'font-stretch',
    'font-style', 'font-variant', 'font-weight', 'gap', 'grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow',
    'grid-auto-rows', 'grid-column', 'grid-column-end', 'grid-column-gap', 'grid-column-start', 'grid-gap', 'grid-row',
    'grid-row-end', 'grid-row-gap', 'grid-row-start', 'grid-template', 'grid-template-areas', 'grid-template-columns',
    'grid-template-rows', 'height', 'hyphens', 'image-rendering', 'inline-size', 'inset', 'inset-block', 'inset-inline',
    'isolation', 'justify-content', 'justify-items', 'justify-self', 'left', 'letter-spacing', 'line-break',
    'line-height', 'list-style', 'list-style-image', 'list-style-position', 'list-style-type', 'margin', 'margin-block',
    'margin-bottom', 'margin-inline', 'margin-left', 'margin-right', 'margin-top', 'max-block-size', 'max-height',
    'max-inline-size', 'max-width', 'min-block-size', 'min-height', 'min-inline-size', 'min-width', 'mix-blend-mode',
    'object-fit', 'object-position', 'opacity', 'order', 'outline', 'outline-color', 'outline-offset', 'outline-style',
    'outline-width', 'overflow', 'overflow-anchor', 'overflow-wrap', 'overflow-x', 'overflow-y', 'overscroll-behavior',
    'padding', 'padding-block', 'padding-bottom', 'padding-inline', 'padding-left', 'padding-right', 'padding-top',
    'perspective', 'perspective-origin', 'place-content', 'place-items', 'place-self', 'pointer-events', 'position',
    'quotes', 'resize', 'right', 'rotate', 'row-gap', 'scale', 'scroll-behavior', 'scroll-margin', 'scroll-padding',
    'scroll-snap-align', 'scroll-snap-stop', 'scroll-snap-type', 'scrollbar-color', 'scrollbar-width', 'tab-size',
    'table-layout', 'text-align', 'text-align-last', 'text-decoration', 'text-decoration-color', 'text-decoration-line',
    'text-decoration-style', 'text-decoration-thickness', 'text-emphasis', 'text-indent', 'text-justify',
    'text-orientation', 'text-overflow', 'text-rendering', 'text-shadow', 'text-transform', 'text-underline-offset',
    'text-underline-position', 'top', 'touch-action', 'transform', 'transform-box', 'transform-origin', 'transform-style',
    'transition', 'transition-delay', 'transition-duration', 'transition-property', 'transition-timing-function',
    'translate', 'unicode-bidi', 'user-select', 'vertical-align', 'visibility', 'white-space', 'widows', 'width',
    'will-change', 'word-break', 'word-spacing', 'word-wrap', 'writing-mode', 'z-index'
  ]);

  BB.STANDARD_PROPERTY_KEYWORDS = {
    'display': new Set([
      'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid',
      'flow-root', 'contents', 'none', 'table', 'table-row', 'table-cell', 'table-column',
      'table-column-group', 'table-footer-group', 'table-header-group', 'table-row-group',
      'list-item', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'position': new Set([
      'static', 'relative', 'absolute', 'fixed', 'sticky', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'visibility': new Set([
      'visible', 'hidden', 'collapse', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'box-sizing': new Set([
      'content-box', 'border-box', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'overflow': new Set([
      'visible', 'hidden', 'clip', 'scroll', 'auto', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'overflow-x': new Set([
      'visible', 'hidden', 'clip', 'scroll', 'auto', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'overflow-y': new Set([
      'visible', 'hidden', 'clip', 'scroll', 'auto', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'flex-direction': new Set([
      'row', 'row-reverse', 'column', 'column-reverse', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'flex-wrap': new Set([
      'nowrap', 'wrap', 'wrap-reverse', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'justify-content': new Set([
      'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly',
      'stretch', 'start', 'end', 'left', 'right', 'normal', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'align-items': new Set([
      'flex-start', 'flex-end', 'center', 'stretch', 'baseline', 'start', 'end',
      'self-start', 'self-end', 'normal', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'align-content': new Set([
      'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly',
      'stretch', 'start', 'end', 'baseline', 'normal', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'text-align': new Set([
      'left', 'right', 'center', 'justify', 'justify-all', 'start', 'end', 'match-parent',
      'inherit', 'initial', 'unset', 'revert'
    ]),
    'text-transform': new Set([
      'none', 'capitalize', 'uppercase', 'lowercase', 'full-width', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'white-space': new Set([
      'normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'pointer-events': new Set([
      'auto', 'none', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all',
      'inherit', 'initial', 'unset', 'revert'
    ]),
    'cursor': new Set([
      'auto', 'default', 'none', 'context-menu', 'help', 'pointer', 'progress', 'wait',
      'cell', 'crosshair', 'text', 'vertical-text', 'alias', 'copy', 'move', 'no-drop',
      'not-allowed', 'grab', 'grabbing', 'all-scroll', 'col-resize', 'row-resize',
      'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'sw-resize',
      'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out',
      'inherit', 'initial', 'unset', 'revert'
    ]),
    'float': new Set([
      'left', 'right', 'none', 'inline-start', 'inline-end', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'clear': new Set([
      'none', 'left', 'right', 'both', 'inline-start', 'inline-end', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'direction': new Set([
      'ltr', 'rtl', 'inherit', 'initial', 'unset', 'revert'
    ]),
    'font-style': new Set([
      'normal', 'italic', 'oblique', 'inherit', 'initial', 'unset', 'revert'
    ])
  };

  BB.VALID_CSS_UNITS = new Set([
    'px', 'em', 'rem', '%', 'vh', 'vw', 'vmin', 'vmax', 'cqw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax',
    'ch', 'ex', 'cm', 'mm', 'in', 'pt', 'pc', 'q', 's', 'ms', 'deg', 'rad', 'grad', 'turn', 'fr', 'dpi', 'dpcm', 'dppx'
  ]);

})(window.BugBuster);
