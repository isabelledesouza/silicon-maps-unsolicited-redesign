const VIEW_W = 2896;
const PLACEMENT = { x: 2100, y: 1600 };
const ZONE_R = VIEW_W * 0.06;
const RING_R = VIEW_W * 0.03;
const SCRIM_OPACITY = 0.75;
const START_VISIBLE = 0.4;
const SPEED = 1.5;

const T = {
  step1: 0,
  step2: 3.2,
  step3: 6.4,
  step4: 9.6,
  reset: 14,
  end: 15,
  zoneDraw: 1.2,
  fade: 0.6,
  gridDraw: 0.8,
  gridStagger: 0.08,
  proofDraw: 0.7,
  proofStagger: 0.06,
  clear: 0.5,
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

  document.getElementById("placement").setAttribute("transform", `translate(${PLACEMENT.x} ${PLACEMENT.y})`);
  map.querySelectorAll(".pm-zone, .pm-scrim, #zone-draw-path").forEach((circle) => circle.setAttribute("r", ZONE_R));

  const drawIn = (targets, vars, position) =>
    tl.fromTo(targets, { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, ease: "power2.out", ...vars }, position);
  const fadeIn = (targets, position, opacity = 1, duration = T.fade) =>
    tl.fromTo(targets, { opacity: 0 }, { opacity, duration }, position);
  const show = (targets, position) => fadeIn(targets, position, 1, 0.01);

  const tl = gsap.timeline({
    paused: true,
    repeat: -1,
    defaults: { ease: "power2.inOut" },
  });

  tl.addLabel("step1", T.step1)
    .addLabel("step2", T.step2)
    .addLabel("step3", T.step3)
    .addLabel("step4", T.step4)
    .addLabel("reset", T.reset);

  show("#l-zone", "step1");
  drawIn("#zone-draw-path", { duration: T.zoneDraw }, "step1");
  fadeIn("#l-zoneFill", "step1+=0.5", SCRIM_OPACITY);
  fadeIn(["#l-zoneLabel", "#l-legend"], "step1+=0.9");

  show("#l-grid", "step2");
  drawIn(gsap.utils.toArray("#l-grid .pm-grid-line", map), { duration: T.gridDraw, stagger: T.gridStagger }, "step2");
  fadeIn(".pm-grid-mm", "step2+=0.6");
  fadeIn("#l-slot", "step2+=0.7");

  fadeIn("#l-logo", "step3");
  show("#l-proof", "step3+=0.3");
  drawIn(gsap.utils.toArray("#l-proof .pm-proof-line", map), { duration: T.proofDraw, stagger: T.proofStagger }, "step3+=0.3");
  fadeIn("#proof-tag", "step3+=0.5");

  const markerAt = `step4+=${T.clear}`;
  tl.to(["#l-proof", "#l-grid", "#l-slot", "#l-logo", "#l-zoneFill", "#l-zoneLabel"], { opacity: 0, duration: T.clear }, "step4");
  show("#l-marker", markerAt);
  tl.fromTo("#marker-dot", { scale: 0.6, transformOrigin: "50% 50%" }, {
    keyframes: [
      { scale: 1.15, duration: T.markerUp, ease: "power2.out" },
      { scale: 1, duration: T.markerSettle, ease: "power2.out" },
    ],
  }, markerAt);
  tl.fromTo("#ring", { attr: { r: 0 }, opacity: 0.8 }, { attr: { r: RING_R }, opacity: 0, duration: T.ring, ease: "power2.out" }, markerAt);
  tl.fromTo("#l-label", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: T.label }, `${markerAt}+=0.5`);

  tl.to(["#l-marker", "#l-label", "#l-zone", "#l-legend"], { opacity: 0, duration: T.resetFade }, "reset");
  tl.to({}, { duration: T.end - T.reset - T.resetFade }, T.reset + T.resetFade);

  tl.timeScale(SPEED);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    tl.time(T.reset - 0.01);
    toggle.hidden = true;
  } else {
    tl.time(0);

    let inView = false;
    let started = false;
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

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) tl.pause();
      else if (started) play();
    });

    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      setToggle();
      if (userPaused) tl.pause();
      else play();
    });

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
