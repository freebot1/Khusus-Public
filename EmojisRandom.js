// Owner: Wily Kun
// Recode: Wily Kun
// -------------------------------------------------------------------------
const emojis = ["😊", "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "🥰", "😂", "😇", "🙂", "🙃", "😉", "😍", "😙", "🤩", "😚", "😘", "☺️", "😗", "🤗", "😋", "🤑", "😛", "😝", "😜", "🤪", "🤭", "😑", "🤫", "😐", "🤔", "🤨", "🤐", "😌", "😶", "🤥", "😏", "😬", "😒", "🙄", "😔", "🤕", "😪", "🤒", "🤤", "😷", "😴", "😵", "🤢", "🥴", "🤮", "🥶", "🤧", "🥵", "🤯", "😕", "🏴"];

function getRandomEmoji() {
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
}

async function handleStatusReaction(client, m, maxTime) {
  if (m.key && !m.key.fromMe && m.key.participant) {
    if (!m.message.reactionMessage) {
      const allowedSenders = [
        "6281447345627@s.whatsapp.net",
        "628145563553@s.whatsapp.net",
      ];

      if (!allowedSenders.includes(m.key.participant)) {
        const currentTime = Date.now();
        const messageTime = m.messageTimestamp * 1000;
        const timeDiff = currentTime - messageTime;

        if (timeDiff <= maxTime) {
          const randomEmoji = getRandomEmoji();
          try {
            await client.sendMessage("status@broadcast", {
              react: { text: randomEmoji, key: m.key },
            }, { statusJidList: [m.key.participant] });

            await client.readMessages([m.key]);
            console.log(`Berhasil melihat status dari ${m.pushName}`);
          } catch (error) {
            console.error('Error', error);
          }
        }
      }
    }
  }
}

module.exports = {
  emojis,
  getRandomEmoji,
  handleStatusReaction
};
