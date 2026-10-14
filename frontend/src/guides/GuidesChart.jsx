import { useEffect, useRef, useState } from 'react';

const ROW = 40;
const BAR = 20;
const LABELS = 88;
const VALUE_SPACE = 32;
const AXIS = 24;

// Mide el ancho disponible para dibujar el SVG a tamaño real: así el texto no se encoge en el celular.
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

// Barra con el extremo de datos redondeado y la base recta, apoyada en el eje.
function barPath(x, y, w, h, r = 4) {
  const radius = Math.min(r, w, h / 2);
  return `M${x},${y}h${w - radius}a${radius},${radius} 0 0 1 ${radius},${radius}v${h - 2 * radius}`
    + `a${radius},${radius} 0 0 1 ${-radius},${radius}h${radius - w}z`;
}

// data llega de countByMunicipality(): un conteo por municipio leído del índice de IndexedDB.
export default function GuidesChart({ data }) {
  const [ref, width] = useWidth();
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.max(1, Math.ceil(max / 4));
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const plot = Math.max(0, width - LABELS - VALUE_SPACE);
  const x = (value) => LABELS + (value / top) * plot;
  const height = data.length * ROW + AXIS;

  return <figure className="guides-chart">
    <figcaption id="grafico-pregunta">¿Cuántos guías tenemos en cada municipio?
      <span>{total} {total === 1 ? 'guía registrado' : 'guías registrados'} en total.</span>
    </figcaption>
    <div ref={ref} className="guides-chart__plot">
      {width > 0 && <svg width={width} height={height} role="img" aria-labelledby="grafico-pregunta grafico-resumen">
        <desc id="grafico-resumen">{data.map((d) => `${d.label}: ${d.value}`).join('; ')}.</desc>
        {ticks.map((tick) => <g key={tick} className="guides-chart__tick">
          <line x1={x(tick)} x2={x(tick)} y1={0} y2={data.length * ROW} />
          <text x={x(tick)} y={height - 6} textAnchor="middle">{tick}</text>
        </g>)}
        {data.map((d, i) => {
          const y = i * ROW + (ROW - BAR) / 2;
          return <g key={d.label} className="guides-chart__row">
            <title>{d.label}: {d.value} {d.value === 1 ? 'guía' : 'guías'}</title>
            <rect className="guides-chart__hit" x={0} y={i * ROW} width={width} height={ROW} />
            <text className="guides-chart__label" x={LABELS - 10} y={y + BAR / 2} dominantBaseline="central" textAnchor="end">{d.label}</text>
            {d.value > 0 && <path className="guides-chart__bar" d={barPath(LABELS, y, x(d.value) - LABELS, BAR)} />}
            <text className="guides-chart__value" x={x(d.value) + 6} y={y + BAR / 2} dominantBaseline="central">{d.value}</text>
          </g>;
        })}
        <line className="guides-chart__baseline" x1={LABELS} x2={LABELS} y1={0} y2={data.length * ROW} />
      </svg>}
    </div>
    <details className="guides-chart__table">
      <summary>Ver los datos en una tabla</summary>
      <table>
        <thead><tr><th scope="col">Municipio</th><th scope="col">Guías</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><th scope="row">{d.label}</th><td>{d.value}</td></tr>)}</tbody>
      </table>
    </details>
  </figure>;
}
