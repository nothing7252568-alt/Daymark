from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "assets" / "images"
OUT.mkdir(parents=True, exist_ok=True)
BG = (11, 14, 13, 255)
LIME = (217, 246, 111, 255)
SAGE = (153, 181, 160, 255)


def mark(size: int, background=None, monochrome=False):
    scale = 3
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # A quiet circular orbit frames a rising sequence of day marks.
    center = (canvas_size // 2, canvas_size // 2)
    radius = int(size * 0.31 * scale)
    box = (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius)
    muted = (255, 255, 255, 105) if monochrome else (91, 110, 81, 255)
    accent = (255, 255, 255, 255) if monochrome else LIME
    draw.arc(box, start=205, end=335, fill=accent, width=max(3, int(size * 0.042 * scale)))
    draw.arc(box, start=25, end=155, fill=muted, width=max(2, int(size * 0.012 * scale)))

    base_y = int(size * 0.70 * scale)
    bar_w = int(size * 0.082 * scale)
    gap = int(size * 0.032 * scale)
    heights = [0.14, 0.20, 0.27, 0.34]
    colors = [SAGE, (184, 211, 100, 255), (205, 232, 104, 255), accent]
    total = bar_w * 4 + gap * 3
    x = (canvas_size - total) // 2
    for index, fraction in enumerate(heights):
        height = int(size * fraction * scale)
        color = colors[index] if not monochrome else accent
        draw.rounded_rectangle((x, base_y - height, x + bar_w, base_y), radius=bar_w // 2, fill=color)
        x += bar_w + gap
    dot_r = int(size * 0.023 * scale)
    draw.ellipse((int(size * 0.70 * scale) - dot_r, int(size * 0.29 * scale) - dot_r,
                  int(size * 0.70 * scale) + dot_r, int(size * 0.29 * scale) + dot_r), fill=accent)
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    return image


def main_icon(size=1024):
    image = Image.new("RGBA", (size, size), BG)
    # Soft citron haze behind the symbol, kept subtle at home-screen scale.
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((int(size * .32), int(size * .25), int(size * .72), int(size * .65)), fill=(217, 246, 111, 18))
    image = Image.alpha_composite(image, glow.filter(ImageFilter.GaussianBlur(size * .12)))
    symbol = mark(size, None)
    return Image.alpha_composite(image, symbol)


main_icon().save(OUT / "icon.png")
mark(1024, None).save(OUT / "android-icon-foreground.png")
Image.new("RGBA", (1024, 1024), BG).save(OUT / "android-icon-background.png")
mark(1024, None, monochrome=True).save(OUT / "android-icon-monochrome.png")
mark(512, None).save(OUT / "splash-icon.png")
main_icon(64).convert("RGB").save(OUT / "favicon.png", optimize=True)
