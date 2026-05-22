const ordersContainer = document.getElementById('admin-orders');

// Fungsi untuk membaca dan merender pesanan
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
    if (e.key === 'umkm_orders') {
        renderOrders();
    }
});

// Inisialisasi awal
renderOrders();