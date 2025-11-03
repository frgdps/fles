/*
  Code Text Cleaner Pro - GitHub Dark Mode Edition
  Features: text utils, code cleaner, html decoder, combine/split, regex tester, find/replace
  Author: Thio Saputra
*/

(() => {
  // --- State Management
  const state = {
    currentTool: 'text',
    theme: 'dark',
    findReplace: {
      isActive: false,
      currentMatch: -1,
      matches: []
    }
  };

  // --- Utility Functions
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const toastEl = $('#toast');
  
  // Safe localStorage wrapper
  const storage = (() => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return localStorage;
    } catch (e) {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };
    }
  })();
  
  // Toast notification system
  function toast(msg, type = 'info', timeout = 3000) {
    toastEl.textContent = msg;
    toastEl.className = 'toast';
    toastEl.classList.add(type);
    toastEl.classList.remove('hidden');
    setTimeout(() => toastEl.classList.add('show'), 10);
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 250);
    }, timeout);
  }

  // --- Navigation
  const navItems = $$('.nav-item');
  
  function switchTool(tool) {
    state.currentTool = tool;
    
    // Update active state
    navItems.forEach(item => item.classList.remove('active'));
    $(`.nav-item[data-tool="${tool}"]`).classList.add('active');
    
    // Show corresponding panel
    $$('.panel').forEach(panel => panel.classList.toggle('active', panel.dataset.tool === tool));
  }
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tool = item.dataset.tool;
      switchTool(tool);
    });
  });

  // --- Theme Management
  const themeToggle = $('#themeToggle');
  
  function toggleTheme() {
    const body = document.body;
    const isDark = !body.classList.contains('light-theme');
    
    if (isDark) {
      body.classList.remove('light-theme');
      state.theme = 'dark';
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      toast('Switched to dark theme', 'success');
    } else {
      body.classList.add('light-theme');
      state.theme = 'light';
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      toast('Switched to light theme', 'success');
    }
    
    storage.setItem('ctcpro:theme', state.theme);
  }
  
  themeToggle.addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = storage.getItem('ctcpro:theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    state.theme = 'light';
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  // --- Line numbers functionality
  function updateLineNumbers(textarea, lineNumbersId) {
    const lineNumbers = $(lineNumbersId);
    if (!lineNumbers) return;
    
    const lines = textarea.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
      numbers += i + '\n';
    }
    lineNumbers.textContent = numbers;
    
    // Adjust width based on number of digits
    const digitCount = lines.toString().length;
    const width = Math.max(40, digitCount * 8 + 20);
    lineNumbers.style.width = width + 'px';
    
    // Adjust padding of editor
    textarea.style.paddingLeft = width + 10 + 'px';
  }

  // Setup line numbers for all textareas
  const textareas = $$('textarea.editor');
  
  textareas.forEach(textarea => {
    const lineNumbersId = textarea.id + 'LineNumbers';
    const lineNumbers = $(lineNumbersId);
    
    if (lineNumbers) {
      // Initial update
      updateLineNumbers(textarea, lineNumbersId);
      
      // Update on input
      textarea.addEventListener('input', () => {
        updateLineNumbers(textarea, lineNumbersId);
      });
      
      // Sync scroll
      textarea.addEventListener('scroll', () => {
        lineNumbers.scrollTop = textarea.scrollTop;
      });
    }
  });

  // --- Find and Replace functionality
  const findReplaceBtn = $('#findReplaceBtn');
  const findReplaceContainer = $('#findReplaceContainer');
  const closeFindReplace = $('#closeFindReplace');
  const findInput = $('#findInput');
  const replaceInput = $('#replaceInput');
  const findNextBtn = $('#findNextBtn');
  const findPrevBtn = $('#findPrevBtn');
  const replaceBtn = $('#replaceBtn');
  const replaceAllBtn = $('#replaceAllBtn');
  const findReplaceInfo = $('#findReplaceInfo');
  
  let currentEditor = null;
  
  function showFindReplace() {
    findReplaceContainer.style.display = 'block';
    findInput.focus();
    state.findReplace.isActive = true;
    
    // Set current editor based on active panel
    const activePanel = $('.panel.active');
    if (activePanel) {
      const editor = activePanel.querySelector('textarea.editor:not([readonly])');
      if (editor) {
        currentEditor = editor;
      }
    }
  }
  
  function hideFindReplace() {
    findReplaceContainer.style.display = 'none';
    state.findReplace.isActive = false;
  }
  
  function findInEditor(direction = 'next') {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const text = currentEditor.value;
    const currentIndex = currentEditor.selectionStart;
    
    let matchIndex = -1;
    
    if (direction === 'next') {
      matchIndex = text.indexOf(searchText, currentIndex);
      if (matchIndex === -1) {
        matchIndex = text.indexOf(searchText); // Wrap around
      }
    } else {
      matchIndex = text.lastIndexOf(searchText, currentIndex - 1);
      if (matchIndex === -1) {
        matchIndex = text.lastIndexOf(searchText); // Wrap around
      }
    }
    
    if (matchIndex !== -1) {
      currentEditor.focus();
      currentEditor.setSelectionRange(matchIndex, matchIndex + searchText.length);
      currentEditor.scrollTop = currentEditor.scrollTop + 
        (matchIndex - currentEditor.selectionStart) * parseInt(getComputedStyle(currentEditor).lineHeight);
      
      findReplaceInfo.textContent = `Found match at position ${matchIndex}`;
    } else {
      findReplaceInfo.textContent = 'No matches found';
    }
  }
  
  function replaceInEditor() {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    const selectionStart = currentEditor.selectionStart;
    const selectionEnd = currentEditor.selectionEnd;
    const selectedText = currentEditor.value.substring(selectionStart, selectionEnd);
    
    if (selectedText === searchText) {
      const before = currentEditor.value.substring(0, selectionStart);
      const after = currentEditor.value.substring(selectionEnd);
      currentEditor.value = before + replaceText + after;
      
      // Update cursor position
      const newCursorPos = selectionStart + replaceText.length;
      currentEditor.setSelectionRange(newCursorPos, newCursorPos);
      
      findReplaceInfo.textContent = 'Replaced 1 occurrence';
    } else {
      findReplaceInfo.textContent = 'No match at cursor position';
    }
  }
  
  function replaceAllInEditor() {
    if (!currentEditor || !findInput.value) return;
    
    const searchText = findInput.value;
    const replaceText = replaceInput.value;
    const regex = new RegExp(escapeRegExp(searchText), 'g');
    const originalValue = currentEditor.value;
    const newValue = originalValue.replace(regex, replaceText);
    
    if (originalValue !== newValue) {
      currentEditor.value = newValue;
      const matchCount = (originalValue.match(regex) || []).length;
      findReplaceInfo.textContent = `Replaced ${matchCount} occurrences`;
    } else {
      findReplaceInfo.textContent = 'No matches found';
    }
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  findReplaceBtn.addEventListener('click', showFindReplace);
  closeFindReplace.addEventListener('click', hideFindReplace);
  findNextBtn.addEventListener('click', () => findInEditor('next'));
  findPrevBtn.addEventListener('click', () => findInEditor('prev'));
  replaceBtn.addEventListener('click', replaceInEditor);
  replaceAllBtn.addEventListener('click', replaceAllInEditor);
  
  // Keyboard shortcuts for find/replace
  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        findInEditor('prev');
      } else {
        findInEditor('next');
      }
    } else if (e.key === 'Escape') {
      hideFindReplace();
    }
  });
  
  replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      replaceInEditor();
    } else if (e.key === 'Escape') {
      hideFindReplace();
    }
  });

  // --- Clipboard helper function
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const result = document.execCommand('copy');
          if (result) {
            resolve();
          } else {
            reject(new Error('Unable to copy'));
          }
        } catch (e) {
          reject(e);
        } finally {
          document.body.removeChild(textArea);
        }
      });
    }
  }

  // --- TEXT TOOLS
  const inputText = $('#inputText');
  const outputText = $('#outputText');
  const wordCount = $('#wordCount');
  const charCount = $('#charCount');
  const lineCount = $('#lineCount');
  
  function updateCounts(txt) {
    const chars = txt.length;
    const words = (txt.trim().match(/\S+/g) || []).length;
    const lines = txt.split('\n').length;
    
    charCount.textContent = chars;
    wordCount.textContent = words;
    lineCount.textContent = lines;
  }

  function transformText(action) {
    let t = inputText.value;
    
    switch (action) {
      case 'lower':
        t = t.toLowerCase();
        break;
      case 'upper':
        t = t.toUpperCase();
        break;
      case 'title':
        t = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        break;
      case 'trimspaces':
        t = t.replace(/[ \t]{2,}/g, ' ');
        break;
      case 'reverse':
        t = t.split('').reverse().join('');
        break;
      case 'sort':
        t = t.split('\n').sort().join('\n');
        break;
    }
    
    outputText.value = t;
    updateCounts(t);
    toast('Transformation complete', 'success');
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => transformText(btn.dataset.action));
  });

  inputText.addEventListener('input', e => {
    updateCounts(inputText.value);
  });

  $('#copyOutput').addEventListener('click', async () => {
    try {
      await copyToClipboard(outputText.value || inputText.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadTxt').addEventListener('click', () => {
    const txt = outputText.value || inputText.value;
    if (!txt) return toast('No text to download', 'warning');
    downloadBlob(txt, 'text/plain', 'output.txt');
    toast('Downloading output.txt', 'success');
  });

  // prettify JSON
  $('#prettyJson').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      outputText.value = JSON.stringify(obj, null, 2);
      updateCounts(outputText.value);
      toast('JSON prettified successfully', 'success');
    } catch (e) {
      toast('Invalid JSON: ' + e.message, 'error');
    }
  });

  // Base64 encode
  $('#base64Encode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter text to encode', 'warning');
    try {
      outputText.value = btoa(unescape(encodeURIComponent(s)));
      updateCounts(outputText.value);
      toast('Text encoded to Base64', 'success');
    } catch (e) {
      toast('Encoding failed', 'error');
    }
  });

  // Base64 decode
  $('#base64Decode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter Base64 to decode', 'warning');
    try {
      outputText.value = decodeURIComponent(escape(atob(s)));
      updateCounts(outputText.value);
      toast('Base64 decoded successfully', 'success');
    } catch (e) {
      toast('Invalid Base64', 'error');
    }
  });

  // URL encode
  $('#urlEncode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter text to encode', 'warning');
    try {
      outputText.value = encodeURIComponent(s);
      updateCounts(outputText.value);
      toast('Text URL encoded', 'success');
    } catch (e) {
      toast('Encoding failed', 'error');
    }
  });

  // URL decode
  $('#urlDecode').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter URL to decode', 'warning');
    try {
      outputText.value = decodeURIComponent(s);
      updateCounts(outputText.value);
      toast('URL decoded', 'success');
    } catch (e) {
      toast('Invalid URL encoding', 'error');
    }
  });

  // Paste functionality
  $('#pasteText').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputText.value = text;
      updateCounts(text);
      toast('Text pasted from clipboard', 'success');
    } catch (e) {
      toast('Failed to paste', 'error');
    }
  });

  // --- CODE CLEANER
  const codeInput = $('#codeInput');
  const codeOutput = $('#codeOutput');
  
  function removeCommentsCSSJS(s) {
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/(^|\n)\s*\/\/.*$/gm, '');
    return s;
  }
  
  function minifyHTML(html) {
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/\s{2,}/g, ' ');
    html = html.replace(/>\s+</g, '><');
    return html.trim();
  }
  
  function cleanCSS(s) {
    s = removeCommentsCSSJS(s);
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }
  
  function cleanJS(s) {
    s = removeCommentsCSSJS(s);
    s = s.replace(/\n\s*/g, '\n');
    return s.trim();
  }
  
  function formatHTMLbasic(s) {
    return s.replace(/>\s*</g, '>\n<').replace(/\n\s+/g, '\n').trim();
  }
  
  function formatCSS(css) {
    css = css.replace(/}/g, '}\n');
    css = css.replace(/{/g, ' {\n  ');
    css = css.replace(/;/g, ';\n  ');
    css = css.replace(/\n\s+\n/g, '\n');
    return css.trim();
  }
  
  function formatJS(js) {
    js = js.replace(/{/g, ' {\n  ');
    js = js.replace(/}/g, '\n}');
    js = js.replace(/;/g, ';\n');
    return js.trim();
  }

  $('[data-code-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.codeAction;
      let src = codeInput.value;
      let out = '';
      
      switch (act) {
        case 'minify-html':
          out = minifyHTML(src);
          break;
        case 'minify-css':
          out = cleanCSS(src);
          break;
        case 'minify-js':
          out = cleanJS(src);
          break;
        case 'remove-comments':
          out = removeCommentsCSSJS(src);
          break;
      }
      
      codeOutput.value = out;
      toast('Operation completed', 'success');
    });
  });

  $('#formatHtml').addEventListener('click', () => {
    codeOutput.value = formatHTMLbasic(codeInput.value);
    toast('HTML formatted', 'success');
  });

  $('#formatCss').addEventListener('click', () => {
    codeOutput.value = formatCSS(codeInput.value);
    toast('CSS formatted', 'success');
  });

  $('#formatJs').addEventListener('click', () => {
    codeOutput.value = formatJS(codeInput.value);
    toast('JavaScript formatted', 'success');
  });

  $('#beautifyJson').addEventListener('click', () => {
    const s = codeInput.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      codeOutput.value = JSON.stringify(obj, null, 2);
      toast('JSON beautified successfully', 'success');
    } catch (e) {
      toast('Invalid JSON', 'error');
    }
  });

  $('#copyCode').addEventListener('click', async () => {
    try {
      await copyToClipboard(codeOutput.value || codeInput.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadCode').addEventListener('click', () => {
    const txt = codeOutput.value || codeInput.value;
    if (!txt) return toast('No code to download', 'warning');
    
    // try to guess extension
    let ext = 'txt';
    const sample = txt.slice(0, 200).toLowerCase();
    if (sample.includes('<html') || sample.includes('<!doctype')) ext = 'html';
    else if (sample.includes('{') && sample.includes('}')) ext = 'js';
    else if (sample.includes('{') && sample.includes('color')) ext = 'css';
    
    downloadBlob(txt, 'text/plain', `code.${ext}`);
    toast('Downloading code.' + ext, 'success');
  });

  // Paste functionality for code
  $('#pasteCode').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      codeInput.value = text;
      toast('Code pasted from clipboard', 'success');
    } catch (e) {
      toast('Failed to paste', 'error');
    }
  });

  // preview iframe for code
  $('#previewCode').addEventListener('click', () => {
    const src = codeOutput.value || codeInput.value;
    if (!src) return toast('No code to preview', 'warning');
    
    const previewWrap = $('#previewWrap');
    const iframe = $('#previewFrame');
    
    // if html fragment, wrap minimal
    let doc = src;
    if (!/<html/i.test(src)) {
      doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${src}</body></html>`;
    }
    
    iframe.srcdoc = doc;
    previewWrap.classList.remove('hidden');
    toast('Preview ready', 'success');
  });

  $('#closePreview').addEventListener('click', () => {
    $('#previewWrap').classList.add('hidden');
    $('#previewFrame').srcdoc = 'about:blank';
  });

  // --- HTML ENTITY DECODER / ENCODER
  const encoded = $('#encoded');
  const decoded = $('#decoded');
  
  $('#decodeBtn').addEventListener('click', () => {
    decoded.value = decodeHTMLEntities(encoded.value);
    toast('Decode complete', 'success');
  });
  
  $('#encodeBtn').addEventListener('click', () => {
    encoded.value = encodeHTMLEntities(decoded.value || encoded.value);
    toast('Encode complete', 'success');
  });
  
  $('#copyDecoded').addEventListener('click', async () => {
    try {
      await copyToClipboard(decoded.value);
      toast('Copied to clipboard', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });
  
  function decodeHTMLEntities(text) {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }
  
  function encodeHTMLEntities(text) {
    const txt = document.createElement('textarea');
    txt.textContent = text;
    return txt.innerHTML;
  }

  // --- COMBINE
  const combineHtml = $('#combineHtml');
  const combineCss = $('#combineCss');
  const combineJs = $('#combineJs');
  const combinedOutput = $('#combinedOutput');
  
  $('#combineBtn').addEventListener('click', () => {
    const htmlRaw = combineHtml.value || '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n</head>\n<body>\n</body>\n</html>';
    let doc;
    
    try {
      if (/<html/i.test(htmlRaw)) {
        doc = htmlRaw;
        
        if (combineCss.value.trim()) {
          if (/<\/head>/i.test(doc)) {
            doc = doc.replace(/<\/head>/i, `  <style>\n${combineCss.value}\n  </style>\n</head>`);
          } else {
            doc = doc.replace(/<body.*?>/i, `<head><style>\n${combineCss.value}\n</style></head></body>`);
          }
        }
        
        if (combineJs.value.trim()) {
          if (/<\/body>/i.test(doc)) {
            doc = doc.replace(/<\/body>/i, `  <script>\n${combineJs.value}\n  </script>\n</body>`);
          } else {
            doc += `\n<script>\n${combineJs.value}\n</script>`;
          }
        }
      } else {
        doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n<style>\n${combineCss.value}\n</style>\n</head>\n<body>\n${htmlRaw}\n<script>\n${combineJs.value}\n</script>\n</body>\n</html>`;
      }
    } catch (e) {
      doc = htmlRaw;
    }
    
    combinedOutput.value = doc;
    toast('Combine complete', 'success');
  });

  $('#copyCombined').addEventListener('click', async () => {
    try {
      await copyToClipboard(combinedOutput.value);
      toast('Combined code copied', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  $('#downloadCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to download', 'warning');
    downloadBlob(html, 'text/html', 'combined.html');
    toast('Downloading combined.html', 'success');
  });

  // combined preview
  $('#previewCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to preview', 'warning');
    
    const wrap = $('#previewCombinedWrap');
    const ifr = $('#previewCombined');
    ifr.srcdoc = html;
    wrap.classList.remove('hidden');
    toast('Combined preview ready', 'success');
  });

  $('#closeCombinedPreview').addEventListener('click', () => {
    $('#previewCombinedWrap').classList.add('hidden');
    $('#previewCombined').srcdoc = 'about:blank';
  });

  // --- SPLIT
  const splitInput = $('#splitInput');
  const splitHtml = $('#splitHtml');
  const splitCss = $('#splitCss');
  const splitJs = $('#splitJs');
  
  $('#splitBtn').addEventListener('click', () => {
    const src = splitInput.value;
    if (!src) return toast('Enter HTML containing <style> / <script>', 'warning');
    
    const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    const scriptMatches = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    
    let css = styleMatches.map(m => m[1]).join('\n\n').trim();
    let js = scriptMatches.map(m => m[1]).join('\n\n').trim();
    let htmlClean = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    
    splitCss.value = css;
    splitJs.value = js;
    splitHtml.value = htmlClean.trim();
    toast('Split complete', 'success');
  });

  $('#downloadHtml').addEventListener('click', () => {
    const t = splitHtml.value;
    if (!t) return toast('No HTML to download', 'warning');
    downloadBlob(t, 'text/html', 'split.html');
    toast('Downloading split.html', 'success');
  });

  $('#downloadCss').addEventListener('click', () => {
    const t = splitCss.value;
    if (!t) return toast('No CSS to download', 'warning');
    downloadBlob(t, 'text/css', 'styles.css');
    toast('Downloading styles.css', 'success');
  });

  $('#downloadJs').addEventListener('click', () => {
    const t = splitJs.value;
    if (!t) return toast('No JavaScript to download', 'warning');
    downloadBlob(t, 'application/javascript', 'script.js');
    toast('Downloading script.js', 'success');
  });

  // --- REGEX TESTER
  const regexPattern = $('#regexPattern');
  const regexTestText = $('#regexTestText');
  const regexResult = $('#regexResult');
  const regexMatchCount = $('#regexMatchCount');
  const regexTestTime = $('#regexTestTime');
  const regexFlags = $$('.regex-flag');
  
  let selectedFlags = new Set();
  
  // Toggle regex flags
  regexFlags.forEach(flag => {
    flag.addEventListener('click', () => {
      const flagValue = flag.dataset.flag;
      if (selectedFlags.has(flagValue)) {
        selectedFlags.delete(flagValue);
        flag.classList.remove('active');
      } else {
        selectedFlags.add(flagValue);
        flag.classList.add('active');
      }
    });
  });
  
  $('#testRegex').addEventListener('click', () => {
    const pattern = regexPattern.value;
    const text = regexTestText.value;
    
    if (!pattern) {
      toast('Please enter a regex pattern', 'warning');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      const flags = Array.from(selectedFlags).join('');
      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex);
      
      const endTime = performance.now();
      const testTime = (endTime - startTime).toFixed(2);
      
      // Highlight matches
      let highlightedText = text;
      if (matches) {
        matches.forEach(match => {
          highlightedText = highlightedText.replace(
            new RegExp(escapeRegExp(match), 'g'),
            '<span class="regex-match">$&</span>'
          );
        });
      }
      
      regexResult.innerHTML = highlightedText || '<div class="empty-state">No matches found</div>';
      regexMatchCount.textContent = matches ? matches.length : 0;
      regexTestTime.textContent = testTime + 'ms';
      
      toast('Regex test completed', 'success');
    } catch (e) {
      regexResult.innerHTML = `<div style="color: var(--accent-danger);">Invalid regex: ${e.message}</div>`;
      regexMatchCount.textContent = '0';
      regexTestTime.textContent = '0ms';
      toast('Invalid regex pattern', 'error');
    }
  });
  
  $('#clearRegex').addEventListener('click', () => {
    regexPattern.value = '';
    regexTestText.value = '';
    regexResult.innerHTML = '<div class="empty-state">Enter a regex pattern and click "Test" to see matches</div>';
    regexMatchCount.textContent = '0';
    regexTestTime.textContent = '0ms';
    selectedFlags.clear();
    regexFlags.forEach(flag => flag.classList.remove('active'));
    toast('Regex tester cleared', 'success');
  });
  
  $('#copyRegexResult').addEventListener('click', async () => {
    try {
      const resultText = regexResult.innerText;
      await copyToClipboard(resultText);
      toast('Regex result copied', 'success');
    } catch (e) {
      toast('Failed to copy', 'error');
    }
  });

  // --- Individual word wrap toggles for each editor
  function setupWordWrapToggle(buttonId, textareaId) {
    $(buttonId)?.addEventListener('click', () => {
      const textarea = $(textareaId);
      if (!textarea) return;
      
      textarea.classList.toggle('word-wrap');
      const isWrapped = textarea.classList.contains('word-wrap');
      toast(isWrapped ? 'Word wrap enabled' : 'Word wrap disabled', 'success');
    });
  }
  
  setupWordWrapToggle('#toggleWordWrap', 'inputText');
  setupWordWrapToggle('#toggleCodeWordWrap', 'codeInput');
  setupWordWrapToggle('#toggleDecoderWordWrap', 'encoded');
  setupWordWrapToggle('#toggleCombineHtmlWordWrap', 'combineHtml');
  setupWordWrapToggle('#toggleCombineCssWordWrap', 'combineCss');
  setupWordWrapToggle('#toggleCombineJsWordWrap', 'combineJs');
  setupWordWrapToggle('#toggleCombinedOutputWordWrap', 'combinedOutput');
  setupWordWrapToggle('#toggleSplitInputWordWrap', 'splitInput');
  setupWordWrapToggle('#toggleSplitHtmlWordWrap', 'splitHtml');
  setupWordWrapToggle('#toggleSplitCssWordWrap', 'splitCss');
  setupWordWrapToggle('#toggleSplitJsWordWrap', 'splitJs');

  // --- Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + F: Find/Replace
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      showFindReplace();
    }
    
    // Ctrl/Cmd + T: Toggle Theme
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      toggleTheme();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      if (state.findReplace.isActive) {
        hideFindReplace();
      }
    }
  });

  // utility: download blob
  function downloadBlob(text, type, filename) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // expose some useful things to global for debugging (optional)
  window.ctc = {
    downloadBlob,
    minifyHTML,
    cleanCSS,
    cleanJS,
    toast,
    state,
    switchTool
  };
})();