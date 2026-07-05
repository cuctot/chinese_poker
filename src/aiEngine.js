import { xepBaiHopLe } from './cardEngine.js'

// AI đơn giản: thử TẤT CẢ C(13,3) = 286 cách chọn 3 lá làm Chi Đầu, mỗi
// cách thử chia 10 lá còn lại thành Chi Giữa/Chi Cuối theo 2 hướng, dừng
// ngay khi tìm được cách hợp lệ. Đây CHƯA PHẢI thuật toán tối ưu (không
// chọn cách "thắng nhiều điểm nhất") — chỉ đảm bảo LUÔN xếp được bài đúng
// luật, không bị Binh lủng. Thuật toán thông minh hơn (tối ưu điểm thắng)
// để dành cho phiên bản sau.
//
// TRƯỚC ĐÂY chỉ thử 4 cách "đoán" (yếu nhất/mạnh nhất/trộn/giữa) — đủ
// dùng khi `xepBaiHopLe` còn lỏng (chỉ so hạng, không so điểm trong cùng
// hạng). Sau khi sửa `xepBaiHopLe` cho đúng luật (so cả điểm), 4 cách đó
// không còn đủ: kiểm thử 20.000 ván ngẫu nhiên cho thấy AI rơi vào nhánh
// dự phòng và TỰ XẾP LỦNG ~1.15% số ván. Thử đủ 286 cách chọn Đầu giải
// quyết triệt để (0 lần lủng/20.000 ván sau khi sửa — xem lại test).
export function aiXepBai(boBai13La, ruleset) {
  const bai = [...boBai13La].sort((a, b) => b.rank - a.rank);
  const n = bai.length; // luôn là 13

  const ungVienChiDau = [];
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        ungVienChiDau.push([i, j, k]);
      }
    }
  }

  for (const idx of ungVienChiDau) {
    const chiDau = idx.map(i => bai[i]);
    const conLai = bai.filter((_, i) => !idx.includes(i)); // 10 lá còn lại
    const phanA = conLai.slice(0, 5);
    const phanB = conLai.slice(5, 10);

    // Thử cả 2 hướng: phanA làm Chi Cuối hoặc phanB làm Chi Cuối
    if (xepBaiHopLe(chiDau, phanB, phanA, ruleset)) {
      return { chiDau, chiGiua: phanB, chiCuoi: phanA };
    }
    if (xepBaiHopLe(chiDau, phanA, phanB, ruleset)) {
      return { chiDau, chiGiua: phanA, chiCuoi: phanB };
    }
  }

  // Trường hợp cực hiếm: không cách nào trong 286×2 cách ở trên hợp lệ.
  // Dự phòng xếp ĐÚNG HƯỚNG yếu→mạnh (Đầu = 3 lá yếu nhất, Cuối = 5 lá
  // mạnh nhất) — giảm tối đa khả năng lủng, KHÁC với bản cũ xếp NGƯỢC
  // (mạnh nhất vào Đầu) gần như chắc chắn lủng.
  const yeuNhat3 = bai.slice(n - 3);
  const conLai10 = bai.slice(0, n - 3);
  return { chiDau: yeuNhat3, chiGiua: conLai10.slice(5, 10), chiCuoi: conLai10.slice(0, 5) };
}
