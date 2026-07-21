// ChonVan.jsx (V9) — Màn chọn lúc vào "Chơi với AI". Không còn khái niệm
// Phiên/chế độ (theo ván/theo hiệp) — mọi ván đều thuộc 1 Hiệp, nên chỉ
// còn đúng 2 lựa chọn: tiếp tục hiệp đang dở (nếu có), hoặc bắt đầu hiệp
// mới. Có preview bàn tròn để hình dung trước vị trí từng người (và điểm
// tích lũy của hiệp đang dở, nếu có) trước khi vào chơi. Chọn nhân vật AI
// (1 trong 5 phong cách xếp bài) cho từng đối thủ LUÔN hiển thị — KHÔNG
// phụ thuộc có hiệp dở hay không, vì lựa chọn này chỉ áp dụng cho hiệp
// SẮP được tạo lúc bấm "Bắt đầu hiệp mới" (hiệp dở, nếu có, vẫn giữ
// nguyên nhân vật đã cố định từ lúc nó được tạo — không đổi được).
//
// `nguoiChoi` của 1 hiệp Chơi-AI giờ dùng THẲNG tên nhân vật (vd "Mad
// Max") làm định danh — không còn "Đối thủ 1/2/3" — nên preview đọc
// thẳng `hiepDoDang.nguoiChoi`, không cần dịch tên riêng. Bắt buộc 3
// nhân vật KHÁC NHAU (mỗi dropdown loại bỏ nhân vật đã chọn ở 2 dropdown
// kia) để tránh 2 đối thủ trùng tên bị gộp nhầm điểm.
//
// Tên CỦA CHÍNH người chơi (phần tử 0 của `nguoiChoi`) cũng tự chọn được
// ở đây — đặt Ở ĐÚNG VỊ TRÍ 6H trong bàn tròn chọn nhân vật (cùng hàng
// với 12h/9h/3h của 3 đối thủ), ô nhập điền sẵn `tenNguoiChoiMacDinh`
// (App.jsx tính sẵn: tên dùng ở hiệp GẦN NHẤT, hoặc "Bạn" nếu chưa từng
// chơi). Giống nhân vật đối thủ, tên này chỉ áp dụng cho hiệp SẮP tạo —
// hiệp dở dang (nếu tiếp tục) vẫn giữ nguyên tên đã cố định từ lúc tạo.
import { useState } from 'react'
import { DANH_SACH_NHAN_VAT_MAC_DINH } from './nhanVatAI.js'

function dinhDauDiem(d) {
  return d > 0 ? '+' : '';
}

const TEN_MAC_DINH = ['Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'];

function ChonVan({ hiepDoDang, tenNguoiChoiMacDinh, onChonTiepHiep, onChonHiepMoi, dangXuLy }) {
  const [nhanVatDoiThu, setNhanVatDoiThu] = useState(['safeway', 'newbalance', 'madmax']);
  const [tenNguoiChoi, setTenNguoiChoi] = useState(tenNguoiChoiMacDinh ?? 'Bạn');
  const tenDoiThuDoDang = hiepDoDang?.nguoiChoi?.slice(1) ?? TEN_MAC_DINH;
  const tenBanDoDang = hiepDoDang?.nguoiChoi?.[0] ?? 'Bạn';

  function suaNhanVatDoiThu(idx, id) {
    setNhanVatDoiThu(prev => prev.map((n, i) => i === idx ? id : n));
  }

  function batDauHiepMoi() {
    onChonHiepMoi(nhanVatDoiThu, tenNguoiChoi);
  }

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

  function renderNhapTenNguoiChoi() {
    return (
      <div className="ten-vi-tri">
        <input
          type="text"
          className="input-ten-nguoi-choi"
          value={tenNguoiChoi}
          onChange={e => setTenNguoiChoi(e.target.value)}
          maxLength={20}
          placeholder="Bạn"
        />
      </div>
    );
  }

  function renderChonNhanVat(idx) {
    const daChonONoiKhac = new Set(nhanVatDoiThu.filter((_, i) => i !== idx));
    return (
      <div className="ten-vi-tri">
        <select
          className="chon-nhan-vat-ai"
          value={nhanVatDoiThu[idx]}
          onChange={e => suaNhanVatDoiThu(idx, e.target.value)}
        >
          {DANH_SACH_NHAN_VAT_MAC_DINH
            .filter(n => n.id === nhanVatDoiThu[idx] || !daChonONoiKhac.has(n.id))
            .map(n => <option key={n.id} value={n.id}>{n.ten}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="trang-chon-van">
      <h2>Chơi với AI</h2>

      {hiepDoDang && (
        <div className="ban-choi ban-choi-preview">
          <div className="vi-tri-12h">{renderTenViTri(tenDoiThuDoDang[1])}</div>
          <div className="vi-tri-9h">{renderTenViTri(tenDoiThuDoDang[0])}</div>
          <div className="vi-tri-3h">{renderTenViTri(tenDoiThuDoDang[2])}</div>
          <div className="vi-tri-6h">{renderTenViTri(tenBanDoDang)}</div>
        </div>
      )}

      {hiepDoDang && (
        <button className="nut-chon-van nut-chon-van-tiep" onClick={onChonTiepHiep} disabled={dangXuLy} style={{ marginBottom: 8 }}>
          Tiếp hiệp cũ — Hiệp {hiepDoDang.soThuTu} (Ván {hiepDoDang.soVan + 1}/12)
        </button>
      )}

      <p className="khoi-luat-tieu-de" style={{ marginBottom: 4 }}>
        Chọn tên bạn & nhân vật đối thủ cho hiệp MỚI:
      </p>
      <div className="ban-choi ban-choi-preview">
        <div className="vi-tri-12h">{renderChonNhanVat(1)}</div>
        <div className="vi-tri-9h">{renderChonNhanVat(0)}</div>
        <div className="vi-tri-3h">{renderChonNhanVat(2)}</div>
        <div className="vi-tri-6h">{renderNhapTenNguoiChoi()}</div>
      </div>

      <button className="nut-chon-van" onClick={batDauHiepMoi} disabled={dangXuLy}>
        {dangXuLy ? 'Đang tạo...' : 'Bắt đầu hiệp mới'}
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
