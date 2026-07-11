import { useState, useRef, useEffect, useMemo } from 'react'
import './App.css'
import { chiaBai, tinhDiem, tinhDiemThangTrangAI, tinhDiemBaoUDung, tinhDiemBaoUSai, xepBaiThangTrangDeXem, xepBaiChuyenNghiep } from './cardEngine.js'
import { DANH_SACH_NHAN_VAT_MAC_DINH, aiXepBaiTheoNhanVat } from './nhanVatAI.js'
import { RULESET_PRESETS, layRulesetTuPreset, isValidRuleset, damBaoBonusGiuaDayDu } from './ruleset.js'
import TheBaiDon from './TheBaiDon.jsx'
import HangBai from './HangBai.jsx'
import LuatChoi from './LuatChoi.jsx'
import TrangChu from './TrangChu.jsx'
import ChonVan from './ChonVan.jsx'
import GhiDiem from './GhiDiem.jsx'
import LichSu from './LichSu.jsx'
import {
  taoHiepMoi, taoVanMoi, themVanVaoLichSu, layHiepDangDoHoacNull,
  docDanhSach, ghiDanhSach, KHOA_HIEP, KHOA_VAN,
  nguoiChiaChoVan, tinhTongKetHiep, layVanCuaHiep, layTenNguoiChoiGanNhat,
} from './lichSuChoi.js'

// 13 ô cố định: index 0-2 = Chi Đầu, 3-7 = Chi Giữa, 8-12 = Chi Cuối
const BAT_DAU = { dau: 0, giua: 3, cuoi: 8 };
const KHOA_LUU_RULESET = 'mauBinhLuatChoi';
const KHOA_LUU_PRESET_RIENG = 'mauBinhLuatTuyChinh';
const NGUON = 'choiAI';
const TEN_THANG_TRANG_HIEN_THI = {
  rongCuon: 'Rồng cuốn', sanhRong: 'Sảnh rồng', namDoiMotSam: 'Năm đôi 1 sám',
  lucPheBon: 'Lục phé bôn', namDoiThong: 'Năm đôi thông', baThung: 'Ba thùng', baSanh: 'Ba sảnh',
};

function docTrangThaiLuat() {
  try {
    const raw = localStorage.getItem(KHOA_LUU_RULESET);
    if (!raw) return { presetId: 'chuan', ruleset: layRulesetTuPreset('chuan'), daTuyChinh: false };
    const obj = JSON.parse(raw);
    if (obj && obj.presetId && isValidRuleset(obj.ruleset)) return { ...obj, ruleset: damBaoBonusGiuaDayDu(obj.ruleset) };
    if (isValidRuleset(obj)) return { presetId: 'chuan', ruleset: damBaoBonusGiuaDayDu(obj), daTuyChinh: true };
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
          .map(p => ({ ...p, ruleset: damBaoBonusGiuaDayDu(p.ruleset) }))
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

function layNhanVat(id) {
  return DANH_SACH_NHAN_VAT_MAC_DINH.find(n => n.id === id) || DANH_SACH_NHAN_VAT_MAC_DINH[0];
}

// Xếp bài cho 3 đối thủ theo ĐÚNG nhân vật đã chọn cho hiệp (mặc định
// 'coDien' nếu chưa có, vd hiệp cũ lỡ chưa xóa sạch lịch sử, hoặc bàn nền
// lúc chưa vào ván nào). Trả về CẢ cách chia LẪN phong cách THẬT đã dùng
// (quan trọng cho nhân vật trộn — phải "chốt" ngay lúc chia bài, không
// tính lại sau vì mỗi lần gọi layPhongCachThucTeChoVan có thể ra kết quả
// khác do dùng Math.random).
function tinhKetQuaDoiThu(nhanVatIds, tatCaBaiArr, rulesetArg) {
  const ids = nhanVatIds ?? ['coDien', 'coDien', 'coDien'];
  return [0, 1, 2].map(idx => {
    const ca13La = tatCaBaiArr[idx + 1];
    const laCon39 = tatCaBaiArr.filter((_, i) => i !== idx + 1).flat();
    return aiXepBaiTheoNhanVat(layNhanVat(ids[idx]), ca13La, laCon39, rulesetArg);
  });
}

function layPhongCachTuKetQua(ketQuaDoiThu, tenDoiThu) {
  return {
    [tenDoiThu[0]]: ketQuaDoiThu[0].phongCachThat,
    [tenDoiThu[1]]: ketQuaDoiThu[1].phongCachThat,
    [tenDoiThu[2]]: ketQuaDoiThu[2].phongCachThat,
  };
}

// Tên THẬT của 3 đối thủ trong hiệp này = tên nhân vật đã chọn (vd
// "Safeway", "Mad Max"...) — dùng làm KHÓA NỘI BỘ DUY NHẤT xuyên suốt
// (nguoiChoi lúc tính điểm, diem/tongCongDon, lịch sử) THAY CHO "Đối thủ
// 1/2/3" — để thống kê/lịch sử gắn liền với người chơi + phong cách,
// không phải vị trí ngồi. `ChonVan.jsx` đảm bảo 3 nhân vật LUÔN khác
// nhau (mỗi dropdown loại bỏ nhân vật đã được chọn ở dropdown khác) nên
// không xảy ra trùng tên → không lo bị gộp nhầm điểm giữa 2 đối thủ.
// Fallback "Đối thủ 1/2/3" CHỈ dùng khi chưa có hiệp nào (nền lúc khởi
// động app) hoặc hiệp cũ từ trước khi có field `nhanVatDoiThu`.
function layTenDoiThu(hiep) {
  if (!hiep?.nguoiChoi) return ['Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3'];
  return hiep.nguoiChoi.slice(1);
}

function App() {
  const [tatCaBai, setTatCaBai] = useState(() => chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  // 1 mảng DUY NHẤT, 13 phần tử. Vị trí trong mảng CHÍNH LÀ vị trí ô của
  // lá đó trong 3 chi — không còn khái niệm "bài trên tay" tách riêng.
  const [oCacChi, setOCacChi] = useState(() => [...boBaiCuaToi]);

  const [dragging, setDragging] = useState(null); // { tuIndex, laBai, x, y }
  const refsO = useRef([]); // 13 ref, mỗi ref ứng với đúng 1 ô (theo index 0-12)

  const [daXacNhan, setDaXacNhan] = useState(false);
  const [ketQuaDiem, setKetQuaDiem] = useState(null);
  const [hienGiaiTrinh, setHienGiaiTrinh] = useState(false);
  const [dangXacNhanBaoU, setDangXacNhanBaoU] = useState(false);
  const [dangGoiY, setDangGoiY] = useState(false);
  const [ketQuaGoiY, setKetQuaGoiY] = useState(null);
  const [goiYLucXacNhan, setGoiYLucXacNhan] = useState(null);
  const [trang, setTrang] = useState('trangChu'); // 'trangChu' | 'choiAI' | 'luatChoi' | 'ghiDiem' | 'lichSu'
  const [daChonVan, setDaChonVan] = useState(false);
  const [trangThaiLuat, setTrangThaiLuat] = useState(() => docTrangThaiLuat());
  const { presetId, ruleset, daTuyChinh } = trangThaiLuat;
  const boBaiDoiThu = useMemo(() => [tatCaBai[1], tatCaBai[2], tatCaBai[3]], [tatCaBai]);

  // ---- Lịch sử Chơi với AI (V8): chỉ còn Hiệp (gốc) + Ván, không còn
  // Phiên. Chỉ giữ danhSachVanLS làm state React (cần để hiển thị
  // "Ván Y/12" sống) — Hiệp không cần giữ state riêng vì mọi thao tác tạo
  // hiệp đều đọc thẳng localStorage mới nhất (docDanhSach) rồi ghi lại
  // ngay, không có chỗ nào khác trong màn hình cần đọc lại danh sách Hiệp
  // — vì GhiDiem.jsx là 1 component riêng, tự giữ bản sao khác của CÙNG
  // dữ liệu, mount/unmount độc lập khi điều hướng. ----
  const [danhSachVanLS, setDanhSachVanLS] = useState(() => docDanhSach(KHOA_VAN));

  // Hiệp AI đang dùng để ghi ván vào — null khi còn ở màn ChonVan (chưa
  // quyết định tiếp hiệp cũ hay bắt đầu hiệp mới). Khai báo TRƯỚC
  // baiDoiThu/phongCachThatDoiThu vì 2 state đó cần `tenDoiThu` (suy ra từ
  // hiepAIHienTai) ngay lúc khởi tạo.
  const [hiepAIHienTai, setHiepAIHienTai] = useState(null);
  // Tên THẬT (= tên nhân vật đã chọn) của 3 đối thủ trong hiệp hiện tại —
  // dùng làm khóa nội bộ DUY NHẤT xuyên suốt (xem `layTenDoiThu` ở trên).
  const tenDoiThu = layTenDoiThu(hiepAIHienTai);
  // Tên hiển thị của CHÍNH người chơi trong hiệp hiện tại — tự chọn lúc
  // "Bắt đầu hiệp mới" (xem ChonVan.jsx), mặc định 'Bạn' nếu chưa có hiệp
  // nào (nền lúc khởi động app).
  const tenBan = hiepAIHienTai?.nguoiChoi?.[0] ?? 'Bạn';
  const tenTatCaNguoiChoi = [tenBan, ...tenDoiThu];

  const [baiDoiThu, setBaiDoiThu] = useState(() => tinhKetQuaDoiThu(null, tatCaBai, ruleset).map(k => k.cachChia));
  const [phongCachThatDoiThu, setPhongCachThatDoiThu] = useState(() => layPhongCachTuKetQua(tinhKetQuaDoiThu(null, tatCaBai, ruleset), tenDoiThu));
  const [presetRieng, setPresetRieng] = useState(() => docPresetRieng());
  const tatCaPreset = [...RULESET_PRESETS, ...presetRieng];

  // Kết quả tổng kết hiệp (nếu VÁN VỪA XONG là ván thứ 12) — null nếu chưa
  // tới lúc tổng kết.
  const [ketQuaHiepVuaXong, setKetQuaHiepVuaXong] = useState(null);

  // V11: đếm ngược thời gian xếp bài — reset về đúng số giây cấu hình mỗi
  // khi vào ván mới (xem batDauVanMoi).
  const [giayConLai, setGiayConLai] = useState(() => ruleset.thoiGianXepBai?.giay ?? 60);

  useEffect(() => {
    localStorage.setItem(KHOA_LUU_RULESET, JSON.stringify(trangThaiLuat));
  }, [trangThaiLuat]);

  useEffect(() => {
    localStorage.setItem(KHOA_LUU_PRESET_RIENG, JSON.stringify(presetRieng));
  }, [presetRieng]);

  // CHỈ recompute khi RULESET đổi (vd sửa luật giữa chừng 1 ván chưa xác
  // nhận) — KHÔNG phụ thuộc boBaiDoiThu/tatCaBai, vì mỗi lần chia bài MỚI
  // đã có `batDauVanMoi` tự tính baiDoiThu trực tiếp rồi (tránh tính 2 lần
  // — quan trọng vì phong cách 'chuyenNghiep' tốn ~1-2 giây/đối thủ).
  useEffect(() => {
    const ketQua = tinhKetQuaDoiThu(hiepAIHienTai?.nhanVatDoiThu, tatCaBai, ruleset);
    setBaiDoiThu(ketQua.map(k => k.cachChia));
    setPhongCachThatDoiThu(layPhongCachTuKetQua(ketQua, tenDoiThu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleset]);

  // Chia 1 bộ bài MỚI và vào thẳng màn chơi, gắn với đúng `hiep` truyền
  // vào (hiệp dở dang muốn tiếp tục, hiệp vừa tạo mới, hoặc hiệp hiện tại
  // muốn chơi thêm 1 ván nữa).
  function batDauVanMoi(hiep) {
    const baiMoi = chiaBai();
    setTatCaBai(baiMoi);
    setOCacChi([...baiMoi[0]]);
    const tenDoiThuMoi = layTenDoiThu(hiep);
    const ketQuaDoiThu = tinhKetQuaDoiThu(hiep?.nhanVatDoiThu, baiMoi, ruleset);
    setBaiDoiThu(ketQuaDoiThu.map(k => k.cachChia));
    setPhongCachThatDoiThu(layPhongCachTuKetQua(ketQuaDoiThu, tenDoiThuMoi));
    setDaXacNhan(false);
    setKetQuaDiem(null);
    setKetQuaHiepVuaXong(null);
    setKetQuaGoiY(null);
    setGoiYLucXacNhan(null);
    setGiayConLai(ruleset.thoiGianXepBai?.giay ?? 60);
    setHiepAIHienTai(hiep);
    setDaChonVan(true);
  }

  function chonTiepHiepDoDang() {
    const hiep = layHiepDangDoHoacNull(docDanhSach(KHOA_HIEP), docDanhSach(KHOA_VAN), NGUON);
    batDauVanMoi(hiep);
  }

  function chonHiepMoi(nhanVatDaChon, tenNguoiChoi) {
    const dsHiepTuoi = docDanhSach(KHOA_HIEP);
    // nguoiChoi dùng THẲNG tên nhân vật đã chọn (vd "Safeway") làm định
    // danh — ChonVan.jsx đảm bảo 3 nhân vật không trùng nhau nên an toàn.
    const tenDoiThuMoi = nhanVatDaChon.map(id => layNhanVat(id).ten);
    const tenBanMoi = (tenNguoiChoi || '').trim() || 'Bạn';
    const hiepMoi = taoHiepMoi(NGUON, [tenBanMoi, ...tenDoiThuMoi], '', nhanVatDaChon);
    const dsHiepMoi = [...dsHiepTuoi, hiepMoi];
    ghiDanhSach(KHOA_HIEP, dsHiepMoi);
    batDauVanMoi(hiepMoi);
  }

  // Tính SỐNG lúc đang chơi — biết ngay đang ở Ván nào (trong Hiệp) để
  // hiển thị trên đầu màn hình.
  const soVanDaXongHienTai = hiepAIHienTai ? layVanCuaHiep(hiepAIHienTai.id, danhSachVanLS).length : 0;

  // Điểm tích lũy CỦA HIỆP ĐANG CHƠI DỞ, tính lại trực tiếp từ danh sách
  // Ván thật mỗi lần render (không cache) — hiển thị ngay cạnh tên mỗi
  // người trên bàn (xem renderTenVaDiem).
  const tongCongDonHiepHienTai = hiepAIHienTai ? tinhTongKetHiep(layVanCuaHiep(hiepAIHienTai.id, danhSachVanLS)) : {};

  // Ghi 1 ván Chơi-AI vào lịch sử, vào đúng hiepAIHienTai — trả về biết
  // ván vừa ghi có phải ván THỨ 12 của hiệp hay không, để nơi gọi quyết
  // định hiện màn "Ván tiếp theo" bình thường hay màn "Tổng kết Hiệp".
  function ghiVanAIVaoLichSu({ nguoiChoiBaiThat, diem, laThangTrang, loaiThangTrang }) {
    const dsVanTuoi = docDanhSach(KHOA_VAN);
    const soThuTuVanTrongHiep = layVanCuaHiep(hiepAIHienTai.id, dsVanTuoi).length + 1;
    const { nguoiChia, lanChia } = nguoiChiaChoVan(hiepAIHienTai.nguoiChoi, soThuTuVanTrongHiep);

    const vanMoi = taoVanMoi({
      hiepId: hiepAIHienTai.id, soThuTuTrongHiep: soThuTuVanTrongHiep, lanChiaThu: lanChia, nguoiChia,
      nguon: NGUON, diem, nguoiChoiBaiThat, laThangTrang, loaiThangTrang,
      cheDoThucTeDoiThu: phongCachThatDoiThu,
    });
    const danhSachVanMoi = themVanVaoLichSu(vanMoi, dsVanTuoi);
    ghiDanhSach(KHOA_VAN, danhSachVanMoi);
    setDanhSachVanLS(danhSachVanMoi);

    if (soThuTuVanTrongHiep === 12) {
      const tongKet = tinhTongKetHiep(layVanCuaHiep(hiepAIHienTai.id, danhSachVanMoi));
      return { hiepVuaXong: true, tongKetHiep: tongKet, hiepSoThuTu: hiepAIHienTai.soThuTu };
    }
    return { hiepVuaXong: false };
  }

  const ketQuaThangTrang = useMemo(() => {
    const nguoiChoi = [
      { ten: tenBan, ca13La: boBaiCuaToi },
      { ten: tenDoiThu[0], ca13La: boBaiDoiThu[0] },
      { ten: tenDoiThu[1], ca13La: boBaiDoiThu[1] },
      { ten: tenDoiThu[2], ca13La: boBaiDoiThu[2] },
    ];
    return tinhDiemThangTrangAI(nguoiChoi, ruleset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boBaiCuaToi, boBaiDoiThu, ruleset, hiepAIHienTai]);

  // Ghi log khi AI tự động thắng trắng (V4) — CHỈ khi người chơi thực sự
  // đang ở màn Chơi với AI (trang === 'choiAI' && daChonVan); nếu không,
  // bộ bài "Bạn" đang giữ trong state chỉ là dữ liệu nền chưa ai xem tới
  // (App() luôn tính sẵn dù đang ở trang nào khác), ghi log lúc đó sẽ tạo
  // ra 1 "ván" ma trong lịch sử mà người chơi chưa từng thấy/chơi.
  const boBaiDaGhiThangTrangRef = useRef(null);
  useEffect(() => {
    if (!(trang === 'choiAI' && daChonVan)) return;
    if (ketQuaThangTrang && boBaiDaGhiThangTrangRef.current !== boBaiCuaToi) {
      boBaiDaGhiThangTrangRef.current = boBaiCuaToi;
      const ketQuaLog = ghiVanAIVaoLichSu({
        nguoiChoiBaiThat: tenTatCaNguoiChoi.map((ten, i) => ({ ten, ca13La: tatCaBai[i] })),
        diem: ketQuaThangTrang.diem,
        laThangTrang: true,
        loaiThangTrang: ketQuaThangTrang.ketQuaLoai?.find(l => l !== null),
      });
      if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
    }
  }, [trang, daChonVan, boBaiCuaToi, tatCaBai, ketQuaThangTrang, hiepAIHienTai]);

  const ketQuaHienTai = ketQuaThangTrang || ketQuaDiem;

  function dieuHuong(trangMoi) {
    setTrang(trangMoi);
  }

  // "Dừng chơi": bỏ dở luôn ván đang xếp/xem (không lưu lại gì để chơi
  // tiếp), về trang chủ. Ván ĐÃ xác nhận/ghi log rồi thì không mất gì —
  // vẫn còn nguyên trong Hiệp.
  function dungChoi() {
    setTrang('trangChu');
    setDaChonVan(false);
  }

  function vanTiepTheo() {
    batDauVanMoi(hiepAIHienTai);
  }

  // "Chơi tiếp" ngay sau khi vừa xong 1 hiệp (từ màn Hết hiệp) — giữ
  // NGUYÊN 3 nhân vật đối thủ của hiệp vừa xong (không đi qua ChonVan nên
  // không có màn chọn lại nhân vật).
  function choiTiepHiepMoi() {
    const dsHiepTuoi = docDanhSach(KHOA_HIEP);
    const hiepMoi = taoHiepMoi(NGUON, hiepAIHienTai.nguoiChoi, '', hiepAIHienTai.nhanVatDoiThu);
    const dsHiepMoi = [...dsHiepTuoi, hiepMoi];
    ghiDanhSach(KHOA_HIEP, dsHiepMoi);
    batDauVanMoi(hiepMoi);
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
  const vanDaKetThuc = !!(ketQuaThangTrang || (daXacNhan && ketQuaDiem));
  // Dùng vanDaKetThuc (KHÔNG phải chỉ daXacNhan) để cộng thêm 1 — vì AI tự
  // động thắng trắng cũng coi là ván đã kết thúc/ghi log rồi, dù daXacNhan
  // chưa từng được set true trong trường hợp đó. Giới hạn tối đa 12 (đủ
  // 12 chuyển sang màn tổng kết).
  const soVanDangHienThi = Math.min(soVanDaXongHienTai + (vanDaKetThuc ? 0 : 1), 12);

  // V11: đếm ngược thời gian xếp bài — hết giờ tự động xác nhận ĐÚNG cách
  // xếp hiện tại, gọi thẳng xacNhanBai() (không viết luồng riêng). Dừng
  // đếm khi ván đã kết thúc — dùng `vanDaKetThuc` (KHÔNG chỉ `daXacNhan`)
  // vì thắng trắng tự động KHÔNG set `daXacNhan=true` (xem comment ở
  // `vanDaKetThuc` phía trên) — nếu chỉ canh `daXacNhan`, đồng hồ sẽ tiếp
  // tục chạy vô ích (dù gọi xacNhanBai() lúc đó cũng không gây hại gì, vì
  // hàm tự return sớm khi có ketQuaThangTrang) sau khi ván đã thắng trắng
  // xong. Tạm dừng khi đang mở hộp thoại Báo Ù, tiếp tục ngay khi đóng.
  useEffect(() => {
    if (vanDaKetThuc) return;
    if (!ruleset.thoiGianXepBai?.batBuoc) return;
    if (dangXacNhanBaoU) return;

    if (giayConLai <= 0) {
      xacNhanBai();
      return;
    }

    const timer = setTimeout(() => setGiayConLai(g => g - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giayConLai, vanDaKetThuc, dangXacNhanBaoU, ruleset.thoiGianXepBai?.batBuoc]);

  // Phát hiện 1 hiệp AI còn DỞ DANG (chưa đủ 12 ván) từ lần chơi trước, để
  // màn ChonVan cho phép "Tiếp hiệp cũ". Chỉ tính khi đang ở đúng màn chọn
  // (chưa vào ván chơi). Đọc thẳng localStorage (không dùng state có thể
  // cũ), giống cách các hàm ghi log khác đã làm.
  const hiepAIDoDang = (trang === 'choiAI' && !daChonVan)
    ? (() => {
        const dsHiep = docDanhSach(KHOA_HIEP);
        const dsVan = docDanhSach(KHOA_VAN);
        const hiep = layHiepDangDoHoacNull(dsHiep, dsVan, NGUON);
        if (!hiep) return null;
        const vanCuaHiep = layVanCuaHiep(hiep.id, dsVan);
        return { ...hiep, soVan: vanCuaHiep.length, tongKet: tinhTongKetHiep(vanCuaHiep) };
      })()
    : null;

  // Tên điền sẵn cho ô chọn tên người chơi ở màn ChonVan — ưu tiên tên
  // của hiệp GẦN NHẤT (dù dở dang hay đã xong) để không phải gõ lại mỗi
  // lần, mặc định 'Bạn' nếu chưa từng chơi hiệp nào.
  const tenNguoiChoiMacDinh = (trang === 'choiAI' && !daChonVan)
    ? layTenNguoiChoiGanNhat(docDanhSach(KHOA_HIEP), NGUON)
    : 'Bạn';

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
    // với vị trí thật của từng ô trên màn hình. Duyệt NGƯỢC (12 → 0): các
    // lá CHỒNG LẤN (overlap) lên nhau trong cùng 1 hàng, lá có index LỚN
    // HƠN luôn được vẽ ĐÈ LÊN TRÊN (nằm sau trong DOM) — duyệt ngược đảm
    // bảo ô đang hiện RA NGOÀI CÙNG (trên cùng, dễ thấy) luôn được ưu tiên
    // khớp trước, đúng với những gì mắt thường nhìn thấy trên màn hình.
    let denIndex = -1;
    for (let i = 12; i >= 0; i--) {
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

    if (ketQuaGoiY) {
      const nguoiChoiVoiGoiY = [
        { ten: tenBan, chiDau: ketQuaGoiY.chiDau, chiGiua: ketQuaGoiY.chiGiua, chiCuoi: ketQuaGoiY.chiCuoi },
        { ten: tenDoiThu[0], ...baiDoiThu[0] },
        { ten: tenDoiThu[1], ...baiDoiThu[1] },
        { ten: tenDoiThu[2], ...baiDoiThu[2] },
      ];
      setGoiYLucXacNhan({
        diem: tinhDiem(nguoiChoiVoiGoiY, ruleset).diem[tenBan],
        tyLeThang: ketQuaGoiY.tyLeThang,
        // Chụp lại LUÔN cách xếp gợi ý (không chỉ điểm) — để còn hiển thị
        // lại cho Huy xem sau khi đã xác nhận, không phụ thuộc vòng đời
        // của `ketQuaGoiY` (vốn chỉ hiện khi CHƯA xác nhận).
        chiDau: ketQuaGoiY.chiDau,
        chiGiua: ketQuaGoiY.chiGiua,
        chiCuoi: ketQuaGoiY.chiCuoi,
      });
    } else {
      setGoiYLucXacNhan(null);
    }

    const nguoiChoi = [
      { ten: tenBan, chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
      { ten: tenDoiThu[0], ...baiDoiThu[0] },
      { ten: tenDoiThu[1], ...baiDoiThu[1] },
      { ten: tenDoiThu[2], ...baiDoiThu[2] },
    ];
    const ketQua = tinhDiem(nguoiChoi, ruleset);
    setKetQuaDiem(ketQua);
    const ketQuaLog = ghiVanAIVaoLichSu({
      nguoiChoiBaiThat: nguoiChoi.map(p => ({ ten: p.ten, chiDau: p.chiDau, chiGiua: p.chiGiua, chiCuoi: p.chiCuoi })),
      diem: ketQua.diem,
    });
    if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
    setDaXacNhan(true);
  }

  // Gợi ý cách xếp bài "Chuyên nghiệp" cho CHÍNH người chơi — chạy hơi lâu
  // (mô phỏng Monte Carlo) nên bọc setTimeout(...,0) để trình duyệt kịp vẽ
  // lại trạng thái "Đang tính..." TRƯỚC KHI bắt đầu phép tính nặng (đơn
  // luồng — gọi thẳng không qua setTimeout sẽ "đứng hình" tới khi xong).
  function goiY() {
    setDangGoiY(true);
    setTimeout(() => {
      const laCon39 = [...tatCaBai[1], ...tatCaBai[2], ...tatCaBai[3]];
      const ketQua = xepBaiChuyenNghiep(chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc), laCon39, ruleset);
      setKetQuaGoiY(ketQua);
      setDangGoiY(false);
    }, 0);
  }

  function chapNhanGoiY() {
    if (!ketQuaGoiY) return;
    setOCacChi([...ketQuaGoiY.chiDau, ...ketQuaGoiY.chiGiua, ...ketQuaGoiY.chiCuoi]);
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
      { ten: tenBan, ca13La: chiDauGoc.concat(chiGiuaGoc, chiCuoiGoc) },
      { ten: tenDoiThu[0], ...baiDoiThu[0] },
      { ten: tenDoiThu[1], ...baiDoiThu[1] },
      { ten: tenDoiThu[2], ...baiDoiThu[2] },
    ];
    const ketQuaDung = tinhDiemBaoUDung(nguoiChoiThangTrang, ruleset);
    const baiThatDeGhi = nguoiChoiThangTrang.map(p => ({ ten: p.ten, ca13La: p.ca13La }));

    let ketQuaCuoi, ketQuaLog;
    if (ketQuaDung) {
      ketQuaCuoi = ketQuaDung;
      ketQuaLog = ghiVanAIVaoLichSu({
        nguoiChoiBaiThat: baiThatDeGhi, diem: ketQuaDung.diem,
        laThangTrang: true, loaiThangTrang: ketQuaDung.ketQuaLoai?.[0],
      });
    } else {
      ketQuaCuoi = tinhDiemBaoUSai(nguoiChoiThangTrang, ruleset);
      ketQuaLog = ghiVanAIVaoLichSu({
        nguoiChoiBaiThat: baiThatDeGhi, diem: ketQuaCuoi.diem,
        laThangTrang: false, loaiThangTrang: null,
      });
    }
    setKetQuaDiem(ketQuaCuoi);
    if (ketQuaLog.hiepVuaXong) setKetQuaHiepVuaXong(ketQuaLog);
    setDaXacNhan(true);
  }

  // Vẽ 1 hàng TRONG LÚC ĐANG XẾP (cho phép kéo-thả): hiển thị ĐÚNG theo vị
  // trí ô gốc trong oCacChi, KHÔNG sort — để mỗi lá luôn gắn đúng với index
  // thật của nó, đảm bảo kéo-thả luôn chính xác tuyệt đối. Cùng dùng
  // TheBaiDon + engine tự co giãn/chồng lấn `.hang-chi-bai` như bài tĩnh,
  // chỉ khác là mỗi lá có gắn thêm ref (để dò ô thả) + onPointerDown (để
  // bắt đầu kéo) — kích thước "lon" (to hơn AI) theo đúng yêu cầu.
  function renderVungDangXep(danhSachGoc, chiSoBatDau) {
    return (
      <div className="hang-chi-bai hang-chi-bai-lon" style={{ '--n': danhSachGoc.length }}>
        {danhSachGoc.map((l, i) => {
          const indexToanCuc = chiSoBatDau + i;
          return (
            <div
              key={indexToanCuc}
              ref={el => { refsO.current[indexToanCuc] = el; }}
              style={{ opacity: dragging?.tuIndex === indexToanCuc ? 0.25 : 1 }}
            >
              <TheBaiDon laBai={l} onPointerDown={(e) => onPointerDownLa(e, indexToanCuc)} />
            </div>
          );
        })}
      </div>
    );
  }

  // Tên + điểm hiển thị ngay dưới mỗi vị trí trên bàn, 2 dòng: tên riêng
  // 1 dòng, dòng dưới "V: <điểm ván vừa xong> / H: <điểm tích lũy cả
  // hiệp>". H tính lại trực tiếp từ danh sách Ván thật mỗi lần render
  // (không cache) — hiện SUỐT quá trình chơi, kể cả khi chưa xong ván
  // nào. V chỉ hiện khi ván vừa xong đã có kết quả.
  function renderTenVaDiem(ten) {
    const tong = tongCongDonHiepHienTai[ten] || 0;
    const vanDiem = ketQuaHienTai ? ketQuaHienTai.diem[ten] : null;
    const coVan = vanDiem !== null && vanDiem !== undefined;
    return (
      <div className="ten-vi-tri">
        <div>{ten}</div>
        {(coVan || hiepAIHienTai) && (
          <div className="diem-vi-tri">
            {coVan && (
              <>V: <b className={vanDiem >= 0 ? 'diem-duong' : 'diem-am'}>{vanDiem > 0 ? '+' : ''}{vanDiem}</b></>
            )}
            {coVan && hiepAIHienTai && ' / '}
            {hiepAIHienTai && (
              <>H: <b className={tong >= 0 ? 'diem-duong' : 'diem-am'}>{tong > 0 ? '+' : ''}{tong}</b></>
            )}
          </div>
        )}
      </div>
    );
  }

  // Bài HIỂN THỊ cho 1 đối thủ: nếu đối thủ đó là người VỪA THẮNG TRẮNG
  // (ketQuaLoai đúng vị trí — mảng lệch 1 so với idx trong baiDoiThu vì
  // phần tử 0 luôn là "Bạn"), xếp lại theo `xepBaiThangTrangDeXem` để
  // CHỨNG MINH RÕ loại bài đã thắng (vd 3 thùng); không thì giữ nguyên
  // cách chia bình thường của `aiXepBai` (chỉ nhằm hợp lệ, không nhằm
  // "đẹp" — không có gì đặc biệt để phô ra nếu không thắng trắng).
  function layBaiHienThiDoiThu(idx) {
    const loai = ketQuaThangTrang?.ketQuaLoai?.[idx + 1];
    if (loai) return xepBaiThangTrangDeXem(boBaiDoiThu[idx], loai);
    return baiDoiThu[idx];
  }

  function renderViTriDoiThu(ten, doiThu) {
    return (
      <div>
        {renderTenVaDiem(ten)}
        <HangBai danhSachLa={doiThu.chiDau} faceDown={!vanDaKetThuc} kichThuoc="nho" />
        <HangBai danhSachLa={doiThu.chiGiua} faceDown={!vanDaKetThuc} kichThuoc="nho" />
        <HangBai danhSachLa={doiThu.chiCuoi} faceDown={!vanDaKetThuc} kichThuoc="nho" />
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

      {trang === 'ghiDiem' && (
        <>
          <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
            ← Trang chủ
          </button>
          <GhiDiem />
        </>
      )}

      {trang === 'lichSu' && (
        <>
          <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
            ← Trang chủ
          </button>
          <LichSu />
        </>
      )}

      {trang === 'choiAI' && !daChonVan && (
        <>
          <button className="nut-ve-trang-chu" onClick={() => setTrang('trangChu')}>
            ← Trang chủ
          </button>
          <ChonVan
            hiepDoDang={hiepAIDoDang}
            tenNguoiChoiMacDinh={tenNguoiChoiMacDinh}
            onChonTiepHiep={chonTiepHiepDoDang}
            onChonHiepMoi={chonHiepMoi}
          />
        </>
      )}

      {trang === 'choiAI' && daChonVan && (
        <>
          <h1>Chơi với AI</h1>

          <div className="ban-choi ban-choi-tron">
            <div className="vi-tri-12h">{renderViTriDoiThu(tenDoiThu[1], layBaiHienThiDoiThu(1))}</div>
            <div className="vi-tri-9h">{renderViTriDoiThu(tenDoiThu[0], layBaiHienThiDoiThu(0))}</div>
            <div className="vi-tri-3h">{renderViTriDoiThu(tenDoiThu[2], layBaiHienThiDoiThu(2))}</div>

            <div className="vi-tri-6h">
              {renderTenVaDiem(tenBan)}
              {!vanDaKetThuc ? (
                <>
                  {renderVungDangXep(chiDauGoc, BAT_DAU.dau)}
                  {renderVungDangXep(chiGiuaGoc, BAT_DAU.giua)}
                  {renderVungDangXep(chiCuoiGoc, BAT_DAU.cuoi)}
                </>
              ) : (
                <>
                  <HangBai danhSachLa={chiDauGoc} kichThuoc="lon" />
                  <HangBai danhSachLa={chiGiuaGoc} kichThuoc="lon" />
                  <HangBai danhSachLa={chiCuoiGoc} kichThuoc="lon" />
                </>
              )}
            </div>

            <div className="khu-giua-ban">
              <p className={ketQuaHiepVuaXong ? 'ghi-chu-luat khoi-luat-tieu-de tieu-de-het-hiep' : 'ghi-chu-luat'} style={{ textAlign: 'center', margin: 0 }}>
                {ketQuaHiepVuaXong ? `Tổng kết Hiệp ${ketQuaHiepVuaXong.hiepSoThuTu}` : hiepAIHienTai && `Hiệp ${hiepAIHienTai.soThuTu} — Ván ${soVanDangHienThi}/12`}
              </p>
              {!vanDaKetThuc && ruleset.thoiGianXepBai?.batBuoc && (
                <div className={giayConLai <= 10 ? 'dem-nguoc dem-nguoc-canh-bao' : 'dem-nguoc'}>
                  Còn {giayConLai} giây
                </div>
              )}
              {ketQuaThangTrang && (
                <div className="banner-thang-trang">
                  🎉 Thắng trắng! {ketQuaThangTrang.ketQuaLoai
                    .map((loai, i) => loai ? `${tenTatCaNguoiChoi[i]}: ${TEN_THANG_TRANG_HIEN_THI[loai]}` : null)
                    .filter(Boolean)
                    .join(' — ')}
                </div>
              )}
              <div className="hang-nut-choi">
                {ketQuaHiepVuaXong ? (
                  <>
                    <button className="nut-choi" onClick={choiTiepHiepMoi}>Chơi tiếp</button>
                    <button className="nut-choi" onClick={dungChoi}>Dừng</button>
                  </>
                ) : vanDaKetThuc ? (
                  <>
                    <button className="nut-choi" onClick={dungChoi}>Dừng</button>
                    <button className="nut-choi" onClick={vanTiepTheo}>Tiếp</button>
                  </>
                ) : (
                  <>
                    <button className="nut-choi" onClick={dungChoi}>Dừng</button>
                    <button className="nut-choi" onClick={goiY} disabled={dangGoiY}>
                      {dangGoiY ? 'Đang tính...' : 'Gợi ý'}
                    </button>
                    {ketQuaGoiY && (
                      <button className="nut-choi" onClick={chapNhanGoiY}>Chấp nhận gợi ý</button>
                    )}
                    <button className="nut-choi" onClick={xacNhanBai}>Xác nhận bài</button>
                    <button className="nut-choi" onClick={moHopThoaiBaoU}>Báo thắng trắng</button>
                  </>
                )}
              </div>
              {ketQuaGoiY && !vanDaKetThuc && (
                <div className="khoi-luat">
                  <div className="khoi-luat-tieu-de">
                    Gợi ý (tỷ lệ thắng ước tính: {(ketQuaGoiY.tyLeThang * 100).toFixed(0)}%)
                  </div>
                  <HangBai danhSachLa={ketQuaGoiY.chiDau} kichThuoc="nho" />
                  <HangBai danhSachLa={ketQuaGoiY.chiGiua} kichThuoc="nho" />
                  <HangBai danhSachLa={ketQuaGoiY.chiCuoi} kichThuoc="nho" />
                </div>
              )}
            </div>
          </div>

          {(ketQuaThangTrang || (daXacNhan && ketQuaDiem)) && (
            <div className="ket-qua">
              {goiYLucXacNhan && daXacNhan && ketQuaDiem && (
                <div className="khoi-luat">
                  <div className="khoi-luat-tieu-de">
                    Gợi ý lúc đó (tỷ lệ thắng ước tính: {(goiYLucXacNhan.tyLeThang * 100).toFixed(0)}%)
                  </div>
                  <HangBai danhSachLa={goiYLucXacNhan.chiDau} kichThuoc="nho" />
                  <HangBai danhSachLa={goiYLucXacNhan.chiGiua} kichThuoc="nho" />
                  <HangBai danhSachLa={goiYLucXacNhan.chiCuoi} kichThuoc="nho" />
                  <p className="ghi-chu-luat">
                    Nếu dùng gợi ý: {goiYLucXacNhan.diem > 0 ? '+' : ''}{goiYLucXacNhan.diem} điểm
                    (so với thực tế {ketQuaDiem.diem[tenBan] > 0 ? '+' : ''}{ketQuaDiem.diem[tenBan]})
                  </p>
                </div>
              )}
              <button className="nut-xem-giai-trinh" onClick={() => setHienGiaiTrinh(v => !v)}>
                {hienGiaiTrinh ? 'Ẩn cách tính chi tiết' : 'Xem cách tính chi tiết'}
              </button>

              {hienGiaiTrinh && (
                <div className="khoi-giai-trinh">
                  <div className="giai-trinh-tieu-de">Cách tính điểm của {tenBan}:</div>
                  {(ketQuaHienTai.dienGiaiTheoDoiThu[tenBan] || []).map((muc, idx) => (
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
              <TheBaiDon laBai={dragging.laBai} />
            </div>
          )}

          {dangXacNhanBaoU && (
            <div className="lop-phu-xac-nhan">
              <div className="hop-xac-nhan-bao-u">
                <p>Bạn có CHẮC CHẮN muốn báo thắng trắng?</p>
                <p className="canh-bao-bao-u">
                  Nếu bài của bạn KHÔNG đủ điều kiện thắng trắng, bạn sẽ bị phạt{' '}
                  {ruleset.thangTrang?.phatBaoUSai ?? 6} điểm cho MỖI đối thủ.
                </p>
                <div className="dong-nut-xac-nhan-bao-u">
                  <button className="nut-huy-bao-u" onClick={huyBaoU}>Hủy, xếp bài tiếp</button>
                  <button className="nut-xac-nhan-bao-u" onClick={xacNhanBaoU}>Chắc chắn, Báo thắng trắng!</button>
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
