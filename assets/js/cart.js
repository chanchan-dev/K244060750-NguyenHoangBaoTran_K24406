/**
 * ==============================================================================
 * CART.JS (CÂU 6)
 * - Đối tượng cartState quản lý trạng thái giỏ hàng (State Pattern)
 * - Kiểm tra số lượng thêm vào giỏ không vượt quá tồn kho biến thể
 * - Render bảng Mini-cart đè màn hình (position: fixed, z-index cao)
 * - Tự động tính tổng tiền, lưu và phục hồi từ localStorage
 * - Cập nhật badge số lượng trên Header
 * ==============================================================================
 */

// LOCAL STORAGE KEY
const CART_STORAGE_KEY = "uel_store_cart_state";

/**
 * OBJECT QUẢN LÝ TRẠNG THÁI GIỎ HÀNG (STATE OBJECT - CÂU 6)
 */
export const cartState = {
  items: [],
  total: 0,

  /**
   * Tính lại tổng tiền sau mỗi thay đổi
   */
  calcTotal() {
    this.total = this.items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);
    this.saveToStorage();
    this.updateHeaderBadge();
    return this.total;
  },

  /**
   * Thêm sản phẩm vào giỏ (kiểm tra tồn kho biến thể)
   * @param {Object} product Đối tượng sản phẩm
   * @param {string} color Tên màu sắc
   * @param {string} size Kích cỡ
   * @param {number} qty Số lượng muốn thêm (mặc định 1)
   * @returns {Object} { success: boolean, message: string }
   */
  addItem(product, color = "Tiêu chuẩn", size = "Tiêu chuẩn", qty = 1) {
    if (!product) return { success: false, message: "Sản phẩm không hợp lệ!" };

    // Tìm tồn kho biến thể tương ứng
    let maxStock = product.stock || 99;
    if (product.variants && product.variants.length > 0) {
      const matchVariant = product.variants.find(
        (v) => (v.color === color || !color) && (v.size === size || !size)
      );
      if (matchVariant) {
        maxStock = matchVariant.stock;
      }
    }

    // Giá sau giảm (nếu có)
    const discount = product.discount || 0;
    const finalPrice = discount > 0
      ? Number((product.price * (1 - discount / 100)).toFixed(2))
      : Number(product.price);

    // Kiểm tra đã có sản phẩm cùng id + color + size chưa
    const existingIndex = this.items.findIndex(
      (item) =>
        Number(item.productId) === Number(product.id) &&
        item.color === color &&
        item.size === size
    );

    if (existingIndex > -1) {
      const currentQty = this.items[existingIndex].quantity;
      if (currentQty + qty > maxStock) {
        return {
          success: false,
          message: `Rất tiếc! Biến thể (${color} - ${size}) chỉ còn ${maxStock} sản phẩm trong kho.`
        };
      }
      this.items[existingIndex].quantity += qty;
    } else {
      if (qty > maxStock) {
        return {
          success: false,
          message: `Rất tiếc! Biến thể (${color} - ${size}) chỉ còn ${maxStock} sản phẩm trong kho.`
        };
      }
      this.items.push({
        productId: Number(product.id),
        title: product.title,
        price: finalPrice,
        originalPrice: product.price,
        image: product.image,
        color: color || "Tiêu chuẩn",
        size: size || "Tiêu chuẩn",
        quantity: qty,
        maxStock: maxStock
      });
    }

    this.calcTotal();
    renderMiniCart();
    return {
      success: true,
      message: `Đã thêm thành công vào giỏ hàng (${color} - ${size})!`
    };
  },

  /**
   * Cập nhật số lượng của dòng sản phẩm
   */
  updateQty(index, newQty) {
    if (index < 0 || index >= this.items.length) return false;
    const item = this.items[index];

    if (newQty <= 0) {
      return this.removeItem(index);
    }

    if (newQty > item.maxStock) {
      alert(`Số lượng yêu cầu vượt quá tồn kho hiện có (${item.maxStock} sản phẩm)!`);
      return false;
    }

    item.quantity = newQty;
    this.calcTotal();
    renderMiniCart();
    return true;
  },

  /**
   * Xóa 1 dòng sản phẩm khỏi giỏ
   */
  removeItem(index) {
    if (index < 0 || index >= this.items.length) return false;
    this.items.splice(index, 1);
    this.calcTotal();
    renderMiniCart();
    return true;
  },

  /**
   * Xóa toàn bộ giỏ hàng
   */
  clear() {
    this.items = [];
    this.total = 0;
    this.saveToStorage();
    this.updateHeaderBadge();
    renderMiniCart();
  },

  /**
   * Lấy tổng số lượng các món hàng trong giỏ
   */
  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  /**
   * Cập nhật badge số lượng trên header
   */
  updateHeaderBadge() {
    const badge = document.getElementById("cartCountBadge");
    if (badge) {
      badge.textContent = this.getTotalCount();
    }
  },

  /**
   * Lưu giỏ vào LocalStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          items: this.items,
          total: this.total
        })
      );
    } catch (e) {
      console.warn("Không thể lưu giỏ hàng vào localStorage", e);
    }
  },

  /**
   * Nạp lại giỏ hàng từ LocalStorage khi khởi động
   */
  loadFromStorage() {
    try {
      const dataStr = localStorage.getItem(CART_STORAGE_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        this.items = Array.isArray(parsed.items) ? parsed.items : [];
        this.calcTotal();
      }
    } catch (e) {
      console.warn("Lỗi khi khôi phục giỏ hàng từ localStorage", e);
      this.items = [];
      this.total = 0;
    }
    this.updateHeaderBadge();
  }
};

/**
 * RENDER GIAO DIỆN MINI-CART ĐÈ MÀN HÌNH (CÂU 6)
 */
export function renderMiniCart() {
  let drawer = document.getElementById("miniCartDrawer");
  let backdrop = document.getElementById("cartBackdrop");

  // Nếu chưa có khung HTML thì tạo động
  if (!drawer) {
    backdrop = document.createElement("div");
    backdrop.id = "cartBackdrop";
    backdrop.className = "cart-backdrop";
    document.body.appendChild(backdrop);

    drawer = document.createElement("aside");
    drawer.id = "miniCartDrawer";
    drawer.className = "mini-cart-drawer";
    drawer.setAttribute("aria-label", "Giỏ hàng mini");
    document.body.appendChild(drawer);

    // Đóng giỏ khi click ra ngoài backdrop
    backdrop.addEventListener("click", closeMiniCart);
  }

  const items = cartState.items;
  const total = cartState.total;
  const totalCount = cartState.getTotalCount();

  drawer.innerHTML = `
    <!-- HEADER MINI CART -->
    <div class="mini-cart-header">
      <h2>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        Giỏ Hàng (${totalCount})
      </h2>
      <button id="btnCloseMiniCart" class="mini-cart-close-btn" type="button" aria-label="Đóng giỏ">&times;</button>
    </div>

    <!-- BODY DANH SÁCH MÓN HÀNG -->
    <div class="mini-cart-body">
      ${
        items.length === 0
          ? `
          <div class="cart-empty-box">
            <span class="cart-empty-icon">🛒</span>
            <p>Giỏ hàng của bạn đang trống trơn!</p>
            <button id="btnContinueShopping" class="btn btn-outline" type="button">Tiếp tục mua sắm</button>
          </div>
        `
          : items
              .map(
                (item, idx) => `
            <div class="cart-item-row" data-cart-index="${idx}">
              <div class="cart-item-thumb">
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://placehold.co/60x60?text=SP';">
              </div>
              <div class="cart-item-info">
                <h4 class="cart-item-title" title="${item.title}">${item.title}</h4>
                <div class="cart-item-variant">Phân loại: <strong>${item.color} / ${item.size}</strong></div>
                <div class="cart-item-unit-price">$${item.price.toFixed(2)}</div>
                
                <!-- BỘ ĐIỀU CHỈNH SỐ LƯỢNG (+ / -) -->
                <div class="cart-qty-controls" style="margin-top: 4px;">
                  <button type="button" class="btn-qty btn-qty-minus" data-idx="${idx}">-</button>
                  <span class="cart-qty-value">${item.quantity}</span>
                  <button type="button" class="btn-qty btn-qty-plus" data-idx="${idx}" ${item.quantity >= item.maxStock ? "disabled" : ""}>+</button>
                </div>
              </div>
              <div class="cart-item-right">
                <div class="cart-item-subtotal">$${(item.price * item.quantity).toFixed(2)}</div>
                <button type="button" class="btn-remove-item" data-idx="${idx}" title="Xóa món này khỏi giỏ">
                  🗑️ Xóa
                </button>
              </div>
            </div>
          `
              )
              .join("")
      }
    </div>

    <!-- FOOTER TỔNG TIỀN VÀ NÚT HÀNH ĐỘNG -->
    <div class="mini-cart-footer">
      <div class="cart-summary-line">
        <span>Tổng số lượng sản phẩm:</span>
        <strong>${totalCount} món</strong>
      </div>
      <div class="cart-total-line">
        <span>Tổng thành tiền:</span>
        <span class="cart-total-amount">$${total.toFixed(2)}</span>
      </div>
      <div class="cart-footer-actions">
        <button id="btnClearCart" class="btn btn-clear-cart" type="button" ${items.length === 0 ? "disabled" : ""}>
          Xóa giỏ
        </button>
        <button id="btnProceedCheckout" class="btn btn-checkout-now" type="button" ${items.length === 0 ? "disabled" : ""}>
          Thanh Toán Ngay
        </button>
      </div>
    </div>
  `;

  // Gắn sự kiện cho các nút trong Mini-Cart
  const btnClose = drawer.querySelector("#btnCloseMiniCart");
  if (btnClose) btnClose.addEventListener("click", closeMiniCart);

  const btnContinue = drawer.querySelector("#btnContinueShopping");
  if (btnContinue) btnContinue.addEventListener("click", closeMiniCart);

  // Xóa giỏ
  const btnClear = drawer.querySelector("#btnClearCart");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?")) {
        cartState.clear();
      }
    });
  }

  // Tăng / Giảm / Xóa từng dòng (Event Delegation bên trong drawer)
  drawer.addEventListener("click", (e) => {
    const minusBtn = e.target.closest(".btn-qty-minus");
    const plusBtn = e.target.closest(".btn-qty-plus");
    const removeBtn = e.target.closest(".btn-remove-item");

    if (minusBtn) {
      const idx = Number(minusBtn.getAttribute("data-idx"));
      const cur = cartState.items[idx]?.quantity || 1;
      cartState.updateQty(idx, cur - 1);
    } else if (plusBtn) {
      const idx = Number(plusBtn.getAttribute("data-idx"));
      const cur = cartState.items[idx]?.quantity || 1;
      cartState.updateQty(idx, cur + 1);
    } else if (removeBtn) {
      const idx = Number(removeBtn.getAttribute("data-idx"));
      cartState.removeItem(idx);
    }
  });

  // Mở Checkout Modal khi bấm "Thanh Toán Ngay" (Câu 7)
  const btnCheckout = drawer.querySelector("#btnProceedCheckout");
  if (btnCheckout) {
    btnCheckout.addEventListener("click", () => {
      if (cartState.items.length === 0) {
        alert("Giỏ hàng đang trống! Vui lòng chọn sản phẩm trước khi thanh toán.");
        return;
      }
      closeMiniCart();
      // Kích hoạt sự kiện mở checkout
      window.dispatchEvent(new CustomEvent("open-checkout-modal"));
    });
  }
}

/**
 * Mở Mini-cart
 */
export function openMiniCart() {
  renderMiniCart();
  const drawer = document.getElementById("miniCartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (drawer) drawer.classList.add("active");
  if (backdrop) backdrop.classList.add("active");
}

/**
 * Đóng Mini-cart
 */
export function closeMiniCart() {
  const drawer = document.getElementById("miniCartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  if (drawer) drawer.classList.remove("active");
  if (backdrop) backdrop.classList.remove("active");
}

/**
 * Khởi tạo Cart State và nút mở giỏ trên header
 */
export function initCart() {
  cartState.loadFromStorage();

  const headerCartBtn = document.getElementById("headerCartBtn");
  if (headerCartBtn) {
    headerCartBtn.addEventListener("click", openMiniCart);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMiniCart();
  });
}

