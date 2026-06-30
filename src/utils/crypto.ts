import { createHmac } from "crypto";

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
