/**
 * ==============================================================================
 * ADMIN.JS (CÂU 8)
 * - Quản trị hệ thống: Dashboard thống kê, Quản lý đơn hàng, Thống kê sản phẩm
 * - Kiểm tra phân quyền truy cập (Admin / Staff)
 * - Hợp nhất đơn hàng từ data/carts.xml và đơn hàng mới từ localStorage["orders"]
 * - Biểu đồ cột thuần CSS / SVG thống kê doanh thu theo tháng (Không thư viện ngoài)
 * - Modal xem chi tiết đơn hàng & chức năng thay đổi trạng thái đơn hàng realtime
 * ==============================================================================
 */

import { requireAdminOrStaff, logout } from "./auth.js";
import { loadCarts, loadProducts, loadCustomers } from "./dataService.js";

// STATE DỮ LIỆU ADMIN
let allOrders = [];
let allProducts = [];
let allCustomers = [];
let filteredOrders = [];

const OVERRIDE_STATUS_KEY = "uel_store_orders_status_override";

/**
 * 1. KHỞI CHẠY TRANG ADMIN
 */
export async function initAdminDashboard() {
  // BƯỚC 1: Kiểm tra quyền truy cập (Admin hoặc Staff)
  const currentUser = requireAdminOrStaff();
  if (!currentUser) return;

  // Hiển thị thông tin người dùng lên Header
  const userNameEl = document.getElementById("adminUserName");
  const userRoleEl = document.getElementById("adminUserRole");
  if (userNameEl) userNameEl.textContent = currentUser.fullName;
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role.toUpperCase();
    userRoleEl.className = `user-badge-role ${currentUser.role === "admin" ? "role-admin" : "role-staff"}`;
  }

  // Gắn sự kiện nút Đăng xuất
  const btnLogout = document.getElementById("btnLogoutAdmin");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị?")) {
        logout();
      }
    });
  }

  // BƯỚC 2: Tải đồng thời dữ liệu sản phẩm, khách hàng và hóa đơn
  try {
    const [productsData, customersData, cartsXmlData] = await Promise.all([
      loadProducts("data/products.xml"),
      loadCustomers("data/customers.json"),
      loadCarts("data/carts.xml")
    ]);

    allProducts = productsData;
    allCustomers = customersData;

    // Hợp nhất đơn từ carts.xml + đơn hàng mới từ localStorage["orders"] (Câu 7)
    const localOrdersStr = localStorage.getItem("orders");
    const localOrders = localOrdersStr ? JSON.parse(localOrdersStr) : [];

    // Tải bảng ghi đè trạng thái đã sửa đổi trước đó (nếu có)
    const statusOverrides = getStatusOverrides();

    // Chuẩn hóa dữ liệu đơn hàng XML
    const formattedXmlOrders = cartsXmlData.map((cart) => {
      const customer = allCustomers.find((c) => c.id === cart.customerId);
      const currentStatus = statusOverrides[cart.id] || cart.status;
      return {
        ...cart,
        status: currentStatus,
        customerName: customer ? customer.fullName : cart.customerId,
        source: "XML"
      };
    });

    // Chuẩn hóa dữ liệu đơn hàng từ localStorage (người dùng vừa mua ở Câu 7)
    const formattedLocalOrders = localOrders.map((order) => {
      const currentStatus = statusOverrides[order.id] || order.status;
      return {
        ...order,
        status: currentStatus,
        customerName: order.customer ? order.customer.fullName : "Khách vãng lai",
        customerId: "ONLINE_GUEST",
        source: "LocalStorage"
      };
    });

    // Gộp tất cả các đơn hàng lại
    allOrders = [...formattedLocalOrders, ...formattedXmlOrders];
    filteredOrders = [...allOrders];

    console.log(`📊 [CÂU 8] Tổng hợp thành công ${allOrders.length} đơn hàng (${formattedXmlOrders.length} từ XML + ${formattedLocalOrders.length} từ LocalStorage)`);

    // BƯỚC 3: Render toàn bộ số liệu thống kê & giao diện
    renderMetrics(allOrders, allCustomers);
    renderRevenueChart(allOrders);
    renderTopSellingProducts(allOrders, allProducts);
    renderOrdersTable(filteredOrders);
    renderProductsStockTable(allOrders, allProducts);

    // BƯỚC 4: Kích hoạt bộ lọc đơn hàng
    initOrdersFilter();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu cho Admin Dashboard:", error);
    alert("Có lỗi xảy ra khi nạp dữ liệu trang quản trị: " + error.message);
  }
}

/**
 * 2. HIỂN THỊ CÁC THẺ KPI THỐNG KÊ (METRICS)
 */
function renderMetrics(orders, customers) {
  const totalOrders = orders.length;
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const totalCustomers = customers.length;

  const countPending = orders.filter((o) => o.status === "pending").length;
  const countPaid = orders.filter((o) => o.status === "paid").length;
  const countShipped = orders.filter((o) => o.status === "shipped").length;
  const countCancelled = orders.filter((o) => o.status === "cancelled").length;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl("metricTotalOrders", totalOrders);
  setEl("metricTotalRevenue", `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  setEl("metricTotalCustomers", totalCustomers);
  setEl("metricStatusBreakdown", `Chờ: ${countPending} | Đã TT: ${countPaid} | Đã giao: ${countShipped} | Hủy: ${countCancelled}`);
}

/**
 * 3. VẼ BIỂU ĐỒ CỘT DOANH THU THEO THÁNG THUẦN CSS/SVG (CÂU 8 - KHÔNG DÙNG THƯ VIỆN)
 */
function renderRevenueChart(orders) {
  const chartContainer = document.getElementById("monthlyRevenueChart");
  if (!chartContainer) return;

  // Gom doanh thu theo tháng (từ tháng 08/2026 đến tháng 11/2026)
  const monthlyRevenue = {
    "08/2026": 0,
    "09/2026": 0,
    "10/2026": 0,
    "11/2026": 0
  };

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    const dateStr = order.createdAt || "";
    // Lấy YYYY-MM
    const match = dateStr.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const monthKey = `${match[2]}/${match[1]}`;
      if (monthlyRevenue[monthKey] !== undefined) {
        monthlyRevenue[monthKey] += Number(order.totalAmount || 0);
      }
    }
  });

  const maxVal = Math.max(...Object.values(monthlyRevenue), 100);

  chartContainer.innerHTML = Object.entries(monthlyRevenue)
    .map(([month, rev]) => {
      // Tính % chiều cao cột biểu đồ
      const heightPercent = Math.max(12, Math.round((rev / maxVal) * 85));
      return `
        <div class="bar-column">
          <div class="bar-fill" style="height: ${heightPercent}%;">
            <span class="bar-value-tooltip">$${Math.round(rev).toLocaleString()}</span>
          </div>
          <span class="bar-label">Tháng ${month}</span>
        </div>
      `;
    })
    .join("");
}

/**
 * 4. THỐNG KÊ TOP SẢN PHẨM BÁN CHẠY NHẤT
 */
function renderTopSellingProducts(orders, products) {
  const container = document.getElementById("topSellingProductsBody");
  if (!container) return;

  const salesMap = {}; // { productId: { quantity: 0, revenue: 0 } }

  orders.forEach((order) => {
    if (order.status === "cancelled") return;
    (order.items || []).forEach((item) => {
      const pId = Number(item.productId);
      if (!salesMap[pId]) {
        salesMap[pId] = { quantity: 0, revenue: 0 };
      }
      salesMap[pId].quantity += Number(item.quantity || 1);
      salesMap[pId].revenue += Number(item.quantity || 1) * Number(item.unitPrice || 0);
    });
  });

  // Sắp xếp giảm dần theo số lượng đã bán
  const sortedTop = Object.entries(salesMap)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  if (sortedTop.length === 0) {
    container.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Chưa có dữ liệu bán hàng</td></tr>`;
    return;
  }

  container.innerHTML = sortedTop
    .map(([pId, data], index) => {
      const product = products.find((p) => Number(p.id) === Number(pId));
      const title = product ? product.title : `Sản phẩm #${pId}`;
      const img = product ? product.image : "https://placehold.co/40x40";

      return `
        <tr>
          <td><strong>#${index + 1}</strong></td>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${img}" alt="${title}" style="width:36px; height:36px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; padding:2px;">
              <span style="font-weight:600; font-size:0.85rem;" title="${title}">
                ${title.length > 28 ? title.substring(0, 28) + "..." : title}
              </span>
            </div>
          </td>
          <td><strong style="color:var(--primary); font-size:0.95rem;">${data.quantity}</strong> cái</td>
          <td><strong>$${data.revenue.toFixed(2)}</strong></td>
        </tr>
      `;
    })
    .join("");
}

/**
 * 5. BẢNG QUẢN LÝ ĐƠN HÀNG HỢP NHẤT
 */
function renderOrdersTable(orders) {
  const tbody = document.getElementById("ordersTableBody");
  const countEl = document.getElementById("ordersTableCount");
  if (!tbody) return;

  if (countEl) countEl.textContent = `${orders.length} đơn hàng`;

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:30px; color:var(--text-muted);">
          Không tìm thấy đơn hàng nào thỏa mãn điều kiện lọc.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders
    .map((order) => {
      const statusClass = `status-${order.status || "pending"}`;
      const statusText = {
        pending: "Chờ xử lý",
        paid: "Đã thanh toán",
        shipped: "Đã giao hàng",
        cancelled: "Đã hủy đơn"
      }[order.status] || order.status;

      return `
        <tr data-order-id="${order.id}">
          <td><strong>${order.id}</strong></td>
          <td>${order.createdAt || "N/A"}</td>
          <td>
            <div><strong>${order.customerName || "Khách hàng"}</strong></div>
            <small style="color:#64748b;">${order.customerId || ""}</small>
          </td>
          <td><span class="badge" style="background:#f1f5f9;">${order.employeeId || "Online"}</span></td>
          <td><strong>$${Number(order.totalAmount || 0).toFixed(2)}</strong></td>
          <td>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </td>
          <td>
            <!-- SELECT THAY ĐỔI TRẠNG THÁI REALTIME (CÂU 8) -->
            <select class="select-status-change" data-order-id="${order.id}">
              <option value="pending" ${order.status === "pending" ? "selected" : ""}>Chờ xử lý</option>
              <option value="paid" ${order.status === "paid" ? "selected" : ""}>Đã thanh toán</option>
              <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Đã giao hàng</option>
              <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>Hủy đơn</option>
            </select>
          </td>
          <td>
            <button type="button" class="btn btn-outline btn-view-order-detail" data-order-id="${order.id}" style="padding:4px 10px; font-size:0.8rem;">
              👁️ Chi tiết
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  // Gắn sự kiện thay đổi trạng thái đơn
  tbody.querySelectorAll(".select-status-change").forEach((select) => {
    select.addEventListener("change", (e) => {
      const orderId = e.target.getAttribute("data-order-id");
      const newStatus = e.target.value;
      updateOrderStatus(orderId, newStatus);
    });
  });

  // Gắn sự kiện xem chi tiết đơn
  tbody.querySelectorAll(".btn-view-order-detail").forEach((btn) => {
    btn.addEventListener("click", () => {
      const orderId = btn.getAttribute("data-order-id");
      openOrderDetailModal(orderId);
    });
  });
}

/**
 * 6. BẢNG THỐNG KÊ SẢN PHẨM ĐÃ BÁN, DOANH THU & TỒN KHO CÒN LẠI
 */
function renderProductsStockTable(orders, products) {
  const tbody = document.getElementById("productsStockTableBody");
  if (!tbody) return;

  const stats = {};
  products.forEach((p) => {
    stats[p.id] = {
      product: p,
      soldQty: 0,
      totalRevenue: 0
    };
  });

  orders.forEach((o) => {
    if (o.status === "cancelled") return;
    (o.items || []).forEach((it) => {
      const pId = Number(it.productId);
      if (stats[pId]) {
        const qty = Number(it.quantity || 1);
        stats[pId].soldQty += qty;
        stats[pId].totalRevenue += qty * Number(it.unitPrice || stats[pId].product.price);
      }
    });
  });

  tbody.innerHTML = Object.values(stats)
    .map(({ product, soldQty, totalRevenue }) => {
      const remainingStock = Math.max(0, product.stock - soldQty);
      return `
      <tr>
        <td><strong>#${product.id}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${product.image}" alt="${product.title}" style="width:36px; height:36px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; padding:2px;">
            <div>
              <div style="font-weight:600; font-size:0.88rem;" title="${product.title}">
                ${product.title.length > 36 ? product.title.substring(0, 36) + "..." : product.title}
              </div>
              <small style="color:#64748b;">${product.brand || "Chính hãng"}</small>
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${product.category}</span></td>
        <td>$${product.price.toFixed(2)}</td>
        <td><strong style="color:var(--primary); font-size:0.95rem;">${soldQty}</strong></td>
        <td><strong>$${totalRevenue.toFixed(2)}</strong></td>
        <td>
          <span style="font-weight:700; color:${remainingStock < 20 ? 'var(--danger)' : 'var(--success)'};">
            ${remainingStock}
          </span>
          <small style="color:#64748b; display:block; font-size:0.75rem;">(Gốc: ${product.stock})</small>
        </td>
      </tr>
    `;
    })
    .join("");
}

/**
 * 7. THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG VÀ LƯU VÀO LOCALSTORAGE (CÂU 8)
 */
function updateOrderStatus(orderId, newStatus) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  order.status = newStatus;

  // Lưu trạng thái vào LocalStorage để khi refresh trang không bị mất
  const overrides = getStatusOverrides();
  overrides[orderId] = newStatus;
  localStorage.setItem(OVERRIDE_STATUS_KEY, JSON.stringify(overrides));

  // Cập nhật lại số liệu thống kê
  renderMetrics(allOrders, allCustomers);
  renderRevenueChart(allOrders);
  renderOrdersTable(filteredOrders);
  renderProductsStockTable(allOrders, allProducts);

  alert(`✓ Đã cập nhật trạng thái đơn hàng [${orderId}] sang: "${newStatus.toUpperCase()}"!`);
}

function getStatusOverrides() {
  try {
    const str = localStorage.getItem(OVERRIDE_STATUS_KEY);
    return str ? JSON.parse(str) : {};
  } catch (e) {
    return {};
  }
}

/**
 * 8. MODAL XEM CHI TIẾT ĐƠN HÀNG (CÂU 8)
 */
function openOrderDetailModal(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  let modal = document.getElementById("orderDetailModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "orderDetailModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-container" style="max-width:700px;">
        <button id="btnCloseOrderDetailModal" class="modal-close-btn" type="button">&times;</button>
        <div id="orderDetailModalBody" style="padding:26px;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#btnCloseOrderDetailModal").addEventListener("click", () => {
      modal.classList.remove("active");
    });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  const itemsHtml = (order.items || [])
    .map((item) => {
      const p = allProducts.find((prod) => Number(prod.id) === Number(item.productId));
      const pTitle = p ? p.title : (item.title || `Sản phẩm #${item.productId}`);
      const pImg = p ? p.image : "https://placehold.co/50x50";
      const unit = Number(item.unitPrice || 0);
      const qty = Number(item.quantity || 1);

      return `
        <div style="display:grid; grid-template-columns:50px 1fr auto; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;">
          <img src="${pImg}" alt="${pTitle}" style="width:48px; height:48px; object-fit:contain; border-radius:4px; border:1px solid #e2e8f0; padding:2px;">
          <div>
            <div style="font-weight:600; font-size:0.9rem;">${pTitle}</div>
            <div style="font-size:0.78rem; color:#64748b;">Màu: ${item.color || "N/A"} | Size: ${item.size || "N/A"} | Đơn giá: $${unit.toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;">$${(unit * qty).toFixed(2)}</div>
            <small style="color:#64748b;">SL: ${qty}</small>
          </div>
        </div>
      `;
    })
    .join("");

  const body = modal.querySelector("#orderDetailModalBody");
  body.innerHTML = `
    <div style="border-bottom:1px solid var(--border-color); padding-bottom:14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <span class="badge" style="background:#e0e7ff; color:#3730a3; margin-bottom:4px;">Nguồn: ${order.source || "Hệ thống"}</span>
        <h2 style="font-size:1.3rem; color:var(--secondary); font-weight:800;">Chi Tiết Đơn Hàng: ${order.id}</h2>
        <div style="font-size:0.85rem; color:#64748b; margin-top:2px;">Ngày tạo đơn: <strong>${order.createdAt}</strong></div>
      </div>
      <span class="status-badge status-${order.status}" style="font-size:0.85rem;">${order.status.toUpperCase()}</span>
    </div>

    <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; margin-bottom:16px; font-size:0.88rem; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div>
        <div>👤 Khách hàng: <strong>${order.customerName || "N/A"}</strong></div>
        <div style="margin-top:4px;">📍 Địa chỉ: <strong>${order.shippingAddress || "N/A"}</strong></div>
      </div>
      <div>
        <div>💳 Thanh toán: <strong>${order.paymentMethod || "COD"}</strong></div>
        <div style="margin-top:4px;">👔 Nhân viên phụ trách: <strong>${order.employeeId || "Online"}</strong></div>
      </div>
    </div>

    <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:8px;">Danh sách sản phẩm trong hóa đơn:</h4>
    <div style="max-height:240px; overflow-y:auto; margin-bottom:16px;">
      ${itemsHtml}
    </div>

    <div style="border-top:1px dashed var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:1.1rem; font-weight:700;">Tổng thanh toán:</span>
      <span style="font-size:1.5rem; font-weight:900; color:var(--primary);">$${Number(order.totalAmount || 0).toFixed(2)}</span>
    </div>
  `;

  modal.classList.add("active");
}

/**
 * 9. BỘ LỌC ĐƠN HÀNG (THEO TRẠNG THÁI, TỪ KHÓA, KHOẢNG NGÀY)
 */
function initOrdersFilter() {
  const searchInput = document.getElementById("searchOrderKeyword");
  const statusFilter = document.getElementById("filterOrderStatus");
  const dateFrom = document.getElementById("filterOrderDateFrom");
  const dateTo = document.getElementById("filterOrderDateTo");
  const btnReset = document.getElementById("btnResetOrderFilter");

  function applyFilter() {
    const kw = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const st = statusFilter ? statusFilter.value : "";
    const dFrom = dateFrom ? dateFrom.value : "";
    const dTo = dateTo ? dateTo.value : "";

    filteredOrders = allOrders.filter((order) => {
      // Tìm theo mã đơn hoặc tên khách
      if (kw) {
        const matchId = (order.id || "").toLowerCase().includes(kw);
        const matchName = (order.customerName || "").toLowerCase().includes(kw);
        if (!matchId && !matchName) return false;
      }

      // Lọc theo trạng thái
      if (st && order.status !== st) return false;

      // Lọc theo ngày
      if (dFrom && order.createdAt && order.createdAt < dFrom) return false;
      if (dTo && order.createdAt && order.createdAt > dTo) return false;

      return true;
    });

    renderOrdersTable(filteredOrders);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilter);
  if (statusFilter) statusFilter.addEventListener("change", applyFilter);
  if (dateFrom) dateFrom.addEventListener("change", applyFilter);
  if (dateTo) dateTo.addEventListener("change", applyFilter);

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "";
      if (dateFrom) dateFrom.value = "";
      if (dateTo) dateTo.value = "";
      filteredOrders = [...allOrders];
      renderOrdersTable(filteredOrders);
    });
  }
}

