const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♦', '♣'];
const MAU_CHAT = ['#1a1a1a', '#d32f2f', '#e65100', '#1a1a1a'];

// Thẻ bài đơn giản, DÙNG CHUNG cho cả Bạn (kéo-thả được, qua onPointerDown)
// và AI (tĩnh). Chỉ số góc (trên-trái) LUÔN lộ ra dù bị lá kế bên chồng
// lấn (overlap) — vì kích thước/độ chồng lấn của hàng bài (xem HangBai.jsx
// và CSS `.hang-chi-bai`) chỉ che phần bên phải mỗi lá.
function TheBaiDon({ laBai, faceDown = false, onPointerDown }) {
  if (faceDown) {
    return (
      <div className="the-bai-don the-bai-don-sap" onPointerDown={onPointerDown} />
    );
  }

  const ten = TEN_RANK[laBai.rank - 2];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];

  return (
    <div className="the-bai-don" onPointerDown={onPointerDown} style={{ color: mau }}>
      <div className="the-bai-don-chi-so">{ten}{kyHieu}</div>
      <div className="the-bai-don-chat-lon">{kyHieu}</div>
    </div>
  );
}

export default TheBaiDon;
