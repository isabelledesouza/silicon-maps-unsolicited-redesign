gsap.registerPlugin(ScrollTrigger);

const ROUTE_BG_CLASS = "stroke-blue-medium/45";
const ROUTE_FILL_CLASS = "stroke-silicon-blue";
const MARKER_IDLE_CLASS = "bg-blue-medium";
const MARKER_REACHED_CLASS = "bg-signal-orange";

const VIEWPORT_POINT = "50%";

const ROUTE_SEED = 1989;
const ROUTE_DRIFT_RANGE = [0.04, 0.08];
const ROUTE_DRIFT_KEEP = [0.6, 1];
const ROUTE_TURN_Y = [[0.22, 0.34], [0.62, 0.76]];
const ROUTE_STRAIGHT = 28;
const ROUTE_RADIUS = 18;
const ROUTE_CLEARANCE = 8;
const ROUTE_STROKE = 3;
const CONTOUR_OFFSETS = [-0.24, 0.29];
const CONTOUR_WOBBLE = 0.03;
const BEYOND_RISE = 44;
const BEYOND_RISE_MOBILE = 58;
const PLANE_STOP = 0.78;
const PLANE_FLIGHT = 1.8;
const desktopQuery = window.matchMedia("(min-width: 768px)");

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const timeline = document.querySelector(".timeline");

if (timeline) {
  const routeBg = document.getElementById("route-bg");
  const routeFill = document.getElementById("route-fill");
  const items = gsap.utils.toArray(".timeline-item", timeline);
  const markers = gsap.utils.toArray(".timeline-marker", timeline);
  const navLinks = gsap.utils.toArray(".timeline-nav a[data-nav]");
  const contours = gsap.utils.toArray("#route-contours path");
  const signs = gsap.utils.toArray("#route-signs textPath");
  const beyond = document.getElementById("route-beyond");
  const beyondArc = document.getElementById("route-arc");
  const plane = document.getElementById("route-plane");
  const arcReveal = document.getElementById("route-arc-reveal");
  const flight = { t: PLANE_STOP, trail: 1 };
  let flightTween = null;

  routeBg.classList.add(ROUTE_BG_CLASS);
  routeFill.classList.add(ROUTE_FILL_CLASS);

  const isMiddle = (index) => index > 0 && index < markers.length - 1;

  gsap.set(markers, { rotation: 0 });

  function setMarkerReached(marker, reached, animate = true) {
    marker.classList.toggle(MARKER_IDLE_CLASS, !reached);
    marker.classList.toggle(MARKER_REACHED_CLASS, reached);
    if (markers.indexOf(marker) === markers.length - 1) setBeyond(reached, animate);
    if (!isMiddle(markers.indexOf(marker))) return;
    const rotation = reached ? 45 : 0;
    if (animate) gsap.to(marker, { rotation, duration: 0.4, ease: "power2.out", overwrite: true });
    else gsap.set(marker, { rotation });
  }

  function renderFlight() {
    const length = beyondArc.getTotalLength();
    if (!length) return;
    const at = beyondArc.getPointAtLength(length * flight.t);
    const ahead = beyondArc.getPointAtLength(Math.min(length, length * flight.t + 1));
    const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
    plane.setAttribute("transform", `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
    arcReveal.setAttribute("stroke-dashoffset", (1 - flight.trail).toFixed(4));
  }

  function setBeyond(reached, animate) {
    if (flightTween) flightTween.kill();
    if (!reached) {
      if (animate) gsap.to(beyond, { opacity: 0, duration: 0.4, overwrite: true });
      else gsap.set(beyond, { opacity: 0 });
      return;
    }
    if (!animate) {
      gsap.set(beyond, { opacity: 1 });
      Object.assign(flight, { t: PLANE_STOP, trail: 1 });
      renderFlight();
      return;
    }
    Object.assign(flight, { t: 0, trail: 0 });
    renderFlight();
    gsap.to(beyond, { opacity: 1, duration: 0.3, overwrite: true });
    flightTween = gsap.timeline({ onUpdate: renderFlight })
      .to(flight, {
        t: PLANE_STOP,
        duration: PLANE_FLIGHT,
        ease: "power1.inOut",
        onUpdate: () => { flight.trail = flight.t; },
      })
      .to(flight, { trail: 1, duration: 0.5, ease: "power1.out" });
  }

  function markerCenters(box) {
    return markers.map((marker) => {
      const rect = marker.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
    });
  }

  function obstacleRects(box) {
    return items.flatMap((item) => {
      const content = item.querySelector(".timeline-content");
      const shiftY = content ? Number(gsap.getProperty(content, "y")) || 0 : 0;
      return gsap.utils.toArray(".timeline-copy, .timeline-image", item).map((el) => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left - box.left, right: rect.right - box.left, top: rect.top - box.top - shiftY, bottom: rect.bottom - box.top - shiftY };
      });
    });
  }

  function roomTo(side, x, yTop, yBottom, rects, width) {
    const margin = ROUTE_CLEARANCE + ROUTE_STROKE / 2;
    let room = side > 0 ? width - x - ROUTE_STROKE / 2 : x - ROUTE_STROKE / 2;
    rects.forEach((r) => {
      if (r.bottom + margin <= Math.min(yTop, yBottom) || r.top - margin >= Math.max(yTop, yBottom)) return;
      if (side > 0 && r.left >= x) room = Math.min(room, r.left - x - margin);
      if (side < 0 && r.right <= x) room = Math.min(room, x - r.right - margin);
    });
    return Math.max(room, 0);
  }

  function roadPoints(centers, rects, width, radius) {
    const random = mulberry32(ROUTE_SEED);
    const between = (min, max) => min + (max - min) * random();
    const points = [centers[0]];
    const radii = [0];
    const markerIndex = [0];

    for (let i = 1; i < centers.length; i++) {
      const from = centers[i - 1];
      const to = centers[i];
      const height = to.y - from.y;
      const side = i % 2 === 1 ? 1 : -1;
      const xAt = (t) => from.x + (to.x - from.x) * t;

      const driftDraw = between(...ROUTE_DRIFT_RANGE);
      const keepDraw = between(...ROUTE_DRIFT_KEEP);
      const t1 = between(...ROUTE_TURN_Y[0]);
      const t2 = between(...ROUTE_TURN_Y[1]);

      const straight = Math.min(ROUTE_STRAIGHT, height * 0.08);
      const y1 = from.y + height * t1;
      const y2 = from.y + height * t2;
      const drift = side * Math.min(width * driftDraw, roomTo(side, from.x, y1 - radius, y2 + radius, rects, width));

      points.push(
        { x: from.x, y: from.y + straight },
        { x: xAt(t1) + drift, y: y1 },
        { x: xAt(t2) + drift * keepDraw, y: y2 },
        { x: to.x, y: to.y - straight },
        to,
      );
      radii.push(radius, radius, radius, radius, 0);
      markerIndex.push(points.length - 1);
    }
    return { points, radii, markerIndex };
  }

  function roundedPath(points, radii) {
    const f = (n) => Math.round(n * 10) / 10;
    let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      const next = points[i + 1];
      const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
      if (!lenIn || !lenOut) continue;
      const r = Math.min(radii[i], lenIn / 2, lenOut / 2);
      if (!r) {
        d += ` L ${f(cur.x)} ${f(cur.y)}`;
        continue;
      }
      const a = { x: cur.x - ((cur.x - prev.x) / lenIn) * r, y: cur.y - ((cur.y - prev.y) / lenIn) * r };
      const b = { x: cur.x + ((next.x - cur.x) / lenOut) * r, y: cur.y + ((next.y - cur.y) / lenOut) * r };
      d += ` L ${f(a.x)} ${f(a.y)} Q ${f(cur.x)} ${f(cur.y)} ${f(b.x)} ${f(b.y)}`;
    }
    const last = points[points.length - 1];
    return `${d} L ${f(last.x)} ${f(last.y)}`;
  }

  function smoothPath(points) {
    const f = (n) => Math.round(n * 10) / 10;
    const at = (i) => points[Math.max(0, Math.min(points.length - 1, i))];
    let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      d += ` C ${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return d;
  }

  function drawContours(centers, height, width) {
    const random = mulberry32(ROUTE_SEED + 1);
    const ys = [-40];
    centers.forEach((c, i) => ys.push(c.y, (c.y + (i + 1 < centers.length ? centers[i + 1].y : height + 40)) / 2));
    ys.push(height + 40);
    contours.forEach((path, index) => {
      const points = ys.map((y) => ({
        x: centers[0].x + width * (CONTOUR_OFFSETS[index] + (random() * 2 - 1) * CONTOUR_WOBBLE),
        y,
      }));
      path.setAttribute("d", smoothPath(points));
    });
  }

  function drawBeyond(last, box) {
    const endX = document.documentElement.clientWidth - box.left;
    const run = endX - last.x;
    let d;
    if (desktopQuery.matches) {
      const endY = last.y - BEYOND_RISE;
      d = `M ${last.x} ${last.y} C ${last.x + run * 0.3} ${last.y + 6} ${last.x + run * 0.55} ${endY - 6} ${endX} ${endY}`;
    } else {
      const endY = last.y - BEYOND_RISE_MOBILE;
      d = `M ${last.x} ${last.y} C ${last.x} ${endY - 4} ${last.x + run * 0.35} ${endY + 2} ${endX} ${endY}`;
    }
    beyondArc.setAttribute("d", d);
    arcReveal.setAttribute("d", d);
    renderFlight();
  }

  function buildRoute() {
    const box = timeline.getBoundingClientRect();
    const centers = markerCenters(box);
    const radius = desktopQuery.matches ? ROUTE_RADIUS : ROUTE_RADIUS / 2;
    const { points, radii, markerIndex } = roadPoints(centers, obstacleRects(box), box.width, radius);

    const fractions = markerIndex.map((index) => {
      if (index === 0) return 0;
      routeBg.setAttribute("d", roundedPath(points.slice(0, index + 1), radii));
      return routeBg.getTotalLength();
    });
    const total = fractions[fractions.length - 1] || 1;
    const relative = fractions.map((len) => len / total);

    const d = roundedPath(points, radii);
    routeBg.setAttribute("d", d);
    routeFill.setAttribute("d", d);

    signs.forEach((sign, index) => {
      const a = index < relative.length ? relative[index] : 0;
      const b = index + 1 < relative.length ? relative[index + 1] : 1;
      sign.setAttribute("startOffset", `${(((a + b) / 2) * 100).toFixed(2)}%`);
    });
    drawContours(centers, box.height, box.width);
    drawBeyond(centers[centers.length - 1], box);

    return { ys: centers.map((c) => c.y), fractions: relative };
  }

  let route = buildRoute();
  let onRouteChange = () => {};

  let activeId = null;
  function setActiveNav(id) {
    activeId = id;
    navLinks.forEach((link) => {
      const active = link.dataset.nav === id;
      link.toggleAttribute("data-active", active);
    });
  }

  items.forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: `top ${VIEWPORT_POINT}`,
      end: `bottom ${VIEWPORT_POINT}`,
      onToggle: (self) => {
        if (self.isActive) setActiveNav(item.id);
        else if (activeId === item.id) setActiveNav(null);
      },
    });
  });

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    let fillTimeline = null;

    function createFill() {
      if (fillTimeline) fillTimeline.scrollTrigger.kill();
      if (fillTimeline) fillTimeline.kill();

      const { ys, fractions } = route;
      fillTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: timeline,
          start: () => `top+=${route.ys[0]} ${VIEWPORT_POINT}`,
          end: () => `top+=${route.ys[route.ys.length - 1]} ${VIEWPORT_POINT}`,
          scrub: true,
        },
      });
      for (let i = 1; i < fractions.length; i++) {
        fillTimeline.fromTo(
          routeFill,
          { attr: { "stroke-dashoffset": 1 - fractions[i - 1] } },
          { attr: { "stroke-dashoffset": 1 - fractions[i] }, ease: "none", duration: Math.max(ys[i] - ys[i - 1], 1), immediateRender: i === 1 },
        );
      }
    }

    createFill();
    onRouteChange = createFill;

    markers.forEach((marker) => {
      ScrollTrigger.create({
        trigger: marker,
        start: `center ${VIEWPORT_POINT}`,
        onEnter: () => setMarkerReached(marker, true),
        onLeaveBack: () => setMarkerReached(marker, false),
      });
    });

    return () => {
      onRouteChange = () => {};
      if (fillTimeline) fillTimeline.scrollTrigger.kill();
      if (fillTimeline) fillTimeline.kill();
      routeFill.setAttribute("stroke-dashoffset", 1);
      markers.forEach((marker) => setMarkerReached(marker, false, false));
    };
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    routeFill.setAttribute("stroke-dashoffset", 0);
    markers.forEach((marker) => setMarkerReached(marker, true, false));

    return () => {
      routeFill.setAttribute("stroke-dashoffset", 1);
      markers.forEach((marker) => setMarkerReached(marker, false, false));
    };
  });

  function refreshRoute() {
    route = buildRoute();
    onRouteChange();
    ScrollTrigger.refresh();
  }

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshRoute, 150);
  });
  window.addEventListener("load", refreshRoute);
}
