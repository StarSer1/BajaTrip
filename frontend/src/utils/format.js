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
