"""
pos_order.py  —  สลิปครัว (อาหาร / เครื่องดื่ม)
รับค่าจาก API: POST /api/order
"""
from datetime import datetime
from PIL import Image, ImageDraw

from slip_utils import (
    PAPER_WIDTH_PX, MARGIN_X, LINE_X1, LINE_X2,
    KITCHEN_HEADER_TYPE_FONT, KITCHEN_HEADER_TABLE_FONT,
    KITCHEN_INFO_FONT, KITCHEN_ITEM_NAME_FONT, KITCHEN_ITEM_QTY_FONT,
    KITCHEN_NOTE_FONT, KITCHEN_FOOTER_FONT,
    FOOD_CATEGORY, DRINK_CATEGORY,
    PRINTER_FOOD, PRINTER_DRINK,
    font, text_width, center, right_text,
    draw_double_line, output_slip,
)


# =========================
# BUILD SLIP IMAGE
# =========================
def build_kitchen_slip(
    slip_type: str,        # "อาหาร" | "เครื่องดื่ม"
    table: str,
    order_no: str,
    items: list,           # [(name, qty, note), ...]
    ordered_at: datetime = None,
) -> Image.Image:

    if ordered_at is None:
        ordered_at = datetime.now()

    img = Image.new("L", (PAPER_WIDTH_PX, 1200), 255)
    d   = ImageDraw.Draw(img)
    y   = 10

    # ── แถบหัว TYPE (พื้นดำ / ตัวอักษรขาว) ──────────────
    label = f"== {slip_type} =="
    bar_h = 46
    # d.rectangle((LINE_X1, y, LINE_X2, y + bar_h), fill=0)
    tw = text_width(d, label, font(KITCHEN_HEADER_TYPE_FONT, True))
    ty = y + (bar_h - KITCHEN_HEADER_TYPE_FONT) // 2
    d.text(((PAPER_WIDTH_PX - tw) // 2, ty), label,
           font=font(KITCHEN_HEADER_TYPE_FONT, True), fill=000)
    y += bar_h + 10

    # ── โต๊ะ ──────────────────────────────────────────
    center(d, "โต๊ะ", y, font(16))
    y += 18
    center(d, str(table), y, font(KITCHEN_HEADER_TABLE_FONT, True))
    y += KITCHEN_HEADER_TABLE_FONT + 4

    draw_double_line(d, y);  y += 18

    # ── Order + เวลา ──────────────────────────────────
    d.text((MARGIN_X, y), "Order", font=font(KITCHEN_INFO_FONT, True), fill=0)
    right_text(d, order_no, PAPER_WIDTH_PX - MARGIN_X, y, font(KITCHEN_INFO_FONT, True))
    y += 25

    d.text((MARGIN_X, y), "เวลา", font=font(KITCHEN_INFO_FONT), fill=0)
    right_text(d, ordered_at.strftime("%d/%m/%Y  %H:%M"),
               PAPER_WIDTH_PX - MARGIN_X, y, font(KITCHEN_INFO_FONT))
    y += 35

    draw_double_line(d, y);  y += 14

    # ── หัวตาราง ──────────────────────────────────────
    d.text((MARGIN_X, y), "รายการ", font=font(16, True), fill=0)
    right_text(d, "จำนวน", PAPER_WIDTH_PX - MARGIN_X, y, font(16, True))
    y += 30
    d.line((LINE_X1, y, LINE_X2, y), fill=0)
    y += 10

    # ── รายการ ────────────────────────────────────────
    for idx, (name, qty, note) in enumerate(items, 1):
        if idx > 1:
            x = LINE_X1
            while x < LINE_X2:
                d.line((x, y, min(x + 3, LINE_X2), y), fill=180)
                x += 7
            y += 8

        d.text((MARGIN_X, y), f"{idx}. {name}",
               font=font(KITCHEN_ITEM_NAME_FONT, True), fill=0)
        right_text(d, f"x{qty}",
                   PAPER_WIDTH_PX - MARGIN_X, y, font(KITCHEN_ITEM_QTY_FONT, True))
        y += KITCHEN_ITEM_NAME_FONT + 6

        if note and note.strip():
            d.text((MARGIN_X + 10, y), f"   ⚑ {note.strip()}",
                   font=font(KITCHEN_NOTE_FONT), fill=0)
            y += KITCHEN_NOTE_FONT + 6

    y += 6
    draw_double_line(d, y);  y += 14

    # ── รวม ───────────────────────────────────────────
    total_qty = sum(q for _, q, _ in items)
    d.text((MARGIN_X, y), "รวม", font=font(16, True), fill=0)
    right_text(d, f"{total_qty} รายการ",
               PAPER_WIDTH_PX - MARGIN_X, y, font(16, True))
    y += 24

    d.line((LINE_X1, y, LINE_X2, y), fill=0);  y += 12
    center(d, "** กรุณาเตรียมตามลำดับ **", y, font(KITCHEN_FOOTER_FONT, True));  y += 18
    center(d, f"พิมพ์เมื่อ {ordered_at.strftime('%H:%M:%S')}", y, font(KITCHEN_FOOTER_FONT));  y += 20

    return img.crop((0, 0, PAPER_WIDTH_PX, y))


# =========================
# MAIN — ส่งครัว (แยก 2 เครื่อง)
# =========================
def print_kitchen_slips(
    table: str,
    order_no: str,
    items: list,           # [{"name":…,"qty":…,"note":…,"category":"food"|"drink"}, …]
    ordered_at: datetime = None,
):
    if ordered_at is None:
        ordered_at = datetime.now()

    food_items  = [(i["name"], i["qty"], i.get("note") or "")
                   for i in items if i.get("category") == FOOD_CATEGORY]
    drink_items = [(i["name"], i["qty"], i.get("note") or "")
                   for i in items if i.get("category") == DRINK_CATEGORY]

    if food_items:
        slip = build_kitchen_slip("อาหาร", table, order_no, food_items, ordered_at)
        output_slip(slip, PRINTER_FOOD,
                    f"kitchen_food_{order_no.replace('#','')}.png",
                    f"ครัวอาหาร | โต๊ะ {table} | {order_no}")
    else:
        print("[INFO] ไม่มีรายการอาหาร — ข้ามครัว")

    if drink_items:
        slip = build_kitchen_slip("เครื่องดื่ม", table, order_no, drink_items, ordered_at)
        output_slip(slip, PRINTER_DRINK,
                    f"kitchen_drink_{order_no.replace('#','')}.png",
                    f"บาร์เครื่องดื่ม | โต๊ะ {table} | {order_no}")
    else:
        print("[INFO] ไม่มีรายการเครื่องดื่ม — ข้ามบาร์")


# =========================
# TEST
# =========================
if __name__ == "__main__":
    print_kitchen_slips(
        table    = "A-05",
        order_no = "#0042",
        items    = [
            {"name": "ข้าวผัดกุ้ง",     "qty": 1, "note": "ไม่ใส่ไข่",    "category": "food"},
            {"name": "ต้มยำกุ้ง",        "qty": 1, "note": "เผ็ดน้อย",      "category": "food"},
            {"name": "ผัดกะเพราหมู",     "qty": 2, "note": "",              "category": "food"},
            {"name": "โค้กไม่มีน้ำแข็ง", "qty": 1, "note": "ไม่มีน้ำแข็ง", "category": "drink"},
            {"name": "น้ำเปล่า",         "qty": 2, "note": "",              "category": "drink"},
        ],
    )