# Database Schema Documentation

This document describes the database schema of the `innogw` database, running on **PostgreSQL 17.5** (server 17.5 (Debian 17.5-1.pgdg110+1)).

---

## 1. Table: `api_logs`
Used for logging API requests, responses, and execution metadata.

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `log_id` | `integer` | No | `nextval('api_logs_log_id_seq'::regclass)` | Primary Key |
| `api_name` | `character varying(100)` | No | | Name of the API endpoint |
| `order_ref` | `character varying(100)` | Yes | | Reference to an order |
| `x_request_id` | `character varying(150)` | Yes | | Request tracking ID |
| `x_client_ip` | `character varying(50)` | Yes | | Client IP address |
| `request_body` | `jsonb` | Yes | | API request payload |
| `response_body` | `jsonb` | Yes | | API response payload |
| `status_code` | `character varying(20)` | Yes | | HTTP status code |
| `is_success` | `boolean` | Yes | | Status flag indicating success/failure |
| `error_message` | `text` | Yes | | Error details if `is_success` is false |
| `add_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Log creation timestamp |
| `modify_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Log modification timestamp |

### Indexes
- `api_logs_pkey` **PRIMARY KEY**, btree (`log_id`)
- `idx_api_logs_add_time` btree (`add_time`)
- `idx_api_logs_api_name` btree (`api_name`)
- `idx_api_logs_order_ref` btree (`order_ref`)
- `idx_api_logs_request_body_gin` gin (`request_body`)
- `idx_api_logs_response_body_gin` gin (`response_body`)
- `idx_api_logs_x_request_id` btree (`x_request_id`)

### Triggers
- `trg_api_logs_modify_time`: `BEFORE UPDATE ON api_logs FOR EACH ROW EXECUTE FUNCTION set_modify_time()`

---

## 2. Table: `custommer`
Stores customer details, including contact info, tax configuration, and address details.

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `custommer_id` | `integer` | No | `nextval('custommer_custommer_id_seq'::regclass)` | Primary Key |
| `es_code` | `character varying(50)` | No | | External/System code mapping to `product_mapping(es_code)` |
| `document_type_code` | `character varying(10)` | No | | Document type identifier |
| `tax_id_type` | `character varying(10)` | No | | Tax ID type classification |
| `national_id` | `character varying(30)` | Yes | | National ID card number |
| `business_id` | `character varying(30)` | Yes | | Business registration number |
| `branch_id` | `character varying(10)` | Yes | | Branch code/ID |
| `company_name` | `character varying(255)` | Yes | | Name of the company |
| `first_name` | `character varying(150)` | Yes | | Customer first name |
| `last_name` | `character varying(150)` | Yes | | Customer last name |
| `email` | `character varying(255)` | Yes | | Customer email address |
| `mobile` | `character varying(30)` | No | | Mobile phone number |
| `village` | `character varying(255)` | Yes | | Village / Building |
| `house_no` | `character varying(100)` | Yes | | House number |
| `moo` | `character varying(50)` | Yes | | Moo |
| `soi` | `character varying(150)` | Yes | | Soi |
| `road` | `character varying(150)` | Yes | | Road name |
| `sub_district` | `character varying(150)` | Yes | | Sub-district (Tambon) |
| `district` | `character varying(150)` | Yes | | District (Amphoe) |
| `province` | `character varying(150)` | Yes | | Province (Changwat) |
| `zip_code` | `character varying(20)` | Yes | | Postal code |
| `office_name` | `character varying(255)` | Yes | | Office name |
| `add_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `modify_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record modification timestamp |

### Indexes
- `custommer_pkey` **PRIMARY KEY**, btree (`custommer_id`)
- `idx_custommer_es_code` btree (`es_code`)
- `idx_custommer_mobile` btree (`mobile`)
- `idx_custommer_tax` btree (`tax_id_type`, `national_id`, `business_id`)

### Foreign Keys
- `custommer_es_code_fkey`: `FOREIGN KEY (es_code) REFERENCES product_mapping(es_code) ON UPDATE CASCADE ON DELETE RESTRICT`

### Referenced By
- Table `orders` contains constraint `orders_custommer_id_fkey` referencing `custommer(custommer_id)` on update cascade/delete set null.

### Triggers
- `trg_custommer_modify_time`: `BEFORE UPDATE ON custommer FOR EACH ROW EXECUTE FUNCTION set_modify_time()`

---

## 3. Table: `issue`
Tracks system issues, support tickets, or processing issues related to order items.

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `issue_id` | `integer` | No | `nextval('issue_issue_id_seq'::regclass)` | Primary Key |
| `item_id` | `integer` | No | | Reference to `order_items(item_id)` |
| `order_ref` | `character varying(100)` | No | | Reference to `orders(order_ref)` |
| `service_name` | `character varying(255)` | No | | Name of the service encountering issues |
| `issue_title` | `character varying(255)` | No | | Summary of the issue |
| `issue_detail` | `text` | Yes | | Detailed explanation |
| `payment_received` | `boolean` | No | `true` | Payment receipt status |
| `frontend_problem` | `text` | Yes | | Description of frontend/UI problems |
| `expected_behavior` | `text` | Yes | | Expected behavior |
| `actual_behavior` | `text` | Yes | | Actual behavior observed |
| `issue_status` | `character varying(30)` | No | `'open'` | Status (`open`, `checking`, `resolved`, `cancelled`) |
| `resolved_by` | `character varying(150)` | Yes | | Name/ID of resolver |
| `resolved_note` | `text` | Yes | | Notes on the resolution |
| `add_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `modify_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record modification timestamp |

### Indexes
- `issue_pkey` **PRIMARY KEY**, btree (`issue_id`)
- `idx_issue_item_id` btree (`item_id`)
- `idx_issue_order_ref` btree (`order_ref`)
- `idx_issue_service_name` btree (`service_name`)
- `idx_issue_status` btree (`issue_status`)

### Constraints
- `issue_issue_status_check`: `CHECK (issue_status::text = ANY (ARRAY['open'::character varying, 'checking'::character varying, 'resolved'::character varying, 'cancelled'::character varying]::text[]))`

### Foreign Keys
- `issue_item_id_fkey`: `FOREIGN KEY (item_id) REFERENCES order_items(item_id) ON UPDATE CASCADE ON DELETE RESTRICT`
- `issue_order_ref_fkey`: `FOREIGN KEY (order_ref) REFERENCES orders(order_ref) ON UPDATE CASCADE ON DELETE RESTRICT`

### Triggers
- `trg_issue_modify_time`: `BEFORE UPDATE ON issue FOR EACH ROW EXECUTE FUNCTION set_modify_time()`

---

## 4. Table: `order_items`
Stores the individual line items belonging to an order.

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `item_id` | `integer` | No | `nextval('order_items_item_id_seq'::regclass)` | Primary Key |
| `order_ref` | `character varying(100)` | No | | Reference to `orders(order_ref)` |
| `es_code` | `character varying(50)` | No | | Reference to `product_mapping(es_code)` |
| `account_code` | `character varying(50)` | No | | Account code |
| `product_code` | `character varying(50)` | No | | Product code |
| `product_name` | `character varying(255)` | No | | Product name |
| `model` | `character varying(150)` | Yes | | Product model / variation |
| `company_code` | `character varying(20)` | No | | Company identifier |
| `home_code` | `character varying(100)` | Yes | | Home/Property code |
| `production_option1` | `text` | Yes | | Production option detail 1 |
| `production_option2` | `text` | Yes | | Production option detail 2 |
| `production_option3` | `text` | Yes | | Production option detail 3 |
| `unit` | `integer` | No | `1` | Quantity units |
| `price` | `numeric(12,2)` | No | `0.00` | Unit price |
| `vat` | `numeric(12,2)` | No | `0.00` | Value-added tax amount |
| `net_price` | `numeric(12,2)` | No | `0.00` | Net price excluding VAT |
| `net_vat` | `numeric(12,2)` | No | `0.00` | Net VAT amount |
| `status` | `character varying(20)` | No | `'success'` | Item status (`success`, `fail`, `cancel`) |
| `add_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `modify_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record modification timestamp |

### Indexes
- `order_items_pkey` **PRIMARY KEY**, btree (`item_id`)
- `idx_order_items_es_code` btree (`es_code`)
- `idx_order_items_order_ref` btree (`order_ref`)
- `idx_order_items_status` btree (`status`)

### Constraints
- `order_items_status_check`: `CHECK (status::text = ANY (ARRAY['success'::character varying, 'fail'::character varying, 'cancel'::character varying]::text[]))`

### Foreign Keys
- `order_items_es_code_fkey`: `FOREIGN KEY (es_code) REFERENCES product_mapping(es_code) ON UPDATE CASCADE ON DELETE RESTRICT`
- `order_items_order_ref_fkey`: `FOREIGN KEY (order_ref) REFERENCES orders(order_ref) ON UPDATE CASCADE ON DELETE CASCADE`

### Referenced By
- Table `issue` contains constraint `issue_item_id_fkey` referencing `order_items(item_id)` on update cascade/delete restrict.

### Triggers
- `trg_order_items_modify_time`: `BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION set_modify_time()`

---

## 5. Table: `product_mapping`
Maps ES codes to HANA/ECC account codes, product codes, and general ledger details.

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `integer` | No | `nextval('product_mapping_id_seq'::regclass)` | Primary Key |
| `es_code` | `character varying(50)` | No | | External/System unique code identifier |
| `product_name` | `character varying(255)` | No | | Name of the product |
| `hana_account_code` | `character varying(50)` | No | `'44100101'` | HANA General Ledger account code |
| `hana_product_code` | `character varying(50)` | No | `'209020001'` | HANA product identifier |
| `hana_sub_product_code` | `character varying(50)` | No | `'0'` | HANA sub-product identifier |
| `hana_revenue_type` | `character varying(50)` | No | `'2'` | HANA revenue type classification |
| `ecc_account_code` | `character varying(50)` | No | `'50412000'` | ECC account code |
| `ecc_account_name` | `character varying(100)` | No | `'รายได้บริการด้านนวัตกรรม'` | ECC account name description |
| `ecc_product_code` | `character varying(50)` | No | `'G030xx'` | ECC product identifier |
| `ecc_product_name` | `character varying(100)` | No | `'บริการด้านวิจัยและนวัตกรรม'` | ECC product name description |
| `channel_product_code` | `character varying(50)` | No | `'SPC60001'` | Channel partner product code |
| `channel_service_code` | `character varying(50)` | No | | Channel partner service code |
| `product_token` | `text` | Yes | | Security / API token for the product |
| `add_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `modify_time` | `timestamp without time zone` | No | `CURRENT_TIMESTAMP` | Record modification timestamp |

### Indexes
- `product_mapping_new_pkey` **PRIMARY KEY**, btree (`id`)
- `product_mapping_new_es_code_key` **UNIQUE**, btree (`es_code`)

---

## 6. Table: `spatial_ref_sys`
Standard PostGIS metadata table for spatial reference systems (coordinate systems).

### Columns
| Column Name | Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `srid` | `integer` | No | | Spatial Reference System Identifier (Primary Key) |
| `auth_name` | `character varying(256)` | Yes | | Authority name (e.g., `EPSG`) |
| `auth_srid` | `integer` | Yes | | Authority-assigned SRID |
| `srtext` | `character varying(2048)` | Yes | | Well-Known Text (WKT) representation of SRS |
| `proj4text` | `character varying(2048)` | Yes | | Proj4 coordinate conversion string |

### Indexes
- `spatial_ref_sys_pkey` **PRIMARY KEY**, btree (`srid`)

### Constraints
- `spatial_ref_sys_srid_check`: `CHECK (srid > 0 AND srid <= 998999)`
