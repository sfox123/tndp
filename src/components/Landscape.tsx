/**
 * A Tamil Nadu tank cascade, drawn in SVG. Three tanks (eris) step down from
 * the hills, linked by supply channels, with fields, palmyra palms and a
 * village around them.
 *
 * Nothing here knows about the drought stage. Every colour, water level and
 * opacity is a CSS custom property set by html[data-stage] in globals.css,
 * so the scene changes when the stage changes, with no re-render.
 */

import { useId } from "react";

type Pt = [number, number];

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Small deterministic random source so the server and client draw the same scene. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function Field({ quad, rows }: { quad: [Pt, Pt, Pt, Pt]; rows: number }) {
  const [a, b, c, d] = quad;
  const lines = Array.from({ length: rows - 1 }, (_, i) => {
    const t = (i + 1) / rows;
    const from = lerp(a, d, t);
    const to = lerp(b, c, t);
    return <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />;
  });
  return (
    <g className="ls-field">
      <polygon points={quad.map((p) => p.join(",")).join(" ")} />
      <g className="ls-field__rows">{lines}</g>
    </g>
  );
}

function Palm({ x, y, h, lean = 0 }: { x: number; y: number; h: number; lean?: number }) {
  const top: Pt = [x + lean, y - h];
  const w = h * 0.055;
  const leaf = h * 0.34;
  const fronds = Array.from({ length: 11 }, (_, i) => {
    const angle = (-200 + i * 22) * (Math.PI / 180);
    const tip: Pt = [top[0] + Math.cos(angle) * leaf, top[1] + Math.sin(angle) * leaf];
    const side = leaf * 0.16;
    const nx = -Math.sin(angle) * side;
    const ny = Math.cos(angle) * side;
    const mid = lerp(top, tip, 0.5);
    return (
      <path
        key={i}
        d={`M${top[0]} ${top[1]} Q${mid[0] + nx} ${mid[1] + ny} ${tip[0]} ${tip[1]} Q${mid[0] - nx} ${mid[1] - ny} ${top[0]} ${top[1]}Z`}
      />
    );
  });
  return (
    <g className="ls-palm">
      <path
        className="ls-palm__trunk"
        d={`M${x - w} ${y} Q${x + lean * 0.3 - w * 0.4} ${y - h * 0.5} ${top[0] - w * 0.5} ${top[1]} L${top[0] + w * 0.5} ${top[1]} Q${x + lean * 0.3 + w * 0.8} ${y - h * 0.5} ${x + w} ${y}Z`}
      />
      <g className="ls-palm__crown">{fronds}</g>
    </g>
  );
}

function House({ x, y, w, thatch = false }: { x: number; y: number; w: number; thatch?: boolean }) {
  const h = w * 0.5;
  return (
    <g className={`ls-house${thatch ? " ls-house--thatch" : ""}`}>
      <rect className="ls-house__wall" x={x} y={y - h} width={w} height={h} />
      <polygon
        className="ls-house__roof"
        points={`${x - w * 0.12},${y - h} ${x + w * 0.22},${y - h * 1.75} ${x + w * 0.78},${y - h * 1.75} ${x + w * 1.12},${y - h}`}
      />
      <rect className="ls-house__door" x={x + w * 0.42} y={y - h * 0.62} width={w * 0.16} height={h * 0.62} />
    </g>
  );
}

function Cloud({ x, y, s, className }: { x: number; y: number; s: number; className: string }) {
  return (
    <g className={`ls-cloud ${className}`}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <ellipse cx="0" cy="0" rx="74" ry="24" />
        <ellipse cx="-34" cy="-18" rx="34" ry="24" />
        <ellipse cx="14" cy="-28" rx="44" ry="32" />
        <ellipse cx="58" cy="-12" rx="30" ry="20" />
      </g>
    </g>
  );
}

function Tank({ cx, cy, rx, ry, cracks }: { cx: number; cy: number; rx: number; ry: number; cracks: string[] }) {
  return (
    <g className="ls-tank">
      <ellipse className="ls-tank__bund" cx={cx} cy={cy + ry * 0.3} rx={rx * 1.07} ry={ry * 1.12} />
      <ellipse className="ls-tank__bed" cx={cx} cy={cy} rx={rx} ry={ry} />
      <g className="ls-tank__cracks">
        {cracks.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g className="ls-tank__water" style={{ transformOrigin: `${cx + rx * 0.12}px ${cy + ry * 0.4}px` }}>
        <ellipse cx={cx} cy={cy} rx={rx * 0.95} ry={ry * 0.9} />
        <path
          className="ls-tank__shine"
          d={`M${cx - rx * 0.6} ${cy - ry * 0.25} Q${cx - rx * 0.2} ${cy - ry * 0.62} ${cx + rx * 0.3} ${cy - ry * 0.5}`}
        />
        <line
          className="ls-ripple ls-ripple--a"
          x1={cx - rx * 0.3}
          y1={cy + ry * 0.15}
          x2={cx + rx * 0.05}
          y2={cy + ry * 0.15}
        />
        <line
          className="ls-ripple ls-ripple--b"
          x1={cx + rx * 0.2}
          y1={cy + ry * 0.42}
          x2={cx + rx * 0.5}
          y2={cy + ry * 0.42}
        />
      </g>
    </g>
  );
}

function Channel({ d }: { d: string }) {
  return (
    <g className="ls-channel">
      <path className="ls-channel__bed" d={d} />
      <path className="ls-channel__water" d={d} />
      <path className="ls-channel__flow" d={d} />
    </g>
  );
}

/**
 * `viewBox` crops the scene. The default keeps a tall sky above the horizon
 * so a headline can sit in it; pass a tighter box for small screens.
 */
export function Landscape({ className = "", viewBox = "0 -400 1440 1000" }: { className?: string; viewBox?: string }) {
  const skyId = useId();
  const random = seeded(7);
  const rain = Array.from({ length: 70 }, (_, i) => {
    const x = 640 + random() * 780;
    const y = 200 + random() * 110;
    return (
      <line
        key={i}
        x1={x}
        y1={y}
        x2={x - 7}
        y2={y + 24}
        style={{ animationDelay: `${(-random() * 0.9).toFixed(2)}s` }}
      />
    );
  });

  return (
    <svg
      className={`landscape ${className}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Illustration of a village tank cascade. The water level, crops and sky change with the selected drought stage."
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop className="ls-sky__top" offset="0" />
          <stop className="ls-sky__bottom" offset="1" />
        </linearGradient>
      </defs>

      <rect y="-400" width="1440" height="720" fill={`url(#${skyId})`} />

      <g className="ls-sun">
        <g className="ls-sun__rays">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1="0" y1="-66" x2="0" y2="-92" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r="48" />
      </g>

      <Cloud x={1068} y={196} s={1.45} className="ls-cloud--a" />
      <Cloud x={800} y={232} s={1} className="ls-cloud--b" />
      <Cloud x={1330} y={236} s={1.1} className="ls-cloud--c" />
      <g className="ls-rain">{rain}</g>

      <path
        className="ls-hill ls-hill--far"
        d="M0 320V278C110 264 190 256 290 264C380 272 440 244 540 240C650 236 700 214 806 206C906 198 968 176 1070 184C1190 194 1280 250 1440 216V320Z"
      />
      <path
        className="ls-hill ls-hill--near"
        d="M0 320V282C120 262 220 250 330 268C440 286 520 262 640 270C780 280 900 262 1040 272C1180 282 1300 266 1440 276V320Z"
      />

      <rect className="ls-land" y="300" width="1440" height="300" />
      <path className="ls-land ls-land--shade" d="M0 520C260 496 520 540 760 528C1040 514 1240 548 1440 530V600H0Z" />

      <Field
        quad={[
          [30, 352],
          [286, 338],
          [318, 396],
          [20, 418],
        ]}
        rows={7}
      />
      <Field
        quad={[
          [40, 446],
          [430, 424],
          [520, 548],
          [20, 580],
        ]}
        rows={10}
      />
      <Field
        quad={[
          [566, 452],
          [800, 462],
          [772, 574],
          [556, 584],
        ]}
        rows={8}
      />
      <Field
        quad={[
          [1236, 508],
          [1440, 494],
          [1440, 600],
          [1196, 600],
        ]}
        rows={7}
      />

      <Channel d="M352 292C372 304 372 318 390 326" />
      <Channel d="M488 340C540 350 560 356 606 372" />
      <Channel d="M812 404C850 414 850 432 872 446" />
      <Channel d="M1176 494C1216 504 1226 530 1270 548" />

      <Tank cx={430} cy={332} rx={74} ry={15} cracks={["M392 332l14 -4l10 6l16 -3", "M436 338l12 -5l14 4"]} />
      <Tank
        cx={704}
        cy={390}
        rx={128}
        ry={28}
        cracks={["M632 388l22 -8l18 10l26 -6l20 8", "M690 402l16 -9l22 6l18 -8", "M648 398l-10 8M742 384l12 -10"]}
      />
      <Tank
        cx={1012}
        cy={470}
        rx={190}
        ry={45}
        cracks={[
          "M890 466l34 -12l28 16l40 -10l30 12l36 -8",
          "M950 490l26 -14l34 10l28 -12l30 8",
          "M924 454l-16 12M1040 448l18 -14M1100 478l22 10M1002 500l-8 14",
        ]}
      />

      <g className="ls-pond">
        <ellipse className="ls-tank__bed" cx="392" cy="408" rx="34" ry="9" />
        <ellipse
          className="ls-pond__water"
          cx="392"
          cy="408"
          rx="30"
          ry="7.5"
          style={{ transformOrigin: "392px 410px" }}
        />
      </g>

      <g className="ls-village">
        <House x={1196} y={372} w={54} />
        <House x={1262} y={380} w={64} thatch />
        <House x={1340} y={368} w={46} />
        <House x={1150} y={392} w={40} thatch />
      </g>

      <Palm x={556} y={372} h={76} lean={-6} />
      <Palm x={584} y={380} h={56} lean={5} />
      <Palm x={1120} y={388} h={104} lean={8} />
      <Palm x={1408} y={384} h={88} lean={-8} />
      <Palm x={150} y={512} h={132} lean={-12} />
      <Palm x={212} y={530} h={100} lean={10} />
      <Palm x={1338} y={540} h={170} lean={14} />
    </svg>
  );
}
