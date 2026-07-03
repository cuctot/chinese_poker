import { useState } from 'react'
import { RULESET_PRESETS } from './ruleset.js'

const TEN_LOAI_3_LA = ['Mậu thầu', 'Đôi', 'Sám cô'];
const TEN_LOAI_5_LA = ['Mậu thầu', 'Đôi', 'Thú', 'Sám cô', 'Sảnh', 'Thùng', 'Cù lũ', 'Tứ quý', 'Thùng phá sảnh'];
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

  function veBangBonus(tenChi, nhan, danhSachTenLoai, dacBiet = []) {
    return (
      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Bonus theo loại bài — {nhan}</div>
        <div className="bang-bonus">
          {danhSachTenLoai.map((tenLoai, loai) => (
            <div key={loai} className="dong-bonus">
              <span>{tenLoai}</span>
              <input
                type="number"
                value={ruleset.bonusTheoLoai[tenChi]?.[loai] || 0}
                onChange={e => suaBonus(tenChi, loai, e.target.value)}
              />
            </div>
          ))}
          {dacBiet.map(({ ma, ten }) => (
            <div key={ma} className="dong-bonus dong-bonus-dac-biet">
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
            <label key={tenChi}>
              {tenChi === 'dau' ? 'Chi Đầu' : tenChi === 'giua' ? 'Chi Giữa' : 'Chi Cuối'}
              <input
                type="number"
                value={ruleset.pointsPerChi[tenChi]}
                onChange={e => suaDiemGoc(tenChi, e.target.value)}
              />
            </label>
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
          Bật luật thắng trắng (Ù ngay, không cần so từng chi)
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
        <label>
          Mức phạt nếu Báo Ù sai (mỗi đối thủ)
          <input
            type="number"
            value={ruleset.thangTrang?.phatBaoUSai ?? 6}
            onChange={e => suaRuleset(r => {
              if (!r.thangTrang) r.thangTrang = { enabled: true, dungMucSapLang: false, diem: {} };
              r.thangTrang.phatBaoUSai = Number(e.target.value) || 0;
            })}
          />
        </label>
        <div className="bang-bonus">
          {TEN_THANG_TRANG.map(({ ma, ten }) => (
            <div key={ma} className="dong-bonus">
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

      {veBangBonus('cuoi', 'Chi Cuối (5 lá) — nguồn gốc để tính Chi Giữa', TEN_LOAI_5_LA, [
        { ma: '7_A', ten: 'Tứ quý A (AAAA)' },
        { ma: '8_thuong', ten: 'Thùng phá sảnh Thượng (10-J-Q-K-A)' },
        { ma: '8_ha', ten: 'Thùng phá sảnh Hạ (A-2-3-4-5)' },
      ])}

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Chi Giữa (5 lá) — tự động = 2 × Chi Cuối</div>
        <div className="bang-bonus">
          {['7', '7_A', '8', '8_thuong', '8_ha'].map(ma => {
            const tenHienThi = {
              '7': 'Tứ quý', '7_A': 'Tứ quý A',
              '8': 'Thùng phá sảnh (thường)',
              '8_thuong': 'Thùng phá sảnh Thượng', '8_ha': 'Thùng phá sảnh Hạ',
            }[ma];
            const giaTriCuoi = ruleset.bonusTheoLoai.cuoi?.[ma];
            if (giaTriCuoi === undefined) return null;
            return (
              <div key={ma} className="dong-bonus dong-bonus-chi-doc">
                <span>{tenHienThi}</span>
                <span>{giaTriCuoi * 2}</span>
              </div>
            );
          })}
        </div>
        <p className="ghi-chu-chi-giua">
          Sửa số ở bảng "Chi Cuối" bên trên — Chi Giữa sẽ tự cập nhật theo.
        </p>
      </div>

      {veBangBonus('dau', 'Chi Đầu (3 lá)', TEN_LOAI_3_LA, [
        { ma: '2_A', ten: 'Sám cô A (AAA)' },
      ])}

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
        <label>
          Hệ số nhân
          <input
            type="number"
            value={ruleset.sapBonus.multiplier}
            onChange={e => suaRuleset(r => { r.sapBonus.multiplier = Number(e.target.value) || 1; })}
          />
        </label>
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
        <label>
          Hệ số nhân thêm
          <input
            type="number"
            value={ruleset.sapLangBonus?.multiplier ?? 2}
            onChange={e => suaRuleset(r => {
              if (!r.sapLangBonus) r.sapLangBonus = { enabled: true, multiplier: 2 };
              r.sapLangBonus.multiplier = Number(e.target.value) || 1;
            })}
          />
        </label>
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
        <label>
          Điểm mỗi lá Á thêm (so với đối thủ)
          <input
            type="number"
            value={ruleset.diemA?.diem ?? 1}
            onChange={e => suaRuleset(r => {
              if (!r.diemA) r.diemA = { enabled: true, diem: 1 };
              r.diemA.diem = Number(e.target.value) || 0;
            })}
          />
        </label>
      </div>

      <button className="nut-reset-luat" onClick={onReset}>
        Khôi phục về gốc của "{presetHienTai?.ten}"
      </button>
    </div>
  );
}

export default LuatChoi;
