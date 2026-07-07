// ========== KONFIGURASI ==========
const SHEET_ID_CC = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSDrzoeqBwvFHO5TKQrzr3ChzvyKynr5XOAXKI40RjetE90edWhmwPV_dBvRRpr_nRrQ/exec'; // GANTI DENGAN URL KAMU
const WA_NUMBER = '6289530398848';

// ========== AOS INIT ==========
AOS.init({ once: true, duration: 600, offset: 20 });

// ========== THEME ==========
const themeToggle = document.getElementById('themeToggleNav');
const body = document.body;

const setTheme = (t) => {
    if (t === 'dark') {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme-cc', 'dark');
    } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme-cc', 'light');
    }
};

setTheme(localStorage.getItem('theme-cc') || 'light');

themeToggle.addEventListener('click', () => {
    const current = body.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ========== VALIDASI NOMOR WHATSAPP ==========
function validateWhatsApp(number) {
    // Hapus karakter non-digit
    const clean = number.replace(/[^0-9]/g, '');
    
    // Minimal 10 digit, maksimal 15 digit
    if (clean.length < 10 || clean.length > 15) return false;
    
    // Harus diawali 62 atau 08
    if (!clean.startsWith('62') && !clean.startsWith('08')) return false;
    
    return true;
}

function formatWhatsApp(number) {
    let clean = number.replace(/[^0-9]/g, '');
    
    // Konversi 08 menjadi 62
    if (clean.startsWith('08')) {
        clean = '62' + clean.substring(1);
    }
    
    return clean;
}

// ========== DOM ==========
const userIdInput = document.getElementById('userId');
const summaryId = document.getElementById('summaryId');
const summaryProduct = document.getElementById('summaryProduct');
const summaryPayment = document.getElementById('summaryPayment');
const summaryFee = document.getElementById('summaryFee');
const summaryPrice = document.getElementById('summaryPrice');
const summaryNotes = document.getElementById('summaryNotes');
const summaryNotesRow = document.getElementById('summaryNotesRow');
const feeRow = document.getElementById('feeRow');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');
const productGrid = document.getElementById('productOptions');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const storeStatus = document.getElementById('storeStatus');
const productCount = document.getElementById('productCount');

let selectedProduct = null;
let selectedPayment = null;
let appSettings = null;

// ========== FETCH CSV ==========
async function fetchSheetCSV(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_CC}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text.trim()) throw new Error('Sheet kosong');
    
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length === 0 || values.every(v => v === '')) continue;
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] !== undefined ? values[idx] : ''; });
        if (Object.values(row).some(v => v !== '')) data.push(row);
    }
    return data;
}

async function fetchSettingsCC() {
    const data = await fetchSheetCSV('pengaturan');
    const s = {};
    data.forEach(r => { if (r.kunci && r.nilai) s[r.kunci] = r.nilai; });
    return s;
}

async function fetchProductsCC() {
    const data = await fetchSheetCSV('capcut');
    return data.filter(p => p.aktif !== '0');
}

// ========== UPDATE STOK KE GOOGLE SHEETS ==========
async function updateStock(productName, quantity) {
    try {
        console.log(`📦 Update stok: ${productName} -${quantity}`);
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                sheet: 'capcut',
                product: productName,
                quantity: quantity
            })
        });
        
        const result = await response.json();
        console.log('📦 Result:', result);
        
        if (result.success) {
            console.log(`✅ Stok updated! ${result.oldStock} → ${result.newStock}`);
            return true;
        } else {
            console.error('❌ Gagal update stok:', result.error);
            return false;
        }
    } catch (e) {
        console.error('❌ Error update stok:', e);
        return false;
    }
}

// ========== HELPERS ==========
function calcFee(bp, pm, s) {
    if (!s) return 0;
    let f = 0;
    if (pm === 'OVO') f = parseFloat(s.biaya_admin_ovo || '0.5') / 100;
    else if (pm === 'QRIS') f = parseFloat(s.biaya_admin_qris || '0.7') / 100;
    return Math.round(bp * f);
}

function formatRp(a) {
    return 'Rp ' + parseInt(a).toLocaleString('id-ID');
}

function isOpen(s) {
    if (!s) return true;
    const oh = parseInt(s.jam_buka) || 7;
    const ch = parseInt(s.jam_tutup) || 21;
    const n = new Date();
    const w = new Date(n.getTime() + 7 * 60 * 60 * 1000);
    return w.getUTCHours() >= oh && w.getUTCHours() < ch;
}

function showLoading(s) {
    const o = document.getElementById('loadingOverlay');
    if (o) {
        if (s) o.classList.add('active');
        else o.classList.remove('active');
    }
}

// ========== REFRESH PRODUK ==========
async function refreshProducts() {
    try {
        const products = await fetchProductsCC();
        renderProducts(products);
    } catch (e) {
        console.error('❌ Gagal refresh produk:', e);
    }
}

// ========== LOAD DATA ==========
async function loadAppData() {
    showLoading(true);
    console.log('🔄 CAPCUT: Load data...');
    
    try {
        appSettings = await fetchSettingsCC();
        console.log('⚙️ Settings OK');
        updateStoreStatus();
    } catch (e) {
        console.error('❌ Settings:', e.message);
    }
    
    try {
        const products = await fetchProductsCC();
        console.log('📦 Products:', products.length);
        renderProducts(products);
    } catch (e) {
        console.error('❌ Products:', e.message);
        productGrid.innerHTML = `<div class="loading-placeholder" style="grid-column:1/-1;color:#ef4444;">❌ Gagal: ${e.message}</div>`;
    }
    
    showLoading(false);
}

function updateStoreStatus() {
    if (!storeStatus || !appSettings) return;
    const open = isOpen(appSettings);
    if (open) {
        storeStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Reseller Resmi</span>';
        storeStatus.style.background = 'var(--accent-light)';
        storeStatus.style.color = 'var(--accent)';
    } else {
        storeStatus.innerHTML = '<i class="fas fa-clock"></i><span>Toko Tutup</span>';
        storeStatus.style.background = 'rgba(239,68,68,0.15)';
        storeStatus.style.color = '#ef4444';
    }
}

function renderProducts(products) {
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
        productGrid.innerHTML = '<div class="loading-placeholder" style="grid-column:1/-1;">Belum ada produk</div>';
        productCount.textContent = '0 Pilihan';
        return;
    }
    
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.product = p.nama;
        card.dataset.price = p.harga;
        card.dataset.stock = p.stok || '0';
        
        const stock = parseInt(p.stok || '0');
        
        card.innerHTML = `
            ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
            <div class="product-icon"><i class="fas fa-calendar-alt"></i></div>
            <div class="product-amount">${p.nama}</div>
            <div class="product-price">${formatRp(p.harga)}</div>
            <div class="stock-badge ${stock > 0 ? 'in-stock' : 'out-of-stock'}">${stock > 0 ? `Stok: ${stock}` : 'Habis'}</div>
        `;
        
        if (stock === 0) card.classList.add('disabled');
        productGrid.appendChild(card);
    });
    
    productCount.textContent = products.length + ' Pilihan';
    attachProductListeners();
    if (!isOpen(appSettings)) disableAll();
}

function attachProductListeners() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProduct = {
                product: card.dataset.product,
                price: parseInt(card.dataset.price),
                stock: parseInt(card.dataset.stock)
            };
            updateSummary();
            updateProgressSteps();
        });
    });
}

function disableAll() {
    userIdInput.disabled = true;
    userIdInput.placeholder = 'Toko sedang tutup...';
    document.querySelectorAll('.product-card, .payment-card').forEach(c => {
        c.classList.add('disabled');
        c.style.pointerEvents = 'none';
    });
    whatsappBtn.disabled = true;
}

// ========== PAYMENT ==========
document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;
        document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPayment = card.dataset.payment;
        updateSummary();
        updateProgressSteps();
    });
});

function updateProgressSteps() {
    const rawId = userIdInput.value.trim();
    const valid = validateWhatsApp(rawId);
    
    step1.classList.toggle('active', valid);
    step2.classList.toggle('active', !!selectedProduct);
    step3.classList.toggle('active', !!selectedPayment);
}

function updateSummary() {
    const rawId = userIdInput.value.trim();
    const formattedId = formatWhatsApp(rawId);
    const valid = validateWhatsApp(rawId);
    
    summaryId.textContent = valid ? formattedId : (rawId || '-');
    summaryProduct.textContent = selectedProduct ? selectedProduct.product : '-';
    summaryPayment.textContent = selectedPayment || '-';
    
    const bp = selectedProduct ? selectedProduct.price : 0;
    const fee = appSettings && selectedPayment ? calcFee(bp, selectedPayment, appSettings) : 0;
    const total = bp + fee;
    
    summaryFee.textContent = formatRp(fee);
    summaryPrice.textContent = formatRp(total);
    feeRow.style.display = (fee > 0 && selectedProduct) ? 'flex' : 'none';
    
    const notes = notesInput.value.trim();
    if (notes && selectedProduct) {
        summaryNotes.textContent = notes;
        summaryNotesRow.style.display = 'flex';
    } else {
        summaryNotesRow.style.display = 'none';
    }
    
    document.getElementById('priceDANA').textContent = bp > 0 ? formatRp(bp) : 'Rp 0';
    document.getElementById('priceGoPay').textContent = bp > 0 ? formatRp(bp) : 'Rp 0';
    document.getElementById('priceOVO').textContent = bp > 0 ? formatRp(bp + calcFee(bp, 'OVO', appSettings)) : 'Rp 0';
    document.getElementById('priceQRIS').textContent = bp > 0 ? formatRp(bp + calcFee(bp, 'QRIS', appSettings)) : 'Rp 0';
    
    // Validasi untuk enable/disable tombol
    whatsappBtn.disabled = !(valid && selectedProduct && selectedPayment && isOpen(appSettings));
    updateProgressSteps();
}

// ========== EVENTS ==========
userIdInput.addEventListener('input', function(e) {
    // Filter hanya angka
    let value = this.value.replace(/[^0-9]/g, '');
    
    // Batasi panjang maksimal 15 digit
    if (value.length > 15) {
        value = value.substring(0, 15);
    }
    
    // Update nilai input dengan yang sudah difilter
    this.value = value;
    
    updateSummary();
    
    // Hapus kelas validasi sebelumnya
    this.classList.remove('input-valid', 'input-invalid', 'shake-animation');
    
    // Tampilkan indikator validasi
    if (value.length > 0) {
        if (validateWhatsApp(value)) {
            this.classList.add('input-valid');
        } else if (value.length >= 10) {
            // Hanya tampilkan invalid jika sudah cukup panjang tapi tidak valid
            this.classList.add('input-invalid');
        }
    }
});

notesInput.addEventListener('input', updateSummary);

// ========== WHATSAPP + UPDATE STOK ==========
whatsappBtn.addEventListener('click', async () => {
    if (whatsappBtn.disabled) return;
    
    const bp = selectedProduct.price;
    const fee = calcFee(bp, selectedPayment, appSettings);
    const total = bp + fee;
    const productName = selectedProduct.product;
    const whatsappNumber = formatWhatsApp(userIdInput.value.trim());
    
    // 1. KIRIM WHATSAPP
    let msg = `🔥 *ORDER CAPCUT PRO - ${appSettings?.nama_toko || 'STAA PAY'}* 🔥%0A%0A`;
    msg += `📱 *Nomor WhatsApp:* ${whatsappNumber}%0A`;
    msg += `⏱️ *Masa Aktif:* ${productName}%0A`;
    msg += `💳 *Pembayaran:* ${selectedPayment}%0A`;
    if (fee > 0) msg += `🧾 *Biaya Admin:* ${formatRp(fee)}%0A`;
    msg += `💰 *Total:* ${formatRp(total)}%0A`;
    if (notesInput.value.trim()) msg += `📝 *Catatan:* ${notesInput.value.trim()}%0A`;
    msg += `%0A⚡ _Mohon diproses ya kak!_ 🙏`;
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    
    // 2. UPDATE STOK (KURANGI 1)
    const success = await updateStock(productName, 1);
    
    // 3. REFRESH TAMPILAN SETELAH 1.5 DETIK
    if (success) {
        setTimeout(() => {
            refreshProducts();
            // Reset selection
            selectedProduct = null;
            selectedPayment = null;
            userIdInput.value = '';
            userIdInput.classList.remove('input-valid', 'input-invalid');
            document.querySelectorAll('.product-card, .payment-card').forEach(c => c.classList.remove('selected'));
            updateSummary();
        }, 1500);
    }
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
    updateSummary();
});

window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        showLoading(false);
        if (appSettings) updateStoreStatus();
    }
});

setTimeout(() => showLoading(false), 3000);