// Funções de máscara e formatação

// Remove tudo que não é dígito
export const onlyDigits = (value) => (value || '').replace(/\D/g, '');

// Máscara de telefone (celular com 9 dígitos ou fixo com 8)
// Ex: (11) 99999-9999 ou (11) 9999-9999
export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular: (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Máscara de CPF: 000.000.000-00
export function maskCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara de CPF ou CNPJ: 000.000.000-00 / 00.000.000/0000-00
export function maskCpfCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return maskCpf(digits);
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Máscara de CEP: 00000-000
export function maskCep(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

// Máscara de data dd/mm/yyyy
export function maskDate(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,4})$/, '$1');
}

// Converte data dd/mm/yyyy para yyyy-mm-dd (para enviar à API e inputs date)
export function dateToIso(value) {
  if (!value) return '';
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

// Converte data yyyy-mm-dd para dd/mm/yyyy (para exibição)
export function dateToBr(value) {
  if (!value) return '';
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

// Formata valor digitado como moeda BRL (ex: 32000 -> 320,00)
export function formatCurrencyInput(value) {
  const digits = onlyDigits(value);
  const numeric = parseInt(digits || '0', 10);
  const cents = numeric / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents);
}

// Converte string formatada como moeda BRL para número float (ex: 320,00 -> 320.00)
export function parseCurrency(value) {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
