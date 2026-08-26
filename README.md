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

**One CTA label.** Every contact affordance on the page says **Contact Us**,
in the nav, the hero, all four tiers and the form button. One label per intent
is the rule; if you add another entry point, use that same wording rather than
a synonym.

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
| Preview | The page plays: a slow scroll down, a hold, and back. 13s, staggered per card |
| Opening | Each card carries a real `<button>`. Clicking layers the page over the site |
| Pointer | `pointer-events: none` on the previews, so drag gestures reach the rail |
| Focus | `tabindex="-1"`, and the mockups contain no `href`, so nothing inside is tabbable |

### The previews play

Each card slowly scrolls its page down, holds, and returns, on a 13 second
loop staggered per card so the five are never in lockstep. It is a **pure
transform keyframe animation**, so it lives on the compositor rather than
costing a JS write per frame, and it **pauses under the pointer**: hovering a
card now stops it instead of sliding the design away from you, which was the
complaint about the old hover-scroll.

Two things keep it honest:

- The frames are **4:3, not 4:5**. At 4:5 the frame was nearly as tall as the
  scaled page, leaving 13px of travel on the shorter mockups, which is not
  motion. Landscape gives 193px to 375px and reads more like a website.
- Only cards **actually on screen** animate, via an IntersectionObserver
  toggling `.is-onscreen`. The rail is horizontal, so most cards sit off to one
  side, and a CSS animation happily keeps running for off screen elements.

### The example sites are responsive

The mockups used to be fixed 1000px designs with `<meta viewport content="width=1000">`.
In the viewer that left a column of dead space beside them on a wide screen and
forced horizontal scrolling on a phone, and it made the media queries
unreachable because the layout viewport was pinned.

They are fluid now: `width: 100%; max-width: 1000px; margin-inline: auto`, a
free viewport meta, and a narrow layout under 760px. Because the **card**
preview's iframe element is explicitly 1000px wide, the card still renders the
desktop layout while the viewer renders whatever its own width calls for. One
set of files, both jobs.

### The viewer chrome

**One documented shape exception.** Page content is radius 0 everywhere. The
viewer is chrome floating *over* the page rather than part of it, so it gets
its own material: a `--r-chrome: 18px` radius, translucent, blurred. Nothing
outside `.viewer` may use that token, and an audit check enforces it. Treating
it as a rule rather than rounding one element on a whim is what keeps the shape
system coherent.

The bar is **70% of the page colour with a 20px blur**, and the panel behind it
is transparent, which is what lets it actually read as glass: it floats on the
blurred site rather than on an opaque slab. There is still no drop shadow. A
filled pill and a black shadow were the two things this design system does not
have anywhere, and they were why the viewer once read as a generic modal.

Translucency is a contrast risk, so the 70% figure is measured rather than
picked: against the worst possible backdrop behind the bar (pure white in dark
mode, pure black in light mode) the Close label still reads at **6.84:1**.
`prefers-reduced-transparency` drops the blur for a solid fill.

Close is a **rule**, like every other affordance here: the word, with a line
under it that retracts right while an accent line grows in from the left. Its
padding gives a 50px target on a phone while the rule stays tight under the
word. The title is set in the page's display face rather than as modal chrome,
and the iframe sits on `--bg-2` so there is no white flash before an embedded
page paints.

### The viewer is a layer, not a takeover

Clicking a card does not navigate. A panel opens **over** the page: the site
stays visible behind a translucent, blurred scrim, and the panel is inset so
you can see the page around all four edges. It grows in rather than appearing,
and it is a real `role="dialog"` with `aria-modal`.

A full screen iframe on a phone is the easiest place on the web to feel
trapped, so there are **four** ways out and all of them work:

- a 48px **labelled** Close button in the bar
- tapping the scrim, which is the most natural one on a phone
- the Escape key
- the phone's own back gesture, via a pushed history entry

Closing also clears the iframe `src` so the embedded page stops loading in the
background, and returns focus to the card that opened it. The back handling is
guarded: it only calls `history.back()` when it can see its own state entry, so
if `pushState` was refused the close button can never navigate off the site.

## Partnered Plans

Four tiers, priced monthly, described by **pages and edits**. Each tier's line
uses the scroll fill, so the plans light up word by word as you read down them.

| Tier | Pages | Edits | Price |
| --- | --- | --- | --- |
| Starter | One | Two a month | $149/month |
| Studio | Up to five | Ten a month | $249/month |
| Full | Up to ten | Twenty a month | $399/month |
| Partner | Unlimited | Unlimited | from $699/month |

The figure is the only right aligned thing on the page, which is what makes the
row scannable. The three columns are **fixed fractions**, not `auto`: every
`.rate` is its own grid, so a content sized price column made each row measure
its own columns, and "from $699 a month" being wider than "$149 a month" pushed
that row's name and body left. Fixed fractions keep all four rows on one
rhythm. The suffix is `/month` set tight against the figure, with the
margin removed so it reads as one price rather than two words.

## Motion, and why each piece exists

| Piece | Job |
| --- | --- |
| Inertial scroll | The weight. Wheel input drives a lerped real scroll position |
| Intro curtain | The page arrives composed instead of assembling itself |
| WebGL hero field | A rigid grid lit by a moving source. The pointer is the light |
| Statement fill | The sentence lights word by word at reading pace |
| Pinned horizontal pan | Five example sites read as one gesture |
| Live footer wordmark | The dot field again, masked to the letterforms. Ambient wind, and it lights under the pointer |
| Preview scan | The pointer's vertical position is the preview's scroll position |
| Drifting rules | Every services row rule is a slow moving band of the spectrum |
| Lit row | The row at the reading line brightens its rule and takes a colour wash |
| Flown service names | The list flies in as a staggered wave, settles, and flies out into the plans |
| Plan fill | The same word-by-word light, applied to the four tiers |

### The live footer wordmark

The word at the bottom of the page is the same dot field as the hero, masked to
the letterforms, running the same wind, and lighting under the pointer.

It is a **transparent** canvas that only paints dots. Nothing clears a
background colour, so the page shows through and it is correct in light and
dark without ever asking which one is active. The two colours are read from
`--text-2` and `--accent`, and re-read when the appearance changes.

The letterforms are **not** rasterised in the browser. Canvas 2D silently
ignores `font-variation-settings`, so drawing the text at runtime would render
Archivo at the default width and quietly fail to match either the GIF or the
site's own wordmark. `assets/js/wordmark-data.js` is generated offline with the
axes honoured: a 104 by 34 coverage grid, one digit per cell, 3.9 KB.

Three things keep it honest:

- The real `<p>Illomi</p>` stays in the accessibility tree, clipped rather than
  removed, so the footer still reads as a word.
- Without JavaScript, or without a 2D context, the plain type shows exactly as
  it did before.
- The grid is fixed at 104 columns, so on a narrow footer the cells fall under
  3px and the letters turn to mush. Below that it draws every other cell with
  doubled dots instead. The mark's own lower size bound is raised for the same
  reason: at the old mobile width of 137px a halftone is not perceptible, and
  crisp type would have been the better answer.

It only animates while on screen, which for a footer is most of the time not at
all, and drops to a single static frame under `prefers-reduced-motion`.

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

### On a phone

The mobile problems were weight, not layout: nothing overflowed at 390px or
360px, but the page was doing desktop-grade work on a battery.

| | Before | After |
| --- | --- | --- |
| Hero field | 1.01 Mpx a frame, 60fps, noise shader | 0.33 Mpx, 30fps, sine shader |
| Mockup imagery | 8.2 Mpx across 15 images | 2.9 Mpx, all lazy |
| Grain layer | Full screen blended composite every frame | Off |

The hero is the important one. Its whole premise is that **the pointer is the
light**, and a touch screen has no pointer, so the loop was animating a drift
nobody could drive.

Touch now gets a **wind** instead: a train of long waves crosses the dot field,
and each row of dots picks the wave up a beat after the row above it, so it
leans and lights like grass rather than sliding like a bar. A crest takes about
**14.5 seconds** to cross the screen.

It is a separate branch in the shader, entered on a uniform, and it is cheap in
a way the desktop path is not:

| Per pixel, per frame | Desktop (pointer) | Touch (wind) |
| --- | --- | --- |
| fbm calls | 3 | 0 |
| value-noise samples | 15 | 0 |
| hash evaluations | 60 | 0 |
| sines | 1 | 3 |

Plus a 1x buffer and a 30fps cap, since a fourteen second wave does not need
sixty frames a second. Sustained pixel throughput drops from 60.6 Mpx/s to
6.9 Mpx/s, on a shader doing a fraction of the work per pixel. The pointer
listener is still not attached on touch, and `prefers-reduced-motion` still gets
a single static frame with no loop at all.

The frequency here is the thing to be careful with. The first version used
`p.x`, which is aspect corrected and spans only about 0.6 on a portrait phone,
so less than a quarter of a wave fitted across the screen and the whole field
pulsed light and dark together instead of a crest travelling. It uses `uv.x`,
which always spans 0 to 1, so the crest count holds on any screen shape.

The grain is a texture worth a few pixels on a desktop and worth nothing on a
phone, where it costs a whole screen composite per frame.

One stale rule was also removed: the mobile service rows still used the two
column grid built for the thumbnails that were deleted two passes ago, which
left an empty `0px` track in front of every row.

### How it degrades

- **`prefers-reduced-motion`** collapses everything: no inertial scroll, no
  curtain, one static hero frame, the pinned pan becomes a scroll-snap rail, the
  statement and plans are fully lit, and the service names never fly, mask or
  colour.
- **Under 900px** the pin, the fill and the flown type all stand down.
- **No WebGL** falls through to a CSS gradient. **No JavaScript** leaves a fully
  readable page.

## Rules learned the hard way here

0. **A `display` rule outranks the `hidden` attribute.** `[hidden]` lives in the
   UA stylesheet, so any author `display` declaration beats it. `.field__err`
   set `display: flex` unconditionally, which meant every error row was on
   screen from first paint with its icon showing and its message empty. Pair
   every `display` rule on a toggleable element with an explicit
   `[hidden] { display: none }`.

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
- Form field lines were failing WCAG 1.4.11, which asks for 3:1 on the visual
  boundary of a control: they measured 2.59:1 on dark and 2.43:1 on light. They
  now use a dedicated `--field-line` token at 2px, measuring 5.56:1 and 4.52:1,
  going to full `--text` on hover and focus.
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
