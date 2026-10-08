// Seção "How you get on the map": um vídeo curto feito em código. Uma timeline mestre do GSAP, por tempo e em loop,
// percorre os 4 cards; o card ativo vem dos rótulos step1..step4 da própria timeline.
// Toca só quando a seção está pelo menos 40% visível; ao sair, pausa e volta ao início. Estilos em src/process-map.css

// ---------- Constantes ----------

const VIEW_W = 2896; // largura do viewBox (mesmo sistema de coordenadas da imagem)
const PLACEMENT = { x: 2100, y: 1600 }; // ponto da vaga na imagem: área urbana calma, embaixo à direita
const ZONE_R = VIEW_W * 0.06; // raio da zona (6% da largura); as medidas do overlay no HTML derivam dele
const RING_R = VIEW_W * 0.03; // raio final do anel do marcador (3% da largura)
const SCRIM_OPACITY = 0.75; // fundo azul-marinho da zona, para os detalhes lerem sobre a imagem
const START_VISIBLE = 0.4; // fração da seção visível para começar

// Tempos (s)
const T = {
  step1: 0,
  step2: 3.2,
  step3: 6.4,
  step4: 9.6,
  reset: 14,
  end: 15,
  zoneDraw: 1.2,
  fade: 0.6,
  gridDraw: 0.8, // cada linha; com o stagger o grid todo leva ~1.4s
  gridStagger: 0.08,
  proofDraw: 0.7,
  proofStagger: 0.06,
  clear: 0.5, // passo 4: some a preparação
  markerUp: 0.35,
  markerSettle: 0.25,
  ring: 0.9,
  label: 0.4,
  resetFade: 0.8,
};

const map = document.getElementById("map");

if (map) {
  const section = document.getElementById("process");
  const split = section.querySelector(".pm-split");
  const cards = gsap.utils.toArray(".pm-card", section);
  const toggle = document.getElementById("pm-toggle");

  // Tudo da vaga sai do ponto PLACEMENT e do raio ZONE_R
  document.getElementById("placement").setAttribute("transform", `translate(${PLACEMENT.x} ${PLACEMENT.y})`);
  map.querySelectorAll(".pm-zone, .pm-scrim, #zone-draw-path").forEach((circle) => circle.setAttribute("r", ZONE_R));

  // Linha que se "desenha": pathLength="1", stroke-dashoffset de 1 a 0
  const drawIn = (targets, vars, position) =>
    tl.fromTo(targets, { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, ease: "power2.out", ...vars }, position);
  const fadeIn = (targets, position, opacity = 1, duration = T.fade) =>
    tl.fromTo(targets, { opacity: 0 }, { opacity, duration }, position);
  const show = (targets, position) => fadeIn(targets, position, 1, 0.01);

  // ---------- Cards ----------

  let activeCard = 0;
  function setActiveCard(step) {
    if (step === activeCard) return;
    activeCard = step;
    cards.forEach((card, index) => card.classList.toggle("is-active", index + 1 === step));
  }

  // Card ativo pelo tempo da timeline, a partir dos rótulos (funciona também ao buscar com time())
  function stepAt(time) {
    const { labels } = tl;
    if (time >= labels.reset) return 1;
    if (time >= labels.step4) return 4;
    if (time >= labels.step3) return 3;
    if (time >= labels.step2) return 2;
    return 1;
  }

  // ---------- Timeline mestre ----------

  const tl = gsap.timeline({
    paused: true,
    repeat: -1,
    defaults: { ease: "power2.inOut" },
    onUpdate: () => setActiveCard(stepAt(tl.time())),
  });

  tl.addLabel("step1", T.step1)
    .addLabel("step2", T.step2)
    .addLabel("step3", T.step3)
    .addLabel("step4", T.step4)
    .addLabel("reset", T.reset);

  // Passo 1: a zona se desenha, ganha o fundo e o rótulo; a legenda aparece
  show("#l-zone", "step1");
  drawIn("#zone-draw-path", { duration: T.zoneDraw }, "step1");
  fadeIn("#l-zoneFill", "step1+=0.5", SCRIM_OPACITY);
  fadeIn(["#l-zoneLabel", "#l-legend"], "step1+=0.9");

  // Passo 2: o grid de posicionamento se desenha em sequência, com as medidas e o "24 mm"; o slot vazio aparece
  show("#l-grid", "step2");
  drawIn(gsap.utils.toArray("#l-grid .pm-grid-line", map), { duration: T.gridDraw, stagger: T.gridStagger }, "step2");
  fadeIn(".pm-grid-mm", "step2+=0.6");
  fadeIn("#l-slot", "step2+=0.7");

  // Passo 3: o logo de exemplo entra no slot com os rótulos; as marcas de prova se desenham e a etiqueta PROOF aparece
  fadeIn("#l-logo", "step3");
  show("#l-proof", "step3+=0.3");
  drawIn(gsap.utils.toArray("#l-proof .pm-proof-line", map), { duration: T.proofDraw, stagger: T.proofStagger }, "step3+=0.3");
  fadeIn("#proof-tag", "step3+=0.5");

  // Passo 4: some a preparação; o marcador entra com o anel e o rótulo sobe. Depois segura o estado final
  const markerAt = `step4+=${T.clear}`;
  tl.to(["#l-proof", "#l-grid", "#l-slot", "#l-logo", "#l-zoneFill", "#l-zoneLabel"], { opacity: 0, duration: T.clear }, "step4");
  show("#l-marker", markerAt);
  // Único "pop" com overshoot, a partir do centro do marcador (= ponto da vaga)
  tl.fromTo("#marker-dot", { scale: 0.6, transformOrigin: "50% 50%" }, {
    keyframes: [
      { scale: 1.15, duration: T.markerUp, ease: "power2.out" },
      { scale: 1, duration: T.markerSettle, ease: "power2.out" },
    ],
  }, markerAt);
  // Anel: anima o raio (attr), não a escala, para o traço não engrossar
  tl.fromTo("#ring", { attr: { r: 0 }, opacity: 0.8 }, { attr: { r: RING_R }, opacity: 0, duration: T.ring, ease: "power2.out" }, markerAt);
  tl.fromTo("#l-label", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: T.label }, `${markerAt}+=0.5`);

  // Reset: marcador, rótulo, zona e legenda somem juntos; o card 1 volta a ficar ativo e o loop recomeça
  tl.to(["#l-marker", "#l-label", "#l-zone", "#l-legend"], { opacity: 0, duration: T.resetFade }, "reset");
  // Pausa vazia até o fim da volta (um set de duração zero no fim travava o repeat)
  tl.to({}, { duration: T.end - T.reset - T.resetFade }, T.reset + T.resetFade);

  window.siliconTimeline = tl;

  // ---------- Reprodução ----------

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    // Sem autoplay nem loop: estado final, todos os cards em opacidade total (CSS) e sem botão
    tl.time(T.reset - 0.01);
    toggle.hidden = true;
  } else {
    tl.time(0);
    setActiveCard(1);

    let inView = false;
    let started = false; // já começou desde a última entrada na tela
    let userPaused = false;

    const setToggle = () => {
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.querySelector(".pm-toggle__label").textContent = userPaused ? "Play" : "Pause";
    };

    function play() {
      if (userPaused || !inView || document.hidden) return;
      if (!started) {
        tl.restart();
        started = true;
      } else {
        tl.play();
      }
    }

    // Começa do passo 1 quando 40% da seção aparece; ao sair da tela, pausa e volta ao início
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= START_VISIBLE) {
            inView = true;
            play();
          } else if (!entry.isIntersecting) {
            inView = false;
            started = false;
            tl.pause(0);
          }
        });
      },
      { threshold: [0, START_VISIBLE] },
    ).observe(split);

    // Aba escondida: pausa; ao voltar, continua de onde estava
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) tl.pause();
      else if (started) play();
    });

    // Pausa manual: sair e voltar para a seção não recomeça até apertar play
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      setToggle();
      if (userPaused) tl.pause();
      else play();
    });

    // Clique num card: pula para o início do passo e continua tocando
    cards.forEach((card, index) => {
      card.querySelector(".pm-card__jump").addEventListener("click", () => {
        userPaused = false;
        setToggle();
        tl.seek(`step${index + 1}`, false);
        started = true;
        tl.play();
      });
    });

    setToggle();
  }
}
