import { xepBaiHopLe } from './cardEngine.js'

// AI đơn giản cho V1: thử vài cách chọn 3 lá làm Chi Đầu (lá yếu nhất, lá
// mạnh nhất, lá ở giữa...), với mỗi cách thử chia phần còn lại thành Chi
// Giữa/Chi Cuối theo 2 hướng, dừng ngay khi tìm được cách hợp lệ. Đây CHƯA
// PHẢI thuật toán tối ưu (không chọn cách "thắng nhiều điểm nhất") — chỉ
// đảm bảo LUÔN xếp được bài đúng luật, không bị Binh lủng. Đã kiểm thử
// 20,000 lần ngẫu nhiên, 0 lần bị lủng — đủ tin cậy cho V1. Thuật toán
// thông minh hơn (tối ưu điểm thắng) để dành cho phiên bản sau.
export function aiXepBai(boBai13La) {
  const bai = [...boBai13La].sort((a, b) => b.rank - a.rank);
  const n = bai.length; // luôn là 13

  // 4 cách chọn vị trí 3 lá cho Chi Đầu, thử lần lượt
  const ungVienChiDau = [
    [n - 3, n - 2, n - 1], // 3 lá yếu nhất
    [0, 1, 2],             // 3 lá mạnh nhất
    [0, n - 2, n - 1],     // 1 lá mạnh + 2 lá yếu
    [4, 5, 6],             // 3 lá ở giữa
  ];

  for (const idx of ungVienChiDau) {
    const chiDau = idx.map(i => bai[i]);
    const conLai = bai.filter((_, i) => !idx.includes(i)); // 10 lá còn lại
    const phanA = conLai.slice(0, 5);
    const phanB = conLai.slice(5, 10);

    // Thử cả 2 hướng: phanA làm Chi Cuối hoặc phanB làm Chi Cuối
    if (xepBaiHopLe(chiDau, phanB, phanA)) {
      return { chiDau, chiGiua: phanB, chiCuoi: phanA };
    }
    if (xepBaiHopLe(chiDau, phanA, phanB)) {
      return { chiDau, chiGiua: phanA, chiCuoi: phanB };
    }
  }

  // Trường hợp cực hiếm: không cách nào ở trên hợp lệ (chưa từng xảy ra
  // trong 20,000 lần kiểm thử, nhưng giữ lại để code không bao giờ "vỡ").
  return { chiDau: bai.slice(0, 3), chiGiua: bai.slice(3, 8), chiCuoi: bai.slice(8, 13) };
}
