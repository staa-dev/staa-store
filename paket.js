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

// Popup Premium DOM
const popupOverlay     = document.getElementById('popupPremium');
const popupCard        = document.getElementById('popupCard');
const popupIconInner   = document.getElementById('popupIconInner');
const popupBadgeText   = document.getElementById('popupBadgeText');
const popupTitle       = document.getElementById('popupTitle');
const popupMessage     = document.getElementById('popupMessage');
const popupInfo        = document.getElementById('popupInfo');
const popupOperator    = document.getElementById('popupOperator');
const popupCloseBtn    = document.getElementById('popupClose');
const popupCancelBtn   = document.getElementById('popupCancel');
const popupWABtn       = document.getElementById('popupWA');
const popupProgressBar = document.getElementById('popupProgressBar');

let appSettings = null;
let popupAutoCloseTimer = null;

// ========== POPUP PREMIUM LOGIC ==========
/**
 * Tampilkan popup premium
 * @param {Object} config
 *   - type: 'danger' | 'warning' | 'info' (default: 'danger')
 *   - icon: class FontAwesome (mis: 'fa-exclamation-triangle')
 *   - badge: text kecil di badge (mis: 'Gangguan')
 *   - title: judul popup
 *   - message: pesan popup
 *   - operator: nama operator (opsional — kalau ada, info box muncul)
 *   - waMessage: pesan WA yang dikirim saat klik Tanya Admin (opsional)
 *   - autoCloseMs: durasi auto close (default 6000)
 */
function showPremiumPopup(config) {
    // Reset timer lama kalau ada
    if (popupAutoCloseTimer) {
        clearTimeout(popupAutoCloseTimer);
        popupAutoCloseTimer = null;
    }

    // Set kelas tipe
    popupCard.classList.remove('type-warning', 'type-info');
    if (config.type === 'warning') popupCard.classList.add('type-warning');
    else if (config.type === 'info') popupCard.classList.add('type-info');

    // Icon
    popupIconInner.className = 'fas ' + (config.icon || 'fa-exclamation-triangle');

    // Badge
    popupBadgeText.textContent = config.badge || 'Pemberitahuan';

    // Title & message
    popupTitle.textContent = config.title || 'Pemberitahuan';
    popupMessage.textContent = config.message || '';

    // Info box (kalau ada operator)
    if (config.operator) {
        popupInfo.classList.add('show');
        popupOperator.textContent = config.operator;
    } else {
        popupInfo.classList.remove('show');
    }

    // Tombol WA
    if (config.waMessage) {
        popupWABtn.style.display = 'flex';
        popupWABtn.onclick = () => {
            const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(config.waMessage)}`;
            window.open(url, '_blank');
            hidePremiumPopup();
        };
    } else {
        popupWABtn.style.display = 'none';
    }

    // Reset & trigger progress bar animation
    popupProgressBar.style.animation = 'none';
    void popupProgressBar.offsetWidth; // reflow
    popupProgressBar.style.animation = '';

    // Show
    popupOverlay.classList.add('active');

    // Auto-close
    const autoClose = config.autoCloseMs !== undefined ? config.autoCloseMs : 6000;
    if (autoClose > 0) {
        popupAutoCloseTimer = setTimeout(() => {
            hidePremiumPopup();
        }, autoClose);
    }
}

function hidePremiumPopup() {
    popupOverlay.classList.remove('active');
    if (popupAutoCloseTimer) {
        clearTimeout(popupAutoCloseTimer);
        popupAutoCloseTimer = null;
    }
}

// Event listeners popup
popupCloseBtn.addEventListener('click', hidePremiumPopup);
popupCancelBtn.addEventListener('click', hidePremiumPopup);
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) hidePremiumPopup();
});
// ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
        hidePremiumPopup();
    }
});

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

function isProviderActive(p) {
    const aktif = String(p.aktif || '1').toLowerCase().trim();
    return aktif !== '0' && aktif !== 'off' && aktif !== 'false' && aktif !== 'no';
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

    try {
        const raw = await fetchSheetCSV('paket');
        console.log('📦 Total operator:', raw.length);
        renderProviders(raw);
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

    const activeCount = list.filter(p => isProviderActive(p)).length;

    list.forEach((p, idx) => {
        const operatorName = (p.operator || 'Unknown').trim();
        const logoUrl      = (p.logo || '').trim();
        const tujuan       = (p.tujuan || '').trim();
        const isActive     = isProviderActive(p);

        const item = document.createElement('a');
        item.className = 'operator-item';
        if (!isActive) item.classList.add('disabled');
        item.style.animationDelay = (idx * 30) + 'ms';

        if (!isActive) {
            item.href = 'javascript:void(0)';
        } else if (tujuan) {
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

        let hintIcon, hintText, arrowIcon, arrowClass;
        if (!isActive) {
            hintIcon = 'fa-exclamation-triangle';
            hintText = 'Sedang gangguan';
            arrowIcon = 'fa-ban';
            arrowClass = 'operator-arrow disabled';
        } else if (tujuan) {
            hintIcon = 'fa-arrow-right';
            hintText = 'Lihat paket tersedia';
            arrowIcon = 'fa-chevron-right';
            arrowClass = 'operator-arrow';
        } else {
            hintIcon = 'fa-comments';
            hintText = 'Chat admin';
            arrowIcon = 'fa-chevron-right';
            arrowClass = 'operator-arrow';
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
                    <i class="fas ${hintIcon}"></i>
                    ${hintText}
                </span>
            </div>
            <div class="${arrowClass}">
                <i class="fas ${arrowIcon}"></i>
            </div>
        `;

        // Click handler
        item.addEventListener('click', function(e) {
            // Kalau operator gangguan → popup premium
            if (!isActive) {
                e.preventDefault();
                e.stopPropagation();

                const waMsg = `Halo admin *${NAMA_TOKO}* 👋\n\n` +
                              `Saya lihat operator *${operatorName}* sedang gangguan di website.\n\n` +
                              `Kira-kira kapan normal kembali ya? 🙏`;

                showPremiumPopup({
                    type: 'danger',
                    icon: 'fa-triangle-exclamation',
                    badge: 'Gangguan',
                    title: 'Operator Sedang Gangguan',
                    message: `Operator ini sedang dalam perbaikan. Silakan pilih operator lain atau hubungi admin untuk info lebih lanjut.`,
                    operator: operatorName,
                    waMessage: waMsg,
                    autoCloseMs: 8000
                });
                return;
            }

            // Kalau toko tutup → popup premium
            if (!isOpen(appSettings)) {
                e.preventDefault();
                e.stopPropagation();

                showPremiumPopup({
                    type: 'warning',
                    icon: 'fa-clock',
                    badge: 'Toko Tutup',
                    title: 'Toko Sedang Tutup',
                    message: `Saat ini toko kami sedang tutup. Silakan kembali lagi pada jam operasional berikut:`,
                    operator: null,
                    waMessage: null,
                    autoCloseMs: 6000
                });
                return;
            }
        });

        providersList.appendChild(item);
    });

    if (activeCount === list.length) {
        providerCount.textContent = list.length + ' Operator';
    } else {
        providerCount.textContent = activeCount + ' / ' + list.length + ' Aktif';
    }
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