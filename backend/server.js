// Contenido FINAL y MEJORADO para backend/server.js

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
// Usaremos la versión de promesas de 'fs' para operaciones asíncronas
const fs = require('fs').promises; 
const path = require('path');

const app = express();
const PORT = 3001;
const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'messages.json');

// --- Funciones de lectura/escritura ASÍNCRONAS ---

const readMessages = async () => {
    try {
        // 'await' espera a que el archivo se lea antes de continuar
        const data = await fs.readFile(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe (error 'ENOENT'), es normal. Devolvemos una lista vacía.
        if (error.code === 'ENOENT') {
            return [];
        }
        // Si es otro tipo de error, lo mostramos.
        console.error("Error leyendo el archivo de mensajes:", error);
        throw error;
    }
};

const writeMessages = async (messages) => {
    console.log("-> Iniciando escritura de archivo...");
    try {
        // 'await' espera a que el archivo se escriba antes de continuar
        await fs.writeFile(DB_FILE, JSON.stringify(messages, null, 2));
        console.log("-> Escritura de archivo completada.");
    } catch (error) {
        console.error("!! ERROR DURANTE LA ESCRITURA DEL ARCHIVO:", error);
        throw error;
    }
};


// --- RUTA #1: Recibir mensajes de usuarios (ahora es 'async') ---
app.post('/api/message', async (req, res) => { // La declaramos async
    console.log('Recibida una nueva petición de mensaje...');
    const { message, signature, address } = req.body;

    if (!message || !signature || !address) {
        return res.status(400).json({ error: 'Faltan datos.' });
    }

    try {
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            console.log('✅ Firma verificada con éxito.');
            
            const messages = await readMessages();
            messages.push({ address, message, signature, timestamp: new Date().toISOString() });
            
            // Esperamos a que la escritura termine
            await writeMessages(messages);
            
            res.status(201).json({ success: true, message: 'Mensaje recibido y verificado.' });
        } else {
            res.status(401).json({ error: 'Firma inválida.' });
        }
    } catch (error) {
        console.error("!! ERROR en la ruta /api/message:", error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


// Las rutas de admin también se vuelven 'async' para usar la nueva función de lectura
app.post('/admin/get-messages', async (req, res) => {
    // ... (lógica de verificación de firma del admin sin cambios) ...
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            console.log(`✅ Acceso de administrador concedido a ${address}`);
            const messages = await readMessages(); // Usamos la nueva función async
            res.json(messages);
        } else {
            res.status(403).json({ error: 'Firma de administrador inválida.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error interno al verificar firma de admin.' });
    }
});

app.post('/admin/download-messages', (req, res) => {
    // ... (Esta ruta no necesita cambios, ya que usa res.download que maneja los archivos por su cuenta)
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: 'Falta la dirección o la firma.' });
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) return res.status(403).json({ error: 'Acceso denegado.' });
    const messageToVerify = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
    try {
        const recoveredAddress = ethers.verifyMessage(messageToVerify, signature);
        if (recoveredAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            console.log(`✅ Solicitud de descarga autorizada para ${address}`);
            res.download(DB_FILE, 'DOGECHOCO-messages.json', (err) => {
                if (err) console.error("Error al enviar el archivo:", err);
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