# Silicon Maps: Independent Redesign Case Study

An independent, speculative redesign of the Silicon Maps website. Silicon Maps publishes printed and digital maps of Silicon Valley. This project shows how its site could tell the story of the business and guide visitors toward becoming sponsors.

Live concept: https://isabelledesouza.github.io/silicon-maps-unsolicited-redesign/

## Disclaimer

This is an independent speculative redesign by Isabelle de Souza. It is not affiliated with, commissioned by or endorsed by Silicon Maps. The copy, member companies, logos and testimonials shown in the concept are illustrative. No real client relationship, results or metrics are claimed. Brand names are used only to identify the company the concept is about.

## Concept

Idea: **to be on the map is to belong.**

- Audience: B2B. Companies that want a lasting place on a map that lives on walls and desks for years.
- Direction: reposition the site from a catalog of maps to a legacy brand experience: "More than a map. A piece of Silicon Valley history."
- Voice: a single "we", confident and plain. Short sentences, no hype, no invented statistics.

## Problems and design direction

Each decision follows the same chain: problem, direction, decision.

| Problem | Direction | Decision |
| --- | --- | --- |
| A slider of 15 maps gives no map real attention and reads like a catalog | Tell one story instead of listing products | A single map in the hero, presented as the map, with "Since 1989" |
| No call to action in the header | Every page needs a way into conversion | A persistent "Join the map" button and a closing contact section |
| Two long dropdowns of plain links with no hierarchy | Reduce the effort of choosing | One "Maps" mega menu in columns |
| Testimonials on a disconnected page | Put proof where the decision happens | Testimonial cards on the home page and a Members page |
| No clear path to pricing | Remove uncertainty before action | "Packages" in the main navigation and a four-step process |
| The 30+ year history is hidden | Treat the legacy as the central asset | A timeline from 1989 to today, drawn as a route |

## Page structure

1. Header with tagline and "Join the map" button
2. Hero with the 1989 poster
3. "A map that stays in the room": why a printed map outlasts an ad
4. Stats band: printed, digital, since 1989, worldwide
5. Testimonial band
6. Members: three illustrative companies with illustrative logos and quotes
7. Timeline, from 1989 to today: Origin, Paper to pixels, A connected industry, Flat, fast and everywhere, The map continues
8. Process: how to join, in four steps
9. Contact band with a dark map background, a press photo and an overlapping card
10. Footer with the independent-concept disclaimer

## Design

Palette:

| Role | Color |
| --- | --- |
| Navy | `#123B5D` |
| Blue | `#2C6E9E` |
| Light blue | `#DCEAF2` |
| Page background | off-white (shared site variable) |
| Dark text | `#18242D` |
| Orange (markers and calls to action only) | `#E06B3C` |

Notes:

- Orange on a light background has low contrast (about 3:1), so text on orange buttons uses `#18242D`, never white.
- Typography combines a serif for headings, a clean sans-serif for body text and a condensed monospace for small labels.
- Photography follows one series: 35mm film look, natural colors, fine grain, shown with a blue duotone. The same person ages across the eras, seen from the side or behind, drawing by hand with the technology of each decade beside him. The last era shows a print shop with a press running.

## Motion and technical notes

- GSAP with ScrollTrigger.
- The timeline route is a single SVG path drawn with `stroke-dashoffset`, tied to scroll. It passes through every era marker, is built from DOM positions and is rebuilt on resize. The reached part is solid navy and the remaining part is dotted blue.
- A small scroll icon in the hero pulses gently and fades out as the user scrolls.
- Randomness uses a seeded pseudo-random generator, never `Math.random`, so the layout is the same on every load.
- `prefers-reduced-motion` is respected: animations are replaced with the final static state.
- Layouts are checked at 375px, 768px and 1280px.

## Content rules

- Facts about the company come only from public information. Anything else is labeled as concept copy.
- No fabricated statistics, results or metrics, and no actions attributed to real companies.
- Member companies and testimonials are illustrative and marked as such on the page.
- Real Silicon Valley events appear only as true context.
- The phrase "on the map" appears in a single place, the link "See who's on the map". Elsewhere the copy uses other wording to avoid repetition.

## Images

Some images are AI-generated or stock photography used for the concept. If this project is ever used beyond a portfolio, replace them with licensed or original photography. The trade-show photo should be replaced or edited, since its banner text does not match the brand name.

## Run locally

Clone the repository and open `index.html` in a browser, or serve the folder with any static server, for example:

```
npx serve .
```

## Author

Designed and built by Isabelle de Souza, freelance web developer.