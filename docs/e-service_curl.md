# E-Service cURL Command Reference

เอกสารรวบรวมตัวอย่างคำสั่ง cURL สำหรับเรียกใช้งาน API ของระบบ **Payment OTC (eService)**

---

## 1. ข้อมูล API Endpoints

- **สำหรับพัฒนา (Dev/UAT Environment):**
  `https://uatapiz.nteservice.com/V2`
- **สำหรับใช้งานจริง (Production Environment):**
  `https://apiz.nteservice.com/V2`

---

## 2. ตัวอย่าง cURL Request (สร้างรายการชำระเงิน / payments)

### Endpoint:
`POST /payments/otcpay/innovation`

### ตัวอย่างคำสั่ง cURL:

```bash
curl --location 'https://uatapiz.nteservice.com/V2/payments/otcpay/innovation' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJhdXRoQ29udGFjdCI6Im15MW5ub0BVYXQyMDI2IiwiYXV0aENvZGUiOiJZMjVrZW1ORVJsTlplamt3WlZOR2FGaDZhekpqVkRnelpVUkpMMDFzU204PSIsImFjY2Vzc0tleVRva2VuIjoiTXpZNU1qUmhZMlk0Tm1NMU5UZzBZV1E0TURCbE9EaGtNV013TjJVMk1EazNOVEJoWkdReE5ESXpPR0ZsWmpCa1pqUTNaVEZrTkRFeU16Y3hNVEF3TXc9PSJ9' \
--header 'X-ClientIp: 127.0.0.1' \
--header 'X-RequestId: req-123456789' \
--data-raw '{
    "version": "2.4.2",
    "channelProductCode": "SPC60001",
    "channelServiceCode": "SVC50001",
    "orderRef": "INN-01-0000000001",
    "orderRef2": "",
    "orderItems": [
        {
            "esCode": "INNS10001",
            "accountCode": "50412000",
            "productCode": "G0309",
            "productName": "jodjew",
            "model": "",
            "companyCode": "NT",
            "homeCode": "",
            "productionOption1": "",
            "productionOption2": "",
            "productionOption3": "",
            "unit": 1,
            "price": 100,
            "vat": 7,
            "netPrice": 100,
            "netVat": 7
        }
    ],
    "totalUnit": 1,
    "totalPrice": 100,
    "totalVat": 7,
    "totalPayment": 107,
    "signature": "3c02eb929d2b271d488e01bf366c8cdccbebe4518ff7e42d76077ffde8d343b1",
    "language": "th",
    "homeLocation": "",
    "offerId": "",
    "etaxInvoice": {
        "documentTypeCode": "T03",
        "taxIdType": "NIDN",
        "nationalId": "3100202820304",
        "businessId": "",
        "branchId": "",
        "companyName": "",
        "firstName": "John",
        "lastName": "Smith",
        "email": "example@gmail.com",
        "mobile": "0935555555",
        "village": "",
        "houseNo": "89/2",
        "moo": "3",
        "soi": "",
        "road": "แจ้งวัฒนะ",
        "subDistrict": "ทุ่งสองห้อง",
        "district": "หลักสี่",
        "province": "กรุงเทพมหานคร",
        "zipCode": "10210",
        "officeName": ""
    }
}'
```

---

> [!NOTE]
> - ค่า `orderRef` เจนเนอเรตตามรายละเอียดใน [e-service_code.md](file:///Users/youtapong/tong_work/app_elysia/inno-gw/docs/e-service_code.md)
> - ค่า `signature` เจนเนอเรตและเข้ารหัส HMAC-SHA256 ตามคำแนะนำใน [e-service_code.md](file:///Users/youtapong/tong_work/app_elysia/inno-gw/docs/e-service_code.md)
