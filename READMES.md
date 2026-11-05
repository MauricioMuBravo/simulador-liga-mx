# ⚽ Simulador Apertura 2026 · Liga MX

¿Quién va a ser campeón del Apertura 2026? Este simulador juega lo que falta del torneo **10,000 veces en un segundo**. Tú eliges los resultados de los partidos que faltan, la tabla se acomoda en vivo y, con un solo botón, se arma toda la Liguilla hasta el campeón.

🔗 **Pruébalo aquí:** https://mauriciomubravo.github.io/NOMBRE-DEL-REPO/

---

## ✨ Qué puedes hacer

- **Elegir resultados:** en cada partido que falta eliges **L** (gana el local), **E** (empate) o **V** (gana la visita). Si tocas el mismo botón otra vez, se quita.
- **Ver la tabla proyectada:** puntos, diferencia de goles y probabilidad de cada equipo de entrar a la **Liguilla** y de terminar como **líder**.
- **Simular un final posible:** llena con marcadores los partidos que no elegiste y arma la tabla final.
- **Simular la Liguilla:** cuartos, semifinales y final con marcadores de ida, vuelta y global, hasta prórroga y penales.
- **Ver quién llega más lejos:** probabilidad de cada equipo de llegar a semis, a la final y de ser **campeón**.
- **Ajustar el modelo:** un control define qué tanto pesa la fuerza de cada equipo (en 0, cada partido es un volado).
- **Usarlo en cualquier pantalla:** diseño responsive para celular, tablet y escritorio.

## 🛠️ Tecnologías

- **HTML5**
- **CSS3**: diseño responsive con Grid y Flexbox, sin frameworks
- **JavaScript puro**: sin librerías
- **GitHub Pages**: publicación

## 🧠 Cómo funciona

El simulador usa una **simulación Monte Carlo**:

1. **Fuerza de cada equipo:** su diferencia de goles por partido.
2. **Goles de cada partido:** se generan al azar con una **distribución de Poisson**, la que mejor describe los goles en el fútbol. El local tiene ventaja: 1.45 goles esperados contra 1.10 del visitante, ajustados por la fuerza de cada uno.
3. **Repetición:** juega el resto del torneo y la Liguilla **10,000 veces** y cuenta cuántas veces cada equipo terminó en cada lugar.

Los resultados que eliges se respetan en todas las simulaciones; para la diferencia de goles cuentan como 1-0 o 0-0.

**Desempate en la tabla:** puntos, luego diferencia de goles y, si siguen iguales, al azar.

### Reglas de la Liguilla 2026

- Sin Play-In: los **8 primeros** entran directo.
- Cuartos de final: **1 vs 8, 2 vs 7, 3 vs 6 y 4 vs 5**.
- Semifinales **con reacomodo**: el mejor posicionado que queda contra el peor.
- Series a **ida y vuelta**; el mejor posicionado cierra en casa.
- **No cuenta el gol de visitante.**
- Cuartos y semis: si el global queda empatado, **avanza el mejor posicionado**.
- Final: si el global queda empatado, hay **prórroga** de 30 minutos y, si sigue igual, **penales**.

> Es un modelo sencillo: no toma en cuenta lesiones, rachas, rotaciones ni el nivel del rival en cada fecha. Los porcentajes son estimaciones, no certezas.

## 🔄 Cómo actualizarlo después de cada jornada

Todo se edita al inicio de `app.js`:

1. **`TABLA`**: actualiza `pts` (puntos), `pj` (partidos jugados) y `dg` (diferencia de goles) de cada equipo.
2. **`PARTIDOS`**: borra los partidos que ya se jugaron.
3. **`DATOS_FECHA`**: cambia el texto con la fecha de los datos.

```js
const TABLA = [
  { equipo: "América", pts: 29, pj: 15, dg: 15 },
  // ...
];

const PARTIDOS = [
  ["Jornada 16", "Pumas", "América"],
  // ...
];
```

## 📁 Estructura

```
├── index.html            # Estructura de la página
├── styles.css            # Estilos y diseño responsive
├── app.js                # Datos, simulación y lógica de la interfaz
├── logo-ligamx.png       # Logo del encabezado
├── favicon.ico           # Ícono de la pestaña
├── favicon-32.png
├── favicon-512.png
├── apple-touch-icon.png  # Ícono al guardar en la pantalla de inicio del iPhone
└── america.png, chivas.png, cruz-azul.png…   # Escudos de los 18 equipos
```

Los escudos se buscan por nombre: `"Cruz Azul"` → `cruz-azul.png` (en minúsculas, sin acentos y con guiones). Si los mueves a una carpeta, cambia `RUTA_ESCUDOS` en `app.js`, por ejemplo a `"escudos/"`.

## 💻 Correrlo en tu computadora

No necesita instalación. Descarga el repositorio y abre `index.html` en tu navegador.

O, si prefieres un servidor local:

```bash
python3 -m http.server 8000
```

y entra a `http://localhost:8000`.

## 📊 Datos

Datos tras la **Jornada 15 del Apertura 2026** (2 de noviembre de 2026), tomados de la tabla general publicada por medios deportivos (Informador, Excélsior y Mediotiempo, entre otros).

## 👨‍💻 Autor

**Ing. Mauricio Muñoz Bravo**: ingeniero en TICs, programador y QA tester.

📲 Instagram: [@elmaurienlared](https://www.instagram.com/elmaurienlared/)

Otro proyecto: [Liga MX 1943–2026, infografía interactiva](https://mauriciomubravo.github.io/Historia-de-Liga-MX/)

---

<sub>Proyecto de aficionado, sin fines de lucro y sin relación oficial con la Liga MX ni con los clubes. Los logotipos y escudos pertenecen a sus respectivos dueños y se usan solo para identificar a los equipos.</sub>
