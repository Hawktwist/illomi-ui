# Illomi

Marketing site for a studio that builds websites for small businesses.

Static HTML, CSS and JavaScript. No framework, no build step, no dependencies.
Open `index.html`, or serve the folder:

```bash
python -m http.server 5173
```

## Why no framework

The pitch on the page is "fast to load". A React bundle would have contradicted
it. Everything here is hand written, ships as three files plus the mockups, and
runs anywhere you can drop a folder: Netlify, Cloudflare Pages, a cPanel host.

## Files

| Path | What it holds |
| --- | --- |
| `index.html` | All markup, plus the Phosphor icon sprite |
| `assets/css/site.css` | Tokens, both appearances, all six section layouts |
| `assets/js/hero-gl.js` | The WebGL hero field, raw GL, no library |
| `assets/js/app.js` | Inertial scroll, curtain, reveals, scroll engine, form |
| `mockups/*.html` | Five standalone mini-sites, used as the portfolio previews |

A second "playful" direction used to live here. It has been deleted.

## The design system

**Radius 0 on everything.** No pills, no rounded cards, no chips. Every
interactive affordance is a **rule**: a 1px line under text.

**Monochrome, with one accent.** The accent (`#E9563A` dark, `#B33D26` light)
appears only in the hero light field, in the rule that wipes in under a link on
hover, and in form error state.

The one deliberate exception is the **services section**, which carries a live
spectrum: its row rules drift continuously, and the row at the reading line
takes a colour wash. That wash is held at **65% plain text colour**, which is
not a taste number. Below 60% the yellow stop drops under 4.5:1 on the light
appearance, so 65% is the nearest safe step with margin; measured across all
seven stops in both appearances the worst case is 5.20:1.

**One typeface.** Archivo, using its width axis: expanded at `wdth 115` for
display, normal for body.

**One theme at a time, following the system.** Auto, Light and Dark cycle from
the footer control. Auto is a real state, so the stored key is *removed* rather
than set to `"auto"`.

## No invented proof

The site claims nothing it cannot back up: **no testimonial, no client logo
wall, no "trusted by" strip**, because Illomi has no clients yet. The portfolio
is headed **Example sites** and every one of them is a real page.

If real clients arrive, add testimonials with their permission and their real
words.

## The portfolio previews are real pages

The five items in the work rail are not screenshots and not `<div>` mockups.
Each is a complete standalone site in `mockups/`, rendered live in an iframe.
Open `mockups/cycle.html` on its own and it is just a website.

| How it works | |
| --- | --- |
| Design width | Every mockup is authored at 1000px wide |
| Height | Read from the embedded page, not assumed. They run 1385px to 1982px |
| Scaling | JS measures the frame and sets `--k` (frame width / 1000) |
| Scan | Moving the pointer down a card scrolls that site down. The visitor drives it |
| Pointer | `pointer-events: none` on every frame, so drag gestures reach the rail |
| Focus | `tabindex="-1"`, and the mockups contain no `href`, so nothing inside is tabbable |

## Partnered Plans

Four tiers, described by **pages and edits**, with **no prices on the site at
all**: pricing is a conversation. Each tier's line uses the scroll fill, so the
plans light up word by word as you read down them.

| Tier | Pages | Edits |
| --- | --- | --- |
| Starter | One | Two a month |
| Studio | Up to five | Ten a month |
| Full | Up to fifteen | No limit |
| Partner | No limit | Same day, plus a shop |

## Motion, and why each piece exists

| Piece | Job |
| --- | --- |
| Inertial scroll | The weight. Wheel input drives a lerped real scroll position |
| Intro curtain | The page arrives composed instead of assembling itself |
| WebGL hero field | A rigid grid lit by a moving source. The pointer is the light |
| Statement fill | The sentence lights word by word at reading pace |
| Pinned horizontal pan | Five example sites read as one gesture |
| Preview scan | The pointer's vertical position is the preview's scroll position |
| Drifting rules | Every services row rule is a slow moving band of the spectrum |
| Lit row | The row at the reading line brightens its rule and takes a colour wash |
| Flown service names | The list flies in as a staggered wave, settles, and flies out into the plans |
| Plan fill | The same word-by-word light, applied to the four tiers |

### The flown type

Each service name travels on a wave driven by the **section's** position, not
its own, with a per row index stagger. Three reasons that matters:

- The five names sit ~160px apart inside a ~520px reach. Driving each off its
  own position would leave neighbours permanently mid effect.
- Travel is capped at 44px against that 160px spacing, and the stagger separates
  neighbours by only ~4px, so rows can never collide.
- There is a **dead zone** below 0.22: inside the reading area every name is
  plain `--text` on its baseline. The rainbow and the pixel break belong to the
  travel, never to the reading.

The rainbow is a gradient clipped to the text, crossfaded by animating how much
of the plain text colour is left (`--solid`, 100% to 0%). The pixel break is a
`repeating-conic-gradient` checkerboard mask whose size (`--px`) grows with
distance. Both live on a class JS only adds while the row is actually moving, so
at rest there is no mask and no gradient in play.

The wash and the flown state never collide: the wash selector carries
`:not(.is-flying)`, so while a row is travelling the motion treatment wins, and
the wash only applies once it has settled.

Colour is not motion, so the lit row is chosen outside the `rich()` gate: the
spectrum stays on touch and on narrow screens. Only the movement stands down.

### How the scroll work is built

There is no `scroll` event listener anywhere. One `requestAnimationFrame` loop
samples `scrollY` per frame and writes only `transform`, `opacity` and custom
properties.

The inertial scroll drives the **real** scroll position rather than transforming
a wrapper, which is why `position: sticky`, anchors and the pinned rail all keep
working underneath it.

### How it degrades

- **`prefers-reduced-motion`** collapses everything: no inertial scroll, no
  curtain, one static hero frame, the pinned pan becomes a scroll-snap rail, the
  statement and plans are fully lit, and the service names never fly, mask or
  colour.
- **Under 900px** the pin, the fill and the flown type all stand down.
- **No WebGL** falls through to a CSS gradient. **No JavaScript** leaves a fully
  readable page.

## Rules learned the hard way here

1. **Never measure a transformed element with `getBoundingClientRect`.** The
   rect includes rotation, so a rotated element reports a fatter box, which
   tightens its clamp, which moves it, which re-fires the ResizeObserver. That
   loop caused a visible flicker. Use `offsetWidth` / `offsetHeight`.
2. **A measure pass must not paint.** When `measure()` also wrote transforms it
   fought the animation loop for the same property.
3. **Never move content away from the pointer that came to read it.** The work
   previews once crawled upward for six seconds on hover. Hovering to look at
   something should not make it leave.
4. **The revealed state must out-specify the hidden state.** The hidden state is
   scoped to `.js`, so the revealed one must be too: `.js [data-pop].is-in`
   beats `.js [data-pop]` outright rather than relying on a source-order tie.
5. **No forced heights on compact cards.** A `min-height` with one label inside
   is a coloured rectangle of nothing, and a tall cell in the same grid row
   stretches its neighbour into the same emptiness.

## Before this goes live

1. **Replace the photography inside the mockups.** The main page carries no
   placeholder images. The mockups use `picsum.photos` for their own
   photography, which is fine for an example but should become real images if
   any of them becomes a real project.
2. **Wire the form.** `app.js` has an empty `ENDPOINT` at the top. Paste a
   Formspree, Basin or Netlify Forms URL there and it posts directly, with
   sending, sent and failed states already built. Left empty, the form hands the
   message to the visitor's mail app rather than faking a success.
3. **Swap the placeholder details.** The example business names are invented.
   The contact address, `hello@illomi.com`, is the real domain.
4. **Self host the font** if you want to drop the Google Fonts request. Archivo
   is open licence.

## Accessibility notes

- Every text colour was measured against its actual rendered background in both
  appearances. Lowest ratio is 5.15:1 against a 4.5:1 requirement.
- The rainbow and pixel mask never apply to text at rest, so nothing you read is
  ever low contrast or broken up.
- Skip link, visible focus rings, labels above inputs, errors below them, no
  placeholder-as-label anywhere.
- The contact form collects name, company, email and message. Company is
  optional so a sole trader is never blocked, and it is carried into the
  message body rather than being collected and dropped.
- The form validates on blur and on submit, moves focus to the first bad field,
  and announces status through a live region.

## Licences

Icons are Phosphor Icons (MIT). Type is Archivo (SIL Open Font License).
