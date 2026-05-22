// --- ELEMEN DOM ---
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const errorText = document.getElementById('login-error');
const ordersContainer = document.getElementById('admin-orders');

// --- PENGATURAN KREDENSIAL ---
const ADMIN_USER = 'rafly007';
const ADMIN_PASS = 'Giovanni8';

// Cek apakah admin sudah login sebelumnya di tab ini
if (sessionStorage.getItem('is_admin_logged_in') === 'true') {
    bukaDashboard();
}

// Event klik tombol Login
btnLogin.addEventListener('click', prosesLogin);
document.getElementById('password').addEventListener('keypress', function (e) {
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
    }
}

// Event klik tombol Logout
btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('is_admin_logged_in');
    
    adminDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorText.style.display = 'none';
});

function bukaDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    renderOrders();
}

// --- LOGIKA RENDER PESANAN ---
function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    
    // Ambil pesanan yang berstatus pending (dapur) ATAU menunggu_pembayaran (kasir)
    const activeOrders = orders.filter(order => order.status === 'pending' || order.status === 'menunggu_pembayaran');

    if (activeOrders.length === 0) {
        ordersContainer.innerHTML = `<div class="empty-state">Belum ada pesanan masuk. Menunggu pelanggan... ☕</div>`;
        return;
    }

    const ordersHTML = activeOrders.map(order => {
        const itemsList = order.items.map(item => `
            <li class="order-item">
                <span><span class="item-qty">${item.qty}x</span> ${item.name}</span>
            </li>
        `).join('');

        // Jika Pelanggan pilih CASH (Belum Bayar / Perlu Konfirmasi Kasir)
        if (order.status === 'menunggu_pembayaran') {
            return `
                <div class="order-card" style="border-color: var(--accent);">
                    <div class="order-header">
                        <span class="meja-badge" style="background: var(--bg-input); color: var(--accent);">Meja ${order.meja} (CASH)</span>
                        <span class="order-time">${order.waktu}</span>
                    </div>
                    <ul class="order-items" style="opacity: 0.6;">
                        ${itemsList}
                    </ul>
                    <div style="background: rgba(232, 160, 69, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.85rem; color: var(--accent); text-align: center; font-weight: 600;">
                        Menunggu pelanggan bayar di kasir
                    </div>
                    <button class="btn-antar" style="background: var(--accent); color: var(--bg-base);" onclick="konfirmasiPembayaran('${order.id}')">
                        💰 Terima Uang & Konfirmasi
                    </button>
                </div>
            `;
        }

        // Jika Pelanggan pilih QRIS atau CASH sudah dikonfirmasi (Masuk antrean Dapur)
        return `
            <div class="order-card">
                <div class="order-header">
                    <span class="meja-badge">Meja ${order.meja}</span>
                    <span class="order-time">${order.waktu}</span>
                </div>
                <ul class="order-items">
                    ${itemsList}
                </ul>
                <button class="btn-antar" onclick="selesaikanPesanan('${order.id}')">
                    ✓ Tandai Selesai & Antar
                </button>
            </div>
        `;
    }).join('');

    ordersContainer.innerHTML = ordersHTML;
}

// Fungsi khusus Kasir untuk memproses pembayaran Cash
function konfirmasiPembayaran(orderId) {
    let orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    orders = orders.map(order => {
        if (order.id === orderId) order.status = 'pending'; 
        return order;
    });
    localStorage.setItem('umkm_orders', JSON.stringify(orders));
    renderOrders();
}

// Fungsi khusus Dapur jika makanan siap diantar
function selesaikanPesanan(orderId) {
    let orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    orders = orders.map(order => {
        if (order.id === orderId) order.status = 'completed';
        return order;
    });
    localStorage.setItem('umkm_orders', JSON.stringify(orders));
    renderOrders();
}

// Otomatis render ulang jika ada pesanan baru dari tab Kasir!
window.addEventListener('storage', (e) => {
    if (e.key === 'umkm_orders' && sessionStorage.getItem('is_admin_logged_in') === 'true') {
        renderOrders();
    }
});