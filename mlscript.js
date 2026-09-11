// ========== KONFIGURASI ==========
const SHEET_ID_ML = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg';
const WA_NUMBER = '6285128002841';
const NAMA_TOKO = 'STAA PAY';

// Endpoint Cek ID ML (NexaDev)
const ML_STALK_API = 'https://api.nexadev.my.id/api/ml';

// ========== AOS INIT ==========
AOS.init({ once: true, duration: 600, offset: 20 });

// ========== THEME ==========
const themeToggle = document.getElementById('themeToggleNav'), body = document.body;
const setTheme = t => {
    if(t === 'dark'){ body.setAttribute('data-theme','dark'); localStorage.setItem('theme-ml','dark'); }
    else { body.removeAttribute('data-theme'); localStorage.setItem('theme-ml','light'); }
};
setTheme(localStorage.getItem('theme-ml') || 'light');
themeToggle.addEventListener('click', () => {
    const c = body.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(c === 'dark' ? 'light' : 'dark');
});

// ========== DOM ==========
const playerIdInput = document.getElementById('playerId'),
      serverIdInput = document.getElementById('serverId'),
      summaryId     = document.getElementById('summaryId'),
      summaryServer = document.getElementById('summaryServer'),
      summaryDiamond= document.getElementById('summaryDiamond'),
      summaryPayment= document.getElementById('summaryPayment'),
      summaryFee    = document.getElementById('summaryFee'),
      summaryPrice  = document.getElementById('summaryPrice'),
      summaryNotes  = document.getElementById('summaryNotes'),
      summaryNotesRow = document.getElementById('summaryNotesRow'),
      feeRow        = document.getElementById('feeRow'),
      whatsappBtn   = document.getElementById('whatsappBtn'),
      notesInput    = document.getElementById('notes'),
      diamondGrid   = document.getElementById('diamondProducts'),
      membershipGrid= document.getElementById('membershipProducts'),
      step1         = document.getElementById('step1'),
      step2         = document.getElementById('step2'),
      step3         = document.getElementById('step3'),
      storeStatus   = document.getElementById('storeStatus'),
      productCount  = document.getElementById('productCount');

// Cek ID DOM
const checkIdBtn           = document.getElementById('checkIdBtn'),
      accountInfoBox       = document.getElementById('accountInfoBox'),
      accountInfoIcon      = document.getElementById('accountInfoIcon'),
      accountInfoText      = document.getElementById('accountInfoText'),
      accountInfoSub       = document.getElementById('accountInfoSub'),
      accountVerifiedBadge = document.getElementById('accountVerifiedBadge'),
      summaryUsernameRow   = document.getElementById('summaryUsernameRow'),
      summaryUsername      = document.getElementById('summaryUsername');

// State
let selectedProduct = null,
    selectedPayment = null,
    activeCategory  = 'diamond',
    appSettings     = null;

let verifiedAccount = null;         // { uid, zone, nickname, region }
let checkAbortController = null;

// ========== FETCH CSV ==========
async function fetchSheetCSV(sheetName){
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_ML}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    console.log(`📡 Fetch: ${sheetName}`);
    const response = await fetch(url, { cache: 'no-store' });
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if(!text.trim()) throw new Error('Sheet kosong');
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
    const data = [];
    for(let i = 1; i < lines.length; i++){
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g,''));
        if(values.length === 0 || values.every(v => v === '')) continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] !== undefined ? values[idx] : ''; });
        if(Object.values(row).some(v => v !== '')) data.push(row);
    }
    console.log(`✅ ${sheetName}: ${data.length} baris`);
    return data;
}

async function fetchSettingsML(){
    const data = await fetchSheetCSV('pengaturan');
    const s = {};
    data.forEach(r => { if(r.kunci && r.nilai) s[r.kunci] = r.nilai; });
    return s;
}
async function fetchProductsML(sheetName){
    const data = await fetchSheetCSV(sheetName);
    return data.filter(p => p.aktif !== '0');
}

// ========== HELPERS ==========
function calcFee(bp, pm, s){
    if(!s) return 0;
    let f = 0;
    if(pm === 'OVO') f = parseFloat(s.biaya_admin_ovo || '0.5') / 100;
    else if(pm === 'QRIS') f = parseFloat(s.biaya_admin_qris || '0.7') / 100;
    return Math.round(bp * f);
}
function formatRp(a){ return 'Rp ' + parseInt(a).toLocaleString('id-ID'); }
function isOpen(s){
    if(!s) return true;
    const oh = parseInt(s.jam_buka) || 7, ch = parseInt(s.jam_tutup) || 21;
    const n = new Date(), w = new Date(n.getTime() + 7*60*60*1000);
    return w.getUTCHours() >= oh && w.getUTCHours() < ch;
}
function showLoading(s){
    const o = document.getElementById('loadingOverlay');
    if(o){ if(s) o.classList.add('active'); else o.classList.remove('active'); }
}

// ========== LOAD DATA ==========
async function loadAppData(){
    showLoading(true);
    console.log('🔄 ML: Load data...');
    try{ appSettings = await fetchSettingsML(); console.log('⚙️ Settings OK'); updateStoreStatus(); }
    catch(e){ console.error('❌ Settings:', e.message); }
    try{
        const products = await fetchProductsML('mobilelegends');
        console.log('📦 Products:', products.length);
        renderProducts(products);
    } catch(e){
        console.error('❌ Products:', e.message);
        diamondGrid.innerHTML = '<div class="loading-placeholder" style="color:#ef4444;">❌ Gagal memuat</div>';
    }
    showLoading(false);
}

function updateStoreStatus(){
    if(!storeStatus || !appSettings) return;
    const open = isOpen(appSettings);
    if(open){
        storeStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Reseller Resmi</span>';
        storeStatus.style.background = 'var(--accent-gold-light)';
        storeStatus.style.color = 'var(--accent-gold)';
    } else {
        storeStatus.innerHTML = '<i class="fas fa-clock"></i><span>Toko Tutup</span>';
        storeStatus.style.background = 'rgba(239,68,68,0.15)';
        storeStatus.style.color = '#ef4444';
    }
}

function renderProducts(products){
    diamondGrid.innerHTML = '';
    membershipGrid.innerHTML = '';
    let dc = 0, mc = 0;
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.diamond = p.nama;
        card.dataset.price = p.harga;
        card.dataset.type = p.tipe;
        card.innerHTML = `
            ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
            <div class="product-icon"><i class="fas fa-gem"></i></div>
            <div class="product-amount">${p.nama}</div>
            <div class="product-price">${formatRp(p.harga)}</div>
        `;
        if(p.tipe === 'diamond'){ diamondGrid.appendChild(card); dc++; }
        else { membershipGrid.appendChild(card); mc++; }
    });
    if(dc === 0) diamondGrid.innerHTML = '<div class="loading-placeholder">Belum ada produk</div>';
    if(mc === 0) membershipGrid.innerHTML = '<div class="loading-placeholder">Belum ada produk</div>';
    productCount.textContent = products.length + ' Pilihan';
    if(mc === 0) document.querySelector('[data-category="membership"]').style.display = 'none';
    attachProductListeners();
    if(!isOpen(appSettings)) disableAll();
}

function attachProductListeners(){
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            if(card.classList.contains('disabled') || card.dataset.type !== activeCategory) return;
            document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProduct = {
                diamond: card.dataset.diamond,
                price: parseInt(card.dataset.price),
                type: card.dataset.type
            };
            updateSummary();
            updateProgressSteps();
        });
    });
}

function disableAll(){
    playerIdInput.disabled = serverIdInput.disabled = true;
    playerIdInput.placeholder = 'Toko sedang tutup...';
    if(checkIdBtn) checkIdBtn.disabled = true;
    document.querySelectorAll('.product-card,.payment-card').forEach(c => {
        c.classList.add('disabled');
        c.style.pointerEvents = 'none';
    });
    whatsappBtn.disabled = true;
}

// ========== CEK ID MOBILE LEGENDS ==========
function showAccountLoading(){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box active loading';
    accountInfoIcon.className = 'fas fa-spinner fa-spin account-info-icon';
    accountInfoText.textContent = 'Memeriksa ID Mobile Legends...';
    accountInfoSub.textContent = '';
    accountInfoSub.style.display = 'none';
    accountVerifiedBadge.style.display = 'none';
}
function showAccountSuccess(nickname, uid, zone, region){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box active success';
    accountInfoIcon.className = 'fas fa-user-check account-info-icon';
    accountInfoText.textContent = nickname;
    accountInfoSub.textContent = `ID: ${uid} • Zone: ${zone}${region ? ' • ' + region : ''}`;
    accountInfoSub.style.display = 'inline-block';
    accountVerifiedBadge.style.display = 'inline-flex';
}
function showAccountError(msg){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box active error';
    accountInfoIcon.className = 'fas fa-exclamation-circle account-info-icon';
    accountInfoText.textContent = msg;
    accountInfoSub.textContent = '';
    accountInfoSub.style.display = 'none';
    accountVerifiedBadge.style.display = 'none';
}
function hideAccountBox(){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box';
    accountVerifiedBadge.style.display = 'none';
}

async function checkPlayerId(){
    const uid = playerIdInput.value.trim();
    const zone = serverIdInput.value.trim();

    if(!uid || !/^\d+$/.test(uid) || uid.length < 6){
        showAccountError('Masukkan ID Player yang valid (minimal 6 digit angka)');
        return;
    }
    if(!zone || !/^\d+$/.test(zone) || zone.length < 3){
        showAccountError('Masukkan Server/Zone yang valid (contoh: 1234)');
        return;
    }

    if(checkAbortController) checkAbortController.abort();
    checkAbortController = new AbortController();

    checkIdBtn.classList.add('loading');
    checkIdBtn.disabled = true;
    showAccountLoading();

    try{
        const url = `${ML_STALK_API}?id=${encodeURIComponent(uid)}&zone=${encodeURIComponent(zone)}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: checkAbortController.signal
        });
        if(!res.ok) throw new Error('HTTP ' + res.status);

        const json = await res.json();

        // Format response: { author, status, data: { username, region } }
        if(!json || json.status !== true || !json.data){
            throw new Error('Data akun tidak ditemukan');
        }
        const nickname = (json.data.username || '').trim();
        const region   = (json.data.region || '').trim();
        if(!nickname) throw new Error('Nickname tidak ditemukan');

        verifiedAccount = { uid, zone, nickname, region };
        showAccountSuccess(nickname, uid, zone, region);
        updateSummary();
    } catch(err){
        if(err.name === 'AbortError') return;
        console.error('❌ Check ID error:', err);
        verifiedAccount = null;
        showAccountError('Gagal memeriksa ID. Pastikan ID & Server benar, atau coba beberapa saat lagi.');
        updateSummary();
    } finally {
        checkIdBtn.classList.remove('loading');
        checkIdBtn.disabled = false;
    }
}

checkIdBtn.addEventListener('click', checkPlayerId);
playerIdInput.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); checkPlayerId(); }
});
serverIdInput.addEventListener('keydown', e => {
    if(e.key === 'Enter'){ e.preventDefault(); checkPlayerId(); }
});

// ========== CATEGORY ==========
document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.category;
        if(activeCategory === 'diamond'){
            diamondGrid.classList.add('active');
            membershipGrid.classList.remove('active');
        } else {
            diamondGrid.classList.remove('active');
            membershipGrid.classList.add('active');
        }
        document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
        selectedProduct = null;
        updateSummary();
        updateProgressSteps();
    });
});

// ========== PAYMENT ==========
document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', () => {
        if(card.classList.contains('disabled')) return;
        document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPayment = card.dataset.payment;
        updateSummary();
        updateProgressSteps();
    });
});

function updateProgressSteps(){
    const id = playerIdInput.value.trim(), sid = serverIdInput.value.trim();
    step1.classList.toggle('active', id.length >= 6 && sid.length === 4);
    step2.classList.toggle('active', !!selectedProduct);
    step3.classList.toggle('active', !!selectedPayment);
}

function updateSummary(){
    const id = playerIdInput.value.trim(),
          sid = serverIdInput.value.trim(),
          valid = id.length >= 6 && sid.length === 4;

    summaryId.textContent = id || '-';
    summaryServer.textContent = sid || '-';
    summaryDiamond.textContent = selectedProduct ? selectedProduct.diamond : '-';
    summaryPayment.textContent = selectedPayment || '-';

    // Nickname (row sama seperti row lain)
    if(verifiedAccount && verifiedAccount.nickname){
        summaryUsername.textContent = verifiedAccount.nickname;
        summaryUsernameRow.style.display = 'flex';
    } else {
        summaryUsernameRow.style.display = 'none';
    }

    const bp = selectedProduct ? selectedProduct.price : 0,
          fee = (appSettings && selectedPayment) ? calcFee(bp, selectedPayment, appSettings) : 0,
          total = bp + fee;

    summaryFee.textContent = formatRp(fee);
    summaryPrice.textContent = formatRp(total);
    feeRow.style.display = (fee > 0 && selectedProduct) ? 'flex' : 'none';

    const notes = notesInput.value.trim();
    if(notes && selectedProduct){
        summaryNotes.textContent = notes;
        summaryNotesRow.style.display = 'flex';
    } else {
        summaryNotesRow.style.display = 'none';
    }

    document.getElementById('priceDANA').textContent = bp > 0 ? formatRp(bp) : 'Rp 0';
    document.getElementById('priceGoPay').textContent = bp > 0 ? formatRp(bp) : 'Rp 0';
    document.getElementById('priceOVO').textContent = bp > 0 ? formatRp(bp + calcFee(bp,'OVO',appSettings)) : 'Rp 0';
    document.getElementById('priceQRIS').textContent = bp > 0 ? formatRp(bp + calcFee(bp,'QRIS',appSettings)) : 'Rp 0';

    whatsappBtn.disabled = !(valid && selectedProduct && selectedPayment && isOpen(appSettings));
    updateProgressSteps();
}

// ========== EVENTS ==========
playerIdInput.addEventListener('input', () => {
    const cleaned = playerIdInput.value.replace(/\D/g,'');
    if(cleaned !== playerIdInput.value) playerIdInput.value = cleaned;

    const uid = playerIdInput.value.trim();
    if(verifiedAccount && verifiedAccount.uid !== uid){
        verifiedAccount = null;
        hideAccountBox();
    }
    updateSummary();
});

serverIdInput.addEventListener('input', () => {
    const cleaned = serverIdInput.value.replace(/\D/g,'');
    if(cleaned !== serverIdInput.value) serverIdInput.value = cleaned;

    const zone = serverIdInput.value.trim();
    if(verifiedAccount && verifiedAccount.zone !== zone){
        verifiedAccount = null;
        hideAccountBox();
    }
    updateSummary();
});

notesInput.addEventListener('input', updateSummary);

// ========== WHATSAPP ==========
whatsappBtn.addEventListener('click', () => {
    if(whatsappBtn.disabled) return;

    const bp = selectedProduct.price,
          fee = calcFee(bp, selectedPayment, appSettings),
          total = bp + fee;

    const nickname = (verifiedAccount && verifiedAccount.nickname) ? verifiedAccount.nickname : '-';
    const playerId = playerIdInput.value.trim();
    const serverId = serverIdInput.value.trim();

    let msg = `🔥 *ORDER MOBILE LEGENDS - ${NAMA_TOKO}* 🔥\n\n`;
    msg += `✨*Nickname:* ${nickname}\n`;
    msg += `👤 *ID:* ${playerId}\n`;
    msg += `🖥️ *Server:* ${serverId}\n`;
    msg += `💎 *Produk:* ${selectedProduct.diamond}\n`;
    msg += `💳 *Pembayaran:* ${selectedPayment}\n`;
    if(fee > 0) msg += `🧾 *Biaya Admin:* ${formatRp(fee)}\n`;
    msg += `💰 *Total:* ${formatRp(total)}\n`;
    if(notesInput.value.trim()) msg += `📝 *Catatan:* ${notesInput.value.trim()}\n`;
    msg += `\n⚡ _Mohon diproses ya kak!_ 🙏`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => { loadAppData(); updateSummary(); });
window.addEventListener('pageshow', e => {
    if(e.persisted){ showLoading(false); if(appSettings) updateStoreStatus(); }
});
setTimeout(() => showLoading(false), 4000);