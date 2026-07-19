// NhomChoi.jsx (V12) — Quản lý Nhóm chơi: tạo nhóm mới, mời thành viên
// bằng email, chọn nhóm đang dùng cho Ghi điểm.
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient.js'

function NhomChoi({ nguoiDangNhap, onChonNhom, idNhomGoiY }) {
  const [danhSachNhom, setDanhSachNhom] = useState([]);
  const [tenNhomMoi, setTenNhomMoi] = useState('');
  const [emailMoi, setEmailMoi] = useState('');
  const [nhomDangXem, setNhomDangXem] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loiMang, setLoiMang] = useState(null);

  useEffect(() => {
    setDangTai(true); setLoiMang(null);
    supabase.from('nhom_choi').select('*').then(({ data, error }) => {
      setDangTai(false);
      if (error) { setLoiMang(error.message); return; }
      setDanhSachNhom(data || []);
      // Khôi phục lại nhóm đã chọn lần trước (nhớ qua localStorage ở
      // App.jsx) — chỉ khi nhóm đó vẫn còn trong danh sách (còn là
      // thành viên), tránh phải bấm chọn lại mỗi lần mở app.
      const nhomCu = idNhomGoiY && (data || []).find(n => n.id === idNhomGoiY);
      if (nhomCu) { setNhomDangXem(nhomCu.id); onChonNhom(nhomCu); }
    });
  }, []);

  async function taoNhom() {
    if (!tenNhomMoi.trim()) return;
    const { data, error } = await supabase.from('nhom_choi')
      .insert({ ten: tenNhomMoi.trim(), nguoi_tao_id: nguoiDangNhap.id })
      .select().single();
    if (error) { alert(error.message); return; }
    await supabase.from('thanh_vien_nhom').insert({ nhom_id: data.id, nguoi_dung_id: nguoiDangNhap.id });
    setDanhSachNhom(prev => [...prev, data]);
    setTenNhomMoi('');
  }

  async function moiThanhVien(nhomId) {
    const { error } = await supabase.rpc('moi_thanh_vien_theo_email', {
      p_nhom_id: nhomId, p_email: emailMoi.trim(),
    });
    if (error) { alert(error.message); return; }
    alert('Đã mời thành công!');
    setEmailMoi('');
  }

  if (dangTai) return <p>Đang tải...</p>;
  if (loiMang) return <p className="loi-dang-nhap">Lỗi kết nối: {loiMang} — thử lại sau.</p>;

  return (
    <div className="khoi-luat">
      <div className="khoi-luat-tieu-de">Nhóm chơi của bạn</div>
      {danhSachNhom.map(nhom => (
        <div key={nhom.id} className="the-preset">
          <div className="the-preset-ten" style={{ cursor: 'pointer' }}
               onClick={() => { setNhomDangXem(nhom.id); onChonNhom(nhom); }}>
            {nhom.ten}
          </div>
          {nhomDangXem === nhom.id && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="email" placeholder="Email người muốn mời" value={emailMoi}
                     onChange={e => setEmailMoi(e.target.value)} />
              <button className="nut-choi" onClick={() => moiThanhVien(nhom.id)}>Mời</button>
            </div>
          )}
        </div>
      ))}
      <div className="khoi-luu-rieng">
        <input type="text" placeholder="Tên nhóm mới..." value={tenNhomMoi}
               onChange={e => setTenNhomMoi(e.target.value)} />
        <button className="nut-choi" onClick={taoNhom} disabled={!tenNhomMoi.trim()}>Tạo nhóm</button>
      </div>
    </div>
  );
}

export default NhomChoi;
