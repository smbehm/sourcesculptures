#!/usr/bin/env python3
"""
Render a DXF's modelspace to a single 11x8.5in landscape (US Letter)
printable PDF page, scaled to fit with a small margin, black linework
on a white background. A white box, 1mm larger than each label's
bounding box on every side, is drawn behind the labels (on top of the
part outlines) so the numbers stand out from linework passing behind
them.

Usage:
    python3 dxf_to_print_pdf.py input.dxf output.pdf
"""
import argparse
import sys

import ezdxf
from ezdxf.addons.drawing import RenderContext, Frontend
from ezdxf.addons.drawing.matplotlib import MatplotlibBackend
from ezdxf.addons.drawing.config import Configuration, ColorPolicy, BackgroundPolicy
from matplotlib.patches import Rectangle
import matplotlib.pyplot as plt

from scale_labels import classify_and_cluster

PAGE_W_IN = 11.0
PAGE_H_IN = 8.5
MARGIN_IN = 0.25
LABEL_BOX_MARGIN = 3.0  # mm, on each side of a label's bounding box

# On an already-processed (labels doubled) DXF, labels run up to ~24
# units and parts start around ~180, so this stays a safe midpoint.
LABEL_SIZE_THRESHOLD = 40.0
LABEL_CLUSTER_GAP = 12.0


def render(in_path, out_path):
    doc = ezdxf.readfile(in_path)
    msp = doc.modelspace()

    label_clusters, parts = classify_and_cluster(msp, LABEL_SIZE_THRESHOLD, LABEL_CLUSTER_GAP)
    label_entities = [e for entities, _ in label_clusters for e in entities]
    part_entities = [e for e, _ in parts]

    fig = plt.figure(figsize=(PAGE_W_IN, PAGE_H_IN))
    margin_x = MARGIN_IN / PAGE_W_IN
    margin_y = MARGIN_IN / PAGE_H_IN
    ax = fig.add_axes([margin_x, margin_y, 1 - 2 * margin_x, 1 - 2 * margin_y])
    ax.set_aspect("equal")
    ax.axis("off")

    ctx = RenderContext(doc)
    ctx.set_current_layout(msp)
    config = Configuration(
        background_policy=BackgroundPolicy.WHITE,
        color_policy=ColorPolicy.BLACK,
    )
    backend = MatplotlibBackend(ax, adjust_figure=False)
    frontend = Frontend(ctx, backend, config=config)
    frontend.set_background(ctx.current_layout_properties.background_color)

    # MatplotlibBackend assigns each primitive an auto-incrementing zorder
    # (backend._current_z) in draw order, so drawing parts, then the boxes,
    # then the labels naturally stacks them in that order; the box zorder
    # just needs to fall strictly between the two draw_entities() calls.
    frontend.draw_entities(part_entities)
    box_zorder = backend._current_z - 0.5
    for _, cbbox in label_clusters:
        ax.add_patch(Rectangle(
            (cbbox.extmin.x - LABEL_BOX_MARGIN, cbbox.extmin.y - LABEL_BOX_MARGIN),
            cbbox.size.x + 2 * LABEL_BOX_MARGIN,
            cbbox.size.y + 2 * LABEL_BOX_MARGIN,
            facecolor="white", edgecolor="none", zorder=box_zorder,
        ))
    frontend.draw_entities(label_entities)
    # Flushes and autoscales the axes to the drawn geometry, same as
    # draw_layout(..., finalize=True) would.
    frontend.pipeline.finalize()

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
