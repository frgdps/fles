/*
  Code & Text Cleaner Pro - Full Version
  Features: text utils, code cleaner, html decoder, combine/split, drag & drop file import, preview iframe, toasts, download, autosave
  Author: Thio Saputra / site:flessan.pages.dev
*/

(() => {
  // --- simple helpers
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const saveKey = key => `ctcpro:${key}`;
  const toastEl = $('#toast');
  function toast(msg, timeout = 2000){
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    setTimeout(()=> toastEl.classList.add('show'), 10);
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(()=> toastEl.classList.add('hidden'), 250);
    }, timeout);
  }

  // --- tab nav
  const tabBtns = $$('.tab-btn');
  const panels = $$('.panel');
  const toolTitle = $('#toolTitle');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.dataset.tool;
      panels.forEach(p => p.classList.toggle('hidden', p.dataset.tool !== tool));
      toolTitle.textContent = btn.textContent;
    });
  });

  // --- TEXT TOOLS
  const inputText = $('#inputText');
  const outputText = $('#outputText');
  const wordCount = $('#wordCount');
  const charCount = $('#charCount');

  function updateCounts(txt){
    const chars = txt.length;
    const words = (txt.trim().match(/\S+/g) || []).length;
    charCount.textContent = `Karakter: ${chars}`;
    wordCount.textContent = `Kata: ${words}`;
  }

  function transformText(action){
    let t = inputText.value;
    if(action === 'lower') t = t.toLowerCase();
    if(action === 'upper') t = t.toUpperCase();
    if(action === 'title') t = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if(action === 'trimspaces') t = t.replace(/[ \t]{2,}/g, ' ');
    if(action === 'trimlines') t = t.split('\n').filter(l => l.trim() !== '').join('\n');
    outputText.value = t;
    updateCounts(t);
    toast('Transformasi selesai');
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => transformText(btn.dataset.action));
  });

  inputText.addEventListener('input', e => {
    updateCounts(inputText.value);
    // live mirror optional: leave output alone unless transform applied
  });

  $('#copyOutput').addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(outputText.value || inputText.value);
      toast('Tersalin ke clipboard ✅');
    } catch(e){
      toast('Gagal menyalin: ' + (e.message||e));
    }
  });

  $('#downloadTxt').addEventListener('click', () => {
    const txt = outputText.value || inputText.value;
    if(!txt) return toast('Tidak ada teks untuk diunduh.');
    downloadBlob(txt, 'text/plain', 'output.txt');
    toast('Mulai unduh output.txt');
  });

  // prettify JSON
  $('#prettyJson').addEventListener('click', () => {
    const s = inputText.value.trim();
    if(!s) return toast('Masukkan JSON di input.');
    try{
      const obj = JSON.parse(s);
      outputText.value = JSON.stringify(obj, null, 2);
      updateCounts(outputText.value);
      toast('JSON berhasil di-prettify');
    }catch(e){
      toast('Bukan JSON valid: ' + e.message);
    }
  });

  // save/load/reset (localStorage)
  $('#saveLocal').addEventListener('click', () => {
    localStorage.setItem(saveKey('text:input'), inputText.value);
    localStorage.setItem(saveKey('text:output'), outputText.value);
    toast('Disimpan di localStorage');
  });
  $('#loadLocal').addEventListener('click', () => {
    const a = localStorage.getItem(saveKey('text:input')) || '';
    const b = localStorage.getItem(saveKey('text:output')) || '';
    inputText.value = a; outputText.value = b;
    updateCounts(inputText.value || outputText.value);
    toast('Dimuat dari localStorage');
  });
  $('#reset').addEventListener('click', () => {
    if(!confirm('Reset semua area?')) return;
    inputText.value = ''; outputText.value = '';
    updateCounts('');
    toast('Reset selesai');
  });

  // autosave every 5s (text)
  setInterval(() => {
    localStorage.setItem(saveKey('text:auto'), inputText.value);
  }, 5000);
  const autosaved = localStorage.getItem(saveKey('text:auto'));
  if(autosaved) { inputText.value = autosaved; updateCounts(autosaved); }

  // --- drag & drop for text
  const textDrop = $('#textDrop');
  function setupDrop(zone, targetTextarea, allowed = ['txt','md']){
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', e => { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', async e => {
      e.preventDefault(); zone.classList.remove('dragover');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      if(!allowed.includes(ext) && allowed.length) return toast('Jenis file tidak didukung: '+ext);
      const text = await f.text();
      targetTextarea.value = text;
      updateCounts(targetTextarea === inputText ? targetTextarea.value : '');
      toast('File dimuat: ' + f.name);
    });
  }
  setupDrop(textDrop, inputText, ['txt','md','json']);

  // --- CODE CLEANER
  const codeInput = $('#codeInput'), codeOutput = $('#codeOutput');
  function removeCommentsCSSJS(s){
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/(^|\n)\s*\/\/.*$/gm, '');
    return s;
  }
  function minifyHTML(html){
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    html = html.replace(/\s{2,}/g, ' ');
    html = html.replace(/>\s+</g, '><');
    return html.trim();
  }
  function cleanCSS(s){
    s = removeCommentsCSSJS(s);
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }
  function cleanJS(s){
    s = removeCommentsCSSJS(s);
    s = s.replace(/\n\s*/g, '\n');
    return s.trim();
  }
  function formatHTMLbasic(s){
    // naive pretty: add newlines after tags for readability (not full parser)
    return s.replace(/>\s*</g, '>\n<').replace(/\n\s+/g, '\n').trim();
  }

  $$('[data-code-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.codeAction;
      let src = codeInput.value;
      let out = '';
      if(act === 'minify-html') out = minifyHTML(src);
      if(act === 'minify-css') out = cleanCSS(src);
      if(act === 'minify-js') out = cleanJS(src);
      if(act === 'remove-comments') out = removeCommentsCSSJS(src);
      codeOutput.value = out;
      toast('Operasi selesai: ' + act);
    });
  });

  $('#formatHtml').addEventListener('click', () => {
    codeOutput.value = formatHTMLbasic(codeInput.value);
    toast('Format HTML (basic) siap');
  });

  $('#copyCode').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(codeOutput.value || codeInput.value); toast('Copied!') }
    catch(e){ toast('Gagal copy: '+e) }
  });
  $('#downloadCode').addEventListener('click', () => {
    const txt = codeOutput.value || codeInput.value;
    if(!txt) return toast('Tidak ada kode.');
    // try to guess extension
    let ext = 'txt';
    const sample = txt.slice(0,200).toLowerCase();
    if(sample.includes('<html') || sample.includes('<!doctype')) ext = 'html';
    else if(sample.includes('{') && sample.includes('}')) ext = 'js';
    else if(sample.includes('{') && sample.includes('color')) ext = 'css';
    downloadBlob(txt, 'text/plain', `code.${ext}`);
    toast('Download started');
  });

  // drag & drop for code files
  const codeDrop = $('#codeDrop');
  setupDrop(codeDrop, codeInput, ['html','css','js','txt']);

  // preview iframe for code
  $('#previewCode').addEventListener('click', () => {
    const src = codeOutput.value || codeInput.value;
    if(!src) return toast('Tidak ada kode untuk preview.');
    const previewWrap = $('#previewWrap');
    const iframe = $('#previewFrame');
    // if html fragment, wrap minimal
    let doc = src;
    if(!/<html/i.test(src)) {
      doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${src}</body></html>`;
    }
    iframe.srcdoc = doc;
    previewWrap.classList.remove('hidden');
    toast('Preview siap');
  });
  $('#closePreview').addEventListener('click', () => {
    $('#previewWrap').classList.add('hidden');
    $('#previewFrame').srcdoc = 'about:blank';
  });

  // --- HTML ENTITY DECODER / ENCODER
  const encoded = $('#encoded'), decoded = $('#decoded');
  $('#decodeBtn').addEventListener('click', () => {
    decoded.value = decodeHTMLEntities(encoded.value);
    toast('Decode selesai');
  });
  $('#encodeBtn').addEventListener('click', () => {
    encoded.value = encodeHTMLEntities(decoded.value || encoded.value);
    toast('Encode selesai');
  });
  $('#copyDecoded').addEventListener('click', async () => {
    try{ await navigator.clipboard.writeText(decoded.value); toast('Copied!') } catch(e){ toast('Fail') }
  });
  $('#autoDetectEntities').addEventListener('click', () => {
    const v = encoded.value;
    if(/&[a-z0-9]+;/.test(v) || /&lt;|&gt;|&amp;/.test(v)) {
      decoded.value = decodeHTMLEntities(v);
      toast('Entities ter-detect dan didecode');
    } else toast('Tidak menemukan entitas HTML di input');
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
  const combineHtml = $('#combineHtml'), combineCss = $('#combineCss'), combineJs = $('#combineJs'), combinedOutput = $('#combinedOutput');
  $('#combineBtn').addEventListener('click', () => {
    const htmlRaw = combineHtml.value || '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n</head>\n<body>\n</body>\n</html>';
    let doc;
    try{
      if(/<html/i.test(htmlRaw)){
        doc = htmlRaw;
        if(combineCss.value.trim()){
          if(/<\/head>/i.test(doc)) doc = doc.replace(/<\/head>/i, `  <style>\n${combineCss.value}\n  </style>\n</head>`);
          else doc = doc.replace(/<body.*?>/i, `<head><style>\n${combineCss.value}\n</style></head>$&`);
        }
        if(combineJs.value.trim()){
          if(/<\/body>/i.test(doc)) doc = doc.replace(/<\/body>/i, `  <script>\n${combineJs.value}\n  </script>\n</body>`);
          else doc += `\n<script>\n${combineJs.value}\n</script>`;
        }
      } else {
        doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n<style>\n${combineCss.value}\n</style>\n</head>\n<body>\n${htmlRaw}\n<script>\n${combineJs.value}\n</script>\n</body>\n</html>`;
      }
    } catch (e) {
      doc = htmlRaw;
    }
    combinedOutput.value = doc;
    toast('Combine selesai');
  });

  $('#copyCombined').addEventListener('click', async () => {
    await navigator.clipboard.writeText(combinedOutput.value);
    toast('Combined copied!');
  });
  $('#downloadCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if(!html) return toast('Tidak ada hasil gabungan.');
    downloadBlob(html, 'text/html', 'combined.html');
    toast('Mengunduh combined.html');
  });

  // combined preview
  $('#previewCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if(!html) return toast('Tidak ada data untuk preview.');
    const wrap = $('#previewCombinedWrap');
    const ifr = $('#previewCombined');
    ifr.srcdoc = html;
    wrap.classList.remove('hidden');
    toast('Preview combined siap');
  });
  $$('.closePreview').forEach(b => b.addEventListener('click', e => {
    const target = $('#'+e.target.dataset.target);
    target.classList.add('hidden');
    $('#previewCombined').srcdoc = 'about:blank';
  }));

  // --- SPLIT
  const splitInput = $('#splitInput'), splitHtml = $('#splitHtml'), splitCss = $('#splitCss'), splitJs = $('#splitJs');
  $('#splitBtn').addEventListener('click', () => {
    const src = splitInput.value;
    if(!src) return toast('Masukkan HTML yang berisi <style> / <script>.');
    const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    const scriptMatches = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    let css = styleMatches.map(m=>m[1]).join('\n\n').trim();
    let js = scriptMatches.map(m=>m[1]).join('\n\n').trim();
    let htmlClean = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    splitCss.value = css;
    splitJs.value = js;
    splitHtml.value = htmlClean.trim();
    toast('Split selesai');
  });

  $('#downloadHtml').addEventListener('click', () => {
    const t = splitHtml.value;
    if(!t) return toast('Tidak ada HTML.');
    downloadBlob(t, 'text/html', 'split.html'); toast('Unduh split.html');
  });
  $('#downloadCss').addEventListener('click', () => {
    const t = splitCss.value;
    if(!t) return toast('Tidak ada CSS.');
    downloadBlob(t, 'text/css', 'styles.css'); toast('Unduh styles.css');
  });
  $('#downloadJs').addEventListener('click', () => {
    const t = splitJs.value;
    if(!t) return toast('Tidak ada JS.');
    downloadBlob(t, 'application/javascript', 'script.js'); toast('Unduh script.js');
  });
  $('#copySplitAll').addEventListener('click', async () => {
    const combined = `HTML:\n${splitHtml.value}\n\nCSS:\n${splitCss.value}\n\nJS:\n${splitJs.value}`;
    await navigator.clipboard.writeText(combined);
    toast('Semua bagian disalin');
  });

  // clear all storage
  $('#clearAll').addEventListener('click', () => {
    if(confirm('Yakin hapus semua data localStorage untuk tool ini?')) {
      Object.keys(localStorage).filter(k => k.startsWith('ctcpro:')).forEach(k => localStorage.removeItem(k));
      toast('Local data dibersihin 🌱');
    }
  });

  // drag input for split/combine (optional) - reuse setupDrop
  setupDrop($('#textDrop'), inputText, ['txt','md','json']);
  setupDrop($('#codeDrop'), codeInput, ['html','css','js','txt']);

  // utility: download blob
  function downloadBlob(text, type, filename){
    const blob = new Blob([text], {type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
  }

  // expose some useful things to global for debugging (optional)
  window.ctc = {
    downloadBlob, minifyHTML, cleanCSS, cleanJS: cleanJS, toast
  };

})();
