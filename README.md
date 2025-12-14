Nama File Server	wse_10_miya.js
Teknologi	Node.js, Express.js, Mongoose (MongoDB Atlas), JWT, dotenv
Fokus	Implementasi Middleware Keamanan Berlapis & Otorisasi Berbasis Peran.
Dosen Pengampu	Muhayat, M.IT

1. Deskripsi Proyek
Proyek ini adalah implementasi Web Service menggunakan Express.js untuk mensimulasikan mekanisme keamanan modern:

API Key: Untuk mengontrol akses publik (Read-Only) pada endpoint /public.

JSON Web Token (JWT): Untuk otentikasi (login) dan otorisasi akses privat (CRUD) pada endpoint /private.

Role-Based Access Control (RBAC): Menerapkan validasi peran (admin vs. user) pada operasi sensitif (DELETE).
2. Persyaratan & Instalasi
Pastikan Anda telah menginstal Node.js dan npm.
A. Instalasi Dependencies
Buka terminal di folder proyek Anda dan jalankan perintah:
npm install express mongoose jsonwebtoken dotenv cors
B. Konfigurasi Environment (.env)
Buat file bernama .env di root proyek dan isi dengan konfigurasi kredensial Anda. Ganti nilai placeholder dengan kredensial yang valid.
# .env

# Ganti dengan URI koneksi MongoDB Atlas Anda
MONGO_URI="mongodb+srv://[username]:[password]@[cluster-url]/wse10?retryWrites=true&w=majority"

# Kunci rahasia untuk menandatangani JWT (Harus Kuat)
JWT_SECRET="KunciRahasiaSuperAmanMilikMiya123"

# API Key yang valid untuk akses /public
VALID_API_KEY="KEY-WSE-MIYA-20251"
C. Menjalankan Server
Jalankan server Node.js dari terminal:
node wse_10_miya.js

Server akan berjalan di http://localhost:3000 dan akan menginisialisasi pengguna default (admin_miya, user_layla - password: 123) di MongoDB.

