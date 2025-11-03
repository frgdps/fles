/*
  Code & Text Cleaner Pro - Enhanced Edition
  Features: text utils, code cleaner, html decoder, combine/split, regex tester, find/replace, syntax highlighting, history, theme switcher, keyboard shortcuts
  Author: Thio Saputra / site:flessan.pages.dev
*/

(() => {
  // --- State Management
  const state = {
    currentTool: 'text',
    theme: 'dark',
    settings: {
      fontSize: 14,
      lineNumbers: true,
      wordWrap: false,
      autoSave: true
    },
    history: [],
    findReplace: {
      isActive: false,
      currentMatch: -1,
      matches: []
    }
  };

  // --- Utility Functions
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const saveKey = key => `ctcpro:${key}`;
  const toastEl = $('#toast');
  
  // Safe localStorage wrapper
  const storage = (() => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return localStorage;
    } catch (e) {
      console.error('localStorage is not available', e);
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
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

  // Add to history
  function addToHistory(action, details = '') {
    const historyItem = {
      action,
      details,
      timestamp: new Date().toLocaleTimeString(),
      tool: state.currentTool
    };
    
    state.history.unshift(historyItem);
    if (state.history.length > 20) {
      state.history = state.history.slice(0, 20);
    }
    
    updateHistoryDisplay();
    storage.setItem(saveKey('history'), JSON.stringify(state.history));
  }

  // Update history display
  function updateHistoryDisplay() {
    const historyContainer = $(`#${state.currentTool}History`);
    if (!historyContainer) return;
    
    const toolHistory = state.history.filter(item => item.tool === state.currentTool);
    
    if (toolHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="history-item">
          <div>
            <div class="history-action">No history yet</div>
            <div class="history-time">Start using the tool</div>
          </div>
        </div>
      `;
      return;
    }
    
    historyContainer.innerHTML = toolHistory.map(item => `
      <div class="history-item">
        <div>
          <div class="history-action">${item.action}</div>
          <div class="history-time">${item.timestamp}</div>
        </div>
        <button class="history-restore" data-action="${item.action}" data-details="${item.details}">
          <i class="fas fa-undo"></i>
        </button>
      </div>
    `).join('');
    
    // Add restore handlers
    historyContainer.querySelectorAll('.history-restore').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const details = btn.dataset.details;
        restoreFromHistory(action, details);
      });
    });
  }

  // Restore from history
  function restoreFromHistory(action, details) {
    // Implementation depends on the action
    toast(`Restored: ${action}`, 'success');
  }

  // --- VS Code style activity bar and sidebar
  const activityIcons = $$('.activity-icon');
  const sidebar = $('#sidebar');
  const sidebarClose = $('#sidebarClose');
  
  // Toggle sidebar
  function toggleSidebar() {
    sidebar.classList.toggle('expanded');
  }
  
  // Activity bar click handlers
  activityIcons.forEach(icon => {
    icon.addEventListener('click', () => {
      const tool = icon.dataset.tool;
      switchTool(tool);
    });
  });
  
  // Switch tool
  function switchTool(tool) {
    state.currentTool = tool;
    
    // Update active state
    activityIcons.forEach(i => i.classList.remove('active'));
    $(`.activity-icon[data-tool="${tool}"]`).classList.add('active');
    
    // Update sidebar active tab
    const sidebarTab = $(`.sidebar .tab-btn[data-tool="${tool}"]`);
    if (sidebarTab) {
      $$('.sidebar .tab-btn').forEach(t => t.classList.remove('active'));
      sidebarTab.classList.add('active');
    }
    
    // Show corresponding panel
    $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.tool === tool));
    
    // Update tool title
    const toolTitle = $('#toolTitle');
    const toolName = $(`.activity-icon[data-tool="${tool}"] .tooltip`).textContent;
    const toolIcon = $(`.activity-icon[data-tool="${tool}"] i`).className;
    toolTitle.innerHTML = `<i class="${toolIcon}"></i> ${toolName}`;
    
    // Auto-expand sidebar on desktop
    if (window.innerWidth > 768) {
      sidebar.classList.add('expanded');
    }
    
    // Update history display
    updateHistoryDisplay();
  }
  
  // Sidebar close button
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('expanded');
  });
  
  // Sidebar tab buttons
  $$('.sidebar .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.dataset.tool;
      switchTool(tool);
    });
  });

  // --- Theme Management
  const themeToggle = $('#themeToggle');
  
  function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('light-theme');
    
    if (isDark) {
      body.classList.remove('light-theme');
      state.theme = 'dark';
      themeToggle.innerHTML = '<i class="fas fa-moon"></i> Theme';
      toast('Switched to dark theme', 'success');
    } else {
      body.classList.add('light-theme');
      state.theme = 'light';
      themeToggle.innerHTML = '<i class="fas fa-sun"></i> Theme';
      toast('Switched to light theme', 'success');
    }
    
    storage.setItem(saveKey('theme'), state.theme);
  }
  
  themeToggle.addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = storage.getItem(saveKey('theme'));
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    state.theme = 'light';
    themeToggle.innerHTML = '<i class="fas fa-sun"></i> Theme';
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
    const width = Math.max(50, digitCount * 10 + 20);
    lineNumbers.style.width = width + 'px';
    
    // Adjust padding of editor content
    const editorContent = lineNumbers.nextElementSibling;
    if (editorContent) {
      editorContent.style.paddingLeft = width + 'px';
    }
  }

  // Setup line numbers for all textareas
  const textareas = $$('textarea.editor');
  const panels = $$('.panel');
  
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
    clearHighlights();
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
      addToHistory('Find', `"${searchText}"`);
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
      addToHistory('Replace', `"${searchText}" → "${replaceText}"`);
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
      addToHistory('Replace All', `"${searchText}" → "${replaceText}" (${matchCount} times)`);
    } else {
      findReplaceInfo.textContent = 'No matches found';
    }
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function clearHighlights() {
    // Implementation for clearing search highlights
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

  // --- Copy with line numbers
  function copyWithLineNumbers(textareaId) {
    const textarea = $(textareaId);
    if (!textarea) return;
    
    const lines = textarea.value.split('\n');
    const textWithNumbers = lines.map((line, index) => `${index + 1}: ${line}`).join('\n');
    
    copyToClipboard(textWithNumbers).then(() => {
      toast('Copied with line numbers', 'success');
      addToHistory('Copy', 'With line numbers');
    }).catch(err => {
      toast('Failed to copy: ' + err.message, 'error');
    });
  }
  
  $('#copyWithLineNumbers').addEventListener('click', () => copyWithLineNumbers('inputText'));
  $('#copyCodeWithLineNumbers').addEventListener('click', () => copyWithLineNumbers('codeInput'));

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
  const detailedStats = $('#detailedStats');
  
  function updateCounts(txt) {
    const chars = txt.length;
    const words = (txt.trim().match(/\S+/g) || []).length;
    const lines = txt.split('\n').length;
    const sentences = (txt.match(/[.!?]+/g) || []).length;
    const paragraphs = (txt.match(/\n\s*\n/g) || []).length + 1;
    const uniqueWords = new Set(txt.toLowerCase().match(/\b\w+\b/g) || []).size;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute
    
    charCount.textContent = chars;
    wordCount.textContent = words;
    lineCount.textContent = lines;
    
    // Update detailed stats
    if (words > 0) {
      detailedStats.style.display = 'grid';
      $('#sentenceCount').textContent = sentences;
      $('#paragraphCount').textContent = paragraphs;
      $('#readingTime').textContent = readingTime + ' min';
      $('#uniqueWords').textContent = uniqueWords;
    } else {
      detailedStats.style.display = 'none';
    }
  }

  function transformText(action) {
    let t = inputText.value;
    let actionName = action;
    
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
      case 'trimlines':
        t = t.split('\n').filter(l => l.trim() !== '').join('\n');
        break;
      case 'reverse':
        t = t.split('').reverse().join('');
        break;
      case 'sort':
        t = t.split('\n').sort().join('\n');
        break;
      case 'dedupe':
        t = [...new Set(t.split('\n'))].join('\n');
        break;
    }
    
    outputText.value = t;
    updateCounts(t);
    toast('Transformation complete', 'success');
    addToHistory(actionName);
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => transformText(btn.dataset.action));
  });

  // Case conversion
  document.querySelectorAll('[data-case]').forEach(btn => {
    btn.addEventListener('click', () => {
      const caseType = btn.dataset.case;
      const text = inputText.value;
      let result = '';
      
      switch (caseType) {
        case 'camel':
          result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
          }).replace(/\s+/g, '');
          break;
        case 'pascal':
          result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+/g, '');
          break;
        case 'snake':
          result = text.replace(/\s+/g, '_').toLowerCase();
          break;
        case 'kebab':
          result = text.replace(/\s+/g, '-').toLowerCase();
          break;
        case 'constant':
          result = text.replace(/\s+/g, '_').toUpperCase();
          break;
        case 'dot':
          result = text.replace(/\s+/g, '.').toLowerCase();
          break;
      }
      
      outputText.value = result;
      updateCounts(result);
      toast(`Converted to ${caseType} case`, 'success');
      addToHistory('Case Conversion', caseType);
    });
  });

  inputText.addEventListener('input', e => {
    updateCounts(inputText.value);
  });

  $('#copyOutput').addEventListener('click', async () => {
    try {
      await copyToClipboard(outputText.value || inputText.value);
      toast('Copied to clipboard', 'success');
      addToHistory('Copy', 'Output text');
    } catch (e) {
      toast('Failed to copy: ' + (e.message || e), 'error');
    }
  });

  $('#downloadTxt').addEventListener('click', () => {
    const txt = outputText.value || inputText.value;
    if (!txt) return toast('No text to download', 'warning');
    downloadBlob(txt, 'text/plain', 'output.txt');
    toast('Downloading output.txt', 'success');
    addToHistory('Download', 'Text file');
  });

  // Syntax highlighting
  $('#syntaxHighlight').addEventListener('click', () => {
    const text = outputText.value || inputText.value;
    if (!text) return toast('No text to highlight', 'warning');
    
    // Determine language
    let language = 'text';
    const sample = text.slice(0, 200).toLowerCase();
    if (sample.includes('<html') || sample.includes('<!doctype') || sample.includes('<div')) {
      language = 'markup';
    } else if (sample.includes('{') && sample.includes('}') && sample.includes('function')) {
      language = 'javascript';
    } else if (sample.includes('{') && sample.includes('color') || sample.includes('.class')) {
      language = 'css';
    } else if (sample.includes('{') && sample.includes('}')) {
      try {
        JSON.parse(text);
        language = 'json';
      } catch (e) {
        // Not JSON
      }
    }
    
    const highlighted = Prism.highlight(text, Prism.languages[language], language);
    const highlightedDiv = document.createElement('div');
    highlightedDiv.className = 'syntax-highlighted';
    highlightedDiv.innerHTML = `<pre><code class="language-${language}">${highlighted}</code></pre>`;
    
    // Replace output textarea with highlighted version
    const outputWrapper = outputText.parentElement;
    outputWrapper.innerHTML = '';
    outputWrapper.appendChild(highlightedDiv);
    
    toast('Syntax highlighting applied', 'success');
    addToHistory('Syntax Highlight', language);
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
      addToHistory('JSON', 'Prettify');
    } catch (e) {
      toast('Invalid JSON: ' + e.message, 'error');
    }
  });

  // minify JSON
  $('#minifyJson').addEventListener('click', () => {
    const s = inputText.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      outputText.value = JSON.stringify(obj);
      updateCounts(outputText.value);
      toast('JSON minified successfully', 'success');
      addToHistory('JSON', 'Minify');
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
      addToHistory('Base64', 'Encode');
    } catch (e) {
      toast('Encoding failed: ' + e.message, 'error');
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
      addToHistory('Base64', 'Decode');
    } catch (e) {
      toast('Invalid Base64: ' + e.message, 'error');
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
      addToHistory('URL', 'Encode');
    } catch (e) {
      toast('Encoding failed: ' + e.message, 'error');
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
      addToHistory('URL', 'Decode');
    } catch (e) {
      toast('Invalid URL encoding: ' + e.message, 'error');
    }
  });

  // Paste functionality
  $('#pasteText').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputText.value = text;
      updateCounts(text);
      toast('Text pasted from clipboard', 'success');
      addToHistory('Paste', 'From clipboard');
    } catch (e) {
      toast('Failed to paste: ' + e.message, 'error');
    }
  });

  // save/load/reset (localStorage)
  $('#saveLocal').addEventListener('click', () => {
    storage.setItem(saveKey('text:input'), inputText.value);
    storage.setItem(saveKey('text:output'), outputText.value);
    toast('Saved to localStorage', 'success');
    addToHistory('Save', 'To localStorage');
  });

  $('#loadLocal').addEventListener('click', () => {
    const a = storage.getItem(saveKey('text:input')) || '';
    const b = storage.getItem(saveKey('text:output')) || '';
    inputText.value = a;
    outputText.value = b;
    updateCounts(inputText.value || outputText.value);
    toast('Loaded from localStorage', 'success');
    addToHistory('Load', 'From localStorage');
  });

  $('#reset').addEventListener('click', () => {
    if (!confirm('Reset all areas?')) return;
    inputText.value = '';
    outputText.value = '';
    updateCounts('');
    toast('Reset complete', 'success');
    addToHistory('Reset', 'All areas');
  });

  // autosave
  let autoSaveInterval;
  function setupAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    if (state.settings.autoSave) {
      autoSaveInterval = setInterval(() => {
        storage.setItem(saveKey('text:auto'), inputText.value);
      }, 5000);
    }
  }

  setupAutoSave();

  const autosaved = storage.getItem(saveKey('text:auto'));
  if (autosaved) {
    inputText.value = autosaved;
    updateCounts(autosaved);
  }

  // --- drag & drop for text
  const textDrop = $('#textDrop');
  
  function setupDrop(zone, targetTextarea, allowed = ['txt', 'md', 'json']) {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', e => {
      zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', async e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext) && allowed.length) return toast('File type not supported: ' + ext, 'error');
      
      try {
        const text = await f.text();
        targetTextarea.value = text;
        if (targetTextarea === inputText) {
          updateCounts(text);
        }
        toast('File loaded: ' + f.name, 'success');
        addToHistory('File Load', f.name);
      } catch (err) {
        toast('Failed to load file: ' + err.message, 'error');
      }
    });
    
    zone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = allowed.map(ext => '.' + ext).join(',');
      input.onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        const ext = f.name.split('.').pop().toLowerCase();
        if (!allowed.includes(ext) && allowed.length) return toast('File type not supported: ' + ext, 'error');
        
        try {
          const text = await f.text();
          targetTextarea.value = text;
          if (targetTextarea === inputText) {
            updateCounts(text);
          }
          toast('File loaded: ' + f.name, 'success');
          addToHistory('File Load', f.name);
        } catch (err) {
          toast('Failed to load file: ' + err.message, 'error');
        }
      };
      input.click();
    });
  }
  
  setupDrop(textDrop, inputText, ['txt', 'md', 'json']);

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
      let actionName = '';
      
      switch (act) {
        case 'minify-html':
          out = minifyHTML(src);
          actionName = 'Minify HTML';
          break;
        case 'minify-css':
          out = cleanCSS(src);
          actionName = 'Minify CSS';
          break;
        case 'minify-js':
          out = cleanJS(src);
          actionName = 'Minify JS';
          break;
        case 'remove-comments':
          out = removeCommentsCSSJS(src);
          actionName = 'Remove Comments';
          break;
      }
      
      codeOutput.value = out;
      toast('Operation completed: ' + actionName, 'success');
      addToHistory('Code Cleaner', actionName);
    });
  });

  $('#formatHtml').addEventListener('click', () => {
    codeOutput.value = formatHTMLbasic(codeInput.value);
    toast('HTML formatted (basic)', 'success');
    addToHistory('Code Cleaner', 'Format HTML');
  });

  $('#formatCss').addEventListener('click', () => {
    codeOutput.value = formatCSS(codeInput.value);
    toast('CSS formatted', 'success');
    addToHistory('Code Cleaner', 'Format CSS');
  });

  $('#formatJs').addEventListener('click', () => {
    codeOutput.value = formatJS(codeInput.value);
    toast('JavaScript formatted', 'success');
    addToHistory('Code Cleaner', 'Format JS');
  });

  $('#beautifyJson').addEventListener('click', () => {
    const s = codeInput.value.trim();
    if (!s) return toast('Enter JSON in input', 'warning');
    try {
      const obj = JSON.parse(s);
      codeOutput.value = JSON.stringify(obj, null, 2);
      toast('JSON beautified successfully', 'success');
      addToHistory('Code Cleaner', 'Beautify JSON');
    } catch (e) {
      toast('Invalid JSON: ' + e.message, 'error');
    }
  });

  $('#copyCode').addEventListener('click', async () => {
    try {
      await copyToClipboard(codeOutput.value || codeInput.value);
      toast('Copied to clipboard', 'success');
      addToHistory('Copy', 'Code output');
    } catch (e) {
      toast('Failed to copy: ' + e.message, 'error');
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
    addToHistory('Download', `Code file (.${ext})`);
  });

  // Paste functionality for code
  $('#pasteCode').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      codeInput.value = text;
      toast('Code pasted from clipboard', 'success');
      addToHistory('Paste', 'Code from clipboard');
    } catch (e) {
      toast('Failed to paste: ' + e.message, 'error');
    }
  });

  // drag & drop for code files
  const codeDrop = $('#codeDrop');
  setupDrop(codeDrop, codeInput, ['html', 'css', 'js', 'txt']);

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
    addToHistory('Preview', 'Code preview');
  });

  $('#refreshPreview').addEventListener('click', () => {
    const src = codeOutput.value || codeInput.value;
    if (!src) return toast('No code to preview', 'warning');
    
    const iframe = $('#previewFrame');
    let doc = src;
    if (!/<html/i.test(src)) {
      doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${src}</body></html>`;
    }
    
    iframe.srcdoc = doc;
    toast('Preview refreshed', 'success');
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
    addToHistory('HTML Decoder', 'Decode entities');
  });
  
  $('#encodeBtn').addEventListener('click', () => {
    encoded.value = encodeHTMLEntities(decoded.value || encoded.value);
    toast('Encode complete', 'success');
    addToHistory('HTML Decoder', 'Encode entities');
  });
  
  $('#copyDecoded').addEventListener('click', async () => {
    try {
      await copyToClipboard(decoded.value);
      toast('Copied to clipboard', 'success');
      addToHistory('Copy', 'Decoded text');
    } catch (e) {
      toast('Failed to copy: ' + e.message, 'error');
    }
  });
  
  $('#autoDetectEntities').addEventListener('click', () => {
    const v = encoded.value;
    if (/&[a-z0-9]+;/.test(v) || /&lt;|&gt;|&amp;/.test(v)) {
      decoded.value = decodeHTMLEntities(v);
      toast('Entities detected and decoded', 'success');
      addToHistory('HTML Decoder', 'Auto-detect & decode');
    } else {
      toast('No HTML entities found in input', 'warning');
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
    addToHistory('Combine', 'HTML/CSS/JS');
  });

  $('#copyCombined').addEventListener('click', async () => {
    try {
      await copyToClipboard(combinedOutput.value);
      toast('Combined code copied', 'success');
      addToHistory('Copy', 'Combined HTML');
    } catch (e) {
      toast('Failed to copy: ' + e.message, 'error');
    }
  });

  $('#downloadCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to download', 'warning');
    downloadBlob(html, 'text/html', 'combined.html');
    toast('Downloading combined.html', 'success');
    addToHistory('Download', 'Combined HTML');
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
    addToHistory('Preview', 'Combined HTML');
  });

  $('#refreshCombinedPreview').addEventListener('click', () => {
    const html = combinedOutput.value;
    if (!html) return toast('No combined code to preview', 'warning');
    
    const ifr = $('#previewCombined');
    ifr.srcdoc = html;
    toast('Combined preview refreshed', 'success');
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
    addToHistory('Split', 'HTML into parts');
  });

  $('#downloadHtml').addEventListener('click', () => {
    const t = splitHtml.value;
    if (!t) return toast('No HTML to download', 'warning');
    downloadBlob(t, 'text/html', 'split.html');
    toast('Downloading split.html', 'success');
    addToHistory('Download', 'Split HTML');
  });

  $('#downloadCss').addEventListener('click', () => {
    const t = splitCss.value;
    if (!t) return toast('No CSS to download', 'warning');
    downloadBlob(t, 'text/css', 'styles.css');
    toast('Downloading styles.css', 'success');
    addToHistory('Download', 'Split CSS');
  });

  $('#downloadJs').addEventListener('click', () => {
    const t = splitJs.value;
    if (!t) return toast('No JavaScript to download', 'warning');
    downloadBlob(t, 'application/javascript', 'script.js');
    toast('Downloading script.js', 'success');
    addToHistory('Download', 'Split JS');
  });

  $('#copySplitAll').addEventListener('click', async () => {
    const combined = `HTML:\n${splitHtml.value}\n\nCSS:\n${splitCss.value}\n\nJS:\n${splitJs.value}`;
    try {
      await copyToClipboard(combined);
      toast('All parts copied', 'success');
      addToHistory('Copy', 'All split parts');
    } catch (e) {
      toast('Failed to copy: ' + e.message, 'error');
    }
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
      
      regexResult.innerHTML = highlightedText || '<div style="color: var(--text-tertiary);">No matches found</div>';
      regexMatchCount.textContent = matches ? matches.length : 0;
      regexTestTime.textContent = testTime + 'ms';
      
      toast('Regex test completed', 'success');
      addToHistory('Regex Test', pattern);
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
    regexResult.innerHTML = '<div style="color: var(--text-tertiary);">Enter a regex pattern and click "Test Regex" to see matches highlighted here.</div>';
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
      addToHistory('Copy', 'Regex result');
    } catch (e) {
      toast('Failed to copy: ' + e.message, 'error');
    }
  });

  // --- SETTINGS
  // Font size control
  const fontSizeInput = $('#fontSize');
  const fontSizeValue = $('#fontSizeValue');
  
  fontSizeInput.addEventListener('input', (e) => {
    const size = e.target.value;
    fontSizeValue.textContent = size + 'px';
    document.documentElement.style.setProperty('--editor-font-size', size + 'px');
    state.settings.fontSize = parseInt(size);
    storage.setItem(saveKey('settings'), JSON.stringify(state.settings));
  });
  
  // Line numbers toggle
  const lineNumbersToggle = $('#lineNumbersToggle');
  
  lineNumbersToggle.addEventListener('change', (e) => {
    const show = e.target.checked;
    $$('.line-numbers').forEach(el => {
      el.style.display = show ? 'block' : 'none';
    });
    
    $$('.editor-content').forEach(el => {
      if (show) {
        el.classList.remove('no-line-numbers');
      } else {
        el.classList.add('no-line-numbers');
      }
    });
    
    state.settings.lineNumbers = show;
    storage.setItem(saveKey('settings'), JSON.stringify(state.settings));
  });
  
  // Word wrap toggle
  const wordWrapToggle = $('#wordWrapToggle');
  
  wordWrapToggle.addEventListener('change', (e) => {
    const wrap = e.target.checked;
    textareas.forEach(textarea => {
      if (wrap) {
        textarea.classList.add('word-wrap');
      } else {
        textarea.classList.remove('word-wrap');
      }
    });
    state.settings.wordWrap = wrap;
    storage.setItem(saveKey('settings'), JSON.stringify(state.settings));
  });
  
  // Auto save toggle
  const autoSaveToggle = $('#autoSaveToggle');
  
  autoSaveToggle.addEventListener('change', (e) => {
    state.settings.autoSave = e.target.checked;
    storage.setItem(saveKey('settings'), JSON.stringify(state.settings));
    setupAutoSave();
    toast(state.settings.autoSave ? 'Auto save enabled' : 'Auto save disabled', 'success');
  });
  
  // Load saved settings
  const savedSettings = storage.getItem(saveKey('settings'));
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      state.settings = { ...state.settings, ...settings };
      
      // Apply settings
      fontSizeInput.value = state.settings.fontSize;
      fontSizeValue.textContent = state.settings.fontSize + 'px';
      document.documentElement.style.setProperty('--editor-font-size', state.settings.fontSize + 'px');
      
      lineNumbersToggle.checked = state.settings.lineNumbers;
      lineNumbersToggle.dispatchEvent(new Event('change'));
      
      wordWrapToggle.checked = state.settings.wordWrap;
      wordWrapToggle.dispatchEvent(new Event('change'));
      
      autoSaveToggle.checked = state.settings.autoSave;
      setupAutoSave();
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }
  
  // Export settings
  $('#exportSettings').addEventListener('click', () => {
    const settings = {
      theme: state.theme,
      settings: state.settings,
      history: state.history
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ctcpro-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Settings exported', 'success');
  });
  
  // Import settings
  $('#importSettings').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const settings = JSON.parse(event.target.result);
          
          // Apply theme
          if (settings.theme && settings.theme !== state.theme) {
            if (settings.theme === 'light') {
              document.body.classList.add('light-theme');
              themeToggle.innerHTML = '<i class="fas fa-sun"></i> Theme';
            } else {
              document.body.classList.remove('light-theme');
              themeToggle.innerHTML = '<i class="fas fa-moon"></i> Theme';
            }
            state.theme = settings.theme;
          }
          
          // Apply settings
          if (settings.settings) {
            if (settings.settings.fontSize) {
              fontSizeInput.value = settings.settings.fontSize;
              fontSizeValue.textContent = settings.settings.fontSize + 'px';
              document.documentElement.style.setProperty('--editor-font-size', settings.settings.fontSize + 'px');
            }
            
            if (settings.settings.lineNumbers !== undefined) {
              lineNumbersToggle.checked = settings.settings.lineNumbers;
              lineNumbersToggle.dispatchEvent(new Event('change'));
            }
            
            if (settings.settings.wordWrap !== undefined) {
              wordWrapToggle.checked = settings.settings.wordWrap;
              wordWrapToggle.dispatchEvent(new Event('change'));
            }
            
            if (settings.settings.autoSave !== undefined) {
              autoSaveToggle.checked = settings.settings.autoSave;
              setupAutoSave();
            }
            
            state.settings = { ...state.settings, ...settings.settings };
          }
          
          // Apply history
          if (settings.history) {
            state.history = settings.history;
            updateHistoryDisplay();
          }
          
          toast('Settings imported', 'success');
        } catch (e) {
          toast('Invalid settings file', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  // clear all storage
  $('#clearAll').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all localStorage data for this tool?')) {
      Object.keys(storage).filter(k => k.startsWith('ctcpro:')).forEach(k => storage.removeItem(k));
      state.history = [];
      updateHistoryDisplay();
      toast('Local data cleared', 'success');
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
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      $('#saveLocal').click();
    }
    
    // Ctrl/Cmd + O: Load
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      $('#loadLocal').click();
    }
    
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
    
    // Ctrl/Cmd + Shift + C: Copy with line numbers
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      const activePanel = $('.panel.active');
      if (activePanel) {
        const textarea = activePanel.querySelector('textarea.editor:not([readonly])');
        if (textarea) {
          copyWithLineNumbers(textarea.id);
        }
      }
    }
    
    // Ctrl/Cmd + R: Reset
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      $('#reset').click();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      if (state.findReplace.isActive) {
        hideFindReplace();
      }
    }
  });

  // --- Load history
  const savedHistory = storage.getItem(saveKey('history'));
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
      updateHistoryDisplay();
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }

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