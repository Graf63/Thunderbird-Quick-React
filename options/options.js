document.addEventListener('DOMContentLoaded', async () => {

  function t(key) {
    return messenger.i18n.getMessage(key) || key;
  }

  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.getElementById('emojiInput').placeholder = t('addEmojiPlaceholder');

  const stored = await messenger.storage.local.get([
    "emojis", "autoSend", "accentColor", "bgColor", "borderStyle", "emojiSize", "defaultReplyAll", "defaultSignature"
  ]);

  let emojiList = (stored.emojis ?? "👍 🙃 😀 ❤️ 👌 🙏").split(" ").filter(e => e.trim());

  const autoSendCb = document.getElementById('autoSend');
  const defaultReplyAllCb = document.getElementById('defaultReplyAll');
  const defaultSignatureCb = document.getElementById('defaultSignature');
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
  defaultReplyAllCb.checked = stored.defaultReplyAll ?? false;
  defaultSignatureCb.checked = stored.defaultSignature ?? true;

  const initAccent = stored.accentColor ?? "#5B4FD9";
  const initBg = stored.bgColor ?? "#F4F3FF";
  const initStyle = stored.borderStyle ?? "left";
  const initSize = stored.emojiSize ?? "32";

  accentPicker.value = accentHex.value = initAccent;
  bgPicker.value = bgHex.value = initBg;
  emojiSizeEl.value = initSize;
  emojiSizeVal.textContent = `${initSize}px`;

  styleBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.style === initStyle));

  function renderGrid() {
    grid.replaceChildren();
    emojiList.forEach((emoji, index) => {
      const chip = document.createElement('div');
      chip.className = 'emoji-chip';

      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = emoji;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.onclick = () => {
        emojiList.splice(index, 1);
        renderGrid();
        updatePreview();
      };

      chip.append(emojiSpan, removeBtn);
      grid.appendChild(chip);
    });
  }

  renderGrid();

  addBtn.onclick = () => {
    const val = emojiInput.value.trim();
    if (!val) return;
    emojiList.push(val);
    emojiInput.value = '';
    renderGrid();
  };

  emojiInput.onkeydown = e => e.key === 'Enter' && addBtn.click();

  const syncColor = (picker, hex) => {
    hex.value = picker.value;
    updatePreview();
  };
  const syncHex = (picker, hex) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) {
      picker.value = hex.value;
      updatePreview();
    }
  };

  accentPicker.oninput = () => syncColor(accentPicker, accentHex);
  accentHex.oninput = () => syncHex(accentPicker, accentHex);
  bgPicker.oninput = () => syncColor(bgPicker, bgHex);
  bgHex.oninput = () => syncHex(bgPicker, bgHex);

  styleBtns.forEach(btn => {
    btn.onclick = () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePreview();
    };
  });

  emojiSizeEl.oninput = () => {
    emojiSizeVal.textContent = `${emojiSizeEl.value}px`;
    updatePreview();
  };

  function getActiveStyle() {
    return document.querySelector('.style-btn.active')?.dataset.style ?? 'left';
  }

  function updatePreview() {
    const accent = accentPicker.value;
    const bg = bgPicker.value;
    const style = getActiveStyle();
    const size = emojiSizeEl.value;
    const previewEmoji = emojiList[0] ?? '👍';

    let s = `border-radius:8px; padding:14px 18px; background:${bg}; display:inline-block; max-width:380px;`;
    style === "left" && (s += ` border-left:4px solid ${accent};`);
    style === "full" && (s += ` border:2px solid ${accent};`);
    style === "bubble" && (s += ` border-radius:18px; border:2px solid ${accent};`);

    const block = document.createElement('div');
    block.setAttribute('style', s);

    const label = document.createElement('div');
    label.setAttribute('style', 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; font-size:13px; color:#6B7280; margin:0 0 8px 0;');

    const strong = document.createElement('strong');
    strong.setAttribute('style', 'color:#1A1B2E;');
    strong.textContent = t('previewSenderName');

    label.append(strong, ` ${t('reactMessage')}`);

    const emojiDiv = document.createElement('div');
    emojiDiv.setAttribute('style', `font-size:${size}px; line-height:1.2;`);
    emojiDiv.textContent = previewEmoji;

    block.append(label, emojiDiv);
    livePreview.replaceChildren(block);
  }

  updatePreview();

  saveBtn.onclick = async () => {
    await messenger.storage.local.set({
      emojis: emojiList.join(" "),
      autoSend: autoSendCb.checked,
      defaultReplyAll: defaultReplyAllCb.checked,
      defaultSignature: defaultSignatureCb.checked,
      accentColor: accentPicker.value,
      bgColor: bgPicker.value,
      borderStyle: getActiveStyle(),
      emojiSize: emojiSizeEl.value,
    });

    statusEl.classList.add('visible');
    setTimeout(() => statusEl.classList.remove('visible'), 2500);
  };
});
