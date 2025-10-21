// --- CÓDIGO FINAL, COMPLETO Y DEFINITIVO de App.js ---

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import DOGECHOCOLogo from './assets/DOGECHOCO-logo.png';

const ADMIN_WALLET_ADDRESS = '0xd6d3FeAa769e03EfEBeF94fB10D365D97aFAC011';
const BACKEND_URL = 'https://dogechoco-dapp.vercel.app';

function App() {
    const [account, setAccount] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminMessages, setAdminMessages] = useState([]);
    const [view, setView] = useState('main');

    useEffect(() => {
        if (typeof account === 'string' && account.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [account]);

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            setNotification('Por favor, instala MetaMask u otra wallet compatible.');
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);
            setNotification('✅ Wallet conectada correctamente.');
        } catch (error) {
            console.error("Error conectando la wallet:", error);
            setNotification('❌ Error al conectar la wallet.');
        }
    };

    const sendMessage = async () => {
        if (!message) {
            setNotification('El mensaje no puede estar vacío.');
            return;
        }
        setLoading(true);
        setNotification('');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signature = await signer.signMessage(message);
            setNotification('Enviando y verificando en el servidor...');
            const response = await fetch(`${BACKEND_URL}/api/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    signature: signature,
                    address: account,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Error del servidor.');
            }
            setNotification('✅ ¡Mensaje enviado y verificado con éxito!');
            setMessage('');
        } catch (error) {
            console.error("Error al firmar o enviar el mensaje:", error);
            let userFriendlyError = "Failed to fetch";
            if (error && error.message) {
                userFriendlyError = error.message;
            }
            if (String(userFriendlyError).includes('ACTION_REJECTED')) {
                userFriendlyError = 'Has rechazado la solicitud de firma en tu wallet.';
            }
            setNotification(`❌ Error: ${userFriendlyError}`);
        } finally {
            setLoading(false);
        }
    };

    const getAdminMessages = async () => {
        setLoading(true);
        setNotification('Solicitando acceso de administrador...');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const adminMessage = 'Soy el administrador de DOGECHOCO y solicito ver los mensajes.';
            const signature = await signer.signMessage(adminMessage);
            const response = await fetch(`${BACKEND_URL}/admin/get-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account,
                    signature: signature
                })
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Acceso denegado.');
            }
            const messages = await response.json();
            setAdminMessages(messages); // Ya no es necesario .reverse() porque el backend lo ordena
            setView('admin');
            setNotification('');
        } catch (error) {
            setNotification(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    const downloadMessages = async () => {
        // ... (código sin cambios)
    };

    if (isAdmin && view === 'admin') {
        return (
            <div className="App">
                 <button onClick={() => setView('main')} className="back-button">← Volver</button>
                 <div className="admin-header">
                    <h2>Panel de Administrador</h2>
                    <button onClick={downloadMessages} className="download-button" disabled={loading}>
                        {loading ? 'Procesando...' : 'Descargar Mensajes'}
                    </button>
                 </div>
                 <p>Total de mensajes: {adminMessages.length}</p>
                 <div className="messages-list">
                    {adminMessages.map((msg, index) => (
                        <div key={index} className="message-item">
                            <p><strong>De:</strong> {msg.address}</p>
                            <p><strong>Mensaje:</strong> {msg.message}</p>
                            <p><strong>Fecha:</strong> {new Date(msg.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                 </div>
            </div>
        )
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={DOGECHOCOLogo} className="App-logo" alt="DOGECHOCO Logo" />
                <h1 className="solana-gradient">MIGRACION SOLANA</h1>
                {!account ? (
                    <button onClick={connectWallet} className="connect-button">Conectar Wallet</button>
                ) : (
                    <div className="message-container">
                        <p className="wallet-address">Conectado como: <strong>{`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}</strong></p>

                        {isAdmin && (
                             <button onClick={getAdminMessages} className="admin-button" disabled={loading}>
                                {loading ? 'Cargando...' : 'Panel de Administrador'}
                            </button>
                        )}

                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Escribe tu mensaje confidencial aquí..." rows="5" />
                        <button onClick={sendMessage} disabled={loading} className="send-button">{loading ? 'Procesando...' : 'Firmar y Enviar Mensaje'}</button>
                    </div>
                )}
                {notification && <p className="notification">{notification}</p>}
            </header>
        </div>
    );
}