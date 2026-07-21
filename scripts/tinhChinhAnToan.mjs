// scripts/tinhChinhAnToan.mjs (V14 Phase 5) — Script ĐỘC LẬP, KHÔNG đụng
// gì tới Supabase/database, mọi thứ mô phỏng offline. Không phải tính
// năng trong app — Huy tự chạy bằng `node scripts/tinhChinhAnToan.mjs`
// khi muốn thử nhiều mức phạt "An toàn" (hiện đang -2, xem
// `chamDiemCachChia` phong cách 'anToan' ở src/cardEngine.js), so tỷ lệ
// thắng để tìm mức tốt hơn dựa trên dữ liệu thay vì đoán.
import { taoBoBai, xaoBai, duyetCachChiaHopLe, danhGia3La, danhGia5La, soSanh, xepBaiHopLe } from '../src/cardEngine.js'

function chamDiemAnToan(chiDau, chiGiua, chiCuoi, mucPhat) {
  const dDau = danhGia3La(chiDau), dGiua = danhGia5La(chiGiua), dCuoi = danhGia5La(chiCuoi);
  let diem = dDau.loai + dGiua.loai + dCuoi.loai;
  if (dDau.loai === 0) diem += mucPhat;
  return diem;
}
function xepBaiAnToan(ca13La, mucPhat) {
  const tatCaHopLe = duyetCachChiaHopLe(ca13La);
  let totNhat = null, diemTotNhat = -Infinity;
  for (const cach of tatCaHopLe) {
    const diem = chamDiemAnToan(cach.chiDau, cach.chiGiua, cach.chiCuoi, mucPhat);
    if (diem > diemTotNhat) { diemTotNhat = diem; totNhat = cach; }
  }
  return totNhat;
}

// Đối thủ dùng HEURISTIC NHANH (không duyệt đầy đủ) để mô phỏng nhanh
// hàng nghìn ván — đại diện "đối thủ trung bình", không phải phong cách
// cụ thể nào.
function xepBaiNhanhChoDoiThu(ca13La) {
  for (let lanThu = 0; lanThu < 5; lanThu++) {
    const daXao = lanThu === 0 ? ca13La : [...ca13La].sort(() => Math.random() - 0.5);
    const daSap = [...daXao].sort((a, b) => b.rank - a.rank);
    const cach = { chiCuoi: daSap.slice(0, 5), chiGiua: daSap.slice(5, 10), chiDau: daSap.slice(10, 13) };
    if (xepBaiHopLe(cach.chiDau, cach.chiGiua, cach.chiCuoi)) return cach;
  }
  const daSap = [...ca13La].sort((a, b) => b.rank - a.rank);
  return { chiCuoi: daSap.slice(0, 5), chiGiua: daSap.slice(5, 10), chiDau: daSap.slice(10, 13) };
}

function soSanhMucPhat(danhSachMucPhat, soVanMoiMuc) {
  const ketQua = {};
  for (const mucPhat of danhSachMucPhat) {
    let soLanThang = 0;
    for (let v = 0; v < soVanMoiMuc; v++) {
      const bo = xaoBai(taoBoBai());
      const cachAnToan = xepBaiAnToan(bo.slice(0, 13), mucPhat);
      const dDau = danhGia3La(cachAnToan.chiDau), dGiua = danhGia5La(cachAnToan.chiGiua), dCuoi = danhGia5La(cachAnToan.chiCuoi);
      let diemVan = 0;
      for (let d = 0; d < 3; d++) {
        const cachDoiThu = xepBaiNhanhChoDoiThu(bo.slice(13 + d * 13, 26 + d * 13));
        diemVan += soSanh(dDau, danhGia3La(cachDoiThu.chiDau));
        diemVan += soSanh(dGiua, danhGia5La(cachDoiThu.chiGiua));
        diemVan += soSanh(dCuoi, danhGia5La(cachDoiThu.chiCuoi));
      }
      if (diemVan > 0) soLanThang++;
    }
    ketQua[mucPhat] = soLanThang / soVanMoiMuc;
    console.log(`Mức phạt ${mucPhat}: ${(ketQua[mucPhat] * 100).toFixed(1)}% thắng (${soVanMoiMuc} ván)`);
  }
  return ketQua;
}

// CHẠY THẬT — chỉnh số ván theo nhu cầu (xem ghi chú hiệu năng ở
// V14_GUIDE.md Phase 5: 6 mức × 300 ván ước tính ~10-15 phút; khuyến
// nghị chạy thử với số nhỏ trước, vd 50, để chắc script chạy đúng).
soSanhMucPhat([0, -1, -2, -3, -5, -8], 300);
