import { useState, useRef } from 'react'
import './App.css'
import { chiaBai, xepBaiHopLe, tinhDiem, sapXepDeHienThi } from './cardEngine.js'
import { aiXepBai } from './aiEngine.js'
import Card from './Card.jsx'

// 13 ô cố định: index 0-2 = Chi Đầu, 3-7 = Chi Giữa, 8-12 = Chi Cuối
const BAT_DAU = { dau: 0, giua: 3, cuoi: 8 };

function App() {
  const [tatCaBai] = useState(() => chiaBai());
  const boBaiCuaToi = tatCaBai[0];

  // 1 mảng DUY NHẤT, 13 phần tử. Vị trí trong mảng CHÍNH LÀ vị trí ô của
  // lá đó trong 3 chi — không còn khái niệm "bài trên tay" tách riêng.
  // Giá trị khởi tạo giữ nguyên thứ tự ngẫu nhiên do chiaBai() tạo ra.
  const [oCacChi, setOCacChi] = useState(() => [...boBaiCuaToi]);

  const [dragging, setDragging] = useState(null); // { tuIndex, laBai, x, y }
  const refsO = useRef([]); // 13 ref, mỗi ref ứng với đúng 1 ô (theo index 0-12)

  const [baiDoiThu] = useState(() => [
    aiXepBai(tatCaBai[1]),
    aiXepBai(tatCaBai[2]),
    aiXepBai(tatCaBai[3]),
  ]);

  const [daXacNhan, setDaXacNhan] = useState(false);
  const [ketQuaDiem, setKetQuaDiem] = useState(null);

  // Dữ liệu GỐC theo đúng vị trí ô (dùng để kiểm tra hợp lệ, tính điểm,
  // và xác định chính xác index khi kéo-thả)
  const chiDauGoc = oCacChi.slice(0, 3);
  const chiGiuaGoc = oCacChi.slice(3, 8);
  const chiCuoiGoc = oCacChi.slice(8, 13);
  const hopLe = xepBaiHopLe(chiDauGoc, chiGiuaGoc, chiCuoiGoc);

  function onPointerDownLa(e, tuIndex) {
    e.target.setPointerCapture(e.pointerId);
    setDragging({ tuIndex, laBai: oCacChi[tuIndex], x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e) {
    if (!dragging) return;
    setDragging(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }

  function isInside(rect, x, y) {
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function onPointerUp(e) {
    if (!dragging) return;
    const x = e.clientX, y = e.clientY;

    // Tìm xem đang thả vào đúng Ô nào trong 13 ô, bằng cách so tọa độ thả
    // với vị trí thật của từng ô trên màn hình
    let denIndex = -1;
    for (let i = 0; i < 13; i++) {
      const rect = refsO.current[i]?.getBoundingClientRect();
      if (isInside(rect, x, y)) { denIndex = i; break; }
    }

    if (denIndex !== -1 && denIndex !== dragging.tuIndex) {
      // HOÁN ĐỔI: lá ở ô đích và lá đang kéo đổi chỗ cho nhau — đây là
      // thao tác DUY NHẤT của trò chơi, không có khái niệm "thêm vào" hay
      // "ô trống" vì luôn có sẵn đúng 13/13 lá ngay từ đầu.
      setOCacChi(prev => {
        const moi = [...prev];
        [moi[dragging.tuIndex], moi[denIndex]] = [moi[denIndex], moi[dragging.tuIndex]];
        return moi;
      });
    }
    setDragging(null);
  }

  function xacNhanBai() {
    const nguoiChoi = [
      { ten: 'Bạn', chiDau: chiDauGoc, chiGiua: chiGiuaGoc, chiCuoi: chiCuoiGoc },
      { ten: 'Đối thủ 1', ...baiDoiThu[0] },
      { ten: 'Đối thủ 2', ...baiDoiThu[1] },
      { ten: 'Đối thủ 3', ...baiDoiThu[2] },
    ];
    setKetQuaDiem(tinhDiem(nguoiChoi));
    setDaXacNhan(true);
  }

  // Vẽ 1 vùng TRONG LÚC ĐANG XẾP (cho phép kéo-thả): hiển thị ĐÚNG theo
  // vị trí ô gốc trong oCacChi, KHÔNG sort — để mỗi lá luôn gắn đúng với
  // index thật của nó, đảm bảo kéo-thả luôn chính xác tuyệt đối.
  function renderVungDangXep(nhan, danhSachGoc, chiSoBatDau) {
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {danhSachGoc.map((l, i) => {
            const indexToanCuc = chiSoBatDau + i;
            return (
              <div
                key={indexToanCuc}
                ref={el => { refsO.current[indexToanCuc] = el; }}
                style={{ opacity: dragging?.tuIndex === indexToanCuc ? 0.25 : 1 }}
              >
                <Card laBai={l} onPointerDown={(e) => onPointerDownLa(e, indexToanCuc)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vẽ 1 vùng SAU KHI ĐÃ XÁC NHẬN (chỉ xem, không kéo được nữa): tự sắp
  // xếp lại theo thứ tự cao-thấp cho đẹp mắt. Vì không còn tương tác kéo,
  // không cần gắn index gốc ở đây — tách hẳn thành hàm riêng để tránh
  // nhầm lẫn với renderVungDangXep ở trên (2 trạng thái khác nhau hoàn
  // toàn, không nên dùng chung 1 hàm).
  function renderVungChiXem(nhan, danhSachGoc) {
    const daSort = sapXepDeHienThi(danhSachGoc);
    return (
      <div className="vung-chi">
        <div className="vung-tieu-de">{nhan}</div>
        <div className="vung-noi-dung">
          {daSort.map(l => (
            <Card key={`${l.rank}-${l.suit}`} laBai={l} onPointerDown={() => {}} />
          ))}
        </div>
      </div>
    );
  }

  // Hiện bài 1 đối thủ AI theo 3 hàng riêng (Đầu/Giữa/Cuối), đã sắp xếp,
  // không cho kéo (giữ nguyên từ bản vá trước)
  function renderBaiDoiThu(doiThu, idx) {
    return (
      <div key={idx} className="khoi-doi-thu">
        <div className="ten-doi-thu">Đối thủ {idx + 1}</div>
        {[
          { nhan: 'Đầu', ds: sapXepDeHienThi(doiThu.chiDau) },
          { nhan: 'Giữa', ds: sapXepDeHienThi(doiThu.chiGiua) },
          { nhan: 'Cuối', ds: sapXepDeHienThi(doiThu.chiCuoi) },
        ].map(({ nhan, ds }) => (
          <div key={nhan} className="vung-chi vung-chi-doi-thu">
            <div className="vung-tieu-de">{nhan}</div>
            <div className="vung-noi-dung">
              {ds.map(l => (
                <Card
                  key={`${l.rank}-${l.suit}`}
                  laBai={l}
                  onPointerDown={() => {}}
                  faceDown={!daXacNhan}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="trang" style={{ touchAction: 'none' }}
         onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <h1>Chinese Poker</h1>

      {!daXacNhan && (
        <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 13 }}>
          Kéo 2 lá để đổi chỗ cho nhau, sắp xếp theo ý bạn
        </p>
      )}

      {daXacNhan ? (
        <>
          {renderVungChiXem('Chi Đầu (3 lá)', chiDauGoc)}
          {renderVungChiXem('Chi Giữa (5 lá)', chiGiuaGoc)}
          {renderVungChiXem('Chi Cuối (5 lá)', chiCuoiGoc)}
        </>
      ) : (
        <>
          {renderVungDangXep('Chi Đầu (3 lá)', chiDauGoc, BAT_DAU.dau)}
          {renderVungDangXep('Chi Giữa (5 lá)', chiGiuaGoc, BAT_DAU.giua)}
          {renderVungDangXep('Chi Cuối (5 lá)', chiCuoiGoc, BAT_DAU.cuoi)}
        </>
      )}

      <p className={hopLe ? 'thong-bao-hop-le' : 'thong-bao-loi'}>
        {hopLe ? 'Hợp lệ — sẵn sàng!' : 'Binh lủng!'}
      </p>

      {!daXacNhan && (
        <button className="nut-xac-nhan" onClick={xacNhanBai}>Xác nhận bài</button>
      )}

      {daXacNhan && ketQuaDiem && (
        <div className="ket-qua">
          <h2>Kết quả</h2>
          {Object.entries(ketQuaDiem).map(([ten, d]) => (
            <p key={ten}>{ten}: <b className={d >= 0 ? 'diem-duong' : 'diem-am'}>{d > 0 ? '+' : ''}{d}</b></p>
          ))}
        </div>
      )}

      {dragging && (
        <div className="la-bai-dang-keo" style={{ left: dragging.x - 28, top: dragging.y - 38 }}>
          <Card laBai={dragging.laBai} onPointerDown={() => {}} />
        </div>
      )}

      <hr />
      <h2>Bài của 3 đối thủ (AI đã xếp)</h2>
      {baiDoiThu.map((doiThu, idx) => renderBaiDoiThu(doiThu, idx))}
    </div>
  )
}

export default App
