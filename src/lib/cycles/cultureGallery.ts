// Galeria de ícones (emojis) para frutas, hortaliças e culturas comuns
export interface CultureIcon {
  emoji: string;
  nome: string;
  keywords: string[];
}

export const CULTURE_GALLERY: CultureIcon[] = [
  { emoji: "🎃", nome: "Abóbora", keywords: ["abobora", "moranga", "jerimum"] },
  { emoji: "🌽", nome: "Milho", keywords: ["milho"] },
  { emoji: "🍠", nome: "Macaxeira", keywords: ["macaxeira", "mandioca", "aipim", "batata-doce", "batata doce"] },
  { emoji: "🥔", nome: "Batata", keywords: ["batata"] },
  { emoji: "🍅", nome: "Tomate", keywords: ["tomate"] },
  { emoji: "🥬", nome: "Alface", keywords: ["alface", "folha", "couve", "rucula"] },
  { emoji: "🥦", nome: "Brócolis", keywords: ["brocolis", "couve-flor"] },
  { emoji: "🌶️", nome: "Pimenta", keywords: ["pimenta", "pimentao"] },
  { emoji: "🫑", nome: "Pimentão", keywords: ["pimentao"] },
  { emoji: "🥕", nome: "Cenoura", keywords: ["cenoura"] },
  { emoji: "🧅", nome: "Cebola", keywords: ["cebola"] },
  { emoji: "🧄", nome: "Alho", keywords: ["alho"] },
  { emoji: "🥒", nome: "Pepino", keywords: ["pepino", "abobrinha"] },
  { emoji: "🍆", nome: "Berinjela", keywords: ["berinjela", "jiló"] },
  { emoji: "🌱", nome: "Muda", keywords: ["muda", "broto", "germinacao"] },
  { emoji: "🌾", nome: "Arroz/Trigo", keywords: ["arroz", "trigo", "feijao", "graos"] },
  { emoji: "🫘", nome: "Feijão", keywords: ["feijao", "graos"] },
  { emoji: "🥜", nome: "Amendoim", keywords: ["amendoim"] },
  { emoji: "🍓", nome: "Morango", keywords: ["morango"] },
  { emoji: "🍌", nome: "Banana", keywords: ["banana"] },
  { emoji: "🍍", nome: "Abacaxi", keywords: ["abacaxi"] },
  { emoji: "🥭", nome: "Manga", keywords: ["manga"] },
  { emoji: "🍊", nome: "Laranja", keywords: ["laranja", "tangerina"] },
  { emoji: "🍋", nome: "Limão", keywords: ["limao"] },
  { emoji: "🍉", nome: "Melancia", keywords: ["melancia"] },
  { emoji: "🍈", nome: "Melão", keywords: ["melao"] },
  { emoji: "🍇", nome: "Uva", keywords: ["uva"] },
  { emoji: "🍎", nome: "Maçã", keywords: ["maca"] },
  { emoji: "🍐", nome: "Pera", keywords: ["pera"] },
  { emoji: "🍑", nome: "Pêssego", keywords: ["pessego"] },
  { emoji: "🍒", nome: "Cereja", keywords: ["cereja", "acerola"] },
  { emoji: "🥥", nome: "Coco", keywords: ["coco"] },
  { emoji: "🥑", nome: "Abacate", keywords: ["abacate"] },
  { emoji: "🌻", nome: "Girassol", keywords: ["girassol"] },
  { emoji: "🌳", nome: "Árvore", keywords: ["arvore", "fruteira"] },
  { emoji: "🌿", nome: "Erva", keywords: ["erva", "tempero", "salsa", "cebolinha", "coentro", "manjericao"] },
  { emoji: "☕", nome: "Café", keywords: ["cafe"] },
  { emoji: "🍫", nome: "Cacau", keywords: ["cacau"] },
];

export const CULTURE_COLORS: { hex: string; nome: string }[] = [
  { hex: "#22c55e", nome: "Verde" },
  { hex: "#16a34a", nome: "Verde escuro" },
  { hex: "#84cc16", nome: "Lima" },
  { hex: "#eab308", nome: "Amarelo" },
  { hex: "#f97316", nome: "Laranja" },
  { hex: "#ef4444", nome: "Vermelho" },
  { hex: "#ec4899", nome: "Rosa" },
  { hex: "#a855f7", nome: "Roxo" },
  { hex: "#3b82f6", nome: "Azul" },
  { hex: "#06b6d4", nome: "Ciano" },
  { hex: "#78716c", nome: "Pedra" },
  { hex: "#92400e", nome: "Marrom" },
];

export function suggestIconForCultura(cultura: string): string | null {
  if (!cultura) return null;
  const norm = cultura
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  for (const item of CULTURE_GALLERY) {
    if (item.keywords.some((k) => norm.includes(k))) return item.emoji;
  }
  return null;
}
