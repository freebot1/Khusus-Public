const { isOwner, isAdmin, isBotAdmin, isSentByBot } = require('./utils'); // Asumsi ada utilitas untuk cek kondisi ini
const { getSettings } = require('./settings'); // Import settings

const settings = getSettings();

async function handleIncomingMessage(client, message) {
  if (!settings.antibot.enabled) return;

  const sender = message.sender;
  const isGroupMessage = message.isGroup;

  if (isOwner(sender) || (isGroupMessage && isAdmin(sender))) return;
  if (!isBotAdmin()) {
    if (isSentByBot(message) && !isAdmin(sender)) {
      await respondBeforeKick(client, message, "Bot yang bukan admin tidak diizinkan di grup ini. Anda akan dikeluarkan. 🙏");
      kickUser(sender);
    }
    return;
  }
  if (isSentByBot(message) && sender !== 'bot_id') {
    await respondBeforeKick(client, message, "Maaf, bot tidak diizinkan di grup ini. Anda akan dikeluarkan. 🙏");
    kickUser(sender);
  }
}

async function respondBeforeKick(client, message, response) {
  const chatId = message.key.remoteJid;
  await client.sendMessage(chatId, { text: response });
}

function kickUser(userId) {
  // Implementasi untuk mengekick user dari grup
  console.log(`User ${userId} telah dikeluarkan dari grup.`);
}

module.exports = {
  handleIncomingMessage
};
