// ruleset.js
// Nguồn sự thật duy nhất cho toàn bộ luật tính điểm Mậu Binh trong app.
// "chuan" là bộ luật mặc định — tổng hợp và đối chiếu khớp nhau giữa
// nhiều nguồn Mậu Binh online độc lập, đã hiệu chỉnh theo xác nhận của Huy.

export const RULESET_PRESETS = [
  {
    id: 'chuan',
    ten: 'Chuẩn (phổ biến nhất)',
    moTa: 'Sám cô chi Đầu +3 (Sám A +12). Chi Cuối: Tứ quý +4 (Tứ quý A +16), Thùng phá sảnh +5 (Thượng +10, Hạ +7). Chi Giữa tự động = 2x Chi Cuối. Ăn sập x2, sập làng x2 nữa. Chi Á: 1 điểm/lá.',
    ruleset: {
      version: 6,
      pointsPerChi: { dau: 1, giua: 1, cuoi: 1 },
      bonusTheoLoai: {
        dau: { 2: 3, '2_A': 12 },
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
    },
  },
];

export function timPreset(id) {
  return RULESET_PRESETS.find(p => p.id === id) || RULESET_PRESETS.find(p => p.id === 'chuan') || RULESET_PRESETS[0];
}

export function layRulesetTuPreset(id) {
  return JSON.parse(JSON.stringify(timPreset(id).ruleset));
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
