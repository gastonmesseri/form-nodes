"""Render the README typing animation from its Angular-checked example."""

import argparse
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pygments import lex
from pygments.lexers import HtmlLexer, TypeScriptLexer
from pygments.token import Token

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "website/static/img"
SOURCE = ROOT / "website/examples/readme-typing.typecheck.ts"
WIDTH, HEIGHT = 760, 510
SCALE = 2
FONT_SIZE, LINE_HEIGHT = 24, 33
BACKGROUND = "#111827"
FOREGROUND = "#e5e7eb"


def token_color(token):
    for kind, color in (
        (Token.Comment, "#94a3b8"),
        (Token.Keyword, "#c4b5fd"),
        (Token.Name.Tag, "#fda4af"),
        (Token.Name.Attribute, "#7dd3fc"),
        (Token.Literal.String, "#a7f3d0"),
        (Token.Literal.Number, "#fdba74"),
        (Token.Name.Decorator, "#7dd3fc"),
    ):
        if token in kind:
            return color
    return FOREGROUND


def highlighted(code):
    # Highlight Angular's inline HTML separately from the TypeScript shell.
    for index, part in enumerate(code.split("`")):
        if index:
            yield "`", "#a7f3d0"
        lexer = HtmlLexer if index % 2 else TypeScriptLexer
        for token, value in lex(part, lexer(stripnl=False, ensurenl=False)):
            yield value, token_color(token)


def render(code, cursor, font):
    canvas = Image.new("RGB", (WIDTH * SCALE, HEIGHT * SCALE), BACKGROUND)
    draw = ImageDraw.Draw(canvas)
    x, y = 38 * SCALE, 26 * SCALE
    origin = x
    for value, color in highlighted(code):
        for index, line in enumerate(value.split("\n")):
            if index:
                x, y = origin, y + LINE_HEIGHT * SCALE
            draw.text((x, y), line, font=font, fill=color)
            x += draw.textlength(line, font=font)
    if cursor is not None:
        before = code[:cursor]
        row = before.count("\n")
        column = before.rsplit("\n", 1)[-1]
        cx = origin + draw.textlength(column, font=font)
        cy = (29 + row * LINE_HEIGHT) * SCALE
        draw.rectangle((cx, cy, cx + 2 * SCALE, cy + 25 * SCALE), fill="#a7f3d0")
    return canvas.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--font", required=True, help="Path to a monospace TrueType font")
    args = parser.parse_args()
    font = ImageFont.truetype(args.font, FONT_SIZE * SCALE)
    final = SOURCE.read_text().split("@Component", 1)[1]
    final = "@Component" + final.rstrip()
    template = re.search(r"(?<=template: `\n).*?(?=  `,)", final, re.S).group()
    model = re.search(r"(?<=export class ProfilePage {\n).*(?=\n})", final, re.S).group()
    code = final.replace(template, "").replace(model, "")
    frames, durations = [], []

    def add(text, cursor=None, duration=60):
        frames.append(render(text, cursor, font))
        durations.append(duration)

    add(code, duration=1200)
    for anchor, insertion in (("export class ProfilePage {\n", model), ("template: `\n", template)):
        position = code.index(anchor) + len(anchor)
        before, after = code[:position], code[position:]
        for count in range(1, len(insertion) + 1):
            current = before + insertion[:count] + after
            pause = 160 if insertion[count - 1] == "\n" else 40
            add(current, position + count, pause)
        code = before + insertion + after
        add(code, duration=850)
    assert code == final, "The last frame must match the checked Angular example"
    add(final, duration=4000)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    poster = render(final, None, font)
    poster.save(OUTPUT / "form-nodes-typing.png", optimize=True)
    # A shared palette keeps syntax colors stable throughout the animation.
    palette = poster.quantize(colors=128)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    destination = OUTPUT / "form-nodes-typing.gif"
    indexed[0].save(destination, save_all=True, append_images=indexed[1:], duration=durations,
                    loop=0, optimize=True, disposal=1)
    with Image.open(destination) as animation:
        assert animation.n_frames > 1
        assert animation.size == (WIDTH, HEIGHT)
        total = sum(animation.seek(i) or animation.info["duration"] for i in range(animation.n_frames))
    print(f"Generated {destination.relative_to(ROOT)}: {len(frames)} frames, {total / 1000:.1f}s, "
          f"{destination.stat().st_size / 1024:.0f} KiB")


if __name__ == "__main__":
    main()
