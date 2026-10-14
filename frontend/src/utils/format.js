export const money = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
}).format(value);

export const longDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('es-MX', {
  day: 'numeric', month: 'long', year: 'numeric',
});

export const people = (count) => `${count} ${count === 1 ? 'persona' : 'personas'}`;

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Años completos desde una fecha 'AAAA-MM-DD' hasta hoy.
export function seniority(startDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) years -= 1;
  return years < 1 ? 'menos de un año' : `${years} ${years === 1 ? 'año' : 'años'}`;
}
