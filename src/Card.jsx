const TEN_RANK = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const KY_HIEU_CHAT = ['♠', '♥', '♦', '♣'];
const MAU_CHAT = ['#1a1a1a', '#d32f2f', '#e65100', '#1a1a1a'];

function Card({ laBai, onPointerDown, faceDown = false }) {
  if (faceDown) {
    return (
      <div className="la-bai la-bai-sap" onPointerDown={onPointerDown}>
        <div className="la-bai-sap-noi-dung">?</div>
      </div>
    );
  }

  const ten = TEN_RANK[laBai.rank];
  const kyHieu = KY_HIEU_CHAT[laBai.suit];
  const mau = MAU_CHAT[laBai.suit];

  return (
    <div className="la-bai" onPointerDown={onPointerDown} style={{ color: mau }}>
      <div className="la-bai-goc">{ten}{kyHieu}</div>
      <div className="la-bai-giua">{kyHieu}</div>
    </div>
  );
}

export default Card;
