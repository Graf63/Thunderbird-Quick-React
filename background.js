messenger.runtime.onMessage.addListener((request) => {
  if (request.action !== "sendReaction") return;

  (async () => {
    try {
      const [{ id: tabId }] = await messenger.tabs.query({ active: true, currentWindow: true });

      const displayed = await messenger.messageDisplay.getDisplayedMessages(tabId);
      const message = displayed?.messages?.[0] ?? displayed?.[0];
      if (!message) return;

      const account = await messenger.accounts.get(message.folder.accountId);
      const { name, email } = account?.identities?.[0] ?? {};

      const composeTab = await messenger.compose.beginReply(message.id, "replyToSender");
      const { body } = await messenger.compose.getComposeDetails(composeTab.id);

      // i18n: use the locale key; empty string fallback (never hardcode a language)
      const i18nReact = messenger.i18n.getMessage("reactMessage") || "";
      const displayName = name ?? email ?? '';

      // Load customisation settings with sensible defaults
      const {
        accentColor = "#5B4FD9",
        bgColor = "#F4F3FF",
        borderStyle = "left",
        emojiSize = "32",
      } = await messenger.storage.local.get([
        "accentColor", "bgColor", "borderStyle", "emojiSize"
      ]);

      let tableStyle = `border-radius:8px; padding:14px 18px; display:inline-block; max-width:420px; background:${bgColor};`;
      if (borderStyle === "left") tableStyle += ` border-left:4px solid ${accentColor};`;
      if (borderStyle === "full") tableStyle += ` border:2px solid ${accentColor};`;
      if (borderStyle === "bubble") tableStyle += ` border-radius:18px; border:2px solid ${accentColor};`;

      const reactionBlock = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
  <tr>
    <td style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" style="${tableStyle}">
        <tr>
          <td>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; color:#6B7280; margin:0 0 8px 0;">
              <strong style="color:#1A1B2E;">${displayName}</strong> ${i18nReact}
            </div>
            <div style="font-size:${emojiSize}px; line-height:1.2;">${request.reaction}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();

      await messenger.compose.setComposeDetails(composeTab.id, {
        body: `${reactionBlock}${body}`
      });

      const { autoSend = true } = await messenger.storage.local.get("autoSend");

      if (autoSend) {
        await new Promise(r => setTimeout(r, 500));
        await messenger.compose.sendMessage(composeTab.id, { mode: "sendNow" });
      }

    } catch (error) {
      console.error(error);
    }
  })();

  return true;
});