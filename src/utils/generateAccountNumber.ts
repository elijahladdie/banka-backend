export function generateAccountNumber(nationalId: string): string {
  const year = new Date().getFullYear().toString();
  const last4ofId = nationalId.slice(-4).padStart(4, "0");
  const random8 = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${year}${last4ofId}${random8}`;
}
