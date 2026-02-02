# Machine Shop API – Tích hợp Frontend Angular

Tài liệu mô tả chi tiết REST API để tích hợp với ứng dụng Angular.

---

## 1. Thông tin chung

| Mục | Giá trị |
|-----|--------|
| **Base URL** | `http://localhost:8080` (dev) – thay bằng URL backend thực tế |
| **Content-Type** | `application/json` (request/response body) |
| **Xác thực** | `Authorization: Bearer <access_token>` (JWT) cho API admin |

### CORS

Backend cho phép origin từ frontend. Nếu chạy Angular ở `http://localhost:4200`, cần cấu hình CORS phía backend cho origin đó (hoặc dùng proxy trong `angular.json` / `proxy.conf.json`).

---

## 2. Xác thực (Auth)

### 2.1 Đăng nhập

**POST** `/api/auth/login`

**Request body (JSON):**

```json
{
  "username": "string",
  "password": "string"
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|----------|--------|
| username | string | Có | Tên đăng nhập, max 50 ký tự |
| password | string | Có | Mật khẩu |

**Response 200:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| accessToken | string | JWT, gửi trong header `Authorization: Bearer <accessToken>` |
| refreshToken | string | Dùng gọi `/api/auth/refresh` khi access token hết hạn |
| tokenType | string | Luôn `"Bearer"` |
| expiresIn | number | Số giây access token còn hiệu lực |

**Lỗi 401:** `code: "INVALID_CREDENTIALS"` – sai tên đăng nhập hoặc mật khẩu.

---

### 2.2 Đăng ký

**POST** `/api/auth/register`

**Request body (JSON):**

```json
{
  "username": "string",
  "password": "string",
  "passwordConfirm": "string"
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| username | string | Có | Chỉ `a-zA-Z0-9._-`, max 50 |
| password | string | Có | Min 8 ký tự, ít nhất 1 chữ thường, 1 hoa, 1 số, 1 ký tự đặc biệt `@$!%*?&` |
| passwordConfirm | string | Có | Phải trùng `password` |

**Response 200:** Cùng format như đăng nhập (accessToken, refreshToken, tokenType, expiresIn).

**Lỗi 400:** Validation (ví dụ mật khẩu không đủ mạnh, passwordConfirm không khớp).  
**Lỗi 400:** `"Tên đăng nhập đã tồn tại"` nếu username trùng.

---

### 2.3 Làm mới access token (Refresh)

**POST** `/api/auth/refresh`

**Request body (JSON):**

```json
{
  "refreshToken": "string"
}
```

Gọi khi API trả **401** với `code: "TOKEN_EXPIRED"`. Dùng `refreshToken` đã lưu (localStorage/sessionStorage/cookie) khi login/register.

**Response 200:** Cùng format như login (accessToken, refreshToken mới, tokenType, expiresIn). Lưu lại token mới và dùng cho request tiếp theo.

**Lỗi 401:** `code: "INVALID_TOKEN"` – refresh token không hợp lệ hoặc đã hết hạn → chuyển user về màn hình đăng nhập.

---

## 3. Lỗi và mã code (dùng cho Angular)

Mọi response lỗi (4xx/5xx) có thể có body dạng:

```json
{
  "timestamp": "2025-01-28 10:00:00",
  "status": 401,
  "error": "Unauthorized",
  "code": "TOKEN_EXPIRED",
  "message": "Access token đã hết hạn...",
  "path": "/api/admin/products",
  "validationErrors": []
}
```

**Trường `code` (dùng trong Angular):**

| code | HTTP | Ý nghĩa | Gợi ý xử lý |
|------|------|---------|-------------|
| TOKEN_EXPIRED | 401 | Access token hết hạn | Gọi POST `/api/auth/refresh` với refreshToken, lưu token mới, retry request |
| INVALID_TOKEN | 401 | Token sai/không hợp lệ | Xóa token, redirect login |
| INVALID_CREDENTIALS | 401 | Sai username/password | Hiển thị lỗi đăng nhập |
| UNAUTHORIZED | 401 | Chưa gửi token / path cần auth | Thử refresh; không được thì redirect login |
| Validation Failed | 400 | Lỗi validation body | Hiển thị `validationErrors` (field, message) |

**Validation error item:**

```ts
interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}
```

---

## 4. API công khai (không cần token)

### 4.1 Health check

**GET** `/api/health`

**Response 200:**

```json
{
  "status": "UP",
  "timestamp": "2025-01-28T10:00:00",
  "message": "Machine Shop API is running!"
}
```

---

### 4.2 Danh sách sản phẩm (list)

**GET** `/api/public/products`

**Response 200:** Mảng `ProductListDTO[]`

```json
[
  {
    "id": 1,
    "name": "Máy khoan XYZ",
    "price": 1250000.00,
    "thumbnail": "/uploads/products/xxx.jpg"
  }
]
```

---

### 4.3 Chi tiết sản phẩm (theo ID)

**GET** `/api/public/products/{id}`

**Response 200:** `ProductDTO`

```json
{
  "id": 1,
  "name": "Máy khoan XYZ",
  "slug": "may-khoan-xyz",
  "description": "...",
  "quantity": 50,
  "price": 1250000.00,
  "status": "ACTIVE",
  "categoryId": 1,
  "isActive": true,
  "createdAt": "2025-01-28T08:00:00",
  "updatedAt": "2025-01-28T09:00:00"
}
```

**Status:** `ACTIVE` | `INACTIVE` | `OUT_OF_STOCK`

**Lỗi 404:** Không tìm thấy sản phẩm.

---

### 4.4 Chi tiết sản phẩm (dạng detail – có ảnh, category name)

**GET** `/api/public/products/detail/{id}`

**Response 200:** `ProductDetailDTO`

```json
{
  "id": 1,
  "name": "Máy khoan XYZ",
  "price": 1250000.00,
  "images": ["/uploads/products/a.jpg", "/uploads/products/b.jpg"],
  "categoryName": "Máy khoan"
}
```

---

### 4.5 Tìm kiếm & phân trang

**GET** `/api/public/products/search?name=&page=0&size=10`

| Query | Type | Mặc định | Mô tả |
|-------|------|----------|--------|
| name | string | (optional) | Tìm theo tên (bỏ trống = lấy tất cả) |
| page | number | 0 | Trang (0-based) |
| size | number | 10 | Số phần tử mỗi trang |

**Response 200:** `PageResponse<ProductDTO>`

```json
{
  "content": [ { "id": 1, "name": "...", "slug": "...", ... } ],
  "page": 0,
  "size": 10,
  "totalElements": 25,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

---

## 5. API Admin (cần JWT)

Gửi header: **`Authorization: Bearer <access_token>`**

Nếu không gửi hoặc token hết hạn/sai → 401 (xem mục 3).

### 5.1 Tạo sản phẩm

**POST** `/api/admin/products`

**Request body (JSON):** `ProductDTORequestCreate`

```json
{
  "name": "Máy khoan XYZ",
  "slug": "may-khoan-xyz",
  "description": "Mô tả sản phẩm",
  "quantity": 50,
  "price": 1250000.00,
  "status": "ACTIVE",
  "categoryId": 1,
  "isActive": true
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| name | string | Có | 2–200 ký tự |
| slug | string | Có | Chỉ `a-z0-9` và `-`, max 250 |
| description | string | Không | Max 5000 |
| quantity | number | Có | 0–999999 |
| price | number | Có | 0.01–99999999.99 |
| status | string | Có | `ACTIVE` \| `INACTIVE` \| `OUT_OF_STOCK` |
| categoryId | number | Có | ID category |
| isActive | boolean | Không | Mặc định true |

**Response 200:** `ProductDTO` (sản phẩm vừa tạo).

---

### 5.2 Cập nhật sản phẩm

**PUT** `/api/admin/products/{id}`

**Request body (JSON):** `ProductDTORequestUpdate` – tất cả field **optional** (chỉ gửi field cần sửa).

```json
{
  "name": "Tên mới",
  "slug": "ten-moi",
  "description": "...",
  "quantity": 30,
  "price": 1300000.00,
  "status": "ACTIVE",
  "categoryId": 1,
  "isActive": true
}
```

Ràng buộc giống tạo (name 2–200, slug pattern, quantity 0–999999, price 0.01–..., status enum).

**Response 200:** `ProductDTO` (sản phẩm sau khi cập nhật).  
**Lỗi 404:** Không tìm thấy sản phẩm.

---

### 5.3 Xóa sản phẩm

**DELETE** `/api/admin/products/{id}`

**Response 200:** Body thường là chuỗi thông báo (ví dụ `"Xoá thành công sản phẩm"`).  
**Lỗi 404:** Không tìm thấy sản phẩm.

---

### 5.4 Upload ảnh sản phẩm

**POST** `/api/admin/products/{id}/images`

**Content-Type:** `multipart/form-data`

**Body:** Form field tên **`files`** – mảng file (nhiều ảnh).  
Ví dụ Angular: `FormData` append nhiều lần với key `files`:

```ts
const formData = new FormData();
files.forEach(file => formData.append('files', file));
this.http.post(`${API}/api/admin/products/${id}/images`, formData).subscribe();
```

**Response 200:** Body rỗng (204 hoặc 200).  
Ảnh lưu trên server, URL dạng `/uploads/products/<uuid>_<tên file>.jpg` – backend lưu URL này vào DB và trả trong ProductDetailDTO / ProductListDTO (images, thumbnail).

**Lỗi:** 401 nếu chưa đăng nhập / token hết hạn; 4xx/5xx nếu upload lỗi (xem message trong body).

---

## 6. Gợi ý tích hợp Angular

### 6.1 Base URL và environment

```ts
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

### 6.2 Interface TypeScript (model)

```ts
// auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  passwordConfirm: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// product
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface ProductDTO {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  quantity: number;
  price: number;
  status: ProductStatus;
  categoryId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListDTO {
  id: number;
  name: string;
  price: number;
  thumbnail: string | null;
}

export interface ProductDetailDTO {
  id: number;
  name: string;
  price: number;
  images: string[];
  categoryName: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ProductCreate {
  name: string;
  slug: string;
  description?: string;
  quantity: number;
  price: number;
  status: ProductStatus;
  categoryId: number;
  isActive?: boolean;
}

export interface ProductUpdate {
  name?: string;
  slug?: string;
  description?: string;
  quantity?: number;
  price?: number;
  status?: ProductStatus;
  categoryId?: number;
  isActive?: boolean;
}

// error
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  code?: string;
  message: string;
  path: string;
  validationErrors?: { field: string; message: string; rejectedValue?: unknown }[];
}
```

### 6.3 Gửi token và xử lý 401 (refresh)

- Mọi request tới `/api/admin/**` cần header:  
  `Authorization: Bearer <access_token>`.
- Khi nhận **401**:
  - Đọc `body.code`.
  - Nếu `code === 'TOKEN_EXPIRED'` và còn `refreshToken`: gọi `POST /api/auth/refresh` với `{ refreshToken }` → lưu `accessToken` (và `refreshToken`) mới → **retry** request vừa thất bại với token mới.
  - Nếu refresh cũng 401 hoặc `code !== 'TOKEN_EXPIRED'`: xóa token, chuyển về trang đăng nhập.

Có thể dùng **HTTP Interceptor** để:
- Thêm `Authorization: Bearer <access_token>` cho request tới backend.
- Bắt lỗi 401, gọi refresh và retry (một lần) rồi mới throw hoặc redirect login.

### 6.4 Hiển thị ảnh sản phẩm

URL ảnh trong response là đường dẫn tương đối, ví dụ `/uploads/products/xxx.jpg`.  
Trong Angular dùng:

```html
<img [src]="apiUrl + product.thumbnail" alt="{{ product.name }}" />
```

hoặc

```ts
imageUrl = `${environment.apiUrl}${product.thumbnail}`;
```

(Backend cần serve static từ thư mục uploads tại `/uploads/**` hoặc dùng CDN nếu có.)

---

## 7. Tóm tắt endpoint

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | /api/health | Không | Health check |
| GET | /api/ | Không | Welcome |
| POST | /api/auth/login | Không | Đăng nhập |
| POST | /api/auth/register | Không | Đăng ký |
| POST | /api/auth/refresh | Không | Refresh token |
| GET | /api/public/products | Không | Danh sách sản phẩm |
| GET | /api/public/products/{id} | Không | Chi tiết (ProductDTO) |
| GET | /api/public/products/detail/{id} | Không | Chi tiết (ảnh, category) |
| GET | /api/public/products/search | Không | Tìm kiếm + phân trang |
| POST | /api/admin/products | Bearer | Tạo sản phẩm |
| PUT | /api/admin/products/{id} | Bearer | Cập nhật sản phẩm |
| DELETE | /api/admin/products/{id} | Bearer | Xóa sản phẩm |
| POST | /api/admin/products/{id}/images | Bearer | Upload ảnh (multipart) |

---

*Tài liệu cập nhật theo backend Machine Shop. Base URL và CORS cần khớp với môi trường triển khai.*
