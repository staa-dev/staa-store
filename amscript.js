AOS.init({ once: true, duration: 600, offset: 20 });

// ========== THEME (FIXED) ==========
const themeToggle = document.getElementById('themeToggleNav');
const body = document.body;

// Cek localStorage
if (localStorage.getItem('theme-am') === 'dark') {
    body.classList.add('dark');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('theme-am', isDark ? 'dark' : 'light');
});

// ========== DOM ==========
const userIdInput=document.getElementById('userId'),summaryId=document.getElementById('summaryId'),summaryProduct=document.getElementById('summaryProduct'),summaryPayment=document.getElementById('summaryPayment'),summaryFee=document.getElementById('summaryFee'),summaryPrice=document.getElementById('summaryPrice'),summaryNotes=document.getElementById('summaryNotes'),summaryNotesRow=document.getElementById('summaryNotesRow'),feeRow=document.getElementById('feeRow'),whatsappBtn=document.getElementById('whatsappBtn'),notesInput=document.getElementById('notes'),productGrid=document.getElementById('productOptions'),step1=document.getElementById('step1'),step2=document.getElementById('step2'),step3=document.getElementById('step3'),storeStatus=document.getElementById('storeStatus'),productCount=document.getElementById('productCount');
let selectedProduct=null,selectedPayment=null,appSettings=null;

function showLoading(s){const o=document.getElementById('loadingOverlay');if(o){if(s)o.classList.add('active');else o.classList.remove('active')}}

async function loadAppData(){showLoading(true);
    try{appSettings=await fetchSettings();updateStoreStatus()}catch(e){}
    try{const products=await fetchProducts('alightmotion');renderProducts(products)}catch(e){productGrid.innerHTML='<div class="loading-placeholder" style="color:#ef4444;">❌ Gagal memuat produk</div>'}
    showLoading(false)}

function updateStoreStatus(){if(!storeStatus||!appSettings)return;const open=isStoreOpen(appSettings);if(open){storeStatus.innerHTML='<i class="fas fa-check-circle"></i><span>Reseller Resmi</span>';storeStatus.style.background='var(--brand-light)';storeStatus.style.color='var(--brand)'}else{storeStatus.innerHTML='<i class="fas fa-clock"></i><span>Toko Tutup</span>';storeStatus.style.background='rgba(239,68,68,0.15)';storeStatus.style.color='#ef4444'}}

function renderProducts(products){productGrid.innerHTML='';if(products.length===0){productGrid.innerHTML='<div class="loading-placeholder">Belum ada produk</div>';productCount.textContent='0 Pilihan';return}
    products.forEach(p=>{const card=document.createElement('div');card.className='product-card';card.dataset.product=p.nama;card.dataset.price=p.harga;card.dataset.stock=p.stok||'0';const stock=parseInt(p.stok||'0');
        card.innerHTML=`${p.badge?`<div class="product-badge">${p.badge}</div>`:''}<div class="product-icon"><i class="fas fa-film"></i></div><div class="product-amount">${p.nama}</div><div class="product-price">${formatRupiah(p.harga)}</div><div class="stock-badge ${stock>0?'in-stock':'out-of-stock'}">${stock>0?`Stok: ${stock}`:'Habis'}</div>`;
        if(stock===0)card.classList.add('disabled');productGrid.appendChild(card)});
    productCount.textContent=products.length+' Pilihan';attachProductListeners();if(!isStoreOpen(appSettings))disableAll()}

function attachProductListeners(){document.querySelectorAll('.product-card').forEach(card=>{card.addEventListener('click',()=>{if(card.classList.contains('disabled'))return;document.querySelectorAll('.product-card').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');selectedProduct={product:card.dataset.product,price:parseInt(card.dataset.price),stock:parseInt(card.dataset.stock)};updateSummary();updateProgressSteps()})})}

function disableAll(){userIdInput.disabled=true;userIdInput.placeholder='Toko sedang tutup...';document.querySelectorAll('.product-card,.payment-card').forEach(c=>{c.classList.add('disabled');c.style.pointerEvents='none'});whatsappBtn.disabled=true}

document.querySelectorAll('.payment-card').forEach(card=>{card.addEventListener('click',()=>{if(card.classList.contains('disabled'))return;document.querySelectorAll('.payment-card').forEach(c=>c.classList.remove('selected'));card.classList.add('selected');selectedPayment=card.dataset.payment;updateSummary();updateProgressSteps()})});

function updateProgressSteps(){const id=userIdInput.value.trim();step1.classList.toggle('active',id.length>0);step2.classList.toggle('active',!!selectedProduct);step3.classList.toggle('active',!!selectedPayment)}

function updateSummary(){const id=userIdInput.value.trim(),valid=id.length>0;summaryId.textContent=valid?id:'-';summaryProduct.textContent=selectedProduct?selectedProduct.product:'-';summaryPayment.textContent=selectedPayment||'-';const bp=selectedProduct?selectedProduct.price:0,fee=appSettings&&selectedPayment?calculateAdminFee(bp,selectedPayment,appSettings):0,total=bp+fee;summaryFee.textContent=formatRupiah(fee);summaryPrice.textContent=formatRupiah(total);feeRow.style.display=(fee>0&&selectedProduct)?'flex':'none';const notes=notesInput.value.trim();if(notes&&selectedProduct){summaryNotes.textContent=notes;summaryNotesRow.style.display='flex'}else{summaryNotesRow.style.display='none'}document.getElementById('priceDANA').textContent=bp>0?formatRupiah(bp):'Rp 0';document.getElementById('priceGoPay').textContent=bp>0?formatRupiah(bp):'Rp 0';document.getElementById('priceOVO').textContent=bp>0?formatRupiah(bp+calculateAdminFee(bp,'OVO',appSettings)):'Rp 0';document.getElementById('priceQRIS').textContent=bp>0?formatRupiah(bp+calculateAdminFee(bp,'QRIS',appSettings)):'Rp 0';whatsappBtn.disabled=!(valid&&selectedProduct&&selectedPayment&&isStoreOpen(appSettings));updateProgressSteps()}

userIdInput.addEventListener('input',updateSummary);notesInput.addEventListener('input',updateSummary);

whatsappBtn.addEventListener('click',()=>{if(whatsappBtn.disabled)return;const bp=selectedProduct.price,fee=calculateAdminFee(bp,selectedPayment,appSettings);sendWhatsApp({namaToko:appSettings?.nama_toko||'STAA PAY',waNumber:'6289530398848',userId:userIdInput.value.trim(),product:selectedProduct.product,payment:selectedPayment,fee:fee,total:bp+fee,notes:notesInput.value.trim()})});

document.addEventListener('DOMContentLoaded',()=>{loadAppData();updateSummary()});
window.addEventListener('pageshow',e=>{if(e.persisted){showLoading(false);if(appSettings)updateStoreStatus()}});
setTimeout(()=>showLoading(false),3000);