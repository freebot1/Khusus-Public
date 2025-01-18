process.on('uncaughtException', console.error)
const {
  default: WAConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  Browsers, 
  fetchLatestWaWebVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require('readline');
const { Boom } = require("@hapi/boom");
const { getRandomEmoji } = require('./EmojisRandom'); // Import from EmojisRandom.js
const { startAutoTyping, startAutoRecording } = require('./Auto_typing_record'); // Import auto typing and recording
const { startAutoOnline } = require('./Auto_online_24jam'); // Import auto online

const pairingCode = process.argv.includes("--pairing-code");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });


async function WAStart() {
  const { state, saveCreds } = await useMultiFileAuthState("./sesi");
  const { version, isLatest } = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
  console.log(`menggunakan WA v${version.join(".")}, isLatest: ${isLatest}`);

  const client = WAConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !pairingCode,
    browser: Browsers.ubuntu("Chrome"),
    auth: state,
  });

  store.bind(client.ev);

  if (pairingCode && !client.authState.creds.registered) {
    const phoneNumber = await question(`Silahkan masukin nomor Whatsapp kamu: `);
    let code = await client.requestPairingCode(phoneNumber);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    console.log(`⚠︎ Kode Whatsapp kamu : ` + code)
  }

  startAutoTyping(client);
  startAutoRecording(client);
  startAutoOnline(client);

  client.ev.on("messages.upsert", async (chatUpdate) => {
    //console.log(JSON.stringify(chatUpdate, undefined, 2))
    try {
      const m = chatUpdate.messages[0];
      if (!m.message) return;
      
      const chatId = m.key.remoteJid;

      if (m.key && !m.key.fromMe) {
        startAutoTyping(client, chatId);
        startAutoRecording(client, chatId);
      }

      const maxTime = 1000; // 1 detik

      if (m.key && !m.key.fromMe && m.key.remoteJid === 'status@broadcast') {
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
    } catch (err) {
      console.log(err);
    }
  });
  

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
      if (connection === "close") {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
        if (reason === DisconnectReason.badSession) {
          console.log(`File Sesi Salah, Silahkan Hapus Sesi dan Pindai Lagi`);
          process.exit();
        } else if (reason === DisconnectReason.connectionClosed) {
          console.log("Koneksi tertutup, menyambung kembali....");
          WAStart();
        } else if (reason === DisconnectReason.connectionLost) {
          console.log("Koneksi Hilang dari Server, menyambung kembali...");
          WAStart();
        } else if (reason === DisconnectReason.connectionReplaced) {
          console.log("Koneksi Diganti, Sesi Baru Dibuka, Silahkan Mulai Ulang Bot");
          process.exit();
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(`Perangkat Keluar, Silahkan Hapus Folder Sesi dan Pindai Lagi.`);
          process.exit();
        } else if (reason === DisconnectReason.restartRequired) {
          console.log("Mulai Ulang Diperlukan, Memulai Ulang...");
          WAStart();
        } else if (reason === DisconnectReason.timedOut) {
          console.log("Koneksi Timeout, Menyambung Kembali...");
          WAStart();
        } else {
          console.log(`Alasan Putus Koneksi Tidak Diketahui: ${reason}|${connection}`);
          WAStart();
        }
      } else if (connection === "open") {
      console.log("Terhubung ke Readsw");
    }
  });

  client.ev.on("creds.update", saveCreds);

  return client;
}

WAStart();