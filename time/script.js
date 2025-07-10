// Wait dom loaded
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const dateInput = document.getElementById('date-input');
  const timeInput = document.getElementById('time-input');
  const timezoneSelect = document.getElementById('timezone-select');
  const previewEl = document.getElementById('timestamp-preview');
  const previewTime = document.getElementById('preview-time');
  const copyBtn = document.getElementById('copy-btn');
  const formatBtns = document.querySelectorAll('.format-btn');

  let format = 'f';

  // Init
  dateInput.value = new Date().toISOString().split('T')[0];
  update();

  // Listeners
  [dateInput, timeInput, timezoneSelect].forEach(el => el.addEventListener('change', update));
  formatBtns.forEach(btn => btn.addEventListener('click', () => {
    formatBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    format = btn.dataset.format;
    update();
  }));
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(previewEl.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 1500);
  });

  function update() {
    const dt = new Date(`${dateInput.value}T${timeInput.value}`);
    if (isNaN(dt)) return;
    const ts = Math.floor(dt.getTime() / 1000);
    previewEl.textContent = `<t:${ts}:${format}>`;
    previewTime.textContent = dt.toLocaleString();
    document.getElementById('current-year').textContent = new Date().getFullYear();
  }
});
