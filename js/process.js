gsap.registerPlugin(ScrollTrigger);

// Cores (tokens do @theme em src/input.css). Troque aqui para mudar o estado "aceso" dos passos.
// O número aceso usa o laranja -dark para o texto pequeno manter contraste
const DIAMOND_IDLE_CLASS = "bg-off-white";
const DIAMOND_LIT_CLASS = "bg-signal-orange";
const NUMBER_IDLE_CLASS = "text-silicon-blue";
const NUMBER_LIT_CLASS = "text-signal-orange-dark";

// Intervalo entre um passo e o próximo (s); a linha leva o mesmo tempo para ir de um losango ao seguinte
const STEP_INTERVAL = 0.6;

const processSection = document.getElementById("process");

if (processSection) {
  const fill = document.getElementById("process-fill");
  const steps = gsap.utils.toArray("[data-process-step]", processSection);

  // Só troca classes de cor (o losango usa rotate-45, então transform não é animado); a transição vem do transition-colors
  function setStepLit(step, lit) {
    const diamond = step.querySelector(".process-diamond");
    const number = step.querySelector(".process-number");
    diamond.classList.toggle(DIAMOND_IDLE_CLASS, !lit);
    diamond.classList.toggle(DIAMOND_LIT_CLASS, lit);
    number.classList.toggle(NUMBER_IDLE_CLASS, !lit);
    number.classList.toggle(NUMBER_LIT_CLASS, lit);
  }

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Os 4 passos cabem na tela juntos: timeline por tempo (sem scrub), uma vez só
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: processSection,
        start: "top 70%",
        once: true,
        // markers: true,
      },
    });

    // Linha do centro do losango 01 ao 04. No Tailwind v4, scale-x-0 usa a propriedade CSS scale
    // (não transform), então anima a variável dela em vez de scaleX
    tl.to(fill, { "--tw-scale-x": "100%", duration: STEP_INTERVAL * (steps.length - 1), ease: "none" }, 0);

    // Cada passo acende quando a linha chega nele; o 1º no início
    steps.forEach((step, index) => {
      tl.call(() => setStepLit(step, true), null, index * STEP_INTERVAL);
    });

    return () => steps.forEach((step) => setStepLit(step, false));
  });

  // Movimento reduzido: tudo no estado final, sem animação
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set(fill, { "--tw-scale-x": "100%" });
    steps.forEach((step) => setStepLit(step, true));

    return () => steps.forEach((step) => setStepLit(step, false));
  });
}
