const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Boom } = require('@hapi/boom');
const fs = require('fs'); 

const app = express();

// 🔴 ফ্রন্টএন্ড থেকে এক্সেস পাওয়ার জন্য শক্তিশালী CORS হেডার 🔴
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.use(cors({ origin: "*" })); 
app.use(express.json({ limit: '200mb' })); 

const server = http.createServer(app);

// 🔴 সকেট কনফিগারেশনে Polling যুক্ত করা হলো 🔴
const io = new Server(server, { 
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['polling', 'websocket'] 
});

let sock = null;
let connectionStatus = 'DISCONNECTED';
let currentQR = null;

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
    // 🔴 ডায়নামিক ভার্সন ফেচ (WhatsApp যেন কানেকশন রিজেক্ট না করে) 🔴
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth');
    
    sock = makeWASocket({ 
        version, // লেটেস্ট ভার্সন বসানো হলো
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
            const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            connectionStatus = 'DISCONNECTED';
            currentQR = null;
            io.emit('disconnected');
            
            if (shouldReconnect) {
                console.log(`❌ Connection closed. Reconnecting... (Status Code: ${statusCode})`);
                
                // 🔴 যদি সার্ভার থেকে রিজেক্ট করে (সেশন করাপ্ট), তবে ফোল্ডার ক্লিন করে রিকানেক্ট করবে 🔴
                if(statusCode === 401 || statusCode === 403 || statusCode === 405 || statusCode === 500) {
                    clearAuthFolder();
                }
                
                // ক্র্যাশ লুপ ঠেকাতে ৫ সেকেন্ডের গ্যাপ
                setTimeout(() => startWhatsApp(), 5000); 
            } else {
                sock = null; 
                clearAuthFolder(); 
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
    clearAuthFolder(); 
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