// PhanTich.jsx (V13 + V14 Phase 2) — Thống kê mô tả cơ bản, hiệu quả
// từng phong cách AI đối đầu, và kiểm chứng ngược xác suất lý thuyết
// (V4) với tần suất thực tế. Kể từ V14 Phase 1, trang này CHỈ Admin vào
// được (TrangChu.jsx làm mờ nút, RLS chặn thật) — nên đọc dữ liệu qua
// `useDuLieuAIToanBo` (KHÔNG lọc theo người đăng nhập, gộp TOÀN BỘ
// người chơi, xem lichSuAI.js) thay vì `useDuLieuAI` cũ. Dữ liệu đã map
// sẵn camelCase (thoiGian, laThangTrang, chiTietCaVan, cheDoThucTeDoiThu...).
//
// Tên hiển thị của "Bạn" (người chơi chính) do người dùng tự đặt (xem
// ChonVan.jsx), KHÔNG cố định là chữ "Bạn" — nên mỗi Ván phải tự tra tên
// đúng của "Bạn" trong CHÍNH ván đó qua `van.nguoiChoiBaiThat[0].ten`
// (phần tử 0 luôn là người chơi chính, xem layTenDoiThu ở App.jsx), thay
// vì tra cứng theo chữ "Bạn".
import { useDuLieuAIToanBo } from './lichSuAI.js'
import { DANH_SACH_NHAN_VAT_MAC_DINH } from './nhanVatAI.js'
import { soSanhThangTrang, soSanhChiCuoi } from './soSanhXacSuat.js'
import { tinhPhanBoLoaiBai, phatHienNhanVatTron, tinhHoiTuTronPhongCach } from './phanBoVaHoiTu.js'

const TEN_THANG_TRANG = { rongCuon: 'Rồng cuốn', sanhRong: 'Sảnh rồng', namDoiMotSam: 'Năm đôi 1 sám', lucPheBon: 'Lục phé bôn', namDoiThong: 'Năm đôi thông', baThung: 'Ba thùng', baSanh: 'Ba sảnh' };
const TEN_CHI_CUOI = { '8_thuong': 'Thùng phá sảnh Thượng', '8_ha': 'Thùng phá sảnh Hạ', '8': 'Thùng phá sảnh', '7_A': 'Tứ quý toàn Á', '7': 'Tứ quý', '6': 'Cù lũ', '5': 'Thùng', '4': 'Sảnh' };
const MAU_PHONG_CACH = ['#f0c040', '#5fb0e0', '#e05f8a', '#7ed17e', '#b085e0'];

// Vẽ 1 đường hội tụ bằng SVG cơ bản — không cần thư viện biểu đồ ngoài,
// đúng phong cách đã dùng xuyên suốt dự án.
function BieuDoDuong({ duLieu, tenPhongCach, mau }) {
  if (duLieu.length === 0) return null;
  const rong = 300, cao = 100;
  const diem = duLieu.map((d, i) => {
    const x = (i / (duLieu.length - 1 || 1)) * rong;
    const y = cao - (d.tiLe[tenPhongCach] || 0) * cao;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${rong} ${cao}`} width="100%" height="100">
      <polyline points={diem} fill="none" stroke={mau} strokeWidth="2" />
    </svg>
  );
}

function tinhThongKeCoBan(danhSachVanChoiAI) {
  let soThang = 0, soThua = 0, soHoa = 0;
  let chuoiThangHienTai = 0, chuoiThuaHienTai = 0;
  let chuoiThangDaiNhat = 0, chuoiThuaDaiNhat = 0;
  let soBinhLung = 0, soAnSap = 0, soBiAnSap = 0, soThangTrang = 0;
  let tongDiem = 0;

  const daSapXep = [...danhSachVanChoiAI].sort((a, b) => a.thoiGian - b.thoiGian);

  for (const van of daSapXep) {
    const tenBan = van.nguoiChoiBaiThat?.[0]?.ten;
    if (!tenBan) continue; // ván thiếu dữ liệu bài thật (không nên xảy ra, phòng hờ)
    const diemBan = van.diem[tenBan] || 0;
    tongDiem += diemBan;

    if (diemBan > 0) {
      soThang++; chuoiThangHienTai++; chuoiThuaHienTai = 0;
      chuoiThangDaiNhat = Math.max(chuoiThangDaiNhat, chuoiThangHienTai);
    } else if (diemBan < 0) {
      soThua++; chuoiThuaHienTai++; chuoiThangHienTai = 0;
      chuoiThuaDaiNhat = Math.max(chuoiThuaDaiNhat, chuoiThuaHienTai);
    } else {
      soHoa++; chuoiThangHienTai = 0; chuoiThuaHienTai = 0;
    }

    if (van.laThangTrang) soThangTrang++;

    const chiTietBan = van.chiTietCaVan?.[tenBan];
    if (chiTietBan) {
      if (chiTietBan.laBinhLung) soBinhLung++;
      if (chiTietBan.daAnSap) soAnSap++;
    }
    // "Bị ăn sập" = có ít nhất 1 đối thủ đã ăn sập MÌNH
    const biAnSapVanNay = Object.entries(van.chiTietCaVan || {}).some(
      ([ten, ct]) => ten !== tenBan && ct.daAnSap
    );
    if (biAnSapVanNay) soBiAnSap++;
  }

  const tongSoVan = daSapXep.length;
  return {
    tongSoVan, soThang, soThua, soHoa,
    tyLeThang: tongSoVan > 0 ? soThang / tongSoVan : 0,
    diemTrungBinh: tongSoVan > 0 ? tongDiem / tongSoVan : 0,
    chuoiThangDaiNhat, chuoiThuaDaiNhat,
    soBinhLung, soAnSap, soBiAnSap, soThangTrang,
  };
}

// Với MỖI ván, "Bạn" đối đầu 3 đối thủ CÙNG LÚC (không phải 1-1) — nên
// "tỷ lệ thắng khi gặp phong cách X" thực chất trả lời "những ván CÓ đối
// thủ dùng phong cách X, tỷ lệ Bạn thắng CHUNG CUỘC (cả ván) là bao
// nhiêu" — không tách được điểm ròng riêng với TỪNG đối thủ từ điểm tổng
// đã lưu (giới hạn chấp nhận được, để dành cân nhắc cho V14 nếu cần).
function tinhHieuQuaTheoPhongCach(danhSachVanChoiAI) {
  const thongKe = {};

  for (const van of danhSachVanChoiAI) {
    const tenBan = van.nguoiChoiBaiThat?.[0]?.ten;
    if (!tenBan || !van.cheDoThucTeDoiThu) continue; // ván cũ/thắng trắng không có, bỏ qua
    for (const phongCach of Object.values(van.cheDoThucTeDoiThu)) {
      if (!thongKe[phongCach]) thongKe[phongCach] = { soLanGap: 0, soLanThang: 0, soLanThua: 0, soLanHoa: 0 };
      thongKe[phongCach].soLanGap++;
      const diemBan = van.diem[tenBan] || 0;
      if (diemBan > 0) thongKe[phongCach].soLanThang++;
      else if (diemBan < 0) thongKe[phongCach].soLanThua++;
      else thongKe[phongCach].soLanHoa++;
    }
  }
  return thongKe;
}

// V14 Phase 4 — Lời khuyên lối chơi tự động từ ngưỡng thống kê. Mọi
// ngưỡng (0.15, 20, 10, 0.3) là số khởi điểm hợp lý, KHÔNG phải "đúng
// tuyệt đối" — có thể tinh chỉnh sau khi thấy lời khuyên thực sự hữu ích
// hay không qua vài tuần dùng thật. Điều kiện tongSoVan >= 20/soLanGap
// >= 10 để tránh kết luận vội khi mẫu còn quá nhỏ (Luật số lớn).
function sinhLoiKhuyen(thongKeCoBan, hieuQuaTheoPhongCach) {
  const loiKhuyen = [];

  if (thongKeCoBan.tongSoVan >= 20 && thongKeCoBan.soBinhLung / thongKeCoBan.tongSoVan > 0.15) {
    loiKhuyen.push('Tỷ lệ binh lủng khá cao — thử dùng nút "Gợi ý" thường xuyên hơn, hoặc tăng thời gian xếp bài trong Luật chơi.');
  }

  for (const [phongCach, tk] of Object.entries(hieuQuaTheoPhongCach)) {
    if (tk.soLanGap >= 10 && tk.soLanThang / tk.soLanGap < 0.3) {
      const ten = DANH_SACH_NHAN_VAT_MAC_DINH.find(n => n.phongCach === phongCach)?.ten || phongCach;
      loiKhuyen.push(`Tỷ lệ thắng chung cuộc khi có đối thủ phong cách "${ten}" khá thấp (${(tk.soLanThang / tk.soLanGap * 100).toFixed(0)}%) — cân nhắc xếp bài thận trọng hơn khi đối đầu.`);
    }
  }

  if (loiKhuyen.length === 0) loiKhuyen.push('Chưa đủ dữ liệu hoặc chưa phát hiện điểm gì đáng lưu ý — chơi thêm để có phân tích chi tiết hơn.');
  return loiKhuyen;
}

function PhanTich() {
  const { danhSachVan, dangTai, loi } = useDuLieuAIToanBo();

  if (dangTai) return <p>Đang tải...</p>;
  if (loi) return <p className="loi-dang-nhap">Lỗi kết nối: {loi} — thử lại sau.</p>;

  const thongKe = tinhThongKeCoBan(danhSachVan);
  const hieuQuaTheoPhongCach = tinhHieuQuaTheoPhongCach(danhSachVan);

  return (
    <div className="trang-phan-tich">
      <h2>Phân tích</h2>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Lời khuyên</div>
        {sinhLoiKhuyen(thongKe, hieuQuaTheoPhongCach).map((lk, i) => <p key={i}>💡 {lk}</p>)}
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Tổng quan ({thongKe.tongSoVan} ván)</div>
        {thongKe.tongSoVan === 0 ? (
          <p>Chưa có ván "Chơi với AI" nào để thống kê.</p>
        ) : (
          <>
            <p>Tỷ lệ thắng: <b>{(thongKe.tyLeThang * 100).toFixed(1)}%</b> ({thongKe.soThang}T - {thongKe.soThua}B - {thongKe.soHoa}H)</p>
            <p>Điểm trung bình/ván: <b className={thongKe.diemTrungBinh >= 0 ? 'diem-duong' : 'diem-am'}>
              {thongKe.diemTrungBinh > 0 ? '+' : ''}{thongKe.diemTrungBinh.toFixed(2)}
            </b></p>
            <p>Chuỗi thắng dài nhất: <b>{thongKe.chuoiThangDaiNhat}</b> — Chuỗi thua dài nhất: <b>{thongKe.chuoiThuaDaiNhat}</b></p>
            <p>Tỷ lệ binh lủng: <b>{(thongKe.soBinhLung / thongKe.tongSoVan * 100).toFixed(1)}%</b></p>
            <p>Tỷ lệ ăn sập: <b>{(thongKe.soAnSap / thongKe.tongSoVan * 100).toFixed(1)}%</b> — Tỷ lệ bị ăn sập: <b>{(thongKe.soBiAnSap / thongKe.tongSoVan * 100).toFixed(1)}%</b></p>
            <p>Số lần thắng trắng: <b>{thongKe.soThangTrang}</b></p>
          </>
        )}
      </div>

      {Object.keys(hieuQuaTheoPhongCach).length > 0 && (
        <div className="khoi-luat">
          <div className="khoi-luat-tieu-de">Hiệu quả khi gặp từng phong cách</div>
          {Object.entries(hieuQuaTheoPhongCach).map(([phongCach, tk]) => {
            const ten = DANH_SACH_NHAN_VAT_MAC_DINH.find(n => n.phongCach === phongCach)?.ten || phongCach;
            const tyLe = tk.soLanGap > 0 ? (tk.soLanThang / tk.soLanGap * 100).toFixed(1) : '0';
            return (
              <p key={phongCach}>
                {ten}: gặp {tk.soLanGap} lần — thắng chung cuộc {tyLe}% ({tk.soLanThang}T-{tk.soLanThua}B-{tk.soLanHoa}H)
              </p>
            );
          })}
        </div>
      )}

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Kiểm chứng xác suất — Thắng trắng</div>
        {Object.entries(soSanhThangTrang(danhSachVan)).map(([loai, kq]) => (
          <p key={loai} style={{ fontSize: 13 }}>
            {TEN_THANG_TRANG[loai]}: lý thuyết {(kq.lyThuyet * 100).toExponential(2)}% —
            thực tế {(kq.thucTe * 100).toExponential(2)}% ({kq.soLanThucTe}/{kq.tongCoHoi} lượt)
          </p>
        ))}
        <p className="ghi-chu-luat">
          Với các loại cực hiếm (Rồng cuốn, Sảnh rồng...), cần TÍCH LŨY RẤT NHIỀU
          ván mới có ý nghĩa so sánh — vài nghìn ván vẫn có thể chưa từng thấy
          1 lần nào, đó KHÔNG phải dấu hiệu sai, chỉ là mẫu còn nhỏ so với xác
          suất thật.
        </p>
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Kiểm chứng xác suất — Chi Cuối</div>
        {Object.entries(soSanhChiCuoi(danhSachVan.filter(v => v.chiTietCaVan))).map(([ma, kq]) => (
          <p key={ma} style={{ fontSize: 13 }}>
            {TEN_CHI_CUOI[ma]}: lý thuyết {(kq.lyThuyet * 100).toFixed(4)}% —
            thực tế {(kq.thucTe * 100).toFixed(4)}% ({kq.soLanThucTe}/{kq.tongLuotQuanSat} lượt)
          </p>
        ))}
      </div>

      <div className="khoi-luat">
        <div className="khoi-luat-tieu-de">Phân bố loại bài — Chi Cuối</div>
        {tinhPhanBoLoaiBai(danhSachVan.filter(v => v.chiTietCaVan), 'cuoi').map(({ loai, soLuong, tiLe }) => (
          <p key={loai}>{loai}: <b>{(tiLe * 100).toFixed(1)}%</b> ({soLuong} lượt)</p>
        ))}
      </div>

      {(() => {
        const nhanVatTron = phatHienNhanVatTron(danhSachVan);
        if (nhanVatTron.length === 0) {
          return (
            <div className="khoi-luat">
              <div className="khoi-luat-tieu-de">Hội tụ tỷ lệ nhân vật trộn</div>
              <p>Chưa có đối thủ nào ghi nhận nhiều hơn 1 phong cách thật qua các ván (dấu hiệu nhân vật "trộn") — biểu đồ sẽ tự xuất hiện khi có.</p>
            </div>
          );
        }
        return nhanVatTron.map(({ ten, cacPhongCach }) => {
          const duLieu = tinhHoiTuTronPhongCach(danhSachVan, ten);
          return (
            <div className="khoi-luat" key={ten}>
              <div className="khoi-luat-tieu-de">Hội tụ tỷ lệ nhân vật trộn ({ten})</div>
              {cacPhongCach.map((pc, i) => (
                <div key={pc}>
                  <p style={{ fontSize: 13, marginBottom: 2 }}>
                    <span style={{ color: MAU_PHONG_CACH[i % MAU_PHONG_CACH.length] }}>●</span> {pc}
                  </p>
                  <BieuDoDuong duLieu={duLieu} tenPhongCach={pc} mau={MAU_PHONG_CACH[i % MAU_PHONG_CACH.length]} />
                </div>
              ))}
              <p className="ghi-chu-luat">Đường càng phẳng (ít dao động) về phía bên phải nghĩa là tỷ lệ đã hội tụ ổn định.</p>
            </div>
          );
        });
      })()}
    </div>
  );
}

export default PhanTich;
