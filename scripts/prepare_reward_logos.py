"""Remove white mattes from the supplied logos without redrawing their artwork.

Run with Pillow installed. Originals are untouched; output is transparent PNG.
The white star inside the TQC emblem is part of its artwork, not background.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCES = (
    ("02logo EdPex.png", "reward-edpex.png"),
    ("acen.webp", "reward-acen.png"),
    ("Logo TQA2019.jpg", "reward-tqc.png"),
    ("Logo TQA2022.jpg", "reward-tqc2022.png"),
)


def remove_white_matte(image, preserve_star=False):
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            # Coordinates are relative to the supplied TQC 1075 x 865 original.
            if preserve_star and 200 / 1075 <= x / image.width <= 255 / 1075 and 180 / 865 <= y / image.height <= 265 / 865:
                continue
            low, high = min(r, g, b), max(r, g, b)
            if low >= 245:
                pixels[x, y] = (r, g, b, 0)
            elif low > 220 and high - low < 30:
                # Soften nearly-white antialiasing without altering solid color.
                alpha = (245 - low) / 25
                rgb = tuple(max(0, min(255, round((c - 255 * (1 - alpha)) / alpha))) for c in (r, g, b))
                pixels[x, y] = (*rgb, round(a * alpha))
    bounds = image.getbbox()
    if not bounds:
        raise ValueError("No artwork remained")
    image = image.crop(bounds)
    canvas = Image.new("RGBA", (image.width + 24, image.height + 24))
    canvas.paste(image, (12, 12))
    return canvas


def main():
    output = ROOT / "image" / "web"
    output.mkdir(exist_ok=True)
    for original, filename in SOURCES:
        with Image.open(ROOT / "image" / "reward" / original) as image:
            result = remove_white_matte(image, preserve_star=filename.startswith("reward-tqc"))
        result.save(output / filename, optimize=True)
        assert result.getchannel("A").getextrema() == (0, 255)
        print(f"{filename}: {result.width}x{result.height}, transparent PNG")


if __name__ == "__main__":
    main()
