# README typing animation

The animation starts with an Angular component, types its form model, then binds two inputs.
Its final code comes directly from `website/examples/readme-typing.typecheck.ts`; package
imports are outside the image to keep the component readable. The complete quick-start
example follows the animation in the README.

Generate the GIF and its static reduced-motion alternative with Python 3.9 or newer:

```sh
python3 -m venv /tmp/form-nodes-animation-venv
/tmp/form-nodes-animation-venv/bin/pip install -r scripts/readme-animation/requirements.txt
/tmp/form-nodes-animation-venv/bin/python scripts/readme-animation/generate.py --font /System/Library/Fonts/Menlo.ttc
npm run docs:typecheck
```

The command above uses macOS Menlo. On other systems, pass a local monospace TrueType font
with `--font`, such as DejaVu Sans Mono. Font choice affects the rendered output.
The generator writes `website/static/img/form-nodes-typing.gif` and
`website/static/img/form-nodes-typing.png`. It validates the final code, dimensions, and
multiple GIF frames. Inspect the image after changing the source to check line lengths
and vertical fit. The animation loops, pausing before typing and after completion.

The README uses the raw GitHub URLs so the images also resolve when displayed on npm.
Its picture element requests the static PNG when reduced motion is preferred; renderers
that do not support this media query use the GIF. The adjacent text example also provides
a readable, copyable version of the code.
