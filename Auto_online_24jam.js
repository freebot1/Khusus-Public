const { getConfig } = require('./config'); // Import config

const config = getConfig();

async function startAutoOnline(client) {
  if (!config.autoOnline.enabled) {
    try {
      const lastSeen = new Date(Date.now() - 3600000); // 1 hour ago
      await client.sendPresenceUpdate('unavailable', { lastSeen });
      console.log('Bot terlihat online 1 jam yang lalu');
    } catch (error) {
      console.error('Error in setting last seen:', error);
    }
    return;
  }

  setInterval(async () => {
    try {
      await client.sendPresenceUpdate('available');
    } catch (error) {
      console.error('Error in auto online:', error);
    }
  }, 30000); // Update presence every 30 seconds
}

module.exports = {
  startAutoOnline
};
