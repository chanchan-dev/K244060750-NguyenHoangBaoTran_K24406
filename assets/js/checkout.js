/**
 * ==============================================================================
 * CHECKOUT.JS (CÂU 7)
 * - Modal Form thông tin giao hàng
 * - Tự viết Regex kiểm tra NGAY LẬP TỨC (keyup & blur) cho SĐT Việt Nam & Email
 * - Đổi màu viền đỏ (is-invalid) / xanh (is-valid) và hiện thông báo lỗi/hợp lệ bên dưới
 * - Nút "Xác nhận thanh toán" chỉ bật khi tất cả trường bắt buộc hợp lệ
 * - Giả lập thanh toán qua setTimeout (1 giây), tạo đơn hàng lưu vào localStorage (key "orders")
 * - Trừ tồn kho giả lập, xóa giỏ hàng và hiển thị mã đơn hàng thành công
 * ==============================================================================
 */

import { cartState } from "./cart.js";

// REGEX KIỂM TRA TỰ VIẾT (KHÔNG DÙNG THƯ VIỆN NGOÀI)
export const VALIDATORS = {
  // SĐT Việt Nam: đầu 03, 05, 07, 08, 09 hoặc +84 tiếp theo là 8 số (tổng cộng 10 số)
  vietnamPhoneRegex: /^(0|\+84)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/,

  // Email chuẩn RFC
  emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Họ tên: tối thiểu 3 ký tự tiếng Việt / Latin, không chứa ký tự đặc biệt
  fullNameRegex: /^[a-zA-Z\s\u00C0-\u1EF9]{3,50}$/,

  // Địa chỉ: tối thiểu 6 ký tự
  addressMinLength: 6
};

// TRẠNG THÁI KIỂM THỬ TỪNG TRƯỜNG CỦA FORM
const formFieldValidity = {
  fullName: false,
  phone: false,
  email: false,
  address: false
};

/**
 * Hiển thị Modal Form Checkout
 */
export function openCheckoutModal() {
  if (cartState.items.length === 0) {
    alert("Giỏ hàng của bạn đang trống! Vui lòng chọn sản phẩm trước khi thanh toán.");
    return;
  }

  let modal = document.getElementById("checkoutModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "checkoutModal";
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    document.body.appendChild(modal);
  }

  const totalAmount = cartState.total.toFixed(2);
  const totalCount = cartState.getTotalCount();

  modal.innerHTML = `
    <div class="modal-container checkout-modal-container">
      <div class="checkout-header">
        <h2>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Thông Tin Giao Hàng &amp; Thanh Toán
        </h2>
        <button id="btnCloseCheckoutModal" class="modal-close-btn" type="button">&times;</button>
      </div>

      <div class="checkout-body">
        <form id="checkoutForm" class="checkout-form" novalidate>
          <div class="form-grid-2">
            <!-- HỌ VÀ TÊN -->
            <div class="form-field">
              <label for="checkoutName">Họ và tên người nhận <span class="required-mark">*</span></label>
              <input 
                type="text" 
                id="checkoutName" 
                placeholder="Nguyễn Văn A" 
                autocomplete="name"
              />
              <div id="msgName" class="validation-msg"></div>
            </div>

            <!-- SỐ ĐIỆN THOẠI VIỆT NAM (CÂU 7) -->
            <div class="form-field">
              <label for="checkoutPhone">Số điện thoại Việt Nam <span class="required-mark">*</span></label>
              <input 
                type="tel" 
                id="checkoutPhone" 
                placeholder="0901234567 hoặc +84901234567" 
                autocomplete="tel"
              />
              <div id="msgPhone" class="validation-msg"></div>
            </div>
          </div>

          <div class="form-grid-2">
            <!-- EMAIL -->
            <div class="form-field">
              <label for="checkoutEmail">Địa chỉ Email <span class="required-mark">*</span></label>
              <input 
                type="email" 
                id="checkoutEmail" 
                placeholder="vidu@gmail.com" 
                autocomplete="email"
              />
              <div id="msgEmail" class="validation-msg"></div>
            </div>

            <!-- ĐỊA CHỈ NHẬN HÀNG -->
            <div class="form-field">
              <label for="checkoutAddress">Địa chỉ nhận hàng chi tiết <span class="required-mark">*</span></label>
              <input 
                type="text" 
                id="checkoutAddress" 
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP" 
                autocomplete="street-address"
              />
              <div id="msgAddress" class="validation-msg"></div>
            </div>
          </div>

          <!-- GHI CHÚ GIAO HÀNG -->
          <div class="form-field">
            <label for="checkoutNotes">Ghi chú giao hàng (Không bắt buộc)</label>
            <textarea id="checkoutNotes" rows="2" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."></textarea>
          </div>

          <!-- PHƯƠNG THỨC THANH TOÁN -->
          <div class="form-field">
            <label>Phương thức thanh toán <span class="required-mark">*</span></label>
            <div class="payment-methods-grid">
              <label class="payment-method-card selected">
                <input type="radio" name="paymentMethod" value="COD" checked>
                <div>
                  <strong>Thanh toán khi nhận (COD)</strong>
                  <div style="font-size:0.75rem; color:#64748b;">Trả tiền mặt trực tiếp khi nhận hàng</div>
                </div>
              </label>

              <label class="payment-method-card">
                <input type="radio" name="paymentMethod" value="Chuyển khoản ngân hàng">
                <div>
                  <strong>Chuyển khoản (VietQR)</strong>
                  <div style="font-size:0.75rem; color:#64748b;">Quét mã QR chuyển khoản 24/7</div>
                </div>
              </label>

              <label class="payment-method-card">
                <input type="radio" name="paymentMethod" value="Ví MoMo">
                <div>
                  <strong>Ví Điện Tử MoMo</strong>
                  <div style="font-size:0.75rem; color:#64748b;">Thanh toán siêu tốc qua ứng dụng MoMo</div>
                </div>
              </label>

              <label class="payment-method-card">
                <input type="radio" name="paymentMethod" value="Thẻ tín dụng">
                <div>
                  <strong>Thẻ Visa / Master / JCB</strong>
                  <div style="font-size:0.75rem; color:#64748b;">Thẻ tín dụng hoặc ghi nợ quốc tế</div>
                </div>
              </label>
            </div>
          </div>

          <!-- TÓM TẮT ĐƠN HÀNG -->
          <div class="checkout-order-summary">
            <div>
              <span class="summary-badge-count">Tổng ${totalCount} sản phẩm trong giỏ hàng</span>
              <div style="font-size: 0.8rem; color: #64748b;">Đã bao gồm VAT và miễn phí giao hàng toàn quốc</div>
            </div>
            <div class="summary-total-pay">$${totalAmount}</div>
          </div>

          <!-- NÚT XÁC NHẬN THANH TOÁN (MẶC ĐỊNH BỊ DISABLED CHO ĐẾN KHI HỢP LỆ) -->
          <div class="checkout-actions">
            <button 
              type="submit" 
              id="btnConfirmOrder" 
              class="btn-submit-order" 
              disabled
              title="Vui lòng điền đúng và đủ thông tin bắt buộc để bật nút thanh toán"
            >
              🔒 Xác Nhận Đặt Hàng &amp; Thanh Toán ($${totalAmount})
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");

  // Đóng modal
  const btnClose = modal.querySelector("#btnCloseCheckoutModal");
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
    });
  }

  // Khởi tạo các sự kiện kiểm tra Realtime (blur + keyup)
  initRealtimeValidation(modal);
}

/**
 * KIỂM TRA REALTIME (KEYUP & BLUR) CHO TỪNG INPUT
 */
function initRealtimeValidation(modal) {
  const inputName = modal.querySelector("#checkoutName");
  const inputPhone = modal.querySelector("#checkoutPhone");
  const inputEmail = modal.querySelector("#checkoutEmail");
  const inputAddress = modal.querySelector("#checkoutAddress");
  const btnConfirm = modal.querySelector("#btnConfirmOrder");
  const form = modal.querySelector("#checkoutForm");

  // Radio button chọn phương thức thanh toán
  const paymentCards = modal.querySelectorAll(".payment-method-card");
  paymentCards.forEach((card) => {
    card.addEventListener("click", () => {
      paymentCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  // 1. Kiểm tra Họ và Tên
  function validateName() {
    const val = inputName.value.trim();
    const msgEl = modal.querySelector("#msgName");
    if (!val) {
      setFieldError(inputName, msgEl, "Vui lòng nhập họ và tên của bạn.");
      formFieldValidity.fullName = false;
    } else if (val.length < 3) {
      setFieldError(inputName, msgEl, "Họ và tên phải có ít nhất 3 ký tự.");
      formFieldValidity.fullName = false;
    } else if (!VALIDATORS.fullNameRegex.test(val)) {
      setFieldError(inputName, msgEl, "Họ và tên không được chứa số hoặc ký tự đặc biệt.");
      formFieldValidity.fullName = false;
    } else {
      setFieldSuccess(inputName, msgEl, "Họ và tên hợp lệ.");
      formFieldValidity.fullName = true;
    }
    checkAllFieldsValid(btnConfirm);
  }

  // 2. Kiểm tra Số điện thoại Việt Nam (Regex Câu 7)
  function validatePhone() {
    const val = inputPhone.value.trim();
    const msgEl = modal.querySelector("#msgPhone");
    if (!val) {
      setFieldError(inputPhone, msgEl, "Vui lòng nhập số điện thoại người nhận.");
      formFieldValidity.phone = false;
    } else if (!VALIDATORS.vietnamPhoneRegex.test(val)) {
      setFieldError(
        inputPhone,
        msgEl,
        "Số điện thoại không hợp lệ! Vui lòng nhập đầu số VN (03, 05, 07, 08, 09 hoặc +84) gồm 10 chữ số."
      );
      formFieldValidity.phone = false;
    } else {
      setFieldSuccess(inputPhone, msgEl, "Số điện thoại Việt Nam hợp lệ.");
      formFieldValidity.phone = true;
    }
    checkAllFieldsValid(btnConfirm);
  }

  // 3. Kiểm tra Email (Regex Câu 7)
  function validateEmail() {
    const val = inputEmail.value.trim();
    const msgEl = modal.querySelector("#msgEmail");
    if (!val) {
      setFieldError(inputEmail, msgEl, "Vui lòng nhập địa chỉ email để nhận hóa đơn.");
      formFieldValidity.email = false;
    } else if (!VALIDATORS.emailRegex.test(val)) {
      setFieldError(inputEmail, msgEl, "Định dạng email không đúng (ví dụ: tenban@gmail.com).");
      formFieldValidity.email = false;
    } else {
      setFieldSuccess(inputEmail, msgEl, "Địa chỉ email hợp lệ.");
      formFieldValidity.email = true;
    }
    checkAllFieldsValid(btnConfirm);
  }

  // 4. Kiểm tra Địa chỉ
  function validateAddress() {
    const val = inputAddress.value.trim();
    const msgEl = modal.querySelector("#msgAddress");
    if (!val) {
      setFieldError(inputAddress, msgEl, "Vui lòng nhập địa chỉ nhận hàng.");
      formFieldValidity.address = false;
    } else if (val.length < VALIDATORS.addressMinLength) {
      setFieldError(inputAddress, msgEl, "Địa chỉ giao hàng quá ngắn (tối thiểu 6 ký tự).");
      formFieldValidity.address = false;
    } else {
      setFieldSuccess(inputAddress, msgEl, "Địa chỉ nhận hàng hợp lệ.");
      formFieldValidity.address = true;
    }
    checkAllFieldsValid(btnConfirm);
  }

  // GẮN SỰ KIỆN BLUR & KEYUP CHO CẢ 4 TRƯỜNG
  [inputName, inputPhone, inputEmail, inputAddress].forEach((input) => {
    input.addEventListener("keyup", () => {
      if (input === inputName) validateName();
      if (input === inputPhone) validatePhone();
      if (input === inputEmail) validateEmail();
      if (input === inputAddress) validateAddress();
    });

    input.addEventListener("blur", () => {
      if (input === inputName) validateName();
      if (input === inputPhone) validatePhone();
      if (input === inputEmail) validateEmail();
      if (input === inputAddress) validateAddress();
    });
  });

  // XỬ LÝ SUBMIT FORM KHI NÚT ĐƯỢC BẬT
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Kiểm tra lại toàn bộ lần cuối
    validateName();
    validatePhone();
    validateEmail();
    validateAddress();

    if (!Object.values(formFieldValidity).every(Boolean)) {
      alert("Vui lòng sửa các thông tin chưa hợp lệ trước khi tiếp tục!");
      return;
    }

    // Tiến hành giả lập thanh toán
    processPayment(modal, {
      fullName: inputName.value.trim(),
      phone: inputPhone.value.trim(),
      email: inputEmail.value.trim(),
      address: inputAddress.value.trim(),
      notes: modal.querySelector("#checkoutNotes").value.trim(),
      paymentMethod: modal.querySelector('input[name="paymentMethod"]:checked')?.value || "COD"
    });
  });
}

function setFieldError(input, msgEl, message) {
  input.classList.remove("is-valid");
  input.classList.add("is-invalid");
  if (msgEl) {
    msgEl.className = "validation-msg msg-error";
    msgEl.innerHTML = `⚠️ ${message}`;
  }
}

function setFieldSuccess(input, msgEl, message) {
  input.classList.remove("is-invalid");
  input.classList.add("is-valid");
  if (msgEl) {
    msgEl.className = "validation-msg msg-success";
    msgEl.innerHTML = `✓ ${message}`;
  }
}

function checkAllFieldsValid(btn) {
  const allValid = Object.values(formFieldValidity).every(Boolean);
  if (btn) {
    btn.disabled = !allValid;
  }
}

/**
 * GIẢ LẬP GỌI API THANH TOÁN (SETTIMEOUT 1 GIÂY) & TẠO ĐƠN HÀNG LƯU VÀO LOCALSTORAGE
 */
function processPayment(modal, customerInfo) {
  const btn = modal.querySelector("#btnConfirmOrder");
  const body = modal.querySelector(".checkout-body");

  // 1. Trạng thái đang xử lý thanh toán
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-icon"></span> Đang kết nối cổng thanh toán an toàn...`;

  // 2. setTimeout giả lập 1 giây
  setTimeout(() => {
    // Tạo mã hóa đơn ngẫu nhiên chuẩn HDxxxxxx
    const orderId = "HD" + Math.floor(100000 + Math.random() * 900000);
    const currentDate = new Date().toISOString().split("T")[0];

    const newOrder = {
      id: orderId,
      createdAt: currentDate,
      employeeId: "EMP01", // Mặc định gán nhân viên phụ trách trực tuyến
      customer: {
        fullName: customerInfo.fullName,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.address
      },
      shippingAddress: customerInfo.address,
      paymentMethod: customerInfo.paymentMethod,
      notes: customerInfo.notes,
      status: customerInfo.paymentMethod === "COD" ? "pending" : "paid",
      items: cartState.items.map((it) => ({
        productId: it.productId,
        title: it.title,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        unitPrice: it.price
      })),
      totalAmount: Number(cartState.total.toFixed(2))
    };

    // 3. Lưu vào LocalStorage key "orders" (kết nối cho Câu 8 Admin)
    try {
      const existingOrdersStr = localStorage.getItem("orders");
      const existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
      existingOrders.unshift(newOrder);
      localStorage.setItem("orders", JSON.stringify(existingOrders));
      console.log("💾 [CÂU 7] Đã lưu đơn hàng mới vào localStorage['orders']:", newOrder);
    } catch (e) {
      console.error("Lỗi khi lưu orders vào localStorage:", e);
    }

    // 4. Trừ tồn kho giả lập & Xóa giỏ hàng
    cartState.clear();

    // 5. Hiển thị màn hình đặt hàng thành công
    body.innerHTML = `
      <div class="order-success-screen">
        <div class="order-success-icon">✓</div>
        <h2 style="font-size: 1.45rem; color: var(--secondary); font-weight: 800;">
          Đặt Hàng Thành Công!
        </h2>
        <p style="color: var(--text-muted); font-size: 0.95rem;">
          Cảm ơn <strong>${customerInfo.fullName}</strong>. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
        </p>

        <div style="margin: 10px 0;">
          <span style="font-size: 0.85rem; color: #64748b; display: block; margin-bottom: 4px;">MÃ ĐƠN HÀNG CỦA BẠN:</span>
          <div class="order-success-code">${newOrder.id}</div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; width: 100%; text-align: left; font-size: 0.88rem;">
          <div>👤 Người nhận: <strong>${customerInfo.fullName}</strong> (${customerInfo.phone})</div>
          <div style="margin-top: 4px;">📍 Giao đến: <strong>${customerInfo.address}</strong></div>
          <div style="margin-top: 4px;">💳 Thanh toán: <strong>${customerInfo.paymentMethod}</strong> (Trạng thái: <span class="badge" style="background:#dcfce7; color:#166534;">${newOrder.status.toUpperCase()}</span>)</div>
          <div style="margin-top: 4px;">💰 Tổng thanh toán: <strong style="color: var(--primary); font-size: 1.1rem;">$${newOrder.totalAmount.toFixed(2)}</strong></div>
        </div>

        <div style="display: flex; gap: 12px; width: 100%; margin-top: 8px;">
          <button id="btnFinishCheckout" class="btn btn-primary" type="button" style="flex: 1;">
            Tiếp Tục Mua Sắm
          </button>
        </div>
      </div>
    `;

    // Nút hoàn tất
    const btnFinish = body.querySelector("#btnFinishCheckout");
    if (btnFinish) {
      btnFinish.addEventListener("click", () => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
      });
    }
  }, 1000);
}

/**
 * Khởi tạo lắng nghe sự kiện mở checkout modal
 */
export function initCheckout() {
  window.addEventListener("open-checkout-modal", () => {
    openCheckoutModal();
  });
}

