/*
  TextCraft Pro - The Ultimate Text Editing Tool
  Features: Complete text editor, transformation, analysis, code tools, encoding/decoding, combine/split, diff, regex tester
  Author: Advanced AI Assistant
*/

(() => {
  // --- State Management
  const state = {
    currentTool: 'text',
    theme: 'dark',
    settings: {
      fontSize: 14,
      fontFamily: 'monospace',
      tabSize: 4,
      insertSpaces: true,
      wordWrap: false,
      showLineNumbers: true,
      autoSave: false,
      autoSaveInterval: 60
    },
    files: {},
    currentFile: null,
    undoStack: [],
    redoStack: [],
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

  // --- Mobile Menu
  const menuToggle = $('#menuToggle');
  const sidebar = $('#sidebar');
  const closeSidebar = $('#closeSidebar');
  
  menuToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
  });
  
  closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // --- Navigation
  const navItems = $$('.nav-item');
  
  function switchTool(tool) {
    state.currentTool = tool;
    
    // Update active state
    navItems.forEach(item => item.classList.remove('active'));
    $(`.nav-item[data-tool="${tool}"]`).classList.add('active');
    
    // Update tool title
    const toolTitle = $('#toolTitle');
    const toolName = $(`.nav-item[data-tool="${tool}"] span`).textContent;
    const toolIcon = $(`.nav-item[data-tool="${tool}"] i`).className;
    if (toolTitle) {
      toolTitle.innerHTML = `<i class="${toolIcon}"></i> ${toolName}`;
    }
    
    // Show corresponding panel
    $$('.panel').forEach(panel => panel.classList.toggle('active', panel.dataset.tool === tool));
    
    // Close mobile menu
    if (window.innerWidth <= 1024) {
      sidebar.classList.remove('open');
    }
  }
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tool = item.dataset.tool;
      switchTool(tool);
    });
  });

  // --- Theme Management
  const themeToggle = $('#themeToggle');
  const themeToggleMobile = $('#themeToggleMobile');
  
  function toggleTheme() {
    const body = document.body;
    const isDark = !body.classList.contains('light-theme');
    
    if (isDark) {
      body.classList.remove('light-theme');
      state.theme = 'dark';
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-moon"></i>';
      toast('Switched to dark theme', 'success');
    } else {
      body.classList.add('light-theme');
      state.theme = 'light';
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-sun"></i>';
      toast('Switched to light theme', 'success');
    }
    
    storage.setItem('textcraft:theme', state.theme);
  }
  
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);
  
  // Load saved theme
  const savedTheme = storage.getItem('textcraft:theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    state.theme = 'light';
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-sun"></i>';
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

  // --- Cursor position tracking
  function updateCursorPosition(textarea) {
    const cursorPosition = $('#cursorPosition');
    if (!cursorPosition) return;
    
    const start = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, start);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    cursorPosition.textContent = `Ln ${line}, Col ${col}`;
  }

  // --- Selection tracking
  function updateSelectionInfo(textarea) {
    const selectionInfo = $('#selectionInfo');
    if (!selectionInfo) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = end - start;
    
    if (selected > 0) {
      selectionInfo.textContent = `${selected} selected`;
    } else {
      selectionInfo.textContent = '0 selected';
    }
  }

  // --- Text Editor
  const textEditor = $('#textEditor');
  
  if (textEditor) {
    textEditor.addEventListener('input', () => {
      updateCursorPosition(textEditor);
      updateSelectionInfo(textEditor);
    });
    
    textEditor.addEventListener('mouseup', () => {
      updateSelectionInfo(textEditor);
    });
    
    textEditor.addEventListener('keyup', () => {
      updateCursorPosition(textEditor);
    });
    
    // Initial update
    updateCursorPosition(textEditor);
    updateSelectionInfo(textEditor);
  }

  // --- File Operations
  const fileInput = $('#fileInput');
  const newFileBtn = $('#newFile');
  const openFileBtn = $('#openFile');
  const saveFileBtn = $('#saveFile');
  
  function newFile() {
    if (textEditor && confirm('Create a new file? Unsaved changes will be lost.')) {
      textEditor.value = '';
      state.currentFile = null;
      $('#fileInfo').textContent = 'Untitled';
      updateCursorPosition(textEditor);
      updateSelectionInfo(textEditor);
      toast('New file created', 'success');
    }
  }
  
  function openFile() {
    fileInput.click();
  }
  
  function saveFile() {
    if (!textEditor) return;
    
    const content = textEditor.value;
    const filename = state.currentFile || 'untitled.txt';
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    
    toast('File saved', 'success');
  }
  
  if (newFileBtn) newFileBtn.addEventListener('click', newFile);
  if (openFileBtn) openFileBtn.addEventListener('click', openFile);
  if (saveFileBtn) saveFileBtn.addEventListener('click', saveFile);
  
  // File input change handler
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (textEditor) {
          textEditor.value = event.target.result;
          state.currentFile = file.name;
          $('#fileInfo').textContent = file.name;
          updateCursorPosition(textEditor);
          updateSelectionInfo(textEditor);
          toast(`File loaded: ${file.name}`, 'success');
        }
      };
      reader.readAsText(file);
    });
  }

  // --- Clipboard Operations
  const copyBtn = $('#copyBtn');
  const cutBtn = $('#cutBtn');
  const pasteBtn = $('#pasteBtn');
  
  function copySelection() {
    if (!textEditor) return;
    
    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;
    
    if (start !== end) {
      const selectedText = textEditor.value.substring(start, end);
      navigator.clipboard.writeText(selectedText).then(() => {
        toast('Copied to clipboard', 'success');
      }).catch(() => {
        toast('Failed to copy', 'error');
      });
    } else {
      toast('No text selected', 'warning');
    }
  }
  
  function cutSelection() {
    if (!textEditor) return;
    
    const start = textEditor.selectionStart;
    const end = textEditor.selectionEnd;
    
    if (start !== end) {
      const selectedText = textEditor.value.substring(start, end);
      navigator.clipboard.writeText(selectedText).then(() => {
        textEditor.value = textEditor.value.substring(0, start) + textEditor.value.substring(end);
        textEditor.setSelectionRange(start, start);
        updateCursorPosition(textEditor);
        updateSelectionInfo(textEditor);
        toast('Cut to clipboard', 'success');
      }).catch(() => {
        toast('Failed to cut', 'error');
      });
    } else {
      toast('No text selected', 'warning');
    }
  }
  
  function pasteFromClipboard() {
    if (!textEditor) return;
    
    navigator.clipboard.readText().then(text => {
      const start = textEditor.selectionStart;
      const end = textEditor.selectionEnd;
      
      textEditor.value = textEditor.value.substring(0, start) + text + textEditor.value.substring(end);
      
      const newCursorPos = start + text.length;
      textEditor.setSelectionRange(newCursorPos, newCursorPos);
      updateCursorPosition(textEditor);
      updateSelectionInfo(textEditor);
      
      toast('Pasted from clipboard', 'success');
    }).catch(() => {
      toast('Failed to paste', 'error');
    });
  }
  
  if (copyBtn) copyBtn.addEventListener('click', copySelection);
  if (cutBtn) cutBtn.addEventListener('click', cutSelection);
  if (pasteBtn) pasteBtn.addEventListener('click', pasteFromClipboard);

  // --- Undo/Redo functionality
  const undoBtn = $('#undoBtn');
  const redoBtn = $('#redoBtn');
  
  function saveState() {
    if (!textEditor) return;
    
    state.undoStack.push(textEditor.value);
    state.redoStack = [];
    
    // Limit stack size
    if (state.undoStack.length > 50) {
      state.undoStack.shift();
    }
  }
  
  function undo() {
    if (!textEditor || state.undoStack.length === 0) return;
    
    state.redoStack.push(textEditor.value);
    textEditor.value = state.undoStack.pop();
    updateCursorPosition(textEditor);
    updateSelectionInfo(textEditor);
    toast('Undo', 'info');
  }
  
  function redo() {
    if (!textEditor || state.redoStack.length === 0) return;
    
    state.undoStack.push(textEditor.value);
    textEditor.value = state.redoStack.pop();
    updateCursorPosition(textEditor);
    updateSelectionInfo(textEditor);
    toast('Redo', 'info');
  }
  
  if (textEditor) {
    textEditor.addEventListener('keydown', (e) => {
      // Save state before certain actions
      if (e.key === 'Backspace' || e.key === 'Delete' || (e.ctrlKey && e.key === 'x') || (e.ctrlKey && e.key === 'v')) {
        setTimeout(saveState, 0);
      }
    });
    
    // Save state on input (for typing)
    textEditor.addEventListener('input', () => {
      if (!state.undoStack.includes(textEditor.value)) {
        saveState();
      }
    });
  }
  
  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (redoBtn) redoBtn.addEventListener('click', redo);

  // --- Word Wrap Toggle
  const toggleWordWrapBtns = $$('[id*="toggleWordWrap"]');
  
  toggleWordWrapBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const editorId = btn.id.replace('toggleWordWrap', '').toLowerCase() + 'Editor';
      const editor = $(editorId) || $(editorId.replace('editor', 'Input')) || $(editorId.replace('editor', 'Text'));
      
      if (editor) {
        editor.classList.toggle('word-wrap');
        const isWrapped = editor.classList.contains('word-wrap');
        toast(isWrapped ? 'Word wrap enabled' : 'Word wrap disabled', 'success');
      }
    });
  });

  // --- Line Numbers Toggle
  const toggleLineNumbersBtn = $('#toggleLineNumbers');
  
  if (toggleLineNumbersBtn) {
    toggleLineNumbersBtn.addEventListener('click', () => {
      const lineNumbers = $$('.line-numbers');
      const show = !lineNumbers[0].style.display || lineNumbers[0].style.display !== 'none';
      
      lineNumbers.forEach(ln => {
        ln.style.display = show ? 'block' : 'none';
      });
      
      $$('.editor').forEach(editor => {
        if (show) {
          editor.style.paddingLeft = '60px';
        } else {
          editor.style.paddingLeft = '10px';
        }
      });
      
      toast(show ? 'Line numbers enabled' : 'Line numbers disabled', 'success');
    });
  }

  // --- Fullscreen Toggle
  const toggleFullscreenBtn = $('#toggleFullscreen');
  
  if (toggleFullscreenBtn) {
    toggleFullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        toggleFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
      } else {
        document.exitFullscreen();
        toggleFullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
      }
    });
  }

  // --- Quick Actions
  const actionBtns = $$('[data-action]');
  
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const inputText = $('#inputText') || $('#textEditor') || $('#transformInput');
      const outputText = $('#outputText') || $('#transformOutput');
      
      if (!inputText || !outputText) return;
      
      let result = inputText.value;
      
      switch (action) {
        case 'uppercase':
          result = result.toUpperCase();
          break;
        case 'lowercase':
          result = result.toLowerCase();
          break;
        case 'titlecase':
          result = result.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          break;
        case 'sentencecase':
          result = result.replace(/(^\w|\.\s*\w)/g, w => w.toUpperCase());
          break;
        case 'base64-encode':
          result = btoa(unescape(encodeURIComponent(result)));
          break;
        case 'url-encode':
          result = encodeURIComponent(result);
          break;
        case 'html-encode':
          result = result.replace(/&/g, '&amp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;')
                         .replace(/"/g, '&quot;')
                         .replace(/'/g, '&#39;');
          break;
      }
      
      outputText.value = result;
      toast('Transformation complete', 'success');
    });
  });

  // --- Text Transform
  const transformBtns = $$('[data-transform]');
  
  transformBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const transform = btn.dataset.transform;
      const input = $('#transformInput');
      const output = $('#transformOutput');
      
      if (!input || !output) return;
      
      let result = input.value;
      
      switch (transform) {
        case 'uppercase':
          result = result.toUpperCase();
          break;
        case 'lowercase':
          result = result.toLowerCase();
          break;
        case 'titlecase':
          result = result.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
          break;
        case 'sentencecase':
          result = result.replace(/(^\w|\.\s*\w)/g, w => w.toUpperCase());
          break;
        case 'camelcase':
          result = result.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
          }).replace(/\s+/g, '');
          break;
        case 'pascalcase':
          result = result.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/\s+/g, '');
          break;
        case 'snakecase':
          result = result.replace(/\s+/g, '_').toLowerCase();
          break;
        case 'kebabcase':
          result = result.replace(/\s+/g, '-').toLowerCase();
          break;
        case 'reverse':
          result = result.split('').reverse().join('');
          break;
        case 'sort':
          result = result.split('\n').sort().join('\n');
          break;
        case 'shuffle':
          const lines = result.split('\n');
          for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
          }
          result = lines.join('\n');
          break;
        case 'removeduplicates':
          result = [...new Set(result.split('\n'))].join('\n');
          break;
        case 'trimspaces':
          result = result.replace(/[ \t]+/g, ' ');
          break;
        case 'trimlines':
          result = result.split('\n').map(line => line.trim()).join('\n');
          break;
        case 'removelines':
          result = result.split('\n').filter(line => line.trim() !== '').join('\n');
          break;
        case 'addlinenumbers':
          result = result.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
          break;
        case 'lorem':
          result = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Pellentesque in ipsum id orci porta dapibus. 
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; 
Pellentesque in ipsum id orci porta dapibus. 
Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae;`;
          break;
        case 'randomtext':
          const words = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog', 'hello', 'world', 'text', 'craft', 'pro', 'ultimate', 'editor'];
          const count = 50;
          result = '';
          for (let i = 0; i < count; i++) {
            result += words[Math.floor(Math.random() * words.length)] + ' ';
            if (i > 0 && i % 10 === 0) result += '\n';
          }
          break;
        case 'bullets':
          result = result.split('\n').map(line => `• ${line}`).join('\n');
          break;
        case 'numbered':
          result = result.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
          break;
      }
      
      output.value = result;
      toast('Transformation complete', 'success');
    });
  });

  // --- Swap Transform
  const swapTransformBtn = $('#swapTransform');
  
  if (swapTransformBtn) {
    swapTransformBtn.addEventListener('click', () => {
      const input = $('#transformInput');
      const output = $('#transformOutput');
      
      if (input && output) {
        const temp = input.value;
        input.value = output.value;
        output.value = temp;
        toast('Swapped input and output', 'success');
      }
    });
  }

  // --- Text Analysis
  const analyzeBtn = $('#analyzeBtn');
  const loadSampleBtn = $('#loadSample');
  
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      const input = $('#analyzeInput');
      if (!input || !input.value) {
        toast('Please enter text to analyze', 'warning');
        return;
      }
      
      analyzeText(input.value);
    });
  }
  
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      const input = $('#analyzeInput');
      if (input) {
        input.value = `TextCraft Pro is the ultimate text editing tool for everyone. Whether you're a developer, writer, or just need to manipulate text, we've got you covered.

This powerful tool includes:
- Text transformation and formatting
- Code editing and manipulation
- Encoding and decoding utilities
- Text analysis and statistics
- File comparison and diff tools
- Regular expression testing

With its intuitive interface and comprehensive feature set, TextCraft Pro makes text editing a breeze. Try it today and experience the difference!`;
        analyzeText(input.value);
        toast('Sample text loaded', 'success');
      }
    });
  }
  
  function analyzeText(text) {
    // Basic stats
    const chars = text.length;
    const words = (text.trim().match(/\S+/g) || []).length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    
    $('#charCount').textContent = chars;
    $('#wordCount').textContent = words;
    $('#lineCount').textContent = lines;
    $('#paragraphCount').textContent = paragraphs;
    
    // Reading time (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);
    $('#readingTime').textContent = readingTime + ' min';
    
    // Unique words
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size;
    $('#uniqueWords').textContent = uniqueWords;
    
    // Character frequency
    const charFreq = {};
    const cleanText = text.toLowerCase().replace(/[^a-z]/g, '');
    for (const char of cleanText) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    const sortedChars = Object.entries(charFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const charFrequencyEl = $('#charFrequency');
    charFrequencyEl.innerHTML = sortedChars.map(([char, count]) => {
      const percentage = (count / cleanText.length * 100).toFixed(1);
      return `
        <div class="frequency-bar">
          <div class="frequency-label">${char.toUpperCase()}</div>
          <div class="frequency-bar-fill" style="width: ${percentage}%"></div>
          <div class="frequency-value">${count}</div>
        </div>
      `;
    }).join('');
    
    // Word frequency
    const wordFreq = {};
    const wordsArray = text.toLowerCase().match(/\b\w+\b/g) || [];
    for (const word of wordsArray) {
      if (word.length > 3) { // Ignore short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }
    
    const sortedWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const wordCloudEl = $('#wordCloud');
    wordCloudEl.innerHTML = sortedWords.map(([word, count]) => {
      const size = Math.min(24, 12 + count * 2);
      return `<span class="word-item" style="font-size: ${size}px">${word}</span>`;
    }).join('');
    
    // Sentiment analysis (simplified)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like', 'enjoy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'boring', 'ugly', 'stupid'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    const textWords = text.toLowerCase().match(/\b\w+\b/g) || [];
    for (const word of textWords) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }
    
    const sentimentScore = positiveCount - negativeCount;
    let sentiment = 'Neutral';
    let sentimentWidth = 50;
    
    if (sentimentScore > 0) {
      sentiment = 'Positive';
      sentimentWidth = 50 + Math.min(50, sentimentScore * 10);
    } else if (sentimentScore < 0) {
      sentiment = 'Negative';
      sentimentWidth = 50 + Math.max(-50, sentimentScore * 10);
    }
    
    $('#sentimentResult .sentiment-score').textContent = sentiment;
    $('#sentimentResult .sentiment-fill').style.width = sentimentWidth + '%';
    
    // Readability score (simplified Flesch Reading Ease)
    const avgSentenceLength = words / (text.match(/[.!?]+/g) || []).length || 1;
    const avgSyllables = text.match(/[aeiouAEIOU]/g) || [].length / words;
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables);
    
    $('#readabilityScore .score-value').textContent = Math.round(fleschScore);
    
    let readabilityDesc = '';
    if (fleschScore > 90) readabilityDesc = 'Very Easy';
    else if (fleschScore > 80) readabilityDesc = 'Easy';
    else if (fleschScore > 70) readabilityDesc = 'Fairly Easy';
    else if (fleschScore > 60) readabilityDesc = 'Standard';
    else if (fleschScore > 50) readabilityDesc = 'Fairly Difficult';
    else if (fleschScore > 30) readabilityDesc = 'Difficult';
    else readabilityDesc = 'Very Difficult';
    
    $('#readabilityScore .score-description').textContent = readabilityDesc;
    
    toast('Text analysis complete', 'success');
  }

  // --- Code Editor
  const languageSelect = $('#languageSelect');
  const formatCodeBtn = $('#formatCode');
  const minifyCodeBtn = $('#minifyCode');
  const removeCommentsBtn = $('#removeComments');
  const runCodeBtn = $('#runCode');
  const previewCodeBtn = $('#previewCode');
  const codeEditor = $('#codeEditor');
  
  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      if (codeEditor) {
        // Apply syntax highlighting based on language
        const language = languageSelect.value;
        // This would typically integrate with a syntax highlighting library
        toast(`Language changed to ${language}`, 'info');
      }
    });
  }
  
  if (formatCodeBtn) {
    formatCodeBtn.addEventListener('click', () => {
      if (!codeEditor || !codeEditor.value) {
        toast('No code to format', 'warning');
        return;
      }
      
      const language = languageSelect ? languageSelect.value : 'javascript';
      let formatted = codeEditor.value;
      
      // Basic formatting based on language
      switch (language) {
        case 'javascript':
        case 'json':
          try {
            const obj = JSON.parse(formatted);
            formatted = JSON.stringify(obj, null, 2);
          } catch (e) {
            // Not JSON, apply basic JS formatting
            formatted = formatted.replace(/{/g, ' {\n  ')
                             .replace(/}/g, '\n}')
                             .replace(/;/g, ';\n  ')
                             .replace(/\n\s+\n/g, '\n');
          }
          break;
        case 'html':
          formatted = formatted.replace(></g, '>\n<')
                           .replace(/\n\s+/g, '\n');
          break;
        case 'css':
          formatted = formatted.replace(/{/g, ' {\n  ')
                           .replace(/}/g, '\n}')
                           .replace(/;/g, ';\n  ')
                           .replace(/\n\s+\n/g, '\n');
          break;
      }
      
      codeEditor.value = formatted;
      toast('Code formatted', 'success');
    });
  }
  
  if (minifyCodeBtn) {
    minifyCodeBtn.addEventListener('click', () => {
      if (!codeEditor || !codeEditor.value) {
        toast('No code to minify', 'warning');
        return;
      }
      
      const language = languageSelect ? languageSelect.value : 'javascript';
      let minified = codeEditor.value;
      
      // Basic minification
      switch (language) {
        case 'javascript':
        case 'json':
          try {
            const obj = JSON.parse(minified);
            minified = JSON.stringify(obj);
          } catch (e) {
            minified = minified.replace(/\s+/g, ' ')
                             .replace(/;\s*/g, ';')
                             .replace(/,\s*/g, ',')
                             .replace(/{\s*/g, '{')
                             .replace(/\s*}/g, '}');
          }
          break;
        case 'html':
          minified = minified.replace(/<!--[\s\S]*?-->/g, '')
                           .replace(/\s+/g, ' ')
                           .replace(>\s+</g, '><');
          break;
        case 'css':
          minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
                           .replace(/\s+/g, ' ')
                           .replace(/;\s*/g, ';')
                           .replace(/{\s*/g, '{')
                           .replace(/\s*}/g, '}');
          break;
      }
      
      codeEditor.value = minified;
      toast('Code minified', 'success');
    });
  }
  
  if (removeCommentsBtn) {
    removeCommentsBtn.addEventListener('click', () => {
      if (!codeEditor || !codeEditor.value) {
        toast('No code to process', 'warning');
        return;
      }
      
      const language = languageSelect ? languageSelect.value : 'javascript';
      let processed = codeEditor.value;
      
      // Remove comments based on language
      switch (language) {
        case 'javascript':
        case 'json':
          processed = processed.replace(/\/\*[\s\S]*?\*\//g, '')
                             .replace(/\/\/.*$/gm, '');
          break;
        case 'html':
          processed = processed.replace(/<!--[\s\S]*?-->/g, '');
          break;
        case 'css':
          processed = processed.replace(/\/\*[\s\S]*?\*\//g, '');
          break;
      }
      
      codeEditor.value = processed;
      toast('Comments removed', 'success');
    });
  }
  
  if (runCodeBtn) {
    runCodeBtn.addEventListener('click', () => {
      if (!codeEditor || !codeEditor.value) {
        toast('No code to run', 'warning');
        return;
      }
      
      const language = languageSelect ? languageSelect.value : 'javascript';
      const outputContent = $('#outputContent');
      const codeOutput = $('#codeOutput');
      
      if (!outputContent || !codeOutput) return;
      
      try {
        if (language === 'javascript') {
          // Create a safe execution environment
          const result = eval(codeEditor.value);
          outputContent.textContent = result !== undefined ? result : 'Code executed successfully';
        } else {
          outputContent.textContent = `Code execution not supported for ${language}`;
        }
        
        codeOutput.classList.remove('hidden');
        toast('Code executed', 'success');
      } catch (error) {
        outputContent.textContent = `Error: ${error.message}`;
        codeOutput.classList.remove('hidden');
        toast('Code execution failed', 'error');
      }
    });
  }
  
  if (previewCodeBtn) {
    previewCodeBtn.addEventListener('click', () => {
      if (!codeEditor || !codeEditor.value) {
        toast('No code to preview', 'warning');
        return;
      }
      
      const language = languageSelect ? languageSelect.value : 'javascript';
      const previewFrame = $('#previewFrame');
      const codePreview = $('#codePreview');
      
      if (!previewFrame || !codePreview) return;
      
      let previewContent = codeEditor.value;
      
      if (language === 'html') {
        // It's already HTML
      } else if (language === 'javascript') {
        previewContent = `<!DOCTYPE html>
<html>
<head>
  <title>Preview</title>
</head>
<body>
  <script>
    ${codeEditor.value}
  </script>
</body>
</html>`;
      } else {
        previewContent = `<pre>${codeEditor.value}</pre>`;
      }
      
      previewFrame.srcdoc = previewContent;
      codePreview.classList.remove('hidden');
      toast('Preview ready', 'success');
    });
  }
  
  // Close output/preview
  const closeOutputBtn = $('#closeOutput');
  const closePreviewBtn = $('#closePreview');
  
  if (closeOutputBtn) {
    closeOutputBtn.addEventListener('click', () => {
      $('#codeOutput').classList.add('hidden');
    });
  }
  
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', () => {
      $('#codePreview').classList.add('hidden');
    });
  }

  // --- Minify Tool
  const minifyBtns = $$('[data-minify]');
  
  minifyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.minify;
      const input = $('#minifyInput');
      const output = $('#minifyOutput');
      const originalSizeEl = $('#originalSize');
      const minifiedSizeEl = $('#minifiedSize');
      const savedSizeEl = $('#savedSize');
      
      if (!input || !output || !input.value) {
        toast('Please enter code to minify', 'warning');
        return;
      }
      
      let minified = input.value;
      const originalSize = new Blob([input.value]).size;
      
      // Minify based on type
      switch (type) {
        case 'html':
          minified = minified.replace(/<!--[\s\S]*?-->/g, '')
                           .replace(/\s+/g, ' ')
                           .replace(>\s+</g, '><');
          break;
        case 'css':
          minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
                           .replace(/\s+/g, ' ')
                           .replace(/;\s*/g, ';')
                           .replace(/{\s*/g, '{')
                           .replace(/\s*}/g, '}');
          break;
        case 'js':
          try {
            const obj = JSON.parse(minified);
            minified = JSON.stringify(obj);
          } catch (e) {
            minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
                             .replace(/\/\/.*$/gm, '')
                             .replace(/\s+/g, ' ')
                             .replace(/;\s*/g, ';')
                             .replace(/,\s*/g, ',')
                             .replace(/{\s*/g, '{')
                             .replace(/\s*}/g, '}');
          }
          break;
        case 'json':
          try {
            const obj = JSON.parse(minified);
            minified = JSON.stringify(obj);
          } catch (e) {
            toast('Invalid JSON', 'error');
            return;
          }
          break;
      }
      
      output.value = minified;
      
      const minifiedSize = new Blob([minified]).size;
      const saved = originalSize - minifiedSize;
      const savedPercent = ((saved / originalSize) * 100).toFixed(1);
      
      originalSizeEl.textContent = formatBytes(originalSize);
      minifiedSizeEl.textContent = formatBytes(minifiedSize);
      savedSizeEl.textContent = `${formatBytes(saved)} (${savedPercent}%)`;
      
      toast(`${type.toUpperCase()} minified successfully`, 'success');
    });
  });
  
  function formatBytes(bytes) {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // --- Format Tool
  const formatBtns = $$('[data-format]');
  
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.format;
      const input = $('#formatInput');
      const output = $('#formatOutput');
      const indentSize = $('#indentSize').value;
      const quoteStyle = $('#quoteStyle').value;
      
      if (!input || !output || !input.value) {
        toast('Please enter code to format', 'warning');
        return;
      }
      
      let formatted = input.value;
      const indent = indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize));
      
      // Format based on type
      switch (type) {
        case 'html':
          formatted = formatted.replace(></g, `>\n${indent}<`)
                           .replace(/\n\s+/g, '\n')
                           .replace(/^\s+|\s+$/g, '');
          break;
        case 'css':
          formatted = formatted.replace(/{/g, ` {\n${indent}`)
                           .replace(/}/g, `\n}\n`)
                           .replace(/;/g, `;\n${indent}`)
                           .replace(/\n\s+\n/g, '\n');
          break;
        case 'js':
          try {
            const obj = JSON.parse(formatted);
            formatted = JSON.stringify(obj, null, parseInt(indentSize));
          } catch (e) {
            formatted = formatted.replace(/{/g, ` {\n${indent}`)
                             .replace(/}/g, `\n}`)
                             .replace(/;/g, `;\n${indent}`)
                             .replace(/\n\s+\n/g, '\n');
          }
          break;
        case 'json':
          try {
            const obj = JSON.parse(formatted);
            formatted = JSON.stringify(obj, null, parseInt(indentSize));
          } catch (e) {
            toast('Invalid JSON', 'error');
            return;
          }
          break;
        case 'xml':
          formatted = formatted.replace(></g, `>\n${indent}<`)
                           .replace(/\n\s+/g, '\n');
          break;
        case 'sql':
          formatted = formatted.replace(/\b(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|JOIN|INNER|LEFT|RIGHT|OUTER)\b/g, '\n$1')
                           .replace(/\n\s+/g, '\n');
          break;
      }
      
      output.value = formatted;
      toast(`${type.toUpperCase()} formatted successfully`, 'success');
    });
  });

  // --- Encode/Decode Tool
  const encodeTabs = $$('.encode-tab');
  const encodeBtn = $('#encodeBtn');
  const decodeBtn = $('#decodeBtn');
  const autoDetectBtn = $('#autoDetectBtn');
  
  encodeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      encodeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const type = tab.dataset.encode;
      // Update UI based on selected encoding type
    });
  });
  
  if (encodeBtn) {
    encodeBtn.addEventListener('click', () => {
      const activeTab = $('.encode-tab.active');
      if (!activeTab) return;
      
      const type = activeTab.dataset.encode;
      const input = $('#encodeInput');
      const output = $('#encodeOutput');
      
      if (!input || !output || !input.value) {
        toast('Please enter text to encode', 'warning');
        return;
      }
      
      let result = input.value;
      
      switch (type) {
        case 'base64':
          result = btoa(unescape(encodeURIComponent(result)));
          break;
        case 'url':
          result = encodeURIComponent(result);
          break;
        case 'html':
          result = result.replace(/&/g, '&amp;')
                         .replace(/</g, '&lt;')
                         .replace(/>/g, '&gt;')
                         .replace(/"/g, '&quot;')
                         .replace(/'/g, '&#39;');
          break;
        case 'hex':
          result = Array.from(result)
                         .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
                         .join(' ');
          break;
        case 'binary':
          result = Array.from(result)
                         .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
                         .join(' ');
          break;
        case 'morse':
          const morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
            "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
            '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
            '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
          };
          result = result.toUpperCase()
                         .split('')
                         .map(char => morseCode[char] || char)
                         .join(' ');
          break;
      }
      
      output.value = result;
      toast('Encoded successfully', 'success');
    });
  }
  
  if (decodeBtn) {
    decodeBtn.addEventListener('click', () => {
      const activeTab = $('.encode-tab.active');
      if (!activeTab) return;
      
      const type = activeTab.dataset.encode;
      const input = $('#encodeInput');
      const output = $('#encodeOutput');
      
      if (!input || !output || !input.value) {
        toast('Please enter text to decode', 'warning');
        return;
      }
      
      let result = input.value;
      
      try {
        switch (type) {
          case 'base64':
            result = decodeURIComponent(escape(atob(result)));
            break;
          case 'url':
            result = decodeURIComponent(result);
            break;
          case 'html':
            const textarea = document.createElement('textarea');
            textarea.innerHTML = result;
            result = textarea.value;
            break;
          case 'hex':
            result = result.split(' ')
                             .map(hex => String.fromCharCode(parseInt(hex, 16)))
                             .join('');
            break;
          case 'binary':
            result = result.split(' ')
                             .map(binary => String.fromCharCode(parseInt(binary, 2)))
                             .join('');
            break;
          case 'morse':
            const morseDecode = {
              '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
              '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
              '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
              '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
              '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
              '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7',
              '---..': '8', '----.': '9', '.-.-.-': '.', '--..--': ',', '..--..': '?',
              '.----.': "'", '-.-.--': '!', '-..-.': '/', '-.--.': '(', '-.--.-': ')',
              '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+',
              '-....-': '-', '..--.-': '_', '.-..-.': '"', '...-..-': '$', '.--.-.': '@'
            };
            result = result.split(' ')
                             .map(code => morseDecode[code] || code)
                             .join('');
            break;
        }
        
        output.value = result;
        toast('Decoded successfully', 'success');
      } catch (error) {
        toast('Failed to decode: Invalid input', 'error');
      }
    });
  }
  
  if (autoDetectBtn) {
    autoDetectBtn.addEventListener('click', () => {
      const input = $('#encodeInput');
      const output = $('#encodeOutput');
      
      if (!input || !output || !input.value) {
        toast('Please enter text to analyze', 'warning');
        return;
      }
      
      const text = input.value;
      let detectedType = null;
      let result = text;
      
      // Try to detect and decode
      if (/^[A-Za-z0-9+/]+=*$/.test(text) && text.length % 4 === 0) {
        try {
          result = decodeURIComponent(escape(atob(text)));
          detectedType = 'base64';
          $('.encode-tab[data-encode="base64"]').click();
        } catch (e) {
          // Not base64
        }
      } else if (text.includes('%')) {
        try {
          result = decodeURIComponent(text);
          detectedType = 'url';
          $('.encode-tab[data-encode="url"]').click();
        } catch (e) {
          // Not URL encoded
        }
      } else if (text.includes('&') && text.includes(';')) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        result = textarea.value;
        if (result !== text) {
          detectedType = 'html';
          $('.encode-tab[data-encode="html"]').click();
        }
      } else if (/^[0-9A-Fa-f\s]+$/.test(text)) {
        try {
          result = text.split(' ')
                           .map(hex => String.fromCharCode(parseInt(hex, 16)))
                           .join('');
          detectedType = 'hex';
          $('.encode-tab[data-encode="hex"]').click();
        } catch (e) {
          // Not hex
        }
      }
      
      if (detectedType) {
        output.value = result;
        toast(`Detected and decoded as ${detectedType}`, 'success');
      } else {
        toast('Could not detect encoding type', 'warning');
      }
    });
  }

  // --- Combine Tool
  const combineBtn = $('#combineBtn');
  const previewCombinedBtn = $('#previewCombined');
  
  if (combineBtn) {
    combineBtn.addEventListener('click', () => {
      const html = $('#combineHtml').value;
      const css = $('#combineCss').value;
      const js = $('#combineJs').value;
      const output = $('#combineOutput');
      
      if (!output) return;
      
      let combined = '';
      
      if ($('#includeDoctype').checked) {
        combined += '<!DOCTYPE html>\n';
      }
      
      combined += '<html lang="en">\n<head>\n';
      
      if ($('#includeViewport').checked) {
        combined += '  <meta charset="UTF-8">\n';
        combined += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
      }
      
      combined += '  <title>Combined Page</title>\n';
      
      if (css.trim()) {
        combined += '  <style>\n' + css + '\n  </style>\n';
      }
      
      combined += '</head>\n<body>\n';
      combined += html + '\n';
      
      if (js.trim()) {
        combined += '  <script>\n' + js + '\n  </script>\n';
      }
      
      combined += '</body>\n</html>';
      
      if ($('#minifyOutput').checked) {
        combined = combined.replace(/\s+/g, ' ')
                         .replace(>\s+</g, '><')
                         .replace(/>\s+/g, '>')
                         .replace(/\s+</g, '<');
      }
      
      output.value = combined;
      toast('Files combined successfully', 'success');
    });
  }
  
  if (previewCombinedBtn) {
    previewCombinedBtn.addEventListener('click', () => {
      const output = $('#combineOutput');
      const preview = $('#combinePreview');
      const previewFrame = $('#combinePreviewFrame');
      
      if (!output || !preview || !previewFrame || !output.value) {
        toast('No combined content to preview', 'warning');
        return;
      }
      
      previewFrame.srcdoc = output.value;
      preview.classList.remove('hidden');
      toast('Preview ready', 'success');
    });
  }
  
  // Close combined preview
  const closeCombinePreviewBtn = $('#closeCombinePreview');
  
  if (closeCombinePreviewBtn) {
    closeCombinePreviewBtn.addEventListener('click', () => {
      $('#combinePreview').classList.add('hidden');
    });
  }

  // --- Split Tool
  const splitBtn = $('#splitBtn');
  const loadSampleHtmlBtn = $('#loadSampleHtml');
  
  if (splitBtn) {
    splitBtn.addEventListener('click', () => {
      const input = $('#splitInput');
      const htmlOutput = $('#splitHtml');
      const cssOutput = $('#splitCss');
      const jsOutput = $('#splitJs');
      
      if (!input || !input.value) {
        toast('Please enter HTML to split', 'warning');
        return;
      }
      
      const html = input.value;
      
      // Extract CSS
      const cssMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
      const css = cssMatches.map(match => match[1]).join('\n\n').trim();
      
      // Extract JavaScript
      const jsMatches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
      const js = jsMatches.map(match => match[1]).join('\n\n').trim();
      
      // Clean HTML (remove style and script tags)
      let cleanHtml = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      if (htmlOutput) htmlOutput.value = cleanHtml.trim();
      if (cssOutput) cssOutput.value = css;
      if (jsOutput) jsOutput.value = js;
      
      toast('HTML split successfully', 'success');
    });
  }
  
  if (loadSampleHtmlBtn) {
    loadSampleHtmlBtn.addEventListener('click', () => {
      const input = $('#splitInput');
      if (input) {
        input.value = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
    }
    .button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    .button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sample HTML Page</h1>
    <p>This is a sample HTML page with embedded CSS and JavaScript.</p>
    <button class="button" id="myButton">Click Me</button>
  </div>
  
  <script>
    document.getElementById('myButton').addEventListener('click', function() {
      alert('Button clicked!');
    });
  </script>
</body>
</html>`;
        toast('Sample HTML loaded', 'success');
      }
    });
  }

  // --- Diff Tool
  const compareBtn = $('#compareBtn');
  const swapDiffBtn = $('#swapDiff');
  const loadSampleDiffBtn = $('#loadSampleDiff');
  
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      const original = $('#diffOriginal');
      const modified = $('#diffModified');
      const output = $('#diffOutput');
      
      if (!original || !modified || !output || !original.value || !modified.value) {
        toast('Please enter both texts to compare', 'warning');
        return;
      }
      
      const ignoreCase = $('#ignoreCase').checked;
      const ignoreWhitespace = $('#ignoreWhitespace').checked;
      const lineByLine = $('#lineByLine').checked;
      
      let originalText = original.value;
      let modifiedText = modified.value;
      
      if (ignoreCase) {
        originalText = originalText.toLowerCase();
        modifiedText = modifiedText.toLowerCase();
      }
      
      if (ignoreWhitespace) {
        originalText = originalText.replace(/\s+/g, ' ').trim();
        modifiedText = modifiedText.replace(/\s+/g, ' ').trim();
      }
      
      const diff = computeDiff(originalText, modifiedText, lineByLine);
      
      output.innerHTML = diff;
      
      // Update stats
      const addedLines = (diff.match(/<span class="diff-added">/g) || []).length;
      const removedLines = (diff.match(/<span class="diff-removed">/g) || []).length;
      const modifiedLines = (diff.match(/<span class="diff-modified">/g) || []).length;
      const unchangedLines = (diff.match(/^[^<]/gm) || []).length;
      
      $('#addedLines').textContent = addedLines;
      $('#removedLines').textContent = removedLines;
      $('#modifiedLines').textContent = modifiedLines;
      $('#unchangedLines').textContent = unchangedLines;
      
      toast('Comparison complete', 'success');
    });
  }
  
  if (swapDiffBtn) {
    swapDiffBtn.addEventListener('click', () => {
      const original = $('#diffOriginal');
      const modified = $('#diffModified');
      
      if (original && modified) {
        const temp = original.value;
        original.value = modified.value;
        modified.value = temp;
        toast('Swapped texts', 'success');
      }
    });
  }
  
  if (loadSampleDiffBtn) {
    loadSampleDiffBtn.addEventListener('click', () => {
      const original = $('#diffOriginal');
      const modified = $('#diffModified');
      
      if (original && modified) {
        original.value = `This is the first line.
This line is the same in both texts.
This line will be removed.
Another common line.
Final line of original text.`;
        
        modified.value = `This is the first line.
This line is the same in both texts.
This line has been added.
Another common line.
This line is modified.
Final line of modified text.`;
        
        toast('Sample texts loaded', 'success');
      }
    });
  }
  
  function computeDiff(original, modified, lineByLine) {
    if (lineByLine) {
      const originalLines = original.split('\n');
      const modifiedLines = modified.split('\n');
      
      const result = [];
      let i = 0, j = 0;
      
      while (i < originalLines.length || j < modifiedLines.length) {
        if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
          result.push(originalLines[i]);
          i++;
          j++;
        } else if (i < originalLines.length && (j >= modifiedLines.length || originalLines[i] !== modifiedLines[j])) {
          result.push(`<span class="diff-removed">${originalLines[i]}</span>`);
          i++;
        } else {
          result.push(`<span class="diff-added">${modifiedLines[j]}</span>`);
          j++;
        }
      }
      
      return result.join('\n');
    } else {
      // Simple character-level diff
      const result = [];
      let i = 0, j = 0;
      
      while (i < original.length || j < modified.length) {
        if (i < original.length && j < modified.length && original[i] === modified[j]) {
          result.push(original[i]);
          i++;
          j++;
        } else if (i < original.length && (j >= modified.length || original[i] !== modified[j])) {
          result.push(`<span class="diff-removed">${original[i]}</span>`);
          i++;
        } else {
          result.push(`<span class="diff-added">${modified[j]}</span>`);
          j++;
        }
      }
      
      return result.join('');
    }
  }

  // --- Regex Tester
  const testRegexBtn = $('#testRegex');
  const clearRegexBtn = $('#clearRegex');
  const loadSampleRegexBtn = $('#loadSampleRegex');
  const regexFlags = $$('.regex-flag');
  
  let selectedRegexFlags = new Set();
  
  regexFlags.forEach(flag => {
    flag.addEventListener('click', () => {
      const flagValue = flag.dataset.flag;
      if (selectedRegexFlags.has(flagValue)) {
        selectedRegexFlags.delete(flagValue);
        flag.classList.remove('active');
      } else {
        selectedRegexFlags.add(flagValue);
        flag.classList.add('active');
      }
    });
  });
  
  if (testRegexBtn) {
    testRegexBtn.addEventListener('click', () => {
      const pattern = $('#regexPattern').value;
      const testText = $('#regexTestText').value;
      const result = $('#regexResult');
      const matchesList = $('#matchesList');
      
      if (!pattern) {
        toast('Please enter a regex pattern', 'warning');
        return;
      }
      
      const startTime = performance.now();
      
      try {
        const flags = Array.from(selectedRegexFlags).join('');
        const regex = new RegExp(pattern, flags);
        const matches = [...testText.matchAll(regex)];
        
        const endTime = performance.now();
        const testTime = (endTime - startTime).toFixed(2);
        
        // Highlight matches
        let highlightedText = testText;
        if (matches.length > 0) {
          // Replace matches with highlighted version
          matches.forEach(match => {
            highlightedText = highlightedText.replace(
              new RegExp(escapeRegExp(match[0]), 'g'),
              '<span class="regex-match">$&</span>'
            );
          });
        }
        
        result.innerHTML = highlightedText || '<div class="no-matches">No matches found</div>';
        
        // Update matches list
        if (matches.length > 0) {
          matchesList.innerHTML = matches.map((match, index) => {
            return `<div class="match-item">Match ${index + 1}: "${match[0]}" at position ${match.index}</div>`;
          }).join('');
        } else {
          matchesList.innerHTML = '<div class="no-matches">No matches found</div>';
        }
        
        // Update stats
        $('#regexMatchCount').textContent = matches.length;
        $('#regexTestTime').textContent = testTime + 'ms';
        
        toast('Regex test completed', 'success');
      } catch (error) {
        result.innerHTML = `<div style="color: var(--accent-danger);">Invalid regex: ${error.message}</div>`;
        matchesList.innerHTML = '<div class="no-matches">Invalid regex pattern</div>';
        $('#regexMatchCount').textContent = '0';
        $('#regexTestTime').textContent = '0ms';
        toast('Invalid regex pattern', 'error');
      }
    });
  }
  
  if (clearRegexBtn) {
    clearRegexBtn.addEventListener('click', () => {
      $('#regexPattern').value = '';
      $('#regexTestText').value = '';
      $('#regexResult').innerHTML = '<div class="empty-state">Enter a regex pattern and click "Test Regex" to see matches</div>';
      $('#matchesList').innerHTML = '<div class="no-matches">No matches found</div>';
      $('#regexMatchCount').textContent = '0';
      $('#regexTestTime').textContent = '0ms';
      selectedRegexFlags.clear();
      regexFlags.forEach(flag => flag.classList.remove('active'));
      toast('Regex tester cleared', 'success');
    });
  }
  
  if (loadSampleRegexBtn) {
    loadSampleRegexBtn.addEventListener('click', () => {
      $('#regexPattern').value = '\\b\\d{3}-\\d{2}-\\d{4}\\b';
      $('#regexTestText').value = `Contact us at 123-45-6789 or 987-65-4321.
Our office hours are 9-5 Monday to Friday.
For emergencies, call 555-12-3456.`;
      selectedRegexFlags.add('g');
      $('.regex-flag[data-flag="g"]').classList.add('active');
      toast('Sample regex loaded', 'success');
    });
  }
  
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // --- Settings
  const themeOptions = $$('.theme-option');
  const fontSizeInput = $('#fontSize');
  const fontSizeValue = $('#fontSizeValue');
  const fontFamilySelect = $('#fontFamily');
  const tabSizeInput = $('#tabSize');
  const insertSpacesCheckbox = $('#insertSpaces');
  const wordWrapCheckbox = $('#wordWrap');
  const showLineNumbersCheckbox = $('#showLineNumbers');
  const autoSaveCheckbox = $('#autoSave');
  const autoSaveIntervalSelect = $('#autoSaveInterval');
  const exportSettingsBtn = $('#exportSettings');
  const importSettingsBtn = $('#importSettings');
  const clearDataBtn = $('#clearData');
  
  // Theme options
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      if (theme === 'dark') {
        document.body.classList.remove('light-theme');
        state.theme = 'dark';
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-moon"></i>';
      } else {
        document.body.classList.add('light-theme');
        state.theme = 'light';
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-sun"></i>';
      }
      
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      storage.setItem('textcraft:theme', state.theme);
      toast(`Theme changed to ${theme}`, 'success');
    });
  });
  
  // Font size
  if (fontSizeInput && fontSizeValue) {
    fontSizeInput.addEventListener('input', () => {
      const size = fontSizeInput.value;
      fontSizeValue.textContent = size + 'px';
      document.documentElement.style.setProperty('--editor-font-size', size + 'px');
      state.settings.fontSize = parseInt(size);
      saveSettings();
    });
  }
  
  // Font family
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', () => {
      const family = fontFamilySelect.value;
      state.settings.fontFamily = family;
      
      textareas.forEach(textarea => {
        switch (family) {
          case 'system':
            textarea.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            break;
          case 'consolas':
            textarea.style.fontFamily = 'Consolas, "Liberation Mono", Menlo, monospace';
            break;
          case 'source-code-pro':
            textarea.style.fontFamily = '"Source Code Pro", monospace';
            break;
          default:
            textarea.style.fontFamily = 'monospace';
        }
      });
      
      saveSettings();
    });
  }
  
  // Tab size
  if (tabSizeInput) {
    tabSizeInput.addEventListener('change', () => {
      state.settings.tabSize = parseInt(tabSizeInput.value);
      saveSettings();
    });
  }
  
  // Insert spaces
  if (insertSpacesCheckbox) {
    insertSpacesCheckbox.addEventListener('change', () => {
      state.settings.insertSpaces = insertSpacesCheckbox.checked;
      saveSettings();
    });
  }
  
  // Word wrap
  if (wordWrapCheckbox) {
    wordWrapCheckbox.addEventListener('change', () => {
      state.settings.wordWrap = wordWrapCheckbox.checked;
      
      textareas.forEach(textarea => {
        if (state.settings.wordWrap) {
          textarea.classList.add('word-wrap');
        } else {
          textarea.classList.remove('word-wrap');
        }
      });
      
      saveSettings();
    });
  }
  
  // Show line numbers
  if (showLineNumbersCheckbox) {
    showLineNumbersCheckbox.addEventListener('change', () => {
      state.settings.showLineNumbers = showLineNumbersCheckbox.checked;
      
      const lineNumbers = $$('.line-numbers');
      lineNumbers.forEach(ln => {
        ln.style.display = state.settings.showLineNumbers ? 'block' : 'none';
      });
      
      textareas.forEach(textarea => {
        if (state.settings.showLineNumbers) {
          textarea.style.paddingLeft = '60px';
        } else {
          textarea.style.paddingLeft = '10px';
        }
      });
      
      saveSettings();
    });
  }
  
  // Auto save
  if (autoSaveCheckbox && autoSaveIntervalSelect) {
    autoSaveCheckbox.addEventListener('change', () => {
      state.settings.autoSave = autoSaveCheckbox.checked;
      saveSettings();
    });
    
    autoSaveIntervalSelect.addEventListener('change', () => {
      state.settings.autoSaveInterval = parseInt(autoSaveIntervalSelect.value);
      saveSettings();
    });
  }
  
  // Export settings
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener('click', () => {
      const settings = {
        theme: state.theme,
        settings: state.settings
      };
      
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'textcraft-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      toast('Settings exported', 'success');
    });
  }
  
  // Import settings
  if (importSettingsBtn) {
    importSettingsBtn.addEventListener('click', () => {
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
                state.theme = 'light';
                if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-sun"></i>';
              } else {
                document.body.classList.remove('light-theme');
                state.theme = 'dark';
                if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                if (themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-moon"></i>';
              }
              
              themeOptions.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.theme === settings.theme);
              });
            }
            
            // Apply settings
            if (settings.settings) {
              Object.assign(state.settings, settings.settings);
              
              // Update UI
              if (fontSizeInput) {
                fontSizeInput.value = state.settings.fontSize;
                fontSizeValue.textContent = state.settings.fontSize + 'px';
                document.documentElement.style.setProperty('--editor-font-size', state.settings.fontSize + 'px');
              }
              
              if (fontFamilySelect) {
                fontFamilySelect.value = state.settings.fontFamily;
              }
              
              if (tabSizeInput) {
                tabSizeInput.value = state.settings.tabSize;
              }
              
              if (insertSpacesCheckbox) {
                insertSpacesCheckbox.checked = state.settings.insertSpaces;
              }
              
              if (wordWrapCheckbox) {
                wordWrapCheckbox.checked = state.settings.wordWrap;
              }
              
              if (showLineNumbersCheckbox) {
                showLineNumbersCheckbox.checked = state.settings.showLineNumbers;
              }
              
              if (autoSaveCheckbox) {
                autoSaveCheckbox.checked = state.settings.autoSave;
              }
              
              if (autoSaveIntervalSelect) {
                autoSaveIntervalSelect.value = state.settings.autoSaveInterval;
              }
            }
            
            saveSettings();
            toast('Settings imported', 'success');
          } catch (e) {
            toast('Invalid settings file', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }
  
  // Clear data
  if (clearDataBtn) {
    clearDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        Object.keys(storage).filter(k => k.startsWith('textcraft:')).forEach(k => storage.removeItem(k));
        toast('All data cleared', 'success');
      }
    });
  }
  
  function saveSettings() {
    storage.setItem('textcraft:settings', JSON.stringify(state.settings));
  }

  // --- Load saved settings
  const savedSettings = storage.getItem('textcraft:settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      Object.assign(state.settings, settings);
      
      // Apply settings to UI
      if (fontSizeInput) {
        fontSizeInput.value = state.settings.fontSize;
        fontSizeValue.textContent = state.settings.fontSize + 'px';
        document.documentElement.style.setProperty('--editor-font-size', state.settings.fontSize + 'px');
      }
      
      if (fontFamilySelect) {
        fontFamilySelect.value = state.settings.fontFamily;
      }
      
      if (tabSizeInput) {
        tabSizeInput.value = state.settings.tabSize;
      }
      
      if (insertSpacesCheckbox) {
        insertSpacesCheckbox.checked = state.settings.insertSpaces;
      }
      
      if (wordWrapCheckbox) {
        wordWrapCheckbox.checked = state.settings.wordWrap;
      }
      
      if (showLineNumbersCheckbox) {
        showLineNumbersCheckbox.checked = state.settings.showLineNumbers;
      }
      
      if (autoSaveCheckbox) {
        autoSaveCheckbox.checked = state.settings.autoSave;
      }
      
      if (autoSaveIntervalSelect) {
        autoSaveIntervalSelect.value = state.settings.autoSaveInterval;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }

  // --- Find and Replace
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
  const matchCaseCheckbox = $('#matchCase');
  const matchWholeWordCheckbox = $('#matchWholeWord');
  const useRegexCheckbox = $('#useRegex');
  
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
    
    let flags = '';
    if (!matchCaseCheckbox.checked) flags += 'i';
    if (useRegexCheckbox.checked) flags += 'g';
    
    let regex;
    try {
      regex = new RegExp(searchText, flags);
    } catch (e) {
      findReplaceInfo.textContent = 'Invalid regular expression';
      return;
    }
    
    let matchIndex = -1;
    
    if (direction === 'next') {
      matchIndex = text.substring(currentIndex).search(regex);
      if (matchIndex !== -1) {
        matchIndex += currentIndex;
      } else {
        // Wrap around
        matchIndex = text.search(regex);
      }
    } else {
      // Search backwards
      const matches = [...text.matchAll(regex)];
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].index < currentIndex) {
          matchIndex = matches[i].index;
          break;
        }
      }
      if (matchIndex === -1 && matches.length > 0) {
        // Wrap around
        matchIndex = matches[matches.length - 1].index;
      }
    }
    
    if (matchIndex !== -1) {
      const match = text.match(regex)[0];
      currentEditor.focus();
      currentEditor.setSelectionRange(matchIndex, matchIndex + match.length);
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
    
    let flags = '';
    if (!matchCaseCheckbox.checked) flags += 'i';
    
    let regex;
    try {
      regex = new RegExp(searchText, flags);
    } catch (e) {
      findReplaceInfo.textContent = 'Invalid regular expression';
      return;
    }
    
    if (regex.test(selectedText)) {
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
    
    let flags = 'g';
    if (!matchCaseCheckbox.checked) flags += 'i';
    
    let regex;
    try {
      regex = new RegExp(searchText, flags);
    } catch (e) {
      findReplaceInfo.textContent = 'Invalid regular expression';
      return;
    }
    
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
  
  if (findReplaceBtn) findReplaceBtn.addEventListener('click', showFindReplace);
  if (closeFindReplace) closeFindReplace.addEventListener('click', hideFindReplace);
  if (findNextBtn) findNextBtn.addEventListener('click', () => findInEditor('next'));
  if (findPrevBtn) findPrevBtn.addEventListener('click', () => findInEditor('prev'));
  if (replaceBtn) replaceBtn.addEventListener('click', replaceInEditor);
  if (replaceAllBtn) replaceAllBtn.addEventListener('click', replaceAllInEditor);
  
  // Keyboard shortcuts for find/replace
  if (findInput) {
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
  }
  
  if (replaceInput) {
    replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        replaceInEditor();
      } else if (e.key === 'Escape') {
        hideFindReplace();
      }
    });
  }

  // --- Help Modal
  const helpBtn = $('#helpBtn');
  const helpModal = $('#helpModal');
  const closeHelp = $('#closeHelp');
  
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      helpModal.style.display = 'flex';
    });
  }
  
  if (closeHelp) {
    closeHelp.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
  }
  
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.style.display = 'none';
      }
    });
  }

  // --- Save All and Clear All
  const saveAllBtn = $('#saveAll');
  const clearAllBtn = $('#clearAll');
  
  if (saveAllBtn) {
    saveAllBtn.addEventListener('click', () => {
      // Collect all text from all editors
      const allText = {};
      
      textareas.forEach(textarea => {
        if (textarea.value) {
          allText[textarea.id] = textarea.value;
        }
      });
      
      // Save to localStorage
      storage.setItem('textcraft:allText', JSON.stringify(allText));
      toast('All content saved', 'success');
    });
  }
  
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
        textareas.forEach(textarea => {
          textarea.value = '';
        });
        
        // Clear any outputs
        $$('textarea[readonly]').forEach(textarea => {
          textarea.value = '';
        });
        
        toast('All content cleared', 'success');
      }
    });
  }

  // --- Load saved content
  const savedAllText = storage.getItem('textcraft:allText');
  if (savedAllText) {
    try {
      const allText = JSON.parse(savedAllText);
      
      Object.keys(allText).forEach(id => {
        const textarea = $(id);
        if (textarea) {
          textarea.value = allText[id];
        }
      });
    } catch (e) {
      console.error('Failed to load saved content:', e);
    }
  }

  // --- Copy buttons
  const copyBtns = $$('[id*="copy"]');
  
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.id.replace('copy', '').toLowerCase();
      let target = $(targetId);
      
      if (!target) {
        // Try alternative patterns
        target = $(targetId + 'Text') || $(targetId + 'Output') || $(targetId + 'Result');
      }
      
      if (target) {
        copyToClipboard(target.value).then(() => {
          toast('Copied to clipboard', 'success');
        }).catch(() => {
          toast('Failed to copy', 'error');
        });
      }
    });
  });
  
  // --- Download buttons
  const downloadBtns = $$('[id*="download"]');
  
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.id.replace('download', '').toLowerCase();
      let target = $(targetId);
      
      if (!target) {
        // Try alternative patterns
        target = $(targetId + 'Text') || $(targetId + 'Output') || $(targetId + 'Result');
      }
      
      if (target && target.value) {
        const filename = targetId + '.txt';
        downloadBlob(target.value, 'text/plain', filename);
        toast(`Downloading ${filename}`, 'success');
      }
    });
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

  // --- Download helper function
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

  // --- Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (saveFileBtn) saveFileBtn.click();
    }
    
    // Ctrl/Cmd + O: Open
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      if (openFileBtn) openFileBtn.click();
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
    
    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
    }
    
    // Ctrl/Cmd + Y: Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
      if (state.findReplace.isActive) {
        hideFindReplace();
      }
      if (helpModal && helpModal.style.display === 'flex') {
        helpModal.style.display = 'none';
      }
    }
  });

  // --- Auto-save functionality
  let autoSaveInterval;
  
  function setupAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    
    if (state.settings.autoSave) {
      autoSaveInterval = setInterval(() => {
        if (textEditor && textEditor.value) {
          storage.setItem('textcraft:autoSave', textEditor.value);
        }
      }, state.settings.autoSaveInterval * 1000);
    }
  }
  
  setupAutoSave();
  
  // Load auto-saved content
  const autoSaved = storage.getItem('textcraft:autoSave');
  if (autoSaved && textEditor) {
    textEditor.value = autoSaved;
    updateCursorPosition(textEditor);
    updateSelectionInfo(textEditor);
  }

  // --- Window resize handler
  window.addEventListener('resize', () => {
    // Update line numbers on resize
    textareas.forEach(textarea => {
      const lineNumbersId = textarea.id + 'LineNumbers';
      updateLineNumbers(textarea, lineNumbersId);
    });
  });

  // --- Expose useful functions to global for debugging
  window.textcraft = {
    downloadBlob,
    copyToClipboard,
    toast,
    state,
    switchTool,
    analyzeText
  };
})();