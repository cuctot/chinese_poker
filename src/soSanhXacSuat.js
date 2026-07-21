// soSanhXacSuat.js (V14 Phase 2) — So sánh xác suất LÝ THUYẾT (đã tính
// chính xác/mô phỏng ở V4) với tần suất THỰC TẾ quan sát được từ dữ liệu
// Ván "Chơi với AI" đã tích lũy trên Supabase (đọc qua useDuLieuAIToanBo
// ở lichSuAI.js — chỉ Admin gọi được, dữ liệu gộp từ MỌI người chơi).
//
// Nhận vào Ván đã map sẵn camelCase (laThangTrang, loaiThangTrang,
// chiTietCaVan...), KHÔNG phải row thô từ Supabase (snake_case).

export const XAC_SUAT_LY_THUYET_THANG_TRANG = {
  rongCuon: 4 / 635013559600,
  sanhRong: 67108860 / 635013559600,
  namDoiMotSam: 320246784 / 635013559600,
  lucPheBon: 2241727488 / 635013559600,
  namDoiThong: 0.000744,
  baThung: 0.008916,
  baSanh: 0.001989,
};

export const XAC_SUAT_LY_THUYET_CHI_CUOI = {
  '8_thuong': 4 / 2598960, '8_ha': 4 / 2598960, '8': 32 / 2598960,
  '7_A': 48 / 2598960, '7': 576 / 2598960,
  '6': 3744 / 2598960, '5': 5108 / 2598960, '4': 10200 / 2598960,
};

// danhSachVan: mảng Ván (Chơi với AI) đã tải từ Supabase.
export function soSanhThangTrang(danhSachVan) {
  const tongCoHoi = danhSachVan.length * 4; // mỗi ván có 4 "lượt kiểm tra" (Bạn + 3 đối thủ)
  const demThucTe = {};
  for (const van of danhSachVan) {
    if (van.laThangTrang && van.loaiThangTrang) {
      demThucTe[van.loaiThangTrang] = (demThucTe[van.loaiThangTrang] || 0) + 1;
    }
  }
  const ketQua = {};
  for (const loai of Object.keys(XAC_SUAT_LY_THUYET_THANG_TRANG)) {
    const soLanThucTe = demThucTe[loai] || 0;
    ketQua[loai] = {
      lyThuyet: XAC_SUAT_LY_THUYET_THANG_TRANG[loai],
      thucTe: tongCoHoi > 0 ? soLanThucTe / tongCoHoi : 0,
      soLanThucTe, tongCoHoi,
    };
  }
  return ketQua;
}

// Chỉ dùng ván CÓ chiTietCaVan (ván thắng thường, không phải thắng trắng)
export function soSanhChiCuoi(danhSachVanCoChiTiet) {
  const demTheoMa = {};
  let tongLuotQuanSat = 0;
  const TEN_SANG_MA = {
    'Thùng phá sảnh Thượng': '8_thuong', 'Thùng phá sảnh Hạ': '8_ha', 'Thùng phá sảnh': '8',
    'Tứ quý toàn Á': '7_A', 'Tứ quý': '7', 'Cù lũ': '6', 'Thùng': '5', 'Sảnh': '4',
  };
  for (const van of danhSachVanCoChiTiet) {
    const chiTiet = van.chiTietCaVan;
    if (!chiTiet) continue;
    for (const [, ct] of Object.entries(chiTiet)) {
      tongLuotQuanSat++;
      const ma = TEN_SANG_MA[ct.loaiTungChi?.cuoi];
      if (ma) demTheoMa[ma] = (demTheoMa[ma] || 0) + 1;
    }
  }
  const ketQua = {};
  for (const ma of Object.keys(XAC_SUAT_LY_THUYET_CHI_CUOI)) {
    const soLanThucTe = demTheoMa[ma] || 0;
    ketQua[ma] = {
      lyThuyet: XAC_SUAT_LY_THUYET_CHI_CUOI[ma],
      thucTe: tongLuotQuanSat > 0 ? soLanThucTe / tongLuotQuanSat : 0,
      soLanThucTe, tongLuotQuanSat,
    };
  }
  return ketQua;
}
