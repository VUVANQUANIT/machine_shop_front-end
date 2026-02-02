# Security – Đăng nhập, JWT, Refresh Token

## ⚠️ Lưu ý bảo mật

- **Không commit** JWT secret, database credentials lên Git. Dùng biến môi trường (ví dụ `JWT_SECRET`, `DATABASE_PASSWORD`).
- Sinh JWT secret mạnh (≥ 64 ký tự): `openssl rand -base64 64` (Linux/Mac) hoặc tương đương trên Windows.

---

## Tổng quan

Hệ thống dùng **JWT** cho access token và **refresh token** lưu DB để cấp/thu hồi token chuẩn thực tế, kết hợp tốt với frontend (React/Vue/Angular).

---

## 1. Luồng đăng nhập (Login)

```
Client                                    Server
   |                                         |
   |  POST /api/auth/login                   |
   |  Body: { "username", "password" }       |
   |---------------------------------------->|
   |                                         | Kiểm tra username/password
   |                                         | Tạo JWT access_token
   |                                         | Tạo refresh_token, lưu DB
   |  200 OK                                 |
   |  { "accessToken", "refreshToken",       |
   |    "tokenType": "Bearer", "expiresIn" } |
   |<----------------------------------------|
```

- **Access Token**: JWT, hết hạn nhanh (mặc định **15 phút**). Dùng trong header mọi request API cần xác thực.
- **Refresh Token**: Chuỗi dài, hết hạn lâu (mặc định **7 ngày**), lưu trong bảng `refresh_tokens`. Dùng chỉ để gọi `/api/auth/refresh` lấy access token mới.
- **expiresIn**: Số giây access token còn hiệu lực. Frontend có thể dùng để tự refresh trước khi hết hạn (optional).

---

## 2. Gửi request bình thường (API cần đăng nhập)

```
Client                                    Server
   |                                         |
   |  GET/POST /api/admin/...                |
   |  Header: Authorization: Bearer <access_token>
   |---------------------------------------->|
   |                                         | JwtAuthenticationFilter:
   |                                         | - Đọc Bearer token
   |                                         | - Xác thực JWT, lấy username
   |                                         | - Set SecurityContext
   |  200 OK (hoặc 401/403)                  |
   |<----------------------------------------|
```

- **Nếu token còn hạn**: Request xử lý bình thường.
- **Nếu không gửi token hoặc token sai/hết hạn**: Server trả **401 Unauthorized** với body JSON có trường **code** để frontend phân biệt (xem mục 5).

---

## 3. Refresh token khi access token hết hạn

```
Client                                    Server
   |                                         |
   |  POST /api/auth/refresh                 |
   |  Body: { "refreshToken": "<string>" }   |
   |---------------------------------------->|
   |                                         | Kiểm tra refresh_token trong DB
   |                                         | (chưa revoke, chưa hết hạn)
   |                                         | Thu hồi refresh_token cũ
   |                                         | Tạo access_token mới + refresh_token mới
   |  200 OK                                 |
   |  { "accessToken", "refreshToken",       |
   |    "tokenType": "Bearer", "expiresIn" } |
   |<----------------------------------------|
```

- Sau khi refresh thành công, client **lưu lại** access token và refresh token mới, dùng cho các request tiếp theo.
- Mỗi lần refresh, refresh token cũ bị **revoke** (đánh dấu đã dùng), chỉ dùng refresh token mới cho lần sau.

---

## 4. Các endpoint auth

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/auth/login` | Đăng nhập: body `username`, `password` → trả về `accessToken`, `refreshToken`, `expiresIn` |
| POST | `/api/auth/register` | Đăng ký: body `username`, `password`, `passwordConfirm` → trả về `accessToken`, `refreshToken`, `expiresIn` |
| POST | `/api/auth/refresh` | Làm mới token: body `refreshToken` → trả về `accessToken`, `refreshToken` mới, `expiresIn` |

---

## 5. Lỗi 401 và mã code (cho frontend)

Mọi response 401 đều có body JSON dạng:

```json
{
  "timestamp": "2025-01-28T10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "code": "<CODE>",
  "message": "<Mô tả tiếng Việt hoặc tiếng Anh>",
  "path": "/api/admin/..."
}
```

**Các giá trị `code` và cách xử lý gợi ý:**

| code | Ý nghĩa | Frontend nên làm |
|------|---------|-------------------|
| `TOKEN_EXPIRED` | Access token hết hạn | Gọi `POST /api/auth/refresh` với `refreshToken` đã lưu; nếu thành công thì lưu token mới và retry request; nếu refresh cũng 401 thì redirect đăng nhập |
| `INVALID_TOKEN` | Token sai format hoặc không hợp lệ | Xóa token local, redirect đăng nhập (hoặc thử refresh một lần) |
| `INVALID_CREDENTIALS` | Sai username/password khi login | Hiển thị lỗi "Sai tên đăng nhập hoặc mật khẩu" |
| `UNAUTHORIZED` | Không gửi token hoặc path cần auth nhưng chưa đăng nhập | Nếu có refreshToken thì thử refresh; không có thì redirect đăng nhập |

**Luồng frontend gợi ý khi gọi API bị 401:**

1. Đọc `response.body.code`.
2. Nếu `code === "TOKEN_EXPIRED"` và còn `refreshToken`:
   - Gọi `POST /api/auth/refresh` với `{ "refreshToken": "<đã lưu>" }`.
   - Nếu 200: lưu `accessToken` và `refreshToken` mới, **retry** request vừa thất bại với access token mới.
   - Nếu 401 (ví dụ `REFRESH_TOKEN_EXPIRED` hoặc `INVALID_TOKEN`): xóa token, redirect login.
3. Nếu `code === "UNAUTHORIZED"` hoặc không có refreshToken: redirect màn hình đăng nhập.

---

## 6. Cấu hình (application.properties / env)

| Biến | Mô tả | Mặc định (dev) |
|------|--------|------------------|
| `JWT_SECRET` | Secret ký JWT (nên ≥ 64 ký tự) | (giá trị dev trong file) |
| `JWT_EXPIRATION` | Thời gian sống access token (ms) | 900000 (15 phút) |
| `JWT_REFRESH_EXPIRATION` | Thời gian sống refresh token (ms) | 604800000 (7 ngày) |

---

## 7. Bảo mật và best practice

- **Không commit** `JWT_SECRET` thật lên Git; dùng biến môi trường hoặc secret manager.
- Access token **ngắn hạn** (15–30 phút) để giảm rủi ro khi bị lộ.
- Refresh token **lưu DB**, có thể **revoke** khi đăng xuất hoặc đổi mật khẩu.
- Sau mỗi lần refresh, refresh token cũ bị revoke (single-use hoặc rotation tùy cấu hình hiện tại).
- Frontend: lưu refresh token an toàn (httpOnly cookie tốt hơn localStorage nếu có thể); chỉ gửi access token trong header `Authorization: Bearer <token>`.

---

## 8. Các thành phần code chính

- **AuthController**: `POST /api/auth/login`, `/register`, `/refresh`.
- **AuthService**: Logic đăng nhập, đăng ký, tạo/kiểm tra refresh token, gọi JwtService.
- **JwtService**: Tạo JWT access token, validate access token (ném `TokenExpiredException` / `InvalidTokenException`).
- **JwtAuthenticationFilter**: Đọc `Authorization: Bearer`, gọi JwtService; nếu lỗi trên path bảo vệ thì trả 401 JSON kèm `code` (TOKEN_EXPIRED / INVALID_TOKEN).
- **Http401EntryPoint**: Khi chưa đăng nhập (không có token) truy cập path bảo vệ → 401 JSON với `code: UNAUTHORIZED`.
- **SecurityConfig**: Cho phép `/api/auth/**`, `/api/public/**`, Swagger; yêu cầu authenticated cho `/api/admin/**`; thêm JwtAuthenticationFilter và Http401EntryPoint.
- **GlobalExceptionHandler**: Bắt `TokenExpiredException`, `InvalidTokenException`, `InvalidCredentialsException` → 401 với `code` tương ứng.
