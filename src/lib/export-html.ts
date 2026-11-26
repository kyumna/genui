import { ink, readableOn, resolveColor, soft, softBorder } from "@/components/gen/colors";
import { propSchemas, type UINode } from "@/components/gen/schema";

const MAX_DEPTH = 6;
const SERIES = ["#d97757", "#6a9bcc", "#788c5d", "#c46686"];

const esc = (v: unknown) =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const CSS = `
:root{--background:#faf9f5;--foreground:#1f1e1d;--card:#fff;--muted:#f0eee6;--muted-foreground:#6b6a65;--border:#e8e6dc;--primary:#d97757}
@media (prefers-color-scheme:dark){:root{--background:#262624;--foreground:#f5f4ee;--card:#30302e;--muted:#30302e;--muted-foreground:#a8a69e;--border:#3e3e3b}}
*{box-sizing:border-box}
body{margin:0;background:var(--background);color:var(--foreground);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
main{max-width:42rem;margin:0 auto;padding:2rem 1rem}
.serif{font-family:Georgia,"Times New Roman",serif}
.stack{display:flex;flex-direction:column}
.grid{display:grid;grid-template-columns:1fr}
@media (min-width:640px){.grid{grid-template-columns:repeat(var(--cols),minmax(0,1fr))}}
.card{background:var(--card);border:1px solid var(--border);border-radius:.875rem;padding:1.25rem;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card>h3{margin:0 0 .75rem;font-size:1.125rem;font-weight:400}
.card-body{display:flex;flex-direction:column;gap:1rem}
h1,h2,h3,p{margin:0}
.muted{opacity:.7}
.stat{background:var(--card);border:1px solid var(--border);border-radius:.875rem;padding:1rem}
.stat .label{font-size:.875rem;color:var(--muted-foreground)}
.stat .value{margin-top:.25rem;font-size:1.875rem}
.stat .hint{margin-top:.25rem;font-size:.75rem;color:var(--muted-foreground)}
.table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:.875rem}
table{width:100%;border-collapse:collapse;text-align:left;font-size:.875rem}
th{background:var(--muted);color:var(--muted-foreground);font-weight:500;padding:.5rem 1rem}
td{padding:.5rem 1rem;border-top:1px solid var(--border)}
.slider .row{display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.5rem}
.slider input{width:100%}
.tabs-bar{display:flex;gap:.25rem;border-bottom:1px solid var(--border);margin-bottom:1rem}
.tab{background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;padding:.5rem .75rem;font:inherit;font-size:.875rem;color:var(--muted-foreground);cursor:pointer}
.tab[aria-selected=true]{border-bottom-color:var(--primary);color:var(--foreground)}
.panel[hidden]{display:none}
.chart text{fill:var(--muted-foreground);font-size:11px}
.legend{display:flex;flex-wrap:wrap;gap:.75rem;font-size:.75rem;color:var(--muted-foreground);margin-top:.5rem}
.legend i{display:inline-block;width:.6rem;height:.6rem;border-radius:2px;margin-right:.3rem}
footer{margin-top:2.5rem;text-align:center;font-size:.75rem;color:var(--muted-foreground)}
`;

const SCRIPT = `
document.querySelectorAll("[data-tabs]").forEach(function(t){
  var tabs=t.querySelectorAll(":scope>.tabs-bar>.tab"),panels=t.querySelectorAll(":scope>.panel");
  tabs.forEach(function(b,i){b.addEventListener("click",function(){
    tabs.forEach(function(x,j){x.setAttribute("aria-selected",String(i===j))});
    panels.forEach(function(p,j){p.hidden=i!==j});
  })});
});
document.querySelectorAll("[data-slider]").forEach(function(s){
  var i=s.querySelector("input"),o=s.querySelector("output");
  i.addEventListener("input",function(){o.textContent=i.value});
});
`;

function chart(p: ReturnType<typeof propSchemas.Chart.parse>): string {
  const W = 560, H = 260, L = 40, R = 12, T = 12, B = 28;
  const iw = W - L - R, ih = H - T - B;
  const custom = (p.colors ?? []).map((c) => resolveColor(c));
  const color = (i: number) => custom[i] ?? SERIES[i % SERIES.length];
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
  const max = Math.max(1, ...p.data.flatMap((d) => p.yKeys.map((k) => num(d[k]))));
  const y = (v: number) => T + ih - (v / max) * ih;
  const n = p.data.length;
  const band = iw / n;
  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  for (let g = 0; g <= 4; g++) {
    const v = (max / 4) * g, yy = y(v);
    out += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--border)" stroke-dasharray="3 3"/>`;
    out += `<text x="${L - 6}" y="${yy + 4}" text-anchor="end">${esc(Math.round(v * 10) / 10)}</text>`;
  }
  p.data.forEach((d, i) => {
    out += `<text x="${L + band * i + band / 2}" y="${H - 8}" text-anchor="middle">${esc(d[p.xKey])}</text>`;
  });
  if (p.kind === "bar") {
    const bw = Math.min(40, (band * 0.7) / p.yKeys.length);
    p.data.forEach((d, i) => {
      p.yKeys.forEach((k, j) => {
        const v = num(d[k]);
        const x = L + band * i + band / 2 - (bw * p.yKeys.length) / 2 + bw * j;
        out += `<rect x="${x}" y="${y(v)}" width="${bw}" height="${T + ih - y(v)}" rx="4" fill="${color(j)}"><title>${esc(k)}: ${esc(v)}</title></rect>`;
      });
    });
  } else {
    p.yKeys.forEach((k, j) => {
      const pts = p.data
        .map((d, i) => `${L + band * i + band / 2},${y(num(d[k]))}`)
        .join(" ");
      out += `<polyline points="${pts}" fill="none" stroke="${color(j)}" stroke-width="2"/>`;
    });
  }
  out += "</svg>";
  out += `<div class="legend">${p.yKeys
    .map((k, j) => `<span><i style="background:${color(j)}"></i>${esc(k)}</span>`)
    .join("")}</div>`;
  return out;
}

function render(node: UINode, depth: number): string {
  if (depth > MAX_DEPTH || !Object.hasOwn(propSchemas, node.type)) return "";
  const type = node.type as keyof typeof propSchemas;
  const parsed = propSchemas[type].safeParse(node.props ?? {});
  if (!parsed.success) return "";
  const p = parsed.data as never as Record<string, never>;
  const kids = (node.children ?? []).map((c) => render(c, depth + 1));
  const inner = kids.join("");

  switch (type) {
    case "Stack":
      return `<div class="stack" style="gap:${Number(p.gap) * 4}px">${inner}</div>`;
    case "Grid":
      return `<div class="grid" style="gap:${Number(p.gap) * 4}px;--cols:${Number(p.cols)}">${inner}</div>`;
    case "Card": {
      const c = resolveColor(p.color);
      let style = "";
      if (c && p.variant === "solid")
        style = `background:${c};border-color:${c};color:${readableOn(c)}`;
      else if (c) style = `background:${soft(c)};border-color:${softBorder(c)}`;
      const title = p.title ? `<h3 class="serif">${esc(p.title)}</h3>` : "";
      return `<div class="card" style="${style}">${title}<div class="card-body">${inner}</div></div>`;
    }
    case "Heading": {
      const c = resolveColor(p.color);
      const size = { 1: "2.25rem", 2: "1.5rem", 3: "1.125rem" }[Number(p.level) as 1 | 2 | 3];
      return `<h2 class="serif" style="font-size:${size};font-weight:400;${c ? `color:${ink(c)}` : ""}">${esc(p.text)}</h2>`;
    }
    case "Text": {
      const c = resolveColor(p.color);
      return `<p class="${p.muted ? "muted" : ""}" style="${c ? `color:${ink(c)}` : ""}">${esc(p.text)}</p>`;
    }
    case "Stat": {
      const c = resolveColor(p.color);
      const style = c ? `background:${soft(c)};border-color:${softBorder(c)}` : "";
      return `<div class="stat" style="${style}"><div class="label">${esc(p.label)}</div><div class="value serif" style="${c ? `color:${ink(c)}` : ""}">${esc(p.value)}</div>${p.hint ? `<div class="hint">${esc(p.hint)}</div>` : ""}</div>`;
    }
    case "Table": {
      const cols = p.columns as unknown as string[];
      const rows = p.rows as unknown as (string | number)[][];
      return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    case "Chart":
      return chart(parsed.data as ReturnType<typeof propSchemas.Chart.parse>);
    case "Slider": {
      const c = resolveColor(p.color);
      return `<label class="slider" data-slider style="display:block"><div class="row"><span>${esc(p.label)}</span><output>${esc(p.value)}</output></div><input type="range" min="${Number(p.min)}" max="${Number(p.max)}" step="${Number(p.step)}" value="${Number(p.value)}"${c ? ` style="accent-color:${c}"` : ""}></label>`;
    }
    case "Tabs": {
      const tabs = p.tabs as unknown as string[];
      const bar = tabs
        .map((t, i) => `<button type="button" class="tab" aria-selected="${i === 0}">${esc(t)}</button>`)
        .join("");
      const panels = kids
        .map((k, i) => `<div class="panel"${i === 0 ? "" : " hidden"}>${k}</div>`)
        .join("");
      return `<div data-tabs><div class="tabs-bar">${bar}</div>${panels}</div>`;
    }
  }
}

/** Builds a standalone HTML file (no external requests) from a validated UI tree. */
export function exportHtml(ui: UINode, title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
<main>
${render(ui, 0)}
<footer>Generated with genui</footer>
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

export function downloadHtml(ui: UINode, title: string): void {
  const blob = new Blob([exportHtml(ui, title)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  a.href = url;
  a.download = `${name || "genui"}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
