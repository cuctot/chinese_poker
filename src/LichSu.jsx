import { useState, Fragment } from 'react'
import {
  layVanCuaHiep, tinhTongKetHiep, hiepDaXong,
} from './lichSuChoi.js'
import { useDuLieuNhom } from './lichSuNhom.js'
import { useDuLieuAI } from './lichSuAI.js'
import HangBai from './HangBai.jsx'

function dinhDangThoiGianAnToan(timestamp) {
  if (!timestamp || Number.isNaN(timestamp)) return '—';
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '—';
  const gio = String(d.getHours()).padStart(2, '0');
  const phut = String(d.getMinutes()).padStart(2, '0');
  const ngay = String(d.getDate()).padStart(2, '0');
  const thang = String(d.getMonth() + 1).padStart(2, '0');
  return `${gio}:${phut} ${ngay}/${thang}`;
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

function LichSu({ nhom, nguoiDangNhap }) {
  // Tab "Chơi với AI" đọc qua Supabase (bảng hiep_ai/van_ai, cá nhân —
  // useDuLieuAI). Tab "Ghi điểm" (thatNgoai) đọc từ nhóm đã chọn qua
  // Supabase — cùng hook `useDuLieuNhom` dùng ở GhiDiem.jsx.
  const { danhSachHiep: danhSachHiepAI, danhSachVan: danhSachVanAI,
          dangTai: dangTaiAI, loi: loiAI } = useDuLieuAI(nguoiDangNhap?.id ?? null);
  const { danhSachHiep: danhSachHiepNhom, danhSachVan: danhSachVanNhom,
          dangTai: dangTaiNhom, loi: loiNhom } = useDuLieuNhom(nhom?.id ?? null);

  const [tabDangXem, setTabDangXem] = useState('thatNgoai');
  const [hiepMoRong, setHiepMoRong] = useState(null);
  const [vanAIDangXem, setVanAIDangXem] = useState(null);
  const [trangHienTai, setTrangHienTai] = useState(0);

  const danhSachHiep = tabDangXem === 'choiAI' ? danhSachHiepAI : danhSachHiepNhom;
  const danhSachVan = tabDangXem === 'choiAI' ? danhSachVanAI : danhSachVanNhom;
  const xemThatNgoaiMaChuaSanSang = tabDangXem === 'thatNgoai' && (!nhom || dangTaiNhom || loiNhom);
  const xemAIMaChuaSanSang = tabDangXem === 'choiAI' && (dangTaiAI || loiAI);

  const SO_HIEP_MOI_TRANG = 10;
  const hiepDungTab = danhSachHiep.filter(h => h.nguon === tabDangXem);
  const hiepDaSapXep = [...hiepDungTab].sort((a, b) => b.soThuTu - a.soThuTu); // mới nhất trước
  const tongSoTrang = Math.max(1, Math.ceil(hiepDaSapXep.length / SO_HIEP_MOI_TRANG));
  const hiepTrangHienTai = hiepDaSapXep.slice(
    trangHienTai * SO_HIEP_MOI_TRANG,
    (trangHienTai + 1) * SO_HIEP_MOI_TRANG
  );
  // nhomHiepThanhBang cần duyệt theo thứ tự THỜI GIAN TĂNG DẦN để gộp đúng
  // các Hiệp liên tiếp cùng roster — nên đảo lại cả thứ tự bảng LẪN thứ
  // tự Hiệp TRONG MỖI bảng ở đây, để hiển thị luôn hiệp MỚI NHẤT trên
  // cùng (khớp yêu cầu "ván/hiệp mới nhất lên trên cùng").
  const cacBang = nhomHiepThanhBang(hiepTrangHienTai)
    .reverse()
    .map(bang => ({ ...bang, hieps: [...bang.hieps].reverse() }));

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
                    <td>{dinhDangThoiGianAnToan(hiep.batDau)}</td>
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
    const vanMoiNhatTruoc = [...vanCuaHiep].reverse(); // ván mới nhất lên trên cùng
    return (
      <table className="bang-diem bang-diem-lichsu bang-diem-con">
        <caption style={{ textAlign: 'left', fontSize: 12, opacity: 0.8, padding: '4px 0' }}>
          Hiệp #{hiep.soThuTu}
        </caption>
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Ván</th>
            {hiep.nguoiChoi.map(ten => <th key={ten}>{ten}</th>)}
          </tr>
        </thead>
        <tbody>
          {vanMoiNhatTruoc.map(van => (
            <tr key={van.id}
                style={{ cursor: tabDangXem === 'choiAI' ? 'pointer' : 'default' }}
                onClick={() => tabDangXem === 'choiAI' && setVanAIDangXem(van)}>
              <td>{dinhDangThoiGianAnToan(van.thoiGian)}</td>
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
    // Dùng THẲNG đúng người + tên THẬT đã lưu trong nguoiChoiBaiThat (theo
    // đúng thứ tự lúc chia: 0 = Bạn, 1/2/3 = 3 đối thủ) — KHÔNG tra theo
    // tên cứng "Đối thủ 1/2/3" (tên đó có thể không khớp nếu hiệp dùng tên
    // nhân vật thật, vd "Safeway"), tránh lỗi tìm không thấy người chơi.
    function renderMotNguoi(p, kichThuoc) {
      const d = van.diem[p.ten] ?? 0;
      return (
        <div>
          <div className="ten-vi-tri">
            {p.ten}
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
          Ván {van.soThuTuTrongHiep} — {dinhDangThoiGianAnToan(van.thoiGian)}
          {van.laThangTrang && ` — Thắng trắng bằng ${van.loaiThangTrang}`}
        </div>
        <div className="ban-choi ban-choi-tron">
          <div className="vi-tri-12h">{renderMotNguoi(van.nguoiChoiBaiThat[2], 'nho')}</div>
          <div className="vi-tri-9h">{renderMotNguoi(van.nguoiChoiBaiThat[1], 'nho')}</div>
          <div className="vi-tri-3h">{renderMotNguoi(van.nguoiChoiBaiThat[3], 'nho')}</div>
          <div className="vi-tri-6h">{renderMotNguoi(van.nguoiChoiBaiThat[0], 'lon')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="trang-lich-su">
      <h2>Lịch sử</h2>

      <div className="chuyen-tab">
        <button className={tabDangXem === 'thatNgoai' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('thatNgoai'); setVanAIDangXem(null); setHiepMoRong(null); setTrangHienTai(0); }}>Ghi điểm</button>
        <button className={tabDangXem === 'choiAI' ? 'nut-tab nut-tab-dang-chon' : 'nut-tab'}
                onClick={() => { setTabDangXem('choiAI'); setVanAIDangXem(null); setHiepMoRong(null); setTrangHienTai(0); }}>Chơi với AI</button>
      </div>

      {tabDangXem === 'thatNgoai' && !nhom && (
        <div className="khoi-luat"><p>Chưa chọn nhóm chơi — vào Ghi điểm để chọn nhóm trước.</p></div>
      )}
      {tabDangXem === 'thatNgoai' && nhom && dangTaiNhom && <p>Đang tải...</p>}
      {tabDangXem === 'thatNgoai' && nhom && loiNhom && (
        <p className="loi-dang-nhap">Lỗi kết nối: {loiNhom} — thử lại sau.</p>
      )}
      {tabDangXem === 'choiAI' && dangTaiAI && <p>Đang tải...</p>}
      {tabDangXem === 'choiAI' && loiAI && (
        <p className="loi-dang-nhap">Lỗi kết nối: {loiAI} — thử lại sau.</p>
      )}

      {!vanAIDangXem && !xemThatNgoaiMaChuaSanSang && !xemAIMaChuaSanSang && cacBang.map(renderBangHiep)}

      {!vanAIDangXem && !xemThatNgoaiMaChuaSanSang && !xemAIMaChuaSanSang && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          <button className="nut-choi" disabled={trangHienTai === 0}
                  onClick={() => setTrangHienTai(t => t - 1)}>&lt;&lt;</button>
          <span style={{ alignSelf: 'center' }}>Trang {trangHienTai + 1}/{tongSoTrang}</span>
          <button className="nut-choi" disabled={trangHienTai >= tongSoTrang - 1}
                  onClick={() => setTrangHienTai(t => t + 1)}>&gt;&gt;</button>
        </div>
      )}

      {tabDangXem === 'choiAI' && vanAIDangXem && renderVanAI(vanAIDangXem)}
    </div>
  );
}

export default LichSu;
