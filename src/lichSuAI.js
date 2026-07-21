// lichSuAI.js (V12 Phase 6) — Hiệp/Ván "Chơi với AI" gắn theo CÁ NHÂN,
// đọc/ghi qua Supabase (bảng hiep_ai/van_ai) thay cho localStorage. Cùng
// mẫu với `lichSuNhom.js` (Ghi điểm) nhưng lọc theo `nguoi_dung_id` thay
// vì `nhom_id`, và KHÔNG cần đồng bộ Realtime (dữ liệu cá nhân, không ai
// khác cùng xem/ghi đồng thời). Các hàm THUẦN dùng chung với dữ liệu này
// (tinhTongKetHiep, layVanCuaHiep, layHiepDangDoHoacNull,
// layTenNguoiChoiGanNhat, nguoiChiaChoVan) vẫn ở `lichSuChoi.js`.
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient.js'

function mapHiepRow(row) {
  return {
    id: row.id,
    soThuTu: row.so_thu_tu,
    batDau: +new Date(row.bat_dau),
    nguon: 'choiAI',
    nguoiChoi: row.nguoi_choi,
    chuThich: row.chu_thich,
    ...(row.nhan_vat_doi_thu ? { nhanVatDoiThu: row.nhan_vat_doi_thu } : {}),
  };
}

function mapVanRow(row) {
  return {
    id: row.id,
    hiepId: row.hiep_id,
    soThuTuTrongHiep: row.so_thu_tu_trong_hiep,
    lanChiaThu: row.lan_chia_thu,
    nguoiChia: row.nguoi_chia,
    thoiGian: +new Date(row.thoi_gian),
    nguon: 'choiAI',
    diem: row.diem,
    ...(row.nguoi_choi_bai_that ? { nguoiChoiBaiThat: row.nguoi_choi_bai_that } : {}),
    ...(row.la_thang_trang !== null && row.la_thang_trang !== undefined
      ? { laThangTrang: row.la_thang_trang, loaiThangTrang: row.loai_thang_trang } : {}),
    ...(row.che_do_thuc_te_doi_thu ? { cheDoThucTeDoiThu: row.che_do_thuc_te_doi_thu } : {}),
    ...(row.chi_tiet_ca_van ? { chiTietCaVan: row.chi_tiet_ca_van } : {}),
  };
}

// `nguoiDungId` null/undefined => không tải gì (chưa đăng nhập xong).
export function useDuLieuAI(nguoiDungId) {
  const [danhSachHiep, setDanhSachHiep] = useState([]);
  const [danhSachVan, setDanhSachVan] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState(null);

  useEffect(() => {
    setDanhSachHiep([]);
    setDanhSachVan([]);
    setLoi(null);
    if (!nguoiDungId) { setDangTai(false); return; }
    setDangTai(true);

    let huy = false;
    Promise.all([
      supabase.from('hiep_ai').select('*').eq('nguoi_dung_id', nguoiDungId),
      supabase.from('van_ai').select('*').eq('nguoi_dung_id', nguoiDungId),
    ]).then(([hiepRes, vanRes]) => {
      if (huy) return;
      setDangTai(false);
      if (hiepRes.error) { setLoi(hiepRes.error.message); return; }
      if (vanRes.error) { setLoi(vanRes.error.message); return; }
      setDanhSachHiep(hiepRes.data.map(mapHiepRow));
      setDanhSachVan(vanRes.data.map(mapVanRow));
    });

    return () => { huy = true; };
  }, [nguoiDungId]);

  const themHiep = useCallback(async (nguoiChoi, nhanVatDoiThu) => {
    const soThuTu = danhSachHiep.length + 1;
    const { data, error } = await supabase.from('hiep_ai')
      .insert({ nguoi_dung_id: nguoiDungId, so_thu_tu: soThuTu, nguoi_choi: nguoiChoi, nhan_vat_doi_thu: nhanVatDoiThu ?? null })
      .select().single();
    if (error) throw new Error(error.message);
    const hiepMoi = mapHiepRow(data);
    setDanhSachHiep(prev => [...prev, hiepMoi]);
    return hiepMoi;
  }, [nguoiDungId, danhSachHiep]);

  const themVan = useCallback(async ({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang, cheDoThucTeDoiThu, chiTietCaVan }) => {
    const { data, error } = await supabase.from('van_ai')
      .insert({
        nguoi_dung_id: nguoiDungId, hiep_id: hiepId, so_thu_tu_trong_hiep: soThuTuTrongHiep,
        lan_chia_thu: lanChiaThu, nguoi_chia: nguoiChia, diem,
        nguoi_choi_bai_that: nguoiChoiBaiThat ?? null,
        la_thang_trang: laThangTrang ?? null, loai_thang_trang: loaiThangTrang ?? null,
        che_do_thuc_te_doi_thu: cheDoThucTeDoiThu ?? null,
        chi_tiet_ca_van: chiTietCaVan ?? null,
      })
      .select().single();
    if (error) throw new Error(error.message);
    const vanMoi = mapVanRow(data);
    setDanhSachVan(prev => [...prev, vanMoi]);
    return vanMoi;
  }, [nguoiDungId]);

  return { danhSachHiep, danhSachVan, dangTai, loi, themHiep, themVan };
}

// V14 Phase 2 — Đọc TOÀN BỘ Ván "Chơi với AI" của MỌI người chơi (không
// lọc theo nguoi_dung_id ở câu truy vấn), dùng riêng cho trang Phân tích
// của Admin. Phạm vi dữ liệu trả về do RLS quyết định (xem
// supabase/quan_tri_vien.sql): Admin thấy TẤT CẢ mọi người; nếu lỡ 1
// người KHÔNG phải admin gọi hàm này, RLS vẫn chỉ trả đúng ván của chính
// họ — không rò rỉ dữ liệu người khác dù bỏ lọc `nguoi_dung_id` ở đây.
export function useDuLieuAIToanBo() {
  const [danhSachVan, setDanhSachVan] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState(null);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    setLoi(null);
    supabase.from('van_ai').select('*').then(({ data, error }) => {
      if (huy) return;
      setDangTai(false);
      if (error) { setLoi(error.message); return; }
      setDanhSachVan(data.map(mapVanRow));
    });
    return () => { huy = true; };
  }, []);

  return { danhSachVan, dangTai, loi };
}
