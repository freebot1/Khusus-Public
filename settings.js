const settings = {
  autoTyping: {
    enabled: true,
    duration: 60000 // 1 minute
  },
  autoRecording: {
    enabled: true,
    duration: 60000 // 1 minute
  },
  autoOnline: {
    enabled: true
  }
};

function getSettings() {
  return settings;
}

module.exports = {
  getSettings
};
