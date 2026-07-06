// cardEngine.js
// rank: 2-14 tương ứng 2,3,4,5,6,7,8,9,10,J,Q,K,A (14 = Át, mạnh nhất)
// suit: 0-3 tương ứng 4 chất, chỉ để phân biệt 4 lá cùng rank

export function taoBoBai() {
  const boBai = [];
  for (let rank = 2; rank <= 14; rank++) {
    for (let suit = 0; suit < 4; suit++) {
      boBai.push({ rank, suit });
    }
  }
  return boBai;
}

export function xaoBai(boBai) {
  const ketQua = [...boBai];
  for (let i = ketQua.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ketQua[i], ketQua[j]] = [ketQua[j], ketQua[i]];
  }
  return ketQua;
}

export function chiaBai() {
  const bai = xaoBai(taoBoBai());
  return [bai.slice(0, 13), bai.slice(13, 26), bai.slice(26, 39), bai.slice(39, 52)];
}

// Xếp lại các rank theo ĐÚNG thứ tự dùng để so sánh khi có nhóm lá giống
// nhau (đôi/sám cô/cù lũ/tứ quý...): nhóm có SỐ LƯỢNG lá nhiều hơn xếp
// trước, cùng số lượng thì rank cao hơn xếp trước, cuối cùng mới tới các
// lá lẻ (kicker). KHÔNG được sắp xếp giảm dần đơn thuần theo rank — vì lá
// lẻ có rank CAO HƠN cả cặp/bộ vẫn có thể lọt lên đầu mảng, làm sai lệch
// khi so sánh 2 bộ bài cùng loại (vd đôi 7 kèm kicker K nếu sắp giảm dần
// đơn thuần sẽ có mảng [K,7,7,...] và bị coi "mạnh hơn" đôi J kèm kicker 9
// dù đôi J phải thắng đôi 7 mới đúng).
function sapXepTheoNhom(ranks) {
  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  return Object.entries(demSoLuong)
    .map(([rank, soLuong]) => ({ rank: Number(rank), soLuong }))
    .sort((a, b) => b.soLuong - a.soLuong || b.rank - a.rank)
    .flatMap(({ rank, soLuong }) => Array(soLuong).fill(rank));
}

// Đánh giá độ mạnh 1 bộ 5 lá. loai: 0=Mậu thầu,1=Đôi,2=Thú,3=Sám cô,
// 4=Sảnh,5=Thùng,6=Cù lũ,7=Tứ quý,8=Thùng phá sảnh
export function danhGia5La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const suits = laBai.map(l => l.suit);
  const laThung = new Set(suits).size === 1;
  let laSanh = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  if (JSON.stringify(ranks) === JSON.stringify([14, 5, 4, 3, 2])) laSanh = true;

  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);
  // Sảnh/Thùng/Thùng phá sảnh/Mậu thầu không có nhóm lá giống nhau (toàn
  // rank khác nhau, trừ trường hợp cù lũ/tứ quý đã tách riêng ở trên) nên
  // `ranks` giảm dần đơn thuần đã đúng thứ tự so sánh — chỉ những loại có
  // đôi/sám cô mới cần `sapXepTheoNhom`.
  const diemNhom = sapXepTheoNhom(ranks);

  if (laSanh && laThung) return { loai: 8, diem: ranks };
  if (cacSoLuong[0] === 4) return { loai: 7, diem: diemNhom };
  if (cacSoLuong[0] === 3 && cacSoLuong[1] === 2) return { loai: 6, diem: diemNhom };
  if (laThung) return { loai: 5, diem: ranks };
  if (laSanh) return { loai: 4, diem: ranks };
  if (cacSoLuong[0] === 3) return { loai: 3, diem: diemNhom };
  if (cacSoLuong[0] === 2 && cacSoLuong[1] === 2) return { loai: 2, diem: diemNhom };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: diemNhom };
  return { loai: 0, diem: ranks };
}

// Đánh giá độ mạnh 1 bộ 3 lá (chi Đầu): 0=Mậu thầu, 1=Đôi, 2=Sám cô
export function danhGia3La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);
  if (cacSoLuong[0] === 3) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: sapXepTheoNhom(ranks) };
  return { loai: 0, diem: ranks };
}

// So sánh 2 kết quả đánh giá: 1 nếu a mạnh hơn, -1 nếu b mạnh hơn, 0 hòa
export function soSanh(a, b) {
  if (a.loai !== b.loai) return a.loai > b.loai ? 1 : -1;
  for (let i = 0; i < Math.min(a.diem.length, b.diem.length); i++) {
    if (a.diem[i] !== b.diem[i]) return a.diem[i] > b.diem[i] ? 1 : -1;
  }
  return 0;
}

// Sắp xếp 1 danh sách lá theo cao->thấp, dùng để hiển thị SAU khi xác nhận
export function sapXepDeHienThi(danhSachLa) {
  return [...danhSachLa].sort((a, b) => b.rank - a.rank);
}

function dieuChinhSoSanhSanhHa(danhGia, ruleset) {
  const laSanhHa = (danhGia.loai === 4 || danhGia.loai === 8)
    && JSON.stringify(danhGia.diem) === JSON.stringify([14, 5, 4, 3, 2]);
  if (!laSanhHa) return danhGia;
  if (ruleset?.sanhHaYeuNhat) {
    return { ...danhGia, diem: [5, 4, 3, 2, 1] };
  }
  return danhGia;
}

export function xepBaiHopLe(chiDau, chiGiua, chiCuoi, ruleset) {
  const dDau = danhGia3La(chiDau), dGiua = danhGia5La(chiGiua), dCuoi = danhGia5La(chiCuoi);
  const sGiua = dieuChinhSoSanhSanhHa(dGiua, ruleset);
  const sCuoi = dieuChinhSoSanhSanhHa(dCuoi, ruleset);
  if (soSanh(sCuoi, sGiua) < 0) return false;
  // Quy đổi loại của Đầu (3 lá: 0=Mậu thầu/1=Đôi/2=Sám cô) sang ĐÚNG thang
  // loại của Giữa (5 lá: Sám cô=3) rồi so sánh ĐẦY ĐỦ cả loại LẪN điểm số
  // trong cùng loại (dùng lại `soSanh`) — trước đây chỉ so `loai` suông
  // nên bỏ lọt trường hợp CÙNG loại nhưng Đầu mạnh hơn Giữa (vd Đầu đôi Á
  // vẫn bị coi hợp lệ dù so với Giữa đôi Q, trong khi đôi Á > đôi Q nghĩa
  // là Đầu mạnh hơn Giữa — thực chất là lủng).
  const dDauTren5 = { loai: dDau.loai === 2 ? 3 : dDau.loai, diem: dDau.diem };
  return soSanh(sGiua, dDauTren5) >= 0;
}

function maLoaiChiTiet(danhGia, tenChi) {
  if (tenChi === 'dau' && danhGia.loai === 2 && danhGia.diem[0] === 14) return '2_A';
  if (tenChi !== 'dau' && danhGia.loai === 7) {
    const dem = {};
    danhGia.diem.forEach(r => { dem[r] = (dem[r] || 0) + 1; });
    const rankBo4 = Number(Object.keys(dem).find(r => dem[r] === 4));
    if (rankBo4 === 14) return '7_A';
  }
  if (danhGia.loai === 8) {
    const r = JSON.stringify(danhGia.diem);
    if (r === JSON.stringify([14, 13, 12, 11, 10])) return '8_thuong';
    if (r === JSON.stringify([14, 5, 4, 3, 2])) return '8_ha';
  }
  return String(danhGia.loai);
}

function diemMotChi(ruleset, tenChi, danhGiaBenThang) {
  const goc = ruleset.pointsPerChi[tenChi];
  const ma = maLoaiChiTiet(danhGiaBenThang, tenChi);

  if (tenChi === 'giua') {
    const bangCuoi = ruleset.bonusTheoLoai.cuoi || {};
    if (Object.prototype.hasOwnProperty.call(bangCuoi, ma)) return bangCuoi[ma] * 2;
    return goc;
  }
  const bang = ruleset.bonusTheoLoai[tenChi] || {};
  if (Object.prototype.hasOwnProperty.call(bang, ma)) return bang[ma];
  return goc;
}

function demSoLaA(nguoiChoi) {
  return [...nguoiChoi.chiDau, ...nguoiChoi.chiGiua, ...nguoiChoi.chiCuoi]
    .filter(l => l.rank === 14).length;
}

function diemMotChiChiTiet(ruleset, tenChi, danhGiaBenThang) {
  const goc = ruleset.pointsPerChi[tenChi];
  const ma = maLoaiChiTiet(danhGiaBenThang, tenChi);
  if (tenChi === 'giua') {
    const bangCuoi = ruleset.bonusTheoLoai.cuoi || {};
    if (Object.prototype.hasOwnProperty.call(bangCuoi, ma)) return { diem: bangCuoi[ma] * 2, ma };
    return { diem: goc, ma };
  }
  const bang = ruleset.bonusTheoLoai[tenChi] || {};
  if (Object.prototype.hasOwnProperty.call(bang, ma)) return { diem: bang[ma], ma };
  return { diem: goc, ma };
}

const TEN_LOAI_3_LA_GT = { '0': 'Mậu thầu', '1': 'Đôi', '2': 'Sám cô', '2_A': 'Sám cô toàn Á' };
const TEN_LOAI_5_LA_GT = {
  '0': 'Mậu thầu', '1': 'Đôi', '2': 'Thú', '3': 'Sám cô', '4': 'Sảnh', '5': 'Thùng',
  '6': 'Cù lũ', '7': 'Tứ quý', '7_A': 'Tứ quý toàn Á', '8': 'Thùng phá sảnh',
  '8_thuong': 'Thùng phá sảnh Thượng', '8_ha': 'Thùng phá sảnh Hạ',
};
function tenLoaiChiTiet(tenChi, ma) {
  return (tenChi === 'dau' ? TEN_LOAI_3_LA_GT : TEN_LOAI_5_LA_GT)[ma] || ma;
}

function soBai2Nguoi(ruleset, a, b) {
  const dDauA = danhGia3La(a.chiDau), dDauB = danhGia3La(b.chiDau);
  const dGiuaA = danhGia5La(a.chiGiua), dGiuaB = danhGia5La(b.chiGiua);
  const dCuoiA = danhGia5La(a.chiCuoi), dCuoiB = danhGia5La(b.chiCuoi);

  const sGiuaA = dieuChinhSoSanhSanhHa(dGiuaA, ruleset);
  const sGiuaB = dieuChinhSoSanhSanhHa(dGiuaB, ruleset);
  const sCuoiA = dieuChinhSoSanhSanhHa(dCuoiA, ruleset);
  const sCuoiB = dieuChinhSoSanhSanhHa(dCuoiB, ruleset);

  const aHopLe = xepBaiHopLe(a.chiDau, a.chiGiua, a.chiCuoi, ruleset);
  const bHopLe = xepBaiHopLe(b.chiDau, b.chiGiua, b.chiCuoi, ruleset);

  let diemA, diemB, aSap, bSap;
  const dienGiai = [];

  if (ruleset.binhLungPenalty.enabled && aHopLe !== bHopLe) {
    const benLung = aHopLe ? b : a;
    const benHopLe = aHopLe ? a : b;
    const kqDau = diemMotChiChiTiet(ruleset, 'dau', danhGia3La(benHopLe.chiDau));
    const kqGiua = diemMotChiChiTiet(ruleset, 'giua', danhGia5La(benHopLe.chiGiua));
    const kqCuoi = diemMotChiChiTiet(ruleset, 'cuoi', danhGia5La(benHopLe.chiCuoi));
    const tong = kqDau.diem + kqGiua.diem + kqCuoi.diem;
    const coNhanSap = ruleset.binhLungPenalty.countAsSap && ruleset.sapBonus.enabled;
    const daNhan = coNhanSap ? tong * ruleset.sapBonus.multiplier : tong;
    const diemHopLe = benHopLe === a ? daNhan : -daNhan;
    diemA = diemHopLe; diemB = -diemHopLe;
    aSap = benHopLe === a; bSap = benHopLe === b;

    dienGiai.push(`${benLung === a ? 'Bạn' : 'Đối thủ'} xếp bài KHÔNG HỢP LỆ (binh lủng) → thua trắng cả 3 chi.`);
    dienGiai.push(
      `Bên hợp lệ tính theo bài thật: Đầu(${tenLoaiChiTiet('dau', kqDau.ma)})=${kqDau.diem}, ` +
      `Giữa(${tenLoaiChiTiet('giua', kqGiua.ma)})=${kqGiua.diem}, Cuối(${tenLoaiChiTiet('cuoi', kqCuoi.ma)})=${kqCuoi.diem}` +
      ` → tổng ${tong}` + (coNhanSap ? ` × ${ruleset.sapBonus.multiplier} (tính như ăn sập) = ${daNhan}` : '')
    );
  } else {
    const soDau = soSanh(dDauA, dDauB);
    const soGiua = soSanh(sGiuaA, sGiuaB);
    const soCuoi = soSanh(sCuoiA, sCuoiB);

    const kqDau = diemMotChiChiTiet(ruleset, 'dau', soDau > 0 ? dDauA : dDauB);
    const kqGiua = diemMotChiChiTiet(ruleset, 'giua', soGiua > 0 ? dGiuaA : dGiuaB);
    const kqCuoi = diemMotChiChiTiet(ruleset, 'cuoi', soCuoi > 0 ? dCuoiA : dCuoiB);

    const vDau = soDau === 0 ? 0 : kqDau.diem;
    const vGiua = soGiua === 0 ? 0 : kqGiua.diem;
    const vCuoi = soCuoi === 0 ? 0 : kqCuoi.diem;

    diemA = (soDau > 0 ? vDau : soDau < 0 ? -vDau : 0)
      + (soGiua > 0 ? vGiua : soGiua < 0 ? -vGiua : 0)
      + (soCuoi > 0 ? vCuoi : soCuoi < 0 ? -vCuoi : 0);

    dienGiai.push(
      soDau === 0 ? 'Chi Đầu: hòa (0)' : `Chi Đầu: ${soDau > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('dau', kqDau.ma)} → ${soDau > 0 ? '+' : '-'}${vDau}`,
      soGiua === 0 ? 'Chi Giữa: hòa (0)' : `Chi Giữa: ${soGiua > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('giua', kqGiua.ma)} → ${soGiua > 0 ? '+' : '-'}${vGiua}`,
      soCuoi === 0 ? 'Chi Cuối: hòa (0)' : `Chi Cuối: ${soCuoi > 0 ? 'Bạn' : 'Đối thủ'} thắng bằng ${tenLoaiChiTiet('cuoi', kqCuoi.ma)} → ${soCuoi > 0 ? '+' : '-'}${vCuoi}`,
      `Cộng 3 chi: ${diemA >= 0 ? '+' : ''}${diemA}`
    );

    aSap = soDau > 0 && soGiua > 0 && soCuoi > 0;
    bSap = soDau < 0 && soGiua < 0 && soCuoi < 0;
    if (ruleset.sapBonus.enabled && (aSap || bSap)) {
      const truoc = diemA;
      diemA *= ruleset.sapBonus.multiplier;
      dienGiai.push(`${aSap ? 'Bạn' : 'Đối thủ'} thắng cả 3 chi (ăn sập) → ${truoc} × ${ruleset.sapBonus.multiplier} = ${diemA}`);
    }
    diemB = -diemA;
  }

  return { diemA, diemB, aSap, bSap, dienGiai };
}

export function tinhDiem(nguoiChoi, ruleset) {
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  const ketQuaCap = [];
  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      ketQuaCap.push({ i, j, ...soBai2Nguoi(ruleset, nguoiChoi[i], nguoiChoi[j]) });
    }
  }

  const soDoiThu = nguoiChoi.length - 1;
  const demSap = nguoiChoi.map(() => 0);
  ketQuaCap.forEach(({ i, j, aSap, bSap }) => {
    if (aSap) demSap[i]++;
    if (bSap) demSap[j]++;
  });
  const heSoSapLang = ruleset.sapLangBonus?.enabled === false ? 1 : (ruleset.sapLangBonus?.multiplier ?? 2);
  const laSapLang = demSap.map(dem => soDoiThu > 0 && dem === soDoiThu);

  ketQuaCap.forEach(({ i, j, diemA, diemB, dienGiai }) => {
    let dA = diemA, dB = diemB;
    const ghiChuSapLang = [];
    if (laSapLang[i] || laSapLang[j]) {
      dA *= heSoSapLang; dB *= heSoSapLang;
      ghiChuSapLang.push(`${laSapLang[i] ? nguoiChoi[i].ten : nguoiChoi[j].ten} ăn sập TẤT CẢ đối thủ trong ván (sập làng) → nhân thêm × ${heSoSapLang}`);
    }
    diem[nguoiChoi[i].ten] += dA;
    diem[nguoiChoi[j].ten] += dB;

    dienGiaiTheoDoiThu[nguoiChoi[i].ten].push({ doiThu: nguoiChoi[j].ten, dienGiai: [...dienGiai, ...ghiChuSapLang], diemNhanDuoc: dA });
    dienGiaiTheoDoiThu[nguoiChoi[j].ten].push({ doiThu: nguoiChoi[i].ten, dienGiai: [...dienGiai, ...ghiChuSapLang], diemNhanDuoc: dB });
  });

  const diemAConfig = ruleset.diemA;
  if (diemAConfig && diemAConfig.enabled !== false && diemAConfig.diem) {
    nguoiChoi.forEach(p => {
      const soLaA = demSoLaA(p);
      const congThem = diemAConfig.diem * (soLaA - 1);
      diem[p.ten] += congThem;
      dienGiaiTheoDoiThu[p.ten].push({
        doiThu: null,
        dienGiai: [`Chi Á: có ${soLaA} lá Á × ${diemAConfig.diem} - ${diemAConfig.diem} = ${congThem >= 0 ? '+' : ''}${congThem} (tính riêng, không theo từng đối thủ)`],
        diemNhanDuoc: congThem,
      });
    });
  }

  return { diem, dienGiaiTheoDoiThu };
}

// ==================== LUẬT THẮNG TRẮNG (V4) ====================

function demSoLuongTheoRank(ca13La) {
  const dem = {};
  ca13La.forEach(l => { dem[l.rank] = (dem[l.rank] || 0) + 1; });
  return dem;
}

function laRongCuon(ca13La) {
  return new Set(ca13La.map(l => l.suit)).size === 1;
}

function laSanhRong(ca13La) {
  const rankSet = new Set(ca13La.map(l => l.rank));
  const suitSet = new Set(ca13La.map(l => l.suit));
  return rankSet.size === 13 && suitSet.size > 1;
}

function laNamDoiMotSam(ca13La) {
  const soLuong = Object.values(demSoLuongTheoRank(ca13La)).sort((a, b) => b - a);
  return soLuong.length === 6 && soLuong[0] === 3 && soLuong.slice(1).every(x => x === 2);
}

function laLucPheBon(ca13La) {
  const soLuong = Object.values(demSoLuongTheoRank(ca13La)).sort((a, b) => b - a);
  return soLuong.length === 7 && soLuong.slice(0, 6).every(x => x === 2) && soLuong[6] === 1;
}

function laNamDoiThong(ca13La) {
  const dem = demSoLuongTheoRank(ca13La);
  for (let r = 2; r <= 10; r++) {
    let du = true;
    for (let k = 0; k < 5; k++) {
      if ((dem[r + k] || 0) < 2) { du = false; break; }
    }
    if (du) return true;
  }
  return false;
}

function coBaThung(ca13La) {
  const demChat = [0, 0, 0, 0];
  ca13La.forEach(l => { demChat[l.suit]++; });
  for (let sA = 0; sA < 4; sA++) {
    for (let sB = 0; sB < 4; sB++) {
      for (let sC = 0; sC < 4; sC++) {
        const can = [0, 0, 0, 0];
        can[sA] += 3; can[sB] += 5; can[sC] += 5;
        if (can.every((c, i) => demChat[i] >= c)) return true;
      }
    }
  }
  return false;
}

function coBaSanh(ca13La) {
  const dem = demSoLuongTheoRank(ca13La);
  const capDau = [];
  for (let r = 2; r <= 12; r++) capDau.push([r, r + 1, r + 2]);
  const capGiuaCuoi = [];
  for (let r = 2; r <= 10; r++) capGiuaCuoi.push([r, r + 1, r + 2, r + 3, r + 4]);

  for (const d of capDau) {
    for (const g of capGiuaCuoi) {
      for (const c of capGiuaCuoi) {
        const canDem = {};
        [...d, ...g, ...c].forEach(r => { canDem[r] = (canDem[r] || 0) + 1; });
        const du = Object.entries(canDem).every(([r, soCan]) => (dem[r] || 0) >= soCan);
        if (du) return true;
      }
    }
  }
  return false;
}

const TEN_THANG_TRANG = {
  rongCuon: 'Rồng cuốn',
  sanhRong: 'Sảnh rồng',
  namDoiMotSam: 'Năm đôi 1 sám',
  lucPheBon: 'Lục phé bôn',
  namDoiThong: 'Năm đôi thông',
  baThung: 'Ba thùng',
  baSanh: 'Ba sảnh',
};

const THU_TU_UU_TIEN_THANG_TRANG = [
  { ma: 'rongCuon', kiemTra: laRongCuon },
  { ma: 'sanhRong', kiemTra: laSanhRong },
  { ma: 'namDoiMotSam', kiemTra: laNamDoiMotSam },
  { ma: 'lucPheBon', kiemTra: laLucPheBon },
  { ma: 'namDoiThong', kiemTra: laNamDoiThong },
  { ma: 'baThung', kiemTra: coBaThung },
  { ma: 'baSanh', kiemTra: coBaSanh },
];

export function kiemTraThangTrang(ca13La) {
  for (const { ma, kiemTra } of THU_TU_UU_TIEN_THANG_TRANG) {
    if (kiemTra(ca13La)) return ma;
  }
  return null;
}

// Xếp lại 13 lá của người THẮNG TRẮNG thành 3 chi CHỈ ĐỂ HIỂN THỊ (không
// ảnh hưởng điểm số — thắng trắng luôn tính thẳng theo `ca13La`, không
// qua chi) — sao cho nhìn vào là thấy NGAY vì sao thắng, thay vì giữ
// nguyên cách chia của `aiXepBai` (chỉ nhằm mục đích hợp lệ theo luật
// thường, không liên quan gì tới việc chứng minh loại thắng trắng).
export function xepBaiThangTrangDeXem(ca13La, loai) {
  if (loai === 'baThung') {
    // Toán học: 13 lá chia 4 chất mà thỏa "3 thùng" (1 chi 3 lá + 2 chi 5
    // lá CÙNG CHẤT) thì bắt buộc đúng 3 chất được dùng với số lá CHÍNH
    // XÁC 3/5/5 (chất còn lại 0 lá) — không có cách chia nào khác thỏa
    // được đồng thời cả 3 điều kiện trên 13 lá. Nên chỉ cần gom theo
    // chất rồi gán đúng nhóm-3-lá vào Đầu, 2 nhóm-5-lá vào Giữa/Cuối.
    const theoChat = [[], [], [], []];
    ca13La.forEach(l => theoChat[l.suit].push(l));
    theoChat.forEach(ds => ds.sort((a, b) => b.rank - a.rank));
    const idx3 = theoChat.findIndex(ds => ds.length === 3);
    const idx5s = [0, 1, 2, 3].filter(i => theoChat[i].length === 5);
    if (idx3 !== -1 && idx5s.length === 2) {
      return { chiDau: theoChat[idx3], chiGiua: theoChat[idx5s[0]], chiCuoi: theoChat[idx5s[1]] };
    }
  }

  if (loai === 'rongCuon' || loai === 'sanhRong') {
    // Rồng cuốn (13 lá cùng 1 chất): chia kiểu gì cũng ra 3 thùng cùng
    // chất, nên sắp theo rank cho gọn mắt. Sảnh rồng (đủ 13 rank liên
    // tiếp 2→A): chia theo DÃY RANK LIÊN TỤC để mỗi chi TỰ NÓ cũng là 1
    // sảnh nhỏ, thấy rõ tính "liên tục" của cả bộ bài.
    const daSap = [...ca13La].sort((a, b) => a.rank - b.rank);
    return { chiDau: daSap.slice(0, 3), chiGiua: daSap.slice(3, 8), chiCuoi: daSap.slice(8, 13) };
  }

  // Các loại còn lại (đôi/sám/thông...) không chia KHỚP TUYỆT ĐỐI ranh
  // giới 3/5/5 được (vd 5 đôi = 10 lá không chia đều 5/5 theo từng đôi
  // trọn vẹn) — nhưng vẫn gom các lá CÙNG RANK đứng CẠNH NHAU (nhóm đông
  // trước, rank cao trước) để dễ nhận ra đôi/sám hơn nhiều so với thứ tự
  // tùy tiện của `aiXepBai`.
  const theoRank = {};
  ca13La.forEach(l => { (theoRank[l.rank] ??= []).push(l); });
  const daGom = Object.values(theoRank)
    .sort((a, b) => b.length - a.length || b[0].rank - a[0].rank)
    .flat();
  return { chiDau: daGom.slice(0, 3), chiGiua: daGom.slice(3, 8), chiCuoi: daGom.slice(8, 13) };
}

// Điểm 1 người nhận được từ MỖI đối thủ nếu thắng trắng bằng loại "loai"
export function diemThangTrangMotNguoi(ruleset, loai) {
  if (ruleset.thangTrang?.dungMucSapLang) {
    const co3Chi = ruleset.pointsPerChi.dau + ruleset.pointsPerChi.giua + ruleset.pointsPerChi.cuoi;
    const heSoSap = ruleset.sapBonus.enabled ? ruleset.sapBonus.multiplier : 1;
    const heSoSapLang = ruleset.sapLangBonus?.enabled === false ? 1 : (ruleset.sapLangBonus?.multiplier ?? 2);
    return co3Chi * heSoSap * heSoSapLang;
  }
  return ruleset.thangTrang?.diem?.[loai] ?? 0;
}

// Tính điểm từ 1 mảng "ketQuaLoai" đã biết sẵn (mỗi phần tử là mã loại
// thắng trắng của người tương ứng, hoặc null nếu người đó không thắng
// trắng). Dùng chung cho cả tự động (AI) và báo Ù đúng (Bạn).
function tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai) {
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      const loaiI = ketQuaLoai[i], loaiJ = ketQuaLoai[j];
      if (!loaiI && !loaiJ) continue;

      let dA = 0;
      const dg = [];
      if (loaiI) {
        const v = diemThangTrangMotNguoi(ruleset, loaiI);
        dA += v;
        dg.push(`${nguoiChoi[i].ten} thắng trắng bằng "${TEN_THANG_TRANG[loaiI]}" → +${v}`);
      }
      if (loaiJ) {
        const v = diemThangTrangMotNguoi(ruleset, loaiJ);
        dA -= v;
        dg.push(`${nguoiChoi[j].ten} thắng trắng bằng "${TEN_THANG_TRANG[loaiJ]}" → +${v} cho ${nguoiChoi[j].ten}`);
      }
      diem[nguoiChoi[i].ten] += dA;
      diem[nguoiChoi[j].ten] -= dA;
      dienGiaiTheoDoiThu[nguoiChoi[i].ten].push({ doiThu: nguoiChoi[j].ten, dienGiai: dg, diemNhanDuoc: dA });
      dienGiaiTheoDoiThu[nguoiChoi[j].ten].push({ doiThu: nguoiChoi[i].ten, dienGiai: dg, diemNhanDuoc: -dA });
    }
  }

  return { diem, dienGiaiTheoDoiThu, ketQuaLoai };
}

export function tinhDiemThangTrang(nguoiChoi, ruleset) {
  if (!ruleset.thangTrang || ruleset.thangTrang.enabled === false) return null;
  const ketQuaLoai = nguoiChoi.map(p => kiemTraThangTrang(p.ca13La));
  if (!ketQuaLoai.some(l => l !== null)) return null;
  return tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai);
}

// Tự động kiểm tra thắng trắng CHỈ CHO 3 ĐỐI THỦ AI — người chơi tên
// "Bạn" KHÔNG được tự động kiểm tra nữa (dù bài họ có đủ điều kiện), họ
// phải chủ động bấm "Báo Ù" (xem tinhDiemBaoUDung/tinhDiemBaoUSai).
export function tinhDiemThangTrangAI(nguoiChoi, ruleset) {
  if (!ruleset.thangTrang || ruleset.thangTrang.enabled === false) return null;
  const ketQuaLoai = nguoiChoi.map(p => p.ten === 'Bạn' ? null : kiemTraThangTrang(p.ca13La));
  if (!ketQuaLoai.some(l => l !== null)) return null;
  return tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai);
}

// Người chơi CHỦ ĐỘNG báo Ù — kiểm tra THẬT bài của "Bạn". Trả về null
// nếu bài KHÔNG đủ điều kiện (App.jsx khi đó phải gọi tinhDiemBaoUSai
// thay vì hàm này).
export function tinhDiemBaoUDung(nguoiChoi, ruleset) {
  const ketQuaLoai = nguoiChoi.map(p => p.ten === 'Bạn' ? kiemTraThangTrang(p.ca13La) : null);
  if (!ketQuaLoai[0]) return null;
  return tinhDiemTuKetQuaLoai(nguoiChoi, ruleset, ketQuaLoai);
}

// Người chơi báo Ù nhưng SAI (bài không đủ điều kiện) — phạt 1 mức cố
// định (ruleset.thangTrang.phatBaoUSai) cho MỖI đối thủ.
export function tinhDiemBaoUSai(nguoiChoi, ruleset) {
  const mucPhat = ruleset.thangTrang?.phatBaoUSai ?? 6;
  const diem = {};
  const dienGiaiTheoDoiThu = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; dienGiaiTheoDoiThu[p.ten] = []; });

  nguoiChoi.forEach(doiThu => {
    if (doiThu.ten === 'Bạn') return;
    diem['Bạn'] -= mucPhat;
    diem[doiThu.ten] += mucPhat;
    const dg = [`Bạn báo Ù nhưng SAI (bài không đủ điều kiện thắng trắng) → phạt ${mucPhat} cho ${doiThu.ten}`];
    dienGiaiTheoDoiThu['Bạn'].push({ doiThu: doiThu.ten, dienGiai: dg, diemNhanDuoc: -mucPhat });
    dienGiaiTheoDoiThu[doiThu.ten].push({ doiThu: 'Bạn', dienGiai: dg, diemNhanDuoc: mucPhat });
  });

  return { diem, dienGiaiTheoDoiThu };
}
