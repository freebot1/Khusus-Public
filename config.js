const config = {
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

function getConfig() {
  return config;
}

module.exports = {
  getConfig
};
