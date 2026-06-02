document.addEventListener('DOMContentLoaded', async () => {
  const { emojis = "👍 🙃 😀 ❤️ 👌 🙏" } = await messenger.storage.local.get("emojis");
  const container = document.getElementById('container');
  
  emojis.split(" ").filter(e => e.trim()).forEach(emoji => {
    const btn = document.createElement('button');
    btn.textContent = emoji;
    btn.onclick = () => {
      messenger.runtime.sendMessage({ action: "sendReaction", reaction: emoji });
      window.close();
    };
    container.appendChild(btn);
  });
});
