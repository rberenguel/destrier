# Destrier

> A medieval knight's <em>warhorse</em>

<img src="src/media/screenshot-wide.png"/>

[Play here](https://mostlymaths.net/destrier/)

## What is this?

This is a _roguelike wave shooter_.

Your goal is to survive 20 waves… and then keep going.

Controllers are supported (although I still don't support those with analog axes, WIP), and controls can be customised.

> NOTE:
> There are no mobile controls (yet) and the CSS is _not_ (like, _very not_) mobile friendly. I plan to address these shortcomings at some later point.

## A bit of why

When I was a kid I played a lot an Asteroids clone by Edward Hutchins called [Hyperoid](https://www.mobygames.com/game/12949/hyperoid/). Last year I wrote a small clone for the [PicoSystem](https://shop.pimoroni.com/products/picosystem?variant=32369546985555) ([Roids](https://github.com/rberenguel/roids)) and started a larger-scale project: an Elite-like game based on this concept of 2d spaceflight.

Eventually I hit on two realisations:

- I'm not fast when writing C++;
- The PicoSystem is a bit too constrained.

Early this year (or late last year) I decided to port everything to [pixi.js](https://pixijs.com/) in the browser. I wrote a bare-bones, half-functional version of "Roids" using pixi, and then started working on [Stardust](https://bsky.app/profile/berenguel.bsky.social/post/3lhhd3rjzzc2x).

I got to the point where I wanted some playground to test mechanics and weapons… so I naively started to do a "better" Asteroids. It eventually grew a bit too much, so I split the codebase and here we are.

## Acknowledgements / Credits

- [pixi.js](https://pixijs.com/)
- [SixtyFour](https://fonts.google.com/specimen/Sixtyfour) font by Jens Kutílek and [Monoid](https://larsenwork.com/monoid/) by Andreas Larsen.
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) by Jake Archibald.
- [Tone.js](https://tonejs.github.io)
- [p5js](https://p5js.org) (for the background nebula)
- My command palette / menu [metap](https://github.com/rberenguel/metap).
- The gamepad controller is a distant cousin from this [sketch](https://editor.p5js.org/peterkvt80/sketches/fbICogAwE) by peterkvt80.
- Drum samples from [The Salamander kit](https://sfzinstruments.github.io/drums/salamander/) by Alexander Holm. I edited them with Audacity to make them sound more "spacey"
- Wind Sound Effect by <a href="https://pixabay.com/users/jci-21-21704840/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=12809">Juan Carlos</a> from <a href="https://pixabay.com/sound-effects//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=12809">Pixabay</a>
