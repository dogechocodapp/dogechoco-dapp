// --- CÓDIGO FINAL Y DEFINITIVO para backend/server.js ---

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors'); // <-- ¡AQUÍ ESTÁ LA LÍNEA IMPORTANTE!
const { Pool } = require('pg');

const app = express();
const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';

// Conexión a la base de datos de Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- MANEJO DE CORS (LA SOLUCIÓN CORRECTA) ---
const whitelist = ['https://dogechoco.xyz', 'https://www.dogechoco.xyz'];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true); // Permite la petición
        } else {
            callback(new Error('No permitido por CORS')); // Bloquea la petición
        }
    }
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Maneja peticiones "preflight"
// ------------------------------------

app.use(express.json());

const initializeDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(42) NOT NULL,
            message_text TEXT NOT NULL,
            signature TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(createTableQuery);
        console.log("✅ Tabla 'messages' en la base de datos está lista.");
    } catch (err) {
        console.error("!! Error al crear la tabla:", err);
    }
};

app.post('/api/message', async (req, res) => {
    console.log('Recibida una nueva petición de mensaje...');
    const { message, signature, address } = req.body;
    if (!message || !signature || !address) return res.status(400).json({ error: 'Faltan datos.' });
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            console.log('✅ Firma verificada con éxito.');
            const insertQuery = 'INSERT INTO messages(wallet_address, message_text, signature) VALUES($1, $2, $3)';
            const values = [address, message, signature];
            await pool.query(insertQuery, values);
            console.log('-> Mensaje guardado en la base de datos de Supabase.');
            res.status(201).json({ success: true, message: 'Mensaje recibido y guardado permanentemente.' });
        } else {
            res.status(401).json({ error: 'Firma inválida.' });
        }
    } catch (error) {
        console.error("!! ERROR en la ruta /api/message:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/admin/get-messages', async (req, res) => {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            console.log(`✅ Acceso de administrador concedido a ${address}`);
            const selectQuery = 'SELECT wallet_address AS address, message_text AS message, created_at AS timestamp FROM messages ORDER BY created_at DESC';
            const { rows } = await pool.query(selectQuery);
            res.json(rows);
        } else {
            res.status(403).json({ error: 'Firma de administrador inválida.' });
        }
    } catch (error) {
        console.error("!! Error en la ruta /admin/get-messages:", error);
        res.status(500).json({ error: 'Error interno al verificar firma de admin.' });
    }
});

app.post('/admin/download-messages', async (req, res) => {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            const selectQuery = 'SELECT * FROM messages ORDER BY created_at DESC';
            const { rows } = await pool.query(selectQuery);
            const jsonData = JSON.stringify(rows, null, 2);
            res.header('Content-Disposition', 'attachment; filename="DOGECHOCO-messages.json"');
            res.type('application/json');
            res.send(jsonData);
        } else {
            res.status(403).json({ error: 'Firma de administrador inválida.' });
        }
    } catch (error) {
        console.error("!! Error en la ruta /admin/download-messages:", error);
        res.status(500).json({ error: 'Error interno al verificar firma de admin.' });
    }
});

initializeDatabase();
module.exports = app;