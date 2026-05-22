// --- DUMMY DATA PRODUK ---
// Menambahkan properti "category" pada masing-masing produk
const products = [
    { id: 1, name: 'Cappuccino', price: 25000, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 2, name: 'Americano', price: 20000, img: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 3, name: 'Latte', price: 25000, img: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=200&h=200&fit=crop', category: 'coffee' },
    { id: 4, name: 'Matcha Latte', price: 28000, img: 'https://images.unsplash.com/photo-1536514072410-5019a3c69182?w=200&h=200&fit=crop', category: 'manis' },
    { id: 5, name: 'Thai Tea', price: 22000, img: 'https://images.unsplash.com/photo-1557006021-b85faa2bc5e2?w=200&h=200&fit=crop', category: 'manis' },
    // Tambahan Makanan Ringan
    { id: 6, name: 'Kentang Goreng', price: 15000, img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=200&h=200&fit=crop', category: 'ringan' },
    { id: 7, name: 'Roti Bakar Coklat', price: 18000, img: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop', category: 'ringan' },
    // Tambahan Makanan Berat
    { id: 8, name: 'Nasi Goreng', price: 30000, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop', category: 'berat' },
    { id: 9, name: 'Mie Tek-Tek', price: 25000, img: 'https://buckets.sasa.co.id/v1/AUTH_Assets/Assets/p/website/medias/page_medias/Screen_Shot_2022-06-30_at_18_25_01.png', category: 'berat' }
];

// --- STATE ---
let cart = [];
let currentCategory = 'all'; // State untuk melacak kategori aktif

// --- UTILITY: Format Rupiah ---
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

// --- CLOCK ---
function updateClock() {
    const el = document.getElementById('datetime');
    if (!el) return;
    const now = new Date();
    const date = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.innerHTML = `${date}<br><strong style="color:var(--text-secondary)">${time}</strong>`;
}
setInterval(updateClock, 1000);
updateClock();

// --- RENDER PRODUK & KATEGORI LOGIC ---
const productGrid = document.getElementById('product-grid');
const tabBtns = document.querySelectorAll('.tab-btn');

// Event listener untuk tombol kategori
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Hapus class 'active' dari semua tombol
        tabBtns.forEach(b => b.classList.remove('active'));
        // Tambahkan class 'active' ke tombol yang diklik
        btn.classList.add('active');
        
        // Update kategori saat ini dan render ulang produk
        currentCategory = btn.dataset.category;
        renderProducts();
    });
});

function renderProducts() {
    productGrid.innerHTML = '';
    
    // Filter produk berdasarkan kategori aktif
    const filteredProducts = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);

    // Tampilkan produk yang sudah difilter
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
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

// --- CART LOGIC ---
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateQty(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
    }
    updateCartUI();
}

// Render cart items HTML string
function buildCartItemsHTML(idSuffix) {
    if (cart.length === 0) {
        return `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Keranjang masih kosong</p>
            </div>
        `;
    }

    return cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <h5>${item.name}</h5>
                <p class="item-price">${formatRupiah(item.price)}</p>
            </div>
            <div class="cart-controls">
                <button class="btn-qty" onclick="updateQty(${item.id}, -1)">−</button>
                <span class="qty-display">${item.qty}</span>
                <button class="btn-qty" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

function updateCartUI() {
    let total = 0;
    let totalItems = 0;
    cart.forEach(item => {
        total += item.price * item.qty;
        totalItems += item.qty;
    });

    const isEmpty = cart.length === 0;
    const cartHTML = buildCartItemsHTML();

    // --- Desktop ---
    const cartItems = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('total-price');
    const cartCountEl = document.getElementById('cart-count');
    const btnCash = document.getElementById('btn-cash');
    const btnQris = document.getElementById('btn-qris');

    if (cartItems) cartItems.innerHTML = cartHTML;
    if (totalPriceEl) totalPriceEl.innerText = formatRupiah(total);
    if (cartCountEl) cartCountEl.innerText = totalItems;
    if (btnCash) btnCash.disabled = isEmpty;
    if (btnQris) {
        btnQris.disabled = isEmpty;
        btnQris.dataset.total = total;
    }

    // --- Mobile panel ---
    const cartItemsMobile = document.getElementById('cart-items-mobile');
    const totalPriceMobile = document.getElementById('total-price-mobile');
    const cartCountMobile = document.getElementById('cart-count-mobile');
    const btnCashMobile = document.getElementById('btn-cash-mobile');
    const btnQrisMobile = document.getElementById('btn-qris-mobile');

    if (cartItemsMobile) cartItemsMobile.innerHTML = cartHTML;
    if (totalPriceMobile) totalPriceMobile.innerText = formatRupiah(total);
    if (cartCountMobile) cartCountMobile.innerText = totalItems;
    if (btnCashMobile) btnCashMobile.disabled = isEmpty;
    if (btnQrisMobile) {
        btnQrisMobile.disabled = isEmpty;
        btnQrisMobile.dataset.total = total;
    }

    // --- Mobile bottom bar ---
    const mobileOrderBtn = document.getElementById('mobile-order-btn');
    const mobileTotalPrice = document.getElementById('mobile-total-price');
    const mobileCartCount = document.getElementById('mobile-cart-count');

    if (mobileTotalPrice) mobileTotalPrice.innerText = formatRupiah(total);
    if (mobileCartCount) mobileCartCount.innerText = totalItems;
    if (mobileOrderBtn) {
        mobileOrderBtn.style.opacity = isEmpty ? '0.5' : '1';
        mobileOrderBtn.style.pointerEvents = isEmpty ? 'none' : 'auto';
    }
}

// --- MOBILE CART OVERLAY ---
const cartOverlay = document.getElementById('cart-overlay');
const mobileOrderBtn = document.getElementById('mobile-order-btn');
const cartOverlayBackdrop = document.getElementById('cart-overlay-backdrop');

function openCartPanel() {
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartPanel() {
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

if (mobileOrderBtn) {
    mobileOrderBtn.addEventListener('click', openCartPanel);
}
if (cartOverlayBackdrop) {
    cartOverlayBackdrop.addEventListener('click', closeCartPanel);
}

// Mobile QRIS button
const btnQrisMobile = document.getElementById('btn-qris-mobile');
if (btnQrisMobile) {
    btnQrisMobile.addEventListener('click', () => {
        closeCartPanel();
        openQrisModal(parseInt(btnQrisMobile.dataset.total));
    });
}

// --- MODAL QRIS ---
const modal = document.getElementById('qris-modal');
const btnQris = document.getElementById('btn-qris');
const closeModal = document.getElementById('close-modal');
const btnSelesai = document.getElementById('btn-selesai');

function openQrisModal(totalTrx) {
    document.getElementById('modal-total-price').innerText = formatRupiah(totalTrx);
    const qrData = `DUMMY_QRIS_TRANSAKSI_${Date.now()}`;
    document.getElementById('qris-image').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
    modal.classList.remove('hidden');
}

if (btnQris) {
    btnQris.addEventListener('click', () => {
        openQrisModal(parseInt(btnQris.dataset.total));
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

document.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
});

if (btnSelesai) {
    btnSelesai.addEventListener('click', () => {
        alert('Pembayaran QRIS Berhasil! (Nanti bagian ini yang menembak API ke Google Sheets)');
        cart = [];
        updateCartUI();
        modal.classList.add('hidden');
        closeCartPanel();
    });
}

// --- INIT ---
renderProducts();
updateCartUI();