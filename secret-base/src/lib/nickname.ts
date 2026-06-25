const ADJECTIVES = [
  "Ninja",
  "Ẩn danh",
  "Bóng ma",
  "Cú đêm",
  "Sói",
  "Heo rừng",
  "Vịt",
  "Cáo",
  "Báo",
  "Tôm",
];

const NOUNS = [
  "Rùa",
  "Cà rốt",
  "Bánh mì",
  "Trà sữa",
  "Lag",
  "Meme",
  "Phốt",
  "Gió",
  "Mưa",
  "Sấm",
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${adj} ${noun} #${num}`;
}
