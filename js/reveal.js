gsap.registerPlugin(ScrollTrigger);

const REVEAL = { y: 40, opacity: 0, duration: 0.8, ease: "power2.out" };
const REVEAL_STAGGER = 0.12;
const REVEAL_START = "top 75%";
const REVEAL_RESET = "top bottom";

function revealOnScroll(targets, trigger, stagger = 0, vars = REVEAL) {
  const tween = gsap.from(targets, { ...vars, stagger, paused: true });
  ScrollTrigger.create({ trigger, start: REVEAL_START, onEnter: () => tween.play() });
  ScrollTrigger.create({ trigger, start: REVEAL_RESET, onLeaveBack: () => tween.pause(0) });
  const resetBelowFold = () => {
    if (trigger.getBoundingClientRect().top > window.innerHeight) tween.pause(0);
  };
  ScrollTrigger.addEventListener("refresh", resetBelowFold);
  return () => ScrollTrigger.removeEventListener("refresh", resetBelowFold);
}

gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  const cleanups = [
    ...gsap.utils.toArray("[data-reveal]").map((el) => revealOnScroll(el, el)),
    ...gsap.utils.toArray("[data-reveal-stagger]").map((group) => revealOnScroll(group.children, group, REVEAL_STAGGER)),
    ...gsap.utils.toArray(".timeline-item").map((item) => revealOnScroll(item.querySelector(".timeline-content"), item)),
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
});
