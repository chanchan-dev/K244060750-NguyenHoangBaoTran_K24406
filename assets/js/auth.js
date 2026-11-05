/**
 * ==============================================================================
 * AUTH.JS (CÂU 8)
 * - Quản lý xác thực đăng nhập người dùng (Admin, Nhân viên, Khách hàng)
 * - Đối chiếu thông tin từ data/employees.json và data/customers.json
 * - Lưu phiên đăng nhập vào localStorage / sessionStorage
 * - Điều hướng: Admin/Staff -> admin.html, Khách hàng -> index.html
 * ==============================================================================
 */

import { loadEmployees, loadCustomers } from "./dataService.js";

const CURRENT_USER_KEY = "uel_store_current_user";

/**
 * Lấy thông tin tài khoản hiện đang đăng nhập
 */
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Đăng xuất tài khoản
 */
export function logout() {
  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(CURRENT_USER_KEY);
  window.location.href = "login.html";
}

/**
 * Kiểm tra phân quyền truy cập trang Admin (Câu 8)
 * Nếu chưa đăng nhập hoặc không phải admin/staff -> Chuyển về login.html
 */
export function requireAdminOrStaff() {
  const user = getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    alert("Khu vực quản trị yêu cầu quyền Admin hoặc Nhân viên! Đang chuyển hướng về trang Đăng nhập.");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

/**
 * Xử lý đăng nhập tài khoản từ Form
 */
export async function handleLogin(username, password, rememberMe = false) {
  const u = username.trim().toLowerCase();
  const p = password.trim();

  if (!u || !p) {
    return { success: false, message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!" };
  }

  try {
    // 1. Kiểm tra trong danh sách Nhân viên & Quản trị viên (data/employees.json)
    const employees = await loadEmployees("data/employees.json");
    const matchedEmployee = employees.find(
      (emp) => emp.username.toLowerCase() === u && String(emp.password) === p
    );

    if (matchedEmployee) {
      const authUser = {
        id: matchedEmployee.id,
        username: matchedEmployee.username,
        fullName: matchedEmployee.fullName,
        email: matchedEmployee.email,
        phone: matchedEmployee.phone,
        role: matchedEmployee.role, // 'admin' hoặc 'staff'
        type: "employee"
      };

      saveSession(authUser, rememberMe);
      return {
        success: true,
        user: authUser,
        redirectUrl: "admin.html",
        message: `Chào mừng ${authUser.role === "admin" ? "Quản trị viên" : "Nhân viên"} ${authUser.fullName}!`
      };
    }

    // 2. Kiểm tra trong danh sách Khách hàng (data/customers.json)
    const customers = await loadCustomers("data/customers.json");
    const matchedCustomer = customers.find(
      (cus) => cus.username.toLowerCase() === u && String(cus.password) === p
    );

    if (matchedCustomer) {
      const authUser = {
        id: matchedCustomer.id,
        username: matchedCustomer.username,
        fullName: matchedCustomer.fullName,
        email: matchedCustomer.email,
        phone: matchedCustomer.phone,
        role: "customer",
        type: "customer"
      };

      saveSession(authUser, rememberMe);
      return {
        success: true,
        user: authUser,
        redirectUrl: "index.html",
        message: `Chào mừng khách hàng ${authUser.fullName} đăng nhập thành công!`
      };
    }

    return {
      success: false,
      message: "Tên đăng nhập hoặc mật khẩu không chính xác! Vui lòng thử lại hoặc xem tài khoản mẫu bên dưới."
    };
  } catch (error) {
    console.error("Lỗi khi xác thực đăng nhập:", error);
    return {
      success: false,
      message: "Lỗi kết nối cơ sở dữ liệu xác thực: " + error.message
    };
  }
}

function saveSession(user, rememberMe) {
  const jsonStr = JSON.stringify(user);
  if (rememberMe) {
    localStorage.setItem(CURRENT_USER_KEY, jsonStr);
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, jsonStr);
    localStorage.setItem(CURRENT_USER_KEY, jsonStr); // Lưu song song để đồng bộ giữa các tab
  }
}

