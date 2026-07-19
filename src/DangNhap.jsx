// DangNhap.jsx (V12) — Đăng nhập/Đăng ký bằng email qua Supabase Auth.
import { useState } from 'react'
import { supabase } from './supabaseClient.js'

function DangNhap() {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [dangDangKy, setDangDangKy] = useState(false);
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [daGuiXacNhan, setDaGuiXacNhan] = useState(false);

  async function xuLy() {
    setLoi(''); setDangXuLy(true);
    const ketQua = dangDangKy
      ? await supabase.auth.signUp({ email, password: matKhau })
      : await supabase.auth.signInWithPassword({ email, password: matKhau });
    setDangXuLy(false);
    if (ketQua.error) {
      setLoi(ketQua.error.message);
      return;
    }
    // Đăng ký thành công nhưng CHƯA có session (project bật xác nhận
    // email) — supabase.auth.onAuthStateChange ở App.jsx sẽ tự nhận biết
    // lúc đăng nhập thật sự thành công, không cần gọi callback thủ công ở
    // đây.
    if (dangDangKy && !ketQua.data.session) {
      setDaGuiXacNhan(true);
    }
  }

  return (
    <div className="trang-dang-nhap">
      <h2>{dangDangKy ? 'Đăng ký' : 'Đăng nhập'}</h2>
      {daGuiXacNhan ? (
        <p>Đã gửi email xác nhận tới <b>{email}</b> — kiểm tra hộp thư và bấm link xác nhận trước khi đăng nhập.</p>
      ) : (
        <>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                 style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          <input type="password" placeholder="Mật khẩu" value={matKhau} onChange={e => setMatKhau(e.target.value)}
                 style={{ display: 'block', width: '100%', marginBottom: 8 }} />
          {loi && <p className="loi-dang-nhap">{loi}</p>}
          <button className="nut-choi" onClick={xuLy} disabled={dangXuLy || !email || !matKhau}>
            {dangXuLy ? 'Đang xử lý...' : (dangDangKy ? 'Đăng ký' : 'Đăng nhập')}
          </button>
          <button className="nut-choi" onClick={() => { setDangDangKy(d => !d); setLoi(''); }} style={{ marginTop: 8 }}>
            {dangDangKy ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </>
      )}
    </div>
  );
}

export default DangNhap;
