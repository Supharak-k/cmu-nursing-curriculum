"""Validate the deterministic PNG extraction and protect the originals."""
import sys
import unittest
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from prepare_reward_logos import SOURCES, remove_white_matte


class RewardLogoTests(unittest.TestCase):
    def test_all_outputs_are_real_transparent_pngs(self):
        for original, output in SOURCES:
            with self.subTest(output=output), Image.open(ROOT / "image/web" / output) as image:
                self.assertEqual(image.format, "PNG")
                self.assertEqual(image.mode, "RGBA")
                self.assertEqual(image.getchannel("A").getextrema(), (0, 255))
                self.assertEqual(image.getpixel((0, 0))[3], 0)
                self.assertTrue((ROOT / "image/reward" / original).exists())

    def test_artwork_color_is_not_redrawn(self):
        image = Image.new("RGB", (20, 20), "white")
        image.putpixel((10, 10), (81, 39, 140))
        result = remove_white_matte(image)
        self.assertEqual(result.getpixel((12, 12)), (81, 39, 140, 255))

    def test_white_star_is_preserved(self):
        image = Image.new("RGB", (1075, 865), "white")
        result = remove_white_matte(image, preserve_star=True)
        self.assertIn((255, 255, 255, 255), result.get_flattened_data())
        self.assertEqual(result.getpixel((0, 0))[3], 0)


if __name__ == "__main__":
    unittest.main()
