// ChonVan.jsx (V9) — Màn chọn lúc vào "Chơi với AI". Không còn khái niệm
// Phiên/chế độ (theo ván/theo hiệp) — mọi ván đều thuộc 1 Hiệp, nên chỉ
// còn đúng 2 lựa chọn: tiếp tục hiệp đang dở (nếu có), hoặc bắt đầu hiệp
// mới. Có preview bàn tròn để hình dung trước vị trí từng người (và điểm
// tích lũy của hiệp đang dở, nếu có) trước khi vào chơi. Khi bắt đầu hiệp
// MỚI, cho chọn 1 trong 5 nhân vật AI (mỗi nhân vật 1 phong cách xếp bài)
// cho từng đối thủ — hiệp đang dở đã cố định nhân vật từ lúc tạo, không
// đổi được giữa chừng, nên chỉ hiện lựa chọn khi KHÔNG có hiệp dở.
import { useState } from 'react'
import { DANH_SACH_NHAN_VAT_MAC_DINH } from './nhanVatAI.js'

function dinhDauDiem(d) {
  return d > 0 ? '+' : '';
}

function ChonVan({ hiepDoDang, onChonTiepHiep, onChonHiepMoi }) {
  const [nhanVatDoiThu, setNhanVatDoiThu] = useState(['safeway', 'newbalance', 'madmax']);

  function suaNhanVatDoiThu(idx, id) {
    setNhanVatDoiThu(prev => prev.map((n, i) => i === idx ? id : n));
  }

  function renderTenViTri(ten, idxNhanVat = null) {
    const diem = hiepDoDang?.tongKet?.[ten] ?? 0;
    return (
      <div className="ten-vi-tri">
        {ten}
        {hiepDoDang && (
          <div className="diem-vi-tri">
            H: <b className={diem >= 0 ? 'diem-duong' : 'diem-am'}>{dinhDauDiem(diem)}{diem}</b>
          </div>
        )}
        {!hiepDoDang && idxNhanVat !== null && (
          <select
            className="chon-nhan-vat-ai"
            value={nhanVatDoiThu[idxNhanVat]}
            onChange={e => suaNhanVatDoiThu(idxNhanVat, e.target.value)}
          >
            {DANH_SACH_NHAN_VAT_MAC_DINH.map(n => (
              <option key={n.id} value={n.id}>{n.ten}</option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="trang-chon-van">
      <h2>Chơi với AI</h2>

      <div className="ban-choi ban-choi-preview">
        <div className="vi-tri-12h">{renderTenViTri('Đối thủ 2', 1)}</div>
        <div className="vi-tri-9h">{renderTenViTri('Đối thủ 1', 0)}</div>
        <div className="vi-tri-3h">{renderTenViTri('Đối thủ 3', 2)}</div>
        <div className="vi-tri-6h">{renderTenViTri('Bạn')}</div>
      </div>

      {hiepDoDang && (
        <button className="nut-chon-van nut-chon-van-tiep" onClick={onChonTiepHiep} style={{ marginBottom: 8 }}>
          Tiếp hiệp cũ — Hiệp {hiepDoDang.soThuTu} (Ván {hiepDoDang.soVan + 1}/12)
        </button>
      )}

      <button className="nut-chon-van" onClick={() => onChonHiepMoi(nhanVatDoiThu)}>
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
