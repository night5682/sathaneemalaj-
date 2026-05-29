"""
slip_utils.py  —  shared drawing / printing utilities
ใช้ร่วมกันระหว่าง pos_open_table.py, pos_order.py, pos_checkout.py
"""
import os
from datetime import datetime

import qrcode
from PIL import Image, ImageDraw, ImageFont

try:
    import win32print
except ImportError:
    win32print = None

# =========================
# CONFIG  (แก้ที่นี่ที่เดียว)
# =========================
PRINTER_CASHIER  = "pos_bar"           # แคชเชียร์ (open table / check bill / invoice)
PRINTER_FOOD     = "pos_bar"   # ครัวอาหาร
PRINTER_DRINK    = "pos_bar"       # บาร์เครื่องดื่ม

LOGO_PATH        = "logo.png"
DPI              = 203
PAPER_WIDTH_MM   = 57.5
PAPER_WIDTH_PX   = 384

# True  = preview เท่านั้น (ไม่พิมพ์จริง)
# False = พิมพ์จริงผ่าน win32print
PREVIEW_MODE            = False
ADD_PREVIEW_INFO_HEADER = True
PREVIEW_OUTPUT_DIR      = "preview_output"

# ── GLOBAL SCALE ────────────────────────────────────
# ปรับตัวเลขนี้ตัวเดียว เพื่อขยาย/ย่อ ทุกอย่างพร้อมกัน
# 1.0 = ขนาดปกติ  |  1.2 = ใหญ่ขึ้น 20%  |  1.5 = ใหญ่ขึ้น 50%
SCALE = 1.3

def _s(base: int) -> int:
    """คูณ base ด้วย SCALE แล้วปัดเป็น int"""
    return max(1, round(base * SCALE))

# Layout
MARGIN_X = _s(22)
LINE_X1  = _s(22)
LINE_X2  = PAPER_WIDTH_PX - _s(22)

# QR
QR_SIZE_PX = _s(220)
QR_BORDER  = 0

# Logo sizes
QR_LOGO_SIZE    = (_s(220), _s(220))
BILL_LOGO_SIZE  = (_s(105), _s(105))
CHECK_LOGO_SIZE = (_s(100), _s(100))

# Font sizes — open table / QR slip
TABLE_LABEL_FONT_SIZE    = _s(18)
TABLE_NUMBER_FONT_SIZE   = _s(50)
TIME_FONT_SIZE           = _s(16)
QR_FOOTER_THAI_FONT_SIZE = _s(17)
QR_FOOTER_ENG_FONT_SIZE  = _s(16)
QR_THANK_YOU_FONT_SIZE   = _s(16)

# Font sizes — invoice / bill
BILL_TITLE_FONT_SIZE        = _s(27)
BILL_SHOP_FONT_SIZE         = _s(19)
BILL_INFO_FONT_SIZE         = _s(15)
BILL_NORMAL_FONT_SIZE       = _s(17)
BILL_BOLD_FONT_SIZE         = _s(18)
BILL_ITEM_FONT_SIZE         = _s(16)
BILL_TOTAL_LABEL_FONT_SIZE  = _s(24)
BILL_TOTAL_AMOUNT_FONT_SIZE = _s(22)

# Font sizes — check bill
CHECK_TITLE_FONT_SIZE  = _s(22)
CHECK_SHOP_FONT_SIZE   = _s(17)
CHECK_INFO_FONT_SIZE   = _s(14)
CHECK_NORMAL_FONT_SIZE = _s(16)
CHECK_BOLD_FONT_SIZE   = _s(17)
CHECK_ITEM_FONT_SIZE   = _s(15)
CHECK_TOTAL_FONT_SIZE  = _s(20)

# Font sizes — kitchen slip
KITCHEN_HEADER_TYPE_FONT  = _s(28)
KITCHEN_HEADER_TABLE_FONT = _s(42)
KITCHEN_INFO_FONT         = _s(15)
KITCHEN_ITEM_NAME_FONT    = _s(20)
KITCHEN_ITEM_QTY_FONT     = _s(20)
KITCHEN_NOTE_FONT         = _s(14)
KITCHEN_FOOTER_FONT       = _s(13)

# Item category tags
FOOD_CATEGORY  = "food"
DRINK_CATEGORY = "drink"


# =========================
# BASIC DRAWING UTILS
# =========================
def px_to_mm(px: int, dpi: int = DPI) -> float:
    return (px / dpi) * 25.4


def mm_to_px(mm: float, dpi: int = DPI) -> int:
    return round((mm / 25.4) * dpi)


def font(size: int, bold: bool = False):
    """โหลด font ภาษาไทย (Windows) พร้อม fallback"""
    paths = [
        "C:/Windows/Fonts/tahomabd.ttf" if bold else "C:/Windows/Fonts/tahoma.ttf",
        "C:/Windows/Fonts/arialbd.ttf"  if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, f) -> int:
    bbox = draw.textbbox((0, 0), text, font=f)
    return bbox[2] - bbox[0]


def text_height(draw: ImageDraw.ImageDraw, text: str, f) -> int:
    bbox = draw.textbbox((0, 0), text, font=f)
    return bbox[3] - bbox[1]


def center(draw: ImageDraw.ImageDraw, text: str, y: int, f,
           image_width: int = PAPER_WIDTH_PX):
    w = text_width(draw, text, f)
    draw.text(((image_width - w) // 2, y), text, font=f, fill=0)


def right_text(draw: ImageDraw.ImageDraw, text: str, x_right: int, y: int, f):
    w = text_width(draw, text, f)
    draw.text((x_right - w, y), text, font=f, fill=0)


def draw_dash_line(draw: ImageDraw.ImageDraw, y: int):
    draw.line((LINE_X1, y, LINE_X2, y), fill=0)


def draw_thick_line(draw: ImageDraw.ImageDraw, y: int):
    draw.line((LINE_X1, y, LINE_X2, y), fill=0, width=2)


def draw_double_line(draw: ImageDraw.ImageDraw, y: int):
    draw.line((LINE_X1, y,     LINE_X2, y),     fill=0, width=2)
    draw.line((LINE_X1, y + 4, LINE_X2, y + 4), fill=0, width=2)


def draw_dotted_line(draw: ImageDraw.ImageDraw, y: int, gap: int = 6):
    x = LINE_X1
    while x < LINE_X2:
        draw.line((x, y, min(x + 3, LINE_X2), y), fill=0)
        x += gap


def safe_open_logo(max_size=(110, 110)):
    if not os.path.exists(LOGO_PATH):
        return None
    logo = Image.open(LOGO_PATH).convert("RGBA")
    bg   = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    bg.paste(logo, mask=logo.split()[3])
    logo = bg.convert("L")
    logo.thumbnail(max_size)
    return logo


def make_qr_image(data: str, size_px: int = QR_SIZE_PX) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=QR_BORDER,
    )
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("L")
    return qr_img.resize((size_px, size_px), Image.Resampling.NEAREST)


# =========================
# PREVIEW HEADER
# =========================
def add_preview_info(img: Image.Image, slip_name: str = "Slip") -> Image.Image:
    if not ADD_PREVIEW_INFO_HEADER:
        return img
    rw, rh   = img.size
    header_h = 120
    out      = Image.new("L", (rw, rh + header_h), 255)
    d        = ImageDraw.Draw(out)
    d.rectangle((0, 0, rw - 1, header_h - 1), outline=0)
    center(d, "PREVIEW ONLY - NOT PRINT AREA",          7,  font(14, True), rw)
    center(d, slip_name,                               30,  font(16, True), rw)
    center(d, f"Width: {px_to_mm(rw):.1f} mm / {rw}px @ {DPI} DPI",
           55, font(12), rw)
    center(d, f"Length: {px_to_mm(rh):.1f} mm / {rh}px", 75, font(12), rw)
    center(d, f"QR: {QR_SIZE_PX}px = {px_to_mm(QR_SIZE_PX):.1f} mm", 95, font(12), rw)
    out.paste(img, (0, header_h))
    return out


# =========================
# SAVE / PRINT
# =========================
def save_and_show_preview(img: Image.Image, filename: str = "preview_slip.png",
                          slip_name: str = "Slip"):
    os.makedirs(PREVIEW_OUTPUT_DIR, exist_ok=True)
    rw, rh = img.size
    print("=" * 52)
    print(f"{slip_name} Preview Info")
    print(f"Printer DPI       : {DPI}")
    print(f"Paper width spec  : {PAPER_WIDTH_MM} ± 0.5 mm")
    print(f"Printable width   : {rw}px = {px_to_mm(rw):.2f} mm")
    print(f"Slip length       : {rh}px = {px_to_mm(rh):.2f} mm")
    print("=" * 52)
    out  = add_preview_info(img, slip_name)
    path = os.path.join(PREVIEW_OUTPUT_DIR, filename)
    out.save(path)
    out.show()
    print(f"Preview saved     : {os.path.abspath(path)}")


def escpos_image(img: Image.Image) -> bytes:
    img    = img.convert("1")
    w, h   = img.size
    if w % 8 != 0:
        nw  = w + (8 - w % 8)
        pad = Image.new("1", (nw, h), 1)
        pad.paste(img, (0, 0))
        img, w, h = pad, nw, h
    data  = b"\x1b\x40" + b"\x1d\x76\x30\x00"
    data += bytes([(w // 8) & 0xFF, (w // 8) >> 8, h & 0xFF, h >> 8])
    pixels = img.load()
    for y in range(h):
        for xb in range(w // 8):
            byte = 0
            for bit in range(8):
                if pixels[xb * 8 + bit, y] == 0:
                    byte |= 1 << (7 - bit)
            data += bytes([byte])
    data += b"\n\n\n" + b"\x1d\x56\x00"
    return data


def send_to_printer(printer_name: str, data: bytes):
    if win32print is None:
        raise RuntimeError("pywin32 not installed: pip install pywin32")
    h = win32print.OpenPrinter(printer_name)
    try:
        win32print.StartDocPrinter(h, 1, ("POS Slip", None, "RAW"))
        win32print.StartPagePrinter(h)
        win32print.WritePrinter(h, data)
        win32print.EndPagePrinter(h)
        win32print.EndDocPrinter(h)
    finally:
        win32print.ClosePrinter(h)


def output_slip(img: Image.Image, printer_name: str,
                filename: str = "preview_slip.png", slip_name: str = "Slip"):
    """Preview หรือพิมพ์จริงตาม PREVIEW_MODE"""
    if PREVIEW_MODE:
        save_and_show_preview(img, filename, slip_name)
    else:
        print(f"Printing [{slip_name}] → {printer_name} ...")
        send_to_printer(printer_name, escpos_image(img))
        print("Done.")