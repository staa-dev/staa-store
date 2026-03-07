// ===== KONFIGURASI STOK PRODUK =====
// Stok diatur di sini dan akan disimpan di localStorage
// Ubah nilai stok sesuai kebutuhan
const PRODUCT_STOCK = {
    "7 Hari": 0,
    "14 Hari": 0,
    "30 Hari": 0,
    "42 Hari": 0
};

// ===== KONFIGURASI GAME =====
const GAME_CONFIG = {
    name: "CapCut Pro",
    currency: "Hari",
    region: "Indonesia"
};

// Data
const whatsappNumber = "6285173511500"; // GANTI DENGAN NOMOR WA ANDA

// Elemen
const userId = document.getElementById('userId');
const productCards = document.querySelectorAll('.product-card');
const paymentCards = document.querySelectorAll('.payment-card');
const orderSummary = document.getElementById('orderSummary');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');

// Summary elements
const summaryId = document.getElementById('summaryId');
const summaryProduct = document.getElementById('summaryProduct');
const summaryPayment = document.getElementById('summaryPayment');
const summaryPrice = document.getElementById('summaryPrice');
const summaryNotesRow = document.getElementById('summaryNotesRow');
const summaryNotes = document.getElementById('summaryNotes');

// Payment price elements
const priceDANA = document.getElementById('priceDANA');
const priceOVO = document.getElementById('priceOVO');
const priceGoPay = document.getElementById('priceGoPay');
const priceQRIS = document.getElementById('priceQRIS');

// State
let selectedProduct = null;
let selectedPrice = 0;
let selectedPayment = null;

// ===== FUNGSI MANAJEMEN STOK =====
let productStock = { ...PRODUCT_STOCK };

// Load stok dari localStorage jika ada
function loadStock() {
    const savedStock = localStorage.getItem('capcut_stock');
    if (savedStock) {
        try {
            productStock = JSON.parse(savedStock);
        } catch (e) {
            console.log('Gagal load stok, menggunakan default');
        }
    }
    updateStockDisplay();
}

// Simpan stok ke localStorage
function saveStock() {
    localStorage.setItem('capcut_stock', JSON.stringify(productStock));
}

// Update tampilan stok (tersembunyi, hanya untuk debugging)
function updateStockDisplay() {
    productCards.forEach(card => {
        const product = card.dataset.product;
        const stock = productStock[product] || 0;
        
        // Update data attribute
        card.dataset.stock = stock;
        
        // Tambah/ubah class out-of-stock
        if (stock <= 0) {
            card.classList.add('out-of-stock');
        } else {
            card.classList.remove('out-of-stock');
        }
    });
}

// Kurangi stok saat produk dipesan
function decreaseStock(product) {
    if (productStock[product] > 0) {
        productStock[product]--;
        saveStock();
        updateStockDisplay();
        return true;
    }
    return false;
}

// Reset stok ke default (untuk debugging)
function resetStock() {
    productStock = { ...PRODUCT_STOCK };
    saveStock();
    updateStockDisplay();
    alert('Stok telah direset ke default');
}

// ===== FUNGSI UPDATE HARGA PEMBAYARAN =====
function updatePaymentPrices(price) {
    const priceText = price ? `Rp ${price.toLocaleString('id-ID')}` : 'Rp 0';
    priceDANA.textContent = priceText;
    priceOVO.textContent = priceText;
    priceGoPay.textContent = priceText;
    priceQRIS.textContent = priceText;
}

// Panggil saat awal
loadStock();
updatePaymentPrices(null);

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const sunIcon = document.querySelector('.fa-sun');
const moonIcon = document.querySelector('.fa-moon');
const themeText = document.getElementById('themeText');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'inline-block';
        themeText.textContent = 'Dark Mode';
    } else {
        sunIcon.style.display = 'inline-block';
        moonIcon.style.display = 'none';
        themeText.textContent = 'Light Mode';
    }
    localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'inline-block';
    themeText.textContent = 'Dark Mode';
}

// ===== PRODUK SELECTION =====
productCards.forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Cek stok
        const stock = parseInt(this.dataset.stock);
        if (stock <= 0) {
            alert('Maaf, stok untuk produk ini sedang habis');
            return;
        }
        
        // Hapus selected dari semua card
        productCards.forEach(c => c.classList.remove('selected'));
        
        // Tambah selected ke card yang diklik
        this.classList.add('selected');
        
        // Simpan data
        selectedProduct = this.dataset.product;
        selectedPrice = parseInt(this.dataset.price);
        
        // Update harga di metode pembayaran
        updatePaymentPrices(selectedPrice);
        
        // Update summary
        updateSummary();
        checkForm();
    });
});

// ===== PAYMENT SELECTION =====
paymentCards.forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault();
        paymentCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        
        selectedPayment = this.dataset.payment;
        
        updateSummary();
        checkForm();
    });
});

// ===== INPUT USER ID =====
userId.addEventListener('input', () => {
    updateSummary();
    checkForm();
});

// ===== INPUT NOTES =====
notesInput.addEventListener('input', updateSummary);

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const id = userId.value.trim();
    const notes = notesInput.value.trim();
    
    if (id && selectedProduct && selectedPayment) {
        orderSummary.style.display = 'block';
        summaryId.textContent = id;
        summaryProduct.textContent = selectedProduct;
        summaryPayment.textContent = selectedPayment;
        summaryPrice.textContent = `Rp ${selectedPrice.toLocaleString('id-ID')}`;
        
        if (notes) {
            summaryNotes.textContent = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;
            summaryNotesRow.style.display = 'flex';
        } else {
            summaryNotesRow.style.display = 'none';
        }
    } else {
        orderSummary.style.display = 'none';
    }
}

// ===== CHECK FORM VALIDITY =====
function checkForm() {
    const id = userId.value.trim();
    const isValidId = id.length > 0;
    
    // Cek apakah produk yang dipilih masih punya stok
    let isStockAvailable = true;
    if (selectedProduct) {
        const stock = productStock[selectedProduct] || 0;
        isStockAvailable = stock > 0;
    }
    
    whatsappBtn.disabled = !(isValidId && selectedProduct && selectedPayment && isStockAvailable);
}

// ===== SEND TO WHATSAPP =====
whatsappBtn.addEventListener('click', () => {
    const id = userId.value.trim();
    const notes = notesInput.value.trim();
    
    // Cek stok sekali lagi sebelum memproses
    if (productStock[selectedProduct] <= 0) {
        alert('Maaf, stok untuk produk ini sudah habis');
        // Reset pilihan
        productCards.forEach(c => c.classList.remove('selected'));
        selectedProduct = null;
        selectedPrice = 0;
        updateSummary();
        checkForm();
        return;
    }
    
    // Kurangi stok
    decreaseStock(selectedProduct);
    
    let message = `🎬 *TOP UP ${GAME_CONFIG.name.toUpperCase()}* 🎬
━━━━━━━━━━━━━━━━━━━
📋 *DETAIL PESANAN*
━━━━━━━━━━━━━━━━━━━

📧 *ID/Email:* ${id}
⏱️ *Masa Aktif:* ${selectedProduct}
💰 *Harga:* Rp ${selectedPrice.toLocaleString('id-ID')}
💳 *Pembayaran:* ${selectedPayment}`;

    if (notes) {
        message += `\n📝 *Catatan:* ${notes}`;
    }

    message += `\n\n━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: Rp ${selectedPrice.toLocaleString('id-ID')}*

✅ *Khusus Region Indonesia*
Proses cepat max 5 menit.
Terima kasih! 🙏`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Reset pilihan setelah order
    productCards.forEach(c => c.classList.remove('selected'));
    selectedProduct = null;
    selectedPrice = 0;
    selectedPayment = null;
    updateSummary();
    checkForm();
});

// ===== DEBUG: Tambahkan tombol reset stok (tersembunyi, tekan F12 untuk akses) =====
console.log('STAA STORE - CapCut Pro');
console.log('Gunakan resetStock() untuk mereset stok ke default');

// Ekspos fungsi reset ke window untuk debugging
window.resetStock = resetStock;