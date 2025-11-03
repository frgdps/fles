/*
  Code Text Cleaner Pro - GitHub Dark Mode Edition
  Features: text utils, code cleaner, html decoder, combine/split, regex tester, find/replace
  Author: Thio Saputra
  Improved with modular architecture, enhanced features, and better performance
*/

(() => {
  // --- State Management
  const state = {
    currentTool: 'text',
    theme: 'dark',
    findReplace: {
      isActive: false,
      currentMatch: -1,
      matches: [],
      caseSensitive: false,
      useRegex: false
    },
    autoSave: {
      enabled: true,
      interval: 30000, // 30 seconds
      lastSaved: null
    },
    editorState: {}
  };

  // --- DOM Elements Cache
  const elements = {
    body: document.body,
    toast: $('#toast'),
    themeToggle: $('#themeToggle'),
    navItems: $$('.nav-item'),
    panels: $$('.panel'),
    findReplaceContainer: $('#findReplaceContainer'),
    findInput: $('#findInput'),
    replaceInput: $('#replaceInput'),
    findNextBtn: $('#findNextBtn'),
    findPrevBtn: $('#findPrevBtn'),
    replaceBtn: $('#replaceBtn'),
    replaceAllBtn: $('#replaceAllBtn'),
    findReplaceInfo: $('#findReplaceInfo'),
    findReplaceCase: $('#findReplaceCase'),
    findReplaceRegex: $('#findReplaceRegex'),
    closeFindReplace: $('#closeFindReplace'),
    // Text Tools
    inputText: $('#inputText'),
    outputText: $('#outputText'),
    wordCount: $('#wordCount'),
    charCount: $('#charCount'),
    lineCount: $('#lineCount'),
    // Code Cleaner
    codeInput: $('#codeInput'),
    codeOutput: $('#codeOutput'),
    // HTML Decoder
    encoded: $('#encoded'),
    decoded: $('#decoded'),
    // Combine
    combineHtml: $('#combineHtml'),
    combineCss: $('#combineCss'),
    combineJs: $('#combineJs'),
    combinedOutput: $('#combinedOutput'),
    // Split
    splitInput: $('#splitInput'),
    splitHtml: $('#splitHtml'),
    splitCss: $('#splitCss'),
    splitJs: $('#splitJs'),
    // Regex
    regexPattern: $('#regexPattern'),
    regexTestText: $('#regexTestText'),
    regexResult: $('#regexResult'),
    regexMatchCount: $('#regexMatchCount'),
    regexTestTime: $('#regexTestTime'),
    regexFlags: $$('.regex-flag')
  };

  // --- Utility Functions
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  
  // Safe localStorage wrapper with error handling
  const storage = (() => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return {
        getItem: key => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.error('localStorage access error:', e);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.error('localStorage access error:', e);
          }
        },
        removeItem: key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.error('localStorage access error:', e);
          }
        }
      };
    } catch (e) {
      console.error('localStorage not available:', e);
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };
    }
  })();
  
  // Enhanced toast notification system
  function toast(msg, type = 'info', timeout = 3000) {
    if (!elements.toast) return;
    
    elements.toast.textContent = msg;
    elements.toast.className = 'toast';
    elements.toast.classList.add(type);
    elements.toast.classList.remove('hidden');
    
    // Force reflow to ensure transition works
    void elements.toast.offsetWidth;
    
    elements.toast.classList.add('show');
    
    clearTimeout(elements.toast._t);
    elements.toast._t = setTimeout(() => {
      elements.toast.classList.remove('show');
      setTimeout(() => elements.toast.classList.add('hidden'), 250);
    }, timeout);
  }

  // --- Navigation
  function switchTool(tool) {
    state.currentTool = tool;
    
    // Update active state
    elements.navItems.forEach(item => item.classList.remove('active'));
    const activeNavItem = $(`.nav-item[data-tool="${tool}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');
    
    // Show corresponding panel
    elements.panels.forEach(panel => {
      panel.classList.toggle('active', panel.dataset.tool === tool);
    });
    
    // Save state
    saveState();
  }
  
  // Initialize navigation
  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tool = item.dataset.tool;
      switchTool(tool);
    });
  });

  // --- Theme Management
  function toggleTheme() {
    const isDark = !elements.body.classList.contains('light-theme');
    
    if (isDark) {
      elements.body.classList.remove('light-theme');
      state.theme = 'dark';
      if (elements.themeToggle) elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      toast('Switched to dark theme', 'success');
    } else {
      elements.body.classList.add('light-theme');
      state.theme = 'light';
      if (elements.themeToggle) elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      toast('Switched to light theme', 'success');
    }
    
    storage.setItem('ctcpro:theme', state.theme);
    saveState();
  }
  
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Load saved theme
  const savedTheme = storage.getItem('ctcpro:theme');
  if (savedTheme === 'light') {
    elements.body.classList.add('light-theme');
    state.theme = 'light';
    if (elements.themeToggle) elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
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
  function setupLineNumbers() {
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
          autoSaveEditor(textarea.id);
        });
        
        // Sync scroll
        textarea.addEventListener('scroll', () => {
          lineNumbers.scrollTop = textarea.scrollTop;
        });
      }
    });
  }

  // --- Find and Replace functionality
  let currentEditor = null;
  
  function showFindReplace() {
    if (!elements.findReplaceContainer) return;
    
    elements.findReplaceContainer.style.display = 'block';
    if (elements.findInput) elements.findInput.focus();
    state.findReplace.isActive = true;
    
    // Set current editor based on active panel
    const activePanel = $('.panel.active');
    if (activePanel) {
      const editor = activePanel.querySelector('textarea.editor:not([readonly])');
      if (editor) {
        currentEditor = editor;
        highlightMatches();
      }
    }
  }
  
  function hideFindReplace() {
    if (!elements.findReplaceContainer) return;
    
    elements.findReplaceContainer.style.display = 'none';
    state.findReplace.isActive = false;
    clearHighlights();
  }
  
  function highlightMatches() {
    if (!currentEditor || !elements.findInput || !elements.findInput.value) return;
    
    const searchText = elements.findInput.value;
    const text = currentEditor.value;
    const flags = state.findReplace.caseSensitive ? 'g' : 'gi';
    
    // Clear previous highlights
    clearHighlights();
    
    // Find all matches
    let matches = [];
    let match;
    const regex = state.findReplace.useRegex ? 
      new RegExp(searchText, flags) : 
      new RegExp(escapeRegExp(searchText), flags);
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
    
    state.findReplace.matches = matches;
    
    // Highlight matches in the editor
    if (matches.length > 0) {
      // Create a temporary div to hold the highlighted content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(regex, '<mark class="search-highlight">$&</mark>');
      
      // Replace the editor content with highlighted version
      currentEditor.value = text; // Keep original value
      currentEditor.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="transparent"/></svg>')`;
      
      // Update info
      if (elements.findReplaceInfo) {
        elements.findReplaceInfo.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`;
      }
      
      // Navigate to first match
      navigateToMatch(0);
    } else {
      if (elements.findReplaceInfo) {
        elements.findReplaceInfo.textContent = 'No matches found';
      }
    }
  }
  
  function clearHighlights() {
    if (!currentEditor) return;
    
    // Remove any existing highlights
    currentEditor.style.backgroundImage = '';
    state.findReplace.matches = [];
    state.findReplace.currentMatch = -1;
  }
  
  function navigateToMatch(index) {
    if (!currentEditor || state.findReplace.matches.length === 0) return;
    
    // Ensure index is within bounds
    if (index < 0) index = state.findReplace.matches.length - 1;
    if (index >= state.findReplace.matches.length) index = 0;
    
    const match = state.findReplace.matches[index];
    currentEditor.focus();
    currentEditor.setSelectionRange(match.start, match.end);
    
    // Scroll to match
    const lineHeight = parseInt(getComputedStyle(currentEditor).lineHeight);
    const linesBefore = currentEditor.value.substring(0, match.start).split('\n').length - 1;
    currentEditor.scrollTop = linesBefore * lineHeight - currentEditor.clientHeight / 2 + lineHeight / 2;
    
    state.findReplace.currentMatch = index;
    
    // Update active highlight
    updateActiveHighlight();
  }
  
  function updateActiveHighlight() {
    // This would be implemented if we were using a more complex highlighting system
    // For now, we just ensure the current match is visible
  }
  
  function findInEditor(direction = 'next') {
    if (!currentEditor || !elements.findInput || !elements.findInput.value) return;
    
    if (state.findReplace.matches.length === 0) {
      highlightMatches();
      return;
    }
    
    const currentIndex = state.findReplace.currentMatch;
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      if (newIndex >= state.findReplace.matches.length) newIndex = 0;
    } else {
      newIndex = currentIndex - 1;
      if (newIndex < 0) newIndex = state.findReplace.matches.length - 1;
    }
    
    navigateToMatch(newIndex);
  }
  
  function replaceInEditor() {
    if (!currentEditor || !elements.findInput || !elements.findInput.value) return;
    
    const searchText = elements.findInput.value;
    const replaceText = elements.replaceInput ? elements.replaceInput.value : '';
    const currentIndex = state.findReplace.currentMatch;
    
    if (currentIndex >= 0 && currentIndex < state.findReplace.matches.length) {
      const match = state.findReplace.matches[currentIndex];
      const before = currentEditor.value.substring(0, match.start);
      const after = currentEditor.value.substring(match.end);
      
      currentEditor.value = before + replaceText + after;
      
      // Update line numbers
      const lineNumbersId = currentEditor.id + 'LineNumbers';
      updateLineNumbers(currentEditor, lineNumbersId);
      
      // Auto-save
      autoSaveEditor(currentEditor.id);
      
      // Re-highlight matches
      highlightMatches();
      
      toast('Replaced 1 occurrence', 'success');
    } else {
      toast('No match at cursor position', 'warning');
    }
  }
  
  function replaceAllInEditor() {
    if (!currentEditor || !elements.findInput || !elements.findInput.value) return;
    
    const searchText = elements.findInput.value;
    const replaceText = elements.replaceInput ? elements.replaceInput.value : '';
    const flags = state.findReplace.caseSensitive ? 'g' : 'g';
    
    let regex;
    try {
      regex = state.findReplace.useRegex ? 
        new RegExp(searchText, flags) : 
        new RegExp(escapeRegExp(searchText), flags);
    } catch (e) {
      toast('Invalid regular expression', 'error');
      return;
    }
    
    const originalValue = currentEditor.value;
    const newValue = originalValue.replace(regex, replaceText);
    
    if (originalValue !== newValue) {
      currentEditor.value = newValue;
      
      // Update line numbers
      const lineNumbersId = currentEditor.id + 'LineNumbers';
      updateLineNumbers(currentEditor, lineNumbersId);
      
      // Auto-save
      autoSaveEditor(currentEditor.id);
      
      // Count replacements
      const matchCount = (originalValue.match(regex) || []).length;
      toast(`Replaced ${matchCount} occurrences`, 'success');
    } else {
      toast('No matches found', 'warning');
    }
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // Initialize find/replace event listeners
  function initFindReplace() {
    if (!elements.findReplaceContainer) return;
    
    const findReplaceBtn = $('#findReplaceBtn');
    if (findReplaceBtn) {
      findReplaceBtn.addEventListener('click', showFindReplace);
    }
    
    if (elements.closeFindReplace) {
      elements.closeFindReplace.addEventListener('click', hideFindReplace);
    }
    
    if (elements.findNextBtn) {
      elements.findNextBtn.addEventListener('click', () => findInEditor('next'));
    }
    
    if (elements.findPrevBtn) {
      elements.findPrevBtn.addEventListener('click', () => findInEditor('prev'));
    }
    
    if (elements.replaceBtn) {
      elements.replaceBtn.addEventListener('click', replaceInEditor);
    }
    
    if (elements.replaceAllBtn) {
      elements.replaceAllBtn.addEventListener('click', replaceAllInEditor);
    }
    
    if (elements.findInput) {
      elements.findInput.addEventListener('input', highlightMatches);
      
      elements.findInput.addEventListener('keydown', (e) => {
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
    }
    
    if (elements.replaceInput) {
      elements.replaceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          replaceInEditor();
        } else if (e.key === 'Escape') {
          hideFindReplace();
        }
      });
    }
    
    if (elements.findReplaceCase) {
      elements.findReplaceCase.addEventListener('change', (e) => {
        state.findReplace.caseSensitive = e.target.checked;
        highlightMatches();
      });
    }
    
    if (elements.findReplaceRegex) {
      elements.findReplaceRegex.addEventListener('change', (e) => {
        state.findReplace.useRegex = e.target.checked;
        highlightMatches();
      });
    }
  }

  // --- Clipboard helper function
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return;
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const result = document.execCommand('copy');
      if (!result) {
        throw new Error('Unable to copy');
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      throw e;
    } finally {
      // Clean up
      const textArea = document.querySelector('textarea[style*="position: fixed"]');
      if (textArea) {
        document.body.removeChild(textArea);
      }
    }
  }

  // --- Auto-save functionality
  function autoSaveEditor(editorId) {
    if (!state.autoSave.enabled) return;
    
    const editor = $(`#${editorId}`);
    if (!editor) return;
    
    // Save editor content to state
    state.editorState[editorId] = editor.value;
    
    // Save to localStorage with debounce
    clearTimeout(state.autoSave._debounce);
    state.autoSave._debounce = setTimeout(() => {
      storage.setItem(`ctcpro:editor:${editorId}`, editor.value);
      state.autoSave.lastSaved = new Date().toISOString();
    }, 1000);
  }
  
  function loadEditorState() {
    // Load each editor's content from localStorage
    const editors = $$('textarea.editor');
    editors.forEach(editor => {
      const savedContent = storage.getItem(`ctcpro:editor:${editor.id}`);
      if (savedContent !== null) {
        editor.value = savedContent;
        state.editorState[editor.id] = savedContent;
        
        // Update line numbers
        const lineNumbersId = editor.id + 'LineNumbers';
        updateLineNumbers(editor, lineNumbersId);
      }
    });
  }
  
  function saveState() {
    try {
      storage.setItem('ctcpro:state', JSON.stringify({
        currentTool: state.currentTool,
        theme: state.theme,
        autoSave: state.autoSave
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }
  
  function loadState() {
    try {
      const savedState = storage.getItem('ctcpro:state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        if (parsed.currentTool) {
          state.currentTool = parsed.currentTool;
          switchTool(state.currentTool);
        }
        
        if (parsed.theme) {
          state.theme = parsed.theme;
          if (parsed.theme === 'light') {
            elements.body.classList.add('light-theme');
            if (elements.themeToggle) elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
          }
        }
        
        if (parsed.autoSave) {
          state.autoSave = { ...state.autoSave, ...parsed.autoSave };
        }
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  // --- TEXT TOOLS
  function initTextTools() {
    if (!elements.inputText || !elements.outputText || !elements.wordCount || !elements.charCount || !elements.lineCount) {
      return;
    }
    
    function updateCounts(txt) {
      const chars = txt.length;
      const words = (txt.trim().match(/\S+/g) || []).length;
      const lines = txt.split('\n').length;
      
      elements.charCount.textContent = chars;
      elements.wordCount.textContent = words;
      elements.lineCount.textContent = lines;
    }

    function transformText(action) {
      let t = elements.inputText.value;
      
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
        case 'removeduplicates':
          t = [...new Set(t.split('\n'))].join('\n');
          break;
        case 'shuffle':
          const lines = t.split('\n');
          for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
          }
          t = lines.join('\n');
          break;
      }
      
      elements.outputText.value = t;
      updateCounts(t);
      toast('Transformation complete', 'success');
      autoSaveEditor('outputText');
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => transformText(btn.dataset.action));
    });

    elements.inputText.addEventListener('input', e => {
      updateCounts(elements.inputText.value);
      autoSaveEditor('inputText');
    });

    const copyOutput = $('#copyOutput');
    if (copyOutput) {
      copyOutput.addEventListener('click', async () => {
        try {
          await copyToClipboard(elements.outputText.value || elements.inputText.value);
          toast('Copied to clipboard', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }

    const downloadTxt = $('#downloadTxt');
    if (downloadTxt) {
      downloadTxt.addEventListener('click', () => {
        const txt = elements.outputText.value || elements.inputText.value;
        if (!txt) return toast('No text to download', 'warning');
        downloadBlob(txt, 'text/plain', 'output.txt');
        toast('Downloading output.txt', 'success');
      });
    }

    const pasteText = $('#pasteText');
    if (pasteText) {
      pasteText.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          elements.inputText.value = text;
          updateCounts(text);
          autoSaveEditor('inputText');
          toast('Text pasted from clipboard', 'success');
        } catch (e) {
          toast('Failed to paste', 'error');
        }
      });
    }

    const clearText = $('#clearText');
    if (clearText) {
      clearText.addEventListener('click', () => {
        elements.inputText.value = '';
        elements.outputText.value = '';
        updateCounts('');
        autoSaveEditor('inputText');
        autoSaveEditor('outputText');
        toast('Text cleared', 'success');
      });
    }

    const swapText = $('#swapText');
    if (swapText) {
      swapText.addEventListener('click', () => {
        const temp = elements.inputText.value;
        elements.inputText.value = elements.outputText.value;
        elements.outputText.value = temp;
        updateCounts(elements.inputText.value);
        autoSaveEditor('inputText');
        autoSaveEditor('outputText');
        toast('Text swapped', 'success');
      });
    }

    // prettify JSON
    const prettyJson = $('#prettyJson');
    if (prettyJson) {
      prettyJson.addEventListener('click', () => {
        const s = elements.inputText.value.trim();
        if (!s) return toast('Enter JSON in input', 'warning');
        try {
          const obj = JSON.parse(s);
          elements.outputText.value = JSON.stringify(obj, null, 2);
          updateCounts(elements.outputText.value);
          autoSaveEditor('outputText');
          toast('JSON prettified successfully', 'success');
        } catch (e) {
          toast('Invalid JSON: ' + e.message, 'error');
        }
      });
    }

    // Base64 encode
    const base64Encode = $('#base64Encode');
    if (base64Encode) {
      base64Encode.addEventListener('click', () => {
        const s = elements.inputText.value.trim();
        if (!s) return toast('Enter text to encode', 'warning');
        try {
          elements.outputText.value = btoa(unescape(encodeURIComponent(s)));
          updateCounts(elements.outputText.value);
          autoSaveEditor('outputText');
          toast('Text encoded to Base64', 'success');
        } catch (e) {
          toast('Encoding failed', 'error');
        }
      });
    }

    // Base64 decode
    const base64Decode = $('#base64Decode');
    if (base64Decode) {
      base64Decode.addEventListener('click', () => {
        const s = elements.inputText.value.trim();
        if (!s) return toast('Enter Base64 to decode', 'warning');
        try {
          elements.outputText.value = decodeURIComponent(escape(atob(s)));
          updateCounts(elements.outputText.value);
          autoSaveEditor('outputText');
          toast('Base64 decoded successfully', 'success');
        } catch (e) {
          toast('Invalid Base64', 'error');
        }
      });
    }

    // URL encode
    const urlEncode = $('#urlEncode');
    if (urlEncode) {
      urlEncode.addEventListener('click', () => {
        const s = elements.inputText.value.trim();
        if (!s) return toast('Enter text to encode', 'warning');
        try {
          elements.outputText.value = encodeURIComponent(s);
          updateCounts(elements.outputText.value);
          autoSaveEditor('outputText');
          toast('Text URL encoded', 'success');
        } catch (e) {
          toast('Encoding failed', 'error');
        }
      });
    }

    // URL decode
    const urlDecode = $('#urlDecode');
    if (urlDecode) {
      urlDecode.addEventListener('click', () => {
        const s = elements.inputText.value.trim();
        if (!s) return toast('Enter URL to decode', 'warning');
        try {
          elements.outputText.value = decodeURIComponent(s);
          updateCounts(elements.outputText.value);
          autoSaveEditor('outputText');
          toast('URL decoded', 'success');
        } catch (e) {
          toast('Invalid URL encoding', 'error');
        }
      });
    }
  }

  // --- CODE CLEANER
  function initCodeCleaner() {
    if (!elements.codeInput || !elements.codeOutput) return;
    
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

    document.querySelectorAll('[data-code-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.codeAction;
        let src = elements.codeInput.value;
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
        
        elements.codeOutput.value = out;
        autoSaveEditor('codeOutput');
        toast('Operation completed', 'success');
      });
    });

    const formatHtml = $('#formatHtml');
    if (formatHtml) {
      formatHtml.addEventListener('click', () => {
        elements.codeOutput.value = formatHTMLbasic(elements.codeInput.value);
        autoSaveEditor('codeOutput');
        toast('HTML formatted', 'success');
      });
    }

    const formatCss = $('#formatCss');
    if (formatCss) {
      formatCss.addEventListener('click', () => {
        elements.codeOutput.value = formatCSS(elements.codeInput.value);
        autoSaveEditor('codeOutput');
        toast('CSS formatted', 'success');
      });
    }

    const formatJs = $('#formatJs');
    if (formatJs) {
      formatJs.addEventListener('click', () => {
        elements.codeOutput.value = formatJS(elements.codeInput.value);
        autoSaveEditor('codeOutput');
        toast('JavaScript formatted', 'success');
      });
    }

    const beautifyJson = $('#beautifyJson');
    if (beautifyJson) {
      beautifyJson.addEventListener('click', () => {
        const s = elements.codeInput.value.trim();
        if (!s) return toast('Enter JSON in input', 'warning');
        try {
          const obj = JSON.parse(s);
          elements.codeOutput.value = JSON.stringify(obj, null, 2);
          autoSaveEditor('codeOutput');
          toast('JSON beautified successfully', 'success');
        } catch (e) {
          toast('Invalid JSON', 'error');
        }
      });
    }

    const copyCode = $('#copyCode');
    if (copyCode) {
      copyCode.addEventListener('click', async () => {
        try {
          await copyToClipboard(elements.codeOutput.value || elements.codeInput.value);
          toast('Copied to clipboard', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }

    const downloadCode = $('#downloadCode');
    if (downloadCode) {
      downloadCode.addEventListener('click', () => {
        const txt = elements.codeOutput.value || elements.codeInput.value;
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
    }

    const pasteCode = $('#pasteCode');
    if (pasteCode) {
      pasteCode.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          elements.codeInput.value = text;
          autoSaveEditor('codeInput');
          toast('Code pasted from clipboard', 'success');
        } catch (e) {
          toast('Failed to paste', 'error');
        }
      });
    }

    const clearCode = $('#clearCode');
    if (clearCode) {
      clearCode.addEventListener('click', () => {
        elements.codeInput.value = '';
        elements.codeOutput.value = '';
        autoSaveEditor('codeInput');
        autoSaveEditor('codeOutput');
        toast('Code cleared', 'success');
      });
    }

    const swapCode = $('#swapCode');
    if (swapCode) {
      swapCode.addEventListener('click', () => {
        const temp = elements.codeInput.value;
        elements.codeInput.value = elements.codeOutput.value;
        elements.codeOutput.value = temp;
        autoSaveEditor('codeInput');
        autoSaveEditor('codeOutput');
        toast('Code swapped', 'success');
      });
    }

    // preview iframe for code
    const previewCode = $('#previewCode');
    if (previewCode) {
      previewCode.addEventListener('click', () => {
        const src = elements.codeOutput.value || elements.codeInput.value;
        if (!src) return toast('No code to preview', 'warning');
        
        const previewWrap = $('#previewWrap');
        const iframe = $('#previewFrame');
        
        if (!previewWrap || !iframe) return;
        
        // if html fragment, wrap minimal
        let doc = src;
        if (!/<html/i.test(src)) {
          doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${src}</body></html>`;
        }
        
        iframe.srcdoc = doc;
        previewWrap.classList.remove('hidden');
        toast('Preview ready', 'success');
      });
    }

    const closePreview = $('#closePreview');
    if (closePreview) {
      closePreview.addEventListener('click', () => {
        const previewWrap = $('#previewWrap');
        const iframe = $('#previewFrame');
        
        if (previewWrap) previewWrap.classList.add('hidden');
        if (iframe) iframe.srcdoc = 'about:blank';
      });
    }
  }

  // --- HTML ENTITY DECODER / ENCODER
  function initHtmlDecoder() {
    if (!elements.encoded || !elements.decoded) return;
    
    const decodeBtn = $('#decodeBtn');
    if (decodeBtn) {
      decodeBtn.addEventListener('click', () => {
        elements.decoded.value = decodeHTMLEntities(elements.encoded.value);
        autoSaveEditor('decoded');
        toast('Decode complete', 'success');
      });
    }
    
    const encodeBtn = $('#encodeBtn');
    if (encodeBtn) {
      encodeBtn.addEventListener('click', () => {
        elements.encoded.value = encodeHTMLEntities(elements.decoded.value || elements.encoded.value);
        autoSaveEditor('encoded');
        toast('Encode complete', 'success');
      });
    }
    
    const copyDecoded = $('#copyDecoded');
    if (copyDecoded) {
      copyDecoded.addEventListener('click', async () => {
        try {
          await copyToClipboard(elements.decoded.value);
          toast('Copied to clipboard', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }
    
    const copyEncoded = $('#copyEncoded');
    if (copyEncoded) {
      copyEncoded.addEventListener('click', async () => {
        try {
          await copyToClipboard(elements.encoded.value);
          toast('Copied to clipboard', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }
    
    const clearDecoder = $('#clearDecoder');
    if (clearDecoder) {
      clearDecoder.addEventListener('click', () => {
        elements.encoded.value = '';
        elements.decoded.value = '';
        autoSaveEditor('encoded');
        autoSaveEditor('decoded');
        toast('Fields cleared', 'success');
      });
    }
    
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
  }

  // --- COMBINE
  function initCombine() {
    if (!elements.combineHtml || !elements.combineCss || !elements.combineJs || !elements.combinedOutput) return;
    
    const combineBtn = $('#combineBtn');
    if (combineBtn) {
      combineBtn.addEventListener('click', () => {
        const htmlRaw = elements.combineHtml.value || '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n</head>\n<body>\n</body>\n</html>';
        let doc;
        
        try {
          if (/<html/i.test(htmlRaw)) {
            doc = htmlRaw;
            
            if (elements.combineCss.value.trim()) {
              if (/<\/head>/i.test(doc)) {
                doc = doc.replace(/<\/head>/i, `  <style>\n${elements.combineCss.value}\n  </style>\n</head>`);
              } else {
                doc = doc.replace(/<body.*?>/i, `<head><style>\n${elements.combineCss.value}\n</style></head></body>`);
              }
            }
            
            if (elements.combineJs.value.trim()) {
              if (/<\/body>/i.test(doc)) {
                doc = doc.replace(/<\/body>/i, `  <script>\n${elements.combineJs.value}\n  </script>\n</body>`);
              } else {
                doc += `\n<script>\n${elements.combineJs.value}\n</script>`;
              }
            }
          } else {
            doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n<style>\n${elements.combineCss.value}\n</style>\n</head>\n<body>\n${htmlRaw}\n<script>\n${elements.combineJs.value}\n</script>\n</body>\n</html>`;
          }
        } catch (e) {
          doc = htmlRaw;
        }
        
        elements.combinedOutput.value = doc;
        autoSaveEditor('combinedOutput');
        toast('Combine complete', 'success');
      });
    }

    const copyCombined = $('#copyCombined');
    if (copyCombined) {
      copyCombined.addEventListener('click', async () => {
        try {
          await copyToClipboard(elements.combinedOutput.value);
          toast('Combined code copied', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }

    const downloadCombined = $('#downloadCombined');
    if (downloadCombined) {
      downloadCombined.addEventListener('click', () => {
        const html = elements.combinedOutput.value;
        if (!html) return toast('No combined code to download', 'warning');
        downloadBlob(html, 'text/html', 'combined.html');
        toast('Downloading combined.html', 'success');
      });
    }

    // combined preview
    const previewCombined = $('#previewCombined');
    if (previewCombined) {
      previewCombined.addEventListener('click', () => {
        const html = elements.combinedOutput.value;
        if (!html) return toast('No combined code to preview', 'warning');
        
        const wrap = $('#previewCombinedWrap');
        const ifr = $('#previewCombined');
        if (!wrap || !ifr) return;
        
        ifr.srcdoc = html;
        wrap.classList.remove('hidden');
        toast('Combined preview ready', 'success');
      });
    }

    const closeCombinedPreview = $('#closeCombinedPreview');
    if (closeCombinedPreview) {
      closeCombinedPreview.addEventListener('click', () => {
        const wrap = $('#previewCombinedWrap');
        const ifr = $('#previewCombined');
        
        if (wrap) wrap.classList.add('hidden');
        if (ifr) ifr.srcdoc = 'about:blank';
      });
    }

    const clearCombine = $('#clearCombine');
    if (clearCombine) {
      clearCombine.addEventListener('click', () => {
        elements.combineHtml.value = '';
        elements.combineCss.value = '';
        elements.combineJs.value = '';
        elements.combinedOutput.value = '';
        autoSaveEditor('combineHtml');
        autoSaveEditor('combineCss');
        autoSaveEditor('combineJs');
        autoSaveEditor('combinedOutput');
        toast('Fields cleared', 'success');
      });
    }
  }

  // --- SPLIT
  function initSplit() {
    if (!elements.splitInput || !elements.splitHtml || !elements.splitCss || !elements.splitJs) return;
    
    const splitBtn = $('#splitBtn');
    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        const src = elements.splitInput.value;
        if (!src) return toast('Enter HTML containing <style> / <script>', 'warning');
        
        const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
        const scriptMatches = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
        
        let css = styleMatches.map(m => m[1]).join('\n\n').trim();
        let js = scriptMatches.map(m => m[1]).join('\n\n').trim();
        let htmlClean = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        elements.splitCss.value = css;
        elements.splitJs.value = js;
        elements.splitHtml.value = htmlClean.trim();
        
        autoSaveEditor('splitCss');
        autoSaveEditor('splitJs');
        autoSaveEditor('splitHtml');
        
        toast('Split complete', 'success');
      });
    }

    const downloadHtml = $('#downloadHtml');
    if (downloadHtml) {
      downloadHtml.addEventListener('click', () => {
        const t = elements.splitHtml.value;
        if (!t) return toast('No HTML to download', 'warning');
        downloadBlob(t, 'text/html', 'split.html');
        toast('Downloading split.html', 'success');
      });
    }

    const downloadCss = $('#downloadCss');
    if (downloadCss) {
      downloadCss.addEventListener('click', () => {
        const t = elements.splitCss.value;
        if (!t) return toast('No CSS to download', 'warning');
        downloadBlob(t, 'text/css', 'styles.css');
        toast('Downloading styles.css', 'success');
      });
    }

    const downloadJs = $('#downloadJs');
    if (downloadJs) {
      downloadJs.addEventListener('click', () => {
        const t = elements.splitJs.value;
        if (!t) return toast('No JavaScript to download', 'warning');
        downloadBlob(t, 'application/javascript', 'script.js');
        toast('Downloading script.js', 'success');
      });
    }

    const clearSplit = $('#clearSplit');
    if (clearSplit) {
      clearSplit.addEventListener('click', () => {
        elements.splitInput.value = '';
        elements.splitHtml.value = '';
        elements.splitCss.value = '';
        elements.splitJs.value = '';
        autoSaveEditor('splitInput');
        autoSaveEditor('splitHtml');
        autoSaveEditor('splitCss');
        autoSaveEditor('splitJs');
        toast('Fields cleared', 'success');
      });
    }
  }

  // --- REGEX TESTER
  function initRegexTester() {
    if (!elements.regexPattern || !elements.regexTestText || !elements.regexResult || 
        !elements.regexMatchCount || !elements.regexTestTime) return;
    
    let selectedFlags = new Set();
    
    // Toggle regex flags
    if (elements.regexFlags) {
      elements.regexFlags.forEach(flag => {
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
    }
    
    const testRegex = $('#testRegex');
    if (testRegex) {
      testRegex.addEventListener('click', () => {
        const pattern = elements.regexPattern.value;
        const text = elements.regexTestText.value;
        
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
          let matchDetails = [];
          
          if (matches) {
            // Reset regex to start from beginning
            regex.lastIndex = 0;
            
            let match;
            while ((match = regex.exec(text)) !== null) {
              // Store match details
              matchDetails.push({
                index: match.index,
                length: match[0].length,
                text: match[0],
                groups: match.slice(1)
              });
              
              // Highlight match
              highlightedText = highlightedText.substring(0, match.index) + 
                `<span class="regex-match">${match[0]}</span>` + 
                highlightedText.substring(match.index + match[0].length);
              
              // Highlight groups if any
              if (match.length > 1) {
                let groupIndex = match.index;
                for (let i = 1; i < match.length; i++) {
                  if (match[i]) {
                    const groupStart = text.indexOf(match[i], groupIndex);
                    const groupEnd = groupStart + match[i].length;
                    
                    highlightedText = highlightedText.substring(0, groupStart) + 
                      `<span class="regex-group">${match[i]}</span>` + 
                      highlightedText.substring(groupEnd);
                    
                    groupIndex = groupEnd;
                  }
                }
              }
            }
          }
          
          elements.regexResult.innerHTML = highlightedText || '<div class="empty-state">No matches found</div>';
          elements.regexMatchCount.textContent = matches ? matches.length : 0;
          elements.regexTestTime.textContent = testTime + 'ms';
          
          // Show match details if any
          if (matchDetails.length > 0) {
            const detailsHtml = matchDetails.map((match, i) => {
              let groupsHtml = '';
              if (match.groups.length > 0) {
                groupsHtml = '<div class="regex-groups">Groups: ' + 
                  match.groups.map((group, j) => 
                    `<span class="regex-group">Group ${j}: ${group}</span>`
                  ).join(', ') + '</div>';
              }
              
              return `<div class="regex-match-detail">
                <div class="regex-match-index">Match ${i + 1}: Position ${match.index}, Length ${match.length}</div>
                <div class="regex-match-text">Text: "${match.text}"</div>
                ${groupsHtml}
              </div>`;
            }).join('');
            
            const detailsContainer = $('#regexMatchDetails');
            if (detailsContainer) {
              detailsContainer.innerHTML = detailsHtml;
              detailsContainer.classList.remove('hidden');
            }
          } else {
            const detailsContainer = $('#regexMatchDetails');
            if (detailsContainer) {
              detailsContainer.classList.add('hidden');
            }
          }
          
          toast('Regex test completed', 'success');
        } catch (e) {
          elements.regexResult.innerHTML = `<div style="color: var(--accent-danger);">Invalid regex: ${e.message}</div>`;
          elements.regexMatchCount.textContent = '0';
          elements.regexTestTime.textContent = '0ms';
          
          const detailsContainer = $('#regexMatchDetails');
          if (detailsContainer) {
            detailsContainer.classList.add('hidden');
          }
          
          toast('Invalid regex pattern', 'error');
        }
      });
    }
    
    const clearRegex = $('#clearRegex');
    if (clearRegex) {
      clearRegex.addEventListener('click', () => {
        elements.regexPattern.value = '';
        elements.regexTestText.value = '';
        elements.regexResult.innerHTML = '<div class="empty-state">Enter a regex pattern and click "Test" to see matches</div>';
        elements.regexMatchCount.textContent = '0';
        elements.regexTestTime.textContent = '0ms';
        selectedFlags.clear();
        
        if (elements.regexFlags) {
          elements.regexFlags.forEach(flag => flag.classList.remove('active'));
        }
        
        const detailsContainer = $('#regexMatchDetails');
        if (detailsContainer) {
          detailsContainer.classList.add('hidden');
        }
        
        toast('Regex tester cleared', 'success');
      });
    }
    
    const copyRegexResult = $('#copyRegexResult');
    if (copyRegexResult) {
      copyRegexResult.addEventListener('click', async () => {
        try {
          const resultText = elements.regexResult.innerText;
          await copyToClipboard(resultText);
          toast('Regex result copied', 'success');
        } catch (e) {
          toast('Failed to copy', 'error');
        }
      });
    }
    
    const loadSampleRegex = $('#loadSampleRegex');
    if (loadSampleRegex) {
      loadSampleRegex.addEventListener('click', () => {
        elements.regexPattern.value = '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b';
        elements.regexTestText.value = 'Here are some IP addresses: 192.168.1.1, 10.0.0.1, and 172.16.254.1. This is not an IP: 999.999.999.999';
        selectedFlags.clear();
        
        if (elements.regexFlags) {
          elements.regexFlags.forEach(flag => flag.classList.remove('active'));
        }
        
        toast('Sample regex loaded', 'success');
      });
    }
  }

  // --- Individual word wrap toggles for each editor
  function setupWordWrapToggle(buttonId, textareaId) {
    const button = $(buttonId);
    const textarea = $(textareaId);
    
    if (!button || !textarea) return;
    
    button.addEventListener('click', () => {
      textarea.classList.toggle('word-wrap');
      const isWrapped = textarea.classList.contains('word-wrap');
      toast(isWrapped ? 'Word wrap enabled' : 'Word wrap disabled', 'success');
      
      // Save preference
      storage.setItem(`ctcpro:wordwrap:${textareaId}`, isWrapped);
    });
    
    // Load saved preference
    const savedWrap = storage.getItem(`ctcpro:wordwrap:${textareaId}`);
    if (savedWrap === 'true') {
      textarea.classList.add('word-wrap');
    }
  }
  
  function initWordWrapToggles() {
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
  }

  // --- Keyboard Shortcuts
  function initKeyboardShortcuts() {
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
      
      // Ctrl/Cmd + S: Save (if applicable)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        // Find active editor and save
        const activePanel = $('.panel.active');
        if (activePanel) {
          const editor = activePanel.querySelector('textarea.editor:not([readonly])');
          if (editor) {
            autoSaveEditor(editor.id);
            toast('Content saved', 'success');
          }
        }
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        if (state.findReplace.isActive) {
          hideFindReplace();
        }
      }
    });
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

  // --- Initialize all modules
  function init() {
    // Load saved state
    loadState();
    
    // Initialize modules
    setupLineNumbers();
    initFindReplace();
    initTextTools();
    initCodeCleaner();
    initHtmlDecoder();
    initCombine();
    initSplit();
    initRegexTester();
    initWordWrapToggles();
    initKeyboardShortcuts();
    
    // Load saved editor content
    loadEditorState();
    
    // Set up auto-save interval
    if (state.autoSave.enabled) {
      setInterval(() => {
        // Save all editors
        const editors = $$('textarea.editor');
        editors.forEach(editor => {
          autoSaveEditor(editor.id);
        });
      }, state.autoSave.interval);
    }
    
    // Show welcome message
    toast('Code Text Cleaner Pro loaded successfully', 'success', 2000);
  }

  // --- Expose useful things to global for debugging (optional)
  window.ctc = {
    downloadBlob,
    toast,
    state,
    switchTool,
    showFindReplace,
    hideFindReplace,
    copyToClipboard,
    storage
  };

  // --- Start the application
  init();
})();