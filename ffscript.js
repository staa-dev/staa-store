AOS.init({ once: true, duration: 400, offset: 10 });

// ========== THEME ==========
const themeToggle = document.getElementById('themeToggleNav'), body = document.body;
const setTheme = t => {
    if (t === 'dark') { body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme-ff', 'dark'); }
    else { body.removeAttribute('data-theme'); localStorage.setItem('theme-ff', 'light'); }
};
setTheme(localStorage.getItem('theme-ff') || 'light');
themeToggle.addEventListener('click', () => {
    const c = body.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(c === 'dark' ? 'light' : 'dark');
});

// ========== DOM ==========
const playerIdInput     = document.getElementById('playerId'),
      summaryId         = document.getElementById('summaryId'),
      summaryDiamond    = document.getElementById('summaryDiamond'),
      summaryPayment    = document.getElementById('summaryPayment'),
      summaryFee        = document.getElementById('summaryFee'),
      summaryPrice      = document.getElementById('summaryPrice'),
      summaryNotes      = document.getElementById('summaryNotes'),
      summaryNotesRow   = document.getElementById('summaryNotesRow'),
      feeRow            = document.getElementById('feeRow'),
      whatsappBtn       = document.getElementById('whatsappBtn'),
      notesInput        = document.getElementById('notes'),
      diamondGrid       = document.getElementById('diamondProducts'),
      membershipGrid    = document.getElementById('membershipProducts'),
      step1             = document.getElementById('step1'),
      step2             = document.getElementById('step2'),
      step3             = document.getElementById('step3'),
      storeStatus       = document.getElementById('storeStatus'),
      productCount      = document.getElementById('productCount');

// Cek ID DOM
const checkIdBtn          = document.getElementById('checkIdBtn'),
      accountInfoBox      = document.getElementById('accountInfoBox'),
      accountInfoIcon     = document.getElementById('accountInfoIcon'),
      accountInfoText     = document.getElementById('accountInfoText'),
      accountInfoSub      = document.getElementById('accountInfoSub'),
      accountVerifiedBadge= document.getElementById('accountVerifiedBadge'),
      summaryUsernameRow  = document.getElementById('summaryUsernameRow'),
      summaryUsername     = document.getElementById('summaryUsername');

// Voucher DOM
const voucherCodeInput     = document.getElementById('voucherCode'),
      applyVoucherBtn      = document.getElementById('applyVoucherBtn'),
      removeVoucherBtn     = document.getElementById('removeVoucherBtn'),
      voucherInfoBox       = document.getElementById('voucherInfoBox'),
      voucherInfoText      = document.getElementById('voucherInfoText'),
      voucherDiscountBadge = document.getElementById('voucherDiscountBadge'),
      summaryVoucherRow    = document.getElementById('summaryVoucherRow'),
      summaryVoucher       = document.getElementById('summaryVoucher');

// ========== STATE ==========
let selectedProduct  = null,
    selectedPayment  = null,
    activeCategory   = 'diamond',
    appSettings      = null,
    activeVoucher    = null,
    voucherDiscount  = 0;

let verifiedAccount = null;          // { uid, nickname }
let checkAbortController = null;

const FF_STALK_API = 'https://api.ikyyxd.my.id/stalk/epepid?uid=';
const WA_NUMBER   = '6285128002841';

// ========== VOUCHER LIST ==========
const voucherList = [
    {
        code: 'STAAPREM5',
        discount: 2,
        minPurchase: 50000,
        description: 'Diskon 2% untuk pembelian di atas Rp 50.000'
    }
];

// ========== LOAD DATA ==========
async function loadAppData(){
    console.time('⚡ FF Load');
    try {
        const [settings, products] = await Promise.all([
            fetchSettings(),
            fetchProducts('freefire')
        ]);
        appSettings = settings;
        updateStoreStatus();
        renderProducts(products);
        console.timeEnd('⚡ FF Load');
    } catch(e){
        console.error('❌ Load error:', e);
        diamondGrid.innerHTML = '<div class="loading-placeholder" style="color:#ef4444;">❌ Gagal memuat</div>';
    }
}

function updateStoreStatus(){
    if(!storeStatus || !appSettings) return;
    const open = isStoreOpen(appSettings);
    if(open){
        storeStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Official Partner</span>';
        storeStatus.style.background = 'var(--accent-light)';
        storeStatus.style.color = 'var(--accent)';
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
        card.dataset.price   = p.harga;
        card.dataset.type    = p.tipe;
        card.innerHTML = `
            ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
            <div class="product-icon"><i class="fas fa-gem"></i></div>
            <div class="product-amount">${p.nama}</div>
            <div class="product-price">${formatRupiah(p.harga)}</div>
        `;
        if(p.tipe === 'diamond'){ diamondGrid.appendChild(card); dc++; }
        else { membershipGrid.appendChild(card); mc++; }
    });

    if(dc === 0) diamondGrid.innerHTML = '<div class="loading-placeholder">Belum ada produk</div>';
    if(mc === 0) membershipGrid.innerHTML = '<div class="loading-placeholder">Belum ada produk</div>';
    productCount.textContent = products.length + ' Pilihan';
    if(mc === 0) document.querySelector('[data-category="membership"]').style.display = 'none';

    attachProductListeners();
    if(!isStoreOpen(appSettings)) disableAll();
}

function attachProductListeners(){
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            if(card.classList.contains('disabled') || card.dataset.type !== activeCategory) return;
            document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProduct = {
                diamond: card.dataset.diamond,
                price:   parseInt(card.dataset.price),
                type:    card.dataset.type
            };
            if(activeVoucher) removeVoucher();
            updateSummary();
            updateProgressSteps();
        });
    });
}

function disableAll(){
    playerIdInput.disabled = true;
    playerIdInput.placeholder = 'Toko sedang tutup...';
    if(checkIdBtn) checkIdBtn.disabled = true;
    document.querySelectorAll('.product-card,.payment-card').forEach(c => {
        c.classList.add('disabled');
        c.style.pointerEvents = 'none';
    });
    whatsappBtn.disabled = true;
    voucherCodeInput.disabled = true;
    applyVoucherBtn.disabled = true;
}

// ========== CEK ID ==========
function showAccountLoading(){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box active loading';
    accountInfoIcon.className = 'fas fa-spinner fa-spin account-info-icon';
    accountInfoText.textContent = 'Memeriksa ID Player...';
    accountInfoSub.textContent = '';
    accountInfoSub.style.display = 'none';
    accountVerifiedBadge.style.display = 'none';
}

function showAccountSuccess(nickname, uid){
    if(!accountInfoBox) return;
    accountInfoBox.className = 'account-info-box active success';
    accountInfoIcon.className = 'fas fa-user-check account-info-icon';
    accountInfoText.textContent = nickname;
    accountInfoSub.textContent = 'ID: ' + uid;
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

// Parser fleksibel
function extractNickname(data){
    if(!data || typeof data !== 'object') return null;
    const paths = [
        'nickname','username','name','nick','nickName','NickName','playerName',
        'result.nickname','result.username','result.name','result.nick','result.playerName',
        'data.nickname','data.username','data.name','data.nick','data.playerName',
        'result.data.nickname','result.data.username','result.data.name',
        'data.result.nickname','data.result.username','data.result.name',
        'account.nickname','account.username','account.name'
    ];
    for(const p of paths){
        const val = p.split('.').reduce((o,k) => (o && typeof o === 'object') ? o[k] : undefined, data);
        if(typeof val === 'string' && val.trim()) return val.trim();
    }
    return null;
}

async function checkPlayerId(){
    const uid = playerIdInput.value.trim();

    if(!uid || !/^\d+$/.test(uid) || uid.length < 6){
        showAccountError('Masukkan ID Player yang valid (minimal 6 digit angka)');
        return;
    }

    if(checkAbortController) checkAbortController.abort();
    checkAbortController = new AbortController();

    checkIdBtn.classList.add('loading');
    checkIdBtn.disabled = true;
    showAccountLoading();

    try {
        const res = await fetch(FF_STALK_API + encodeURIComponent(uid), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: checkAbortController.signal
        });
        if(!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        const nickname = extractNickname(data);
        if(!nickname) throw new Error('Nickname tidak ditemukan');

        verifiedAccount = { uid, nickname };
        showAccountSuccess(nickname, uid);
        updateSummary();
    } catch(err){
        if(err.name === 'AbortError') return;
        console.error('❌ Check ID error:', err);
        verifiedAccount = null;
        showAccountError('Gagal memeriksa ID. Pastikan ID benar atau coba beberapa saat lagi.');
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

// ========== VOUCHER LOGIC ==========
function applyVoucher(){
    const code = voucherCodeInput.value.trim().toUpperCase();
    resetVoucherUI();

    if(!code){
        showVoucherMessage('⚠️ Silakan masukkan kode voucher terlebih dahulu', 'error');
        voucherCodeInput.focus();
        return;
    }
    if(!selectedProduct){
        showVoucherMessage('⚠️ Pilih produk terlebih dahulu sebelum menggunakan voucher', 'error');
        return;
    }

    applyVoucherBtn.classList.add('loading');
    applyVoucherBtn.disabled = true;

    setTimeout(() => {
        const voucher = voucherList.find(v => v.code === code);

        if(!voucher){
            showVoucherMessage('❌ Kode voucher tidak ditemukan! Periksa kembali kode kamu.', 'error');
            voucherCodeInput.classList.add('error');
            resetApplyButton();
            return;
        }

        if(selectedProduct.price < voucher.minPurchase){
            const minPrice = formatRupiah(voucher.minPurchase);
            const curPrice = formatRupiah(selectedProduct.price);
            showVoucherMessage(`❌ Minimal pembelian ${minPrice} untuk menggunakan voucher ini. Pembelian kamu: ${curPrice}`, 'error');
            voucherCodeInput.classList.add('error');
            resetApplyButton();
            return;
        }

        voucherDiscount = Math.floor(selectedProduct.price * voucher.discount / 100);
        const maxDiscount = 50000;
        if(voucherDiscount > maxDiscount) voucherDiscount = maxDiscount;

        activeVoucher = voucher;
        voucherCodeInput.classList.add('success');
        voucherCodeInput.readOnly = true;

        showVoucherMessage(`✅ Voucher berhasil digunakan! Kamu hemat ${formatRupiah(voucherDiscount)} (${voucher.discount}%)`, 'success');
        voucherDiscountBadge.textContent = `-${formatRupiah(voucherDiscount)}`;
        voucherDiscountBadge.style.display = 'inline-flex';

        removeVoucherBtn.classList.add('active');
        applyVoucherBtn.style.display = 'none';

        resetApplyButton();
        updateSummary();
        document.getElementById('orderSummary').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
}

function removeVoucher(){
    resetVoucherUI();
    if(activeVoucher){
        showVoucherMessage('🗑️ Voucher berhasil dihapus', 'error');
        setTimeout(() => voucherInfoBox.classList.remove('active'), 2000);
    }
    activeVoucher = null;
    voucherDiscount = 0;
    updateSummary();
}

function resetVoucherUI(){
    voucherCodeInput.classList.remove('success', 'error');
    voucherCodeInput.value = '';
    voucherCodeInput.readOnly = false;
    voucherInfoBox.classList.remove('active', 'success', 'error');
    voucherDiscountBadge.style.display = 'none';
    removeVoucherBtn.classList.remove('active');
    applyVoucherBtn.style.display = 'flex';
    resetApplyButton();
}

function resetApplyButton(){
    applyVoucherBtn.classList.remove('loading');
    applyVoucherBtn.disabled = false;
}

function showVoucherMessage(message, type){
    voucherInfoBox.className = `voucher-info-box active ${type}`;
    voucherInfoText.textContent = message;
    voucherDiscountBadge.style.display = (type === 'success') ? 'inline-flex' : 'none';
}

applyVoucherBtn.addEventListener('click', applyVoucher);
removeVoucherBtn.addEventListener('click', removeVoucher);

voucherCodeInput.addEventListener('keypress', e => {
    if(e.key === 'Enter'){
        e.preventDefault();
        if(!voucherCodeInput.readOnly) applyVoucher();
    }
});

voucherCodeInput.addEventListener('input', () => {
    voucherCodeInput.value = voucherCodeInput.value.toUpperCase();
    if(voucherCodeInput.classList.contains('error')){
        voucherCodeInput.classList.remove('error');
        voucherInfoBox.classList.remove('active', 'error');
    }
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
        if(activeVoucher) removeVoucher();
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
    const id = playerIdInput.value.trim(),
          valid = id.length >= 9 && /^\d+$/.test(id);
    step1.classList.toggle('active', valid);
    step2.classList.toggle('active', !!selectedProduct);
    step3.classList.toggle('active', !!selectedPayment);
}

function updateSummary(){
    const id = playerIdInput.value.trim(),
          valid = id.length >= 9 && /^\d+$/.test(id);

    summaryId.textContent = valid ? id : '-';
    summaryDiamond.textContent = selectedProduct ? selectedProduct.diamond : '-';
    summaryPayment.textContent = selectedPayment || '-';

    // Nickname (row biasa seperti row lain)
    if(verifiedAccount && verifiedAccount.nickname){
        summaryUsername.textContent = verifiedAccount.nickname;
        summaryUsernameRow.style.display = 'flex';
    } else {
        summaryUsernameRow.style.display = 'none';
    }

    const bp  = selectedProduct ? selectedProduct.price : 0;
    const fee = (appSettings && selectedPayment) ? calculateAdminFee(bp, selectedPayment, appSettings) : 0;

    const totalBeforeDiscount = bp + fee;
    const total = Math.max(0, totalBeforeDiscount - voucherDiscount);

    summaryFee.textContent = formatRupiah(fee);
    feeRow.style.display = (fee > 0 && selectedProduct) ? 'flex' : 'none';

    if(activeVoucher && voucherDiscount > 0 && selectedProduct){
        summaryVoucher.textContent = `-${formatRupiah(voucherDiscount)} (${activeVoucher.discount}%)`;
        summaryVoucherRow.style.display = 'flex';
    } else {
        summaryVoucherRow.style.display = 'none';
    }

    summaryPrice.textContent = formatRupiah(total);

    const notes = notesInput.value.trim();
    if(notes && selectedProduct){
        summaryNotes.textContent = notes;
        summaryNotesRow.style.display = 'flex';
    } else {
        summaryNotesRow.style.display = 'none';
    }

    document.getElementById('priceDANA').textContent  = bp > 0 ? formatRupiah(totalBeforeDiscount) : 'Rp 0';
    document.getElementById('priceGoPay').textContent = bp > 0 ? formatRupiah(totalBeforeDiscount) : 'Rp 0';
    document.getElementById('priceOVO').textContent   = bp > 0 ? formatRupiah(bp + calculateAdminFee(bp, 'OVO', appSettings)) : 'Rp 0';
    document.getElementById('priceQRIS').textContent  = bp > 0 ? formatRupiah(bp + calculateAdminFee(bp, 'QRIS', appSettings)) : 'Rp 0';

    whatsappBtn.disabled = !(valid && selectedProduct && selectedPayment && isStoreOpen(appSettings));
    updateProgressSteps();
}

// Input ID: hanya angka
playerIdInput.addEventListener('input', () => {
    const cleaned = playerIdInput.value.replace(/\D/g, '');
    if(cleaned !== playerIdInput.value) playerIdInput.value = cleaned;

    const uid = playerIdInput.value.trim();
    if(verifiedAccount && verifiedAccount.uid !== uid){
        verifiedAccount = null;
        hideAccountBox();
    }
    updateSummary();
});

notesInput.addEventListener('input', updateSummary);

// ========== WHATSAPP ==========
whatsappBtn.addEventListener('click', () => {
    if(whatsappBtn.disabled) return;

    const bp  = selectedProduct.price;
    const fee = calculateAdminFee(bp, selectedPayment, appSettings);
    const totalBeforeDiscount = bp + fee;
    const total = Math.max(0, totalBeforeDiscount - voucherDiscount);

    const nickname = (verifiedAccount && verifiedAccount.nickname) ? verifiedAccount.nickname : '-';
    const playerId = playerIdInput.value.trim();

    // ===== Pesan WhatsApp sesuai format =====
    let message = `🔥 *ORDER - STAA PAY* 🔥\n\n`;
    message += `✨*Nickname:* ${nickname}\n`;
    message += `👤 *ID:* ${playerId}\n`;
    message += `💎 *Produk:* ${selectedProduct.diamond}\n`;
    message += `💳 *Pembayaran:* ${selectedPayment}\n`;
    message += `💰 *Total:* ${formatRupiah(total)}\n`;

    if(activeVoucher && voucherDiscount > 0){
        message += `🎟️ *Voucher:* ${activeVoucher.code} (-${formatRupiah(voucherDiscount)})\n`;
    }
    if(notesInput.value.trim()){
        message += `📝 *Catatan:* ${notesInput.value.trim()}\n`;
    }

    message += `\n⚡ _Mohon diproses ya kak!_ 🙏`;

    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
});

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
    updateSummary();
});

window.addEventListener('pageshow', e => {
    if(e.persisted && appSettings) updateStoreStatus();
});