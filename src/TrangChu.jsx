// TrangChu.jsx
// Trang chủ: biểu tượng + tên game + điều hướng. Không giữ state gì —
// chỉ nhận 1 hàm onDieuHuong(tenTrang) để báo lên App.jsx khi người chơi
// bấm 1 nút điều hướng.

function TrangChu({ onDieuHuong }) {
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
        <button className="nut-dieu-huong nut-sap-ra-mat" disabled>
          📊 Thống kê <span className="nhan-sap-ra-mat">Sắp ra mắt</span>
        </button>
        <button className="nut-dieu-huong" onClick={() => onDieuHuong('luatChoi')}>
          📖 Luật chơi
        </button>
      </div>
    </div>
  );
}

export default TrangChu;
