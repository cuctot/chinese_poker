import { useState, Fragment } from 'react'
import {
  docDanhSach, KHOA_HIEP, KHOA_VAN,
  layVanCuaHiep, tinhTongKetHiep, hiepDaXong,
} from './lichSuChoi.js'
import HangBai from './HangBai.jsx'

function dinhDangGioNgay(ts) {
  const d = new Date(ts);
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  return `${gio}:${phut} ${d.getDate()}/${d.getMonth() + 1}`;
}

// Nhóm các Hiệp LIÊN TIẾP theo thời gian có CÙNG danh sách người chơi
// (cùng tên VÀ cùng thứ tự) vào chung 1 "bảng" — hễ đổi người/đổi thứ tự
// là bắt đầu bảng mới. `danhSachHiepNguon` cần đã lọc đúng nguồn (Bài
// thật/Chơi AI).
function nhomHiepThanhBang(danhSachHiepNguon) {
  const daSapXep = [...danhSachHiepNguon].sort((a, b) => a.soThuTu - b.soThuTu);
  const nhom = [];
  for (const hiep of daSapXep) {
    const nhomCuoi = nhom[nhom.length - 1];
    const cungRoster = nhomCuoi
      && nhomCuoi.nguoiChoi.length === hiep.nguoiChoi.length
      && nhomCuoi.nguoiChoi.every((t, i) => t === hiep.nguoiChoi[i]);
    if (cungRoster) nhomCuoi.hieps.push(hiep);
    else nhom.push({ nguoiChoi: hiep.nguoiChoi, hieps: [hiep] });
  }
  return nhom;
}

function LichSu() {
  const [danhSachHiep] = useState(() => docDanhSach(KHOA_HIEP));
  const [danhSachVan] = useState(() => docDanhSach(KHOA_VAN));

  const [tabDangXem, setTabDangXem] = useState('thatNgoai');
  const [hiepMoRong, setHiepMoRong] = useState(null);
  const [vanAIDangXem, setVanAIDangXem] = useState(null);

  const hiepDungTab = danhSachHiep.filter(h => h.nguon === tabDangXem);
  const cacBang = nhomHiepThanhBang(hiepDungTab).reverse(); // bảng GẦN ĐÂY NHẤT hiện trước

  function moRongVan(hiepId) {
    setHiepMoRong(hiepMoRong === hiepId ? null : hiepId);
  }

  // Bảng điểm DÙNG CHUNG: cấp Hiệp (mỗi dòng = 1 Hiệp, điểm = tổng cả
  // hiệp đó) và cấp Ván (mỗi dòng = 1 Ván, điểm = riêng ván đó) — cùng 3
  // cột đầu "Thời gian | Hiệp/Ván | ...tên", đúng yêu cầu "cùng định
  // dạng" giữa 2 cấp.
  function renderBangHiep(bang) {
    return (
      <div className="boc-bang-diem" key={bang.nguoiChoi.join('|') + bang.hieps[0].id}>
        <table className="bang-diem bang-diem-lichsu">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Hiệp</th>
              {bang.nguoiChoi.map(ten => <th key={ten}>{ten}</th>)}
            </tr>
          </thead>
          <tbody>
            {bang.hieps.map(hiep => {
              const vanCuaHiep = layVanCuaHiep(hiep.id, danhSachVan);
              const daXong = hiepDaXong(hiep.id, danhSachVan);
              const tongKet = tinhTongKetHiep(vanCuaHiep);
              const dangMoRong = hiepMoRong === hiep.id;
              return (
                <Fragment key={hiep.id}>
                  <tr style={{ cursor: 'pointer' }} title={hiep.chuThich || undefined}
                      onClick={() => moRongVan(hiep.id)}>
                    <td>{dinhDangGioNgay(hiep.batDau)}</td>
                    <td>#{hiep.soThuTu}{!daXong && ' (dở)'}</td>
                    {bang.nguoiChoi.map(ten => {
                      const d = tongKet[ten] || 0;
                      return <td key={ten} className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</td>;
                    })}
                  </tr>
                  {dangMoRong && (
                    <tr>
                      <td colSpan={2 + bang.nguoiChoi.length} style={{ padding: 0 }}>
                        {renderBangVan(hiep, vanCuaHiep)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderBangVan(hiep, vanCuaHiep) {
    return (
      <table className="bang-diem bang-diem-lichsu bang-diem-con">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Ván</th>
            {hiep.nguoiChoi.map(ten => <th key={ten}>{ten}</th>)}
          </tr>
        </thead>
        <tbody>
          {vanCuaHiep.map(van => (
            <tr key={van.id}
                style={{ cursor: tabDangXem === 'choiAI' ? 'pointer' : 'default' }}
                onClick={() => tabDangXem === 'choiAI' && setVanAIDangXem(van)}>
              <td>{dinhDangGioNgay(van.thoiGian)}</td>
              <td>{van.soThuTuTrongHiep}{van.laThangTrang && ' 🎉'}</td>
              {hiep.nguoiChoi.map(ten => {
                const d = van.diem[ten] ?? 0;
                return <td key={ten} className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Xem lại 1 ván Chơi AI ĐÚNG theo bố cục bàn tròn dùng lúc chơi thật
  // (Bạn ở 6h cỡ "lon", 3 đối thủ ở 9h/12h/3h cỡ "nho") — thay vì liệt kê
  // dọc như trước, để "đúng định dạng khi chơi".
  function renderVanAI(van) {
    const layNguoi = ten => van.nguoiChoiBaiThat.find(p => p.ten === ten);

    function renderMotNguoi(ten, kichThuoc) {
      const p = layNguoi(ten);
      const d = van.diem[ten] ?? 0;
      return (
        <div>
          <div className="ten-vi-tri">
            {ten}
            <div className="diem-vi-tri">
              <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b>
            </div>
          </div>
          {p.chiDau ? (
            <>
              <HangBai danhSachLa={p.chiDau} kichThuoc={kichThuoc} />
              <HangBai danhSachLa={p.chiGiua} kichThuoc={kichThuoc} />
              <HangBai danhSachLa={p.chiCuoi} kichThuoc={kichThuoc} />
            </>
          ) : (
            <HangBai danhSachLa={p.ca13La} kichThuoc={kichThuoc} />
          )}
        </div>
      );
    }

    return (
      <div className="khoi-luat">
        <button className="nut-choi" onClick={() => setVanAIDangXem(null)}>Quay lại</button>
        <div className="khoi-luat-tieu-de">
          Ván {van.soThuTuTrongHiep} — {new Date(van.thoiGian).toLocaleString('vi-VN')}
          {van.laThangTrang && ` — Ù bằng ${van.loaiThangTrang}`}
        </div>
        <div className="ban-choi ban-choi-tron">
          <div className="vi-tri-12h">{renderMotNguoi('Đối thủ 2', 'nho')}</div>
          <div className="vi-tri-9h">{renderMotNguoi('Đối thủ 1', 'nho')}</div>
          <div className="vi-tri-3h">{renderMotNguoi('Đối thủ 3', 'nho')}</div>
          <div className="vi-tri-6h">{renderMotNguoi('Bạn', 'lon')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="trang-lich-su">
      <h2>Lịch sử</h2>

      <div className="chuyen-tab">
        <button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('thatNgoai'); setVanAIDangXem(null); setHiepMoRong(null); }}>Bài thật</button>
        <button className={tabDangXem === 'choiAI' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('choiAI'); setVanAIDangXem(null); setHiepMoRong(null); }}>Chơi với AI</button>
      </div>

      {!vanAIDangXem && cacBang.map(renderBangHiep)}

      {tabDangXem === 'choiAI' && vanAIDangXem && renderVanAI(vanAIDangXem)}
    </div>
  );
}

export default LichSu;
