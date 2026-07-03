import { useState, useRef, useEffect, useMemo } from 'react'
import './App.css'
import { chiaBai, xepBaiHopLe, tinhDiem, tinhDiemThangTrangAI, tinhDiemBaoUDung, tinhDiemBaoUSai, sapXepDeHienThi } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import { RULESET_PRESETS, layRulesetTuPreset, isValidRuleset } from './ruleset.js'
import Card from './Card.jsx'
import LuatChoi from './LuatChoi.jsx'
import TrangChu from './TrangChu.jsx'
import ChonVan from './ChonVan.jsx'

// 13 ô cố định: index 0-2 = Chi Đầu, 3-7 = Chi Giữa, 8-12 = Chi Cuối
const BAT_DAU = { dau: 0, giua: 3, cuoi: 8 };
const KHOA_LUU_RULESET = 'mauBinhLuatChoi';
const KHOA_LUU_PRESET_RIENG = 'mauBinhLuatTuyChinh';
const TEN_NGUOI_CHOI = ['Bạn', 'Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'];
const TEN_THANG_TRANG_HIEN_THI = {
  rongCuon: 'Rồng cuốn', sanhRong: 'Sảnh rồng', namDoiMotSam: 'Năm đôi 1 sám',
  lucPheBon: 'Lục phé bôn', namDoiThong: 'Năm đôi thông', baThung: 'Ba thùng', baSanh: 'Ba sảnh',
};

function docTrangThaiLuat() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_RULESET);
    if (!raw) return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
    const obj = JSON.parse(raw);
    if (obj && obj.presetId && isValidRuleset(obj.ruleset)) return obj;
    if (isValidRuleset(obj)) return { presetId: 'chuan', ruleset: obj, daTuyChinh: true };
    return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
  } catch {
    return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
  }
}

function docPresetRieng() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_PRESET_RIENG);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? arr.filter(p => p && p.id && p.ten && isValidRuleset(p.ruleset))
      : [];
  } catch {
    return [];
  }
}

function timPresetTrongDanhSach(id, danhSach) {
  return danhSach.find(p => p.id === id)
    || danhSach.find(p => p.id === 'chuan')
    || danhSach[0];
}

const KHOA_LUU_VAN_DANG_CHOI = 'mauBinhVanDangChoi';

function docVanDangChoi() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_VAN_DANG_CHOI);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Chỉ coi là "ván đang dở" (chơi tiếp được) khi CHƯA xác nhận bài và
    // KHÔNG phải thắng trắng — 1 ván đã kết thúc thì không có gì để tiếp
    // tục nữa. Phòng trường hợp dữ liệu cũ (lưu trước khi có luật này) lỡ
    // ghi lại 1 ván đã xong, dọn luôn cho sạch.
    if (!obj || obj.daXacNhan || obj.ketQuaThangTrang) {
      localStorage.removeItem(KHOA_LUU_VAN_DANG_CHOI);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function luuVanDangChoi(trangThai) {
  localStorage.setItem(KHOA_LUU_VAN_DANG_CHOI, JSON.stringify(trangThai));
}

function xoaVanDangChoi() {
  localStorage.removeItem(KHOA_LUU_VAN_DANG_CHOI);
}

function App() {
  const [vanDaLuu] = useState(() => docVanDangChoi()); // đọc đúng 1 lần lúc mở app

  const [tatCaBai, setTatCaBai] = useState(() => vanDaLuu ? vanDaLuu.tatCaBai : chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  // 1 mảng DUY NHẤT, 13 phần tử. Vị trí trong mảng CHÍNH LÀ vị trí ô của
  // lá đó trong 3 chi — không còn khái niệm "bài trên tay" tách riêng.
  // Giá trị khởi tạo giữ nguyên thứ tự ngẫu nhiên do chiaBai() tạo ra.
  const [oCacChi, setOCacChi] = useState(() => vanDaLuu ? vanDaLuu.oCacChi : [...boBaiCuaToi]);

  const [dragging, setDragging] = useState(null); // { tuIndex, laBai, x, y }
  const refsO = useRef([]); // 13 ref, mỗi ref ứng với đúng 1 ô (theo index 0-12)

  const [daXacNhan, setDaXacNhan] = useState(() => vanDaLuu ? vanDaLuu.daXacNhan : false);
  const [ketQuaDiem, setKetQuaDiem] = useState(() => vanDaLuu ? vanDaLuu.ketQuaDiem : null);
  const [hienGiaiTrinh, setHienGiaiTrinh] = useState(false);
  const [dangXacNhanBaoU, setDangXacNhanBaoU] = useState(false);
  const [trang, setTrang] = useState('trangChu'); // 'trangChu' | 'choiAI' | 'luatChoi'
  const [daChonVan, setDaChonVan] = useState(false);
  // Khác với vanDaLuu (chỉ đọc 1 lần lúc mount, dùng để khởi tạo state ván
  // chơi) — coVanDaLuu phải LUÔN phản ánh đúng hiện trạng localStorage
  // ngay trong phiên hiện tại, vì "Dừng chơi" và "Bắt đầu ván mới" đều
  // không tải lại trang (SPA), nên cần cập nhật state này thủ công mỗi khi
  // lưu/xóa ván (xem dungChoi/chonVanMoi).
  const [coVanDaLuu, setCoVanDaLuu] = useState(() => vanDaLuu !== null);
  const [trangThaiLuat, setTrangThaiLuat] = useState(() => docTrangThaiLuat());
  const { presetId, ruleset, daTuyChinh } = trangThaiLuat;
  const boBaiDoiThu = useMemo(() => [tatCaBai[1], tatCaBai[2], tatCaBai[3]], [tatCaBai]);
  const [baiDoiThu, setBaiDoiThu] = useState(() => vanDaLuu ? vanDaLuu.baiDoiThu : [
    aiXepBai(boBaiDoiThu[0], ruleset),
    aiXepBai(boBaiDoiThu[1], ruleset),
    aiXepBai(boBaiDoiThu[2], ruleset),
  ]);
  const [presetRieng, setPresetRieng] = useState(() => docPresetRieng());
  const tatCaPreset = [...RULESET_PRESETS, ...presetRieng];

  useEffect(() => {
    localStorage.setItem(KHOA_LUU_RULESET, JSON.stringify(trangThaiLuat));
  }, [trangThaiLuat]);

  useEffect(() => {
    localStorage.setItem(KHOA_LUU_PRESET_RIENG, JSON.stringify(presetRieng));
  }, [presetRieng]);

  useEffect(() => {
    setBaiDoiThu([
      aiXepBai(boBaiDoiThu[0], ruleset),
      aiXepBai(boBaiDoiThu[1], ruleset),
      aiXepBai(boBaiDoiThu[2], ruleset),
    ]);
  }, [ruleset, boBaiDoiThu]);

  const ketQuaThangTrang = useMemo(() => {
    const nguoiChoi = [
      { ten: 'Bạn', ca13La: boBaiCuaToi },
      { ten: 'Đối thủ 1', ca13La: boBaiDoiThu[0] },
      { ten: 'Đối thủ 2', ca13La: boBaiDoiThu[1] },
      { ten: 'Đối thủ 3', ca13La: boBaiDoiThu[2] },
    ];
    return tinhDiemThangTrangAI(nguoiChoi, ruleset);
  }, [boBaiCuaToi, boBaiDoiThu, ruleset]);

  const ketQuaHienTai = ketQuaThangTrang || ketQuaDiem;

  function dieuHuong(trangMoi) {
    setTrang(trangMoi);
  }

  function dungChoi() {
    // "Ván đang dở" CHỈ tồn tại khi CHƯA xác nhận bài (kể cả thắng trắng
    // cũng coi là đã kết thúc ngay từ đầu, không có gì để "chơi tiếp"). Nếu
    // ván đã kết thúc mà bấm Dừng chơi, không lưu lại gì để "Chơi tiếp ván
    // đang dở" không thể vô tình mở lại 1 ván đã xong.
    if (vanDaKetThuc) {
      xoaVanDangChoi();
      setCoVanDaLuu(false);
    } else {
      luuVanDangChoi({
        tatCaBai, oCacChi, baiDoiThu, ketQuaThangTrang, daXacNhan, ketQuaDiem,
      });
      setCoVanDaLuu(true);
    }
    setTrang('trangChu');
    setDaChonVan(false);
  }

  function chonChoiTiep() {
    // vanDaLuu đã có sẵn từ lúc mount app (Phase 2), toàn bộ state ván chơi
    // đã khởi tạo đúng theo nó rồi — chỉ cần "mở khóa" màn chơi ra xem.
    setDaChonVan(true);
  }

  function chonVanMoi() {
    xoaVanDangChoi();
    // Chia bài mới và ghi đè trực tiếp lên toàn bộ state ván chơi qua các
    // hàm setState — KHÔNG dùng window.location.reload(), vì reload cả
    // trang sẽ làm mất luôn state `trang`/`daChonVan`, khiến app bật về
    // lại đúng trang chủ thay vì vào thẳng ván mới như mong muốn.
    const baiMoi = chiaBai();
    setTatCaBai(baiMoi);
    setOCacChi([...baiMoi[0]]);
    setBaiDoiThu([
      aiXepBai(baiMoi[1], ruleset),
      aiXepBai(baiMoi[2], ruleset),
      aiXepBai(baiMoi[3], ruleset),
    ]);
    setDaXacNhan(false);
    setKetQuaDiem(null);
    setCoVanDaLuu(false);
    setDaChonVan(true);
  }

  function chonPreset(id) {
    const p = timPresetTrongDanhSach(id, tatCaPreset);
    setTrangThaiLuat({ presetId: p.id, ruleset: JSON.parse(JSON.stringify(p.ruleset)), daTuyChinh: false });
  }

  function suaRulesetThuCong(rulesetMoi) {
    setTrangThaiLuat(prev => ({ ...prev, ruleset: rulesetMoi, daTuyChinh: true }));
  }

  function resetVeGocPreset() {
    const p = timPresetTrongDanhSach(trangThaiLuat.presetId, tatCaPreset);
    setTrangThaiLuat(prev => ({ ...prev, ruleset: JSON.parse(JSON.stringify(p.ruleset)), daTuyChinh: false }));
  }

  function luuThanhPresetRieng(ten) {
    const tenSach = ten.trim();
    if (!tenSach) return;
    const idMoi = 'tuy_' + Date.now();
    const presetMoi = { id: idMoi, ten: tenSach, rieng: true, ruleset: JSON.parse(JSON.stringify(ruleset)) };
    setPresetRieng(prev => [...prev, presetMoi]);
    setTrangThaiLuat({ presetId: idMoi, ruleset: presetMoi.ruleset, daTuyChinh: false });
  }

  function xoaPresetRieng(id) {
    setPresetRieng(prev => prev.filter(p => p.id !== id));
    if (trangThaiLuat.presetId === id) chonPreset('chuan');
  }

  // Dữ liệu GỐC theo đúng vị trí ô (dùng để kiểm tra hợp lệ, tính điểm,
  // và xác định chính xác index khi kéo-thả)
  const chiDauGoc = oCacChi.slice(0, 3);
  const chiGiuaGoc = oCacChi.slice(3, 8);
  const chiCuoiGoc = oCacChi.slice(8, 13);
  const hopLe = xepBaiHopLe(chiDauGoc, chiGiuaGoc, chiCuoiGoc, ruleset);
  const vanDaKetThuc = !!(ketQuaThangTrang || (daXacNhan && ketQuaDiem));

  function onPointerDownLa(e, tuIndex) {
    e.target.setPointerCapture(e.pointerId);
    setDragging({ tuIndex, laBai: oCacChi[tuIndex], x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e) {
    if (!dragging) return;
    setDragging(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }

  function isInside(rect, x, y) {
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    const x = e.clientX, y = e.clientY;

    // Tìm xem đang thả vào đúng Ô nào trong 13 ô, bằng cách so tọa độ thả
    // với vị trí thật của từng ô trên màn hình
    let denIndex = -1;
    for (let i = 0; i < 13; i++) {
      const rect = refsO.current[i]?.getBoundingClientRect();
      if (isInside(rect, x, y)) { denIndex = i; break; }
    }

    if (denIndex !== -1 && denIndex !== dragging.tuIndex) {
      // HOÁN ĐỔI: lá ở ô đích và lá đang kéo đổi chỗ cho nhau — đây là
      // thao tác DUY NHẤT của trò chơi, không có khái niệm "thêm vào" hay
      // "ô trống" vì luôn có sẵn đúng 13/13 lá ngay từ đầu.
      setOCacChi(prev => {
        const moi = [...prev];
        [moi[dragging.tuIndex], moi[denIndex]] = [moi[denIndex], moi[dragging.tuIndex]];
        return moi;
      });
    }
    setDragging(null);
  }

  function xacNhanBai() {
    if (ketQuaThangTrang) return;
    const nguoiChoi = [
      { ten: 'Bạn', chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
      { ten: 'Đối thủ 1', ...baiDoiThu[0] },
      { ten: 'Đối thủ 2', ...baiDoiThu[1] },
      { ten: 'Đối thủ 3', ...baiDoiThu[2] },
    ];
    setKetQuaDiem(tinhDiem(nguoiChoi, ruleset));
    setDaXacNhan(true);
  }

  function moHopThoaiBaoU() {
    setDangXacNhanBaoU(true);
  }

  function huyBaoU() {
    setDangXacNhanBaoU(false);
  }

  function xacNhanBaoU() {
    setDangXacNhanBaoU(false);
    const nguoiChoiThangTrang = [
      { ten: 'Bạn', ca13La: chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc) },
      { ten: 'Đối thủ 1', ...baiDoiThu[0] },
      { ten: 'Đối thủ 2', ...baiDoiThu[1] },
      { ten: 'Đối thủ 3', ...baiDoiThu[2] },
    ];
    const ketQuaDung = tinhDiemBaoUDung(nguoiChoiThangTrang, ruleset);
    setKetQuaDiem(ketQuaDung || tinhDiemBaoUSai(nguoiChoiThangTrang, ruleset));
    setDaXacNhan(true);
  }

  // Vẽ 1 vùng TRONG LÚC ĐANG XẾP (cho phép kéo-thả): hiển thị ĐÚNG theo
  // vị trí ô gốc trong oCacChi, KHÔNG sort — để mỗi lá luôn gắn đúng với
  // index thật của nó, đảm bảo kéo-thả luôn chính xác tuyệt đối.
  function renderVungDangXep(nhan, danhSachGoc, chiSoBatDau) {
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {danhSachGoc.map((l, i) => {
            const indexToanCuc = chiSoBatDau + i;
            return (
              <div
                key={indexToanCuc}
                ref={el => { refsO.current[indexToanCuc] = el; }}
                style={{ opacity: dragging?.tuIndex === indexToanCuc ? 0.25 : 1 }}
              >
                <Card laBai={l} onPointerDown={(e) => onPointerDownLa(e, indexToanCuc)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vẽ 1 vùng SAU KHI ĐÃ XÁC NHẬN (chỉ xem, không kéo được nữa): tự sắp
  // xếp lại theo thứ tự cao-thấp cho đẹp mắt. Vì không còn tương tác kéo,
  // không cần gắn index gốc ở đây — tách hẳn thành hàm riêng để tránh
  // nhầm lẫn với renderVungDangXep ở trên (2 trạng thái khác nhau hoàn
  // toàn, không nên dùng chung 1 hàm).
  function renderVungChiXem(nhan, danhSachGoc) {
    const daSort = sapXepDeHienThi(danhSachGoc);
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {daSort.map(l => (
            <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  function renderRaw13(ten, danhSachLa) {
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{ten}</div>
        <div className="vung-noi-dung">
          {sapXepDeHienThi(danhSachLa).map(l => (
            <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  // Hiện bài 1 đối thủ AI theo 3 hàng riêng (Đầu/Giữa/Cuối), đã sắp xếp,
  // không cho kéo (giữ nguyên từ bản vá trước)
  function renderBaiDoiThu(doiThu, idx) {
    return (
      <div key={idx} className="khoi-doi-thu">
        <div className="ten-doi-thu">Đối thủ {idx + 1}</div>
        {[
          { nhan: 'Đầu', ds: sapXepDeHienThi(doiThu.chiDau) },
          { nhan: 'Giữa', ds: sapXepDeHienThi(doiThu.chiGiua) },
          { nhan: 'Cuối', ds: sapXepDeHienThi(doiThu.chiCuoi) },
        ].map(({ nhan, ds }) => (
          <div key={nhan} className="vung-chi vung-chi-doi-thu">
            <div className="vung-tieu-de">{nhan}</div>
            <div className="vung-noi-dung">
              {ds.map(l => (
                <Card
                  key={`${l.rank}-${l.suit}`}
                  laBai={l}
                  onPointerDown={() => {}}
                  faceDown={!daXacNhan}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="trang" style={{ touchAction: 'none' }}
         onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

      {trang === 'trangChu' && (
        <TrangChu onDieuHuong={dieuHuong} />
      )}

      {trang === 'luatChoi' && (
        <>
          <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
            ← Trang chủ
          </button>
          <LuatChoi
            presetId={presetId}
            daTuyChinh={daTuyChinh}
            ruleset={ruleset}
            presetRieng={presetRieng}
            onChonPreset={chonPreset}
            onChange={suaRulesetThuCong}
            onReset={resetVeGocPreset}
            onLuuPresetRieng={luuThanhPresetRieng}
            onXoaPresetRieng={xoaPresetRieng}
          />
        </>
      )}

      {trang === 'choiAI' && !daChonVan && (
        <ChonVan
          coVanDaLuu={coVanDaLuu}
          onChonTiep={chonChoiTiep}
          onChonMoi={chonVanMoi}
        />
      )}

      {trang === 'choiAI' && daChonVan && (
        <>
          <h1>Chinese Poker</h1>
          <div className="hang-nut-dieu-khien">
            <button className="nut-dung-choi" onClick={dungChoi}>⏸ Dừng chơi</button>
            {vanDaKetThuc && (
              <button className="nut-choi-tiep" onClick={chonVanMoi}>🆕 Chơi ván mới</button>
            )}
          </div>
          {ketQuaThangTrang ? (
            <>
              <div className="banner-thang-trang">
                🎉 Ù ngay! {ketQuaThangTrang.ketQuaLoai
                  .map((loai, i) => loai ? `${TEN_NGUOI_CHOI[i]}: ${TEN_THANG_TRANG_HIEN_THI[loai]}` : null)
                  .filter(Boolean)
                  .join(' — ')}
              </div>
              {renderRaw13('Bạn', boBaiCuaToi)}
              {boBaiDoiThu.map((ds, idx) => renderRaw13(`Đối thủ ${idx + 1}`, ds))}
            </>
          ) : (
            !daXacNhan && (
              <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
                Kéo 2 lá để đổi chỗ cho nhau, sắp xếp theo ý bạn
              </p>
            )
          )}

          {!ketQuaThangTrang && (
            <>
              {daXacNhan ? (
                <>
                  {renderVungChiXem('Chi Đầu (3 lá)', chiDauGoc)}
                  {renderVungChiXem('Chi Giữa (5 lá)', chiGiuaGoc)}
                  {renderVungChiXem('Chi Cuối (5 lá)', chiCuoiGoc)}
                </>
              ) : (
                <>
                  {renderVungDangXep('Chi Đầu (3 lá)', chiDauGoc, BAT_DAU.dau)}
                  {renderVungDangXep('Chi Giữa (5 lá)', chiGiuaGoc, BAT_DAU.giua)}
                  {renderVungDangXep('Chi Cuối (5 lá)', chiCuoiGoc, BAT_DAU.cuoi)}
                </>
              )}

              <p className={hopLe ? 'thong-bao-hop-le' : 'thong-bao-loi'}>
                {hopLe ? 'Hợp lệ — sẵn sàng!' : 'Binh lủng!'}
              </p>

              {!daXacNhan && (
                <div className="hang-nut-xep-bai">
                  <button className="nut-xac-nhan" onClick={xacNhanBai}>Xác nhận bài</button>
                  <button className="nut-bao-u" onClick={moHopThoaiBaoU}>📣 Báo Ù</button>
                </div>
              )}
            </>
          )}

          {(ketQuaThangTrang || (daXacNhan && ketQuaDiem)) && (
            <div className="ket-qua">
              <h2>Kết quả</h2>
              <p className="ghi-chu-luat">
                Tính theo luật "{tatCaPreset.find(p => p.id === presetId)?.ten}"
                {daTuyChinh ? ' (đã chỉnh tay)' : ''} — điểm gốc {ruleset.pointsPerChi.dau}/
                {ruleset.pointsPerChi.giua}/{ruleset.pointsPerChi.cuoi} (Đầu/Giữa/Cuối)
              </p>
              {Object.entries(ketQuaHienTai.diem).map(([ten, d]) => (
                <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
              ))}

              <button className="nut-xem-giai-trinh" onClick={() => setHienGiaiTrinh(v => !v)}>
                {hienGiaiTrinh ? 'Ẩn cách tính chi tiết' : 'Xem cách tính chi tiết'}
              </button>

              {hienGiaiTrinh && (
                <div className="khoi-giai-trinh">
                  <div className="giai-trinh-tieu-de">Cách tính điểm của Bạn:</div>
                  {(ketQuaHienTai.dienGiaiTheoDoiThu['Bạn'] || []).map((muc, idx) => (
                    <div key={idx} className="dong-giai-trinh">
                      <div className="giai-trinh-doi-thu">
                        {muc.doiThu ? `So với ${muc.doiThu}:` : (ketQuaThangTrang ? 'Thắng trắng / loại thắng trắng:' : 'Chi Á (tính riêng cho cả ván):')}
                      </div>
                      {muc.dienGiai.map((dong, i) => (
                        <div key={i} className="giai-trinh-chi-tiet">{dong}</div>
                      ))}
                      <div className="giai-trinh-ket">
                        → {muc.diemNhanDuoc >= 0 ? '+' : ''}{muc.diemNhanDuoc} điểm
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dragging && (
            <div className="la-bai-dang-keo" style={{ left: dragging.x - 28, top: dragging.y - 38 }}>
              <Card laBai={dragging.laBai} onPointerDown={() => {}} />
            </div>
          )}

          <hr />
          <h2>Bài của 3 đối thủ (AI đã xếp)</h2>
          {baiDoiThu.map((doiThu, idx) => renderBaiDoiThu(doiThu, idx))}

          {dangXacNhanBaoU && (
            <div className="lop-phu-xac-nhan">
              <div className="hop-xac-nhan-bao-u">
                <p>Bạn có CHẮC CHẮN muốn Báo Ù?</p>
                <p className="canh-bao-bao-u">
                  Nếu bài của bạn KHÔNG đủ điều kiện thắng trắng, bạn sẽ bị phạt{' '}
                  {ruleset.thangTrang?.phatBaoUSai ?? 6} điểm cho MỖI đối thủ.
                </p>
                <div className="dong-nut-xac-nhan-bao-u">
                  <button className="nut-huy-bao-u" onClick={huyBaoU}>Hủy, xếp bài tiếp</button>
                  <button className="nut-xac-nhan-bao-u" onClick={xacNhanBaoU}>Chắc chắn, Báo Ù!</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
