"use client";

import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Point = [number, number];

const continents: Point[][] = [
  [[55,105],[135,65],[235,78],[290,122],[270,168],[224,178],[205,226],[158,246],[132,211],[84,201],[49,157]],
  [[205,243],[262,252],[294,315],[278,405],[243,468],[217,395],[194,328]],
  [[435,92],[494,69],[553,89],[560,125],[522,145],[500,190],[459,181],[429,142]],
  [[465,186],[543,173],[596,227],[582,321],[548,405],[508,394],[486,313],[449,256]],
  [[548,112],[645,72],[760,82],[866,121],[921,170],[887,224],[808,230],[750,278],[681,239],[628,191],[575,181]],
  [[795,335],[865,326],[923,366],[906,421],[844,435],[802,397]],
  [[316,64],[362,47],[389,69],[361,92],[322,89]],
];

function inside(point: Point, polygon: Point[]) {
  const [x, y] = point;
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) hit = !hit;
  }
  return hit;
}

const mapDots = Array.from({ length: 42 }, (_, row) =>
  Array.from({ length: 84 }, (_, column) => [column * 12 + 4, row * 12 + 4] as Point),
)
  .flat()
  .filter((point) => continents.some((continent) => inside(point, continent)));

const cities = [
  { name: "Fairbanks", x: "13.5%", y: "20%" },
  { name: "Los Angeles", x: "15.5%", y: "38%" },
  { name: "Brasília", x: "34.8%", y: "66%" },
  { name: "Lisbon", x: "46.2%", y: "40%" },
  { name: "London", x: "49.2%", y: "31.5%" },
  { name: "Nairobi", x: "58.3%", y: "59.5%" },
  { name: "New Delhi", x: "70.8%", y: "44%" },
  { name: "Vladivostok", x: "86.7%", y: "30%" },
];

const paths = [
  { id: "la-london", d: "M155 190 Q320 40 492 158", delay: "0s", duration: "5.5s" },
  { id: "london-delhi", d: "M492 158 Q610 64 708 220", delay: "1.7s", duration: "4.8s" },
  { id: "delhi-vlad", d: "M708 220 Q780 112 867 150", delay: "3.1s", duration: "4.3s" },
  { id: "lisbon-nairobi", d: "M462 200 Q540 225 583 298", delay: ".8s", duration: "4.6s" },
  { id: "fairbanks-brasilia", d: "M135 100 Q310 185 348 330", delay: "2.5s", duration: "6.2s" },
];

export function WorldMap() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="community" className="section map-section" aria-labelledby="map-heading">
      <div className="content-width">
        <motion.div
          className="map-header"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: .4 }}
          transition={{ duration: .65 }}
        >
          <div>
            <p className="section-kicker">Made for curious teams</p>
            <h2 id="map-heading" className="section-heading">One library. A world of better interfaces.</h2>
            <p className="section-copy">
              Designers, founders, and engineers use Cobbins to make faster,
              clearer product decisions wherever they build.
            </p>
          </div>
          <div className="live-count"><span className="live-dot" /> 2,400+ screens explored today</div>
        </motion.div>

        <motion.div
          className="world-map-wrap"
          initial={{ opacity: 0, scale: reduceMotion ? 1 : .97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: .3 }}
          transition={{ duration: .8 }}
        >
          <svg className="world-dots" viewBox="0 0 1000 500" aria-label="Dotted world map showing Cobbins users around the world">
            {mapDots.map(([x, y]) => <circle className="map-dot" key={`${x}-${y}`} cx={x} cy={y} r="1.65" />)}
          </svg>

          <svg className="flight-paths" viewBox="0 0 1000 500" aria-hidden>
            <defs>
              <linearGradient id="flight-gradient" x1="0" x2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
                <stop offset=".5" stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {paths.map((path, index) => (
              <g key={path.id}>
                <motion.path
                  id={path.id}
                  className="flight-line"
                  d={path.d}
                  stroke="url(#flight-gradient)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: .58 }}
                  viewport={{ once: true, amount: .4 }}
                  transition={{ duration: reduceMotion ? 0 : 1.2, delay: reduceMotion ? 0 : index * .14 }}
                />
                {!reduceMotion && (
                  <circle className="travel-dot" r="3">
                    <animateMotion begin={path.delay} dur={path.duration} repeatCount="indefinite">
                      <mpath href={`#${path.id}`} />
                    </animateMotion>
                  </circle>
                )}
              </g>
            ))}
          </svg>

          {cities.map((city, index) => (
            <motion.span
              className="city-marker"
              key={city.name}
              style={{ "--x": city.x, "--y": city.y, animationDelay: `${index * .2}s` } as CSSProperties}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : .7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: .3 }}
              transition={{ delay: reduceMotion ? 0 : .35 + index * .08 }}
            >
              {city.name}
            </motion.span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
