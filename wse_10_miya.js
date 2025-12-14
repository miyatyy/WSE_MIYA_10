// wse_10_miya.js

require('dotenv').config(); // Memuat variabel dari .env
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

app.use(express.json()); // Middleware untuk parsing JSON body

// --- 2. SKEMA DATA ---

// Skema Pengguna untuk Simulasi Login dan Role
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Dalam praktik nyata harus di-hash
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
});
const User = mongoose.model('User', UserSchema);

// Skema Data Sensitif/Privat (yang akan diakses setelah login)
const DataSchema = new mongoose.Schema({
    judul: String,
    konten: String,
    pemilik: String
});
const Data = mongoose.model('Data', DataSchema);

// --- 7. FUNGSI INISIALISASI DATA ---
async function initializeData() {
    // Tambahkan pengguna default jika belum ada
    if (await User.countDocuments() === 0) {
        await User.create([
            { username: 'admin_miya', password: '321', role: 'admin' }, // Password disimulasikan sebagai '123'
            { username: 'user_layla', password: '123', role: 'user' }
        ]);
        console.log('📦 Default users (admin_miya, user_layla) created.');
    }
    // Tambahkan data privat default
    if (await Data.countDocuments() === 0) {
        await Data.create([
            { judul: 'Laporan Keuangan Q1', konten: 'Data keuangan sangat sensitif.', pemilik: 'admin_miya' },
            { judul: 'Rencana Pelatihan Baru', konten: 'Jadwal dan materi pelatihan tim.', pemilik: 'user_layla' }
        ]);
        console.log('📦 Default private data created.');
    }
}


// --- 3. MIDDLEWARE KEAMANAN ---

// Middleware untuk validasi API Key (Akses Publik)
const verifyApiKey = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey) {
        return res.status(401).json({ success: false, message: "Akses Ditolak. API Key tidak disediakan." });
    }

    // Periksa apakah API Key yang diberikan valid
    if (apiKey !== process.env.VALID_API_KEY) {
        return res.status(403).json({ success: false, message: "Akses Ditolak. API Key tidak valid." });
    }

    next();
};

// Middleware untuk validasi JWT (Akses Privat)
const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "Akses Ditolak. Token JWT tidak ditemukan." });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: "Token tidak valid atau kadaluarsa." });
    }
};

// Middleware untuk Otorisasi Berbasis Peran
const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: `Akses Ditolak. Diperlukan peran: ${roles.join(' atau ')}.` });
    }
    next();
};

// --- 4. ENDPOINT OTENTIKASI (Simulasi OAuth 2.0 / Login) ---

// Endpoint Login (Token Grant)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username, password }); 

    if (!user) {
        return res.status(400).json({ success: false, message: "Username atau Password salah." });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } 
    );

    res.status(200).json({ 
        success: true, 
        message: "Login berhasil. Gunakan Access Token ini untuk /private",
        token: token,
        role: user.role
    });
});


// --- 5. ENDPOINT AKSES PUBLIK (API Key) ---

// Endpoint Baca Publik (GET /public) - Memerlukan API Key
app.get('/public', verifyApiKey, async (req, res) => {
    const data = await Data.find().select('judul konten');
    res.status(200).json({ 
        success: true, 
        message: "Akses Publik Berhasil (Read-Only) menggunakan API Key.",
        data: data 
    });
});


// --- 6. ENDPOINT AKSES PRIVAT (JWT & CRUD) ---

// Endpoint CREATE (POST /private) - Memerlukan JWT (Role: user/admin)
app.post('/private', verifyToken, async (req, res) => {
    const { judul, konten } = req.body;
    try {
        const newData = new Data({ judul, konten, pemilik: req.user.username });
        await newData.save();
        res.status(201).json({ success: true, message: "Data berhasil dibuat (CREATE).", data: newData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal membuat data.", error });
    }
});

// Endpoint READ ALL (GET /private) - Memerlukan JWT (Role: user/admin)
app.get('/private', verifyToken, async (req, res) => {
    const data = await Data.find();
    res.status(200).json({ 
        success: true, 
        message: "Akses Privat Berhasil (Read All) menggunakan JWT.", 
        data: data 
    });
});

// Endpoint DELETE (DELETE /private/:id) - Memerlukan JWT + Role Admin
app.delete('/private/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    const dataId = req.params.id;
    const result = await Data.findByIdAndDelete(dataId);
    
    if (!result) {
        return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
    }
    
    res.status(200).json({ success: true, message: "Data berhasil dihapus (DELETE) oleh Admin.", data: result });
});


// --- 1. KONEKSI MONGODB ATLAS & INISIALISASI (BAGIAN YANG DIPERBAIKI) ---
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB Atlas');
        
        // Tunggu (await) inisialisasi data selesai sebelum server berjalan
        await initializeData(); 
        
        // --- 7. Jalankan Server (DIPINDAHKAN KE SINI) ---
        app.listen(port, () => {
            console.log(`🚀 WSE Secure Server berjalan di http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });


// Endpoint UPDATE (PUT /private/:id) - Memerlukan JWT (Role: user/admin)
// Endpoint UPDATE (PUT /private/:id) - FIXED ERROR HANDLING
app.put('/private/:id', verifyToken, async (req, res) => {
    const dataId = req.params.id;
    const { judul, konten } = req.body;
    
    const updateFields = { judul, konten };

    try {
        const result = await Data.findByIdAndUpdate(
            dataId, 
            updateFields, 
            { new: true }
        );

        // 1. Penanganan ID Tidak Ditemukan (404)
        if (!result) {
            return res.status(404).json({ success: false, message: `Data dengan ID ${dataId} tidak ditemukan.` });
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Data berhasil diperbarui (UPDATE).", 
            data: result 
        });
    } catch (error) {
        // 2. Penanganan Format ID Tidak Valid (CastError) -> 400 Bad Request
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Format ID yang diberikan tidak valid.",
                details: error.message
            });
        }
        
        // 3. Penanganan Error Server Lainnya (500)
        res.status(500).json({ success: false, message: "Terjadi kesalahan internal saat memperbarui data.", error });
    }
});