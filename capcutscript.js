// ================= CONFIG =================
const CONFIG = {
    whatsapp: "6285173511500",
    gameName: "CapCut Pro",
    fees: {
        DANA: { percent: 0 },
        OVO: { percent: 0.5 },
        GoPay: { percent: 0 },
        QRIS: { percent: 0.7 }
    }
};

// ================= STOCK =================
const DEFAULT_STOCK = {
    "7 Hari": 0,
    "14 Hari": 0,
    "30 Hari": 0,
    "42 Hari": 0
};

let productStock = { ...DEFAULT_STOCK };

// ================= STATE =================
let selectedProduct = null;
let selectedPayment = null;
let basePrice = 0;

// ================= ELEMENT =================
const userId = document.getElementById("userId");
const productCards = document.querySelectorAll(".product-card");
const paymentCards = document.querySelectorAll(".payment-card");
const whatsappBtn = document.getElementById("whatsappBtn");
const notesInput = document.getElementById("notes");

const summaryId = document.getElementById("summaryId");
const summaryProduct = document.getElementById("summaryProduct");
const summaryPayment = document.getElementById("summaryPayment");
const summaryPrice = document.getElementById("summaryPrice");
const summaryFee = document.getElementById("summaryFee");
const summaryNotes = document.getElementById("summaryNotes");
const summaryNotesRow = document.getElementById("summaryNotesRow");
const orderSummary = document.getElementById("orderSummary");

const priceDANA = document.getElementById("priceDANA");
const priceOVO = document.getElementById("priceOVO");
const priceGoPay = document.getElementById("priceGoPay");
const priceQRIS = document.getElementById("priceQRIS");

// ================= FUNCTIONS =================

// hitung total harga
function calculateTotal(price, payment) {
    const percent = CONFIG.fees[payment]?.percent || 0;
    return Math.round(price + (price * percent / 100));
}

// update harga semua payment
function updatePrices(price) {
    priceDANA.textContent = "Rp " + calculateTotal(price,"DANA").toLocaleString("id-ID");
    priceOVO.textContent = "Rp " + calculateTotal(price,"OVO").toLocaleString("id-ID");
    priceGoPay.textContent = "Rp " + calculateTotal(price,"GoPay").toLocaleString("id-ID");
    priceQRIS.textContent = "Rp " + calculateTotal(price,"QRIS").toLocaleString("id-ID");
}

// update stok tampilan
function updateStockDisplay(){
    productCards.forEach(card=>{
        const product = card.dataset.product;
        const stock = productStock[product] || 0;

        card.dataset.stock = stock;

        const badge = card.querySelector(".stock-badge");

        badge.textContent = "Stok: " + stock;

        if(stock <= 0){
            card.classList.add("out-of-stock");
        }else{
            card.classList.remove("out-of-stock");
        }
    });
}

// cek form valid
function checkForm(){
    const id = userId.value.trim();
    const stockOk = selectedProduct ? productStock[selectedProduct] > 0 : false;

    whatsappBtn.disabled = !(id && selectedProduct && selectedPayment && stockOk);
}

// update summary
function updateSummary(){

    const id = userId.value.trim();
    const notes = notesInput.value.trim();

    if(!(id && selectedProduct && selectedPayment)){

        orderSummary.style.display="none";
        return;
    }

    orderSummary.style.display="block";

    summaryId.textContent = id;
    summaryProduct.textContent = selectedProduct;
    summaryPayment.textContent = selectedPayment;

    const total = calculateTotal(basePrice,selectedPayment);
    summaryPrice.textContent = "Rp " + total.toLocaleString("id-ID");

    const fee = total - basePrice;
    summaryFee.textContent = "Rp " + fee.toLocaleString("id-ID");

    if(notes){
        summaryNotesRow.style.display="flex";
        summaryNotes.textContent = notes;
    }else{
        summaryNotesRow.style.display="none";
    }
}

// ================= EVENTS =================

// pilih produk
productCards.forEach(card=>{
    card.onclick = ()=>{

        const stock = parseInt(card.dataset.stock);

        if(stock <= 0){
            alert("Stok produk habis");
            return;
        }

        productCards.forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");

        selectedProduct = card.dataset.product;
        basePrice = parseInt(card.dataset.price);

        updatePrices(basePrice);
        updateSummary();
        checkForm();
    };
});

// pilih pembayaran
paymentCards.forEach(card=>{
    card.onclick = ()=>{
        paymentCards.forEach(c=>c.classList.remove("selected"));
        card.classList.add("selected");

        selectedPayment = card.dataset.payment;

        updateSummary();
        checkForm();
    };
});

// input id
userId.oninput = ()=>{
    updateSummary();
    checkForm();
};

// notes
notesInput.oninput = updateSummary;

// ================= WHATSAPP =================
whatsappBtn.onclick = ()=>{

    if(productStock[selectedProduct] <= 0){
        alert("Stok sudah habis");
        return;
    }

    productStock[selectedProduct]--;

    const id = userId.value.trim();
    const notes = notesInput.value.trim();

    const total = calculateTotal(basePrice,selectedPayment);

    let message =
`🎬 *TOP UP CAPCUT PRO*

📧 ID/Email : ${id}
⏱ Masa Aktif : ${selectedProduct}
💳 Pembayaran : ${selectedPayment}
💰 Harga : Rp ${total.toLocaleString("id-ID")}

${notes ? "📝 Catatan : "+notes : ""}

Terima kasih 🙏`;

    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`);
};
// ================= THEME TOGGLE =================
const themeToggle = document.getElementById("themeToggleNav");

if(themeToggle){

    themeToggle.onclick = ()=>{

        document.body.classList.toggle("dark");

        const mode = document.body.classList.contains("dark") ? "dark" : "light";

        localStorage.setItem("capcutTheme", mode);

    };

    // load tema saat halaman dibuka
    if(localStorage.getItem("capcutTheme") === "dark"){
        document.body.classList.add("dark");
    }

}
// ================= INIT =================
AOS.init({duration:800,once:true});
updateStockDisplay();