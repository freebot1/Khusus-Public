const { default: WAConnect } = require("@whiskeysockets/baileys");
const pino = require("pino");
const { getSettings } = require('./settings'); // Import settings

const settings = getSettings();

async function startAutoTyping(client, chatId) {
  if (!settings.autoTyping.enabled) return;

  const duration = settings.autoTyping.duration || 60000; // Default to 1 minute

  setInterval(async () => {
    try {
      await client.sendPresenceUpdate('composing', chatId);
      console.log('Auto typing...');
    } catch (error) {
      console.error('Error in auto typing:', error);
    }
  }, duration);
}

async function startAutoRecording(client, chatId) {
  if (!settings.autoRecording.enabled) return;

  const duration = settings.autoRecording.duration || 60000; // Default to 1 minute

  setInterval(async () => {
    try {
      await client.sendPresenceUpdate('recording', chatId);
      console.log('Auto recording...');
    } catch (error) {
      console.error('Error in auto recording:', error);
    }
  }, duration);
}

module.exports = {
  startAutoTyping,
  startAutoRecording
};
