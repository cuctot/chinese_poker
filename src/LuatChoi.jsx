import { useState } from 'react'
import { RULESET_PRESETS } from './ruleset.js'

const TEN_LOAI_3_LA = ['Mậu thầu', 'Đôi', 'Sám cô'];
const TEN_LOAI_5_LA = ['Mậu thầu', 'Đôi', 'Thú', 'Sám cô', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'];
// Chỉ số (loai) THỰC SỰ có thể có bonus riêng ở mỗi bảng — dùng để ẨN các
// dòng không bao giờ có bonus (luôn = điểm gốc), giữ nguyên chỉ số mảng
// TEN_LOAI_3_LA/TEN_LOAI_5_LA để tránh lệch vị trí.
const LOAI_CO_THE_CO_BONUS_CHI_DAU = [2]; // chỉ Sám cô
const LOAI_CO_THE_CO_BONUS_CHI_GIUA = [6, 7, 8]; // Cù lũ, Tứ quý, Thùng phá sảnh
const LOAI_CO_THE_CO_BONUS_CHI_CUOI = [7, 8]; // Tứ quý, Thùng phá sảnh (Cù lũ KHÔNG có bonus ở Chi Cuối)
const TEN_THANG_TRANG = [
  { ma: 'rongCuon', ten: 'Rồng cuốn (13 lá cùng chất)' },
  { ma: 'sanhRong', ten: 'Sảnh rồng (đủ 13 rank, khác chất)' },
  { ma: 'namDoiMotSam', ten: 'Năm đôi 1 sám' },
  { ma: 'lucPheBon', ten: 'Lục phé bôn (6 đôi + 1 lẻ)' },
  { ma: 'namDoiThong', ten: 'Năm đôi thông' },
  { ma: 'baThung', ten: 'Ba thùng' },
  { ma: 'baSanh', ten: 'Ba sảnh' },
];

function LuatChoi({ presetId, daTuyChinh, ruleset, presetRieng, onChonPreset, onChange, onReset, onLuuPresetRieng, onXoaPresetRieng }) {
  const [tenMoi, setTenMoi] = useState('');

  function suaRuleset(hamSua) {
    const banSao = JSON.parse(JSON.stringify(ruleset));
    hamSua(banSao);
    onChange(banSao);
  }

  function suaDiemGoc(tenChi, giaTri) {
    suaRuleset(r => { r.pointsPerChi[tenChi] = Number(giaTri) || 0; });
  }

  function suaBonus(tenChi, loai, giaTri) {
    suaRuleset(r => {
      if (!r.bonusTheoLoai[tenChi]) r.bonusTheoLoai[tenChi] = {};
      r.bonusTheoLoai[tenChi][loai] = Number(giaTri) || 0;
    });
  }

  function veBangBonus(tenChi, nhan, danhSachTenLoai, dacBiet = [], loaiChoPhep = null) {
    return (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Bonus theo loại bài — {nhan}</div>
        <div className="bang-bonus">
          {danhSachTenLoai.map((tenLoai, loai) => {
            if (loaiChoPhep && !loaiChoPhep.includes(loai)) return null; // ẩn dòng không thể có bonus
            return (
              <div key={loai} className="dong-bonus dong-thong-so">
                <span>{tenLoai}</span>
                <input
                  type="number"
                  value={ruleset.bonusTheoLoai[tenChi]?.[loai] || 0}
                  onChange={e => suaBonus(tenChi, loai, e.target.value)}
                />
              </div>
            );
          })}
          {dacBiet.map(({ ma, ten }) => (
            <div key={ma} className="dong-bonus dong-bonus-dac-biet dong-thong-so">
              <span>{ten}</span>
              <input
                type="number"
                value={ruleset.bonusTheoLoai[tenChi]?.[ma] || 0}
                onChange={e => suaBonus(tenChi, ma, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const danhSachPreset = [...RULESET_PRESETS, ...presetRieng];
  const presetHienTai = danhSachPreset.find(p => p.id === presetId);

  return (
    <div className="trang-luat-choi">
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chọn bộ luật có sẵn</div>
        <div className="danh-sach-preset">
          {danhSachPreset.map(p => (
            <div key={p.id} className={p.id === presetId ? 'the-preset the-preset-dang-chon' : 'the-preset'}>
              <div className="the-preset-ten">{p.ten}{p.rieng && ' (riêng)'}</div>
              {p.moTa && <div className="the-preset-mo-ta">{p.moTa}</div>}
              <div className="the-preset-nut">
                <button onClick={() => onChonPreset(p.id)}>
                  {p.id === presetId ? 'Đang dùng' : 'Tải bộ luật này'}
                </button>
                {p.rieng && (
                  <button className="nut-xoa-preset" onClick={() => onXoaPresetRieng(p.id)}>Xóa</button>
                )}
              </div>
            </div>
          ))}
        </div>
        {daTuyChinh && (
          <p className="ghi-chu-tuy-chinh">
            Bạn đã chỉnh tay so với bộ "{presetHienTai?.ten}" gốc.
          </p>
        )}

        <div className="khoi-luu-rieng">
          <input
            type="text"
            placeholder="Đặt tên cho luật riêng của bạn..."
            value={tenMoi}
            onChange={e => setTenMoi(e.target.value)}
          />
          <button
            onClick={() => { onLuuPresetRieng(tenMoi); setTenMoi(''); }}
            disabled={!tenMoi.trim()}
          >
            Lưu thành luật riêng
          </button>
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Điểm gốc mỗi chi thắng/thua</div>
        <div className="dong-diem-goc">
          {['dau', 'giua', 'cuoi'].map(tenChi => (
            <div key={tenChi} className="dong-thong-so">
              <span>{tenChi === 'dau' ? 'Chi Đầu' : tenChi === 'giua' ? 'Chi Giữa' : 'Chi Cuối'}</span>
              <input
                type="number"
                value={ruleset.pointsPerChi[tenChi]}
                onChange={e => suaDiemGoc(tenChi, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Các trường hợp thắng trắng</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.thangTrang?.enabled !== false}
            onChange={e => suaRuleset(r => {
              if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
              r.thangTrang.enabled = e.target.checked;
            })}
          />
          Bật luật thắng trắng (thắng ngay, không cần so từng chi)
        </label>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={!!ruleset.thangTrang?.dungMucSapLang}
            onChange={e => suaRuleset(r => {
              if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
              r.thangTrang.dungMucSapLang = e.target.checked;
            })}
          />
          Tính theo mức Ăn sập làng (thay vì dùng bảng điểm cố định bên dưới)
        </label>
        <div className="dong-thong-so">
          <span>Mức phạt nếu Báo thắng trắng sai (mỗi đối thủ)</span>
          <input
            type="number"
            value={ruleset.thangTrang?.phatBaoUSai ?? 6}
            onChange={e => suaRuleset(r => {
              if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
              r.thangTrang.phatBaoUSai = Number(e.target.value) || 0;
            })}
          />
        </div>
        <div className="bang-bonus">
          {TEN_THANG_TRANG.map(({ ma, ten }) => (
            <div key={ma} className="dong-bonus dong-thong-so">
              <span>{ten}</span>
              <input
                type="number"
                value={ruleset.thangTrang?.diem?.[ma] ?? 0}
                disabled={!!ruleset.thangTrang?.dungMucSapLang}
                onChange={e => suaRuleset(r => {
                  if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
                  if (!r.thangTrang.diem) r.thangTrang.diem = {};
                  r.thangTrang.diem[ma] = Number(e.target.value) || 0;
                })}
              />
            </div>
          ))}
        </div>
      </div>

      {veBangBonus('cuoi', 'Chi Cuối (5 lá)', TEN_LOAI_5_LA, [
        { ma: '7_A', ten: 'Tứ quý A (AAAA)' },
        { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng (10-J-Q-K-A)' },
        { ma: '8_ha', ten: 'Thùng phá sảnh Hạ (A-2-3-4-5)' },
      ], LOAI_CO_THE_CO_BONUS_CHI_CUOI)}

      {veBangBonus('giua', 'Chi Giữa (5 lá)', TEN_LOAI_5_LA, [
        { ma: '7_A', ten: 'Tứ quý A (AAAA)' },
        { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng (10-J-Q-K-A)' },
        { ma: '8_ha', ten: 'Thùng phá sảnh Hạ (A-2-3-4-5)' },
      ], LOAI_CO_THE_CO_BONUS_CHI_GIUA)}

      {veBangBonus('dau', 'Chi Đầu (3 lá)', TEN_LOAI_3_LA, [
        { ma: '2_A', ten: 'Sám cô A (AAA)' },
      ], LOAI_CO_THE_CO_BONUS_CHI_DAU)}

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Ăn sập</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.sapBonus.enabled}
            onChange={e => suaRuleset(r => { r.sapBonus.enabled = e.target.checked; })}
          />
          Bật thưởng ăn sập
        </label>
        <div className="dong-thong-so">
          <span>Hệ số nhân</span>
          <input
            type="number"
            value={ruleset.sapBonus.multiplier}
            onChange={e => suaRuleset(r => { r.sapBonus.multiplier = Number(e.target.value) || 1; })}
          />
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Sập làng</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.sapLangBonus?.enabled !== false}
            onChange={e => suaRuleset(r => {
              if (!r.sapLangBonus) r.sapLangBonus = { enabled: true, multiplier: 2 };
              r.sapLangBonus.enabled = e.target.checked;
            })}
          />
          Bật thưởng khi ăn sập TẤT CẢ đối thủ trong ván
        </label>
        <div className="dong-thong-so">
          <span>Hệ số nhân thêm</span>
          <input
            type="number"
            value={ruleset.sapLangBonus?.multiplier ?? 2}
            onChange={e => suaRuleset(r => {
              if (!r.sapLangBonus) r.sapLangBonus = { enabled: true, multiplier: 2 };
              r.sapLangBonus.multiplier = Number(e.target.value) || 1;
            })}
          />
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Binh lủng</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.binhLungPenalty.enabled}
            onChange={e => suaRuleset(r => { r.binhLungPenalty.enabled = e.target.checked; })}
          />
          Bật phạt binh lủng (thua trắng)
        </label>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.binhLungPenalty.countAsSap}
            onChange={e => suaRuleset(r => { r.binhLungPenalty.countAsSap = e.target.checked; })}
          />
          Tính binh lủng như bị ăn sập (nhân hệ số ở trên)
        </label>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Sảnh Hạ (A-2-3-4-5)</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={!!ruleset.sanhHaYeuNhat}
            onChange={e => suaRuleset(r => { r.sanhHaYeuNhat = e.target.checked; })}
          />
          Coi Sảnh Hạ là YẾU NHẤT trong các sảnh (mặc định: mạnh thứ nhì)
        </label>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chi Á</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.diemA?.enabled !== false}
            onChange={e => suaRuleset(r => {
              if (!r.diemA) r.diemA = { enabled: true, diem: 1 };
              r.diemA.enabled = e.target.checked;
            })}
          />
          Tính điểm theo số lá Á sở hữu
        </label>
        <div className="dong-thong-so">
          <span>Điểm mỗi lá Á thêm (so với đối thủ)</span>
          <input
            type="number"
            value={ruleset.diemA?.diem ?? 1}
            onChange={e => suaRuleset(r => {
              if (!r.diemA) r.diemA = { enabled: true, diem: 1 };
              r.diemA.diem = Number(e.target.value) || 0;
            })}
          />
        </div>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Giới hạn thời gian xếp bài (Chơi với AI)</div>
        <label className="dong-checkbox">
          <input
            type="checkbox"
            checked={ruleset.thoiGianXepBai?.batBuoc ?? false}
            onChange={e => suaRuleset(r => {
              if (!r.thoiGianXepBai) r.thoiGianXepBai = { batBuoc: true, giay: 60 };
              r.thoiGianXepBai.batBuoc = e.target.checked;
            })}
          />
          Bật đếm ngược — hết giờ tự động xác nhận
        </label>
        <div className="dong-thong-so">
          <span>Thời gian mỗi ván (giây, từ 30 đến 120)</span>
          <input
            type="number" min={30} max={120} step={15}
            value={ruleset.thoiGianXepBai?.giay ?? 60}
            disabled={!ruleset.thoiGianXepBai?.batBuoc}
            onChange={e => suaRuleset(r => {
              const gtri = Math.max(30, Math.min(120, Number(e.target.value) || 60));
              if (!r.thoiGianXepBai) r.thoiGianXepBai = { batBuoc: true, giay: 60 };
              r.thoiGianXepBai.giay = gtri;
            })}
          />
        </div>
      </div>

      <button className="nut-reset-luat" onClick={onReset}>
        Khôi phục về gốc của "{presetHienTai?.ten}"
      </button>
    </div>
  );
}

export default LuatChoi;
