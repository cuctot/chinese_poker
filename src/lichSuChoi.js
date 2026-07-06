// lichSuChoi.js (V9) — Chỉ còn Hiệp (gốc) và Ván. Không còn Phiên.

function taoId(tienTo) {
  return `${tienTo}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// Giới hạn lưu trữ = đúng số lần mô phỏng Monte Carlo tối thiểu để kết
// quả đủ tin cậy (đã kiểm chứng: ở mức 1000 lần, 2 lần chạy độc lập cho
// kết quả gần nhau 15,4%/16,2%; thấp hơn dao động mạnh hơn nhiều) — dùng
// chung 1 con số có căn cứ thay vì chọn tùy tiện ở 2 nơi.
const SO_LAN_MO_PHONG_TOI_THIEU = 1000;
export const SO_VAN_TOI_DA_MOI_NGUON = SO_LAN_MO_PHONG_TOI_THIEU;

function layDemToanCuc(khoa) {
  return Number(localStorage.getItem(khoa) || '0');
}
function tangDemToanCuc(khoa) {
  const moi = layDemToanCuc(khoa) + 1;
  localStorage.setItem(khoa, String(moi));
  return moi;
}

// 2 KHÓA ĐẾM RIÊNG — mỗi nguồn có hệ đếm hiệp CỦA RIÊNG MÌNH (thay 1 hệ
// đếm chung KHOA_DEM_HIEP trước đây) — thống kê 2 nguồn không liên quan.
const KHOA_DEM_HIEP_THAT = 'mauBinhDemHiepThatToanCuc';
const KHOA_DEM_HIEP_AI = 'mauBinhDemHiepAIToanCuc';
function khoaDemTheoNguon(nguon) {
  return nguon === 'choiAI' ? KHOA_DEM_HIEP_AI : KHOA_DEM_HIEP_THAT;
}

// Tạo 1 Hiệp mới — soThuTu là số TOÀN CỤC theo TỪNG NGUỒN, tăng liên tục
// mãi mãi (không còn khái niệm "hiệp thứ mấy trong phiên nào" vì Phiên đã
// bỏ; và Ghi điểm/Chơi AI không còn dùng chung 1 số nữa).
export function taoHiepMoi(nguon, nguoiChoi, chuThich = '', nhanVatDoiThu = null) {
  return {
    id: taoId('hiep'),
    soThuTu: tangDemToanCuc(khoaDemTheoNguon(nguon)), // ĐỘC LẬP theo nguồn
    batDau: Date.now(),
    nguon, // 'thatNgoai' | 'choiAI'
    nguoiChoi: [...nguoiChoi],
    chuThich,
    // Chỉ có ý nghĩa với nguon='choiAI' — 3 id nhân vật đã chọn cho hiệp này
    ...(nhanVatDoiThu ? { nhanVatDoiThu } : {}),
  };
}

// `thoiGian` mặc định là lúc gọi hàm (Date.now()) — nhưng Ghi điểm (nhập
// tay) cần ghi đúng lúc "vừa đánh xong ván" (điểm đầu tiên được gõ vào),
// KHÔNG phải lúc bấm "Lưu ván này" (có thể trễ vài chục giây do gõ 4 số),
// nên cho phép truyền sẵn `thoiGian` để ghi đè.
export function taoVanMoi({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, nguon, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang, thoiGian, cheDoThucTeDoiThu }) {
  return {
    id: taoId('van'), hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia,
    thoiGian: thoiGian ?? Date.now(), nguon, diem: { ...diem },
    ...(nguoiChoiBaiThat ? { nguoiChoiBaiThat } : {}),
    ...(laThangTrang !== undefined ? { laThangTrang, loaiThangTrang: loaiThangTrang || null } : {}),
    // Chỉ có ý nghĩa với nguon='choiAI' — phong cách THẬT mỗi đối thủ đã
    // dùng ở ĐÚNG ván này (quan trọng cho nhân vật trộn — mỗi ván có thể
    // khác nhau, không thể chỉ ghi 1 lần cho cả hiệp).
    ...(cheDoThucTeDoiThu ? { cheDoThucTeDoiThu } : {}),
  };
}

export function nguoiChiaChoVan(nguoiChoi, soThuTuVanTrongHiep) {
  const lanChia = Math.ceil(soThuTuVanTrongHiep / 3);
  const idx = (lanChia - 1) % nguoiChoi.length;
  return { nguoiChia: nguoiChoi[idx], lanChia };
}

export function tongDiemHopLe(diem) {
  return Object.values(diem).reduce((a, b) => a + b, 0) === 0;
}

export function tinhTongKetHiep(danhSachVanCuaHiep) {
  const tongKet = {};
  danhSachVanCuaHiep.forEach(van => {
    Object.entries(van.diem).forEach(([ten, d]) => { tongKet[ten] = (tongKet[ten] || 0) + d; });
  });
  return tongKet;
}

export function layVanCuaHiep(hiepId, danhSachVan) {
  return danhSachVan.filter(v => v.hiepId === hiepId).sort((a, b) => a.thoiGian - b.thoiGian);
}

// Hiệp coi là XONG khi đủ 12 ván — luôn tính lại từ dữ liệu thật.
export function hiepDaXong(hiepId, danhSachVan) {
  return layVanCuaHiep(hiepId, danhSachVan).length >= 12;
}

// Thời điểm "kết thúc" 1 hiệp = thời gian của ván CUỐI CÙNG đã lưu.
export function thoiGianKetThucHiep(hiepId, danhSachVan) {
  const van = layVanCuaHiep(hiepId, danhSachVan);
  return van.length > 0 ? van[van.length - 1].thoiGian : null;
}

export function themVanVaoLichSu(vanMoi, danhSachVanHienTai) {
  const danhSachMoi = [...danhSachVanHienTai, vanMoi];
  const cungNguon = danhSachMoi.filter(v => v.nguon === vanMoi.nguon).sort((a, b) => a.thoiGian - b.thoiGian);
  if (cungNguon.length > SO_VAN_TOI_DA_MOI_NGUON) {
    const soCanXoa = cungNguon.length - SO_VAN_TOI_DA_MOI_NGUON;
    const idCanXoa = new Set(cungNguon.slice(0, soCanXoa).map(v => v.id));
    return danhSachMoi.filter(v => !idCanXoa.has(v.id));
  }
  return danhSachMoi;
}

// Tìm hiệp DỞ DANG gần nhất của 1 nguồn (chưa đủ 12 ván) — null nếu
// không có (chưa từng chơi, hoặc mọi hiệp trước đó đều đã xong).
export function layHiepDangDoHoacNull(danhSachHiep, danhSachVan, nguon) {
  const hiepCungNguon = danhSachHiep.filter(h => h.nguon === nguon).sort((a, b) => b.soThuTu - a.soThuTu);
  for (const hiep of hiepCungNguon) {
    if (!hiepDaXong(hiep.id, danhSachVan)) return hiep;
  }
  return null;
}

// Xóa sạch dữ liệu lịch sử cũ (V8 trở về trước) — cấu trúc Ván/Hiệp ở V9
// thêm field mới (nhanVatDoiThu/cheDoThucTeDoiThu), KHÔNG tương thích
// ngược. Chỉ chạy 1 LẦN sau khi triển khai xong V9 (qua Console trình
// duyệt), không phải code thường trực trong app.
export function xoaSachLichSuCu() {
  localStorage.removeItem(KHOA_HIEP);
  localStorage.removeItem(KHOA_VAN);
  localStorage.removeItem('mauBinhDemHiepToanCuc'); // hệ đếm chung CŨ của V8
  localStorage.removeItem(KHOA_DEM_HIEP_THAT);
  localStorage.removeItem(KHOA_DEM_HIEP_AI);
}

export function docDanhSach(khoa) {
  try {
    const raw = localStorage.getItem(khoa);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function ghiDanhSach(khoa, mang) {
  localStorage.setItem(khoa, JSON.stringify(mang));
}

export const KHOA_HIEP = 'mauBinhLichSuHiep';
export const KHOA_VAN = 'mauBinhLichSuVan';
