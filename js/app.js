/**
 * ==============================================================================
 * APP.JS - KHỞI CHẠY GIAO DIỆN & XỬ LÝ SẢN PHẨM (CÂU 2, 3, 4, 5, 6, 7)
 * ==============================================================================
 */

import { loadProducts } from "../assets/js/dataService.js";
import {
  fetchAndParseReviews,
  attachRatingBadgesToDom,
  openRatingDetailModal
} from "../assets/js/reviews.js";
import { cartState, initCart, openMiniCart } from "../assets/js/cart.js";
import { initCheckout, openCheckoutModal } from "../assets/js/checkout.js";
import { getCurrentUser, logout } from "../assets/js/auth.js";

// STATE TOÀN CỤC CHO TRANG CHỦ
let allProducts = [];
let filteredProducts = [];

// DOM ELEMENTS
const productsGrid = document.getElementById("productsGrid");
const productsResultSummary = document.getElementById("productsResultSummary");
const filterForm = document.getElementById("advancedFilterForm");
const filterKeyword = document.getElementById("filterKeyword");
const filterCategory = document.getElementById("filterCategory");
const filterPriceMin = document.getElementById("filterPriceMin");
const filterPriceMax = document.getElementById("filterPriceMax");
const filterRating = document.getElementById("filterRating");
const ratingDisplayValue = document.getElementById("ratingDisplayValue");
const btnResetFilter = document.getElementById("btnResetFilter");
const btnResetFilterHeader = document.getElementById("btnResetFilterHeader");
const priceValidationMsg = document.getElementById("priceValidationMsg");
const quickViewModal = document.getElementById("quickViewModal");
const quickViewBody = document.getElementById("quickViewBody");
const btnCloseModal = document.getElementById("btnCloseModal");
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   CÂU 3: SKELETON LOADING VỚI SHIMMER EFFECT TRƯỚC KHI TẢI DỮ LIỆU
   ========================================================================== */
function renderSkeletonLoading(count = 8) {
  productsGrid.innerHTML = "";
  const skeletonCardsHtml = Array.from({ length: count })
    .map(
      () => `
      <article class="skeleton-card" aria-hidden="true">
        <div class="skeleton-image skeleton-shimmer"></div>
        <div class="skeleton-body">
          <div class="skeleton-meta">
            <div class="skeleton-category skeleton-shimmer"></div>
            <div class="skeleton-brand skeleton-shimmer"></div>
          </div>
          <div class="skeleton-title skeleton-shimmer"></div>
          <div class="skeleton-title-short skeleton-shimmer"></div>
          <div class="skeleton-rating skeleton-shimmer"></div>
          <div class="skeleton-price-row">
            <div class="skeleton-price skeleton-shimmer"></div>
            <div class="skeleton-discount skeleton-shimmer"></div>
          </div>
          <div class="skeleton-variants">
            <div class="skeleton-select skeleton-shimmer"></div>
            <div class="skeleton-select skeleton-shimmer"></div>
          </div>
          <div class="skeleton-btn-row">
            <div class="skeleton-button-primary skeleton-shimmer"></div>
            <div class="skeleton-button-secondary skeleton-shimmer"></div>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  productsGrid.innerHTML = skeletonCardsHtml;
  productsResultSummary.textContent = `Đang tải danh mục sản phẩm (Đang hiển thị ${count} Skeleton Cards)...`;
}

/* ==========================================================================
   RENDER DANH SÁCH SẢN PHẨM THẬT (CÂU 4: ARTICLE & DATA ATTRIBUTES)
   ========================================================================== */
function renderProductCards(products) {
  productsGrid.innerHTML = "";

  if (!products || products.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-results-box">
        <h3>🔍 Không tìm thấy sản phẩm phù hợp</h3>
        <p>Vui lòng thử điều chỉnh lại bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
        <button id="btnResetSearchInline" class="btn btn-outline" type="button">Xóa bộ lọc để xem tất cả</button>
      </div>
    `;
    const btnInline = document.getElementById("btnResetSearchInline");
    if (btnInline) {
      btnInline.addEventListener("click", () => resetFilterForm());
    }
    productsResultSummary.textContent = "Tìm thấy 0 sản phẩm phù hợp.";
    return;
  }

  const html = products
    .map((product) => {
      // Tính giá sau giảm nếu có discount
      const originalPrice = product.price;
      const discountPercent = product.discount || 0;
      const finalPrice = discountPercent > 0
        ? (originalPrice * (1 - discountPercent / 100)).toFixed(2)
        : originalPrice.toFixed(2);

      // Tạo sao đánh giá
      const rateScore = product.rating?.rate || 0;
      const fullStars = "★".repeat(Math.round(rateScore));
      const emptyStars = "☆".repeat(5 - Math.round(rateScore));

      // Lựa chọn màu mặc định đầu tiên
      const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : "Tiêu chuẩn";
      const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : "Tiêu chuẩn";
      const initialVariant = `${defaultColor}-${defaultSize}`;

      // Options màu sắc
      const colorOptions = (product.colors || [])
        .map((c) => `<option value="${c.name}">${c.name}</option>`)
        .join("");

      // Options kích thước
      const sizeOptions = (product.sizes || [])
        .map((s) => `<option value="${s}">${s}</option>`)
        .join("");

      return `
        <article class="product-card" data-id="${product.id}" data-category="${product.category}">
          <!-- KHỐI ẢNH VÀ BADGE -->
          <div class="card-image-wrap">
            <div class="card-badges">
              <span class="badge badge-category">${product.category}</span>
              ${discountPercent > 0 ? `<span class="badge badge-discount">-${discountPercent}%</span>` : ""}
            </div>
            <img 
              src="${product.image}" 
              alt="${product.title}" 
              loading="lazy" 
              onerror="this.onerror=null;this.src='https://placehold.co/300x300?text=No+Image';"
            />
            <!-- SPAN RATING-BADGE CÂU 5 SẼ ĐƯỢC TẠO VÀ CHÈN TẠI ĐÂY -->
            <div class="card-quick-overlay">
              <button 
                type="button" 
                class="btn btn-primary" 
                data-action="quick-view" 
                data-id="${product.id}" 
                data-variant="${initialVariant}"
                title="Xem chi tiết nhanh"
              >
                👁️ Xem Nhanh
              </button>
            </div>
          </div>

          <!-- NỘI DUNG SẢN PHẨM -->
          <div class="card-content">
            <div class="card-meta">
              <span class="product-brand">${product.brand || "Chính hãng"}</span>
              <span class="product-stock">Kho: <strong>${product.stock || 0}</strong></span>
            </div>

            <h2 class="product-title" title="${product.title}">${product.title}</h2>

            <div class="product-rating">
              <span class="rating-stars">${fullStars}${emptyStars}</span>
              <span class="rating-score">${rateScore}</span>
              <span class="rating-count">(${product.rating?.count || 0})</span>
            </div>

            <div class="card-price-row">
              <span class="current-price">$${finalPrice}</span>
              ${discountPercent > 0 ? `<span class="original-price">$${originalPrice.toFixed(2)}</span>` : ""}
            </div>

            <!-- CHỌN NHANH BIẾN THỂ MÀU SẮC & KÍCH THƯỚC (CÂU 4) -->
            <div class="card-variants-row">
              <select class="variant-select variant-color-select" aria-label="Chọn màu sắc" title="Chọn màu sắc">
                ${colorOptions}
              </select>
              <select class="variant-select variant-size-select" aria-label="Chọn kích thước" title="Chọn kích thước">
                ${sizeOptions}
              </select>
            </div>

            <!-- NÚT THAO TÁC CÂU 4: DATA-ACTION, DATA-ID, DATA-VARIANT -->
            <div class="card-actions">
              <button 
                type="button" 
                class="btn btn-add-cart" 
                data-action="add-to-cart" 
                data-id="${product.id}" 
                data-variant="${initialVariant}"
                title="Thêm sản phẩm này vào giỏ hàng"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Thêm Giỏ
              </button>

              <button 
                type="button" 
                class="btn btn-quick-view" 
                data-action="quick-view" 
                data-id="${product.id}" 
                data-variant="${initialVariant}"
                title="Xem chi tiết nhanh"
              >
                Xem nhanh
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  productsGrid.innerHTML = html;
  productsResultSummary.textContent = `Hiển thị ${products.length} trên tổng số ${allProducts.length} sản phẩm.`;

  // CÂU 5: Sau khi DOM đã được render, tạo và chèn thẻ <span class="rating-badge"> đè lên ảnh
  attachRatingBadgesToDom("#productsGrid");
}

/* ==========================================================================
   CẬP NHẬT BIẾN THỂ KHI NGƯỜI DÙNG THAY ĐỔI DROPDOWN MÀU/SIZE
   ========================================================================== */
function initVariantChangeListeners() {
  productsGrid.addEventListener("change", (e) => {
    if (e.target.matches(".variant-color-select") || e.target.matches(".variant-size-select")) {
      const card = e.target.closest(".product-card");
      if (!card) return;

      const colorSelect = card.querySelector(".variant-color-select");
      const sizeSelect = card.querySelector(".variant-size-select");

      const chosenColor = colorSelect ? colorSelect.value : "";
      const chosenSize = sizeSelect ? sizeSelect.value : "";
      const newVariant = `${chosenColor}-${chosenSize}`;

      const actionButtons = card.querySelectorAll("[data-action]");
      actionButtons.forEach((btn) => {
        btn.setAttribute("data-variant", newVariant);
      });
    }
  });
}

/* ==========================================================================
   // ===== CÂU 4: EVENT DELEGATION DUY NHẤT TRÊN CONTAINER CHA CHỨA TOÀN BỘ SẢN PHẨM =====
   - Gắn DUY NHẤT 1 addEventListener('click') trên #productsGrid
   - Dùng event.target.closest('[data-action]')
   - Bắt các action: "add-to-cart", "quick-view", "rating-detail" (Câu 5)
   - Lấy data-id và data-variant, in console.log và hiện toast notification
   ========================================================================== */
export function setupProductEventDelegation() {
  console.log("👉 [CÂU 4] Đã đăng ký Event Delegation duy nhất trên container: #productsGrid");

  productsGrid.addEventListener("click", (event) => {
    // 1. Kiểm tra click trúng phần tử có [data-action] hoặc con của nó
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;

    event.preventDefault();

    // 2. Lấy dữ liệu data-id và data-variant
    const productId = actionElement.getAttribute("data-id");
    let variant = actionElement.getAttribute("data-variant");

    // Lấy biến thể thực tế từ dropdown trong card
    const card = actionElement.closest(".product-card");
    let colorVal = "Tiêu chuẩn";
    let sizeVal = "Tiêu chuẩn";

    if (card) {
      colorVal = card.querySelector(".variant-color-select")?.value || colorVal;
      sizeVal = card.querySelector(".variant-size-select")?.value || sizeVal;
      variant = `${colorVal}-${sizeVal}`;
    }

    const action = actionElement.getAttribute("data-action");
    const product = allProducts.find((p) => String(p.id) === String(productId));
    const productTitle = product ? product.title : `Sản phẩm #${productId}`;

    // 3. In ra Console theo chuẩn Test Case Câu 4
    console.group(`🎯 [CÂU 4 EVENT DELEGATION] Click Action: "${action}"`);
    console.log(`- Product ID:`, productId);
    console.log(`- Product Title:`, productTitle);
    console.log(`- Variant (Màu-Size):`, variant);
    console.log(`- Target Element:`, actionElement);
    console.groupEnd();

    // 4. Xử lý từng action
    if (action === "add-to-cart") {
      // CÂU 6: Thêm vào Cart State, kiểm tra tồn kho
      const result = cartState.addItem(product, colorVal, sizeVal, 1);
      if (result.success) {
        showToast(
          `🛒 ${result.message}<br><small>SP: <strong>${productTitle.substring(0, 26)}...</strong> [${variant}]</small>`,
          "toast-success"
        );
      } else {
        showToast(`⚠️ ${result.message}`, "toast-info");
      }
    } else if (action === "quick-view") {
      handleQuickView(product, variant);
    } else if (action === "rating-detail") {
      // CÂU 5: Mở modal Rating Detail bằng Event Delegation chung
      openRatingDetailModal(productId, allProducts);
      showToast(`⭐ Đang xem chi tiết đánh giá của: <strong>SP #${productId}</strong>`, "toast-info");
    }
  });
}

/* XỬ LÝ MỞ MODAL XEM NHANH (CÂU 4) */
function handleQuickView(product, variant) {
  if (!product) return;

  const originalPrice = product.price;
  const discountPercent = product.discount || 0;
  const finalPrice = discountPercent > 0
    ? (originalPrice * (1 - discountPercent / 100)).toFixed(2)
    : originalPrice.toFixed(2);

  const rateScore = product.rating?.rate || 0;
  const fullStars = "★".repeat(Math.round(rateScore));
  const emptyStars = "☆".repeat(5 - Math.round(rateScore));

  const variantListHtml = (product.variants || [])
    .map(
      (v) => `
      <span class="badge" style="background:#f1f5f9; border:1px solid #cbd5e1; margin:2px;">
        ${v.color} - ${v.size} (Còn: ${v.stock})
      </span>`
    )
    .join("");

  quickViewBody.innerHTML = `
    <div class="modal-product-layout">
      <div class="modal-img-container">
        <img src="${product.image}" alt="${product.title}">
      </div>
      <div class="modal-details">
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="badge badge-category">${product.category}</span>
          <span class="badge" style="background:#e0f2fe; color:#0369a1;">Thương hiệu: ${product.brand || "Chính hãng"}</span>
        </div>

        <h2 class="modal-title">${product.title}</h2>

        <div class="product-rating">
          <span class="rating-stars">${fullStars}${emptyStars}</span>
          <span><strong>${rateScore}</strong> / 5.0 (${product.rating?.count || 0} lượt đánh giá)</span>
        </div>

        <div class="card-price-row" style="margin: 8px 0;">
          <span class="current-price" style="font-size: 1.6rem;">$${finalPrice}</span>
          ${discountPercent > 0 ? `<span class="original-price" style="font-size: 1.1rem;">$${originalPrice.toFixed(2)}</span>` : ""}
          ${discountPercent > 0 ? `<span class="badge badge-discount">Tiết kiệm ${discountPercent}%</span>` : ""}
        </div>

        <p class="modal-desc">${product.description}</p>

        <div class="modal-stock-info">
          <span>📦 Tổng tồn kho: <strong>${product.stock || 0} sản phẩm</strong></span>
          <span>📅 Ngày nhập: <strong>${product.importDate || "2026-08-01"}</strong></span>
        </div>

        <div style="margin-top: 6px;">
          <label style="font-size: 0.85rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">
            Các biến thể sẵn có trong kho:
          </label>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${variantListHtml || "<span>Không có thông tin biến thể</span>"}
          </div>
        </div>

        <div style="margin-top: 14px; display:flex; gap:10px;">
          <button 
            type="button" 
            class="btn btn-primary" 
            data-action="add-to-cart" 
            data-id="${product.id}" 
            data-variant="${variant}"
            style="flex:1;"
          >
            🛒 Thêm Ngay Vào Giỏ Hàng
          </button>
        </div>
      </div>
    </div>
  `;

  quickViewModal.classList.add("active");
  quickViewModal.setAttribute("aria-hidden", "false");

  showToast(
    `🔍 Đang xem nhanh: <strong>${product.title.substring(0, 32)}...</strong><br><small>Mã SP: #${product.id} | Biến thể: <code>${variant}</code></small>`,
    "toast-info"
  );
}

/* ĐÓNG MODAL QUICK VIEW */
function closeQuickViewModal() {
  quickViewModal.classList.remove("active");
  quickViewModal.setAttribute("aria-hidden", "true");
}

if (btnCloseModal) btnCloseModal.addEventListener("click", closeQuickViewModal);
if (quickViewModal) {
  quickViewModal.addEventListener("click", (e) => {
    if (e.target === quickViewModal) closeQuickViewModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && quickViewModal.classList.contains("active")) {
    closeQuickViewModal();
  }
});

/* ==========================================================================
   TOAST NOTIFICATION (HIỂN THỊ DỄ CHỤP ẢNH TEST CASE)
   ========================================================================== */
export function showToast(message, type = "toast-info", duration = 3500) {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div style="flex:1;">${message}</div>
    <button type="button" style="color:#cbd5e1; font-weight:bold; font-size:1.1rem; line-height:1;">&times;</button>
  `;

  toast.querySelector("button").addEventListener("click", () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastFadeOut 0.3s forwards";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ==========================================================================
   CÂU 2: FORM TÌM KIẾM NÂNG CAO & VALIDATION
   ========================================================================== */
function validatePriceRange() {
  const minVal = filterPriceMin.value !== "" ? parseFloat(filterPriceMin.value) : null;
  const maxVal = filterPriceMax.value !== "" ? parseFloat(filterPriceMax.value) : null;

  if (minVal !== null && maxVal !== null && minVal > maxVal) {
    const errorMsg = "Giá tối thiểu ($" + minVal + ") không được lớn hơn giá tối đa ($" + maxVal + ")!";
    filterPriceMin.setCustomValidity(errorMsg);
    filterPriceMax.setCustomValidity(errorMsg);
    priceValidationMsg.textContent = "❌ " + errorMsg;
    priceValidationMsg.style.color = "var(--danger)";
    return false;
  } else {
    filterPriceMin.setCustomValidity("");
    filterPriceMax.setCustomValidity("");
    priceValidationMsg.textContent = "Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa";
    priceValidationMsg.style.color = "var(--text-muted)";
    return true;
  }
}

filterPriceMin.addEventListener("input", validatePriceRange);
filterPriceMax.addEventListener("input", validatePriceRange);

if (filterRating && ratingDisplayValue) {
  filterRating.addEventListener("input", () => {
    ratingDisplayValue.textContent = `⭐ ${parseFloat(filterRating.value).toFixed(1)}+`;
  });
}

function populateCategories(products) {
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  filterCategory.innerHTML = `<option value="">-- Tất cả danh mục (${categories.length}) --</option>`;
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    filterCategory.appendChild(opt);
  });
}

function applyProductFilter() {
  const keyword = filterKeyword.value.trim().toLowerCase();
  const selectedCategory = filterCategory.value;
  const minPrice = filterPriceMin.value !== "" ? parseFloat(filterPriceMin.value) : null;
  const maxPrice = filterPriceMax.value !== "" ? parseFloat(filterPriceMax.value) : null;
  const minRating = filterRating ? parseFloat(filterRating.value) : 1;

  const selectedColorRadio = document.querySelector('input[name="color"]:checked');
  const selectedColor = selectedColorRadio ? selectedColorRadio.value : "";

  filteredProducts = allProducts.filter((product) => {
    if (keyword) {
      const matchTitle = product.title.toLowerCase().includes(keyword);
      const matchDesc = product.description.toLowerCase().includes(keyword);
      const matchBrand = (product.brand || "").toLowerCase().includes(keyword);
      if (!matchTitle && !matchDesc && !matchBrand) return false;
    }

    if (selectedCategory && product.category !== selectedCategory) return false;

    const price = product.price;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;

    const rate = product.rating?.rate || 0;
    if (rate < minRating) return false;

    if (selectedColor) {
      const hasColor = (product.colors || []).some((c) =>
        c.name.toLowerCase().includes(selectedColor.toLowerCase())
      );
      if (!hasColor) return false;
    }

    return true;
  });

  renderProductCards(filteredProducts);
}

if (filterForm) {
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validatePriceRange()) {
      filterForm.reportValidity();
      return;
    }
    applyProductFilter();
    showToast(`🔍 Đã áp dụng bộ lọc! Tìm thấy ${filteredProducts.length} sản phẩm.`, "toast-info");
  });
}

function resetFilterForm() {
  if (filterForm) filterForm.reset();
  filterPriceMin.setCustomValidity("");
  filterPriceMax.setCustomValidity("");
  priceValidationMsg.textContent = "Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa";
  priceValidationMsg.style.color = "var(--text-muted)";

  if (ratingDisplayValue) ratingDisplayValue.textContent = "⭐ 1.0+";

  filteredProducts = [...allProducts];
  renderProductCards(filteredProducts);
  showToast("🔄 Đã thiết lập lại toàn bộ bộ lọc.", "toast-info");
}

if (btnResetFilter) {
  btnResetFilter.addEventListener("click", () => setTimeout(resetFilterForm, 50));
}
if (btnResetFilterHeader) {
  btnResetFilterHeader.addEventListener("click", resetFilterForm);
}

/* ==========================================================================
   HIỂN THỊ TRẠNG THÁI NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP TRÊN HEADER (CÂU 8)
   ========================================================================== */
function renderHeaderAuthState() {
  const user = getCurrentUser();
  const navAuthItem = document.getElementById("navAuthItem");
  const greetingBox = document.getElementById("headerUserGreeting");

  if (!greetingBox) return;

  if (user) {
    if (navAuthItem) navAuthItem.style.display = "none";
    greetingBox.style.display = "inline-flex";
    greetingBox.innerHTML = `
      <span>👤 Chào, <strong>${user.fullName.split(" ").slice(-2).join(" ")}</strong></span>
      ${user.role === "admin" || user.role === "staff" ? `<a href="admin.html" class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;">⚙️ Quản trị</a>` : ""}
      <button id="btnHeaderLogout" class="btn btn-secondary" type="button" style="padding:4px 8px; font-size:0.75rem;">Đăng xuất</button>
    `;

    const btnLogout = greetingBox.querySelector("#btnHeaderLogout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        logout();
      });
    }
  } else {
    if (navAuthItem) navAuthItem.style.display = "block";
    greetingBox.style.display = "none";
  }
}

/* ==========================================================================
   HÀM KHỞI CHẠY CHÍNH (INIT APPLICATION)
   ========================================================================== */
export async function initApp() {
  console.log("🚀 Khởi chạy UEL Store Application...");

  // BƯỚC 1: Render 8 Skeleton Loading Cards ngay lập tức (CÂU 3)
  renderSkeletonLoading(8);

  // Đăng ký Event Delegation cho các nút trên Product Card (CÂU 4, CÂU 5)
  setupProductEventDelegation();
  initVariantChangeListeners();

  // Khởi tạo Giỏ Hàng (CÂU 6) & Checkout Modal (CÂU 7)
  initCart();
  initCheckout();
  renderHeaderAuthState();

  try {
    // BƯỚC 2: Gọi đồng thời dữ liệu sản phẩm và dữ liệu đánh giá XML (CÂU 5)
    const [productsData] = await Promise.all([
      loadProducts("data/products.xml"),
      fetchAndParseReviews("data/reviews.xml")
    ]);

    allProducts = productsData;
    filteredProducts = [...allProducts];

    // BƯỚC 3: Điền danh mục vào dropdown
    populateCategories(allProducts);

    // BƯỚC 4: Dùng setTimeout 1.5 - 2s (chọn 1.8s) để người dùng quan sát Skeleton Shimmer
    setTimeout(() => {
      renderProductCards(filteredProducts);
      console.log(`✅ [CÂU 3] Đã nạp thành công ${allProducts.length} sản phẩm thật sau thời gian chờ Skeleton!`);
    }, 1800);
  } catch (error) {
    console.error("❌ Lỗi khi khởi động ứng dụng:", error);
    productsGrid.innerHTML = `
      <div class="no-results-box" style="border-color: var(--danger);">
        <h3 style="color: var(--danger);">Lỗi tải dữ liệu sản phẩm</h3>
        <p>${error.message}</p>
        <p><small>Hãy đảm bảo bạn đang mở website qua Live Server (HTTP/HTTPS) để trình duyệt không chặn fetch XML.</small></p>
      </div>
    `;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
