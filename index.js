process.on('uncaughtException', console.error);

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
const chalk = require('chalk'); // Import chalk for colored output
const fs = require('fs'); // Import fs for file system operations

const settings = getSettings();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

async function WAStart() {
  const { state, saveCreds } = await useMultiFileAuthState("./sesi");
  const { version, isLatest } = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
  console.log(`menggunakan WA v${version.join(".")}, isLatest: ${isLatest}`);

  const client = WAConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // Set to false to prevent QR code from appearing in terminal
    browser: Browsers.ubuntu("Chrome"),
    auth: state,
  });

  store.bind(client.ev);

  if (!client.authState.creds.registered) {
    const phoneNumber = await question(`Silahkan masukin nomor Whatsapp kamu (contoh: 628xxxxxxxx): `);
    let code = await client.requestPairingCode(phoneNumber);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    console.log(chalk.green(`⚠︎ Kode Whatsapp kamu : `) + chalk.yellow(code));
    console.log(chalk.blue('\nCara memasukkan kode pairing ke WhatsApp:'));
    console.log(chalk.blue('1. Buka aplikasi WhatsApp di ponsel Anda.'));
    console.log(chalk.blue('2. Pergi ke Pengaturan > Perangkat Tertaut.'));
    console.log(chalk.blue('3. Ketuk "Tautkan Perangkat".'));
    console.log(chalk.blue('4. Masukkan kode pairing yang ditampilkan di atas.'));
    console.log(chalk.blue('----------------------------------------'));
  }

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.badSession) {
        console.log(`File Sesi Salah, Menghapus Sesi dan Memulai Ulang...`);
        fs.rmSync("./sesi", { recursive: true, force: true });
        WAStart();
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

      // Hapus panggilan ke handleIncomingMessage dari antibot
    } catch (err) {
      if (err.message.includes('Timed Out')) {
        console.log('Error: Timed Out. Mencoba kembali...');
        WAStart();
      } else {
        console.log(err);
      }
    }
  });

  return client;
}

WAStart();