// ========== KONFIGURASI GOOGLE SHEETS ==========
const SHEET_ID = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg';

// ========== FETCH CSV DARI GOOGLE SHEETS ==========
async function fetchSheetCSV(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    
    console.log(`📡 [${new Date().toLocaleTimeString()}] Fetch: ${sheetName}`);
    
    const response = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const text = await response.text();
    
    if (!text || text.trim() === '') throw new Error(`Sheet "${sheetName}" kosong`);
    
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error(`Sheet "${sheetName}" hanya header`);
    
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || values.every(v => v === '')) continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] !== undefined ? values[idx] : ''; });
        if (Object.values(row).some(v => v !== '')) data.push(row);
    }
    
    console.log(`✅ ${sheetName}: ${data.length} baris`);
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += char; }
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, '').trim());
}

// ========== FETCH FUNCTIONS ==========
async function fetchSettings() {
    console.log('⚙️ FETCH SETTINGS');
    const data = await fetchSheetCSV('pengaturan');
    if (data.length === 0) throw new Error('Sheet pengaturan kosong');
    
    const settings = {};
    data.forEach(row => {
        if (row.kunci && row.nilai !== undefined && row.nilai !== '') {
            settings[row.kunci] = row.nilai;
        }
    });
    
    console.log('📊 Settings:', JSON.stringify(settings));
    return settings;
}

async function fetchGames() {
    const data = await fetchSheetCSV('games');
    return data.filter(g => g.aktif === '1');
}

async function fetchAllGames() {
    return await fetchSheetCSV('games');
}

async function fetchProducts(sheetName) {
    const data = await fetchSheetCSV(sheetName);
    return data.filter(p => p.aktif === '1');
}

async function fetchVouchers() {
    const data = await fetchSheetCSV('voucher');
    return data.filter(v => v.aktif === '1');
}

// ========== HELPERS ==========
function calculateAdminFee(basePrice, paymentMethod, settings) {
    if (!settings) return 0;
    let feePercent = 0;
    if (paymentMethod === 'OVO') feePercent = parseFloat(settings.biaya_admin_ovo || '0.5') / 100;
    else if (paymentMethod === 'QRIS') feePercent = parseFloat(settings.biaya_admin_qris || '0.7') / 100;
    return Math.round(basePrice * feePercent);
}

function formatRupiah(amount) {
    return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

function isStoreOpen(settings) {
    if (!settings) return true;
    const openHour = parseInt(settings.jam_buka) || 7;
    const closeHour = parseInt(settings.jam_tutup) || 21;
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.getUTCHours() >= openHour && wib.getUTCHours() < closeHour;
}

function sendWhatsApp(data) {
    let message = `🔥 *ORDER - ${data.namaToko || 'STAA PAY'}* 🔥%0A%0A`;
    if (data.playerId) message += `👤 *ID:* ${data.playerId}%0A`;
    if (data.serverId) message += `🖥️ *Server:* ${data.serverId}%0A`;
    if (data.userId) message += `📧 *Email/ID:* ${data.userId}%0A`;
    message += `💎 *Produk:* ${data.product}%0A`;
    message += `💳 *Pembayaran:* ${data.payment}%0A`;
    if (data.fee > 0) message += `🧾 *Biaya Admin:* ${formatRupiah(data.fee)}%0A`;
    message += `💰 *Total:* ${formatRupiah(data.total)}%0A`;
    if (data.notes) message += `📝 *Catatan:* ${data.notes}%0A`;
    message += `%0A⚡ _Mohon diproses ya kak!_ 🙏`;
    window.open(`https://wa.me/${data.waNumber}?text=${message}`, '_blank');
}

console.log('🚀 api.js FINAL loaded | Sheet:', SHEET_ID);