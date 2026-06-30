// Định nghĩa lá bài: mỗi lá là 1 object { rank, suit }
// rank: 0-12 tương ứng 2,3,4,5,6,7,8,9,10,J,Q,K,A (12 = Át, mạnh nhất)
// suit: 0-3 tương ứng 4 chất, chỉ để phân biệt 4 lá cùng rank

export function taoBoBai() {
  const boBai = [];
  for (let rank = 0; rank < 13; rank++) {
    for (let suit = 0; suit < 4; suit++) {
      boBai.push({ rank, suit });
    }
  }
  return boBai;
}

export function xaoBai(boBai) {
  const ketQua = [...boBai];
  for (let i = ketQua.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ketQua[i], ketQua[j]] = [ketQua[j], ketQua[i]];
  }
  return ketQua;
}

export function chiaBai() {
  const bai = xaoBai(taoBoBai());
  return [
    bai.slice(0, 13),
    bai.slice(13, 26),
    bai.slice(26, 39),
    bai.slice(39, 52),
  ];
}

// Đánh giá độ mạnh 1 bộ 5 lá. Trả về { loai, diem }.
// loai từ 0 (yếu nhất) đến 8 (mạnh nhất):
// 0=Mậu thầu, 1=Đôi, 2=Thú, 3=Sám cô, 4=Sảnh, 5=Thùng, 6=Cù lũ, 7=Tứ quý, 8=Thùng phá sảnh

export function danhGia5La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const suits = laBai.map(l => l.suit);

  const laThung = new Set(suits).size === 1;
  let laSanh = ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5;
  if (JSON.stringify(ranks) === JSON.stringify([12, 3, 2, 1, 0])) {
    laSanh = true;
  }

  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);

  if (laSanh && laThung) return { loai: 8, diem: ranks };
  if (cacSoLuong[0] === 4) return { loai: 7, diem: ranks };
  if (cacSoLuong[0] === 3 && cacSoLuong[1] === 2) return { loai: 6, diem: ranks };
  if (laThung) return { loai: 5, diem: ranks };
  if (laSanh) return { loai: 4, diem: ranks };
  if (cacSoLuong[0] === 3) return { loai: 3, diem: ranks };
  if (cacSoLuong[0] === 2 && cacSoLuong[1] === 2) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: ranks };
  return { loai: 0, diem: ranks };
}

// Đánh giá độ mạnh 1 bộ 3 lá (chi đầu): 0=Mậu thầu, 1=Đôi, 2=Sám cô

export function danhGia3La(laBai) {
  const ranks = laBai.map(l => l.rank).sort((a, b) => b - a);
  const demSoLuong = {};
  ranks.forEach(r => { demSoLuong[r] = (demSoLuong[r] || 0) + 1; });
  const cacSoLuong = Object.values(demSoLuong).sort((a, b) => b - a);

  if (cacSoLuong[0] === 3) return { loai: 2, diem: ranks };
  if (cacSoLuong[0] === 2) return { loai: 1, diem: ranks };
  return { loai: 0, diem: ranks };
}

// So sánh 2 kết quả đánh giá: trả 1 nếu a mạnh hơn, -1 nếu b mạnh hơn, 0 nếu hòa
export function soSanh(a, b) {
  if (a.loai !== b.loai) return a.loai > b.loai ? 1 : -1;
  for (let i = 0; i < Math.min(a.diem.length, b.diem.length); i++) {
    if (a.diem[i] !== b.diem[i]) return a.diem[i] > b.diem[i] ? 1 : -1;
  }
  return 0;
}

// Kiểm tra cách xếp 3 chi có hợp lệ không (cuối >= giữa >= đầu)
export function xepBaiHopLe(chiDau, chiGiua, chiCuoi) {
  const danhGiaDau = danhGia3La(chiDau);
  const danhGiaGiua = danhGia5La(chiGiua);
  const danhGiaCuoi = danhGia5La(chiCuoi);

  if (soSanh(danhGiaCuoi, danhGiaGiua) < 0) return false;

  // Map loại 3-lá sang thang 5-lá: Sám cô (3-lá, loai=2) tương đương Sám cô (5-lá, loai=3)
  const loaiDauTrenThang5 = danhGiaDau.loai === 2 ? 3 : danhGiaDau.loai;
  return danhGiaGiua.loai >= loaiDauTrenThang5;
}

// Tính điểm 1 ván giữa nhiều người chơi.
// nguoiChoi = [{ ten, chiDau, chiGiua, chiCuoi }, ...]
// Trả về { ten: diem } — điểm từng người. Tổng luôn bằng 0.
export function tinhDiem(nguoiChoi) {
  const diem = {};
  nguoiChoi.forEach(p => { diem[p.ten] = 0; });

  for (let i = 0; i < nguoiChoi.length; i++) {
    for (let j = i + 1; j < nguoiChoi.length; j++) {
      const a = nguoiChoi[i], b = nguoiChoi[j];

      const soDau = soSanh(danhGia3La(a.chiDau), danhGia3La(b.chiDau));
      const soGiua = soSanh(danhGia5La(a.chiGiua), danhGia5La(b.chiGiua));
      const soCuoi = soSanh(danhGia5La(a.chiCuoi), danhGia5La(b.chiCuoi));

      diem[a.ten] += soDau + soGiua + soCuoi;
      diem[b.ten] -= soDau + soGiua + soCuoi;
    }
  }
  return diem;
}

// Sắp xếp 1 danh sách lá bài theo thứ tự CAO -> THẤP, dùng để hiển thị
// SAU KHI đã xác nhận bài (không dùng trong lúc đang xếp, vì lúc đó thứ
// tự hiển thị phải đúng theo vị trí người chơi tự sắp xếp).
export function sapXepDeHienThi(danhSachLa) {
  return [...danhSachLa].sort((a, b) => b.rank - a.rank);
}
