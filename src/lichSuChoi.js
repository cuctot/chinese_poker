// lichSuChoi.js (V9, dọn dẹp ở V12 Phase 9) — Chỉ còn Hiệp (gốc) và Ván.
// Không còn Phiên. Từ V12, Ghi điểm (lichSuNhom.js) và Chơi với AI
// (lichSuAI.js) đều đọc/ghi qua Supabase — file này giờ chỉ còn các hàm
// THUẦN dùng chung cho dữ liệu Hiệp/Ván (không phụ thuộc nguồn lưu trữ),
// cộng 1 hàm dọn dẹp localStorage cũ (xoaSachLichSuCu).

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

// Tên hiển thị của người chơi ("Bạn" theo mặc định) dùng ở hiệp GẦN NHẤT
// (không cần còn dở dang) của 1 nguồn — làm giá trị điền sẵn khi người
// chơi được chọn lại tên cho hiệp mới, để không phải gõ lại mỗi lần nếu
// họ đã đổi tên trước đó. 'Bạn' nếu chưa từng có hiệp nào.
export function layTenNguoiChoiGanNhat(danhSachHiep, nguon) {
  const hiepCungNguon = danhSachHiep.filter(h => h.nguon === nguon).sort((a, b) => b.soThuTu - a.soThuTu);
  return hiepCungNguon[0]?.nguoiChoi?.[0] ?? 'Bạn';
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

// Tìm hiệp DỞ DANG gần nhất của 1 nguồn (chưa đủ 12 ván) — null nếu
// không có (chưa từng chơi, hoặc mọi hiệp trước đó đều đã xong).
export function layHiepDangDoHoacNull(danhSachHiep, danhSachVan, nguon) {
  const hiepCungNguon = danhSachHiep.filter(h => h.nguon === nguon).sort((a, b) => b.soThuTu - a.soThuTu);
  for (const hiep of hiepCungNguon) {
    if (!hiepDaXong(hiep.id, danhSachVan)) return hiep;
  }
  return null;
}

// Xóa sạch dữ liệu lịch sử CŨ trong localStorage (V6-V11, từ trước khi
// chuyển sang Supabase ở V12) — KHÔNG chạy tự động, chỉ để gọi tay 1 lần
// qua Console trình duyệt nếu Huy muốn dọn trình duyệt của mình.
export function xoaSachLichSuCu() {
  localStorage.removeItem('mauBinhLichSuHiep');
  localStorage.removeItem('mauBinhLichSuVan');
  localStorage.removeItem('mauBinhDemHiepToanCuc'); // hệ đếm chung CŨ của V8
  localStorage.removeItem('mauBinhDemHiepThatToanCuc');
  localStorage.removeItem('mauBinhDemHiepAIToanCuc');
}
