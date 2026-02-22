const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Boom } = require('@hapi/boom');
const fs = require('fs'); // ফাইল সিস্টেম মডিউল (ফোল্ডার ডিলিট করার জন্য)

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' })); 

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let sock = null;
let connectionStatus = 'DISCONNECTED';
let currentQR = null;

// ফিক্স ১: ডিসকানেক্ট করলে পুরনো ফাইল মুছে ফেলার ফাংশন
const clearAuthFolder = () => {
    try {
        if (fs.existsSync('./baileys_auth')) {
            fs.rmSync('./baileys_auth', { recursive: true, force: true });
            console.log('🗑️ Auth folder cleared for fresh start.');
        }
    } catch (e) {
        console.error('Failed to clear auth folder:', e);
    }
};

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
    
    sock = makeWASocket({ 
        auth: state, 
        printQRInTerminal: true,
        browser: ['BDT Enterprise', 'Chrome', '20.0.0'] 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = qr;
            connectionStatus = 'QR_READY';
            io.emit('qr', qr);
        }
        
        if (connection === 'open') {
            currentQR = null;
            connectionStatus = 'CONNECTED';
            io.emit('ready', true);
            console.log('✅ WhatsApp successfully connected!');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            connectionStatus = 'DISCONNECTED';
            currentQR = null;
            io.emit('disconnected');
            
            if (shouldReconnect) {
                startWhatsApp();
            } else {
                sock = null; 
                clearAuthFolder(); // সার্ভার লগআউট হলে ফোল্ডার মুছে ফেলবে
            }
        }
    });
}

// ==========================================
// FRONTEND API ENDPOINTS
// ==========================================

app.get('/api/status', (req, res) => res.json({ status: connectionStatus, qr: currentQR }));

app.post('/api/marketing/connect', async (req, res) => {
    if (connectionStatus === 'CONNECTED' || connectionStatus === 'QR_READY') {
        return res.json({ success: false, message: 'Engine is already running' });
    }
    await startWhatsApp();
    res.json({ success: true });
});

// ফিক্স ২: ডিসকানেক্ট API তে ফোল্ডার মোছার লজিক যুক্ত করা হলো
app.post('/api/marketing/disconnect', async (req, res) => {
    try {
        if (sock) {
            await sock.logout();
            sock = null;
        }
    } catch (e) {
        console.log("Logout safe skip");
    }
    connectionStatus = 'DISCONNECTED';
    currentQR = null;
    clearAuthFolder(); // একদম ফ্রেশ করে দেবে
    res.json({ success: true });
});

app.post('/api/marketing/send', async (req, res) => {
    const { recipients, message, mediaList } = req.body;
    
    if (connectionStatus !== 'CONNECTED' || !sock) {
        return res.status(400).json({ error: 'WhatsApp is not connected' });
    }

    res.json({ success: true, message: 'Campaign Started' }); 

    for (const phone of recipients) {
        try {
            const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
            
            if (mediaList && mediaList.length > 0) {
                for (let i = 0; i < mediaList.length; i++) {
                    const mediaItem = mediaList[i];
                    
                    // ফিক্স ৩: Base64 ইমেজ ডিকোড করার পারফেক্ট লজিক
                    const base64Data = mediaItem.data.includes(',') ? mediaItem.data.split(',')[1] : mediaItem.data;
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    let messagePayload = {};
                    
                    if (i === 0 && message) {
                        messagePayload.caption = message;
                    }

                    if (mediaItem.mimetype && mediaItem.mimetype.startsWith('video/')) {
                        messagePayload.video = buffer;
                    } else if (mediaItem.mimetype && mediaItem.mimetype.startsWith('image/')) {
                        messagePayload.image = buffer;
                    } else {
                        messagePayload.document = buffer;
                        messagePayload.mimetype = mediaItem.mimetype || 'application/octet-stream';
                        messagePayload.fileName = mediaItem.filename || `document_${i}`;
                    }

                    await sock.sendMessage(jid, messagePayload);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } else if (message) {
                await sock.sendMessage(jid, { text: message });
            }
            
            const delay = Math.floor(Math.random() * 2000) + 5000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
        } catch (error) {
            console.error(`Failed to send to ${phone}:`, error);
        }
    }
});

startWhatsApp();

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));