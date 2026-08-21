"""
dxf_pipe_and_export.py
-----------------------
Rhino 8 ScriptEditor (CPython 3)

Batch: for every .dxf in a chosen folder ->
  1. Reset the document to a blank slate (objects, units, layers, block
     definitions) and import just this DXF into it
  2. Force every object to #111111
  3. Find all curves with bounding-box diagonal < SMALL_THRESHOLD_MM
  4. Scale each of those small curves by DOUBLE_SMALL_CURVES_FACTOR
     about its own center, in place - before piping runs on it
  5. Build pipe meshes around the (now doubled) small curves
     (Radius/Segments/Faceted/CapType/Accuracy per the Properties
     panel screenshot)
  6. Top view, shaded display mode, zoom extents
  7. Write a high-res JPG (~10080 x 7024) with a pure white background,
     named after the source DXF, saved beside it

RUN THIS IN A DISPOSABLE DOCUMENT:
  Step 1 resets the document you have open when you launch this - not
  just the objects in it, but its layers, block definitions, and unit
  system too - then reuses that same document for every DXF in the
  folder. It cannot open each DXF in its own separate window: handing
  off to a new document mid-script isn't reliably scriptable (on Mac,
  a script loses the ability to drive a window it just created), so
  this gets the same "nothing carries over between files" result by
  clearing the one document instead of opening a new one each time.
  Net effect: whatever was in the file you had open is gone once this
  finishes. Run it in a new/throwaway Rhino file, and don't save over
  your open file afterward.

WHY NO ApplyCurvePiping COMMAND:
  The dash form still stops for an Enter on every file and there is no
  RhinoCommon API to set the piping *property* directly. Instead this
  bakes the same geometry with Rhino.Geometry.Mesh.CreateFromCurvePipe(),
  which is the exact mesh the piping display generates. Fully scripted,
  zero prompts, deterministic.

  Trade-off: the result is real mesh objects, not a display property on
  the curves. For raster export that is equivalent (and more
  predictable). If you ever need a .3dm that carries the live piping
  property, that has to stay a manual/command step.
"""
#! python 3
import rhinoscriptsyntax as rs
import scriptcontext as sc
import Rhino
import System
import os
import glob
import traceback

# ---------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------
TEST_FILE = None              # r"C:\...\29.dxf" to run a single file

SMALL_THRESHOLD_MM = 50.0

PIPE_RADIUS_MM = 1.0
PIPE_SEGMENTS = 16
PIPE_FACETED = False
PIPE_CAPTYPE = "Dome"         # None / Flat / Box / Dome
PIPE_ACCURACY = 50            # 0-100

OBJECT_COLOR = (17, 17, 17)   # #111111
DISPLAY_MODE = "Shaded"

# 10080 x 7024 is ~1.435:1, which is NOT 11x8.5 (1.294:1).
# For true sheet proportion at this width use 10080 x 7789.
IMG_WIDTH = 10080
IMG_HEIGHT = 7024
JPG_QUALITY = 95              # 0-100

MM = 2  # Rhino.UnitSystem.Millimeters

WHITE = System.Drawing.Color.White


def mm_to_doc_units(value_mm):
    """
    rs.UnitScale(to_system, from_system=None) returns the factor that
    converts a value FROM from_system TO to_system (from_system defaults
    to the current doc units). To turn a millimeter value into doc
    units, from_system must be MM and to_system must be the doc's own
    unit system - i.e. the arguments are the reverse of what you'd guess
    from the function's name.
    """
    return value_mm * rs.UnitScale(sc.doc.ModelUnitSystem, MM)


def get_dxf_list():
    if TEST_FILE:
        return [TEST_FILE]
    folder = rs.BrowseForFolder(message="Select folder containing DXF files")
    if not folder:
        return []
    files = glob.glob(os.path.join(folder, "*.dxf")) + \
            glob.glob(os.path.join(folder, "*.DXF"))
    return sorted(set(files))


def reset_document():
    """
    Wipe every trace of whatever was in the document before this DXF -
    not just objects, but units, layers, and block definitions - so
    nothing about the file you had open when you ran this script (or
    the previous DXF in this same batch) bleeds into the next import.

    This does NOT open a separate Rhino document/window per DXF. Doing
    that from a running script is not reliably scriptable: '_-New'/
    '_-Open' hand control to a new window, and on Mac a script cannot
    keep driving that new window afterward (McNeel forum: "As New
    always creates a new window in MacRhino, if you are running a
    script in the original window, there's absolutely nothing you can
    do with it in the new window"). So this stays in the one document
    the whole run and resets it in place instead - the practical
    equivalent for everything this script actually reads or writes.

    Consequence: whatever file you had open when you launched this
    gets its content replaced, DXF by DXF, for the whole run. Don't
    save over it afterward - close without saving once the batch is
    done.
    """
    ids = rs.AllObjects()
    if ids:
        rs.DeleteObjects(ids)

    # DXF import does not change the document's unit system, so without
    # this every SMALL_THRESHOLD_MM / PIPE_RADIUS_MM comparison would
    # silently inherit whatever units the previously open file used.
    sc.doc.AdjustModelUnitSystem(Rhino.UnitSystem.Millimeters, False)

    keep_layer = "Default"
    if not rs.IsLayer(keep_layer):
        rs.AddLayer(keep_layer)
    rs.CurrentLayer(keep_layer)

    # Layers/blocks can be nested, so a layer or block left over from a
    # deeper level won't delete until its children are gone first - a
    # few passes clears the whole tree without hand-coding the order.
    for _ in range(25):
        leftover = [n for n in (rs.LayerNames() or []) if n != keep_layer]
        if not leftover:
            break
        for name in leftover:
            rs.DeleteLayer(name)

    for _ in range(25):
        leftover = rs.BlockNames() or []
        if not leftover:
            break
        for name in leftover:
            rs.DeleteBlock(name)

    sc.doc.Views.Redraw()


def import_dxf(path):
    ok = rs.Command('_-Import "{}" _Enter'.format(path), False)
    if not ok:
        print("  !! Import failed: {}".format(path))
    return ok


def make_attributes(color):
    """Attributes forcing an explicit object + plot color."""
    attr = Rhino.DocObjects.ObjectAttributes()
    attr.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
    attr.ObjectColor = color
    attr.PlotColorSource = \
        Rhino.DocObjects.ObjectPlotColorSource.PlotColorFromObject
    attr.PlotColor = color
    return attr


def color_all_objects():
    """
    ObjectColor alone does nothing unless ColorSource is switched to
    ColorFromObject - otherwise Rhino keeps inheriting the layer color.
    """
    ids = rs.AllObjects()
    if not ids:
        return 0

    color = System.Drawing.Color.FromArgb(*OBJECT_COLOR)
    count = 0
    for obj_id in ids:
        obj = sc.doc.Objects.FindId(obj_id)
        if not obj:
            continue
        attr = obj.Attributes
        attr.ColorSource = Rhino.DocObjects.ObjectColorSource.ColorFromObject
        attr.ObjectColor = color
        attr.PlotColorSource = \
            Rhino.DocObjects.ObjectPlotColorSource.PlotColorFromObject
        attr.PlotColor = color
        sc.doc.Objects.ModifyAttributes(obj, attr, True)
        count += 1

    sc.doc.Views.Redraw()
    return count


def find_small_curves(threshold_mm):
    """Return (guid, Curve) for every curve under the diagonal threshold."""
    threshold = mm_to_doc_units(threshold_mm)
    found = []
    for obj_id in rs.AllObjects():
        bbox = rs.BoundingBox(obj_id)
        if not bbox:
            continue
        if rs.Distance(bbox[0], bbox[6]) >= threshold:
            continue
        obj = sc.doc.Objects.FindId(obj_id)
        if not obj:
            continue
        geo = obj.Geometry
        if isinstance(geo, Rhino.Geometry.Curve):
            found.append((obj_id, geo))
    return found


DOUBLE_SMALL_CURVES_FACTOR = 2.0


def double_small_curves(curve_pairs):
    """
    Scale each small curve by DOUBLE_SMALL_CURVES_FACTOR about its own
    bounding-box center - in place, growing in every direction rather
    than shifting position - before piping runs on it. Returns the
    (guid, Curve) pairs for the scaled replacements, in the same order,
    so callers don't hold onto pre-transform references: ObjectTable's
    Transform deletes the original and bakes a new object, so the old
    Guid/Curve pair passed in is no longer live.
    """
    scaled = []
    for obj_id, curve in curve_pairs:
        center = curve.GetBoundingBox(True).Center
        xform = Rhino.Geometry.Transform.Scale(center, DOUBLE_SMALL_CURVES_FACTOR)
        new_id = sc.doc.Objects.Transform(obj_id, xform, True)
        if new_id == System.Guid.Empty:
            continue
        new_obj = sc.doc.Objects.FindId(new_id)
        if new_obj is None:
            continue
        new_geo = new_obj.Geometry
        if isinstance(new_geo, Rhino.Geometry.Curve):
            scaled.append((new_id, new_geo))

    sc.doc.Views.Redraw()
    return scaled


def cap_style(name):
    """
    Resolve by reflecting over the enum's real member names. Avoids
    getattr-by-name entirely, since "None" is a Python keyword and the
    .NET member surfaces under an unpredictable identifier depending on
    the Python.NET binding.
    """
    enum_type = Rhino.Geometry.MeshPipeCapStyle
    names = list(System.Enum.GetNames(enum_type))

    key = (name or "dome").strip().lower().rstrip("_")
    aliases = {
        "none": ("none", "nocap", "open"),
        "open": ("none", "nocap", "open"),
        "flat": ("flat",),
        "box": ("box", "flatextended"),
        "dome": ("dome", "round", "roundcap"),
    }.get(key, (key,))

    for member in names:
        if member.strip().lower().rstrip("_") in aliases:
            return System.Enum.Parse(enum_type, member)

    print("  !! Cap style '{}' not found. Available: {}".format(name, names))
    return System.Enum.Parse(enum_type, names[0])


def build_pipe_meshes(curve_pairs):
    """
    Mesh.CreateFromCurvePipe() generates the same mesh the Curve Piping
    display would - but in code, with no command prompt.
    """
    radius = mm_to_doc_units(PIPE_RADIUS_MM)
    caps = cap_style(PIPE_CAPTYPE)
    color = System.Drawing.Color.FromArgb(*OBJECT_COLOR)
    attr = make_attributes(color)

    added = 0
    failed = 0
    first_error = None
    for _, curve in curve_pairs:
        try:
            mesh = Rhino.Geometry.Mesh.CreateFromCurvePipe(
                curve, radius, PIPE_SEGMENTS, PIPE_ACCURACY,
                caps, PIPE_FACETED)
        except Exception as ex:
            if first_error is None:
                first_error = "{}: {}".format(type(ex).__name__, ex)
            mesh = None

        if mesh is None:
            failed += 1
            continue

        if sc.doc.Objects.AddMesh(mesh, attr) != System.Guid.Empty:
            added += 1
        else:
            failed += 1

    sc.doc.Views.Redraw()
    if first_error:
        print("  !! first pipe error: {}".format(first_error))
    return added, failed


def setup_view():
    view = sc.doc.Views.ActiveView
    if view is None:
        print("  !! No active view.")
        return None

    vp = view.ActiveViewport
    vp.SetProjection(Rhino.Display.DefinedViewportProjection.Top, None, False)

    # These three are real, independent per-viewport switches - none of
    # them are display-mode settings, so they have to be turned off here
    # rather than assumed to follow from picking "Shaded".
    vp.ConstructionGridVisible = False
    vp.ConstructionAxesVisible = False
    vp.WorldAxesVisible = False

    dmd = Rhino.Display.DisplayModeDescription.FindByName(DISPLAY_MODE)
    if dmd:
        # SetFill(WHITE) pins the display mode's frame-buffer clear
        # color to solid white regardless of whether "Shaded" is
        # otherwise configured for a gradient, an environment, or a
        # background bitmap - so there's no gradient/env/bitmap left to
        # show through as an off-white background. This is mutating a
        # local copy of the descriptor (from FindByName, not
        # UpdateDisplayMode'd back), so it only affects this viewport
        # for this session - it does not rewrite the shared "Shaded"
        # display mode other views or other files still use.
        dmd.DisplayAttributes.SetFill(WHITE)
        try:
            dmd.DisplayAttributes.CustomGroundPlaneOn = False
        except Exception:
            pass
        vp.DisplayMode = dmd
    else:
        print("  !! Display mode '{}' not found.".format(DISPLAY_MODE))

    # ZoomExtents fits the CURRENT viewport aspect ratio, not the export
    # image's. If the on-screen panel isn't the same shape as
    # IMG_WIDTH x IMG_HEIGHT, the frustum ZoomExtents computes doesn't
    # match what ViewCaptureSettings renders, so the export can end up
    # cropped or under-filled even though the on-screen view looks
    # perfectly framed (a known Rhino issue - McNeel RH-53656/RH-53758 -
    # with custom-resolution capture at a non-viewport aspect ratio).
    # Matching the viewport's pixel size to the export size first makes
    # ZoomExtents compute the fit at the exact aspect that gets
    # captured, so there is no mismatch left for that bug to trigger.
    try:
        vp.Size = System.Drawing.Size(IMG_WIDTH, IMG_HEIGHT)
    except Exception as ex:
        print("  !! could not match viewport size to export size ({}: {})"
              .format(type(ex).__name__, ex))

    rs.ZoomExtents()
    sc.doc.Views.Redraw()
    return view


def flatten_onto_white(bitmap):
    """
    setup_view() asks the display mode/capture settings to give us a
    solid white background, but that has proven unreliable in practice
    (the capture can still come back with the display mode's actual
    gray) - so this does not trust that request succeeded. Instead it
    samples the corner pixel, which ZoomExtents guarantees is
    background (never real geometry), and remaps that exact color to
    pure white in one native GDI+ pass. That works regardless of *why*
    the background wasn't already white, since it doesn't depend on
    any Rhino display/capture setting having taken effect - only on the
    background actually being a flat, uniform color, which Rhino's
    Shaded mode is by default.

    Leaves anti-aliased edge pixels (a blend between geometry and
    background, so not an exact match to the sampled corner color)
    untouched - at 10080x7024 that is a sub-pixel-scale fringe, not a
    visible defect.
    """
    w, h = bitmap.Width, bitmap.Height
    corners = [bitmap.GetPixel(0, 0), bitmap.GetPixel(w - 1, 0),
               bitmap.GetPixel(0, h - 1), bitmap.GetPixel(w - 1, h - 1)]
    # ZoomExtents pads the frame, so all four corners are background in
    # the normal case; if geometry happens to reach a corner, go with
    # whichever color the majority of the corners agree on.
    bg = max(corners, key=lambda c: sum(1 for o in corners if o == c))

    flat = System.Drawing.Bitmap(bitmap.Width, bitmap.Height,
                                 System.Drawing.Imaging.PixelFormat.Format24bppRgb)
    g = System.Drawing.Graphics.FromImage(flat)
    try:
        g.Clear(WHITE)

        if bg.R >= 250 and bg.G >= 250 and bg.B >= 250:
            g.DrawImage(bitmap, 0, 0, bitmap.Width, bitmap.Height)
            return flat

        remap = System.Drawing.Imaging.ColorMap()
        remap.OldColor = System.Drawing.Color.FromArgb(255, bg.R, bg.G, bg.B)
        remap.NewColor = WHITE
        attrs = System.Drawing.Imaging.ImageAttributes()
        attrs.SetRemapTable(
            System.Array[System.Drawing.Imaging.ColorMap]([remap]))

        dest = System.Drawing.Rectangle(0, 0, bitmap.Width, bitmap.Height)
        g.DrawImage(bitmap, dest, 0, 0, bitmap.Width, bitmap.Height,
                    System.Drawing.GraphicsUnit.Pixel, attrs)
    finally:
        g.Dispose()
    return flat


def jpeg_encoder_params():
    codec = None
    for enc in System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders():
        if enc.MimeType == "image/jpeg":
            codec = enc
            break
    params = System.Drawing.Imaging.EncoderParameters(1)
    # Must be Int64. A plain Python int binds to the wrong overload and
    # GDI+ rejects the whole parameter block with "Parameter is not valid".
    params.Param[0] = System.Drawing.Imaging.EncoderParameter(
        System.Drawing.Imaging.Encoder.Quality,
        System.Int64(JPG_QUALITY))
    return codec, params


def save_jpeg(bitmap, path):
    """Try the quality-controlled encoder, fall back to a plain save."""
    try:
        codec, params = jpeg_encoder_params()
        if codec:
            bitmap.Save(path, codec, params)
            return True
    except Exception as ex:
        print("  .. encoder save failed ({}: {}), falling back"
              .format(type(ex).__name__, ex))

    try:
        bitmap.Save(path, System.Drawing.Imaging.ImageFormat.Jpeg)
        return True
    except Exception as ex:
        print("  !! plain JPEG save failed: {}: {}"
              .format(type(ex).__name__, ex))
        return False


def write_jpg(view, jpg_path):
    bitmap = None
    flat = None
    try:
        size = System.Drawing.Size(IMG_WIDTH, IMG_HEIGHT)
        settings = Rhino.Display.ViewCaptureSettings(view, size, 300)

        # ViewCaptureSettings has no TransparentBackground or
        # DrawGroundPlane property (those belong to the older, unrelated
        # ViewCapture class) - setting them here used to fail silently
        # and do nothing. The frame buffer is now pinned to solid white
        # directly on the display mode in setup_view(), and the
        # property here is "DrawAxis" (singular), not "DrawAxes" - the
        # old plural name also failed silently, so the world axes icon
        # was never actually being suppressed for the capture.
        for prop in ("DrawBackground", "DrawGrid", "DrawAxis"):
            try:
                setattr(settings, prop, False)
            except Exception as ex:
                print("  !! could not set ViewCaptureSettings.{} ({}: {})"
                      .format(prop, type(ex).__name__, ex))

        try:
            bitmap = Rhino.Display.ViewCapture.CaptureToBitmap(settings)
        except Exception:
            bitmap = view.CaptureToBitmap(size)

        if bitmap is None:
            print("  !! Capture returned no bitmap.")
            return False

        print("  captured {}x{}".format(bitmap.Width, bitmap.Height))

        flat = flatten_onto_white(bitmap)

        if not save_jpeg(flat, jpg_path):
            return False

        return os.path.exists(jpg_path)

    except Exception as ex:
        print("  !! JPG WRITE FAILED: {}: {}".format(type(ex).__name__, ex))
        traceback.print_exc()
        return False
    finally:
        if flat:
            flat.Dispose()
        if bitmap:
            bitmap.Dispose()


def process_one(path):
    print("Processing: {}".format(path))
    reset_document()

    if not import_dxf(path):
        return False
    sc.doc.Views.Redraw()

    recolored = color_all_objects()
    total = len(rs.AllObjects())

    small = find_small_curves(SMALL_THRESHOLD_MM)
    print("  {} of {} objects small (<{}mm); recolored {}".format(
        len(small), total, SMALL_THRESHOLD_MM, recolored))

    if small:
        small = double_small_curves(small)
        print("  doubled {} small curves in place".format(len(small)))
        added, failed = build_pipe_meshes(small)
        print("  piped {} curves ({} failed)".format(added, failed))
    else:
        print("  nothing to pipe")

    rs.UnselectAllObjects()

    view = setup_view()
    if view is None:
        return False

    base = os.path.splitext(os.path.basename(path))[0]
    jpg_path = os.path.join(os.path.dirname(path), base + ".jpg")

    if write_jpg(view, jpg_path):
        print("  -> {} ({}x{})".format(jpg_path, IMG_WIDTH, IMG_HEIGHT))
        return True

    print("  !! JPG NOT CONFIRMED for {}".format(jpg_path))
    return False


def main():
    print("=== dxf_pipe_and_export.py  rev6 (mesh-baked piping, JPG out) ===")
    files = get_dxf_list()
    if not files:
        print("No DXF files found / cancelled.")
        return
    print("Found {} DXF file(s).".format(len(files)))

    succeeded, failed = [], []
    for f in files:
        try:
            (succeeded if process_one(f) else failed).append(f)
        except Exception as ex:
            print("  !! UNHANDLED: {}: {}".format(type(ex).__name__, ex))
            traceback.print_exc()
            failed.append(f)

    print("Done. {} succeeded, {} failed.".format(len(succeeded), len(failed)))
    for f in failed:
        print("  FAILED: {}".format(f))


if __name__ == "__main__":
    main()
