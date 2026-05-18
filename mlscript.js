// Inisialisasi AOS
AOS.init({
    once: true,
    duration: 600,
    offset: 20,
});

// ========== THEME TOGGLE ==========
const themeToggle = document.getElementById('themeToggleNav');
const body = document.body;

const setTheme = (theme) => {
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme-ml', 'dark');
    } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme-ml', 'light');
    }
};

const savedTheme = localStorage.getItem('theme-ml') || 'light';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = body.hasAttribute('data-theme') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// ========== DOM ELEMENTS ==========
const playerIdInput = document.getElementById('playerId');
const serverIdInput = document.getElementById('serverId');
const productCards = document.querySelectorAll('.product-card');
const paymentCards = document.querySelectorAll('.payment-card');
const summaryId = document.getElementById('summaryId');
const summaryServer = document.getElementById('summaryServer');
const summaryDiamond = document.getElementById('summaryDiamond');
const summaryPayment = document.getElementById('summaryPayment');
const summaryFee = document.getElementById('summaryFee');
const summaryPrice = document.getElementById('summaryPrice');
const summaryNotes = document.getElementById('summaryNotes');
const summaryNotesRow = document.getElementById('summaryNotesRow');
const feeRow = document.getElementById('feeRow');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');
const categoryTabs = document.querySelectorAll('.category-tab');
const diamondGrid = document.getElementById('diamondProducts');
const membershipGrid = document.getElementById('membershipProducts');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

let selectedProduct = null;
let selectedPayment = null;
let activeCategory = 'diamond';

// ========== CATEGORY TABS ==========
categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.category;

        if (activeCategory === 'diamond') {
            diamondGrid.classList.add('active');
            membershipGrid.classList.remove('active');
        } else {
            diamondGrid.classList.remove('active');
            membershipGrid.classList.add('active');
        }

        deselectProducts();
        updateSummary();
        updateProgressSteps();
    });
});

function deselectProducts() {
    productCards.forEach(c => c.classList.remove('selected'));
    selectedProduct = null;
}

// ========== PRODUCT SELECTION ==========
productCards.forEach(card => {
    card.addEventListener('click', () => {
        if (card.dataset.type !== activeCategory) return;

        productCards.forEach(c => c.classList.remove('selected'));
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

// ========== PAYMENT SELECTION ==========
paymentCards.forEach(card => {
    card.addEventListener('click', () => {
        paymentCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedPayment = card.dataset.payment;
        updateSummary();
        updateProgressSteps();
    });
});

// ========== PROGRESS STEPS ==========
function updateProgressSteps() {
    const playerId = playerIdInput.value.trim();
    const serverId = serverIdInput.value.trim();
    const isPlayerIdValid = playerId.length >= 6 && playerId.length <= 12 && /^\d+$/.test(playerId);
    const isServerIdValid = serverId.length === 4 && /^\d+$/.test(serverId);
    const isIdComplete = isPlayerIdValid && isServerIdValid;

    if (isIdComplete) {
        step1.classList.add('active');
    } else {
        step1.classList.remove('active');
    }

    if (selectedProduct) {
        step2.classList.add('active');
    } else {
        step2.classList.remove('active');
    }

    if (selectedPayment) {
        step3.classList.add('active');
    } else {
        step3.classList.remove('active');
    }
}

// ========== UPDATE SUMMARY ==========
function updateSummary() {
    const playerId = playerIdInput.value.trim();
    const serverId = serverIdInput.value.trim();
    const isPlayerIdValid = playerId.length >= 6 && playerId.length <= 12 && /^\d+$/.test(playerId);
    const isServerIdValid = serverId.length === 4 && /^\d+$/.test(serverId);

    summaryId.textContent = isPlayerIdValid ? playerId : '-';
    summaryServer.textContent = isServerIdValid ? serverId : '-';

    summaryDiamond.textContent = selectedProduct ? selectedProduct.diamond : '-';
    summaryPayment.textContent = selectedPayment || '-';

    let basePrice = selectedProduct ? selectedProduct.price : 0;
    let feePercent = 0;
    if (selectedPayment === 'OVO') feePercent = 0.005;
    else if (selectedPayment === 'QRIS') feePercent = 0.007;
    const feeAmount = Math.round(basePrice * feePercent);
    const total = basePrice + feeAmount;

    summaryFee.textContent = 'Rp ' + feeAmount.toLocaleString('id-ID');
    summaryPrice.textContent = 'Rp ' + total.toLocaleString('id-ID');

    if (feeAmount > 0 && selectedProduct) {
        feeRow.style.display = 'flex';
    } else {
        feeRow.style.display = 'none';
    }

    const notes = notesInput.value.trim();
    if (notes && selectedProduct) {
        summaryNotes.textContent = notes;
        summaryNotesRow.style.display = 'flex';
    } else {
        summaryNotesRow.style.display = 'none';
    }

    document.getElementById('priceDANA').textContent = basePrice > 0 ? 'Rp ' + basePrice.toLocaleString('id-ID') : 'Rp 0';
    document.getElementById('priceOVO').textContent = basePrice > 0 ? 'Rp ' + Math.round(basePrice * 1.005).toLocaleString('id-ID') : 'Rp 0';
    document.getElementById('priceGoPay').textContent = basePrice > 0 ? 'Rp ' + basePrice.toLocaleString('id-ID') : 'Rp 0';
    document.getElementById('priceQRIS').textContent = basePrice > 0 ? 'Rp ' + Math.round(basePrice * 1.007).toLocaleString('id-ID') : 'Rp 0';

    const isFormValid = isPlayerIdValid && isServerIdValid && selectedProduct && selectedPayment;
    whatsappBtn.disabled = !isFormValid;

    updateProgressSteps();
}

// ========== EVENT LISTENERS ==========
playerIdInput.addEventListener('input', updateSummary);
serverIdInput.addEventListener('input', updateSummary);
notesInput.addEventListener('input', updateSummary);

// ========== WHATSAPP BUTTON ==========
whatsappBtn.addEventListener('click', () => {
    if (whatsappBtn.disabled) return;

    const playerId = playerIdInput.value.trim();
    const serverId = serverIdInput.value.trim();
    const product = selectedProduct.diamond;
    const payment = selectedPayment;
    let basePrice = selectedProduct.price;
    let feePercent = 0;
    if (payment === 'OVO') feePercent = 0.005;
    else if (payment === 'QRIS') feePercent = 0.007;
    const feeAmount = Math.round(basePrice * feePercent);
    const total = basePrice + feeAmount;
    const notes = notesInput.value.trim();

    let message = `🔥 *ORDER MOBILE LEGENDS - STAA STORE* 🔥%0A%0A`;
    message += `👤 *ID Player:* ${playerId}%0A`;
    message += `🖥️ *Server:* ${serverId}%0A`;
    message += `💎 *Produk:* ${product}%0A`;
    message += `💳 *Pembayaran:* ${payment}%0A`;
    if (feeAmount > 0) message += `🧾 *Biaya Admin:* Rp ${feeAmount.toLocaleString('id-ID')}%0A`;
    message += `💰 *Total Bayar:* Rp ${total.toLocaleString('id-ID')}%0A`;
    if (notes) message += `📝 *Catatan:* ${notes}%0A`;
    message += `%0A⚡ _Mohon diproses ya kak, terima kasih!_ 🙏`;

    const waNumber = '6289530398848';
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
});

// ========== INITIAL STATE ==========
updateSummary();