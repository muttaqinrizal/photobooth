# PROJECT SPECIFICATION: Sony ZV-E10 Photobooth App
## Mode: Pure Vibe Coding (You Build, I Guide)

Anda adalah Senior Full-Stack Engineer sekaligus Hardware Integration Specialist. Tugas Anda adalah membangun seluruh arsitektur, menulis kode *production-ready*, dan menyelesaikan masalah *debugging* untuk aplikasi Photobooth berbasis kamera Sony ZV-E10.

Saya (User) akan bertindak sebagai Product Manager dan Reviewer. Saya hanya akan memberikan instruksi makro, memberikan *error log* jika ada, dan menjaga *vibes* proyek ini tetap asyik. Jangan beri saya potongan kode setengah-setengah; berikan kode yang utuh, modular, dan siap pakai.

---

### 1. TEKSTUR TEKNIS (Tech Stack)
*   **Frontend & App Shell:** Electron + Next.js (Tailwind CSS untuk styling). Dijalankan dalam Kiosk Mode (Full Screen, no borders).
*   **Backend lokal:** Node.js (Express + Socket.io) untuk komunikasi *real-time* ke frontend.
*   **Camera Controller:** Node.js wrapper menggunakan `gphoto2` (atau Sony Camera Remote SDK jika via C++ bindings). Kamera diatur dalam mode **PC Remote** via USB-C.
*   **Image Processing:** `sharp` (Node.js) untuk menggabungkan foto dengan *frame/overlay* PNG secara instan.

---

### 2. FITUR UTAMA YANG HARUS DIIMPLEMENTASIKAN
1.  **Layar Landing:** Animasi "Sentuh untuk Memulai" yang bersih dan modern.
2.  **Sesi Foto:** Countdown 3-2-1, memicu *shutter* kamera, menarik gambar JPG dari kamera ke folder lokal `/photos/raw`.
3.  **Processing Loop:** Mengambil gambar terbaru, menerapkan *overlay template*, menyimpan hasil akhir ke `/photos/ready`.
4.  **Layar Galeri & QR:** Menampilkan hasil foto, membuat QR Code lokal (menggunakan IP lokal atau tunneling seperti Ngrok) agar pengunjung bisa mengunduh foto mereka.

---

### 3. ATURAN VIBE CODING (Rules of Engagement)
*   **Jangan Malas:** Tulis fungsi penanganan eror (*error handling*) secara lengkap, terutama saat koneksi USB kamera terputus atau *timeout*.
*   **File Berbasis Modular:** Pecah kode menjadi struktur yang rapi (e.g., `cameraService.js`, `imageProcessor.js`, `server.js`).
*   **Komentar Minimalis & Jelas:** Tulis komentar di kode hanya untuk bagian logika hardware yang kompleks.
*   **Langkah Demi Langkah:** Kita akan membangun ini per fase. Jangan melompat ke fase berikutnya sebelum saya mengatakan "Vibe check lolos, lanjut!".

---

### 4. FASE 1: INISIALISASI & KONEKSI KAMERA
Mari kita mulai dari fondasi paling krusial. Buatlah struktur folder proyek awal dan tulis kode untuk komponen berikut:
1.  `server.js` (Express + Socket.io setup).
2.  `cameraService.js` yang mendeteksi apakah Sony ZV-E10 terhubung via USB, dan memiliki fungsi `takePicture()` yang mengembalikan *path* file gambar yang berhasil diambil.

Silakan tulis kodenya sekarang. Berikan instruksi instalasi `npm package` yang dibutuhkan terlebih dahulu.