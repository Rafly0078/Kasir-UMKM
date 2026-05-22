// ============================================================
//  Kasir UMKM — script.js  v2.0
//  Bug fixes + fitur baru:
//    - Fix parseInt → NaN  (gunakan Number() || 0)
//    - Fix backdrop modal (gunakan ID, bukan querySelector kelas)
//    - Search/filter produk
//    - Badge jumlah di kartu produk (in-cart indicator)
//    - Subtotal per item di keranjang
//    - Tombol clear cart
//    - Info jumlah jenis item di cart footer
//    - prosesPesanan: renderProducts() untuk hapus badge
//    - Order ID unik berbasis timestamp
// ============================================================

// --- DATA PRODUK ---
const products = [
    { id: 1,  name: 'Cappuccino',         price: 25000, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 2,  name: 'Americano',          price: 20000, img: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 3,  name: 'Latte',              price: 25000, img: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 4,  name: 'Matcha Latte',       price: 28000, img: 'https://images.unsplash.com/photo-1536514072410-5019a3c69182?w=200&h=200&fit=crop', category: 'manis' },
    { id: 5,  name: 'Thai Tea',           price: 22000, img: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=200&h=200&fit=crop', category: 'manis' },
    { id: 6,  name: 'Kentang Goreng',     price: 15000, img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=200&h=200&fit=crop', category: 'ringan' },
    { id: 7,  name: 'Roti Bakar',         price: 18000, img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop', category: 'ringan' },
    { id: 8,  name: 'Nasi Goreng',        price: 30000, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop', category: 'berat' },
    { id: 9,  name: 'Mie Tek-Tek',        price: 25000, img: 'https://buckets.sasa.co.id/v1/AUTH_Assets/Assets/p/website/medias/page_medias/Screen_Shot_2022-06-30_at_18_25_01.png', category: 'berat' },
    { id: 10, name: 'Strawberry Milkshake', price: 25000, img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqRGbaU3AfoUNn-eh-RlIzKLzJ_B37wUVw2w&s', category: 'manis' }
];

// --- STATE ---
let cart = [];
let currentCategory = 'all';
let searchQuery = '';

// --- UTILITY ---
const formatRupiah = (number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

// --- CLOCK ---
function updateClock() {
    const el = document.getElementById('datetime');
    if (!el) return;
    const now  = new Date();
    const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.innerHTML = `${date}<br><strong style="color:var(--text-secondary)">${time}</strong>`;
}
setInterval(updateClock, 1000);
updateClock();

// --- SEARCH ---
const searchInput    = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) searchClearBtn.classList.toggle('hidden', searchQuery === '');
        renderProducts();
    });
}
if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        searchClearBtn.classList.add('hidden');
        renderProducts();
    });
}

// --- CATEGORY TABS ---
const productGrid = document.getElementById('product-grid');
const tabBtns     = document.querySelectorAll('.tab-btn');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        renderProducts();
    });
});

// --- RENDER PRODUK ---
function renderProducts() {
    let filtered = currentCategory === 'all'
        ? products
        : products.filter(p => p.category === currentCategory);

    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    if (filtered.length === 0) {
        const msg = searchQuery
            ? `Tidak ada menu yang cocok untuk "<strong>${searchQuery}</strong>"`
            : 'Tidak ada menu di kategori ini.';
        productGrid.innerHTML = `
            <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <p>${msg}</p>
            </div>`;
        return;
    }

    productGrid.innerHTML = '';
    filtered.forEach(product => {
        const inCartItem = cart.find(i => i.id === product.id);
        const card = document.createElement('div');
        card.className = `product-card${inCartItem ? ' in-cart' : ''}`;
        card.id = `product-card-${product.id}`;
        card.innerHTML = `
            ${inCartItem ? `<div class="product-card-badge">${inCartItem.qty}</div>` : ''}
            <div class="product-img-wrap">
                <img src="${product.img}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="price">${formatRupiah(product.price)}</p>
                <button class="btn-add" onclick="addToCart(${product.id})">+ Tambah</button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// --- UPDATE BADGE KARTU PRODUK (inline, tanpa re-render penuh) ---
function updateProductCardBadge(productId) {
    const card = document.getElementById(`product-card-${productId}`);
    if (!card) return; // kartu mungkin tidak tampil (filtered out)

    const item    = cart.find(i => i.id === productId);
    let   badge   = card.querySelector('.product-card-badge');

    if (item) {
        card.classList.add('in-cart');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'product-card-badge';
            card.insertBefore(badge, card.firstChild);
        }
        badge.textContent = item.qty;
    } else {
        card.classList.remove('in-cart');
        if (badge) badge.remove();
    }
}

// --- CART LOGIC ---
function addToCart(productId) {
    const product  = products.find(p => p.id === productId);
    const existing = cart.find(i => i.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateProductCardBadge(productId);
    updateCartUI();
}

function updateQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    }
    updateProductCardBadge(productId);
    updateCartUI();
}

function clearCart() {
    const ids = cart.map(i => i.id);
    cart = [];
    ids.forEach(id => updateProductCardBadge(id));
    updateCartUI();
}

// --- BUILD CART HTML ---
function buildCartItemsHTML() {
    if (cart.length === 0) {
        return `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Keranjang masih kosong</p>
            </div>`;
    }

    return cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <p class="item-unit-price">${formatRupiah(item.price)} / pcs</p>
            </div>
            <div class="cart-item-right">
                <span class="item-subtotal">${formatRupiah(item.price * item.qty)}</span>
                <div class="cart-controls">
                    <button class="btn-qty" onclick="updateQty(${item.id}, -1)">−</button>
                    <span class="qty-display">${item.qty}</span>
                    <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- UPDATE CART UI ---
function updateCartUI() {
    let total = 0, totalItems = 0, totalTypes = 0;
    cart.forEach(item => {
        total      += item.price * item.qty;
        totalItems += item.qty;
        totalTypes += 1;
    });
    const isEmpty  = cart.length === 0;
    const cartHTML = buildCartItemsHTML();
    const itemInfo = `${totalTypes} jenis • ${totalItems} item`;

    // ── Desktop ──
    const elCartItems    = document.getElementById('cart-items');
    const elTotalPrice   = document.getElementById('total-price');
    const elCartCount    = document.getElementById('cart-count');
    const elBtnCash      = document.getElementById('btn-cash');
    const elBtnQris      = document.getElementById('btn-qris');
    const elBtnClear     = document.getElementById('btn-clear-cart');
    const elItemCountRow = document.getElementById('item-count-row');
    const elItemCountTxt = document.getElementById('item-count-text');

    if (elCartItems)    elCartItems.innerHTML       = cartHTML;
    if (elTotalPrice)   elTotalPrice.innerText      = formatRupiah(total);
    if (elCartCount)    elCartCount.innerText       = totalItems;
    if (elBtnCash)      elBtnCash.disabled          = isEmpty;
    if (elBtnQris)      { elBtnQris.disabled = isEmpty; elBtnQris.dataset.total = total; }
    if (elBtnClear)     elBtnClear.classList.toggle('hidden', isEmpty);
    if (elItemCountRow) elItemCountRow.style.display = isEmpty ? 'none' : 'flex';
    if (elItemCountTxt) elItemCountTxt.innerText     = itemInfo;

    // ── Mobile panel ──
    const elCartItemsMob    = document.getElementById('cart-items-mobile');
    const elTotalPriceMob   = document.getElementById('total-price-mobile');
    const elCartCountMob    = document.getElementById('cart-count-mobile');
    const elBtnCashMob      = document.getElementById('btn-cash-mobile');
    const elBtnQrisMob      = document.getElementById('btn-qris-mobile');
    const elBtnClearMob     = document.getElementById('btn-clear-cart-mobile');
    const elItemCountRowMob = document.getElementById('item-count-row-mobile');
    const elItemCountTxtMob = document.getElementById('item-count-text-mobile');

    if (elCartItemsMob)    elCartItemsMob.innerHTML       = cartHTML;
    if (elTotalPriceMob)   elTotalPriceMob.innerText      = formatRupiah(total);
    if (elCartCountMob)    elCartCountMob.innerText       = totalItems;
    if (elBtnCashMob)      elBtnCashMob.disabled          = isEmpty;
    if (elBtnQrisMob)      { elBtnQrisMob.disabled = isEmpty; elBtnQrisMob.dataset.total = total; }
    if (elBtnClearMob)     elBtnClearMob.classList.toggle('hidden', isEmpty);
    if (elItemCountRowMob) elItemCountRowMob.style.display = isEmpty ? 'none' : 'flex';
    if (elItemCountTxtMob) elItemCountTxtMob.innerText     = itemInfo;

    // ── Mobile bottom bar ──
    const mobileOrderBtn  = document.getElementById('mobile-order-btn');
    const mobileTotalPrice = document.getElementById('mobile-total-price');
    const mobileCartCount  = document.getElementById('mobile-cart-count');

    if (mobileTotalPrice) mobileTotalPrice.innerText   = formatRupiah(total);
    if (mobileCartCount)  mobileCartCount.innerText    = totalItems;
    if (mobileOrderBtn) {
        mobileOrderBtn.style.opacity       = isEmpty ? '0.5' : '1';
        mobileOrderBtn.style.pointerEvents = isEmpty ? 'none' : 'auto';
    }
}

// --- CLEAR CART LISTENERS ---
const elBtnClearCart       = document.getElementById('btn-clear-cart');
const elBtnClearCartMobile = document.getElementById('btn-clear-cart-mobile');
if (elBtnClearCart)       elBtnClearCart.addEventListener('click', clearCart);
if (elBtnClearCartMobile) elBtnClearCartMobile.addEventListener('click', clearCart);

// --- MOBILE CART OVERLAY ---
const cartOverlay          = document.getElementById('cart-overlay');
const mobileOrderBtn       = document.getElementById('mobile-order-btn');
const cartOverlayBackdrop  = document.getElementById('cart-overlay-backdrop');

function openCartPanel() {
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartPanel() {
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

if (mobileOrderBtn)      mobileOrderBtn.addEventListener('click', openCartPanel);
if (cartOverlayBackdrop) cartOverlayBackdrop.addEventListener('click', closeCartPanel);

// --- QRIS MODAL ---
const modal       = document.getElementById('qris-modal');
const elBtnQris   = document.getElementById('btn-qris');
const elCloseModal = document.getElementById('close-modal');

// BUG FIX: gunakan Number() || 0, bukan parseInt (menghindari NaN)
function openQrisModal(totalTrx) {
    const total = Number(totalTrx) || 0;
    document.getElementById('modal-total-price').innerText = formatRupiah(total);
    const qrData = encodeURIComponent(`KASIR_UMKM_${Date.now()}`);
    document.getElementById('qris-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
    modal.classList.remove('hidden');
}

if (elBtnQris) {
    // BUG FIX: Number() || 0
    elBtnQris.addEventListener('click', () => openQrisModal(Number(elBtnQris.dataset.total) || 0));
}

if (elCloseModal) {
    elCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
}

// BUG FIX: gunakan ID spesifik, bukan querySelector('.modal-backdrop') yang grab elemen pertama
const qrisModalBackdrop = document.getElementById('qris-modal-backdrop');
if (qrisModalBackdrop) {
    qrisModalBackdrop.addEventListener('click', () => modal.classList.add('hidden'));
}

// Mobile QRIS button
const elBtnQrisMobile = document.getElementById('btn-qris-mobile');
if (elBtnQrisMobile) {
    elBtnQrisMobile.addEventListener('click', () => {
        closeCartPanel();
        // BUG FIX: Number() || 0
        openQrisModal(Number(elBtnQrisMobile.dataset.total) || 0);
    });
}

// --- NOTIF MODAL ---
const notifModal     = document.getElementById('notif-modal');
const btnTutupNotif  = document.getElementById('btn-tutup-notif');
const notifBackdrop  = document.getElementById('notif-backdrop');

function closeNotifModal() {
    if (notifModal) notifModal.classList.add('hidden');
}

if (btnTutupNotif) btnTutupNotif.addEventListener('click', closeNotifModal);
if (notifBackdrop) notifBackdrop.addEventListener('click', closeNotifModal);

// --- PROSES PESANAN ---
function prosesPesanan(metodePembayaran) {
    const inputDesktop = document.getElementById('input-meja-desktop');
    const inputMobile  = document.getElementById('input-meja-mobile');

    const noMeja = (
        (inputDesktop && inputDesktop.value.trim()) ||
        (inputMobile  && inputMobile.value.trim())  ||
        'Takeaway'
    );

    const statusPesanan = metodePembayaran === 'QRIS' ? 'pending' : 'menunggu_pembayaran';

    // BUG FIX: Order ID berbasis timestamp, lebih unik
    const orderData = {
        id    : `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        waktu : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        meja  : noMeja,
        items : [...cart],
        total : cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        metode: metodePembayaran,
        status: statusPesanan
    };

    try {
        const orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
        orders.push(orderData);
        localStorage.setItem('umkm_orders', JSON.stringify(orders));
    } catch (e) {
        console.error('Gagal simpan pesanan:', e);
    }

    // Notifikasi
    const iconEl  = document.getElementById('notif-icon');
    const titleEl = document.getElementById('notif-title');
    const descEl  = document.getElementById('notif-desc');

    if (notifModal && titleEl) {
        const mejaLabel = noMeja === 'Takeaway' ? 'Takeaway' : `Meja ${noMeja}`;
        if (metodePembayaran === 'QRIS') {
            iconEl.innerText  = '✅';
            titleEl.innerText = 'Pembayaran Berhasil!';
            descEl.innerText  = `Pesanan untuk ${mejaLabel} sedang diproses. Pesanan akan segera diantarkan!`;
        } else {
            iconEl.innerText  = '💵';
            titleEl.innerText = 'Pesanan Disimpan';
            descEl.innerText  = `Silakan menuju kasir untuk melakukan pembayaran dan mengonfirmasi pesanan ${mejaLabel}.`;
        }
        notifModal.classList.remove('hidden');
    }

    // Tutup modal QRIS
    const qrisModal = document.getElementById('qris-modal');
    if (qrisModal) qrisModal.classList.add('hidden');

    // Reset
    const idsBeforeReset = cart.map(i => i.id);
    cart = [];
    idsBeforeReset.forEach(id => updateProductCardBadge(id)); // Hapus badge produk
    if (inputDesktop) inputDesktop.value = '';
    if (inputMobile)  inputMobile.value  = '';
    updateCartUI();
    closeCartPanel();
}

// --- EVENT LISTENERS PEMBAYARAN ---
const btnSelesai     = document.getElementById('btn-selesai');
const btnCashDesktop = document.getElementById('btn-cash');
const btnCashMobile  = document.getElementById('btn-cash-mobile');

if (btnSelesai)     btnSelesai.onclick     = () => prosesPesanan('QRIS');
if (btnCashDesktop) btnCashDesktop.onclick = () => prosesPesanan('CASH');
if (btnCashMobile)  btnCashMobile.onclick  = () => prosesPesanan('CASH');

// --- INIT ---
renderProducts();
updateCartUI();