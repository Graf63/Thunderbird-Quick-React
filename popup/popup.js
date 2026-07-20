document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = messenger.i18n.getMessage(el.dataset.i18n) || el.textContent;
  });

  const { emojis = "👍 🙃 😀 ❤️ 👌 🙏" } = await messenger.storage.local.get("emojis");
  const container = document.getElementById('container');
  const replyAllContainer = document.getElementById('replyAllContainer');
  const replyAllCb = document.getElementById('replyAllCb');

  try {
    const [{ id: tabId }] = await messenger.tabs.query({ active: true, currentWindow: true });
    const displayed = await messenger.messageDisplay.getDisplayedMessages(tabId);
    const message = displayed?.messages?.[0] ?? displayed?.[0];

    // Afficher l'option uniquement s'il y a plus d'un destinataire (To + Cc)
    if (message && ((message.recipients?.length ?? 0) + (message.ccList?.length ?? 0) > 1)) {
      replyAllContainer.style.display = 'block';
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
        replyAll: replyAllCb.checked
      }).catch(() => { });
      window.close();
    };
    container.appendChild(btn);
  });
});
