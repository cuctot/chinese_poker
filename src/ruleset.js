// ruleset.js
// Nguồn sự thật duy nhất cho toàn bộ luật tính điểm Mậu Binh trong app.
// "chuan" là bộ luật mặc định — tổng hợp và đối chiếu khớp nhau giữa
// nhiều nguồn Mậu Binh online độc lập, đã hiệu chỉnh theo xác nhận của Huy.

export const RULESET_PRESETS = [
  {
    id: 'chuan',
    ten: 'Chuẩn (phổ biến nhất)',
    moTa: 'Sám cô chi Đầu +3 (Sám A +12). Chi Giữa: Cù lũ +2, Tứ quý +8 (Tứ quý A +32), Thùng phá sảnh +10 (Thượng +20, Hạ +14). Chi Cuối: Tứ quý +4 (Tứ quý A +16), Thùng phá sảnh +5 (Thượng +10, Hạ +7). Ăn sập x2, sập làng x2 nữa. Chi Á: 1 điểm/lá.',
    ruleset: {
      version: 6,
      pointsPerChi: { dau: 1, giua: 1, cuoi: 1 },
      bonusTheoLoai: {
        dau: { 2: 3, '2_A': 12 },
        giua: { 6: 2, 7: 8, '7_A': 32, 8: 10, '8_thuong': 20, '8_ha': 14 },
        cuoi: { 7: 4, '7_A': 16, 8: 5, '8_thuong': 10, '8_ha': 7 },
      },
      sapBonus: { enabled: true, multiplier: 2 },
      sapLangBonus: { enabled: true, multiplier: 2 },
      binhLungPenalty: { enabled: true, countAsSap: true },
      sanhHaYeuNhat: false,
      diemA: { enabled: true, diem: 1 },
      thangTrang: {
        enabled: true,
        dungMucSapLang: false,
        phatBaoUSai: 6,
        diem: { rongCuon: 24, sanhRong: 12, namDoiMotSam: 6, lucPheBon: 6, namDoiThong: 6, baThung: 6, baSanh: 6 },
      },
      thoiGianXepBai: { batBuoc: true, giay: 60 },
    },
  },
];

export function timPreset(id) {
  return RULESET_PRESETS.find(p => p.id === id) || RULESET_PRESETS.find(p => p.id === 'chuan') || RULESET_PRESETS[0];
}

export function layRulesetTuPreset(id) {
  return JSON.parse(JSON.stringify(timPreset(id).ruleset));
}

// Di trú ruleset ĐÃ LƯU từ trước V10: lúc đó Chi Giữa chưa có bảng bonus
// riêng (tự động = 2× Chi Cuối), nên bonusTheoLoai.giua không tồn tại
// trong dữ liệu cũ. Backfill 1 LẦN lúc đọc lên bằng đúng công thức cũ —
// sau đó ruleset có bảng `giua` độc lập hoàn toàn, y hệt ruleset mới.
export function damBaoBonusGiuaDayDu(ruleset) {
  if (ruleset.bonusTheoLoai.giua) return ruleset;
  const cuoi = ruleset.bonusTheoLoai.cuoi || {};
  const giua = { '6': 2 };
  for (const ma of ['7', '7_A', '8', '8_thuong', '8_ha']) {
    if (cuoi[ma] !== undefined) giua[ma] = cuoi[ma] * 2;
  }
  ruleset.bonusTheoLoai.giua = giua;
  return ruleset;
}

export function isValidRuleset(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.version !== 'number') return false;
  if (!obj.pointsPerChi || typeof obj.pointsPerChi.dau !== 'number') return false;
  if (!obj.bonusTheoLoai || typeof obj.bonusTheoLoai !== 'object') return false;
  if (!obj.sapBonus || typeof obj.sapBonus.multiplier !== 'number') return false;
  if (!obj.binhLungPenalty || typeof obj.binhLungPenalty.enabled !== "boolean") return false;
  if (typeof obj.sanhHaYeuNhat !== "boolean") return false;
  if (!obj.diemA || typeof obj.diemA.enabled !== "boolean" || typeof obj.diemA.diem !== "number") return false;
  if (!obj.thangTrang || typeof obj.thangTrang.enabled !== "boolean") return false;
  if (typeof obj.thangTrang.dungMucSapLang !== "boolean") return false;
  if (!obj.thangTrang.diem || typeof obj.thangTrang.diem !== "object") return false;
  return true;
}
