/**
 * ==============================================================================
 * REVIEWS.JS (CÂU 5)
 * - Đọc data/reviews.xml bằng fetch + DOMParser (parseFromString)
 * - Duyệt các node <review>, tính điểm đánh giá TRUNG BÌNH cho từng product_id (làm tròn 1 chữ số thập phân)
 * - Tạo mới thẻ <span class="rating-badge"> bằng document.createElement đè lên ảnh sản phẩm
 * - Tạo nút "Rating Detail" trên mỗi sản phẩm (dùng chung Event Delegation với Câu 4)
 * - Mở modal Rating Detail hiển thị tên khách (từ data/customers.json), sao, bình luận, ngày
 * ==============================================================================
 */

import { loadCustomers } from "./dataService.js";

let reviewsData = [];
let customersData = [];
let productAverages = {}; // { productId: { average: 4.5, count: 8, reviews: [] } }

/**
 * 1. Đọc và parse XML reviews bằng DOMParser chuẩn W3C
 */
export async function fetchAndParseReviews(xmlPath = "data/reviews.xml") {
  try {
    const response = await fetch(xmlPath);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const xmlText = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Lỗi cú pháp XML trong reviews.xml: " + parseError.textContent);
    }

    const reviewNodes = Array.from(xmlDoc.querySelectorAll("reviews > review"));
    reviewsData = reviewNodes.map((node) => {
      const getVal = (tag) => {
        const el = node.querySelector(tag);
        return el ? el.textContent.trim() : "";
      };

      return {
        reviewId: node.getAttribute("id") || getVal("review_id"),
        productId: Number(getVal("product_id")),
        customerId: getVal("customer_id"),
        rating: Number(getVal("rating")),
        comment: getVal("comment"),
        date: getVal("date")
      };
    });

    // 2. Tải danh sách khách hàng để map tên khách hàng trong modal chi tiết
    try {
      customersData = await loadCustomers("data/customers.json");
    } catch (e) {
      console.warn("Không tải được customers.json, dùng fallback ID", e);
    }

    // 3. Tính điểm trung bình và gom nhóm review theo từng product_id
    productAverages = {};
    reviewsData.forEach((rev) => {
      const pId = rev.productId;
      if (!productAverages[pId]) {
        productAverages[pId] = {
          totalScore: 0,
          count: 0,
          reviews: []
        };
      }
      productAverages[pId].totalScore += rev.rating;
      productAverages[pId].count += 1;
      productAverages[pId].reviews.push(rev);
    });

    // Tính điểm trung bình (làm tròn 1 chữ số thập phân)
    Object.keys(productAverages).forEach((pId) => {
      const group = productAverages[pId];
      group.average = (group.totalScore / group.count).toFixed(1);
    });

    console.log("⭐ [CÂU 5] Đã tải và tính điểm TB thành công từ reviews.xml:", productAverages);
    return productAverages;
  } catch (error) {
    console.error("❌ Lỗi khi đọc reviews.xml bằng DOMParser:", error);
    return {};
  }
}

/**
 * 2. TẠO MỚI thẻ <span class="rating-badge"> bằng document.createElement
 * và đè lên ảnh sản phẩm trên DOM (CÂU 5)
 */
export function attachRatingBadgesToDom(containerSelector = "#productsGrid") {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const productCards = container.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    const productId = Number(card.getAttribute("data-id"));
    const reviewInfo = productAverages[productId];

    const imageWrap = card.querySelector(".card-image-wrap");
    if (!imageWrap) return;

    // Xóa badge cũ nếu đã tồn tại để tránh trùng lặp
    const existingBadge = imageWrap.querySelector(".rating-badge");
    if (existingBadge) existingBadge.remove();

    // BẮT BUỘC THEO ĐỀ BÀI: TẠO MỚI thẻ <span class="rating-badge"> bằng document.createElement
    const badgeSpan = document.createElement("span");
    badgeSpan.className = "rating-badge";

    if (reviewInfo && reviewInfo.count > 0) {
      badgeSpan.innerHTML = `★ ${reviewInfo.average}`;
      badgeSpan.title = `Đánh giá trung bình từ ${reviewInfo.count} khách hàng thực tế`;
    } else {
      badgeSpan.innerHTML = `★ Mới`;
      badgeSpan.classList.add("rating-badge-none");
      badgeSpan.title = "Chưa có đánh giá nào";
    }

    // Chèn span đè lên ảnh (div.card-image-wrap có position: relative)
    imageWrap.appendChild(badgeSpan);

    // Bổ sung nút/link "Rating Detail" vào khối thông tin sản phẩm
    const ratingRow = card.querySelector(".product-rating");
    if (ratingRow && !card.querySelector(".btn-rating-detail")) {
      const reviewCountText = reviewInfo ? `${reviewInfo.count} đánh giá` : "0 đánh giá";
      const ratingDetailBtn = document.createElement("button");
      ratingDetailBtn.type = "button";
      ratingDetailBtn.className = "btn-rating-detail";
      ratingDetailBtn.setAttribute("data-action", "rating-detail");
      ratingDetailBtn.setAttribute("data-id", String(productId));
      ratingDetailBtn.innerHTML = `💬 Rating Detail (${reviewCountText})`;
      ratingRow.appendChild(ratingDetailBtn);
    }
  });

  console.log(`✅ [CÂU 5] Đã gắn rating-badge và nút Rating Detail lên ${productCards.length} sản phẩm DOM!`);
}

/**
 * 3. Hiển thị Modal Rating Detail khi người dùng click vào "Rating Detail"
 * (Tên khách lấy từ customers.json, số sao, bình luận, ngày)
 */
export function openRatingDetailModal(productId, allProducts = []) {
  const pId = Number(productId);
  const reviewInfo = productAverages[pId];
  const product = allProducts.find((p) => Number(p.id) === pId);
  const productTitle = product ? product.title : `Sản phẩm #${productId}`;

  // Tạo hoặc lấy modal review detail
  let reviewModal = document.getElementById("reviewDetailModal");
  if (!reviewModal) {
    reviewModal = document.createElement("div");
    reviewModal.id = "reviewDetailModal";
    reviewModal.className = "modal-overlay";
    reviewModal.setAttribute("role", "dialog");
    reviewModal.setAttribute("aria-modal", "true");
    reviewModal.innerHTML = `
      <div class="modal-container" style="max-width: 650px;">
        <button id="btnCloseReviewModal" class="modal-close-btn" type="button">&times;</button>
        <div id="reviewModalBody" style="padding: 24px;"></div>
      </div>
    `;
    document.body.appendChild(reviewModal);

    const closeBtn = reviewModal.querySelector("#btnCloseReviewModal");
    closeBtn.addEventListener("click", () => {
      reviewModal.classList.remove("active");
    });
    reviewModal.addEventListener("click", (e) => {
      if (e.target === reviewModal) reviewModal.classList.remove("active");
    });
  }

  const reviewModalBody = reviewModal.querySelector("#reviewModalBody");

  // Nếu chưa có review
  if (!reviewInfo || reviewInfo.reviews.length === 0) {
    reviewModalBody.innerHTML = `
      <div style="text-align: center; padding: 30px 10px;">
        <div style="font-size: 2.5rem; margin-bottom: 8px;">⭐</div>
        <h3 style="font-size: 1.2rem; color: var(--secondary); margin-bottom: 6px;">Đánh giá cho sản phẩm #${productId}</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 12px;"><strong>${productTitle}</strong></p>
        <div style="background: #f8fafc; border: 1px dashed var(--border-color); padding: 20px; border-radius: var(--radius-md); color: var(--text-muted);">
          <em>Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên mua và để lại nhận xét!</em>
        </div>
      </div>
    `;
  } else {
    // Render danh sách review từ XML kết hợp tên khách từ customers.json
    const reviewsHtml = reviewInfo.reviews
      .map((rev) => {
        // Tìm thông tin khách hàng từ customers.json theo customerId
        const customer = customersData.find((c) => c.id === rev.customerId);
        const customerName = customer ? customer.fullName : `Khách hàng (${rev.customerId})`;
        const fullStars = "★".repeat(rev.rating);
        const emptyStars = "☆".repeat(5 - rev.rating);

        return `
          <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
              <div>
                <strong style="color: var(--secondary); font-size: 0.95rem;">${customerName}</strong>
                <span style="font-size: 0.75rem; color: #64748b; margin-left: 6px;">(${rev.customerId})</span>
              </div>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${rev.date}</span>
            </div>
            <div style="color: #d97706; font-size: 0.9rem; margin-bottom: 6px;">
              <span>${fullStars}${emptyStars}</span>
              <strong style="color: var(--text-main); margin-left: 6px;">${rev.rating}/5.0</strong>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-main); line-height: 1.5; margin: 0;">${rev.comment}</p>
          </div>
        `;
      })
      .join("");

    reviewModalBody.innerHTML = `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 14px; margin-bottom: 18px;">
        <span class="badge badge-category" style="margin-bottom: 6px;">Lịch sử đánh giá thực tế (Câu 5)</span>
        <h3 style="font-size: 1.15rem; color: var(--secondary); line-height: 1.4;">${productTitle}</h3>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
          <div style="font-size: 1.8rem; font-weight: 900; color: #b45309;">
            ★ ${reviewInfo.average}
          </div>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Dựa trên <strong>${reviewInfo.count} lượt đánh giá</strong> đã xác thực từ file <code>data/reviews.xml</code>
          </div>
        </div>
      </div>

      <div style="max-height: 380px; overflow-y: auto; padding-right: 4px;">
        ${reviewsHtml}
      </div>
    `;
  }

  reviewModal.classList.add("active");
  reviewModal.setAttribute("aria-hidden", "false");
}

