/* Code & Text Cleaner Pro
   - Author: Thio Saputra | flessan.pages.dev
   - Features: text utils, code cleaner, html decoder, combine/split, download, autosave
*/

(() => {
  // --- utils
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const saveKey = key => `ctcpro:${key}`;

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
      // update toolbar buttons behavior (disable/enable save/load maybe)
    });
  });

  // --- TEXT TOOLS
  const inputText = $('#inputText');
  const outputText = $('#outputText');
  const wordCount = $('#wordCount');
  const charCount = $('#charCount');

  const updateCounts = txt => {
    const chars = txt.length;
    const words = (txt.trim().match(/\S+/g) || []).length;
    charCount.textContent = `Karakter: ${chars}`;
    wordCount.textContent = `Kata: ${words}`;
  };

  function transformText(action) {
    let t = inputText.value;
    if(action === 'lower') t = t.toLowerCase();
    if(action === 'upper') t = t.toUpperCase();
    if(action === 'title') t = t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if(action === 'trimspaces') t = t.replace(/[ \t]+/g, ' ');
    if(action === 'trimlines') t = t.split('\n').filter(l => l.trim() !== '').join('\n');
    outputText.value = t;
    updateCounts(t);
  }

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => transformText(btn.dataset.action));
  });

  inputText.addEventListener('input', e => {
    // live preview (simple mirror)
    updateCounts(inputText.value);
  });

  $('#copyOutput').addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(outputText.value || inputText.value);
      alert('Tersalin ke clipboard — mantap!');
    }catch(e){ alert('Gagal copy: '+e) }
  });

  // download txt
  $('#downloadTxt').addEventListener('click', () => {
    const txt = outputText.value || inputText.value;
    if(!txt) return alert('Tidak ada teks untuk diunduh.');
    downloadBlob(txt, 'text/plain', 'output.txt');
  });

  // save/load/reset (localStorage)
  $('#saveLocal').addEventListener('click', () => {
    localStorage.setItem(saveKey('text:input'), inputText.value);
    localStorage.setItem(saveKey('text:output'), outputText.value);
    alert('Disimpan di localStorage.');
  });
  $('#loadLocal').addEventListener('click', () => {
    const a = localStorage.getItem(saveKey('text:input')) || '';
    const b = localStorage.getItem(saveKey('text:output')) || '';
    inputText.value = a; outputText.value = b;
    updateCounts(inputText.value || outputText.value);
    alert('Dimuat dari localStorage.');
  });
  $('#reset').addEventListener('click', () => {
    if(!confirm('Reset semua area?')) return;
    inputText.value = ''; outputText.value = '';
    updateCounts('');
  });

  // autosave every 5s (only text tool)
  setInterval(() => {
    localStorage.setItem(saveKey('text:auto'), inputText.value);
  }, 5000);
  // load autosave on init
  const autosaved = localStorage.getItem(saveKey('text:auto'));
  if(autosaved) inputText.value = autosaved, updateCounts(autosaved);

  // --- CODE CLEANER
  const codeInput = $('#codeInput');
  const codeOutput = $('#codeOutput');

  function removeCommentsCSSJS(s){
    // remove /* ... */ and //... (line) cautiously
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/(^|\n)\s*\/\/.*$/gm, '');
    return s;
  }

  function minifyHTML(html){
    // remove comments
    html = html.replace(/<!--[\s\S]*?-->/g, '');
    // collapse whitespace between tags
    html = html.replace(/\s{2,}/g, ' ');
    html = html.replace(/>\s+</g, '><');
    return html.trim();
  }

  function cleanCSS(s){
    s = removeCommentsCSSJS(s);
    // collapse spaces
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }

  function cleanJS(s){
    s = removeCommentsCSSJS(s);
    // collapse lines
    s = s.replace(/\n\s*/g, '\n');
    return s.trim();
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
    });
  });

  $('#copyCode').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(codeOutput.value || codeInput.value); alert('Copied!') }
    catch(e){ alert('Gagal copy: '+e) }
  });
  $('#downloadCode').addEventListener('click', () => {
    const txt = codeOutput.value || codeInput.value;
    if(!txt) return alert('Tidak ada kode.');
    downloadBlob(txt, 'text/plain', 'code.txt');
  });

  // --- HTML ENTITY DECODER / ENCODER
  const encoded = $('#encoded'), decoded = $('#decoded');
  $('#decodeBtn').addEventListener('click', () => {
    decoded.value = decodeHTMLEntities(encoded.value);
  });
  $('#encodeBtn').addEventListener('click', () => {
    encoded.value = encodeHTMLEntities(decoded.value || encoded.value);
  });
  $('#copyDecoded').addEventListener('click', async () => {
    try{ await navigator.clipboard.writeText(decoded.value); alert('Copied!') } catch(e){ alert('Fail') }
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
      // detect body insertion
      if(/<html/i.test(htmlRaw)){
        doc = htmlRaw;
        // insert css into head if found
        if(combineCss.value.trim()){
          doc = doc.replace(/<\/head>/i, `  <style>\n${combineCss.value}\n  </style>\n</head>`);
        }
        if(combineJs.value.trim()){
          doc = doc.replace(/<\/body>/i, `  <script>\n${combineJs.value}\n  </script>\n</body>`);
        }
      } else {
        // only body fragment -> wrap
        doc = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1"/>\n<title>Combined</title>\n<style>\n${combineCss.value}\n</style>\n</head>\n<body>\n${htmlRaw}\n<script>\n${combineJs.value}\n</script>\n</body>\n</html>`;
      }
    } catch (e) {
      doc = htmlRaw;
    }
    combinedOutput.value = doc;
  });

  $('#copyCombined').addEventListener('click', async () => {
    await navigator.clipboard.writeText(combinedOutput.value);
    alert('Combined copied!');
  });
  $('#downloadCombined').addEventListener('click', () => {
    const html = combinedOutput.value;
    if(!html) return alert('Tidak ada hasil gabungan.');
    downloadBlob(html, 'text/html', 'combined.html');
  });

  // --- SPLIT
  const splitInput = $('#splitInput'), splitHtml = $('#splitHtml'), splitCss = $('#splitCss'), splitJs = $('#splitJs');
  $('#splitBtn').addEventListener('click', () => {
    const src = splitInput.value;
    if(!src) return alert('Masukkan HTML yang berisi <style> atau <script>.');
    // extract <style>
    const styleMatches = [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    const scriptMatches = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    let css = styleMatches.map(m=>m[1]).join('\n\n').trim();
    let js = scriptMatches.map(m=>m[1]).join('\n\n').trim();
    // remove style/script tags from html
    let htmlClean = src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    splitCss.value = css;
    splitJs.value = js;
    splitHtml.value = htmlClean.trim();
  });

  $('#downloadHtml').addEventListener('click', () => {
    const t = splitHtml.value;
    if(!t) return alert('Tidak ada HTML.');
    downloadBlob(t, 'text/html', 'split.html');
  });
  $('#downloadCss').addEventListener('click', () => {
    const t = splitCss.value;
    if(!t) return alert('Tidak ada CSS.');
    downloadBlob(t, 'text/css', 'styles.css');
  });
  $('#downloadJs').addEventListener('click', () => {
    const t = splitJs.value;
    if(!t) return alert('Tidak ada JS.');
    downloadBlob(t, 'application/javascript', 'script.js');
  });

  // --- clear all storage
  $('#clearAll').addEventListener('click', () => {
    if(confirm('Yakin mau hapus semua data localStorage untuk tool ini?')) {
      Object.keys(localStorage).filter(k => k.startsWith('ctcpro:')).forEach(k => localStorage.removeItem(k));
      alert('Local data dibersihin. Segar lagi! 🌱');
    }
  });

  // --- download utility
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

  // --- helper: initial sample fill (optional, feel free to remove)
  // small hint content
  combineHtml.value = '<h1>Halo Thio</h1>\n<p>Ini contoh body.</p>';
  combineCss.value = 'body{font-family:Inter,sans-serif;padding:20px} h1{color: #0ea5e9}';
  combineJs.value = "console.log('Combined by Code & Text Cleaner Pro');";

})();
