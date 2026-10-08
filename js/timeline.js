gsap.registerPlugin(ScrollTrigger);

// Cores (tokens do @theme em src/input.css). Troque aqui para mudar a rota e os marcadores
const ROUTE_BG_CLASS = "stroke-ink/15";
const ROUTE_FILL_CLASS = "stroke-signal-orange";
const MARKER_IDLE_CLASS = "bg-ink/25";
const MARKER_REACHED_CLASS = "bg-signal-orange";

// Ponto da tela onde a rota "está": a rota, os marcadores e o navegador usam o mesmo
const VIEWPORT_POINT = "50%";

// Variação da rota (px). A semente fixa faz a rota sair igual em cada carga e resize; troque-a para sortear outro traçado
const ROUTE_SEED = 1989;
const ROUTE_OFFSET_BASE = 28; // desvio lateral base de cada trecho
const ROUTE_OFFSET_RANGE = [0.4, 1.2]; // fração do desvio base sorteada por trecho
const ROUTE_RADIUS_RANGE = [6, 28]; // raio de cada canto
const ROUTE_BREAK_RANGE = [0.25, 0.75]; // onde, na altura do trecho, ficam as quebras horizontais
const ROUTE_SECOND_BREAK_CHANCE = 0.5; // chance de uma 2ª quebra, mais curta, antes do marcador
const ROUTE_TILT_MAX = 6; // inclinação máxima dos trechos verticais
const ROUTE_CLEARANCE = 24; // distância mínima até o texto e a imagem dos itens
const ROUTE_MOBILE_FACTOR = 0.5; // abaixo de md, todos os desvios caem pela metade
const ROUTE_STROKE = 4;
const desktopQuery = window.matchMedia("(min-width: 768px)");

// Gerador pseudoaleatório com semilla (mulberry32): mesma sequência sempre, ao contrário de Math.random()
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

  routeBg.classList.add(ROUTE_BG_CLASS);
  routeFill.classList.add(ROUTE_FILL_CLASS);

  // O primeiro e o último ("You") ficam sempre quadrados; só os do meio viram losango
  const isMiddle = (index) => index > 0 && index < markers.length - 1;

  // Rotação fica com o GSAP (os marcadores não usam rotate-45); a cor é só troca de classe
  gsap.set(markers, { rotation: 0 });

  function setMarkerReached(marker, reached, animate = true) {
    marker.classList.toggle(MARKER_IDLE_CLASS, !reached);
    marker.classList.toggle(MARKER_REACHED_CLASS, reached);
    if (!isMiddle(markers.indexOf(marker))) return;
    const rotation = reached ? 45 : 0;
    if (animate) gsap.to(marker, { rotation, duration: 0.4, ease: "power2.out", overwrite: true });
    else gsap.set(marker, { rotation });
  }

  // ---------- Rota ----------

  // Centro de cada marcador relativo à .timeline (a rotação não muda o centro do retângulo)
  function markerCenters(box) {
    return markers.map((marker) => {
      const rect = marker.getBoundingClientRect();
      return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
    });
  }

  // Texto e imagem de cada item relativos à .timeline, sem o y da animação de entrada
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

  // Quanto a rota pode se afastar de x para um lado (side = 1 direita, -1 esquerda) entre yTop e yBottom
  // sem chegar a menos de ROUTE_CLEARANCE do texto/imagem nem sair da .timeline
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

  // Polilinha em degraus, com valores próprios em cada trecho: entre dois marcadores desce (levemente inclinada),
  // desvia para o lado (alternando), desce, às vezes faz uma 2ª quebra mais curta, volta ao centro e entra no marcador.
  // Guarda o índice do ponto de cada marcador e o raio de cada canto (0 nos marcadores, para a rota passar no centro)
  function stepPoints(centers, rects, width, scale) {
    const random = mulberry32(ROUTE_SEED);
    const between = (min, max) => min + (max - min) * random();
    const points = [centers[0]];
    const radii = [0];
    const markerIndex = [0];

    // Inclinação de um trecho vertical: sorteada, limitada pelo espaço livre e pelo menor degrau vizinho
    const tilt = (value, x, yTop, yBottom, limit) => {
      const side = Math.sign(value) || 1;
      return side * Math.min(Math.abs(value), roomTo(side, x, yTop, yBottom, rects, width), limit);
    };

    for (let i = 1; i < centers.length; i++) {
      const from = centers[i - 1];
      const to = centers[i];
      const height = to.y - from.y;
      const side = i % 2 === 1 ? 1 : -1;

      // Sorteia sempre a mesma quantidade de números, para um trecho não mudar os seguintes
      const offsetDraw = between(...ROUTE_OFFSET_RANGE);
      const break1Draw = between(ROUTE_BREAK_RANGE[0], (ROUTE_BREAK_RANGE[0] + ROUTE_BREAK_RANGE[1]) / 2);
      const break2Draw = random();
      const secondBreak = random() < ROUTE_SECOND_BREAK_CHANCE;
      const secondOffsetDraw = between(0.3, 0.6);
      const break3Draw = between(0.35, 0.65);
      const tiltDraws = [0, 1, 2, 3].map(() => between(-ROUTE_TILT_MAX, ROUTE_TILT_MAX) * scale);
      const radiusDraws = [0, 1, 2, 3, 4, 5].map(() => between(...ROUTE_RADIUS_RANGE));

      // 1ª quebra na metade de cima da faixa, 2ª pelo menos 15% abaixo dela; as duas entre 25% e 75% da altura
      const y1 = from.y + height * break1Draw;
      const break2Min = Math.min(break1Draw + 0.15, ROUTE_BREAK_RANGE[1]);
      const y2 = from.y + height * (break2Min + (ROUTE_BREAK_RANGE[1] - break2Min) * break2Draw);
      const y3 = y2 + (to.y - y2) * break3Draw;

      // Desvio principal: sorteado e limitado pelo espaço livre do lado, na faixa em que corre
      const offset = side * Math.min(ROUTE_OFFSET_BASE * scale * offsetDraw, roomTo(side, from.x, y1, y2, rects, width));
      const offset2 = offset * secondOffsetDraw;
      const lastJog = secondBreak ? offset2 : offset;

      // Cada inclinação fica abaixo de 1/3 do degrau vizinho, para nenhum degrau inverter de sentido
      const tilt1 = tilt(tiltDraws[0], from.x, from.y, y1, Math.abs(offset) / 3);
      const tilt2 = tilt(tiltDraws[1], from.x + offset, y1, y2, Math.abs(offset - (secondBreak ? offset2 : 0)) / 3);
      const tilt4 = tilt(tiltDraws[3], to.x, y2, to.y, Math.abs(lastJog) / 3);

      const segment = [
        { x: from.x + tilt1, y: y1 },
        { x: from.x + offset, y: y1 },
        { x: from.x + offset + tilt2, y: y2 },
      ];
      if (secondBreak) {
        const tilt3 = tilt(tiltDraws[2], from.x + offset2, y2, y3, Math.abs(offset2) / 3);
        segment.push({ x: from.x + offset2, y: y2 }, { x: from.x + offset2 + tilt3, y: y3 }, { x: to.x + tilt4, y: y3 });
      } else {
        segment.push({ x: to.x + tilt4, y: y2 });
      }

      segment.forEach((point, index) => {
        points.push(point);
        radii.push(radiusDraws[index]);
      });
      points.push(to);
      radii.push(0);
      markerIndex.push(points.length - 1);
    }
    return { points, radii, markerIndex };
  }

  // Polilinha → "d" com cantos arredondados (curva quadrática no vértice); raio 0 = passa exatamente pelo ponto
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

  // Gera o "d" dos dois paths e mede em que fração do comprimento cada marcador está,
  // para a ponta laranja chegar no marcador junto com o gatilho dele
  function buildRoute() {
    const box = timeline.getBoundingClientRect();
    const scale = desktopQuery.matches ? 1 : ROUTE_MOBILE_FACTOR;
    const centers = markerCenters(box);
    const { points, radii, markerIndex } = stepPoints(centers, obstacleRects(box), box.width, scale);

    const fractions = markerIndex.map((index) => {
      if (index === 0) return 0;
      routeBg.setAttribute("d", roundedPath(points.slice(0, index + 1), radii));
      return routeBg.getTotalLength();
    });
    const total = fractions[fractions.length - 1] || 1;

    const d = roundedPath(points, radii);
    routeBg.setAttribute("d", d);
    routeFill.setAttribute("d", d);

    return { ys: centers.map((c) => c.y), fractions: fractions.map((len) => len / total) };
  }

  let route = buildRoute();
  let onRouteChange = () => {};

  // ---------- Navegador lateral ----------

  // O estilo do ativo vem do atributo data-active; a classe is-active fica como gancho
  let activeId = null;
  function setActiveNav(id) {
    activeId = id;
    navLinks.forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle("is-active", active);
      link.toggleAttribute("data-active", active);
    });
  }

  // Ativo é o item que ocupa o meio da tela (data-nav = id do item)
  items.forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: `top ${VIEWPORT_POINT}`,
      end: `bottom ${VIEWPORT_POINT}`,
      // markers: true,
      onToggle: (self) => {
        if (self.isActive) setActiveNav(item.id);
        else if (activeId === item.id) setActiveNav(null);
      },
    });
  });

  // ---------- Animações ----------

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Progresso da rota: um trecho por marcador, cada um com a duração da distância vertical entre eles,
    // então a ponta passa em cada marcador exatamente quando ele cruza o meio da tela.
    // Anima o atributo stroke-dashoffset (unitless, relativo ao pathLength="1")
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
          // markers: true,
        },
      });
      for (let i = 1; i < fractions.length; i++) {
        fillTimeline.fromTo(
          routeFill,
          { attr: { "stroke-dashoffset": 1 - fractions[i - 1] } },
          // Só o 1º trecho aplica o valor inicial na criação; os outros deixariam a rota parcialmente preenchida
          { attr: { "stroke-dashoffset": 1 - fractions[i] }, ease: "none", duration: Math.max(ys[i] - ys[i - 1], 1), immediateRender: i === 1 },
        );
      }
    }

    createFill();
    onRouteChange = createFill;

    // Marcadores: laranja (e losango, nos do meio) quando a rota chega no centro; voltam ao rolar para cima
    markers.forEach((marker) => {
      ScrollTrigger.create({
        trigger: marker,
        start: `center ${VIEWPORT_POINT}`,
        // markers: true,
        onEnter: () => setMarkerReached(marker, true),
        onLeaveBack: () => setMarkerReached(marker, false),
      });
    });

    // Entrada dos itens: fade + sobe, uma vez só
    items.forEach((item) => {
      gsap.from(item.querySelector(".timeline-content"), {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: item,
          start: "top 75%",
          toggleActions: "play none none none",
          // markers: true,
        },
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

  // Movimento reduzido: rota já preenchida e marcadores no estado final, sem giro animado
  mm.add("(prefers-reduced-motion: reduce)", () => {
    routeFill.setAttribute("stroke-dashoffset", 0);
    markers.forEach((marker) => setMarkerReached(marker, true, false));

    return () => {
      routeFill.setAttribute("stroke-dashoffset", 1);
      markers.forEach((marker) => setMarkerReached(marker, false, false));
    };
  });

  // ---------- Recalcular ----------

  // Rota segue a posição real dos marcadores: refaz no resize e quando as imagens terminam de carregar
  function refreshRoute() {
    route = buildRoute();
    onRouteChange();
    ScrollTrigger.refresh();
  }

  // Só a largura muda o layout da timeline. No mobile a barra de endereço muda a altura a cada scroll,
  // e refazer a rota + ScrollTrigger.refresh() nesses eventos travaria a rolagem
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
