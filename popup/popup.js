document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = messenger.i18n.getMessage(el.dataset.i18n) || el.textContent;
  });

  const { emojis = "👍 🙃 😀 ❤️ 👌 🙏", defaultReplyAll = false, defaultSignature = true } = await messenger.storage.local.get(["emojis", "defaultReplyAll", "defaultSignature"]);

  const container = document.getElementById('container');
  const replyAllWrapper = document.getElementById('replyAllWrapper');
  const replyAllCb = document.getElementById('replyAllCb');
  const signatureCb = document.getElementById('signatureCb');

  replyAllCb.checked = defaultReplyAll;
  signatureCb.checked = defaultSignature;

  try {
    const [{ id: tabId }] = await messenger.tabs.query({ active: true, currentWindow: true });

    // Correction de l'API pour Thunderbird >= 115
    const displayed = await messenger.messageDisplay.getDisplayedMessages(tabId);
    const message = displayed?.messages?.[0] ?? displayed?.[0];

    if (message && ((message.recipients?.length ?? 0) + (message.ccList?.length ?? 0) > 1)) {
      replyAllWrapper.style.display = 'flex';
    }
  } catch (error) {
    console.error(error);
  }

  emojis.split(" ").filter(e => e.trim()).forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.onclick = () => {
      messenger.runtime.sendMessage({
        action: "sendReaction",
        reaction: emoji,
        replyAll: replyAllCb.checked,
        includeSignature: signatureCb.checked
      }).catch(() => { });
      window.close();
    };
    container.append(btn);
  });
});
