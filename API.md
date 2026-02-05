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

### Response chuẩn (API Admin – production)

Các API admin (tạo/sửa/xóa sản phẩm, category, upload ảnh, thêm specifications) trả về **cùng một format** để frontend dễ hiển thị thông báo và dùng dữ liệu:

```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công.",
  "data": { ... },
  "timestamp": "2025-01-28T10:00:00.123Z"
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| success | boolean | Luôn `true` khi HTTP 2xx |
| message | string | Thông báo cho người dùng (hiển thị toast/snackbar) |
| data | object \| array \| null | Dữ liệu trả về (sản phẩm vừa tạo, category, hoặc meta như productId, uploadedCount) |
| timestamp | string (ISO 8601) | Thời điểm response |

- **Tạo mới (POST):** HTTP **201 Created**, header `Location` trỏ tới resource vừa tạo, body là `ApiResponse` với `data` = object vừa tạo.
- **Cập nhật / Xóa / Upload / Thêm spec:** HTTP **200 OK**, body là `ApiResponse` với `message` rõ ràng và `data` (chi tiết hoặc tổng kết).

Frontend nên: kiểm tra `response.success`, hiển thị `response.message`, dùng `response.data` để cập nhật UI (ví dụ thêm item vào list sau khi tạo).

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

### 4.4 Chi tiết sản phẩm (dạng detail – ảnh, category, specifications)

**GET** `/api/public/products/detail/{id}`

**Response 200:** `ProductDetailDTO`

```json
{
  "id": 1,
  "name": "Máy khoan XYZ",
  "price": 1250000.00,
  "images": ["/uploads/products/a.jpg", "/uploads/products/b.jpg"],
  "categoryName": "Máy khoan",
  "specifications": [
    { "specKey": "Công suất", "specValue": "750W" },
    { "specKey": "Tốc độ không tải", "specValue": "0-3000 vòng/phút" }
  ]
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| id | number | ID sản phẩm |
| name | string | Tên sản phẩm |
| price | number | Giá |
| images | string[] | Danh sách URL ảnh |
| categoryName | string | Tên loại sản phẩm |
| specifications | SpecEntryDTO[] | Thông số kỹ thuật – hiển thị dạng list (mỗi dòng: specKey + specValue) |

---

### 4.5 Danh sách loại sản phẩm (Category – cho dropdown/filter)

**GET** `/api/public/categories`

**Response 200:** Mảng `CategoryDTO[]`

```json
[
  { "id": 1, "name": "Máy khoan" },
  { "id": 2, "name": "Máy mài" }
]
```

Dùng cho dropdown khi tạo/sửa sản phẩm hoặc filter danh sách (không cần đăng nhập).

---

### 4.6 Tìm kiếm & lọc sản phẩm (production)

**GET** `/api/public/products/search`

Tìm kiếm theo từ khóa, lọc theo loại sản phẩm và khoảng giá, phân trang, sắp xếp. Chỉ trả về sản phẩm **ACTIVE**.

**Query parameters:**

| Query | Type | Mặc định | Mô tả |
|-------|------|----------|--------|
| keyword | string | (optional) | Từ khóa tìm trong tên sản phẩm (không phân biệt hoa thường) |
| categoryId | number | (optional) | Lọc theo ID loại sản phẩm (category) |
| minPrice | number | (optional) | Giá tối thiểu (VNĐ), ví dụ 100000 |
| maxPrice | number | (optional) | Giá tối đa (VNĐ), ví dụ 5000000 |
| page | number | 0 | Trang (0-based) |
| size | number | 12 | Số phần tử mỗi trang |
| sort | string | (optional) | Sắp xếp: `field,direction`. Mặc định `createdAt,desc` |

**Giá trị `sort` hợp lệ:**

- `price,asc` / `price,desc` – theo giá
- `createdAt,asc` / `createdAt,desc` – theo ngày tạo
- `name,asc` / `name,desc` – theo tên

**Ví dụ URL:**

```
GET /api/public/products/search?keyword=may&categoryId=2&minPrice=100000&maxPrice=5000000&page=0&size=12&sort=price,asc
```

**Response 200:** `PageResponse<ProductListDTO>`

```json
{
  "content": [
    {
      "id": 1,
      "name": "Máy khoan XYZ",
      "price": 1250000.00,
      "thumbnail": "/uploads/products/xxx.jpg"
    }
  ],
  "page": 0,
  "size": 12,
  "totalElements": 25,
  "totalPages": 3,
  "first": true,
  "last": false
}
```

Frontend có thể build query từ form: chỉ gửi tham số có giá trị (bỏ trống = không lọc theo tiêu chí đó).

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

**Response 201 Created** (header `Location: /api/admin/products/{id}`):

```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công.",
  "data": {
    "id": 1,
    "name": "Máy khoan XYZ",
    "slug": "may-khoan-xyz",
    "description": "...",
    "quantity": 50,
    "price": 1250000.00,
    "status": "ACTIVE",
    "categoryId": 1,
    "isActive": true,
    "createdAt": "2025-01-28T...",
    "updatedAt": "2025-01-28T..."
  },
  "timestamp": "2025-01-28T10:00:00.123Z"
}
```

Frontend: hiển thị `message`, dùng `data` để cập nhật list hoặc chuyển sang trang chi tiết.

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

**Response 200 OK:** Body dạng `ApiResponse<ProductDTO>` – `message`: "Cập nhật sản phẩm thành công.", `data`: sản phẩm sau khi cập nhật.  
**Lỗi 404:** Không tìm thấy sản phẩm.

---

### 5.3 Xóa sản phẩm

**DELETE** `/api/admin/products/{id}`

**Response 200 OK:** `ApiResponse` – `message`: "Xoá thành công sản phẩm", `data`: `{ "id": <id> }`.  
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

**Response 200 OK:** `ApiResponse` – `message`: "Upload ảnh thành công.", `data`: `{ "productId": <id>, "uploadedCount": <số file> }`.  
Ảnh lưu trên server, URL dạng `/uploads/products/<uuid>_<tên file>.jpg` – backend lưu URL vào DB và trả trong ProductDetailDTO (images).

**Lỗi 400:** Body `ApiResponse` với `success: false`, `message`: "File vượt quá 10MB."  
**Lỗi 401:** Chưa đăng nhập / token hết hạn.

---

### 5.5 Thêm thông số kỹ thuật (Specifications) cho sản phẩm

**POST** `/api/admin/products/{id}/specifications`

**Request body (JSON):** Mảng `SpecEntryDTO[]`

```json
[
  { "specKey": "Công suất", "specValue": "750W" },
  { "specKey": "Tốc độ không tải", "specValue": "0-3000 vòng/phút" }
]
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| specKey | string | Có | Tên thông số, max 100 ký tự |
| specValue | string | Có | Giá trị, max 500 ký tự |

**Response 200 OK:** `ApiResponse` – `message`: "Thêm thông số kỹ thuật thành công.", `data`: `{ "productId": <id>, "addedCount": <số mục> }`.

API chi tiết sản phẩm **GET** `/api/public/products/detail/{id}` sẽ trả về `specifications` tương ứng (list xuống dòng: mỗi phần tử là một cặp specKey – specValue).

**Lỗi 404:** Không tìm thấy sản phẩm.

---

### 5.6 Loại sản phẩm (Category – Admin)

#### Danh sách category (admin)

**GET** `/api/admin/categories`

**Response 200 OK:** `ApiResponse<List<CategoryDTO>>` – `message`: "Lấy danh sách loại sản phẩm thành công.", `data`: mảng category (id, name). Dùng cho dropdown khi tạo/sửa sản phẩm.

#### Thêm loại sản phẩm

**POST** `/api/admin/categories`

**Request body (JSON):**

```json
{
  "name": "Máy khoan"
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|-------|------|----------|-----------|
| name | string | Có | 1–100 ký tự, không trùng tên đã có |

**Response 201 Created** (header `Location: /api/admin/categories/{id}`): `ApiResponse<CategoryDTO>` – `message`: "Tạo loại sản phẩm thành công.", `data`: category vừa tạo (id, name).

**Lỗi 400:** Tên đã tồn tại hoặc validation.

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

export interface SpecEntryDTO {
  specKey: string;
  specValue: string;
}

export interface ProductDetailDTO {
  id: number;
  name: string;
  price: number;
  images: string[];
  categoryName: string | null;
  specifications: SpecEntryDTO[];
}

export interface CategoryDTO {
  id: number;
  name: string;
}

export interface CategoryCreate {
  name: string;
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

// standard success response (admin APIs)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
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
| GET | /api/public/products/search | Không | Tìm kiếm, lọc (keyword, category, giá), phân trang, sort |
| GET | /api/public/categories | Không | Danh sách loại sản phẩm (dropdown/filter) |
| POST | /api/admin/products | Bearer | Tạo sản phẩm |
| PUT | /api/admin/products/{id} | Bearer | Cập nhật sản phẩm |
| DELETE | /api/admin/products/{id} | Bearer | Xóa sản phẩm |
| POST | /api/admin/products/{id}/images | Bearer | Upload ảnh (multipart) |
| POST | /api/admin/products/{id}/specifications | Bearer | Thêm thông số kỹ thuật |
| GET | /api/admin/categories | Bearer | Danh sách loại sản phẩm (admin) |
| POST | /api/admin/categories | Bearer | Thêm loại sản phẩm |

---

*Tài liệu cập nhật theo backend Machine Shop. Base URL và CORS cần khớp với môi trường triển khai.*
