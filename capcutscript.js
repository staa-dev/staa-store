// ========== KONFIGURASI ==========
const SHEET_ID_CC = '1ufY0TsHeUwDdBeC_duEtQi439HVPuI6xn7aXpjcLozg';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSDrzoeqBwvFHO5TKQrzr3ChzvyKynr5XOAXKI40RjetE90edWhmwPV_dBvRRpr_nRrQ/exec'; // GANTI DENGAN URL KAMU
const WA_NUMBER = '6289530398848';

// ... (kode lainnya tetap sama) ...

// ========== FUNGSI UPDATE STOK ==========
async function updateStock(productName, quantity = 1) {
    try {
        console.log(`📦 Update stok: ${productName} -${quantity}`);
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sheet: 'capcut',
                product: productName,
                quantity: quantity
            })
        });
        
        console.log('✅ Stok updated (request sent)');
        return true;
    } catch(e) {
        console.error('❌ Gagal update stok:', e);
        return false;
    }
}

// ========== WHATSAPP BUTTON (UPDATED) ==========
whatsappBtn.addEventListener('click', async () => {
    if (whatsappBtn.disabled) return;
    
    const bp = selectedProduct.price;
    const fee = calcFee(bp, selectedPayment, appSettings);
    const total = bp + fee;
    const productName = selectedProduct.product;
    
    // 🔥 KIRIM PESAN WHATSAPP DULU
    let msg = `🔥 *ORDER CAPCUT PRO - ${appSettings?.nama_toko || 'STAA PAY'}* 🔥%0A%0A`;
    msg += `📧 *Email/ID:* ${userIdInput.value.trim()}%0A`;
    msg += `⏱️ *Masa Aktif:* ${productName}%0A`;
    msg += `💳 *Pembayaran:* ${selectedPayment}%0A`;
    if (fee > 0) msg += `🧾 *Biaya Admin:* ${formatRupiah(fee)}%0A`;
    msg += `💰 *Total:* ${formatRupiah(total)}%0A`;
    if (notesInput.value.trim()) msg += `📝 *Catatan:* ${notesInput.value.trim()}%0A`;
    msg += `%0A⚡ _Mohon diproses ya kak!_ 🙏`;
    
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
    
    // 🔥 UPDATE STOK (KURANGI 1)
    await updateStock(productName, 1);
    
    // 🔥 RELOAD PRODUK SETELAH 2 DETIK (biar stok terupdate)
    setTimeout(async () => {
        try {
            const products = await fetchSheetCSV('capcut');
            renderProducts(products.filter(p => p.aktif !== '0'));
        } catch(e) {}
    }, 2000);
});