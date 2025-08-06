// --- CÓDIGO FINAL Y DEFINITIVO para backend/server.js (con Base de Datos Supabase) ---

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3001;
const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';

// El Pool se conecta a la base de datos usando la variable de entorno DATABASE_URL que configuramos en Render
// Esta URL ahora apunta a nuestra base de datos en Supabase
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors());
app.use(express.json());

// --- RUTA #1: Recibir y GUARDAR mensajes en la BASE DE DATOS ---
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

// --- RUTA #2: LEER los mensajes desde la BASE DE DATOS ---
app.post('/admin/get-messages', async (req, res) => {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            console.log(`✅ Acceso de administrador concedido a ${address}`);
            
            // Hemos cambiado el nombre de las columnas para que coincida con lo que espera el frontend
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

// La ruta de descarga también leerá de la base de datos
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


app.listen(PORT, () => {
    console.log(`🚀 Servidor DOGECHOCO escuchando en http://localhost:${PORT}`);
    pool.query('SELECT NOW()', (err, res) => {
        if (err) {
            console.error("!! Error de conexión con la base de datos de Supabase:", err);
        } else {
            console.log("✅ Conexión con la base de datos de Supabase establecida con éxito a las:", res.rows[0].now);
        }
    });
});