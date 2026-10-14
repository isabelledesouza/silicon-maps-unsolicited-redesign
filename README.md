
# Silicon Maps: Unsolicited Redesign

A portfolio concept: a redesign of the website of Silicon Maps, a company that publishes printed and digital maps of Silicon Valley.

Live site: https://isabelledesouza.github.io/silicon-maps-unsolicited-redesign/

## Disclaimer

This is an unsolicited redesign concept. Silicon Maps is a fictional company. Its history, figures, clients and testimonials are invented for illustration. Real events from Silicon Valley history appear only as true context. No real company is presented as a client, and no real logos are used.

## Concept

Idea: **to be on the map is to belong.**

- Audience: B2B. Companies that want to appear on a map that lives on walls and desks for years.
- Message: belonging and status, with the map as a physical object, not an ad that ends with a campaign.
- Voice: a single "we", confident and plain. Mostly short sentences, no hype, no invented statistics.
- Story: Silicon Maps was founded in 1989 in San Jose and has drawn the valley ever since.

## Page structure

1. Header with tagline and "Join the map" button
2. Hero with the 1989 poster
3. "A map that stays in the room": why a printed map outlasts an ad
4. Stats band: printed, digital, since 1989, worldwide
5. Testimonial band
6. Members: three fictional companies with fictional logos and quotes
7. Timeline, from 1989 to today: Origin, Paper to pixels, A connected industry, Flat, fast and everywhere, The map continues
8. Process: how to join, in four steps
9. Contact band with a dark map background, a press photo and an overlapping card
10. Footer with the fictional-company disclaimer

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

- The invented history concerns only Silicon Maps.
- No fabricated statistics, and no actions attributed to real companies.
- Testimonials and member companies are labeled as fictional on the page.
- The phrase "on the map" appears in a single place, the link "See who's on the map". Elsewhere the copy uses other wording to avoid repetition.

## Images

Some images are AI-generated or stock photography used for the concept. If this project is ever used commercially, replace them with licensed or original photography and review the trade-show photo, whose banner text does not match the fictional brand name.

## Run locally

Clone the repository and open `index.html` in a browser, or serve the folder with any static server, for example:

```
npx serve .
```

## Author

Designed and built by Isabelle de Souza, freelance web developer.
