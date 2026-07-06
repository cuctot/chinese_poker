// ChonVan.jsx (V8) — Màn chọn lúc vào "Chơi với AI". Không còn khái niệm
// Phiên/chế độ (theo ván/theo hiệp) — mọi ván đều thuộc 1 Hiệp, nên chỉ
// còn đúng 2 lựa chọn: tiếp tục hiệp đang dở (nếu có), hoặc bắt đầu hiệp
// mới. Có preview bàn tròn để hình dung trước vị trí từng người (và điểm
// tích lũy của hiệp đang dở, nếu có) trước khi vào chơi.

function dinhDauDiem(d) {
  return d > 0 ? '+' : '';
}

function ChonVan({ hiepDoDang, onChonTiepHiep, onChonHiepMoi }) {
  function renderTenViTri(ten) {
    const diem = hiepDoDang?.tongKet?.[ten] ?? 0;
    return (
      <div className="ten-vi-tri">
        {ten}
        {hiepDoDang && (
          <div className="diem-vi-tri">
            H: <b className={diem >= 0 ? 'diem-duong' : 'diem-am'}>{dinhDauDiem(diem)}{diem}</b>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="trang-chon-van">
      <h2>Chơi với AI</h2>

      <div className="ban-choi ban-choi-preview">
        <div className="vi-tri-12h">{renderTenViTri('Đối thủ 2')}</div>
        <div className="vi-tri-9h">{renderTenViTri('Đối thủ 1')}</div>
        <div className="vi-tri-3h">{renderTenViTri('Đối thủ 3')}</div>
        <div className="vi-tri-6h">{renderTenViTri('Bạn')}</div>
      </div>

      {hiepDoDang && (
        <button className="nut-chon-van nut-chon-van-tiep" onClick={onChonTiepHiep} style={{ marginBottom: 8 }}>
          Tiếp hiệp cũ — Hiệp {hiepDoDang.soThuTu} (Ván {hiepDoDang.soVan + 1}/12)
        </button>
      )}

      <button className="nut-chon-van" onClick={onChonHiepMoi}>
        Bắt đầu hiệp mới
      </button>

      {hiepDoDang && (
        <p className="ghi-chu-canh-bao-van-moi">
          Bấm "Bắt đầu hiệp mới" sẽ bỏ dở Hiệp {hiepDoDang.soThuTu} (vẫn giữ trong Lịch sử) và bắt đầu hiệp mới từ đầu.
        </p>
      )}
    </div>
  );
}

export default ChonVan;
