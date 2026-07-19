import { useState } from 'react'
import {
  nguoiChiaChoVan, tongDiemHopLe, tinhTongKetHiep,
  layVanCuaHiep, hiepDaXong, layHiepDangDoHoacNull,
} from './lichSuChoi.js'
import { useDuLieuNhom } from './lichSuNhom.js'

function dinhDangGioNgay(ts) {
  const d = new Date(ts);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} ${d.getDate()}/${d.getMonth() + 1}`;
}

function GhiDiem({ nhom }) {
  const { danhSachHiep, danhSachVan, dangTai, loi: loiTai, themHiep, themVan } = useDuLieuNhom(nhom?.id ?? null);

  const hiepDangDo = layHiepDangDoHoacNull(danhSachHiep, danhSachVan, 'thatNgoai');

  const [dangNhapTen, setDangNhapTen] = useState(false);
  const [tenNguoiChoi, setTenNguoiChoi] = useState(() => hiepDangDo ? [...hiepDangDo.nguoiChoi] : ['', '', '', '']);
  const [chuThich, setChuThich] = useState('');
  // Vị trí (trong tenNguoiChoi, KHÔNG phải trong nguoiChoi của hiệp) của
  // người CHIA ĐẦU TIÊN — chọn tự do qua dropdown, KHÔNG còn mặc định cố
  // định là người ngồi ở 6h nữa.
  const [nguoiChiaDauIdx, setNguoiChiaDauIdx] = useState(0);

  const [hiepDangGhi, setHiepDangGhi] = useState(null);
  const [diemNhap, setDiemNhap] = useState({});
  const [loi, setLoi] = useState('');
  const [dangLuu, setDangLuu] = useState(false);
  // Mốc thời gian THẬT của ván đang nhập — ghi lại đúng lúc số đầu tiên
  // được gõ vào (không phải lúc bấm "Lưu ván này", có thể trễ vài chục
  // giây do gõ 4 số) — đây mới là thời điểm ván đó THỰC SỰ vừa đánh xong.
  const [thoiDiemBatDauNhapVan, setThoiDiemBatDauNhapVan] = useState(null);

  function suaTen(idx, gtri) {
    setTenNguoiChoi(prev => prev.map((t, i) => i === idx ? gtri : t));
  }

  // 1 ô nhập tên tại đúng vị trí trên bàn (chỉ để HÌNH DUNG chỗ ngồi,
  // không còn ngầm định vị trí nào chia trước — ai chia đầu tiên chọn
  // riêng qua dropdown bên dưới). Các vị trí vẫn đánh số theo chiều kim
  // đồng hồ (1→2→3→4 ứng với 6h→9h→12h→3h) để khớp thứ tự xoay vòng chia
  // bài thực tế.
  function renderOTen(idx) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div className="ten-vi-tri">{`Vị trí ${idx + 1}`}</div>
        <input type="text" placeholder={`Người chơi ${idx + 1}`} value={tenNguoiChoi[idx]}
               onChange={e => suaTen(idx, e.target.value)}
               style={{ width: '92%', textAlign: 'center' }} />
      </div>
    );
  }

  function moDiemRong(danhSachTen) {
    const diemRong = {};
    danhSachTen.forEach(t => { diemRong[t] = ''; });
    setDiemNhap(diemRong);
    setThoiDiemBatDauNhapVan(null);
  }

  // Ghi lại mốc thời gian NGAY LẦN GÕ ĐẦU TIÊN cho ván đang nhập (dù gõ
  // vào ô của người nào) — các lần gõ sau đó không ghi đè lại nữa.
  function suaDiemNhap(ten, gtri) {
    setDiemNhap(prev => ({ ...prev, [ten]: gtri }));
    setThoiDiemBatDauNhapVan(prev => prev ?? Date.now());
  }

  async function batDauHiepMoi() {
    const tenSach = tenNguoiChoi.map(t => t.trim());
    if (tenSach.some(t => !t)) return;
    // Xoay vòng danh sách để bắt đầu ĐÚNG từ người được chọn chia đầu
    // tiên, nhưng vẫn giữ nguyên thứ tự xoay vòng theo chiều kim đồng hồ
    // giữa 4 vị trí (vd chọn Vị trí 3 chia trước → thứ tự chia thành
    // Vị trí 3 → 4 → 1 → 2, đúng chiều ngồi trên bàn).
    const thuTuXoayVong = [0, 1, 2, 3].map(i => tenSach[(nguoiChiaDauIdx + i) % 4]);
    setLoi(''); setDangLuu(true);
    try {
      const hiepMoi = await themHiep(thuTuXoayVong, chuThich.trim());
      setDangNhapTen(false);
      setHiepDangGhi(hiepMoi);
      moDiemRong(tenSach);
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangLuu(false);
    }
  }

  function tiepTucHiepDo() {
    setHiepDangGhi(hiepDangDo);
    moDiemRong(hiepDangDo.nguoiChoi);
  }

  async function luuVan() {
    const diemSo = {};
    for (const ten of hiepDangGhi.nguoiChoi) {
      const gtri = Number(diemNhap[ten]);
      if (diemNhap[ten] === '' || Number.isNaN(gtri)) return;
      diemSo[ten] = gtri;
    }
    if (!tongDiemHopLe(diemSo)) {
      alert('Tổng điểm phải bằng 0 — kiểm tra lại số vừa nhập.');
      return;
    }

    const soVanHienTai = layVanCuaHiep(hiepDangGhi.id, danhSachVan).length + 1;
    const { nguoiChia, lanChia } = nguoiChiaChoVan(hiepDangGhi.nguoiChoi, soVanHienTai);

    setLoi(''); setDangLuu(true);
    try {
      await themVan({
        hiepId: hiepDangGhi.id, soThuTuTrongHiep: soVanHienTai, lanChiaThu: lanChia,
        nguoiChia, diem: diemSo, thoiGian: thoiDiemBatDauNhapVan ?? Date.now(),
      });
      moDiemRong(hiepDangGhi.nguoiChoi);
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangLuu(false);
    }
  }

  async function hiepMoiTiepTheo() {
    setLoi(''); setDangLuu(true);
    try {
      const hiepMoi = await themHiep(hiepDangGhi.nguoiChoi, '');
      setHiepDangGhi(hiepMoi);
      moDiemRong(hiepMoi.nguoiChoi);
    } catch (e) {
      setLoi(e.message);
    } finally {
      setDangLuu(false);
    }
  }

  const chuaDuTen = tenNguoiChoi.some(t => !t.trim());
  const vanCuaHiepDangGhi = hiepDangGhi ? layVanCuaHiep(hiepDangGhi.id, danhSachVan) : [];
  const tongCongDon = tinhTongKetHiep(vanCuaHiepDangGhi);

  // Tô màu ĐỎ/XANH cho hàng đang nhập ngay trong lúc gõ: đỏ khi chưa đủ 4
  // số hoặc tổng chưa bằng 0, xanh lá ngay khi đủ 4 số VÀ tổng = 0.
  const cacGtriDangNhap = hiepDangGhi ? hiepDangGhi.nguoiChoi.map(ten => diemNhap[ten]) : [];
  const daNhapDuCa4 = cacGtriDangNhap.length > 0
    && cacGtriDangNhap.every(v => v !== '' && v !== undefined && !Number.isNaN(Number(v)));
  const tongDangNhap = cacGtriDangNhap.reduce((a, v) => a + (Number(v) || 0), 0);
  const hangDangNhapHopLe = daNhapDuCa4 && tongDangNhap === 0;

  // Bảng điểm DÙNG CHUNG cho hiệp đang chơi (kèm hàng đang nhập) và hiệp
  // vừa xong (chỉ xem lại, không có hàng nhập) — mỗi Hiệp 1 bảng riêng,
  // hết hiệp (đủ 12 ván) thì "Hiệp tiếp theo" sẽ tự tạo bảng MỚI hoàn
  // toàn (vanCuaHiepDangGhi reset về rỗng cho hiệp mới).
  function renderBangDiem(coHangNhap) {
    return (
      <div className="boc-bang-diem">
        <table className="bang-diem bang-diem-lichsu">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Ván</th>
              {hiepDangGhi.nguoiChoi.map(ten => <th key={ten}>{ten}</th>)}
            </tr>
          </thead>
          <tbody>
            {vanCuaHiepDangGhi.map((van, i) => (
              <tr key={van.id}>
                <td>{dinhDangGioNgay(van.thoiGian)}</td>
                <td>{i + 1}</td>
                {hiepDangGhi.nguoiChoi.map(ten => (
                  <td key={ten} className={van.diem[ten] >= 0 ? 'diem-duong' : 'diem-am'}>
                    {van.diem[ten] > 0 ? '+' : ''}{van.diem[ten]}
                  </td>
                ))}
              </tr>
            ))}
            {coHangNhap && (
              <tr className={hangDangNhapHopLe ? 'hang-dang-nhap-hop-le' : 'hang-dang-nhap-chua-hop-le'}>
                <td>{thoiDiemBatDauNhapVan ? dinhDangGioNgay(thoiDiemBatDauNhapVan) : '—'}</td>
                <td>{vanCuaHiepDangGhi.length + 1}</td>
                {hiepDangGhi.nguoiChoi.map(ten => (
                  <td key={ten}>
                    <input type="number" value={diemNhap[ten] ?? ''}
                           onChange={e => suaDiemNhap(ten, e.target.value)} />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="hang-tong-diem">
              <td colSpan={2}>Tổng</td>
              {hiepDangGhi.nguoiChoi.map(ten => {
                const d = tongCongDon[ten] || 0;
                return (
                  <td key={ten} className={d >= 0 ? 'diem-duong' : 'diem-am'}>
                    {d > 0 ? '+' : ''}{d}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // Gate ĐẶT SAU toàn bộ hook ở trên — bắt buộc theo Rules of Hooks.
  if (!nhom) {
    return (
      <div className="trang-ghi-diem">
        <h2>Ghi điểm</h2>
        <div className="khoi-luat"><p>Chọn một nhóm chơi trước khi ghi điểm.</p></div>
      </div>
    );
  }
  if (dangTai) {
    return <div className="trang-ghi-diem"><h2>Ghi điểm</h2><p>Đang tải...</p></div>;
  }
  if (loiTai) {
    return (
      <div className="trang-ghi-diem">
        <h2>Ghi điểm</h2>
        <p className="loi-dang-nhap">Lỗi kết nối: {loiTai} — thử lại sau.</p>
      </div>
    );
  }

  return (
    <div className="trang-ghi-diem">
      <h2>Ghi điểm</h2>
      {loi && <p className="loi-dang-nhap">{loi}</p>}

      {!hiepDangGhi && !dangNhapTen && (
        <div className="khoi-luat">
          {hiepDangDo && (
            <p>Đang có 1 hiệp chưa xong ({hiepDangDo.nguoiChoi.join(', ')}).</p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {hiepDangDo && (
              <button className="nut-choi" onClick={tiepTucHiepDo}>Tiếp hiệp cũ</button>
            )}
            <button className="nut-choi" onClick={() => setDangNhapTen(true)}>Bắt đầu hiệp mới</button>
          </div>
        </div>
      )}

      {dangNhapTen && (
        <div className="khoi-luat">
          <div className="khoi-luat-tieu-de">
            Tên 4 người chơi — xếp đúng vị trí trên bàn (chia bài theo chiều kim đồng hồ)
          </div>
          <div className="ban-choi ban-choi-tron">
            <div className="vi-tri-12h">{renderOTen(2)}</div>
            <div className="vi-tri-9h">{renderOTen(1)}</div>
            <div className="vi-tri-3h">{renderOTen(3)}</div>
            <div className="vi-tri-6h">{renderOTen(0)}</div>
          </div>
          <label style={{ display: 'block', marginTop: 10, marginBottom: 8 }}>
            Người chia đầu tiên
            <select value={nguoiChiaDauIdx} onChange={e => setNguoiChiaDauIdx(Number(e.target.value))}
                    style={{ display: 'block', width: '100%', marginTop: 4 }}>
              {tenNguoiChoi.map((ten, idx) => (
                <option key={idx} value={idx}>{ten.trim() || `Vị trí ${idx + 1}`}</option>
              ))}
            </select>
          </label>
          <input type="text" placeholder="Chú thích (không bắt buộc)..." value={chuThich}
                 onChange={e => setChuThich(e.target.value)}
                 style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          <button className="nut-choi" disabled={chuaDuTen || dangLuu} onClick={batDauHiepMoi}>
            {dangLuu ? 'Đang tạo...' : 'Bắt đầu'}
          </button>
        </div>
      )}

      {hiepDangGhi && !hiepDaXong(hiepDangGhi.id, danhSachVan) && (
        <div className="khoi-luat">
          <div className="khoi-luat-tieu-de">
            Hiệp {hiepDangGhi.soThuTu} — Ván {vanCuaHiepDangGhi.length + 1}, người chia:{' '}
            {nguoiChiaChoVan(hiepDangGhi.nguoiChoi, vanCuaHiepDangGhi.length + 1).nguoiChia}
          </div>
          {renderBangDiem(true)}
          <button className="nut-choi" disabled={dangLuu} onClick={luuVan}>
            {dangLuu ? 'Đang lưu...' : 'Lưu ván này'}
          </button>
        </div>
      )}

      {hiepDangGhi && hiepDaXong(hiepDangGhi.id, danhSachVan) && (
        <div className="khoi-luat">
          <div className="khoi-luat-tieu-de tieu-de-het-hiep">Tổng kết Hiệp {hiepDangGhi.soThuTu}</div>
          {renderBangDiem(false)}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="nut-choi" disabled={dangLuu} onClick={hiepMoiTiepTheo}>
              {dangLuu ? 'Đang tạo...' : 'Hiệp tiếp theo'}
            </button>
            <button className="nut-choi" onClick={() => setHiepDangGhi(null)}>Kết thúc</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GhiDiem;
