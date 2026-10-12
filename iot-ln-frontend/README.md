# IOT LN Frontend

Giao diện quản lý thiết bị IoT viết bằng React, Vite, Chart.js và React Router.

## Chạy dự án

Yêu cầu Node.js 22 trở lên.

```powershell
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định là `http://localhost:5173`.

Tài khoản demo:

- Tên đăng nhập: `lamnguyen`
- Mật khẩu: `lamnguyen`

## Chức năng

- Dashboard hiển thị cảm biến, biểu đồ và điều khiển Quạt, Điều hòa, Đèn.
- Data Sensor hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang.
- Action History lưu thao tác thiết bị, người dùng và trạng thái.
- Profile chỉnh sửa và lưu thông tin cá nhân.
- Dữ liệu demo và phiên đăng nhập được lưu trong `localStorage`.

## Cấu trúc chính

- `src/App.jsx`: giao diện và xử lý chức năng.
- `src/styles.css`: bố cục và giao diện.
- `src/data.js`: dữ liệu mẫu.
- `src/api.js`: cấu hình API và WebSocket.

## Kết nối backend

Sao chép `.env.example` thành `.env`, cập nhật địa chỉ backend và đặt `VITE_DEMO_MODE=false`. Không đưa file `.env` lên GitHub.

## Build

```powershell
npm run build
npm run preview
```

Thư mục `dist` được tạo tự động khi build và đã nằm trong `.gitignore`.
