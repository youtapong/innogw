cat << 'EOF' > database.md

# # Database Structure Documentation (Payment OTC / eService NT)

เอกสารระบุโครงสร้างฐานข้อมูลสำหรับระบบ **Payment OTC / eService NT (Version 2.6)** ซึ่งมีการอัปเดตตาราง `api_logs` เพื่อรองรับ Response Object รูปแบบใหม่จาก Payment Notification พร้อมทั้งรวมข้อมูลตารางที่พบบนระบบฐานข้อมูลจริงในปัจจุบัน

---

## ## 1. ภาพรวมระบบฐานข้อมูล (Database Overview)

- **Database Name:** `innogw`
- **DBMS:** PostgreSQL
- **Schema:** `public`
- **ตารางทั้งหมดในระบบ:**
  1.  `product_mapping` — ตาราง Master Data สำหรับ Mapping รหัสสินค้า/บริการ
  2.  `custommer` — ข้อมูลลูกค้าที่ผูกกับบริการ (คงการสะกดด้วย `mm` ตามระบบจริง)
  3.  `orders` — ข้อมูลคำสั่งซื้อหรือรายการชำระเงินหลัก
  4.  `order_items` — รายการสินค้าย่อยภายใต้คำสั่งซื้อ
  5.  `issue` — เคสแจ้งปัญหาบริการหลังได้รับชำระเงิน
  6.  `api_logs` — ประวัติการรับส่งข้อมูล API สำหรับ Audit และ Debug (Updated V2.6)
  7.  `user` — ข้อมูลผู้ใช้งานระบบ Backoffice เดิม
  8.  `gateway_users` — ระบบจัดการผู้ใช้งานเกตเวย์และสิทธิ์การเข้าถึง _(ตารางเพิ่มเติมที่พบบนฐานข้อมูลจริง)_
  9.  `spatial_ref_sys` — ตารางระบบอ้างอิงพิกัดเชิงพื้นที่ _(ตารางระบบ PostGIS)_

---

## ## 2. รายละเอียดโครงสร้างตาราง (Table Schema)

### ### 2.1 ตาราง `product_mapping`

ตาราง Master Data สำหรับเก็บข้อมูล Mapping รหัสสินค้า/บริการระหว่างระบบ eService, SAP HANA, SAP ECC และ Channel

- **Primary Key:** `id`
- **Unique Key:** `es_code`

| ชื่อฟิลด์ (Column)      | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | ค่าเริ่มต้น (Default) / ข้อจำกัด (Constraints) | คำอธิบาย (Description)                             |
| :---------------------- | :---------------------------- | :-------------------------------- | :--------------------------------------------- | :------------------------------------------------- |
| `id`                    | `integer`                     | NOT NULL                          | `nextval('product_mapping_id_seq')`            | รหัสลำดับอัตโนมัติของข้อมูลสินค้า                  |
| `es_code`               | `character varying(50)`       | NOT NULL                          | UNIQUE                                         | รหัสสินค้า eService ต้องไม่ซ้ำกัน (เช่น INNS10001) |
| `product_name`          | `character varying(255)`      | NOT NULL                          |                                                | ชื่อสินค้า/บริการ เช่น จอดแจ๊ว หรือ AiHub          |
| `hana_account_code`     | `character varying(50)`       | NOT NULL                          | `'44100101'`                                   | รหัสบัญชีในระบบ SAP HANA                           |
| `hana_product_code`     | `character varying(50)`       | NOT NULL                          | `'209020001'`                                  | รหัสสินค้าในระบบ SAP HANA                          |
| `hana_sub_product_code` | `character varying(50)`       | NOT NULL                          | `'0'`                                          | รหัส Sub Product ของ HANA                          |
| `hana_revenue_type`     | `character varying(50)`       | NOT NULL                          | `'2'`                                          | ประเภทรายได้ของ HANA                               |
| `ecc_account_code`      | `character varying(50)`       | NOT NULL                          | `'50412000'`                                   | รหัสบัญชีในระบบ SAP ECC                            |
| `ecc_account_name`      | `character varying(100)`      | NOT NULL                          | `'รายได้บริการด้านนวัตกรรม'`                   | ชื่อบัญชีรายได้ในระบบ SAP ECC                      |
| `ecc_product_code`      | `character varying(50)`       | NOT NULL                          | `'G030xx'`                                     | รหัสสินค้าในระบบ SAP ECC                           |
| `ecc_product_name`      | `character varying(100)`      | NOT NULL                          | `'บริการด้านวิจัยและนวัตกรรม'`                 | ชื่อสินค้า/บริการในระบบ SAP ECC                    |
| `channel_product_code`  | `character varying(50)`       | NOT NULL                          | `'SPC60001'`                                   | รหัส Product ของ Channel หรือ SPC                  |
| `channel_service_code`  | `character varying(50)`       | NOT NULL                          |                                                | รหัส Service ของ Channel หรือ SVC                  |
| `product_token`         | `text`                        | Nullable                          |                                                | Token ของสินค้าแต่ละตัว (ควรเก็บอย่างปลอดภัย)      |
| `add_time`              | `timestamp without time zone` | NOT NULL                          | `CURRENT_TIMESTAMP`                            | วันที่และเวลาที่เพิ่มข้อมูล                        |
| `modify_time`           | `timestamp without time zone` | NOT NULL                          | `CURRENT_TIMESTAMP`                            | วันที่และเวลาที่แก้ไขข้อมูลล่าสุด                  |

- **Indexes:**
  - `product_mapping_new_pkey` PRIMARY KEY, btree (`id`)
  - `product_mapping_new_es_code_key` UNIQUE, btree (`es_code`)

---

### ### 2.2 ตาราง `custommer`

ใช้เก็บข้อมูลลูกค้าจากส่วน etaxInvoice ของ API-PaymentOtc เชื่อมโยงกับ `product_mapping` ผ่าน `es_code`

- **Primary Key:** `custommer_id`

| ชื่อฟิลด์ (Column)   | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable)   | คำอธิบาย (Description)                         |
| :------------------- | :---------------------------- | :---------------------------------- | :--------------------------------------------- |
| `custommer_id`       | `integer`                     | NOT NULL (Default Auto Incremental) | รหัสลูกค้าแบบรันลำดับอัตโนมัติ                 |
| `es_code`            | `character varying(50)`       | NOT NULL                            | รหัสสินค้า/บริการที่เกี่ยวข้อง (FK)            |
| `document_type_code` | `character varying(10)`       | NOT NULL                            | รูปแบบใบกำกับภาษี (เช่น 103 หรือ 105)          |
| `tax_id_type`        | `character varying(10)`       | NOT NULL                            | ประเภทผู้เสียภาษี (TXID, NIDN, CCPT หรือ OTHR) |
| `national_id`        | `character varying(30)`       | Nullable                            | เลขบัตรประชาชน หรือหนังสือเดินทาง              |
| `business_id`        | `character varying(30)`       | Nullable                            | เลขทะเบียนนิติบุคคลองค์กร                      |
| `branch_id`          | `character varying(10)`       | Nullable                            | รหัสสาขา (เช่น 00000 สำหรับสำนักงานใหญ่)       |
| `company_name`       | `character varying(255)`      | Nullable                            | ชื่อนิติบุคคลหรือบริษัทของลูกค้า               |
| `first_name`         | `character varying(150)`      | Nullable                            | ชื่อลูกค้าบุคคลธรรมดา                          |
| `last_name`          | `character varying(150)`      | Nullable                            | นามสกุลลูกค้าบุคคลธรรมดา                       |
| `email`              | `character varying(255)`      | Nullable                            | อีเมลสำหรับติดต่อหรือส่งเอกสาร                 |
| `mobile`             | `character varying(30)`       | NOT NULL                            | เบอร์โทรศัพท์เคลื่อนที่ (ฟิลด์บังคับ)          |
| `village`            | `character varying(255)`      | Nullable                            | หมู่บ้าน คอนโด หรือชื่ออาคาร                   |
| `house_no`           | `character varying(100)`      | Nullable                            | บ้านเลขที่                                     |
| `moo`                | `character varying(50)`       | Nullable                            | หมู่ของที่อยู่                                 |
| `soi`                | `character varying(150)`      | Nullable                            | ซอย                                            |
| `road`               | `character varying(150)`      | Nullable                            | ถนน                                            |
| `sub_district`       | `character varying(150)`      | Nullable                            | แขวง หรือตำบล                                  |
| `district`           | `character varying(150)`      | Nullable                            | เขต หรืออำเภอ                                  |
| `province`           | `character varying(150)`      | Nullable                            | จังหวัด                                        |
| `zip_code`           | `character varying(20)`       | Nullable                            | รหัสไปรษณีย์                                   |
| `office_name`        | `character varying(255)`      | Nullable                            | ชื่อสำนักงาน หรือ officeName (ถ้ามี)           |
| `add_time`           | `timestamp without time zone` | NOT NULL (Default Current)          | เวลาที่เพิ่มข้อมูลเข้าระบบ                     |
| `modify_time`        | `timestamp without time zone` | NOT NULL (Default Current)          | เวลาที่แก้ไขข้อมูลล่าสุด                       |

- **Indexes & Constraints:**
  - `custommer_pkey` PRIMARY KEY, btree (`custommer_id`)
  - `idx_custommer_es_code` btree (`es_code`)
  - `idx_custommer_mobile` btree (`mobile`)
  - `idx_custommer_tax` btree (`tax_id_type`, `national_id`, `business_id`)

---

### ### 2.3 ตาราง `orders`

ใช้เก็บข้อมูลหลักของคำสั่งซื้อและสถานะธุรกรรมการชำระเงิน

- **Primary Key:** `order_ref`

| ชื่อฟิลด์ (Column)     | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                                |
| :--------------------- | :---------------------------- | :-------------------------------- | :---------------------------------------------------- |
| `order_ref`            | `character varying(100)`      | NOT NULL                          | รหัสอ้างอิงรายการชำระเงิน ห้ามซ้ำในระบบ               |
| `order_ref2`           | `character varying(100)`      | Nullable                          | รหัสอ้างอิงเพิ่มเติมของคำสั่งซื้อ (ถ้ามี)             |
| `custommer_id`         | `integer`                     | Nullable                          | รหัสลูกค้าที่ผูกกับคำสั่งซื้อ (FK)                    |
| `channel_product_code` | `character varying(50)`       | NOT NULL                          | รหัส Channel Product Code (SPC) ที่ใช้ส่ง API         |
| `channel_service_code` | `character varying(50)`       | NOT NULL                          | รหัส Channel Service Code (SVC) ที่ใช้ส่ง API         |
| `total_unit`           | `integer`                     | NOT NULL (Default 0)              | จำนวนสินค้ารวมทั้งหมดในคำสั่งซื้อ                     |
| `total_price`          | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ราคาสินค้ารวมก่อนคำนวณ VAT                            |
| `total_vat`            | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ยอดภาษีมูลค่าเพิ่ม (VAT) รวม                          |
| `total_payment`        | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ยอดชำระเงินรวมสุทธิหลังรวมภาษี                        |
| `document_type_code`   | `character varying(10)`       | NOT NULL                          | รูปแบบใบกำกับภาษีหลัก                                 |
| `tax_id_type`          | `character varying(10)`       | NOT NULL                          | ประเภทผู้เสียภาษีของคำสั่งซื้อ                        |
| `mobile`               | `character varying(30)`       | NOT NULL                          | เบอร์ติดต่อของลูกค้าตามข้อมูล API                     |
| `transaction_ref`      | `character varying(100)`      | Nullable                          | รหัสรายการชำระเงินจาก eService / Notify               |
| `payment_status`       | `character varying(50)`       | Nullable                          | สถานะการชำระเงิน (เช่น completed, canceled, failed)   |
| `payment_method`       | `integer`                     | Nullable                          | รหัสช่องทางชำระเงิน (เช่น 2=Credit Card, 7=PromptPay) |
| `request_ex_no`        | `character varying(100)`      | Nullable                          | เลขอ้างอิง requestExNo จากระบบ PaymentOtc             |
| `payment_url`          | `text`                        | Nullable                          | URL สำหรับลิงก์ไปหน้าชำระเงินของลูกค้า                |
| `add_time`             | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่สร้างคำสั่งซื้อ                       |
| `modify_time`          | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่แก้ไขคำสั่งซื้อล่าสุด                 |

- **Indexes & Constraints:**
  - `orders_pkey` PRIMARY KEY, btree (`order_ref`)
  - `idx_orders_add_time` btree (`add_time`)
  - `idx_orders_custommer_id` btree (`custommer_id`)
  - `idx_orders_payment_status` btree (`payment_status`)
  - `idx_orders_transaction_ref` btree (`transaction_ref`)

---

### ### 2.4 ตาราง `order_items`

เก็บรายการสินค้าหรือบริการย่อยที่อยู่ภายใต้แต่ละคำสั่งซื้อหลัก

- **Primary Key:** `item_id`

| ชื่อฟิลด์ (Column)   | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                        |
| :------------------- | :---------------------------- | :-------------------------------- | :-------------------------------------------- |
| `item_id`            | `integer`                     | NOT NULL (Auto Incremental)       | รหัสรายการสินค้าย่อยอัตโนมัติ                 |
| `order_ref`          | `character varying(100)`      | NOT NULL                          | รหัสอ้างอิงคำสั่งซื้อหลัก (FK -> `orders`)    |
| `es_code`            | `character varying(50)`       | NOT NULL                          | รหัสสินค้า eService (FK -> `product_mapping`) |
| `account_code`       | `character varying(50)`       | NOT NULL                          | รหัสบัญชี (HANA/ECC Account Code)             |
| `hana_product_code`  | `character varying(50)`       | NOT NULL                          | รหัสสินค้าในระบบ SAP HANA                     |
| `hana_product_name`  | `character varying(255)`      | NOT NULL                          | ชื่อสินค้า/บริการที่ดึงข้อมูลมาจากระบบหลัก    |
| `model`              | `character varying(150)`      | Nullable                          | รุ่นสินค้าหรือรูปแบบบริการย่อย (ถ้ามี)        |
| `company_code`       | `character varying(20)`       | NOT NULL                          | รหัสบริษัทผู้ให้บริการ เช่น NT1, NTZ หรือ NT  |
| `home_code`          | `character varying(100)`      | Nullable                          | รหัสโฮมโค้ดประจำพื้นที่บริการ                 |
| `production_option1` | `text`                        | Nullable                          | รายละเอียดเพิ่มเติมช่องที่ 1                  |
| `production_option2` | `text`                        | Nullable                          | รายละเอียดเพิ่มเติมช่องที่ 2                  |
| `production_option3` | `text`                        | Nullable                          | รายละเอียดเพิ่มเติมช่องที่ 3                  |
| `unit`               | `integer`                     | NOT NULL (Default 1)              | จำนวนสินค้าในรายการย่อย                       |
| `price`              | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ราคาต่อหน่วยก่อนคิดภาษี                       |
| `vat`                | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ภาษีมูลค่าเพิ่ม (VAT) ต่อหน่วย                |
| `net_price`          | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ราคารวมของรายการย่อยนี้ก่อนภาษี               |
| `net_vat`            | `numeric(12,2)`               | NOT NULL (Default 0.00)           | ยอดรวมภาษีมูลค่าเพิ่มของรายการย่อยนี้         |
| `status`             | `character varying(20)`       | NOT NULL                          | สถานะรายการ (`success`, `fail`, `cancel`)     |
| `add_time`           | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่บันทึกข้อมูลเข้าระบบ          |
| `modify_time`        | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่แก้ไขข้อมูลล่าสุด             |

- **Indexes & Constraints:**
  - `order_items_pkey` PRIMARY KEY, btree (`item_id`)
  - `idx_order_items_es_code` btree (`es_code`)
  - `idx_order_items_order_ref` btree (`order_ref`)
  - `idx_order_items_status` btree (`status`)
  - **Check Constraint:** `order_items_status_check` CHECK (`status` IN ('success', 'fail', 'cancel'))

---

### ### 2.5 ตาราง `issue`

ใช้บันทึกประวัติกรณีปัญหา (Special Case) เช่น ได้รับยอดเงินสำเร็จแต่ระบบปลายทางขัดข้อง เพื่อประสานงานตรวจสอบต่อ

- **Primary Key:** `issue_id`

| ชื่อฟิลด์ (Column)  | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                                 |
| :------------------ | :---------------------------- | :-------------------------------- | :----------------------------------------------------- |
| `issue_id`          | `integer`                     | NOT NULL (Auto Incremental)       | รหัสเคสปัญหาอัตโนมัติ                                  |
| `item_id`           | `integer`                     | NOT NULL                          | รหัสรายการย่อยสินค้าที่มีปัญหา (FK)                    |
| `order_ref`         | `character varying(100)`      | NOT NULL                          | รหัสคำสั่งซื้อหลักที่เกี่ยวข้อง (FK)                   |
| `service_name`      | `character varying(255)`      | NOT NULL                          | ชื่อบริการที่เกิดปัญหา (คัดลอกจากสินค้า)               |
| `issue_title`       | `character varying(255)`      | NOT NULL                          | หัวข้อหรือข้อสรุปปัญหาแบบสั้น                          |
| `issue_detail`      | `text`                        | Nullable                          | รายละเอียดปัญหาฉบับเต็มเพื่อทีมสืบค้น                  |
| `payment_received`  | `boolean`                     | NOT NULL (Default `true`)         | ยืนยันว่ารับเงินแล้วแต่ระบบยังเจอปัญหา                 |
| `frontend_problem`  | `text`                        | Nullable                          | รายละเอียดข้อผิดพลาดที่แสดงบนหน้าบ้าน                  |
| `expected_behavior` | `text`                        | Nullable                          | ผลลัพธ์ที่ควรจะเป็นตาม Requirement                     |
| `actual_behavior`   | `text`                        | Nullable                          | ผลลัพธ์หรือพฤติกรรมจริงที่เกิดขึ้นในเคสนี้             |
| `issue_status`      | `character varying(30)`       | NOT NULL                          | สถานะเคส (`open`, `checking`, `resolved`, `cancelled`) |
| `resolved_by`       | `character varying(150)`      | Nullable                          | ชื่อเจ้าหน้าที่ผู้รับผิดชอบหรือปิดเคส                  |
| `resolved_note`     | `text`                        | Nullable                          | หมายเหตุสรุปการแก้ไขหรือผลการสืบค้น                    |
| `add_time`          | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่เปิดเคสปัญหา                           |
| `modify_time`       | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาแก้ไขสถานะล่าสุด                          |

- **Indexes & Constraints:**
  - `issue_pkey` PRIMARY KEY, btree (`issue_id`)
  - `idx_issue_item_id` btree (`item_id`)
  - `idx_issue_order_ref` btree (`order_ref`)
  - `idx_issue_service_name` btree (`service_name`)
  - `idx_issue_status` btree (`issue_status`)

---

### ### 2.6 ตาราง `api_logs` (Updated V2.6)

ตารางบันทึกประวัติการรับ-ส่งข้อมูลทางเทคนิคของ API (Audit Trailing)

- **Primary Key:** `log_id`

| ชื่อฟิลด์ (Column)    | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                               |
| :-------------------- | :---------------------------- | :-------------------------------- | :--------------------------------------------------- |
| `log_id`              | `integer`                     | NOT NULL (Auto Incremental)       | รหัสลำดับของ Log                                     |
| `api_name`            | `character varying(100)`      | NOT NULL                          | ชื่อ API เช่น PaymentOtc หรือ Payment Notification   |
| `order_ref`           | `character varying(100)`      | Nullable                          | รหัสอ้างอิงรายการชำระเงินหลักจากฝั่ง Result          |
| `x_request_id`        | `character varying(150)`      | Nullable                          | ID ประจำ Request จาก Header สำหรับติดตามผล           |
| `x_client_ip`         | `character varying(50)`       | Nullable                          | หมายเลข IP Address ของฝั่ง Client                    |
| `request_body`        | `jsonb`                       | Nullable                          | ข้อมูล Request Body รูปแบบ JSON                      |
| `response_body`       | `jsonb`                       | Nullable                          | ข้อมูล Response Body รูปแบบ JSON ทั้งก้อน            |
| `status_code`         | `character varying(20)`       | Nullable                          | รหัสสถานะ HTTP หรือ API (เช่น 200, 400)              |
| `is_success`          | `boolean`                     | Nullable                          | สถานะความสำเร็จการประมวลผล (True/False)              |
| `error_message`       | `text`                        | Nullable                          | ข้อความแสดง Error กรณีการเรียกใช้งานล้มเหลว          |
| `add_time`            | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาที่บันทึกรายการ Log                     |
| `modify_time`         | `timestamp without time zone` | NOT NULL                          | วันที่และเวลาแก้ไขล่าสุด                             |
| `status`              | `text`                        | Nullable                          | สถานะข้อความดำเนินงานสำเร็จ เช่น success หรือ failed |
| `result_body`         | `jsonb`                       | Nullable                          | ข้อมูลเฉพาะตัวแปรภายใน object `result` จาก Response  |
| `transaction_ref`     | `character varying(100)`      | Nullable                          | รหัสธุรกรรมจากระบบ eService (เช่น BU2111111)         |
| `payment_status`      | `character varying(50)`       | Nullable                          | สถานะชำระเงินจริง เช่น completed, canceled, failed   |
| `payment_method`      | `integer`                     | Nullable                          | รหัสช่องทาง เช่น 2=CreditCard, 7=PromptPay           |
| `payment_method_name` | `character varying(150)`      | Nullable                          | ชื่อรูปแบบช่องทาง เช่น NT eService-PromptPay         |

- **Indexes:**
  - `api_logs_pkey` PRIMARY KEY, btree (`log_id`)
  - `idx_api_logs_add_time` btree (`add_time`)
  - `idx_api_logs_api_name` btree (`api_name`)
  - `idx_api_logs_order_ref` btree (`order_ref`)
  - `idx_api_logs_x_request_id` btree (`x_request_id`)
  - `idx_api_logs_request_body_gin` gin (`request_body`)
  - `idx_api_logs_response_body_gin` gin (`response_body`)

---

### ### 2.7 ตาราง `gateway_users`

ระบบจัดการผู้ใช้งานเกตเวย์และสิทธิ์การเข้าถึง

- **Primary Key:** `user_id`

| ชื่อฟิลด์ (Column)      | ประเภทข้อมูล (Type)           | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                        |
| :---------------------- | :---------------------------- | :-------------------------------- | :-------------------------------------------- |
| `user_id`               | `integer`                     | NOT NULL                          | รหัส ID ผู้ใช้งานเกตเวย์หลัก                  |
| `username`              | `character varying(100)`      | NOT NULL                          | ชื่อผู้ใช้งานสำหรับเข้าระบบ (สิทธิ์ไม่ซ้ำ)    |
| `password_hash`         | `text`                        | NOT NULL                          | รหัสผ่านที่ผ่านการบดบังพาสเวิร์ด (Hashed)     |
| `full_name`             | `character varying(255)`      | NOT NULL                          | ชื่อ-นามสกุลจริงของผู้ใช้งานระบบ              |
| `email`                 | `character varying(255)`      | Nullable                          | อีเมลติดต่อ                                   |
| `mobile`                | `character varying(30)`       | Nullable                          | เบอร์โทรศัพท์                                 |
| `role_code`             | `character varying(30)`       | NOT NULL (Default `'operator'`)   | รหัสบทบาทระบบ                                 |
| `user_status`           | `character varying(30)`       | NOT NULL (Default `'active'`)     | สถานะการใช้งาน                                |
| `last_login_time`       | `timestamp without time zone` | Nullable                          | บันทึกวันและเวลาเข้าใช้ล่าสุด                 |
| `last_login_ip`         | `character varying(50)`       | Nullable                          | ไอพีล่าสุดที่ล็อกอินเข้าสู่ระบบ               |
| `failed_login_count`    | `integer`                     | NOT NULL (Default 0)              | จำนวนครั้งที่ล็อกอินล้มเหลว                   |
| `password_changed_time` | `timestamp without time zone` | Nullable                          | เวลาแก้ไขรหัสผ่านล่าสุด                       |
| `created_by`            | `integer`                     | Nullable                          | รหัสผู้ใช้งานที่เป็นคนสร้าง Account นี้ขึ้นมา |
| `add_time`              | `timestamp without time zone` | NOT NULL                          | เวลาเพิ่มลงฐานข้อมูล                          |
| `modify_time`           | `timestamp without time zone` | NOT NULL                          | เวลาแก้ไขล่าสุด                               |

---

### ### 2.8 ตาราง `user`

ใช้เก็บข้อมูลเจ้าหน้าที่ระบบทั่วไป Client หรือผู้บริหารจัดการระบบดั้งเดิม

- **Primary Key:** `id`

| ชื่อฟิลด์ (Column) | ประเภทข้อมูล (Type)      | สิทธิ์ในการเป็นค่าว่าง (Nullable) | คำอธิบาย (Description)                        |
| :----------------- | :----------------------- | :-------------------------------- | :-------------------------------------------- |
| `id`               | `integer`                | NOT NULL                          | รหัสผู้ใช้งาน Auto Increment                  |
| `image`            | `text`                   | Nullable                          | ที่อยู่ไฟล์รูปภาพ หรือ Path โปรไฟล์           |
| `username`         | `character varying`      | NOT NULL                          | ชื่อผู้ใช้งานสำหรับเข้าสู่ระบบ (UNIQUE)       |
| `password`         | `character varying`      | NOT NULL                          | รหัสผ่านผู้ใช้ (ต้องจัดเก็บแบบ Hash เท่านั้น) |
| `firstname`        | `character varying(100)` | NOT NULL                          | ชื่อจริง                                      |
| `lastname`         | `character varying(100)` | NOT NULL                          | นามสกุล                                       |
| `email`            | `character varying(100)` | NOT NULL                          | อีเมลผู้ใช้งาน                                |
| `id_card`          | `character varying(100)` | NOT NULL                          | เลขบัตรประจำตัวประชาชน                        |
| `phone`            | `character varying(20)`  | NOT NULL                          | เบอร์โทรศัพท์ผู้ใช้                           |
| `address`          | `text`                   | Nullable                          | ที่อยู่ทางไปรษณีย์                            |
| `role`             | `character varying(20)`  | NOT NULL (Default `'client'`)     | บทบาทการทำงาน                                 |
| `authorize_token`  | `character               |
