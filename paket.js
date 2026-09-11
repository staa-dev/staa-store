// ========== KONFIGURASI ==========
const SHEET_ID_PAKET = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg'; // ← GANTI punyamu!
const WA_NUMBER = '6285128002841'; // ← GANTI (dipakai kalau tujuan kosong)
const NAMA_TOKO = 'STAA PAY';

// ========== AOS ==========
AOS.init({ once: true, duration: 500, offset: 20 });

// ========== THEME ==========
const themeToggle = document.getElementById('themeToggleNav');
const body = document.body;
const setTheme = t => {
    if(t === 'dark'){ body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme-paket', 'dark'); }
    else { body.removeAttribute('data-theme'); localStorage.setItem('theme-paket', 'light'); }
};
setTheme(localStorage.getItem('theme-paket') || 'light');
themeToggle.addEventListener('click', () => {
    const c = body.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(c === 'dark' ? 'light' : 'dark');
});

// ========== DOM ==========
const providersList = document.getElementById('providersList');
const providerCount = document.getElementById('providerCount');
const storeStatus   = document.getElementById('storeStatus');
const footerNama    = document.getElementById('footerNama');

let appSettings = null;

// ========== FETCH CSV ==========
async function fetchSheetCSV(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_PAKET}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    console.log(`📡 Fetch: ${sheetName}`);
    const response = await fetch(url, { cache: 'no-store' });
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if(!text.trim()) throw new Error('Sheet kosong');
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    for(let i = 1; i < lines.length; i++){
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if(values.length === 0 || values.every(v => v === '')) continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] !== undefined ? values[idx] : ''; });
        if(Object.values(row).some(v => v !== '')) data.push(row);
    }
    console.log(`✅ ${sheetName}: ${data.length} baris`);
    return data;
}

// ========== HELPERS ==========
function isOpen(s) {
    if(!s) return true;
    const oh = parseInt(s.jam_buka) || 7, ch = parseInt(s.jam_tutup) || 21;
    const w = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    return w.getUTCHours() >= oh && w.getUTCHours() < ch;
}

function showLoading(s) {
    const o = document.getElementById('loadingOverlay');
    if(o){ if(s) o.classList.add('active'); else o.classList.remove('active'); }
}

function updateStoreStatus() {
    if(!storeStatus || !appSettings) return;
    const open = isOpen(appSettings);
    if(open){
        storeStatus.className = 'status-pill';
        storeStatus.innerHTML = '<span class="status-dot"></span><span>Buka</span>';
    } else {
        storeStatus.className = 'status-pill closed';
        storeStatus.innerHTML = '<span class="status-dot"></span><span>Tutup</span>';
    }
}

// ========== LOAD DATA ==========
async function loadAppData() {
    showLoading(true);
    console.log('🔄 PAKET: Load...');

    // Pengaturan toko
    try {
        const settingsData = await fetchSheetCSV('pengaturan');
        const s = {};
        settingsData.forEach(r => { if(r.kunci && r.nilai) s[r.kunci] = r.nilai; });
        appSettings = s;
        if(s.nama_toko && footerNama) footerNama.textContent = s.nama_toko;
        updateStoreStatus();
    } catch(e) {
        console.warn('⚠️ Pengaturan gagal:', e.message);
        appSettings = { jam_buka: '7', jam_tutup: '21' };
        updateStoreStatus();
    }

    // Paket
    try {
        const raw = await fetchSheetCSV('paket');
        const list = raw.filter(p => {
            const aktif = String(p.aktif || '1').toLowerCase().trim();
            return aktif !== '0' && aktif !== 'off' && aktif !== 'false';
        });
        console.log('📦 Operator:', list.length);
        renderProviders(list);
    } catch(e) {
        console.error('❌ Paket:', e.message);
        providersList.innerHTML = `<div class="loading-placeholder" style="color:#ef4444;">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Gagal memuat operator</span>
        </div>`;
        providerCount.textContent = '0';
    }

    showLoading(false);
}

// ========== RENDER LIST ==========
function renderProviders(list) {
    providersList.innerHTML = '';

    if (list.length === 0) {
        providersList.innerHTML = `<div class="loading-placeholder">
            <i class="fas fa-inbox"></i>
            <span>Belum ada operator tersedia</span>
        </div>`;
        providerCount.textContent = '0 Operator';
        return;
    }

    list.forEach((p, idx) => {
        const operatorName = (p.operator || 'Unknown').trim();
        const logoUrl      = (p.logo || '').trim();
        const tujuan       = (p.tujuan || '').trim(); // ← kolom baru

        const item = document.createElement('a');
        item.className = 'operator-item';
        item.style.animationDelay = (idx * 30) + 'ms';

        // Kalau ada tujuan → href normal
        // Kalau kosong → fallback ke WhatsApp
        if (tujuan) {
            item.href = tujuan;
        } else {
            const waMsg = `📱 *ORDER PAKET DATA - ${NAMA_TOKO}* 📱\n\n` +
                          `📡 *Operator:* ${operatorName}\n\n` +
                          `Halo kak, saya mau order paket data *${operatorName}*.\n` +
                          `Mohon info paket tersedia ya 🙏`;
            item.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
            item.target = '_blank';
            item.rel = 'noopener';
        }

        item.innerHTML = `
            <div class="operator-logo">
                ${logoUrl ? `<img src="${logoUrl}" alt="${operatorName}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                <div class="logo-fallback" style="${logoUrl ? 'display:none;' : 'display:flex;'}">
                    <i class="fas fa-sim-card"></i>
                </div>
            </div>
            <div class="operator-info">
                <span class="operator-name">${operatorName}</span>
                <span class="operator-hint">
                    <i class="fas ${tujuan ? 'fa-arrow-right' : 'fa-comments'}"></i>
                    ${tujuan ? 'Lihat paket tersedia' : 'Chat admin'}
                </span>
            </div>
            <div class="operator-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;

        // Kalau ada tujuan & toko tutup → blok akses
        item.addEventListener('click', function(e) {
            if (!isOpen(appSettings)) {
                e.preventDefault();
                alert('⚠️ Toko sedang tutup. Silakan coba lagi saat jam operasional.');
                return;
            }
        });

        providersList.appendChild(item);
    });

    providerCount.textContent = list.length + ' Operator';
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
});

window.addEventListener('pageshow', e => {
    if(e.persisted){
        showLoading(false);
        if(appSettings) updateStoreStatus();
    }
});

setTimeout(() => showLoading(false), 4000);