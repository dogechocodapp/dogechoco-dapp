// Contenido COMPLETO y ACTUALIZADO para backend/server.js

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Importamos el módulo 'path'

const app = express();
const PORT = 3001;
const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'messages.json'); // Ruta absoluta al archivo

const readMessages = () => {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

const writeMessages = (messages) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
};

// --- RUTA #1: Recibir mensajes de usuarios (sin cambios) ---
app.post('/api/message', (req, res) => {
    // ... (Esta parte del código se queda exactamente igual)
    const { message, signature, address } = req.body;
    if (!message || !signature || !address) return res.status(400).json({ error: 'Faltan datos.' });
    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            const messages = readMessages();
            messages.push({ address, message, signature, timestamp: new Date().toISOString() });
            writeMessages(messages);
            res.status(201).json({ success: true, message: 'Mensaje recibido.' });
        } else {
            res.status(401).json({ error: 'Firma inválida.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// --- RUTA #2: Ver los mensajes como admin (sin cambios) ---
app.post('/admin/get-messages', (req, res) => {
    // ... (Esta parte del código se queda exactamente igual)
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            console.log(`✅ Acceso de administrador concedido a ${address}`);
            const messages = readMessages();
            res.json(messages);
        } else {
            res.status(403).json({ error: 'Firma de administrador inválida.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno al verificar firma de admin.' });
    }
});


// --- RUTA #3: La "Puerta Secreta" para DESCARGAR los mensajes ---
app.post('/admin/download-messages', (req, res) => {
    const { address, signature } = req.body;

    // 1. Usamos la misma lógica de seguridad que para ver los mensajes
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);

        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            // ¡Éxito! La firma es del administrador.
            console.log(`✅ Solicitud de descarga autorizada para ${address}`);
            
            // 2. En lugar de enviar un JSON, le decimos al navegador que descargue el archivo.
            // Express.js hace esto muy fácil con res.download()
            res.download(DB_FILE, 'DOGECHOCO-messages.json', (err) => {
                if (err) {
                    console.error("Error al enviar el archivo:", err);
                }
            });
        } else {
            res.status(403).json({ error: 'Firma de administrador inválida.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno al verificar firma de admin.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor DOGECHOCO escuchando en http://localhost:${PORT}`);
    console.log(`🔑 Wallet de Administrador configurada: ${ADMIN_WALLET_ADDRESS}`);
});