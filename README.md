# BÀI THỰC HÀNH PHÁT TRIỂN ỨNG DỤNG WEB - UEL STORE

- **Sinh viên thực hiện**: Nguyễn Hoàng Bảo Trân
- **Mã số sinh viên (MSSV)**: K244060750
- **Lớp**: K24406
- **Khoa**: Hệ thống Thông tin Quản lý - Trường Đại học Kinh tế - Luật (UEL)

---

## 🌐 1. Link GitHub Pages & Mã Nguồn
- **Link GitHub Pages (Demo trực tuyến)**: `https://k244060750.github.io/K244060750_NguyenHoangBaoTran_K24406/`
- **Kho lưu trữ GitHub (Repository)**: `https://github.com/k244060750/K244060750_NguyenHoangBaoTran_K24406`
*(Ghi chú: Nếu bạn sử dụng tài khoản GitHub cá nhân khác, chỉ cần thay thế `k244060750` bằng username GitHub của bạn).*

---

## 🔑 2. Danh Sách Tài Khoản Thử Nghiệm (Demo Accounts)

Hệ thống hỗ trợ 3 phân quyền đăng nhập tại trang `login.html` (có sẵn nút bấm tự điền tài khoản để kiểm thử nhanh):

| Phân quyền | Username | Mật khẩu | Họ và tên | Chuyển hướng sau đăng nhập |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Quản trị viên)** | `admin` | `123` | Nguyễn Hoàng Bảo Trân | `admin.html` (Dashboard quản trị) |
| **Admin (Dự phòng)** | `kimngan` | `123` | Võ Thị Kim Ngân | `admin.html` (Dashboard quản trị) |
| **Staff (Nhân viên)** | `minhquan` | `123` | Trần Minh Quân | `admin.html` (Dashboard quản trị) |
| **Staff (Nhân viên)** | `thanhha` | `123` | Lê Thanh Hà | `admin.html` (Dashboard quản trị) |
| **Customer (Khách hàng)**| `khachhang01` | `123` | Nguyễn Văn An | `index.html` (Hiện tên + Đăng xuất) |
| **Customer (Khách hàng)**| `khachhang02` | `123` | Trần Thị Bích Ngọc | `index.html` (Hiện tên + Đăng xuất) |

---

## 💻 3. Hướng Dẫn Chạy Dự Án Bằng Live Server

> ⚠️ **Lưu ý quan trọng**: Do dự án sử dụng `fetch()` API để nạp dữ liệu từ các file `data/products.xml`, `data/reviews.xml`, `data/carts.xml`, `data/employees.json`, `data/customers.json`, trình duyệt sẽ chặn chính sách CORS nếu mở trực tiếp bằng đường dẫn file cục bộ (`file:///...`). Bạn **bắt buộc** phải chạy qua Local Web Server.

### Cách chạy với VS Code Live Server:
1. Mở thư mục dự án `K244060750_NguyenHoangBaoTran_K24406` bằng **Visual Studio Code**.
2. Cài đặt tiện ích mở rộng **Live Server** (của tác giả *Ritwick Dey*) nếu chưa có.
3. Click chuột phải vào file **`index.html`** và chọn **"Open with Live Server"** (hoặc phím tắt `Alt + L, Alt + O`).
4. Trình duyệt sẽ tự động mở trang web tại địa chỉ: `http://127.0.0.1:5500/index.html`.
5. Để vào trang Quản trị, truy cập `http://127.0.0.1:5500/login.html` và đăng nhập với tài khoản `admin` / `123`.

---

## 📂 4. Cấu Trúc Dự Án & Vị Trí Các Câu Hỏi Thực Hiện

```text
K244060750_NguyenHoangBaoTran_K24406/
├── index.html                  # Trang chủ: Thẻ ngữ nghĩa, danh sách SP, form tìm kiếm nâng cao (Câu 2, 3, 4, 5, 6, 7)
├── login.html                  # Màn hình đăng nhập phân quyền Admin/Nhân viên/Khách hàng (Câu 8)
├── admin.html                  # Dashboard Quản trị: Thống kê KPI, biểu đồ cột CSS, quản lý đơn hàng (Câu 8)
├── README.md                   # Tài liệu hướng dẫn, danh sách tài khoản demo, link GitHub Pages (Câu 9)
│
├── data/                       # Thư mục lưu trữ dữ liệu XML & JSON giả lập
│   ├── products.xml            # 20 SP từ FakeStoreAPI + bổ sung Màu, Size, Tồn kho, Thương hiệu, Giảm giá (Câu 1)
│   ├── employees.json          # 5 nhân viên: id, username, password, họ tên, email, phone, role admin/staff (Câu 1)
│   ├── customers.json          # 10 khách hàng: thông tin đầy đủ, số điện thoại chuẩn Việt Nam (Câu 1)
│   ├── carts.xml               # 14 hóa đơn: mã đơn, ngày tạo, nhân viên, khách, chi tiết từng dòng (Câu 1)
│   └── reviews.xml             # 36 nhận xét: product_id, customer_id, rating, comment tiếng Việt, date (Câu 1, 5)
│
├── tools/
│   └── build-products.html     # Công cụ 1 lần: Gọi FakeStoreAPI -> Dùng XML DOM dựng cây -> Tải products.xml (Câu 1)
│
├── css/                        # Hệ thống định kiểu CSS thuần (Không dùng Framework)
│   ├── base.css                # CSS Variables, Reset chuẩn, Typography, Toast, Modal (Câu 2, 3)
│   ├── layout.css              # Header dính, Aside bộ lọc, Section sản phẩm, Footer (Câu 2)
│   ├── grid.css                # CSS Grid hiển thị sản phẩm, Product Card, Rating badge đè ảnh (Câu 3, 4, 5)
│   ├── skeleton.css            # 8 khối Skeleton Cards với hiệu ứng @keyframes shimmer quét sáng (Câu 3)
│   ├── responsive.css          # Media Queries: 4 cột desktop, 2 cột tablet, 1 cột mobile (Câu 3)
│   ├── cart.css                # Bảng Mini-Cart trượt ra đè màn hình (position: fixed, z-index cao) (Câu 6)
│   ├── checkout.css            # Modal form thanh toán, viền đỏ/xanh realtime, hiệu ứng spinner và popup (Câu 7)
│   ├── admin.css               # Giao diện trang Login và Dashboard Admin (Câu 8)
│   └── style.css               # Tệp CSS tổng hợp
│
├── assets/
│   └── js/
│       ├── dataService.js      # 5 hàm fetch + DOMParser / JSON đọc toàn bộ dữ liệu (Câu 1, 5)
│       ├── reviews.js          # DOMParser reviews.xml, tính TB sao, chèn span đè ảnh, modal Rating Detail (Câu 5)
│       ├── cart.js             # Object cartState quản lý giỏ, kiểm tra tồn kho, render Mini-Cart đè màn hình (Câu 6)
│       ├── checkout.js         # Modal giao hàng, Regex SĐT VN & Email realtime (keyup/blur), tạo đơn lưu localStorage (Câu 7)
│       └── admin.js            # Dashboard thống kê, biểu đồ cột CSS thuần, hợp nhất đơn, đổi trạng thái đơn (Câu 8)
│
└── js/                         # Cấu trúc module hỗ trợ điều phối logic
    ├── app.js                  # Khởi chạy trang chủ, tìm kiếm nâng cao, Skeleton 1.8s, Event Delegation (Câu 2, 3, 4)
    ├── main.js                 # Điểm kết nối khởi chạy
    ├── api/dataLoader.js       # Re-export dataService
    ├── products/               # Modules sản phẩm (delegation.js, renderProducts.js, searchFilter.js)
    ├── reviews/reviews.js      # Re-export reviews
    ├── cart/                   # Modules giỏ hàng (cartState.js, miniCart.js)
    ├── checkout/               # Modules thanh toán (checkout.js, validators.js)
    └── admin/                  # Modules admin (auth.js, orders.js, stats.js)
```

---

## 📝 5. Tóm Tắt Chi Tiết Từng Câu Hỏi Thực Hiện

- **Câu 1 (Dữ liệu XML/JSON)**: Xây dựng trang `tools/build-products.html` dùng W3C XML DOM dựng cây `products.xml` có đầy đủ màu sắc, kích thước, tồn kho theo biến thể, thương hiệu, giảm giá; tạo sẵn `employees.json` (5 NV), `customers.json` (10 KH), `carts.xml` (14 hóa đơn), `reviews.xml` (36 đánh giá không trùng cặp); thư viện `dataService.js` với 5 hàm đọc bất đồng bộ.
- **Câu 2 (Thẻ ngữ nghĩa & Form tìm kiếm nâng cao)**: Sử dụng các thẻ HTML5 `<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<article>`, `<footer>`; Form tìm kiếm nâng cao trong `<aside>` đầy đủ validation HTML5 (`required`, `min`, `max`, `step`, `pattern`, `minlength`, `maxlength`, `title`), kiểm tra giá min $\le$ max bằng `setCustomValidity()`, lọc đa tiêu chí và nút Xóa lọc.
- **Câu 3 (CSS Grid, Responsive & Skeleton Loading)**: Hiển thị sản phẩm bằng CSS Grid thuần: 4 cột trên desktop ($\ge 1024$px), 2 cột trên tablet ($600 - 1023$px), 1 cột trên mobile ($< 600$px); layout tổng thể dùng Flexbox/Grid responsive; hiển thị 8 khối Skeleton Cards với hiệu ứng `@keyframes shimmer` trong 1.8 giây trước khi nạp dữ liệu thật.
- **Câu 4 (Product Card & Event Delegation duy nhất)**: Thẻ `<article class="product-card">` có chọn màu/size nhanh, nút *"Thêm giỏ"* và *"Xem nhanh"*; gắn **duy nhất 1 `addEventListener('click')`** trên container cha `#productsGrid` dùng `event.target.closest('[data-action]')`, lấy `data-id` và `data-variant` in ra `console.log` và hiển thị Toast; mở modal Quick View xem chi tiết.
- **Câu 5 (Đánh giá sản phẩm với XML DOM)**: Đọc `reviews.xml` bằng `DOMParser`, tính điểm trung bình (làm tròn 1 chữ số thập phân); dùng `document.createElement('span')` tạo `<span class="rating-badge">★ 4.3</span>` định vị `position: absolute` đè lên ảnh; nút *"Rating Detail"* (chung Event Delegation với Câu 4) mở modal hiển thị danh sách nhận xét kèm tên khách hàng thật map từ `customers.json`.
- **Câu 6 (State Giỏ Hàng & Bảng Mini-Cart đè màn hình)**: Quản lý giỏ hàng bằng đối tượng `cartState` (State Pattern); kiểm tra không vượt quá tồn kho của từng biến thể; tự động tính tổng tiền; render Mini-Cart trượt ra đè màn hình (`position: fixed`, `z-index` cao) có tăng/giảm số lượng, xóa từng dòng, xóa cả giỏ và lưu/phục hồi qua `localStorage`.
- **Câu 7 (Modal Thanh toán & Regex Realtime)**: Modal Form thanh toán kiểm tra Realtime ngay khi gõ (`keyup`) và khi rời ô (`blur`); tự viết Regex kiểm tra SĐT Việt Nam (đầu 03, 05, 07, 08, 09 hoặc +84) và Email; đổi màu viền xanh/đỏ kèm thông báo lỗi; nút thanh toán chỉ bật khi hợp lệ; giả lập thanh toán 1s; tạo mã đơn hàng mới lưu vào `localStorage["orders"]`, trừ tồn kho và xóa giỏ hàng.
- **Câu 8 (Giao diện Quản trị Admin & Đăng nhập)**: Trang `login.html` xác thực tài khoản từ `employees.json` (Admin/Staff -> `admin.html`) và `customers.json` (Khách hàng -> `index.html`); trang `admin.html` có kiểm tra phân quyền truy cập; Dashboard thống kê 4 thẻ KPI; biểu đồ cột doanh thu theo tháng vẽ bằng **CSS Thuần** (không dùng thư viện ngoài); thống kê Top sản phẩm bán chạy; bảng Quản lý đơn hàng hợp nhất giữa XML và LocalStorage, có lọc trạng thái/ngày, xem chi tiết modal và đổi trạng thái đơn hàng realtime lưu vào `localStorage`; bảng thống kê sản phẩm đã bán và tồn kho còn lại; nút Đăng xuất.
