// ===== KONFIGURASI =====
const CONFIG = {
    whatsapp: "6285173511500",
    gameName: "Free Fire",
    
    // Konfigurasi biaya admin per metode pembayaran
    fees: {
        DANA: { fixed: 0, percent: 0 },
        OVO: { fixed: 0, percent: 0.5 },
        GoPay: { fixed: 0, percent: 0 },
        QRIS: { fixed: 0, percent: 0.7 }
    }
};

// ===== STATE =====
let selectedProduct = null;
let selectedPrice = 0;
let selectedPayment = null;
let selectedType = 'diamond';
let basePrice = 0;
let currentInvoice = '';

// ===== ELEMENTS =====
const playerId = document.getElementById('playerId');
const productCards = document.querySelectorAll('.product-card');
const paymentCards = document.querySelectorAll('.payment-card');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');
const orderSummary = document.getElementById('orderSummary');

// Summary elements
const summaryId = document.getElementById('summaryId');
const summaryDiamond = document.getElementById('summaryDiamond');
const summaryPayment = document.getElementById('summaryPayment');
const summaryPrice = document.getElementById('summaryPrice');
const summaryFee = document.getElementById('summaryFee');
const summaryNotesRow = document.getElementById('summaryNotesRow');
const summaryNotes = document.getElementById('summaryNotes');

// Payment price elements
const priceDANA = document.getElementById('priceDANA');
const priceOVO = document.getElementById('priceOVO');
const priceGoPay = document.getElementById('priceGoPay');
const priceQRIS = document.getElementById('priceQRIS');

// ===== FUNGSI GENERATE INVOICE =====
function generateInvoice() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let invoice = '';
    for (let i = 0; i < 6; i++) {
        invoice += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return invoice;
}

// ===== FUNGSI HITUNG BIAYA ADMIN =====
function calculateTotalPrice(basePrice, paymentMethod) {
    const fee = CONFIG.fees[paymentMethod] || { fixed: 0, percent: 0 };
    const percentAmount = (basePrice * fee.percent) / 100;
    return Math.round(basePrice + fee.fixed + percentAmount);
}

// ===== FUNGSI UPDATE SEMUA HARGA =====
function updateAllPaymentPrices(basePrice) {
    if (!basePrice) return;
    
    priceDANA.textContent = `Rp ${calculateTotalPrice(basePrice, 'DANA').toLocaleString('id-ID')}`;
    priceOVO.textContent = `Rp ${calculateTotalPrice(basePrice, 'OVO').toLocaleString('id-ID')}`;
    priceGoPay.textContent = `Rp ${calculateTotalPrice(basePrice, 'GoPay').toLocaleString('id-ID')}`;
    priceQRIS.textContent = `Rp ${calculateTotalPrice(basePrice, 'QRIS').toLocaleString('id-ID')}`;
}

// ===== FUNGSI GENERATE INVOICE BARU =====
function generateNewInvoice() {
    currentInvoice = generateInvoice();
    return currentInvoice;
}

// ===== INITIALIZE =====
function init() {
    AOS.init({ duration: 800, once: true });
    
    // Generate invoice pertama
    generateNewInvoice();
    
    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.products-grid').forEach(g => g.classList.remove('active'));
            
            this.classList.add('active');
            const category = this.dataset.category;
            document.getElementById(category + 'Products').classList.add('active');
        });
    });
    
    // Product click
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            productCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedType = this.dataset.type || 'diamond';
            basePrice = parseInt(this.dataset.price);
            
            if (selectedType === 'diamond') {
                selectedProduct = this.dataset.diamond + ' Diamond';
            } else {
                selectedProduct = this.dataset.diamond;
            }
            
            updateAllPaymentPrices(basePrice);
            
            if (selectedPayment) {
                updateSummary();
            }
            
            checkForm();
            updateSteps();
        });
    });
    
    // Payment click
    paymentCards.forEach(card => {
        card.addEventListener('click', function() {
            paymentCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedPayment = this.dataset.payment;
            
            if (basePrice > 0) {
                updateSummary();
            }
            
            checkForm();
            updateSteps();
        });
    });
    
    // Player ID input
    playerId.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        updateSummary();
        checkForm();
        updateSteps();
    });
    
    // Notes input
    notesInput.addEventListener('input', updateSummary);
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggleNav');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('ffTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
        });
        
        if (localStorage.getItem('ffTheme') === 'dark') {
            document.body.classList.add('dark');
        }
    }
    
    console.log('Free Fire initialized');
}

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const id = playerId.value.trim();
    const notes = notesInput.value.trim();
    
    if (id && selectedProduct && selectedPayment) {
        orderSummary.style.display = 'block';
        summaryId.textContent = id;
        summaryDiamond.textContent = selectedProduct;
        summaryPayment.textContent = selectedPayment;
        
        const totalPrice = calculateTotalPrice(basePrice, selectedPayment);
        summaryPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
        
        const fee = CONFIG.fees[selectedPayment] || { fixed: 0, percent: 0 };
        const percentAmount = (basePrice * fee.percent) / 100;
        const totalFee = fee.fixed + percentAmount;
        
        if (totalFee > 0) {
            summaryFee.textContent = `Rp ${Math.round(totalFee).toLocaleString('id-ID')}`;
            document.getElementById('feeRow').style.display = 'flex';
        } else {
            summaryFee.textContent = 'Rp 0';
        }
        
        if (notes) {
            summaryNotes.textContent = notes;
            summaryNotesRow.style.display = 'flex';
        } else {
            summaryNotesRow.style.display = 'none';
        }
    } else {
        orderSummary.style.display = 'none';
    }
}

function checkForm() {
    const id = playerId.value.trim();
    const isValidId = id.length >= 9 && id.length <= 10 && /^\d+$/.test(id);
    whatsappBtn.disabled = !(isValidId && selectedProduct && selectedPayment);
}

function updateSteps() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    
    if (playerId.value.trim().length >= 9) {
        step1.classList.add('active');
    }
    
    if (selectedProduct) {
        step2.classList.add('active');
    }
    
    if (selectedPayment) {
        step3.classList.add('active');
    }
}

// ===== WHATSAPP BUTTON =====
whatsappBtn.addEventListener('click', () => {
    const id = playerId.value.trim();
    const notes = notesInput.value.trim();
    const totalPrice = calculateTotalPrice(basePrice, selectedPayment);
    const fee = CONFIG.fees[selectedPayment] || { fixed: 0, percent: 0 };
    
    // Generate invoice baru setiap kali klik WhatsApp
    const invoiceNumber = generateNewInvoice();
    
    let message = `🎮 *TOP UP ${CONFIG.gameName.toUpperCase()}* 🎮\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n`;
    message += `🧾 *INVOICE: ${invoiceNumber}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 *DETAIL PESANAN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `🆔 *ID Player:* ${id}\n`;
    message += `📦 *Produk:* ${selectedProduct}\n`;
    message += `💰 *Harga Produk:* Rp ${basePrice.toLocaleString('id-ID')}\n`;
    
    if (fee.percent > 0) {
        const percentAmount = (basePrice * fee.percent) / 100;
        message += `💳 *Biaya Admin:* ${fee.percent}% (Rp ${Math.round(percentAmount).toLocaleString('id-ID')})\n`;
    }
    
    message += `💳 *Pembayaran:* ${selectedPayment}\n`;
    
    if (notes) message += `📝 *Catatan:* ${notes}\n`;
    
    message += `\n━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL: Rp ${totalPrice.toLocaleString('id-ID')}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✅ *Proses max 10 menit*\n`;
    message += `📌 *Simpan nomor invoice untuk memudahkan jika ada kendala*\n\n`;
    message += `Silahkan konfirmasi pembayaran. Terima kasih! 🙏`;
    
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
});

// Start
init();