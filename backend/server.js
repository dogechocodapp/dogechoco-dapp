// --- CÓDIGO FINAL Y DEFINITIVO v5 para backend/server.js (con manejo explícito de preflight) ---

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

// --- ESTE ES EL CAMBIO MÁS IMPORTANTE ---
const whitelist = ['https://dogechoco.xyz', 'https://www.dogechoco.xyz'];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    }
};
// Usamos la configuración avanzada de CORS
app.use(cors(corsOptions));
// AÑADIMOS UN MANEJADOR EXPLÍCITO PARA LAS PETICIONES PREFLIGHT (OPTIONS)
app.options('*', cors(corsOptions));
// ------------------------------------

app.use(express.json());

// El resto del código es exactamente el mismo...

app.post('/api/message', async (req, res) => {
    // ...código sin cambios
});

app.post('/admin/get-messages', async (req, res) => {
    // ...código sin cambios
});

app.post('/admin/download-messages', async (req, res) => {
    // ...código sin cambios
});

// Vercel no usa app.listen, exportamos la app
initializeDatabase();
module.exports = app;

async function initializeDatabase() {
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
        console.log("✅ Tabla 'messages' en Vercel Postgres está lista.");
    } catch (err) {
        console.error("!! Error al crear la tabla en Vercel Postgres:", err);
    }
}