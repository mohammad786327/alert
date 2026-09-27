const WebSocket = require('ws');
const fs = require('fs');

// Extension se download ki hui file ka naam yahan check kar lein (misal ke tor par 'cookies.txt')
const cookieFile = './cookies.txt'; 

function getAccessTokenFromCookies() {
    try {
        const fileContent = fs.readFileSync(cookieFile, 'utf8');
        const lines = fileContent.split('\n');
        
        for (let line of lines) {
            // Tradovate ki cookie mein token ya access key ko talaash karna
            if (line.includes('accessToken') || line.includes('token') || line.includes('authorization')) {
                const parts = line.split('\t');
                const val = parts[parts.length - 1].trim();
                if (val.length > 20) { // Token lamba hota hai
                    return val;
                }
            }
        }
    } catch (err) {
        console.log("Cookie file parhne mein masla hai. Pehle file folder mein rakhein:", err.message);
    }
    return null;
}

const token = getAccessTokenFromCookies();

if (!token) {
    console.log("❌ Token nahi mila. Baraye meharbani extension se sahi file export kar ke ishi folder mein 'cookies.txt' ke naam se save karein.");
    // Agar cookie file se direct token na mile, toh aap yahan apna manual token bhi string mein de sakte hain testing ke liye
    return;
}

console.log("✅ Token mil gaya! WebSocket connect ho raha hai...");

// WebSocket Connection Setup
const wsUrl = 'wss://md-demo.tradovateapi.com/v1/websocket?r=' + Math.random();
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
    console.log('🔗 Connected to Tradovate MD WebSocket!');
    // Authorization frame bhejna
    ws.send(`authorize\n1\n\n${token}`);
});

ws.on('message', (data) => {
    const msg = data.toString();
    
    // Server ka heartbeat ignore karein
    if (msg === 'h') return; 
    
    console.log('📥 Response:', msg);
    
    // Jab authorization successful hojaye toh MNQZ6 ka data subscribe karein
    if (msg.includes('authorization') || msg.includes('result')) {
        console.log('🚀 Authenticated! Subscribing to MNQZ6...');
        ws.send(JSON.stringify(["md/subscribe", { "symbol": "MNQZ6" }]));
    }
});

ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed. Code: ${code}, Reason: ${reason}`);
});

ws.on('error', (err) => {
    console.error('⚠️ WebSocket Error:', err);
});