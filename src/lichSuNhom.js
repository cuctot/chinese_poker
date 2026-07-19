// lichSuNhom.js (V12 Phase 5) — Hiệp/Ván ghi điểm gắn theo Nhóm chơi,
// đọc/ghi qua Supabase (bảng hiep_nhom/van_nhom) thay cho localStorage,
// đồng bộ Realtime giữa các thành viên cùng nhóm. Các hàm THUẦN dùng
// chung với dữ liệu này (tongDiemHopLe, tinhTongKetHiep, layVanCuaHiep,
// hiepDaXong, layHiepDangDoHoacNull, nguoiChiaChoVan) vẫn ở
// `lichSuChoi.js` — không đổi gì ở đó, chỉ cần map đúng shape.
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient.js'

function mapHiepRow(row) {
  return {
    id: row.id,
    soThuTu: row.so_thu_tu,
    batDau: +new Date(row.bat_dau),
    nguon: 'thatNgoai',
    nguoiChoi: row.nguoi_choi,
    chuThich: row.chu_thich,
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
    nguon: 'thatNgoai',
    diem: row.diem,
  };
}

// `nhomId` null/undefined => không tải gì (dùng khi chưa chọn nhóm).
export function useDuLieuNhom(nhomId) {
  const [danhSachHiep, setDanhSachHiep] = useState([]);
  const [danhSachVan, setDanhSachVan] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState(null);

  useEffect(() => {
    setDanhSachHiep([]);
    setDanhSachVan([]);
    setLoi(null);
    if (!nhomId) { setDangTai(false); return; }
    setDangTai(true);

    let huy = false;
    Promise.all([
      supabase.from('hiep_nhom').select('*').eq('nhom_id', nhomId),
      supabase.from('van_nhom').select('*').eq('nhom_id', nhomId),
    ]).then(([hiepRes, vanRes]) => {
      if (huy) return;
      setDangTai(false);
      if (hiepRes.error) { setLoi(hiepRes.error.message); return; }
      if (vanRes.error) { setLoi(vanRes.error.message); return; }
      setDanhSachHiep(hiepRes.data.map(mapHiepRow));
      setDanhSachVan(vanRes.data.map(mapVanRow));
    });

    // 1 kênh Realtime nghe INSERT trên cả 2 bảng, lọc đúng nhóm — thêm
    // vào state NẾU chưa có id đó (dedupe với dòng đã tự thêm ngay lúc
    // insert ở themHiep/themVan bên dưới, tránh hiện 2 lần). Tên kênh
    // kèm chuỗi ngẫu nhiên (KHÔNG chỉ nhomId) — nếu chỉ dùng nhomId,
    // mount/unmount/mount liên tiếp NHANH cho CÙNG 1 nhóm (React
    // StrictMode ở dev double-invoke effect; hoặc ngoài đời thật khi
    // chuyển qua lại Ghi điểm ↔ Lịch sử) có thể khiến lệnh "leave" của
    // kênh cũ và "join" của kênh mới trùng tên đua nhau trên server,
    // làm kênh mới lặng lẽ không nhận được sự kiện nào.
    const kenh = supabase.channel(`nhom-${nhomId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hiep_nhom', filter: `nhom_id=eq.${nhomId}` },
        payload => {
          const moi = mapHiepRow(payload.new);
          setDanhSachHiep(prev => prev.some(h => h.id === moi.id) ? prev : [...prev, moi]);
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'van_nhom', filter: `nhom_id=eq.${nhomId}` },
        payload => {
          const moi = mapVanRow(payload.new);
          setDanhSachVan(prev => prev.some(v => v.id === moi.id) ? prev : [...prev, moi]);
        })
      .subscribe();

    return () => { huy = true; supabase.removeChannel(kenh); };
  }, [nhomId]);

  const themHiep = useCallback(async (nguoiChoi, chuThich) => {
    const soThuTu = danhSachHiep.length + 1;
    const { data, error } = await supabase.from('hiep_nhom')
      .insert({ nhom_id: nhomId, so_thu_tu: soThuTu, nguoi_choi: nguoiChoi, chu_thich: chuThich })
      .select().single();
    if (error) throw new Error(error.message);
    const hiepMoi = mapHiepRow(data);
    setDanhSachHiep(prev => prev.some(h => h.id === hiepMoi.id) ? prev : [...prev, hiepMoi]);
    return hiepMoi;
  }, [nhomId, danhSachHiep]);

  const themVan = useCallback(async ({ hiepId, soThuTuTrongHiep, lanChiaThu, nguoiChia, diem, thoiGian }) => {
    const { data, error } = await supabase.from('van_nhom')
      .insert({
        nhom_id: nhomId, hiep_id: hiepId, so_thu_tu_trong_hiep: soThuTuTrongHiep,
        lan_chia_thu: lanChiaThu, nguoi_chia: nguoiChia, diem,
        thoi_gian: new Date(thoiGian ?? Date.now()).toISOString(),
      })
      .select().single();
    if (error) throw new Error(error.message);
    const vanMoi = mapVanRow(data);
    setDanhSachVan(prev => prev.some(v => v.id === vanMoi.id) ? prev : [...prev, vanMoi]);
    return vanMoi;
  }, [nhomId]);

  return { danhSachHiep, danhSachVan, dangTai, loi, themHiep, themVan };
}
