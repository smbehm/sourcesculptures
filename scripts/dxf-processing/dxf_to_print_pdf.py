#!/usr/bin/env python3
"""
Render a DXF's modelspace to a single 11x8.5in landscape (US Letter)
printable PDF page, scaled to fit with a small margin, black linework
on a white background.

Usage:
    python3 dxf_to_print_pdf.py input.dxf output.pdf
"""
import argparse
import sys

import ezdxf
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, ColorPolicy, BackgroundPolicy
from ezdxf.math import BoundingBox
import matplotlib.pyplot as plt

PAGE_W_IN = 11.0
PAGE_H_IN = 8.5
MARGIN_IN = 0.25


def modelspace_bbox(msp):
    bbox = BoundingBox()
    for e in msp:
        try:
            ebb = e.bbox()
        except AttributeError:
            continue
        if ebb.has_data:
            bbox.extend([ebb.extmin, ebb.extmax])
    return bbox


def render(in_path, out_path):
    doc = ezdxf.readfile(in_path)
    msp = doc.modelspace()
    bbox = modelspace_bbox(msp)

    fig = plt.figure(figsize=(PAGE_W_IN, PAGE_H_IN))
    margin_x = MARGIN_IN / PAGE_W_IN
    margin_y = MARGIN_IN / PAGE_H_IN
    ax = fig.add_axes([margin_x, margin_y, 1 - 2 * margin_x, 1 - 2 * margin_y])
    ax.set_aspect("equal")
    ax.axis("off")

    ctx = RenderContext(doc)
    config = Configuration(
        background_policy=BackgroundPolicy.WHITE,
        color_policy=ColorPolicy.BLACK,
    )
    backend = MatplotlibBackend(ax, adjust_figure=False)
    Frontend(ctx, backend, config=config).draw_layout(msp, finalize=True)

    # `finalize()` calls ax.autoscale(True), which fits the axes box to the
    # data with no control over the page's aspect ratio. Re-apply explicit
    # data limits so the drawing is centered and scaled to fit the fixed
    # 11x8.5in page instead.
    if bbox.has_data:
        cx, cy = bbox.center.x, bbox.center.y
        half_w = bbox.size.x / 2 * 1.02
        half_h = bbox.size.y / 2 * 1.02
        ax.set_xlim(cx - half_w, cx + half_w)
        ax.set_ylim(cy - half_h, cy + half_h)

    fig.savefig(out_path, format="pdf")
    plt.close(fig)
    print(f"Saved: {out_path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", help="input DXF path")
    ap.add_argument("output", help="output PDF path")
    args = ap.parse_args()
    render(args.input, args.output)


if __name__ == "__main__":
    sys.exit(main())
