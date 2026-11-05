/**
 * Dịch vụ đọc dữ liệu JSON/XML dùng chung cho toàn ứng dụng (Câu 1, Câu 5, Câu 8)
 * Sử dụng fetch API kết hợp DOMParser cho XML và response.json() cho JSON.
 */

function getText(parent, tagName, defaultValue = "") {
    if (!parent) return defaultValue;
    const el = parent.querySelector(tagName);
    return el ? el.textContent.trim() : defaultValue;
}

/**
 * 1. Đọc danh sách sản phẩm từ data/products.xml bằng DOMParser
 * @param {string} xmlPath Đường dẫn tới file products.xml
 * @returns {Promise<Array>} Mảng đối tượng sản phẩm JS
 */
export async function loadProducts(xmlPath = "data/products.xml") {
    const response = await fetch(xmlPath);
    if (!response.ok) {
        throw new Error(`Không thể tải ${xmlPath} (HTTP ${response.status})`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        throw new Error("Lỗi cú pháp XML trong products.xml: " + parseError.textContent);
    }

    const productNodes = Array.from(xmlDoc.querySelectorAll("products > product"));
    return productNodes.map((node) => {
        const id = Number(node.getAttribute("id") || getText(node, "id", 0));
        const ratingNode = node.querySelector("rating");

        const colors = Array.from(node.querySelectorAll("colors > color")).map((c) => ({
            name: c.textContent.trim(),
            code: c.getAttribute("code") || "#64748b"
        }));

        const sizes = Array.from(node.querySelectorAll("sizes > size")).map((s) =>
            s.textContent.trim()
        );

        const variants = Array.from(node.querySelectorAll("variants > variant")).map((v) => ({
            sku: v.getAttribute("sku") || "",
            color: v.getAttribute("color") || "",
            colorCode: v.getAttribute("color_code") || "",
            size: v.getAttribute("size") || "",
            stock: Number(v.getAttribute("stock") || 0)
        }));

        const totalStock = Number(
            getText(
                node,
                "stock",
                variants.reduce((sum, item) => sum + item.stock, 0)
            )
        );

        return {
            id,
            title: getText(node, "title"),
            price: Number(getText(node, "price", 0)),
            description: getText(node, "description"),
            category: getText(node, "category"),
            image: getText(node, "image"),
            rating: {
                rate: Number(getText(ratingNode, "rate", 0)),
                count: Number(getText(ratingNode, "count", 0))
            },
            brand: getText(node, "brand", "Generic"),
            discount: Number(getText(node, "discount", 0)),
            importDate: getText(node, "import_date"),
            colors,
            sizes,
            stock: totalStock,
            variants
        };
    });
}

/**
 * 2. Đọc danh sách nhân viên từ data/employees.json
 * @param {string} jsonPath Đường dẫn tới file employees.json
 * @returns {Promise<Array>} Mảng đối tượng nhân viên JS
 */
export async function loadEmployees(jsonPath = "data/employees.json") {
    const response = await fetch(jsonPath);
    if (!response.ok) {
        throw new Error(`Không thể tải ${jsonPath} (HTTP ${response.status})`);
    }
    return await response.json();
}

/**
 * 3. Đọc danh sách khách hàng từ data/customers.json
 * @param {string} jsonPath Đường dẫn tới file customers.json
 * @returns {Promise<Array>} Mảng đối tượng khách hàng JS
 */
export async function loadCustomers(jsonPath = "data/customers.json") {
    const response = await fetch(jsonPath);
    if (!response.ok) {
        throw new Error(`Không thể tải ${jsonPath} (HTTP ${response.status})`);
    }
    return await response.json();
}

/**
 * 4. Đọc danh sách hóa đơn từ data/carts.xml bằng DOMParser
 * @param {string} xmlPath Đường dẫn tới file carts.xml
 * @returns {Promise<Array>} Mảng đối tượng hóa đơn JS
 */
export async function loadCarts(xmlPath = "data/carts.xml") {
    const response = await fetch(xmlPath);
    if (!response.ok) {
        throw new Error(`Không thể tải ${xmlPath} (HTTP ${response.status})`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        throw new Error("Lỗi cú pháp XML trong carts.xml: " + parseError.textContent);
    }

    const cartNodes = Array.from(xmlDoc.querySelectorAll("carts > cart"));
    return cartNodes.map((node) => {
        const items = Array.from(node.querySelectorAll("items > item")).map((itemNode) => ({
            productId: Number(getText(itemNode, "product_id", 0)),
            color: getText(itemNode, "color"),
            size: getText(itemNode, "size"),
            quantity: Number(getText(itemNode, "quantity", 1)),
            unitPrice: Number(getText(itemNode, "unit_price", 0))
        }));

        const computedTotal = items.reduce(
            (sum, it) => sum + it.quantity * it.unitPrice,
            0
        );

        return {
            id: node.getAttribute("id") || getText(node, "id"),
            createdAt: getText(node, "created_at"),
            employeeId: getText(node, "employee_id"),
            customerId: getText(node, "customer_id"),
            status: getText(node, "status", "pending"),
            paymentMethod: getText(node, "payment_method", "COD"),
            shippingAddress: getText(node, "shipping_address"),
            items,
            totalAmount: Number(getText(node, "total_amount", computedTotal.toFixed(2)))
        };
    });
}

/**
 * 5. Đọc danh sách đánh giá từ data/reviews.xml bằng DOMParser
 * @param {string} xmlPath Đường dẫn tới file reviews.xml
 * @returns {Promise<Array>} Mảng đối tượng review JS
 */
export async function loadReviews(xmlPath = "data/reviews.xml") {
    const response = await fetch(xmlPath);
    if (!response.ok) {
        throw new Error(`Không thể tải ${xmlPath} (HTTP ${response.status})`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        throw new Error("Lỗi cú pháp XML trong reviews.xml: " + parseError.textContent);
    }

    const reviewNodes = Array.from(xmlDoc.querySelectorAll("reviews > review"));
    return reviewNodes.map((node) => ({
        reviewId: node.getAttribute("id") || getText(node, "review_id"),
        productId: Number(getText(node, "product_id", 0)),
        customerId: getText(node, "customer_id"),
        rating: Number(getText(node, "rating", 5)),
        comment: getText(node, "comment"),
        date: getText(node, "date")
    }));
}

// Gắn vào window để hỗ trợ cả script thường lẫn ES Module
if (typeof window !== "undefined") {
    window.DataService = {
        loadProducts,
        loadEmployees,
        loadCustomers,
        loadCarts,
        loadReviews
    };
}

