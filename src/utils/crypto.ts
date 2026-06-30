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
  // นำข้อมูลมาต่อกัน (Concatenate) ด้วยรูปแบบมาตรฐาน เช่น ต่อด้วยเครื่องหมาย |
  const rawData = `${orderRef}|${totalUnit}|${totalPrice}|${totalVat}|${totalPayment}`;
  
  // เข้ารหัสด้วย HMAC-SHA256 โดยใช้ txKey เป็น Key
  return createHmac("sha256", txKey)
    .update(rawData)
    .digest("hex");
}
