// TrangChu.jsx
// Trang chủ: biểu tượng + tên game + điều hướng. Không giữ state gì —
// chỉ nhận 1 hàm onDieuHuong(tenTrang) để báo lên App.jsx khi người chơi
// bấm 1 nút điều hướng.
//
// V14 Phase 1: nút "Thống kê" (trang Phân tích) chỉ dùng được cho ĐÚNG
// 1 tài khoản Admin (bảng quan_tri_vien, xem supabase/quan_tri_vien.sql)
// — lớp bảo mật THẬT nằm ở RLS, việc làm mờ nút ở đây chỉ là UX.
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'

function TrangChu({ onDieuHuong, nguoiDangNhap, onDangXuat }) {
  const [laAdmin, setLaAdmin] = useState(false);

  useEffect(() => {
    let huy = false;
    async function kiemTraAdmin() {
      if (!nguoiDangNhap) { setLaAdmin(false); return; }
      const { data } = await supabase.from('quan_tri_vien')
        .select('nguoi_dung_id').eq('nguoi_dung_id', nguoiDangNhap.id).maybeSingle();
      if (!huy) setLaAdmin(!!data);
    }
    kiemTraAdmin();
    return () => { huy = true; };
  }, [nguoiDangNhap]);

  return (
    <div className="trang-chu">
      <div className="logo-game">
        <svg viewBox="0 0 100 100" width="90" height="90">
          <rect x="15" y="30" width="35" height="50" rx="6" fill="#1a2010" stroke="#f0c040" strokeWidth="3" transform="rotate(-8 32 55)" />
          <rect x="35" y="25" width="35" height="50" rx="6" fill="#232b16" stroke="#f0c040" strokeWidth="3" />
          <rect x="55" y="30" width="35" height="50" rx="6" fill="#1a2010" stroke="#f0c040" strokeWidth="3" transform="rotate(8 68 55)" />
          <circle cx="52" cy="50" r="6" fill="#f0c040" />
        </svg>
      </div>
      <h1 className="ten-game">Mậu Binh</h1>
      <div className="phien-ban">Phiên bản V0.14</div>
      {nguoiDangNhap && (
        <div className="thong-tin-tai-khoan">
          <span>{nguoiDangNhap.email}</span>
          <button className="nut-dang-xuat" onClick={onDangXuat}>Đăng xuất</button>
        </div>
      )}

      <div className="danh-sach-dieu-huong">
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('choiAI')}>
          🎮 Chơi với AI
        </button>
        <button className="nut-dieu-huong nut-sap-ra-mat" disabled>
          👥 Chơi với bạn bè <span className="nhan-sap-ra-mat">Sắp ra mắt</span>
        </button>
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('ghiDiem')}>
          📝 Ghi điểm
        </button>
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('lichSu')}>
          🕘 Lịch sử
        </button>
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('luatChoi')}>
          📖 Luật chơi
        </button>
        <button
          className={laAdmin ? 'nut-dieu-huong' : 'nut-dieu-huong nut-sap-ra-mat'}
          disabled={!laAdmin}
          onClick={() => laAdmin && onDieuHuong('phanTich')}
        >
          📊 Thống kê {!laAdmin && <span className="nhan-sap-ra-mat">Chỉ dành cho Admin</span>}
        </button>
      </div>
    </div>
  );
}

export default TrangChu;
