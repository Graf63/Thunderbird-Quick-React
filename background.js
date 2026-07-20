messenger.runtime.onMessage.addListener((request) => {
  if (request.action !== "sendReaction") return;

  (async () => {
    try {
      const [{ id: tabId }] = await messenger.tabs.query({ active: true, currentWindow: true });

      const displayed = await messenger.messageDisplay.getDisplayedMessages(tabId);
      const message = displayed?.messages?.[0] ?? displayed?.[0];
      if (!message) return;

      const account = await messenger.accounts.get(message.folder.accountId);
      const { name, email, id: identityId } = account?.identities?.[0] ?? {};

      // Détermine dynamiquement le type de réponse
      const replyType = request.replyAll ? "replyToAll" : "replyToSender";

      const composeTab = await messenger.compose.beginReply(
        message.id,
        replyType,
        identityId ? { identityId } : {}
      );

      const { body } = await messenger.compose.getComposeDetails(composeTab.id);

      const i18nReact = messenger.i18n.getMessage("reactMessage") || "";
      const displayName = name ?? email ?? '';

      const {
        accentColor = "#5B4FD9",
        bgColor = "#F4F3FF",
        borderStyle = "left",
        emojiSize = "32",
        autoSend = false
      } = await messenger.storage.local.get([
        "accentColor", "bgColor", "borderStyle", "emojiSize", "autoSend"
      ]);

      let tableStyle = `border-radius:8px; padding:14px 18px; display:inline-block; max-width:420px; background:${bgColor};`;
      borderStyle === "left" && (tableStyle += ` border-left:4px solid ${accentColor};`);
      borderStyle === "full" && (tableStyle += ` border:2px solid ${accentColor};`);
      borderStyle === "bubble" && (tableStyle += ` border-radius:18px; border:2px solid ${accentColor};`);

      // 1. Structure HTML strictement statique (aucune variable dynamique)
      const staticHTML = `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px 0;">
  <tr>
    <td style="padding:0;">
      <table id="react-inner" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; font-size:13px; color:#6B7280; margin:0 0 8px 0;">
              <strong id="react-name" style="color:#1A1B2E;"></strong><span id="react-msg"></span>
            </div>
            <div id="react-emoji" style="line-height:1.2;"></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();

      const parser = new DOMParser();
      const reactDoc = parser.parseFromString(staticHTML, "text/html");

      // 2. Injection sécurisée des variables via l'API DOM
      reactDoc.getElementById("react-inner").setAttribute("style", tableStyle);
      reactDoc.getElementById("react-name").textContent = displayName;
      reactDoc.getElementById("react-msg").textContent = ` ${i18nReact}`;
      reactDoc.getElementById("react-emoji").setAttribute("style", `font-size:${emojiSize}px; line-height:1.2;`);
      reactDoc.getElementById("react-emoji").textContent = request.reaction;

      // 3. Insertion du bloc dans le corps de l'email
      const doc = parser.parseFromString(body, "text/html");
      doc.body.prepend(reactDoc.body.firstChild);

      await messenger.compose.setComposeDetails(composeTab.id, {
        body: `<!DOCTYPE html>${doc.documentElement.outerHTML}`
      });

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
