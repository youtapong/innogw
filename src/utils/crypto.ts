import { createHmac } from "crypto";
import { sql } from "../db";

/**
 * คำนวณ Signature สำหรับธุรกรรม
 * @param txKey คีย์ลับที่ใช้ในการเข้ารหัส (Secret Key)
 * @param orderRef รหัสอ้างอิงคำสั่งซื้อ (order_ref)
 * @param totalUnit จำนวนหน่วยสินค้าทั้งหมด (total_unit)
 * @param totalPrice ราคารวม (total_price)
 * @param totalVat ภาษีมูลค่าเพิ่มรวม (total_vat)
 * @param totalPayment ยอดชำระเงินรวมสุทธิ (total_payment)
 * @returns signature ในรูปแบบ Hex String
 */
export function signature(
  txKey: string,
  orderRef: string,
  totalUnit: number | string,
  totalPrice: number | string,
  totalVat: number | string,
  totalPayment: number | string
): string {
  // $txKey .'|'. $order_ref .'|'. $total_unit .'|'. $total_price .'|'. $total_vat .'|'. $total_payment
  const rawData = `${txKey}|${orderRef}|${totalUnit}|${totalPrice}|${totalVat}|${totalPayment}`;
  
  // ใช้ key เป็น "" (เทียบเท่ากับ false ใน PHP hash_hmac)
  return createHmac("sha256", "")
    .update(rawData)
    .digest("hex");
}

/**
 * เข้ารหัส esCode ร่วมกับวันเวลาปัจจุบัน เป็น Base64 Token
 * @param esCode รหัสสินค้า eservice
 * @returns Base64 Token string
 */
export function product_token_encode(esCode: string): string {
  const now = new Date().toISOString();
  const raw = `${esCode}|${now}`;
  return Buffer.from(raw).toString("base64");
}

/**
 * ถอดรหัส Base64 Token กลับมาเป็นชุดข้อมูล Array
 * @param token Base64 Token string
 * @returns Array ของ [esCode, datetime]
 */
export function product_token_decode(token: string): string[] {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return decoded.split("|");
  } catch (error) {
    return [];
  }
}

/**
 * สร้าง orderRef ใหม่ โดยสืบค้นค่าล่าสุดจากฐานข้อมูลและเพิ่มค่าทีละ 1
 * @param esCode รหัส e-service
 * @param inno_sub1 ส่วนย่อยที่ 1
 * @param inno_sub2 ส่วนย่อยที่ 2
 * @returns orderRef ในรูปแบบ 'esCode'-'inno_sub1'-'inno_sub2'-'000000x'
 */
export async function orderRef_create(
  esCode: string | number,
  inno_sub1: string | number,
  inno_sub2: string | number
): Promise<string> {
  const orderRef_check = `${esCode}-${inno_sub1}-${inno_sub2}`;
  console.log(`[orderRef_create] Input: esCode=${esCode}, inno_sub1=${inno_sub1}, inno_sub2=${inno_sub2}`);
  console.log(`[orderRef_create] orderRef_check: ${orderRef_check}`);

  // นำตัวแปร orderRef_check ไปหาค่า order_ref ที่ค่ามากที่สุด
  const result = await sql`
    SELECT order_ref 
    FROM "order_items" 
    WHERE order_ref LIKE ${`${orderRef_check}-%`}
    ORDER BY order_ref DESC 
    LIMIT 1
  `;

  if (!result || result.length === 0) {
    const output = `${orderRef_check}-0000001`;
    console.log(`[orderRef_create] No existing order_ref found. Output: ${output}`);
    return output;
  }

  const maxOrderRef = result[0].order_ref;
  console.log(`[orderRef_create] Found max order_ref: ${maxOrderRef}`);

  const parts = maxOrderRef.split("-");
  const lastPart = parts[parts.length - 1];
  const num = parseInt(lastPart, 10);

  if (isNaN(num)) {
    const output = `${orderRef_check}-0000001`;
    console.log(`[orderRef_create] Parsed suffix was NaN. Output: ${output}`);
    return output;
  }

  const nextNum = num + 1;
  const nextSuffix = String(nextNum).padStart(7, "0");
  const output = `${orderRef_check}-${nextSuffix}`;
  console.log(`[orderRef_create] Incremented suffix: ${lastPart} -> ${nextSuffix}. Output: ${output}`);
  return output;
}
