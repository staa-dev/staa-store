// ========== SHEET ID ==========
const SHEET_ID_CC = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg';

// ========== AOS INIT ==========
AOS.init({ once: true, duration: 600, offset: 20 });

// ========== THEME ==========
const themeToggle=document.getElementById('themeToggleNav'),body=document.body;
const setTheme=t=>{if(t==='dark'){body.setAttribute('data-theme','dark');localStorage.setItem('theme-cc','dark')}else{body.removeAttribute('data-theme');localStorage.setItem('theme-cc','light')}};
setTheme(localStorage.getItem('theme-cc')||'light');
themeToggle.addEventListener('click',()=>{const c=body.hasAttribute('data-theme')?'dark':'light';setTheme(c==='dark'?'light':'dark')});

// ========== DOM ==========
const userIdInput=document.getElementById('userId'),summaryId=document.getElementById('summaryId'),summaryProduct=document.getElementById('summaryProduct'),summaryPayment=document.getElementById('summaryPayment'),summaryFee=document.getElementById('summaryFee'),summaryPrice=document.getElementById('summaryPrice'),summaryNotes=document.getElementById('summaryNotes'),summaryNotesRow=document.getElementById('summaryNotesRow'),feeRow=document.getElementById('feeRow'),whatsappBtn=document.getElementById('whatsappBtn'),notesInput=document.getElementById('notes'),productGrid=document.getElementById('productOptions'),step1=document.getElementById('step1'),step2=document.getElementById('step2'),step3=document.getElementById('step3'),storeStatus=document.getElementById('storeStatus'),productCount=document.getElementById('productCount');
let selectedProduct=null,selectedPayment=null,appSettings=null;

// ========== FETCH CSV SENDIRI (BIAR GA TERGANTUNG api.js) ==========
async function fetchSheetCSV(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_CC}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    console.log(`📡 Fetch: ${sheetName} | ${url}`);
    
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
    
    console.log(`✅ ${sheetName}: ${data.length} baris`);
    return data;
}

async function fetchSettingsCC() {
    const data = await fetchSheetCSV('pengaturan');
    const settings = {};
    data.forEach(row => { if (row.kunci && row.nilai) settings[row.kunci] = row.nilai; });
    return settings;
}

async function fetchProductsCC(sheetName) {
    const data = await fetchSheetCSV(sheetName);
    return data.filter(p => p.aktif !== '0');
}

// ========== HELPERS ==========
function calculateAdminFee(basePrice, paymentMethod, settings) {
    if (!settings) return 0;
    let feePercent = 0;
    if (paymentMethod === 'OVO') feePercent = parseFloat(settings.biaya_admin_ovo || '0.5') / 100;
    else if (paymentMethod === 'QRIS') feePercent = parseFloat(settings.biaya_admin_qris || '0.7') / 100;
    return Math.round(basePrice * feePercent);
}

function formatRupiah(amount) { return 'Rp ' + parseInt(amount).toLocaleString('id-ID'); }

function isStoreOpen(settings) {
    if (!settings) return true;
    const oh = parseInt(settings.jam_buka) || 7;
    const ch = parseInt(settings.jam_tutup) || 21;
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.getUTCHours() >= oh && wib.getUTCHours() < ch;
}

// ========== LOADING ==========
function showLoading(s) {
    const o = document.getElementById('loadingOverlay');
    if (o) { if (s) o.classList.add('active'); else o.classList.remove('active'); }
}

// ========== LOAD DATA ==========
async function loadAppData() {
    showLoading(true);
    console.log('🔄 CAPCUT: Load data...');
    console.log('📋 Sheet ID:', SHEET_ID_CC);
    
    try {
        appSettings = await fetchSettingsCC();
        console.log('⚙️ Settings OK');
        updateStoreStatus();
    } catch(e) {
        console.error('❌ Settings:', e.message);
    }
    
    try {
        const products = await fetchProductsCC('capcut');
        console.log('📦 Products:', products.length);
        renderProducts(products);
    } catch(e) {
        console.error('❌ Products:', e.message);
        productGrid.innerHTML = `<div class="loading-placeholder" style="grid-column:1/-1;color:#ef4444;">❌ Gagal: ${e.message}</div>`;
    }
    
    showLoading(false);
}

function updateStoreStatus() {
    if (!storeStatus || !appSettings) return;
    const open = isStoreOpen(appSettings);
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
            <div class="product-price">${formatRupiah(p.harga)}</div>
            <div class="stock-badge ${stock > 0 ? 'in-stock' : 'out-of-stock'}">${stock > 0 ? `Stok: ${stock}` : 'Habis'}</div>
        `;
        
        if (stock === 0) card.classList.add('disabled');
        productGrid.appendChild(card);
    });
    
    productCount.textContent = products.length + ' Pilihan';
    attachProductListeners();
    if (!isStoreOpen(appSettings)) disableAll();
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
    document.querySelectorAll('.product-card,.payment-card').forEach(c => {
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
    const id = userIdInput.value.trim();
    step1.classList.toggle('active', id.length > 0);
    step2.classList.toggle('active', !!selectedProduct);
    step3.classList.toggle('active', !!selectedPayment);
}

function updateSummary() {
    const id = userIdInput.value.trim();
    summaryId.textContent = id || '-';
    summaryProduct.textContent = selectedProduct ? selectedProduct.product : '-';
    summaryPayment.textContent = selectedPayment || '-';
    
    const bp = selectedProduct ? selectedProduct.price : 0;
    const fee = appSettings && selectedPayment ? calculateAdminFee(bp, selectedPayment, appSettings) : 0;
    const total = bp + fee;
    
    summaryFee.textContent = formatRupiah(fee);
    summaryPrice.textContent = formatRupiah(total);
    feeRow.style.display = (fee > 0 && selectedProduct) ? 'flex' : 'none';
    
    const notes = notesInput.value.trim();
    if (notes && selectedProduct) {
        summaryNotes.textContent = notes;
        summaryNotesRow.style.display = 'flex';
    } else {
        summaryNotesRow.style.display = 'none';
    }
    
    document.getElementById('priceDANA').textContent = bp > 0 ? formatRupiah(bp) : 'Rp 0';
    document.getElementById('priceGoPay').textContent = bp > 0 ? formatRupiah(bp) : 'Rp 0';
    document.getElementById('priceOVO').textContent = bp > 0 ? formatRupiah(bp + calculateAdminFee(bp, 'OVO', appSettings)) : 'Rp 0';
    document.getElementById('priceQRIS').textContent = bp > 0 ? formatRupiah(bp + calculateAdminFee(bp, 'QRIS', appSettings)) : 'Rp 0';
    
    whatsappBtn.disabled = !(id && selectedProduct && selectedPayment && isStoreOpen(appSettings));
    updateProgressSteps();
}

// ========== EVENT LISTENERS ==========
userIdInput.addEventListener('input', updateSummary);
notesInput.addEventListener('input', updateSummary);

whatsappBtn.addEventListener('click', () => {
    if (whatsappBtn.disabled) return;
    const bp = selectedProduct.price;
    const fee = calculateAdminFee(bp, selectedPayment, appSettings);
    
    let message = `🔥 *ORDER CAPCUT PRO - ${appSettings?.nama_toko || 'STAA PAY'}* 🔥%0A%0A`;
    message += `📧 *Email/ID:* ${userIdInput.value.trim()}%0A`;
    message += `⏱️ *Masa Aktif:* ${selectedProduct.product}%0A`;
    message += `💳 *Pembayaran:* ${selectedPayment}%0A`;
    if (fee > 0) message += `🧾 *Biaya Admin:* ${formatRupiah(fee)}%0A`;
    message += `💰 *Total:* ${formatRupiah(bp + fee)}%0A`;
    if (notesInput.value.trim()) message += `📝 *Catatan:* ${notesInput.value.trim()}%0A`;
    message += `%0A⚡ _Mohon diproses ya kak!_ 🙏`;
    
    window.open(`https://wa.me/${appSettings?.nomor_wa || '6289530398848'}?text=${message}`, '_blank');
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
    updateSummary();
});

window.addEventListener('pageshow', e => {
    if (e.persisted) {
        showLoading(false);
        if (appSettings) updateStoreStatus();
    }
});

setTimeout(() => showLoading(false), 4000);