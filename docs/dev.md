# เอกสารอ้างอิงการทำงานของระบบ Dev API & Callback Notification (Gateway)

ระบบพัฒนาขึ้นเพื่อทำหน้าที่เป็น **Payment Gateway Emulator** และ **Callback Routing Engine** สำหรับจำลองและส่งต่อข้อมูลในสภาพแวดล้อมการพัฒนา (Development Environment)

---

## 1. การทำงานของ Redirect URL (HTTP GET)

เมื่อระบบภายนอกส่งผู้ใช้งานกลับมายังระบบ Gateway (เช่น หน้า Redirect หลังจากชำระเงินสำเร็จ/ล้มเหลว/ยกเลิก) ระบบจะทำการส่งต่อข้อมูล (Forward) และเปลี่ยนเส้นทางเบราว์เซอร์ (Redirect) ไปยังหน้าเว็บไซต์ของผลิตภัณฑ์โดยอัตโนมัติ

### Endpoints (GET)
*   **Success Redirect:** `/api/dev/success`
*   **Failure Redirect:** `/api/dev/fail`
*   **Cancel Redirect:** `/api/dev/cancel`

### ตัวอย่าง URL ที่ระบบได้รับ
```http
https://innogw.ntplc.co.th/api/dev/success?orderid=OTC26149059&orderRef=INNS10001-1-0-0000015
```

### ขั้นตอนการประมวลผลข้อมูล (Workflow)

1.  **ตัดคำเพื่อหารหัสสินค้า (Extract es_code):**
    ดึงค่า `orderRef` (หรือ `order_ref`) จาก Query Parameters และใช้เครื่องหมาย `-` ในการตัดข้อมูล เพื่อให้เหลือเฉพาะตัวรหัสสินค้า `es_code`
    *   *ตัวอย่าง:* `INNS10001-1-0-0000015` ➡️ `INNS10001`
2.  **ดึงข้อมูล URL และ Token (Query Routing Config):**
    นำ `es_code` ที่ได้ไปค้นหาข้อมูล URL ปลายทาง (`message_url`) และกุญแจตรวจสอบสิทธิ์ (`product_token`) ในตาราง `product_mapping`
    ```sql
    SELECT message_url, product_token 
    FROM "product_mapping" 
    WHERE es_code = 'INNS10001';
    ```
3.  **ส่งต่อข้อมูลและเปลี่ยนเส้นทางผู้ใช้ (Forward & Redirect):**
    *   **ส่งต่อข้อมูลเบื้องหลัง (Backend GET Request):** ส่งคำขอผ่าน HTTP GET ไปยัง URL ปลายทางที่ค้นพบ พร้อมทั้งแนบ `product_token` ไปกับ Authorization Header
        *   *Header:* `Authorization: Bearer <product_token>`
    *   **ตัวอย่าง URL ที่ระบบส่งต่อไปยังระบบปลายทาง:**
        ```http
        {message_url}?orderid=OTC26149059&orderRef=INNS10001-1-0-0000015
        ```
    *   **เปลี่ยนเส้นทางผู้ใช้ (HTTP 302 Redirect):** เปลี่ยนเส้นทางเบราว์เซอร์ของผู้ใช้ไปยัง URL ดังกล่าวโดยตรงทันที

---

## 2. การทำงานของ Callback Notification (HTTP POST)

ส่วนเชื่อมต่อสำหรับการรับข้อมูลสถานะธุรกรรมโดยตรงผ่านรูปแบบ API Callback เพื่อบันทึกประวัติการเรียกใช้งาน อัปเดตสถานะธุรกรรมลงระบบฐานข้อมูล และส่งต่อไปยังระบบปลายทางที่เกี่ยวข้อง

### Endpoint (POST)
*   **Callback Receiver:** `/api/dev/notification`

### สิทธิ์การเข้าใช้งาน (Authorization)
ต้องส่งค่า Bearer Token ผ่าน Header ให้ตรงกับตัวแปรสภาพแวดล้อมที่ระบุใน `.env`
*   *Header:* `Authorization: Bearer <dev_messsageToken>`

### ตัวอย่างข้อมูลที่ได้รับ (Payload)
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

### ขั้นตอนการประมวลผลข้อมูล (Workflow)

1.  **ปรับปรุงสถานะธุรกรรมหลัก (Update Orders):**
    นำข้อมูลธุรกรรมมาอัปเดตลงตาราง `orders` ตามเงื่อนไข `order_ref` (Primary Key)
    *   ข้อมูลที่อัปเดต: `transaction_ref`, `payment_status`, `payment_method`, และ `modify_time`
2.  **ตัดรหัสสินค้าและสืบค้นปลายทาง (Routing Config Query):**
    ตัดแยก `order_ref` เพื่อให้เหลือเฉพาะรหัสสินค้า (`INNS10001`) และ Query ค้นหา `message_url` พร้อม `product_token` จากตาราง `product_mapping`
3.  **ส่งคำขอต่อ (Forward Callback Request):**
    ส่งข้อมูล JSON payload ทั้งก้อนไปหา `message_url` ผ่าน **HTTP POST**
    *   *Headers:*
        *   `Content-Type: application/json`
        *   `Authorization: Bearer <product_token>`
4.  **บันทึกบันทึกข้อมูลทางเทคนิค (Write Audit Logs):**
    จัดเก็บประวัติการเรียกใช้งาน ทั้งข้อมูล Request, Response, สถานะการส่งต่อไปปลายทาง, และข้อมูลโครงสร้างของ Transaction แยกคอลัมน์ลงในตาราง `api_logs`
