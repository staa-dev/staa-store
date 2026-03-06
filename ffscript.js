// ===== KONFIGURASI BONUS FREE FIRE =====
// Ubah ENABLED ke false untuk menonaktifkan semua bonus
const BONUS_CONFIG = {
    ENABLED: false, // true = bonus aktif, false = bonus nonaktif
    VALUES: {
        // Berlian
        5: 0,
        10: 0,
        12: 0,
        50: 0,
        70: 5,
        100: 0,
        140: 10,
        210: 15,
        355: 25,
        510: 35,
        720: 50,
        1000: 70,
        1450: 100,
        2000: 140,
        6000: 400,
        7290: 500,
        // Membership
        "Membership Mingguan": "20%",
        "Membership Bulanan": "25%"
    }
};

// ===== KONFIGURASI GAME =====
const GAME_CONFIG = {
    name: "Free Fire Indonesia",
    currency: "Diamond",
    region: "Indonesia"
};

// Data
const whatsappNumber = "6285173511500"; // GANTI DENGAN NOMOR WA ANDA

// Elemen
const playerId = document.getElementById('playerId');
const diamondCards = document.querySelectorAll('.diamond-card');
const paymentCards = document.querySelectorAll('.payment-card');
const orderSummary = document.getElementById('orderSummary');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');

// Summary elements
const summaryId = document.getElementById('summaryId');
const summaryDiamond = document.getElementById('summaryDiamond');
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
let selectedDiamond = null;
let selectedPrice = 0;
let selectedPayment = null;
let selectedType = 'diamond'; // 'diamond' atau 'membership'

// ===== FUNGSI UNTUK MENGATUR TAMPILAN BONUS =====
function updateBonusDisplay() {
    console.log('Updating bonus display, ENABLED =', BONUS_CONFIG.ENABLED);
    
    // Loop melalui semua diamond cards
    diamondCards.forEach(card => {
        const bonusElement = card.querySelector('.bonus');
        if (bonusElement) {
            if (BONUS_CONFIG.ENABLED) {
                // Jika bonus aktif, tampilkan bonus
                bonusElement.classList.remove('hidden');
                
                // Update teks bonus sesuai produk
                const diamond = card.dataset.diamond;
                const type = card.dataset.type || 'diamond';
                
                if (type === 'membership') {
                    const bonusValue = BONUS_CONFIG.VALUES[diamond];
                    if (bonusValue) {
                        bonusElement.textContent = `Bonus ${bonusValue}`;
                    }
                } else {
                    const bonusValue = BONUS_CONFIG.VALUES[parseInt(diamond)];
                    if (bonusValue && bonusValue > 0) {
                        bonusElement.textContent = `+${bonusValue} Bonus`;
                    } else {
                        // Sembunyikan bonus jika nilainya 0
                        bonusElement.classList.add('hidden');
                    }
                }
            } else {
                // Jika bonus nonaktif, sembunyikan semua bonus
                bonusElement.classList.add('hidden');
            }
        }
    });
}

// ===== FUNGSI MENDAPATKAN TEKS BONUS UNTUK WHATSAPP =====
function getBonusText(diamond, type) {
    // Jika bonus dinonaktifkan, kembalikan string kosong
    if (!BONUS_CONFIG.ENABLED) return '';
    
    if (type === 'membership') {
        const bonusValue = BONUS_CONFIG.VALUES[diamond];
        return bonusValue ? `+${bonusValue} Bonus Berlian` : '';
    } else {
        const bonusValue = BONUS_CONFIG.VALUES[parseInt(diamond)];
        return bonusValue && bonusValue > 0 ? `+${bonusValue} Diamond Bonus` : '';
    }
}

// ===== FUNGSI UPDATE HARGA PEMBAYARAN =====
function updatePaymentPrices(price) {
    const priceText = price ? `Rp ${price.toLocaleString('id-ID')}` : 'Rp 0';
    priceDANA.textContent = priceText;
    priceOVO.textContent = priceText;
    priceGoPay.textContent = priceText;
    priceQRIS.textContent = priceText;
}

// Panggil saat awal untuk mengatur tampilan bonus
updateBonusDisplay();
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

// ===== PRODUK SELECTION (Berlian & Membership) =====
diamondCards.forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Hapus selected dari semua card
        diamondCards.forEach(c => c.classList.remove('selected'));
        
        // Tambah selected ke card yang diklik
        this.classList.add('selected');
        
        // Simpan data
        selectedDiamond = this.dataset.diamond;
        selectedPrice = parseInt(this.dataset.price);
        selectedType = this.dataset.type || 'diamond';
        
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

// ===== INPUT PLAYER ID =====
playerId.addEventListener('input', () => {
    // Validasi panjang ID (9-10 digit)
    const value = playerId.value;
    if (value.length > 0 && (value.length < 9 || value.length > 10)) {
        playerId.setCustomValidity('ID harus 9-10 digit angka');
    } else {
        playerId.setCustomValidity('');
    }
    
    updateSummary();
    checkForm();
});

// ===== INPUT NOTES =====
notesInput.addEventListener('input', () => {
    updateSummary();
});

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const id = playerId.value.trim();
    const notes = notesInput.value.trim();
    
    if (id && selectedDiamond && selectedPayment) {
        orderSummary.style.display = 'block';
        summaryId.textContent = id;
        
        // Menampilkan produk dengan kata Diamond di belakang (khusus untuk produk Diamond)
        if (selectedType === 'diamond') {
            summaryDiamond.textContent = `${selectedDiamond} Diamond`;
        } else {
            summaryDiamond.textContent = selectedDiamond; // Membership tetap seperti aslinya
        }
        
        summaryPayment.textContent = selectedPayment;
        summaryPrice.textContent = `Rp ${selectedPrice.toLocaleString('id-ID')}`;
        
        // Tampilkan catatan jika ada
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
    const id = playerId.value.trim();
    const isValidId = id.length >= 9 && id.length <= 10 && /^\d+$/.test(id);
    whatsappBtn.disabled = !(isValidId && selectedDiamond && selectedPayment);
}

// ===== SEND TO WHATSAPP =====
whatsappBtn.addEventListener('click', () => {
    const id = playerId.value.trim();
    const notes = notesInput.value.trim();
    
    // Mendapatkan teks produk dengan kata Diamond
    let productText = selectedDiamond;
    if (selectedType === 'diamond') {
        productText = `${selectedDiamond} Diamond`;
    }

    let message = `🎮 *TOP UP ${GAME_CONFIG.name.toUpperCase()}* 🎮
━━━━━━━━━━━━━━━━━━━
📋 *DETAIL PESANAN*
━━━━━━━━━━━━━━━━━━━

🆔 *ID Player:* ${id}
📦 *Produk:* ${productText}
💰 *Harga:* Rp ${selectedPrice.toLocaleString('id-ID')}
💳 *Pembayaran:* ${selectedPayment}`;

    // Tambahkan bonus hanya jika ENABLED true
    if (BONUS_CONFIG.ENABLED) {
        if (selectedType === 'membership') {
            const bonusValue = BONUS_CONFIG.VALUES[selectedDiamond];
            if (bonusValue) {
                message += `\n🎁 *Bonus:* ${bonusValue} Berlian`;
            }
        } else {
            const bonusValue = BONUS_CONFIG.VALUES[parseInt(selectedDiamond)];
            if (bonusValue && bonusValue > 0) {
                message += `\n🎁 *Bonus:* +${bonusValue} Diamond`;
            }
        }
    }

    if (notes) {
        message += `\n📝 *Catatan:* ${notes}`;
    }

    message += `\n\n━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: Rp ${selectedPrice.toLocaleString('id-ID')}*

✅ *Khusus Region Indonesia*
Silahkan konfirmasi pembayaran. Terima kasih! 🙏`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
});

// Tambahkan validasi saat form disubmit
playerId.addEventListener('invalid', (e) => {
    e.preventDefault();
    alert('ID Player harus 9-10 digit angka');
});

// Debugging: Cek apakah bonus muncul
console.log('Script loaded, BONUS_CONFIG.ENABLED =', BONUS_CONFIG.ENABLED);