// ChonVan.jsx
// Màn hình chọn giữa "Chơi tiếp" ván đang lưu dở, hoặc bắt đầu "Ván mới".

function ChonVan({ coVanDaLuu, onChonTiep, onChonMoi }) {
  return (
    <div className="trang-chon-van">
      <h2>Chơi với AI</h2>

      {coVanDaLuu && (
        <button className="nut-chon-van nut-chon-van-tiep" onClick={onChonTiep}>
          ▶ Chơi tiếp ván đang dở
        </button>
      )}

      <button className="nut-chon-van" onClick={onChonMoi}>
        🆕 Bắt đầu ván mới
      </button>

      {coVanDaLuu && (
        <p className="ghi-chu-canh-bao-van-moi">
          Bắt đầu ván mới sẽ XÓA ván đang lưu, không thể khôi phục lại.
        </p>
      )}
    </div>
  );
}

export default ChonVan;
