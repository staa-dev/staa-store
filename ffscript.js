AOS.init({ once: true, duration: 400, offset: 10 });

// Theme
const themeToggle=document.getElementById('themeToggleNav'),body=document.body;
const setTheme=t=>{if(t==='dark'){body.setAttribute('data-theme','dark');localStorage.setItem('theme-ff','dark')}else{body.removeAttribute('data-theme');localStorage.setItem('theme-ff','light')}};
setTheme(localStorage.getItem('theme-ff')||'light');
themeToggle.addEventListener('click',()=>{const c=body.hasAttribute('data-theme')?'dark':'light';setTheme(c==='dark'?'light':'dark')});

// DOM
const playerIdInput=document.getElementById('playerId'),summaryId=document.getElementById('summaryId'),summaryDiamond=document.getElementById('summaryDiamond'),summaryPayment=document.getElementById('summaryPayment'),summaryFee=document.getElementById('summaryFee'),summaryPrice=document.getElementById('summaryPrice'),summaryNotes=document.getElementById('summaryNotes'),summaryNotesRow=document.getElementById('summaryNotesRow'),feeRow=document.getElementById('feeRow'),whatsappBtn=document.getElementById('whatsappBtn'),notesInput=document.getElementById('notes'),diamondGrid=document.getElementById('diamondProducts'),membershipGrid=document.getElementById('membershipProducts'),step1=document.getElementById('step1'),step2=document.getElementById('step2'),step3=document.getElementById('step3'),storeStatus=document.getElementById('storeStatus'),productCount=document.getElementById('productCount');
let selectedProduct=null,selectedPayment=null,activeCategory='diamond',appSettings=null;

// ========== LOAD DATA (TANPA LOADING OVERLAY) ==========
async function loadAppData(){
    console.time('⚡ FF Load');
    
    try {
        // Fetch settings & products PARALEL
        const [settings, products] = await Promise.all([
            fetchSettings(),
            fetchProducts('freefire')
        ]);
        
        appSettings = settings;
        updateStoreStatus();
        renderProducts(products);
        
        console.timeEnd('⚡ FF Load');
    } catch(e) {
        console.error('❌ Load error:', e);
        diamondGrid.innerHTML = '<div class="loading-placeholder" style="color:#ef4444;">❌ Gagal memuat</div>';
    }
}

function updateStoreStatus(){
    if(!storeStatus||!appSettings)return;
    const open=isStoreOpen(appSettings);
    if(open){storeStatus.innerHTML='<i class="fas fa-check-circle"></i><span>Official Partner</span>';storeStatus.style.background='var(--accent-light)';storeStatus.style.color='var(--accent)'}
    else{storeStatus.innerHTML='<i class="fas fa-clock"></i><span>Toko Tutup</span>';storeStatus.style.background='rgba(239,68,68,0.15)';storeStatus.style.color='#ef4444'}
}

function renderProducts(products){
    diamondGrid.innerHTML='';membershipGrid.innerHTML='';
    let dc=0,mc=0;
    
    products.forEach(p=>{
        const card=document.createElement('div');
        card.className='product-card';
        card.dataset.diamond=p.nama;card.dataset.price=p.harga;card.dataset.type=p.tipe;
        card.innerHTML=`${p.badge?`<div class="product-badge">${p.badge}</div>`:''}<div class="product-icon"><i class="fas fa-gem"></i></div><div class="product-amount">${p.nama}</div><div class="product-price">${formatRupiah(p.harga)}</div>`;
        if(p.tipe==='diamond'){diamondGrid.appendChild(card);dc++}else{membershipGrid.appendChild(card);mc++}
    });
    
    if(dc===0)diamondGrid.innerHTML='<div class="loading-placeholder">Belum ada produk</div>';
    if(mc===0)membershipGrid.innerHTML='<div class="loading-placeholder">Belum ada produk</div>';
    productCount.textContent=products.length+' Pilihan';
    if(mc===0)document.querySelector('[data-category="membership"]').style.display='none';
    
    attachProductListeners();
    if(!isStoreOpen(appSettings))disableAll();
}

function attachProductListeners(){
    document.querySelectorAll('.product-card').forEach(card=>{
        card.addEventListener('click',()=>{
            if(card.classList.contains('disabled')||card.dataset.type!==activeCategory)return;
            document.querySelectorAll('.product-card').forEach(c=>c.classList.remove('selected'));
            card.classList.add('selected');
            selectedProduct={diamond:card.dataset.diamond,price:parseInt(card.dataset.price),type:card.dataset.type};
            updateSummary();updateProgressSteps();
        });
    });
}

function disableAll(){
    playerIdInput.disabled=true;playerIdInput.placeholder='Toko sedang tutup...';
    document.querySelectorAll('.product-card,.payment-card').forEach(c=>{c.classList.add('disabled');c.style.pointerEvents='none'});
    whatsappBtn.disabled=true;
}

// Category
document.querySelectorAll('.category-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
        document.querySelectorAll('.category-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');activeCategory=tab.dataset.category;
        if(activeCategory==='diamond'){diamondGrid.classList.add('active');membershipGrid.classList.remove('active')}
        else{diamondGrid.classList.remove('active');membershipGrid.classList.add('active')}
        document.querySelectorAll('.product-card').forEach(c=>c.classList.remove('selected'));
        selectedProduct=null;updateSummary();updateProgressSteps();
    });
});

// Payment
document.querySelectorAll('.payment-card').forEach(card=>{
    card.addEventListener('click',()=>{
        if(card.classList.contains('disabled'))return;
        document.querySelectorAll('.payment-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');selectedPayment=card.dataset.payment;
        updateSummary();updateProgressSteps();
    });
});

function updateProgressSteps(){
    const id=playerIdInput.value.trim(),valid=id.length>=9&&/^\d+$/.test(id);
    step1.classList.toggle('active',valid);step2.classList.toggle('active',!!selectedProduct);step3.classList.toggle('active',!!selectedPayment);
}

function updateSummary(){
    const id=playerIdInput.value.trim(),valid=id.length>=9&&/^\d+$/.test(id);
    summaryId.textContent=valid?id:'-';summaryDiamond.textContent=selectedProduct?selectedProduct.diamond:'-';summaryPayment.textContent=selectedPayment||'-';
    const bp=selectedProduct?selectedProduct.price:0,fee=appSettings&&selectedPayment?calculateAdminFee(bp,selectedPayment,appSettings):0,total=bp+fee;
    summaryFee.textContent=formatRupiah(fee);summaryPrice.textContent=formatRupiah(total);
    feeRow.style.display=(fee>0&&selectedProduct)?'flex':'none';
    const notes=notesInput.value.trim();if(notes&&selectedProduct){summaryNotes.textContent=notes;summaryNotesRow.style.display='flex'}else{summaryNotesRow.style.display='none'}
    document.getElementById('priceDANA').textContent=bp>0?formatRupiah(bp):'Rp 0';
    document.getElementById('priceGoPay').textContent=bp>0?formatRupiah(bp):'Rp 0';
    document.getElementById('priceOVO').textContent=bp>0?formatRupiah(bp+calculateAdminFee(bp,'OVO',appSettings)):'Rp 0';
    document.getElementById('priceQRIS').textContent=bp>0?formatRupiah(bp+calculateAdminFee(bp,'QRIS',appSettings)):'Rp 0';
    whatsappBtn.disabled=!(valid&&selectedProduct&&selectedPayment&&isStoreOpen(appSettings));updateProgressSteps();
}

playerIdInput.addEventListener('input',updateSummary);notesInput.addEventListener('input',updateSummary);

whatsappBtn.addEventListener('click',()=>{
    if(whatsappBtn.disabled)return;
    const bp=selectedProduct.price,fee=calculateAdminFee(bp,selectedPayment,appSettings);
    sendWhatsApp({
        namaToko:appSettings?.nama_toko||'STAA PAY',
        waNumber:'6289530398848',
        playerId:playerIdInput.value.trim(),
        product:selectedProduct.diamond,
        payment:selectedPayment,
        fee:fee,total:bp+fee,
        notes:notesInput.value.trim()
    });
});

// INIT - TANPA LOADING OVERLAY
document.addEventListener('DOMContentLoaded',()=>{loadAppData();updateSummary()});
window.addEventListener('pageshow',e=>{if(e.persisted&&appSettings)updateStoreStatus()});