# E-Service Code & Order Reference Structure

เอกสารระบุโครงสร้างการเจนเนอเรต `orderRef` (Order Reference) สำหรับระบบ **innovation-Gateway**

---

## รูปแบบโครงสร้าง (Structure Format)

```text
orderRef = "INN-service-runningnumber"
```

### คำอธิบายส่วนประกอบ (Components Description):

1. **`INN`**: 
   ตัวย่อคงที่ระบุระบบต้นทาง **innovation-Gateway**
2. **`service`**:
   รหัสบริการ (ความยาว 2 หลัก) ได้แก่:
   - `01` = จอดแจ๋ว
   - `02` = AIHub
3. **`runningnumber`**:
   เลขลำดับรายการ (รันอัตโนมัติ 10 หลัก เติมศูนย์ข้างหน้า / Zero-padded to 10 digits)
   - ตัวอย่าง: `0000000001`

---

## ตัวอย่างผลลัพธ์ (Example Result)

เมื่อมีการจองหรือสร้างรายการชำระเงินของบริการ **จอดแจ๋ว (01)** ลำดับที่ 1:

```json
{
  "orderRef": "INN-01-0000000001"
}
```

---

## วิธีการเข้ารหัส Signature (Signature Encryption Method)

ในการรับ-ส่งข้อมูลชำระเงิน จะต้องมีตัวแปร `signature` แนบไปด้วย โดยมีวิธีการคำนวณและเข้ารหัสผ่านคำสั่ง (เช่น ในภาษา PHP) ดังนี้:

### ตัวอย่างการเข้ารหัสในภาษา PHP:

```php
$signature = hash_hmac(
    'sha256', 
    $txKey .'|'. $order_ref .'|'. $total_unit .'|'. $total_price .'|'. $total_vat .'|'. $total_payment, 
    false
);
```

### คำอธิบายการทำงาน (Logic):
- นำตัวแปร `$txKey` ต่อด้วยข้อมูลธุรกรรมต่างๆ คั่นด้วยเครื่องหมาย `|`
- ทำการแฮชแบบ **HMAC-SHA256** โดยมี Key ในการเข้ารหัสเป็น `false` (หรือแปลงประเภทข้อมูลเป็นสตริงว่าง `""`)

