// phanBoVaHoiTu.js (V14 Phase 3) — Phân bố loại bài thắng theo từng chi +
// hội tụ tỷ lệ nhân vật "trộn" (minh họa "Luật số lớn"). Nhận Ván đã map
// sẵn camelCase (xem lichSuAI.js), giống soSanhXacSuat.js.

// Phân bố loại bài thắng theo từng chi (tenChi: 'dau' | 'giua' | 'cuoi')
export function tinhPhanBoLoaiBai(danhSachVanCoChiTiet, tenChi) {
  const dem = {};
  let tongSo = 0;
  for (const van of danhSachVanCoChiTiet) {
    const chiTiet = van.chiTietCaVan;
    if (!chiTiet) continue;
    for (const [, ct] of Object.entries(chiTiet)) {
      const loai = ct.loaiTungChi?.[tenChi];
      if (!loai) continue;
      dem[loai] = (dem[loai] || 0) + 1;
      tongSo++;
    }
  }
  return Object.entries(dem)
    .map(([loai, soLuong]) => ({ loai, soLuong, tiLe: tongSo > 0 ? soLuong / tongSo : 0 }))
    .sort((a, b) => b.soLuong - a.soLuong);
}

// Đối thủ nào có NHIỀU HƠN 1 phong cách thật (cheDoThucTeDoiThu) ghi nhận
// qua các ván khác nhau chắc chắn là nhân vật "trộn" (nhân vật cố định
// luôn ra đúng 1 phong cách mọi ván) — suy ra từ DỮ LIỆU thay vì cần biết
// trước tên nhân vật trộn nào, vì tên đối thủ đổi theo từng hiệp.
export function phatHienNhanVatTron(danhSachVanChoiAI) {
  const tapPhongCach = {};
  for (const van of danhSachVanChoiAI) {
    if (!van.cheDoThucTeDoiThu) continue;
    for (const [ten, phongCach] of Object.entries(van.cheDoThucTeDoiThu)) {
      (tapPhongCach[ten] ??= new Set()).add(phongCach);
    }
  }
  return Object.entries(tapPhongCach)
    .filter(([, tap]) => tap.size > 1)
    .map(([ten, tap]) => ({ ten, cacPhongCach: [...tap] }));
}

// Hội tụ tỷ lệ nhân vật "trộn" — với 1 tên đối thủ cụ thể, tính tỷ lệ
// CỘNG DỒN từng phong cách đã dùng theo THỨ TỰ THỜI GIAN.
export function tinhHoiTuTronPhongCach(danhSachVanChoiAI, tenDoiThu) {
  const daSapXep = [...danhSachVanChoiAI].sort((a, b) => a.thoiGian - b.thoiGian);
  const demTichLuy = {};
  let tongSoVan = 0;
  const ketQua = [];

  for (const van of daSapXep) {
    const phongCach = van.cheDoThucTeDoiThu?.[tenDoiThu];
    if (!phongCach) continue;
    tongSoVan++;
    demTichLuy[phongCach] = (demTichLuy[phongCach] || 0) + 1;

    const tiLeHienTai = {};
    for (const [pc, soLuong] of Object.entries(demTichLuy)) {
      tiLeHienTai[pc] = soLuong / tongSoVan;
    }
    ketQua.push({ soVan: tongSoVan, tiLe: tiLeHienTai });
  }
  return ketQua;
}
