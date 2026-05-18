# Sony ZV-E10 Photobooth App 📸

Aplikasi Photobooth profesional yang dirancang khusus untuk kamera **Sony ZV-E10**. Dibangun dengan arsitektur modern menggunakan Electron, Next.js, dan Node.js untuk memberikan pengalaman yang mulus, cepat, dan premium.

---

## ✨ Fitur Utama
- **UI/UX Premium**: Antarmuka modern dengan tema *Glassmorphism* dan animasi *Framer Motion*.
- **Integrasi Hardware**: Kontrol penuh kamera Sony ZV-E10 via USB menggunakan `gphoto2`.
- **Pengolahan Gambar Instan**: Otomatis menempelkan frame/overlay ke foto menggunakan `sharp`.
- **Berbagi via QR & Cloud Storage**: Pengunjung dapat scan QR Code untuk mengunduh foto via internet seluler dengan integrasi cloud storage.
- **Hybrid & Fallback Mechanism**: Jika koneksi cloud storage terganggu, QR Code otomatis beralih menggunakan server lokal agar sesi tetap aman.
- **Mode Kiosk**: Berjalan full-screen tanpa border/taskbar (ideal untuk event publik).
- **Auto IP Detection**: Otomatis mendeteksi IP lokal untuk kemudahan akses download.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Socket.io (Real-time communication).
- **Desktop Shell**: Electron (Kiosk Mode).
- **Image Processing**: Sharp.
- **Camera Control**: GPhoto2 (CLI-based).
- **Cloud Storage**: AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`).

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

## ☁️ Integrasi Cloud Storage (AWS S3 / Cloudflare R2)
Aplikasi mendukung penyimpanan cloud untuk hasil foto akhir. Ini memungkinkan pengunjung mengunduh hasil foto dari jaringan data seluler mereka tanpa harus berada di jaringan WiFi lokal yang sama.

Untuk mengaktifkannya, perbarui file `.env` di root folder:

```ini
CLOUD_STORAGE_ENABLED=true
CLOUD_STORAGE_PROVIDER=r2          # 's3' atau 'r2'
STORAGE_ACCESS_KEY_ID=your_id
STORAGE_SECRET_ACCESS_KEY=your_secret
STORAGE_BUCKET_NAME=your_bucket_name
STORAGE_REGION=auto                # atau us-east-1 untuk AWS S3
STORAGE_ENDPOINT=https://...       # Diperlukan untuk Cloudflare R2
STORAGE_PUBLIC_URL=https://...     # Opsional: CDN kustom / domain R2 publik
STORAGE_URL_EXPIRATION_SECONDS=86400 # Masa berlaku Pre-signed URL (24 jam)
```

Jika dinonaktifkan (`CLOUD_STORAGE_ENABLED=false`), tautan unduhan dan QR Code secara otomatis akan dialihkan kembali menggunakan IP lokal computer.

---

## 📁 Struktur Folder
- `main.js`: Logika utama Electron (Window management).
- `server.js`: API Server & WebSocket hub.
- `services/`:
  - `cameraService.js`: Modul komunikasi hardware kamera.
  - `imageProcessor.js`: Modul manipulasi gambar & overlay.
  - `storageService.js`: Modul integrasi upload AWS S3 / Cloudflare R2.
- `client/`: Source code Next.js (Frontend).
- `photos/`: 
  - `raw/`: Foto asli dari kamera.
  - `ready/`: Foto final yang sudah ber-frame.

---

## ⚠️ Troubleshooting
- **Kamera tidak terdeteksi**: Pastikan kabel USB terhubung dengan baik dan kamera dalam mode **PC Remote**. Coba jalankan `gphoto2 --auto-detect` di terminal.
- **QR Code tidak bisa di-scan**: 
  - Jika Cloud Storage **dinonaktifkan** (atau internet putus): HP pengunjung wajib terhubung ke jaringan **WiFi lokal yang sama** dengan PC Photobooth.
  - Jika Cloud Storage **diaktifkan**: Pastikan PC memiliki koneksi internet aktif untuk mengunggah foto ke R2/S3.
- **Keluar dari Kiosk Mode**: Tekan `ALT + F4` atau `CTRL + C` di terminal tempat Anda menjalankan perintah.

---
*Vibe Coding with Antigravity.*
