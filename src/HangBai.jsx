import TheBaiDon from './TheBaiDon.jsx'
import { sapXepDeHienThi } from './cardEngine.js'

// 1 hàng bài LUÔN nằm ngang, không bao giờ xuống dòng — mỗi lá tự co giãn
// + chồng lấn (overlap) vừa khít bề rộng khung chứa, dùng % nên hoạt động
// đúng trên MỌI kích thước màn hình (xem CSS `.hang-chi-bai`). Dùng cho
// bài TĨNH (không kéo được): đối thủ AI, bài Bạn lúc xem kết quả/thắng
// trắng, và bài trong Lịch sử.
function HangBai({ danhSachLa, faceDown = false, kichThuoc = 'nho' }) {
  const daSap = sapXepDeHienThi(danhSachLa);
  return (
    <div className={`hang-chi-bai hang-chi-bai-${kichThuoc}`} style={{ '--n': daSap.length }}>
      {daSap.map(l => (
        <TheBaiDon key={`${l.rank}-${l.suit}`} laBai={l} faceDown={faceDown} />
      ))}
    </div>
  );
}

export default HangBai;
