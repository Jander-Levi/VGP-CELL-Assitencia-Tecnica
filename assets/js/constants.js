// constants.js
// Constantes e enums do sistema

export const STATUS = [
  "Aberta",
  "Em Análise",
  "Aguardando Peça",
  "Em Manutenção",
  "Aguardando Aprovação",
  "Concluída",
  "Entregue",
  "Cancelada",
];

export const PAYMENT_METHODS = [
  "Dinheiro",
  "PIX",
  "Cartão de Débito",
  "Cartão de Crédito",
  "Transferência",
];

export const PAYMENT_STATUS = ["Pendente", "Pago", "Parcial"];

export const WARRANTY_TERMS = {
  PARTS: 90, // dias
  SERVICE: 30, // dias
};

export const DEFAULT_SETTINGS = {
  businessName: "VGP CELL",
  phone: "(XX) XXXXX-XXXX",
  address: "Seu endereço aqui",
  email: "contato@email.com",
  warrantyTerms: `
1. A garantia cobre apenas defeitos de fabricação
2. Não cobre danos causados por mau uso
3. Peças têm garantia de ${WARRANTY_TERMS.PARTS} dias
4. Serviços têm garantia de ${WARRANTY_TERMS.SERVICE} dias
5. A garantia é válida mediante apresentação deste termo
  `.trim(),
};

export function statusClass(s) {
  const n = (s || "")
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase();
  if (n === "aberta") return "aberta";
  if (n === "em analise") return "analise";
  if (n === "aguardando peca") return "peca";
  if (n === "concluida") return "concluida";
  return "entregue";
}
