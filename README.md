# Sony ZV-E10 Photobooth App 📸

Aplikasi Photobooth profesional yang dirancang khusus untuk kamera **Sony ZV-E10**. Dibangun dengan arsitektur modern menggunakan Electron, Next.js, dan Node.js untuk memberikan pengalaman yang mulus, cepat, dan premium.

---

## ✨ Fitur Utama
- **UI/UX Premium**: Antarmuka modern dengan tema *Glassmorphism* dan animasi *Framer Motion*.
- **Integrasi Hardware**: Kontrol penuh kamera Sony ZV-E10 via USB menggunakan `gphoto2`.
- **Pengolahan Gambar Instan**: Otomatis menempelkan frame/overlay ke foto menggunakan `sharp`.
- **Berbagi via QR Code**: Pengunjung dapat scan QR Code untuk mengunduh foto langsung ke HP via WiFi lokal.
- **Mode Kiosk**: Berjalan full-screen tanpa border/taskbar (ideal untuk event publik).
- **Auto IP Detection**: Otomatis mendeteksi IP lokal untuk kemudahan akses download.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Socket.io (Real-time communication).
- **Desktop Shell**: Electron (Kiosk Mode).
- **Image Processing**: Sharp.
- **Camera Control**: GPhoto2 (CLI-based).

---

## 📋 Persyaratan Sistem & Hardware

### Hardware:
1. **Kamera**: Sony ZV-E10 (atau kamera Sony lainnya yang mendukung PC Remote).
2. **Kabel**: USB-C to USB-A/C (berkualitas tinggi).
3. **PC/Laptop**: Linux (disarankan Ubuntu/Debian) atau MacOS/Windows (perlu penyesuaian driver gphoto2).

### Software (Linux):
Pastikan `gphoto2` terinstal di sistem Anda:
```bash
sudo apt update && sudo apt install -y gphoto2
```

---

## 🚀 Instalasi & Persiapan

1. **Clone & Install Dependencies**:
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd client && npm install
   cd ..
   ```

2. **Konfigurasi Kamera**:
   - Nyalakan kamera.
   - Masuk ke **Menu** -> **Network** -> **PC Remote Function**.
   - Set **PC Remote**: `On`.
   - Set **PC Remote Connect Method**: `USB`.

3. **Konfigurasi Environment**:
   Cek file `.env` di root dan `.env.local` di folder `client` untuk memastikan port dan URL sudah sesuai (default sudah dikonfigurasi).

---

## 💻 Cara Menjalankan

### Mode Pengembangan (Dev):
Jalankan backend dan frontend secara simultan tanpa Electron (buka di browser `localhost:3000`):
```bash
npm run dev
```

### Mode Aplikasi (Kiosk):
Jalankan seluruh sistem sebagai aplikasi desktop full-screen:
```bash
npm run app
```

---

## 🎨 Kustomisasi Frame/Overlay
Anda dapat mengganti bingkai foto dengan desain Anda sendiri:
1. Siapkan file PNG transparan berukuran **1920x1280**.
2. Simpan di `client/public/assets/frame.png`.
3. Restart aplikasi.

---

## 📁 Struktur Folder
- `main.js`: Logika utama Electron (Window management).
- `server.js`: API Server & WebSocket hub.
- `services/`:
  - `cameraService.js`: Modul komunikasi hardware kamera.
  - `imageProcessor.js`: Modul manipulasi gambar & overlay.
- `client/`: Source code Next.js (Frontend).
- `photos/`: 
  - `raw/`: Foto asli dari kamera.
  - `ready/`: Foto final yang sudah ber-frame.

---

## ⚠️ Troubleshooting
- **Kamera tidak terdeteksi**: Pastikan kabel USB terhubung dengan baik dan kamera dalam mode **PC Remote**. Coba jalankan `gphoto2 --auto-detect` di terminal.
- **QR Code tidak bisa di-scan**: Pastikan HP pengunjung terhubung ke jaringan **WiFi yang sama** dengan PC Photobooth.
- **Keluar dari Kiosk Mode**: Tekan `ALT + F4` atau `CTRL + C` di terminal tempat Anda menjalankan perintah.

---
*Vibe Coding with Antigravity.*
