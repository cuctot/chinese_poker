// nhanVatAI.js (V9) — Hệ thống nhân vật AI: mỗi nhân vật gắn 1 phong cách
// xếp bài (hoặc trộn theo tỷ lệ % giữa nhiều phong cách, random lại mỗi ván).

import { xepBaiTheoPhongCach, xepBaiChuyenNghiep } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'

// Danh sách nhân vật AI có sẵn — mỗi nhân vật gắn với 1 "phongCach".
// 'coDien' = dùng lại đúng aiXepBai() cũ (đã sửa lỗi ở V8), không phải
// duyệt 72.072 cách chia như 4 phong cách mới.
export const DANH_SACH_NHAN_VAT_MAC_DINH = [
  { id: 'coDien', ten: 'Cổ Điển', phongCach: 'coDien' },
  { id: 'safeway', ten: 'Safeway', phongCach: 'anToan' },
  { id: 'newbalance', ten: 'New Balance', phongCach: 'canBang' },
  { id: 'madmax', ten: 'Mad Max', phongCach: 'toiDaHoaDiem' },
  { id: 'montecarlo', ten: 'Monte Carlo', phongCach: 'chuyenNghiep' },
];

// Tạo 1 nhân vật MỚI "trộn" nhiều phong cách theo tỷ lệ — vd
// { coDien: 0.2, anToan: 0.2, canBang: 0.2, toiDaHoaDiem: 0.2, chuyenNghiep: 0.2 }
// (tổng phải = 1, cho phép chỉ trộn 1 vài phong cách, không bắt buộc đủ 5).
export function taoNhanVatTron(ten, tiLe) {
  const tongTiLe = Object.values(tiLe).reduce((a, b) => a + b, 0);
  if (Math.abs(tongTiLe - 1) > 0.001) {
    throw new Error(`Tổng tỷ lệ phải = 1, hiện tại = ${tongTiLe}`);
  }
  return { id: `tron_${Date.now()}`, ten, phongCach: 'tron', tiLeTron: tiLe };
}

// Chọn 1 phong cách THẬT từ tỷ lệ trộn — gọi lại MỖI VÁN.
function chonPhongCachTuTiLeTron(tiLeTron) {
  const r = Math.random();
  let tichLuy = 0;
  for (const [pc, xacSuat] of Object.entries(tiLeTron)) {
    tichLuy += xacSuat;
    if (r < tichLuy) return pc;
  }
  return Object.keys(tiLeTron)[0]; // phòng sai số làm tròn số thực
}

// Với 1 nhân vật (cố định hoặc trộn), trả về phong cách THẬT dùng cho
// VÁN NÀY — nhân vật cố định luôn trả cùng 1 kết quả, nhân vật trộn thì
// random lại mỗi lần gọi.
export function layPhongCachThucTeChoVan(nhanVat) {
  if (nhanVat.phongCach === 'tron') return chonPhongCachTuTiLeTron(nhanVat.tiLeTron);
  return nhanVat.phongCach;
}

// Điểm vào DUY NHẤT để xếp bài AI — nhận nhân vật, tự biết gọi đúng
// hàm nào tùy phong cách (kể cả 'coDien' dùng aiXepBai cũ, và 'chuyenNghiep'
// cần thêm laCon39 để mô phỏng).
export function aiXepBaiTheoNhanVat(nhanVat, ca13La, laCon39, ruleset) {
  const phongCachThat = layPhongCachThucTeChoVan(nhanVat);

  if (phongCachThat === 'coDien') {
    return { cachChia: aiXepBai(ca13La, ruleset), phongCachThat };
  }
  if (phongCachThat === 'chuyenNghiep') {
    return { cachChia: xepBaiChuyenNghiep(ca13La, laCon39, ruleset), phongCachThat };
  }
  return { cachChia: xepBaiTheoPhongCach(ca13La, ruleset, phongCachThat), phongCachThat };
}
