const DATOS_FECHA = "Datos tras la Jornada 15 (2 de noviembre de 2026)";

// pts = puntos, pj = partidos jugados, dg = diferencia de goles
const TABLA = [
  { equipo: "América",   pts: 29, pj: 15, dg: 15 },
  { equipo: "Chivas",    pts: 29, pj: 15, dg: 11 },
  { equipo: "Cruz Azul", pts: 29, pj: 15, dg: 10 },
  { equipo: "Atlas",     pts: 27, pj: 15, dg: 0 },
  { equipo: "Toluca",    pts: 24, pj: 15, dg: 10 },
  { equipo: "Tijuana",   pts: 22, pj: 15, dg: 4 },
  { equipo: "León",      pts: 22, pj: 15, dg: 2 },
  { equipo: "Santos",    pts: 22, pj: 15, dg: 1 },
  { equipo: "Monterrey", pts: 21, pj: 14, dg: 5 },
  { equipo: "Pumas",     pts: 20, pj: 15, dg: -2 },
  { equipo: "Querétaro", pts: 20, pj: 14, dg: -3 },
  { equipo: "Pachuca",   pts: 19, pj: 15, dg: 6 },
  { equipo: "San Luis",  pts: 19, pj: 15, dg: -4 },
  { equipo: "Puebla",    pts: 16, pj: 15, dg: -6 },
  { equipo: "Tigres",    pts: 15, pj: 15, dg: -7 },
  { equipo: "Atlante",   pts: 14, pj: 15, dg: -8 },
  { equipo: "Necaxa",    pts: 10, pj: 15, dg: -12 },
  { equipo: "Juárez",    pts: 8,  pj: 15, dg: -22 },
];

// Partidos que faltan: [jornada, local, visitante]
const PARTIDOS = [
  ["Jornada 16", "San Luis", "Juárez"],
  ["Jornada 16", "Necaxa", "Tijuana"],
  ["Jornada 16", "Atlante", "Santos"],
  ["Jornada 16", "Atlas", "Pachuca"],
  ["Jornada 16", "Tigres", "Cruz Azul"],
  ["Jornada 16", "Toluca", "Monterrey"],
  ["Jornada 16", "Pumas", "América"],
  ["Jornada 16", "Querétaro", "Puebla"],
  ["Jornada 16", "León", "Chivas"],
  ["Jornada 7 · pendiente", "Querétaro", "Monterrey"],
  ["Jornada 17", "Puebla", "San Luis"],
  ["Jornada 17", "Juárez", "Atlas"],
  ["Jornada 17", "Tijuana", "Atlante"],
  ["Jornada 17", "Santos", "León"],
  ["Jornada 17", "Pachuca", "Toluca"],
  ["Jornada 17", "Pumas", "Monterrey"],
  ["Jornada 17", "Tigres", "América"],
  ["Jornada 17", "Chivas", "Cruz Azul"],
  ["Jornada 17", "Querétaro", "Necaxa"],
];

// Colores de respaldo por si no carga el escudo
const COLORES = {
  "América": "#f5c518", "Chivas": "#d62828", "Cruz Azul": "#1e5bc6", "Atlas": "#b3121b",
  "Toluca": "#e63946", "Tijuana": "#c1121f", "León": "#2d8a4e", "Santos": "#3fa66b",
  "Monterrey": "#1d3f8f", "Pumas": "#c9a227", "Querétaro": "#8d99ae", "Pachuca": "#5aa9e6",
  "San Luis": "#e5484d", "Puebla": "#4a6fa5", "Tigres": "#f4a300", "Atlante": "#8e1b3a",
  "Necaxa": "#e5484d", "Juárez": "#36b37e",
};

const SIMULACIONES = 10000;
const LUGARES_LIGUILLA = 8;
const GOLES_LOCAL = 1.45;
const GOLES_VISITA = 1.10;
const PENAL_ACIERTO = 0.75; // probabilidad de anotar cada penal
let pesoFuerza = 0.30;

// Resultados elegidos por el usuario: índice del partido -> "L" | "E" | "V"
const elegidos = new Map();
// Último "final posible" simulado: índice -> [goles local, goles visita]
let finalSimulado = null;
// Última Liguilla simulada
let liguillaSimulada = null;

const base = Object.fromEntries(TABLA.map(t => [t.equipo, t]));
const fuerza = e => base[e].dg / base[e].pj;

// ---------- Números aleatorios ----------
// Generador con semilla: el mismo resultado cada vez que se calcula (como random.seed en Python)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function golesPoisson(promedio, rand) {
  const limite = Math.exp(-promedio);
  let k = 0, p = 1;
  while (true) {
    p *= rand();
    if (p <= limite) return k;
    k++;
  }
}

function golesEsperados(local, visita) {
  const diferencia = fuerza(local) - fuerza(visita);
  return [
    GOLES_LOCAL * Math.exp(pesoFuerza * diferencia),
    GOLES_VISITA * Math.exp(-pesoFuerza * diferencia),
  ];
}

// factor = 1 para 90 minutos; 1/3 para una prórroga de 30 minutos
function jugar(local, visita, rand, factor = 1) {
  const [el, ev] = golesEsperados(local, visita);
  return [golesPoisson(el * factor, rand), golesPoisson(ev * factor, rand)];
}

// ---------- Fase regular ----------
const MARCADOR_ELEGIDO = { L: [1, 0], E: [0, 0], V: [0, 1] };

function aplicarResultado(estado, local, visita, gl, gv) {
  estado.pj[local]++; estado.pj[visita]++;
  estado.dg[local] += gl - gv; estado.dg[visita] += gv - gl;
  if (gl > gv) estado.pts[local] += 3;
  else if (gl < gv) estado.pts[visita] += 3;
  else { estado.pts[local] += 1; estado.pts[visita] += 1; }
}

function estadoInicial() {
  const estado = { pts: {}, dg: {}, pj: {} };
  for (const t of TABLA) {
    estado.pts[t.equipo] = t.pts;
    estado.dg[t.equipo] = t.dg;
    estado.pj[t.equipo] = t.pj;
  }
  return estado;
}

function ordenar(estado, rand) {
  const desempate = Object.fromEntries(TABLA.map(t => [t.equipo, rand ? rand() : 0]));
  return TABLA.map(t => t.equipo).sort((a, b) =>
    (estado.pts[b] - estado.pts[a]) ||
    (estado.dg[b] - estado.dg[a]) ||
    (desempate[b] - desempate[a])
  );
}

// ---------- Liguilla ----------
// Tanda de penales: 5 tiros cada uno y, si siguen empatados, muerte súbita
function tandaPenales(rand) {
  let a = 0, b = 0;
  for (let i = 0; i < 5; i++) {
    if (rand() < PENAL_ACIERTO) a++;
    if (rand() < PENAL_ACIERTO) b++;
  }
  while (a === b) {
    const ta = rand() < PENAL_ACIERTO, tb = rand() < PENAL_ACIERTO;
    if (ta) a++;
    if (tb) b++;
  }
  return [a, b];
}

/*
 * Serie a ida y vuelta. "alto" es el mejor posicionado: juega la vuelta en casa.
 * Cuartos y semis: si el global empata, avanza el mejor posicionado (no hay gol de visitante).
 * Final: si el global empata, prórroga y, si sigue igual, penales.
 */
function simularSerie(alto, bajo, sembrado, rand, esFinal) {
  const ida = jugar(bajo, alto, rand);      // [goles bajo, goles alto]
  const vuelta = jugar(alto, bajo, rand);   // [goles alto, goles bajo]
  const global = [ida[1] + vuelta[0], ida[0] + vuelta[1]]; // [alto, bajo]
  let ganador, nota = "";

  if (global[0] !== global[1]) {
    ganador = global[0] > global[1] ? alto : bajo;
  } else if (!esFinal) {
    ganador = alto;
    nota = "Global empatado: avanza el mejor posicionado";
  } else {
    const prorroga = jugar(alto, bajo, rand, 1 / 3);
    if (prorroga[0] !== prorroga[1]) {
      ganador = prorroga[0] > prorroga[1] ? alto : bajo;
      nota = `Prórroga: ${alto} ${prorroga[0]}-${prorroga[1]} ${bajo}`;
    } else {
      const pen = tandaPenales(rand);
      ganador = pen[0] > pen[1] ? alto : bajo;
      nota = `Penales: ${alto} ${pen[0]}-${pen[1]} ${bajo}`;
    }
  }
  return { alto, bajo, semAlto: sembrado[alto], semBajo: sembrado[bajo], ida, vuelta, global, ganador, nota };
}

function simularLiguilla(orden, rand) {
  const top = orden.slice(0, LUGARES_LIGUILLA);
  const sembrado = Object.fromEntries(top.map((e, i) => [e, i + 1]));
  const porSiembra = lista => [...lista].sort((a, b) => sembrado[a] - sembrado[b]);

  // Cuartos: 1 vs 8, 2 vs 7, 3 vs 6, 4 vs 5
  const cuartos = [[0, 7], [1, 6], [2, 5], [3, 4]]
    .map(([a, b]) => simularSerie(top[a], top[b], sembrado, rand, false));

  // Semifinales con reacomodo: el mejor que queda contra el peor que queda
  const s = porSiembra(cuartos.map(c => c.ganador));
  const semis = [[s[0], s[3]], [s[1], s[2]]]
    .map(([a, b]) => simularSerie(a, b, sembrado, rand, false));

  // Final
  const f = porSiembra(semis.map(c => c.ganador));
  const final = simularSerie(f[0], f[1], sembrado, rand, true);

  return { cuartos, semis, final, campeon: final.ganador };
}

// ---------- Monte Carlo ----------
function contadorVacio() {
  return Object.fromEntries(TABLA.map(t => [t.equipo, 0]));
}

function calcularProbabilidades() {
  const rand = mulberry32(2026);
  const conteo = {
    liguilla: contadorVacio(), lider: contadorVacio(),
    semis: contadorVacio(), final: contadorVacio(), campeon: contadorVacio(),
  };
  const esperados = PARTIDOS.map(([, l, v]) => golesEsperados(l, v));

  for (let s = 0; s < SIMULACIONES; s++) {
    const estado = estadoInicial();
    PARTIDOS.forEach(([, local, visita], i) => {
      const pick = elegidos.get(i);
      let gl, gv;
      if (pick) [gl, gv] = MARCADOR_ELEGIDO[pick];
      else {
        gl = golesPoisson(esperados[i][0], rand);
        gv = golesPoisson(esperados[i][1], rand);
      }
      aplicarResultado(estado, local, visita, gl, gv);
    });
    const pos = ordenar(estado, rand);
    conteo.lider[pos[0]]++;
    for (let k = 0; k < LUGARES_LIGUILLA; k++) conteo.liguilla[pos[k]]++;

    const lig = simularLiguilla(pos, rand);
    lig.cuartos.forEach(c => conteo.semis[c.ganador]++);
    lig.semis.forEach(c => conteo.final[c.ganador]++);
    conteo.campeon[lig.campeon]++;
  }
  return conteo;
}

// Tabla "proyectada": puntos actuales + resultados elegidos (o el final simulado)
function tablaProyectada() {
  const estado = estadoInicial();
  PARTIDOS.forEach(([, local, visita], i) => {
    const pick = elegidos.get(i);
    if (pick) aplicarResultado(estado, local, visita, ...MARCADOR_ELEGIDO[pick]);
    else if (finalSimulado) aplicarResultado(estado, local, visita, ...finalSimulado[i]);
  });
  return estado;
}

const torneoCompleto = () => Boolean(finalSimulado) || elegidos.size === PARTIDOS.length;

function simularUnFinal() {
  const rand = Math.random;
  finalSimulado = PARTIDOS.map(([, local, visita], i) => {
    const pick = elegidos.get(i);
    return pick ? MARCADOR_ELEGIDO[pick] : jugar(local, visita, rand);
  });
}

function simularUnaLiguilla() {
  if (!torneoCompleto()) simularUnFinal();
  const orden = ordenar(tablaProyectada(), null);
  liguillaSimulada = simularLiguilla(orden, Math.random);
}

// ---------- Interfaz ----------
const $ = sel => document.querySelector(sel);

// Carpeta donde están los escudos. Vacía = en la raíz del repositorio, junto a index.html.
// Si algún día los mueves a una carpeta, ponle su nombre con diagonal al final, ej. "escudos/".
const RUTA_ESCUDOS = "";

// Archivo del escudo: "Cruz Azul" -> cruz-azul.png
const slug = nombre => nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "-");

// Escudo del equipo; si la imagen no carga, se muestra un punto con su color
function escudoHTML(nombre, clase = "") {
  const color = COLORES[nombre] || "#888";
  return `<span class="escudo ${clase}" style="--c:${color}"><img src="${RUTA_ESCUDOS}${slug(nombre)}.png" alt="" loading="lazy" onerror="this.parentNode.classList.add('sin-img');this.remove()"></span>`;
}
function equipoHTML(nombre, clase = "") {
  return `<span class="team ${clase}">${escudoHTML(nombre)}<span class="n">${nombre}</span></span>`;
}
function equipoVisitaHTML(nombre, clase = "") {
  return `<span class="team away ${clase}"><span class="n">${nombre}</span>${escudoHTML(nombre)}</span>`;
}

function pintarPartidos() {
  const grupos = new Map();
  PARTIDOS.forEach((p, i) => {
    if (!grupos.has(p[0])) grupos.set(p[0], []);
    grupos.get(p[0]).push(i);
  });

  let html = "";
  for (const [jornada, indices] of grupos) {
    html += `<div class="jornada"><div class="jornada-title">${jornada}</div>`;
    for (const i of indices) {
      const [, local, visita] = PARTIDOS[i];
      const pick = elegidos.get(i);
      const sim = !pick && finalSimulado ? finalSimulado[i] : null;
      let cl = "", cv = "";
      const res = pick || (sim ? (sim[0] > sim[1] ? "L" : sim[0] < sim[1] ? "V" : "E") : null);
      if (res === "L") { cl = "win"; cv = "lose"; }
      if (res === "V") { cl = "lose"; cv = "win"; }
      const botones = ["L", "E", "V"].map(r => {
        const etiqueta = r === "L" ? `Gana ${local}` : r === "V" ? `Gana ${visita}` : "Empate";
        return `<button type="button" data-i="${i}" data-r="${r}" aria-pressed="${pick === r}" aria-label="${etiqueta}" title="${etiqueta}">${r}</button>`;
      }).join("");
      html += `
        <div class="match ${pick ? "picked" : ""}">
          ${equipoHTML(local, cl)}
          <div><div class="pick">${botones}</div>${sim ? `<span class="sim-score">${sim[0]} - ${sim[1]} (simulado)</span>` : ""}</div>
          ${equipoVisitaHTML(visita, cv)}
        </div>`;
    }
    html += `</div>`;
  }
  $("#partidos").innerHTML = html;
}

function textoProb(valor) {
  const pct = valor / SIMULACIONES * 100;
  if (pct === 0) return "0%";
  if (pct < 1) return "<1%";
  if (pct > 99 && pct < 100) return ">99%";
  return `${Math.round(pct)}%`;
}

function celdaProb(valor) {
  const pct = valor / SIMULACIONES * 100;
  const clase = pct === 0 ? "zero" : pct === 100 ? "full" : "";
  return `<span class="prob ${clase}"><span class="bar"><i style="width:${pct}%"></i></span><b>${textoProb(valor)}</b></span>`;
}

function pintarTabla(prob) {
  const estado = tablaProyectada();
  const orden = ordenar(estado, null);
  $("#tabla tbody").innerHTML = orden.map((e, k) => {
    const clases = [k === LUGARES_LIGUILLA - 1 ? "corte" : "", k >= LUGARES_LIGUILLA ? "fuera" : ""].join(" ");
    const dg = estado.dg[e];
    return `<tr class="${clases}">
      <td class="pos c">${k + 1}</td>
      <td class="eq">${equipoHTML(e)}</td>
      <td class="c hide-sm">${estado.pj[e]}</td>
      <td class="c pts">${estado.pts[e]}</td>
      <td class="c">${dg > 0 ? "+" + dg : dg}</td>
      <td class="r">${celdaProb(prob.liguilla[e])}</td>
      <td class="r">${celdaProb(prob.lider[e])}</td>
    </tr>`;
  }).join("");

  const n = elegidos.size;
  $("#meta").textContent = finalSimulado
    ? "Mostrando un final posible y su Liguilla (más abajo). Los % siguen siendo sobre 10,000 torneos."
    : n ? `${n} de ${PARTIDOS.length} partidos elegidos por ti.` : "";
}

// ----- Llave de Liguilla -----
function serieHTML(s, esFinal = false) {
  const filas = [
    { eq: s.alto, sem: s.semAlto, ida: s.ida[1], vta: s.vuelta[0], gl: s.global[0] },
    { eq: s.bajo, sem: s.semBajo, ida: s.ida[0], vta: s.vuelta[1], gl: s.global[1] },
  ];
  // Mostrar primero al que fue local en la ida (el peor posicionado), como en la tele
  filas.reverse();
  return `
    <div class="serie ${esFinal ? "es-final" : ""}">
      <div class="s-head"><span></span><span></span><span>Ida</span><span>Vta</span><span>Glob</span></div>
      ${filas.map(f => `
        <div class="s-row ${f.eq === s.ganador ? "gana" : "pierde"}">
          <span class="seed">${f.sem}</span>
          ${equipoHTML(f.eq)}
          <span class="g">${f.ida}</span><span class="g">${f.vta}</span><span class="g agg">${f.gl}</span>
        </div>`).join("")}
      ${s.nota ? `<div class="s-note">${s.nota}</div>` : ""}
    </div>`;
}

function pintarLiguilla(prob) {
  const cont = $("#llave");
  if (!liguillaSimulada) {
    cont.innerHTML = `
      <div class="vacio">
        <p>Simula la Liguilla para ver una llave completa: cuartos, semifinales, final y campeón.</p>
        <button type="button" class="btn primary" data-accion="liguilla">Simular Liguilla</button>
      </div>`;
  } else {
    const L = liguillaSimulada;
    cont.innerHTML = `
      <div class="ronda r-cuartos"><h3>Cuartos de final</h3><div class="series">${L.cuartos.map(s => serieHTML(s)).join("")}</div></div>
      <div class="ronda r-semis"><h3>Semifinales</h3><div class="series">${L.semis.map(s => serieHTML(s)).join("")}</div></div>
      <div class="ronda r-final"><h3>Final</h3><div class="series">${serieHTML(L.final, true)}</div></div>
      <div class="ronda r-campeon">
        <h3>Campeón</h3>
        <div class="campeon">
          ${escudoHTML(L.campeon, "grande")}
          <div class="c-nombre">${L.campeon}</div>
          <div class="c-sub">Campeón del Apertura 2026 en esta simulación</div>
        </div>
      </div>`;
  }

  // Probabilidades de cada ronda, solo para equipos con opción de Liguilla
  const filas = TABLA.map(t => t.equipo)
    .filter(e => prob.liguilla[e] > 0)
    .sort((a, b) => (prob.campeon[b] - prob.campeon[a]) || (prob.final[b] - prob.final[a]) || (prob.liguilla[b] - prob.liguilla[a]));
  $("#prob-liguilla tbody").innerHTML = filas.map(e => `
    <tr>
      <td class="eq">${equipoHTML(e)}</td>
      <td class="r hide-sm">${textoProb(prob.liguilla[e])}</td>
      <td class="r">${textoProb(prob.semis[e])}</td>
      <td class="r">${textoProb(prob.final[e])}</td>
      <td class="r">${celdaProb(prob.campeon[e])}</td>
    </tr>`).join("");
}

// Pinta los partidos al instante y calcula las probabilidades justo después,
// para que el botón que tocaste responda sin esperar al cálculo
let calculoPendiente = null;
function actualizar() {
  pintarPartidos();
  document.body.classList.add("calculando");
  clearTimeout(calculoPendiente);
  calculoPendiente = setTimeout(() => {
    const prob = calcularProbabilidades();
    pintarTabla(prob);
    pintarLiguilla(prob);
    document.body.classList.remove("calculando");
  }, 16);
}

// ---------- Eventos ----------
$("#partidos").addEventListener("click", ev => {
  const btn = ev.target.closest("button[data-i]");
  if (!btn) return;
  const i = Number(btn.dataset.i), r = btn.dataset.r;
  if (elegidos.get(i) === r) elegidos.delete(i); else elegidos.set(i, r);
  finalSimulado = null;
  liguillaSimulada = null;
  actualizar();
});

$("#btn-una").addEventListener("click", () => {
  simularUnFinal();
  simularUnaLiguilla();
  actualizar();
});

$("#btn-reset").addEventListener("click", () => {
  elegidos.clear(); finalSimulado = null; liguillaSimulada = null;
  actualizar();
});

// Botones de la sección de Liguilla (incluye el del estado vacío)
document.addEventListener("click", ev => {
  const btn = ev.target.closest("[data-accion]");
  if (!btn) return;
  if (btn.dataset.accion === "liguilla") { simularUnaLiguilla(); actualizar(); }
  if (btn.dataset.accion === "otra") {
    if (!torneoCompleto()) simularUnFinal();
    simularUnaLiguilla();
    actualizar();
  }
});

$("#peso").addEventListener("input", ev => {
  pesoFuerza = Number(ev.target.value);
  $("#peso-val").textContent = pesoFuerza.toFixed(2);
  finalSimulado = null;
  liguillaSimulada = null;
  actualizar();
});

$("#datos-fecha").textContent = DATOS_FECHA;
actualizar();
