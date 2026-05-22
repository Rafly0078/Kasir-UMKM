// --- ELEMEN DOM ---
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const errorText = document.getElementById('login-error');
const ordersContainer = document.getElementById('admin-orders');

// --- PENGATURAN KREDENSIAL DUMMY ---
// Anda bisa mengubah username dan password ini sesuai keinginan
const ADMIN_USER = 'rafly007';
const ADMIN_PASS = 'Giovanni8';

// --- LOGIKA LOGIN & SESI ---
// Cek apakah admin sudah login sebelumnya di tab ini
if (sessionStorage.getItem('is_admin_logged_in') === 'true') {
    bukaDashboard();
}

// Event klik tombol Login
btnLogin.addEventListener('click', prosesLogin);

// Bisa login pakai tombol Enter di keyboard
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') prosesLogin();
});

function prosesLogin() {
    const userVal = document.getElementById('username').value;
    const passVal = document.getElementById('password').value;

    if (userVal === ADMIN_USER && passVal === ADMIN_PASS) {
        // Jika Benar
        sessionStorage.setItem('is_admin_logged_in', 'true');
        bukaDashboard();
    } else {
        // Jika Salah
        errorText.style.display = 'block';
    }
}

// Event klik tombol Logout
btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('is_admin_logged_in');
    
    // Sembunyikan dashboard, kembalikan ke layar login
    adminDashboard.classList.add('hidden');
    loginSection.classList.remove('hidden');
    
    // Reset input form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorText.style.display = 'none';
});

function bukaDashboard() {
    // Sembunyikan form login, tampilkan dashboard
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    
    // Mulai render pesanan karena sudah terautentikasi
    renderOrders();
}


// --- LOGIKA RENDER PESANAN (Hanya jalan jika sudah login) ---
function renderOrders() {
    // Ambil data dari LocalStorage
    const orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    
    // Filter hanya pesanan yang statusnya 'pending'
    const pendingOrders = orders.filter(order => order.status === 'pending');

    if (pendingOrders.length === 0) {
        ordersContainer.innerHTML = `<div class="empty-state">Belum ada pesanan masuk. Menunggu pelanggan... ☕</div>`;
        return;
    }

    // Buat elemen HTML untuk setiap pesanan
    const ordersHTML = pendingOrders.map(order => {
        const itemsList = order.items.map(item => `
            <li class="order-item">
                <span><span class="item-qty">${item.qty}x</span> ${item.name}</span>
            </li>
        `).join('');

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

// Fungsi jika tombol "Selesai & Antar" ditekan
function selesaikanPesanan(orderId) {
    let orders = JSON.parse(localStorage.getItem('umkm_orders')) || [];
    
    // Ubah status pesanan menjadi 'completed'
    orders = orders.map(order => {
        if (order.id === orderId) order.status = 'completed';
        return order;
    });

    // Simpan kembali ke localStorage dan render ulang
    localStorage.setItem('umkm_orders', JSON.stringify(orders));
    renderOrders();
}

// Otomatis render ulang jika ada pesanan baru dari tab Kasir!
window.addEventListener('storage', (e) => {
    // Hanya render otomatis jika yang terbuka saat ini adalah dashboard
    if (e.key === 'umkm_orders' && sessionStorage.getItem('is_admin_logged_in') === 'true') {
        renderOrders();
    }
});