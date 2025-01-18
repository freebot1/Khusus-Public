// Owner: Wilykun
// -------------------------------------------------------------------------

// Pengaturan untuk fitur auto typing, auto recording, dan auto update dependencies
// -------------------------------------------------------------------------
const settings = {
  autoTyping: {
    enabled: true, // Mengaktifkan atau menonaktifkan fitur auto typing
    duration: 60000 // Durasi dalam milidetik (1 menit)
  },
  autoRecording: {
    enabled: false, // Mengaktifkan atau menonaktifkan fitur auto recording
    duration: 60000 // Durasi dalam milidetik (1 menit)
  },
  dependencyUpdate: {
    enabled: true // Mengaktifkan atau menonaktifkan fitur auto update dependencies
  }
};

// Fungsi untuk mendapatkan pengaturan
// -------------------------------------------------------------------------
function getSettings() {
  return settings;
}

// Penjelasan Fitur
// -------------------------------------------------------------------------
// autoTyping: Fitur ini akan membuat bot secara otomatis bila ada pesan baru di chat pribadi maupun di gc
// 'sedang mengetik' ke chat yang sedang aktif. Durasi dapat diatur sesuai
// kebutuhan dalam milidetik.
//
// autoRecording: Fitur ini akan membuat bot secara otomatis bila ada pesan baru di chat pribadi maupun di gc
// 'sedang merekam' ke chat yang sedang aktif. Durasi dapat diatur sesuai
// kebutuhan dalam milidetik.
//
// dependencyUpdate: Fitur ini akan membuat sistem secara otomatis memperbarui
// dependensi yang digunakan saat bot dijalankan.

// Ekspor modul
// -------------------------------------------------------------------------
module.exports = {
  getSettings
};
