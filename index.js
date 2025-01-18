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
const { getRandomEmoji, handleStatusReaction } = require('./EmojisRandom'); // Import from EmojisRandom.js
const { startAutoTyping, startAutoRecording } = require('./Auto_typing_record'); // Import auto typing and recording
const { getSettings } = require('./settings'); // Import settings
const { execSync } = require('child_process');

const settings = getSettings();
const pairingCode = process.argv.includes("--pairing-code");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

// Fungsi untuk memeriksa dan memperbarui dependensi
async function updateDependencies() {
  if (settings.dependencyUpdate.enabled) {
    try {
      const line = '='.repeat(50);
      console.log(line);
      console.log('🔍 Memeriksa dan memperbarui dependensi...');
      console.log(line);
      
      // Langsung jalankan npm install untuk memperbarui dependensi
      execSync('npm install', { stdio: 'inherit' });
      
      console.log(line);
      console.log('✅ Dependensi berhasil diperbarui.');
      console.log(line);
    } catch (error) {
      const line = '='.repeat(50);
      if (error.code === 'ENOENT') {
        console.error(line);
        console.error('❌ Gagal memperbarui dependensi: File atau direktori tidak ditemukan.');
        console.error(line);
      } else {
        console.error(line);
        console.error('❌ Gagal memperbarui dependensi:', error);
        console.error(line);
      }
    }
  }
}

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

      await handleStatusReaction(client, m, maxTime);

    } catch (err) {
      console.log(err);
    }
  });

  if (settings.dependencyUpdate.enabled) {
    await updateDependencies();
  }

  return client;
}

WAStart();