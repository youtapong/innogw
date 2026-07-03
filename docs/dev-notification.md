# เอกสารอ้างอิงการทำงานของระบบ Dev Callback Notification (API Callback)

เอกสารฉบับนี้อธิบายรายละเอียดโครงสร้างและการทำงานของ Endpoint รับ Callback Notification ในสภาพแวดล้อมการพัฒนาของระบบ Gateway

อ้างอิงโค้ดจาก: [dev-notification.ts](file:///Users/youtapong/tong_work/app_elysia/inno-gw/src/routes/dev-notification.ts)

---

## 1. ข้อมูลทั่วไปของ Endpoint

*   **URL:** `/api/dev/notification`
*   **Method:** `POST`
*   **Content-Type:** `application/json`

---

## 2. ขั้นตอนการทำงานและตรวจสอบสิทธิ์ (Workflow & Verification)

### ขั้นตอนที่ 1: การตรวจสอบสิทธิ์ (Authorization Check)
ระบบจะตรวจสอบ HTTP Header `Authorization` เพื่อยืนยันความปลอดภัย โดยต้องส่งค่ามาเป็นรูปแบบ Bearer Token ที่มีค่าตรงกับตัวแปรใน `.env` คือ `dev_messsageToken` หรือ `DEV_MESSAGETOKEN`
*   *ตัวอย่าง Header:* `Authorization: Bearer <dev_messsageToken>`
*   *กรณีตรวจสอบไม่ผ่าน:* จะตอบกลับเป็น `HTTP 401 Unauthorized` พร้อมส่งข้อมูลตัวอย่าง Token เปรียบเทียบกลับไปเพื่อวิเคราะห์:
    ```json
    {
      "success": false,
      "error": "Unauthorized: Invalid or missing dev key",
      "received_token": "...",
      "expected_token": "..."
    }
    ```

### ขั้นตอนที่ 2: ตัวอย่างข้อมูลที่ได้รับ (POST Payload)
เมื่อเข้าใช้งานผ่านสิทธิ์เรียบร้อยแล้ว ระบบจะรับข้อมูล Callback สารสนเทศการชำระเงินดังนี้:
```json
{
    "statuscode": "200",
    "status": "success",
    "result": {
        "order_ref": "INNS10001-1-0-0000015",
        "transaction_ref": "BU2111111",
        "payment_status": "completed",
        "payment_method": 7,
        "payment_method_name": "NT eService-PromptPay"
    }
}
```

### ขั้นตอนที่ 3: การบันทึกข้อมูลเข้าตาราง `api_logs`
ระบบจะดึงข้อมูลภาพรวมและข้อมูลในก้อน `result` นำมาบันทึกลงสู่ตาราง `api_logs` (สำหรับใช้วิเคราะห์ประวัติ/Audit) โดยมีการระบุข้อมูลแยกในแต่ละคอลัมน์ดังนี้:
*   `api_name` = `'dev-notification-callback-post'`
*   `request_body` = ข้อมูล payload ทั้งหมดที่ได้รับ
*   `response_body` = ข้อมูลผลลัพธ์ที่จะตอบกลับผู้เรียกใช้งาน
*   `order_ref` = รหัสอ้างอิงคำสั่งซื้อ (`INNS10001-1-0-0000015`)
*   `transaction_ref` = รหัสอ้างอิงธุรกรรมปลายทาง (`BU2111111`)
*   `payment_status` = สถานะการชำระเงิน (`completed`)
*   `payment_method` = รหัสประเภทช่องทางชำระเงิน (`7`)
*   `payment_method_name` = ชื่อช่องทางชำระเงิน (`NT eService-PromptPay`)
*   `status_code` = รหัสสถานะ HTTP (`200`)
*   `status` = สถานะการทำงาน (`success`)

### ขั้นตอนที่ 4: การอัปเดตลงตาราง `orders`
ระบบจะนำข้อมูลที่ดึงได้อัปเดตสถานะลงตาราง `orders` ตามเงื่อนไข `order_ref` (Primary Key):
```sql
UPDATE "orders"
SET 
  transaction_ref = 'BU2111111',
  payment_status = 'completed',
  payment_method = 7,
  modify_time = CURRENT_TIMESTAMP
WHERE order_ref = 'INNS10001-1-0-0000015';
```

### ขั้นตอนที่ 5: การตัดแยก `order_ref`
ระบบจะนำ `order_ref` มาตัดข้อความออกโดยแบ่งด้วยอักขระเครื่องหมาย `-` และนำส่วนแรกสุดมาใช้เป็น `es_code` ของสินค้า:
*   *ตัวอย่าง:* `INNS10001-1-0-0000015` ➡️ แยกได้เป็น `INNS10001`

### ขั้นตอนที่ 6: สืบค้นหาข้อมูล URL ปลายทาง และ Token
ระบบจะนำ `es_code` ที่ได้ไปค้นหาค่า `message_url` และ `product_token` จากตาราง `product_mapping`:
```sql
SELECT message_url, product_token 
FROM "product_mapping" 
WHERE es_code = 'INNS10001';
```

### ขั้นตอนที่ 7: ส่งต่อข้อมูล (Forward Payload)
เมื่อดึง Config สำเร็จ ระบบจะส่ง HTTP POST พร้อม payload ทั้งก้อนที่ได้รับมาในขั้นตอนที่ 2 ไปยังปลายทาง:
*   **Destination URL:** ค่า `message_url` ที่ดึงได้จากฐานข้อมูล
*   **Headers:**
    *   `Content-Type: application/json`
    *   `Authorization: Bearer <product_token>` (กุญแจตรวจสอบสิทธิ์ที่ดึงได้จากฐานข้อมูล)
*   **Body:** Payload ชุดเดิมก้อนแรก
