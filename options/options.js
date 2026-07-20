document.addEventListener('DOMContentLoaded', async () => {

  // ── i18n helper ────────────────────────────────────────────────
  // Thunderbird doesn't auto-replace __MSG_x__ in extension pages loaded
  // via options_ui, so we do it manually for all [data-i18n] elements.
  function t(key) {
    return messenger.i18n.getMessage(key) || key;
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Also set the placeholder on the emoji input
  document.getElementById('emojiInput').placeholder = t('addEmojiPlaceholder');

  // ── Load settings ──────────────────────────────────────────────
  const stored = await messenger.storage.local.get([
    "emojis", "autoSend", "accentColor", "bgColor", "borderStyle", "emojiSize"
  ]);

  let emojiList = (stored.emojis ?? "👍 🙃 😀 ❤️ 👌 🙏")
    .split(" ").filter(e => e.trim());

  const autoSendCb = document.getElementById('autoSend');
  const emojiInput = document.getElementById('emojiInput');
  const addBtn = document.getElementById('addBtn');
  const grid = document.getElementById('emojiGrid');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  const accentPicker = document.getElementById('accentColor');
  const accentHex = document.getElementById('accentHex');
  const bgPicker = document.getElementById('bgColor');
  const bgHex = document.getElementById('bgHex');
  const styleBtns = document.querySelectorAll('.style-btn');
  const emojiSizeEl = document.getElementById('emojiSize');
  const emojiSizeVal = document.getElementById('emojiSizeVal');
  const livePreview = document.getElementById('livePreview');

  autoSendCb.checked = stored.autoSend ?? false;

  const initAccent = stored.accentColor ?? "#5B4FD9";
  const initBg = stored.bgColor ?? "#F4F3FF";
  const initStyle = stored.borderStyle ?? "left";
  const initSize = stored.emojiSize ?? "32";

  accentPicker.value = initAccent;
  accentHex.value = initAccent;
  bgPicker.value = initBg;
  bgHex.value = initBg;
  emojiSizeEl.value = initSize;
  emojiSizeVal.textContent = initSize + "px";

  styleBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === initStyle);
  });

  // ── Emoji grid ─────────────────────────────────────────────────
  function renderGrid() {
    grid.replaceChildren();
    emojiList.forEach((emoji, index) => {
      const chip = document.createElement('div');
      chip.className = 'emoji-chip';

      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = emoji;

      const removeLabel = messenger.i18n.getMessage("removeEmojiLabel", [emoji])
        || `Remove ${emoji}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.setAttribute('aria-label', removeLabel);
      removeBtn.addEventListener('click', () => {
        emojiList.splice(index, 1);
        renderGrid();
        updatePreview();
      });

      chip.appendChild(emojiSpan);
      chip.appendChild(removeBtn);
      grid.appendChild(chip);
    });
  }

  renderGrid();

  addBtn.addEventListener('click', () => {
    const val = emojiInput.value.trim();
    if (!val) return;
    emojiList.push(val);
    emojiInput.value = '';
    renderGrid();
  });

  emojiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addBtn.click();
  });

  // ── Colour pickers ─────────────────────────────────────────────
  accentPicker.addEventListener('input', () => {
    accentHex.value = accentPicker.value;
    updatePreview();
  });
  accentHex.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(accentHex.value)) {
      accentPicker.value = accentHex.value;
      updatePreview();
    }
  });

  bgPicker.addEventListener('input', () => {
    bgHex.value = bgPicker.value;
    updatePreview();
  });
  bgHex.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(bgHex.value)) {
      bgPicker.value = bgHex.value;
      updatePreview();
    }
  });

  // ── Border style buttons ────────────────────────────────────────
  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePreview();
    });
  });

  // ── Emoji size slider ───────────────────────────────────────────
  emojiSizeEl.addEventListener('input', () => {
    emojiSizeVal.textContent = emojiSizeEl.value + "px";
    updatePreview();
  });

  // ── Live preview ────────────────────────────────────────────────
  function getActiveStyle() {
    return document.querySelector('.style-btn.active')?.dataset.style ?? 'left';
  }

  function buildBlockStyle(accent, bg, borderStyle) {
    let s = `border-radius:8px; padding:14px 18px; background:${bg}; display:inline-block; max-width:380px;`;
    if (borderStyle === "left") s += ` border-left:4px solid ${accent};`;
    if (borderStyle === "full") s += ` border:2px solid ${accent};`;
    if (borderStyle === "bubble") s += ` border-radius:18px; border:2px solid ${accent};`;
    return s;
  }

  function updatePreview() {
    const accent = accentPicker.value;
    const bg = bgPicker.value;
    const borderStyle = getActiveStyle();
    const size = emojiSizeEl.value;
    const previewEmoji = emojiList[0] ?? '👍';

    // Use i18n strings in the live preview too
    const reactMsg = t('reactMessage');
    const senderName = t('previewSenderName');

    // Build preview block entirely via DOM — no innerHTML
    const block = document.createElement('div');
    block.setAttribute('style', buildBlockStyle(accent, bg, borderStyle));

    const label = document.createElement('div');
    label.setAttribute('style',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;' +
      'font-size:13px; color:#6B7280; margin:0 0 8px 0;');

    const strong = document.createElement('strong');
    strong.setAttribute('style', 'color:#1A1B2E;');
    strong.textContent = senderName;

    label.appendChild(strong);
    label.appendChild(document.createTextNode(' ' + reactMsg));

    const emojiDiv = document.createElement('div');
    emojiDiv.setAttribute('style', `font-size:${size}px; line-height:1.2;`);
    emojiDiv.textContent = previewEmoji;

    block.appendChild(label);
    block.appendChild(emojiDiv);

    livePreview.replaceChildren(block);
  }

  updatePreview();

  // ── Save ────────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    await messenger.storage.local.set({
      emojis: emojiList.join(" "),
      autoSend: autoSendCb.checked,
      accentColor: accentPicker.value,
      bgColor: bgPicker.value,
      borderStyle: getActiveStyle(),
      emojiSize: emojiSizeEl.value,
    });

    statusEl.classList.add('visible');
    setTimeout(() => statusEl.classList.remove('visible'), 2500);
  });
});
