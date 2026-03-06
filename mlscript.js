// ===== KONFIGURASI BONUS =====
const BONUS_CONFIG = {
    ENABLED: true, // true = bonus aktif, false = bonus nonaktif
    VALUES: {
        // Weekly Pass
        "Weekly Pass": "25 Diamond",
        // Diamond (bonus dalam jumlah diamond)
        5: 0,
        12: 0,
        59: 0,
        170: 5,
        214: 7,
        296: 10,
        429: 15,
        514: 18,
        706: 25,
        2195: 80
    }
};

// ===== KONFIGURASI GAME =====
const GAME_CONFIG = {
    name: "Mobile Legends",
    currency: "Diamond",
    region: "Indonesia"
};

// Data
const whatsappNumber = "6285173511500"; // GANTI DENGAN NOMOR WA ANDA

// Elemen
const playerId = document.getElementById('playerId');
const serverId = document.getElementById('serverId');
const diamondCards = document.querySelectorAll('.diamond-card');
const paymentCards = document.querySelectorAll('.payment-card');
const orderSummary = document.getElementById('orderSummary');
const whatsappBtn = document.getElementById('whatsappBtn');
const notesInput = document.getElementById('notes');

// Summary elements
const summaryId = document.getElementById('summaryId');
const summaryServer = document.getElementById('summaryServer');
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
let selectedType = 'diamond';

// ===== FUNGSI UNTUK MENGATUR TAMPILAN BONUS =====
function updateBonusDisplay() {
    diamondCards.forEach(card => {
        const bonusElement = card.querySelector('.bonus');
        if (bonusElement) {
            if (BONUS_CONFIG.ENABLED) {
                bonusElement.classList.remove('hidden');
                
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
                        bonusElement.classList.add('hidden');
                    }
                }
            } else {
                bonusElement.classList.add('hidden');
            }
        }
    });
}

// ===== FUNGSI MENDAPATKAN TEKS BONUS =====
function getBonusText(diamond, type) {
    if (!BONUS_CONFIG.ENABLED) return '';
    
    if (type === 'membership') {
        const bonusValue = BONUS_CONFIG.VALUES[diamond];
        return bonusValue ? `+${bonusValue}` : '';
    } else {
        const bonusValue = BONUS_CONFIG.VALUES[parseInt(diamond)];
        return bonusValue && bonusValue > 0 ? `+${bonusValue} Diamond` : '';
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

// Panggil saat awal
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

// ===== PRODUK SELECTION =====
diamondCards.forEach(card => {
    card.addEventListener('click', function(e) {
        e.preventDefault();
        diamondCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        
        selectedDiamond = this.dataset.diamond;
        selectedPrice = parseInt(this.dataset.price);
        selectedType = this.dataset.type || 'diamond';
        
        updatePaymentPrices(selectedPrice);
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

// ===== INPUT PLAYER ID & SERVER =====
function validateInputs() {
    const id = playerId.value.trim();
    const server = serverId.value.trim();
    
    // Validasi ID
    if (id.length > 0 && (id.length < 6 || id.length > 10)) {
        playerId.setCustomValidity('ID harus 6-10 digit angka');
    } else {
        playerId.setCustomValidity('');
    }
    
    // Validasi Server
    if (server.length > 0 && server.length !== 4) {
        serverId.setCustomValidity('Server harus 4 digit angka');
    } else {
        serverId.setCustomValidity('');
    }
    
    updateSummary();
    checkForm();
}

playerId.addEventListener('input', validateInputs);
serverId.addEventListener('input', validateInputs);

// ===== INPUT NOTES =====
notesInput.addEventListener('input', updateSummary);

// ===== UPDATE SUMMARY =====
function updateSummary() {
    const id = playerId.value.trim();
    const server = serverId.value.trim();
    const notes = notesInput.value.trim();
    
    if (id && server && selectedDiamond && selectedPayment) {
        orderSummary.style.display = 'block';
        summaryId.textContent = id;
        summaryServer.textContent = server;
        
        if (selectedType === 'diamond') {
            summaryDiamond.textContent = `${selectedDiamond} Diamond`;
        } else {
            summaryDiamond.textContent = selectedDiamond;
        }
        
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
    const id = playerId.value.trim();
    const server = serverId.value.trim();
    const isValidId = id.length >= 6 && id.length <= 10 && /^\d+$/.test(id);
    const isValidServer = server.length === 4 && /^\d+$/.test(server);
    
    whatsappBtn.disabled = !(isValidId && isValidServer && selectedDiamond && selectedPayment);
}

// ===== SEND TO WHATSAPP =====
whatsappBtn.addEventListener('click', () => {
    const id = playerId.value.trim();
    const server = serverId.value.trim();
    const notes = notesInput.value.trim();
    
    let productText = selectedDiamond;
    if (selectedType === 'diamond') {
        productText = `${selectedDiamond} Diamond`;
    }

    let message = `🎮 *TOP UP ${GAME_CONFIG.name.toUpperCase()}* 🎮
━━━━━━━━━━━━━━━━━━━
📋 *DETAIL PESANAN*
━━━━━━━━━━━━━━━━━━━

🆔 *ID Player:* ${id} (${server})
📦 *Produk:* ${productText}
💰 *Harga:* Rp ${selectedPrice.toLocaleString('id-ID')}
💳 *Pembayaran:* ${selectedPayment}`;

    if (BONUS_CONFIG.ENABLED) {
        if (selectedType === 'membership') {
            const bonusValue = BONUS_CONFIG.VALUES[selectedDiamond];
            if (bonusValue) {
                message += `\n🎁 *Bonus:* ${bonusValue}`;
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