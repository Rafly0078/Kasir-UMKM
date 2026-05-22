// ============================================================
//  Kasir UMKM — admin.js  v2.0
//  Bug fixes + fitur baru:
//    - FIX: Tambah formatRupiah() (sebelumnya tidak ada → total tidak terbaca)
//    - FIX: Auto-refresh via setInterval (storage event tidak jalan di tab sama)
//    - BARU: Deteksi pesanan baru + toast notification
//    - BARU: Total harga di tiap kartu pesanan
//    - BARU: Badge metode pembayaran (CASH / QRIS)
//    - BARU: Subtotal per item di kartu dapur
//    - BARU: Live order count badge di header
//    - BARU: Judul tab browser diupdate saat ada pesanan baru
// ============================================================

// --- ELEMEN DOM ---
const loginSection    = document.getElementById('login-section');
const adminDashboard  = document.getElementById('admin-dashboard');
const btnLogin        = document.getElementById('btn-login');
const btnLogout       = document.getElementById('btn-logout');
const errorText       = document.getElementById('login-error');
const ordersContainer = document.getElementById('admin-orders');

// --- KREDENSIAL ---
// Catatan: kredensial di client-side JS hanya untuk demo.
// Untuk produksi, gunakan autentikasi server-side.
const ADMIN_USER = 'rafly007';
const ADMIN_PASS = 'Giovanni8';

// --- STATE ---
let previousActiveCount = -1; // -1 = belum pernah render (hindari toast saat pertama buka)
let autoRefreshInterval = null;

// --- UTILITY ---
function formatRupiah(number) {
    // BUG FIX: fungsi ini tidak ada di versi sebelumnya → total tampil angka mentah
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number || 0);
}

// --- CEK SESSION ---
if (sessionStorage.getItem('is_admin_logged_in') === 'true') {
    bukaDashboard();
}

// --- LOGIN ---
btnLogin.addEventListener('click', prosesLogin);
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') prosesLogin();
});

function prosesLogin() {
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;

    if (userVal === ADMIN_USER && passVal === ADMIN_PASS) {
        sessionStorage.setItem('is_admin_logged_in', 'true');
        bukaDashboard();
    } else {
        errorText.style.display = 'block';
        // Shake effect
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// --- LOGOUT ---
btnLogout.addEventListener('click', () => {
    clearInterval(autoRefreshInterval);
    sessionStorage.removeItem('is_admin_logged_in');

    adminDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorText.style.display = 'none';
    previousActiveCount = -1;
    document.title = 'Dapur / Admin - Kasir UMKM';
});

// --- BUKA DASHBOARD ---
function bukaDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');

    previousActiveCount = -1; // Reset agar render pertama tidak trigger toast
    renderOrders();

    // BUG FIX: storage event tidak jalan di tab yang sama.
    // Tambahkan setInterval sebagai fallback auto-refresh.
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        if (sessionStorage.getItem('is_admin_logged_in') === 'true') {
            renderOrders();
        }
    }, 5000);
}

// --- RENDER ORDERS ---
function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'menunggu_pembayaran');

    // ── Update last-refresh time ──
    const refreshTimeEl = document.getElementById('last-refresh-time');
    if (refreshTimeEl) {
        refreshTimeEl.textContent = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    // ── Update order count badge ──
    const countChip = document.getElementById('active-order-count');
    if (countChip) {
        countChip.style.display = activeOrders.length > 0 ? 'inline-block' : 'none';
        countChip.textContent   = activeOrders.length;
    }

    // ── Deteksi pesanan baru ──
    if (previousActiveCount >= 0 && activeOrders.length > previousActiveCount) {
        const newCount = activeOrders.length - previousActiveCount;
        showNewOrderToast(`🔔 ${newCount} pesanan baru masuk!`);
        document.title = `(${activeOrders.length}) Pesanan Baru! — Layar Dapur`;
    } else if (activeOrders.length > 0) {
        document.title = `(${activeOrders.length}) Layar Dapur`;
    } else {
        document.title = 'Dapur / Admin - Kasir UMKM';
    }
    previousActiveCount = activeOrders.length;

    // ── Render kartu ──
    if (activeOrders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">☕</div>
                <p>Belum ada pesanan masuk.<br>Menunggu pelanggan...</p>
            </div>`;
        return;
    }

    ordersContainer.innerHTML = activeOrders.map(order => buildOrderCardHTML(order)).join('');
}

// --- BUILD KARTU PESANAN ---
function buildOrderCardHTML(order) {
    const itemsList = order.items.map(item => `
        <li class="order-item">
            <span>
                <span class="item-qty">${item.qty}×</span>
                ${item.name}
            </span>
            <span class="item-subtotal-admin">${formatRupiah(item.price * item.qty)}</span>
        </li>
    `).join('');

    const totalFormatted  = formatRupiah(order.total);
    const isMetodeQris    = order.metode === 'QRIS';
    const badgeClass      = isMetodeQris ? 'qris' : 'cash';
    const badgeLabel      = isMetodeQris ? '⚡ QRIS' : '💵 CASH';
    const mejaLabel       = order.meja === 'Takeaway' ? '🥡 Takeaway' : `Meja ${order.meja}`;

    // ── Menunggu pembayaran cash ──
    if (order.status === 'menunggu_pembayaran') {
        return `
            <div class="order-card" style="border-color: var(--accent);">
                <div class="order-header">
                    <span class="meja-badge" style="background: var(--bg-input); color: var(--accent);">
                        ${mejaLabel}
                    </span>
                    <span class="order-time">${order.waktu}</span>
                </div>
                <div class="order-meta">
                    <span class="payment-badge cash">💵 CASH — Belum Bayar</span>
                </div>
                <ul class="order-items" style="opacity: 0.75;">
                    ${itemsList}
                </ul>
                <div class="order-total-row">
                    <span class="order-total-label">Total</span>
                    <span class="order-total-value">${totalFormatted}</span>
                </div>
                <div class="waiting-notice">
                    ⏳ Menunggu pelanggan bayar di kasir
                </div>
                <button class="btn-konfirmasi" onclick="konfirmasiPembayaran('${order.id}')">
                    💰 Terima Uang & Konfirmasi
                </button>
            </div>
        `;
    }

    // ── Pesanan aktif (siap diproses dapur) ──
    return `
        <div class="order-card">
            <div class="order-header">
                <span class="meja-badge">${mejaLabel}</span>
                <span class="order-time">${order.waktu}</span>
            </div>
            <div class="order-meta">
                <span class="payment-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <ul class="order-items">
                ${itemsList}
            </ul>
            <div class="order-total-row">
                <span class="order-total-label">Total</span>
                <span class="order-total-value">${totalFormatted}</span>
            </div>
            <button class="btn-antar" onclick="selesaikanPesanan('${order.id}')">
                ✓ Tandai Selesai & Antar
            </button>
        </div>
    `;
}

// --- TOAST NOTIFIKASI PESANAN BARU ---
let toastTimeout = null;
function showNewOrderToast(message) {
    const toast = document.getElementById('new-order-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

// --- KONFIRMASI PEMBAYARAN CASH ---
function konfirmasiPembayaran(orderId) {
    let orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    orders = orders.map(order => {
        if (order.id === orderId) order.status = 'pending';
        return order;
    });
    localStorage.setItem('umkm_orders', JSON.stringify(orders));
    renderOrders();
}

// --- TANDAI PESANAN SELESAI ---
function selesaikanPesanan(orderId) {
    let orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    orders = orders.map(order => {
        if (order.id === orderId) order.status = 'completed';
        return order;
    });
    localStorage.setItem('umkm_orders', JSON.stringify(orders));
    renderOrders();
}

// --- CROSS-TAB UPDATE (storage event dari tab kasir) ---
window.addEventListener('storage', (e) => {
    if (e.key === 'umkm_orders' && sessionStorage.getItem('is_admin_logged_in') === 'true') {
        renderOrders();
    }
});