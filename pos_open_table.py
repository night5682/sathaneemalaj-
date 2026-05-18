"""
pos_open_table.py  —  สลิปเปิดโต๊ะ + QR Code
รับค่าจาก API: POST /api/table/open
"""
from datetime import datetime
from PIL import Image, ImageDraw

from slip_utils import (
    PAPER_WIDTH_PX, MARGIN_X, QR_SIZE_PX,
    QR_LOGO_SIZE, BILL_LOGO_SIZE,
    TABLE_LABEL_FONT_SIZE, TABLE_NUMBER_FONT_SIZE, TIME_FONT_SIZE,
    QR_FOOTER_THAI_FONT_SIZE, QR_FOOTER_ENG_FONT_SIZE, QR_THANK_YOU_FONT_SIZE,
    BILL_TITLE_FONT_SIZE, BILL_SHOP_FONT_SIZE, BILL_INFO_FONT_SIZE,
    BILL_NORMAL_FONT_SIZE, BILL_BOLD_FONT_SIZE,
    PRINTER_CASHIER,
    font, center, right_text, draw_dash_line, draw_thick_line,
    safe_open_logo, make_qr_image, output_slip,
)


# =========================
# QR SLIP (เปิดโต๊ะ)
# =========================
def print_qr_slip(table: str = "A-05", order_url: str = None,
                  opened_at: datetime = None):
    if order_url is None:
        order_url = f"https://menu.yourrestaurant.com/table/{table}"
    if opened_at is None:
        opened_at = datetime.now()

    img = Image.new("L", (PAPER_WIDTH_PX, 980), 255)
    d   = ImageDraw.Draw(img)
    y   = 14

    # โลโก้
    logo = safe_open_logo(QR_LOGO_SIZE)
    if logo:
        img.paste(logo, ((PAPER_WIDTH_PX - logo.width) // 2, y))
        y += logo.height + 8
    else:
        center(d, "SATHANI MALA", y, font(32, True))
        y += 35

    center(d, "TABLE", y, font(TABLE_LABEL_FONT_SIZE))
    y += 20
    center(d, str(table), y, font(TABLE_NUMBER_FONT_SIZE, True))
    y += 70
    center(d, f"Time {opened_at.strftime('%d/%m/%Y %H:%M')}", y, font(TIME_FONT_SIZE))
    y += 35

    # QR Code
    qr    = make_qr_image(order_url, QR_SIZE_PX)
    qr_x  = (PAPER_WIDTH_PX - QR_SIZE_PX) // 2
    img.paste(qr, (qr_x, y))
    y    += QR_SIZE_PX + 35

    draw_dash_line(d, y);  y += 20
    center(d, "กรุณาสั่งอาหารผ่าน QR Code", y, font(QR_FOOTER_THAI_FONT_SIZE));  y += 26
    center(d, "Please order via QR Code",   y, font(QR_FOOTER_ENG_FONT_SIZE));   y += 27
    center(d, "Thank you",                  y, font(QR_THANK_YOU_FONT_SIZE, True)); y += 34

    img = img.crop((0, 0, PAPER_WIDTH_PX, y))
    output_slip(img, PRINTER_CASHIER, "preview_qr_slip.png", "QR Order Slip")


# =========================
# TEST
# =========================
if __name__ == "__main__":
    print_qr_slip(
        table     = "A-05",
        order_url = "https://menu.yourrestaurant.com/table/A-05",
    )