// lichSuChoi.js (V8) — Chỉ còn Hiệp (gốc) và Ván. Không còn Phiên.

function taoId(tienTo) {
  return `${tienTo}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const SO_VAN_TOI_DA_MOI_NGUON = 500;

function layDemToanCuc(khoa) {
  return Number(localStorage.getItem(khoa) || '0');
}
function tangDemToanCuc(khoa) {
  const moi = layDemToanCuc(khoa) + 1;
  localStorage.setItem(khoa, String(moi));
  return moi;
}
const KHOA_DEM_HIEP = 'mauBinhDemHiepToanCuc';

// Tạo 1 Hiệp mới — soThuTu là số TOÀN CỤC, tăng liên tục mãi mãi (không
// còn khái niệm "hiệp thứ mấy trong phiên nào" vì Phiên đã bỏ).
export function taoHiepMoi(nguon, nguoiChoi, chuThich = '') {
  return {
    id: taoId('hiep'),
    soThuTu: tangDemToanCuc(KHOA_DEM_HIEP),
    batDau: Date.now(),
    nguon, // 'thatNgoai' | 'choiAI'
    nguoiChoi: [...nguoiChoi],
    chuThich,
  };
}

// `thoiGian` mặc định là lúc gọi hàm (Date.now()) — nhưng Ghi điểm (nhập
// tay) cần ghi đúng lúc "vừa đánh xong ván" (điểm đầu tiên được gõ vào),
// KHÔNG phải lúc bấm "Lưu ván này" (có thể trễ vài chục giây do gõ 4 số),
// nên cho phép truyền sẵn `thoiGian` để ghi đè.
export function taoVanMoi({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, nguon, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang, thoiGian }) {
  return {
    id: taoId('van'), hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia,
    thoiGian: thoiGian ?? Date.now(), nguon, diem: { ...diem },
    ...(nguoiChoiBaiThat ? { nguoiChoiBaiThat } : {}),
    ...(laThangTrang !== undefined ? { laThangTrang, loaiThangTrang: loaiThangTrang || null } : {}),
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
export { SO_VAN_TOI_DA_MOI_NGUON };
