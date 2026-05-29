"""
pos_checkout.py — ใบเช็คบิล + ใบเสร็จ (Invoice)
รับค่าจาก API: POST /api/invoice
"""

import os
from datetime import datetime
from PIL import Image, ImageDraw

from slip_utils import (
    PAPER_WIDTH_PX, MARGIN_X,
    BILL_LOGO_SIZE, CHECK_LOGO_SIZE,
    BILL_TITLE_FONT_SIZE, BILL_SHOP_FONT_SIZE, BILL_INFO_FONT_SIZE,
    BILL_NORMAL_FONT_SIZE, BILL_BOLD_FONT_SIZE, BILL_ITEM_FONT_SIZE,
    BILL_TOTAL_LABEL_FONT_SIZE,
    CHECK_TITLE_FONT_SIZE, CHECK_SHOP_FONT_SIZE, CHECK_INFO_FONT_SIZE,
    CHECK_NORMAL_FONT_SIZE, CHECK_ITEM_FONT_SIZE, CHECK_TOTAL_FONT_SIZE,
    PRINTER_CASHIER,
    font, center, right_text,
    draw_dash_line, draw_thick_line, draw_dotted_line,
    safe_open_logo, output_slip,
)

SHOP_NAME     = "สถานีหม่าล่ากั๋นเอง"
SHOP_NAME_ENG = "SATHANI MALA"
SHOP_TEL      = "053-123-456"
SHOP_TAX_ID   = "1234567890"

# QR Payment
PAYMENT_QR_PATH = "payment_qr.jpg"
PAYMENT_QR_SIZE = (240, 240)


def safe_open_payment_qr(max_size=PAYMENT_QR_SIZE):
    """
    เปิดรูป QR Payment
    รองรับ PNG โปร่งใส และกันพื้นหลังดำตอนพิมพ์
    """
    if not os.path.exists(PAYMENT_QR_PATH):
        print(f"[WARN] Payment QR not found: {PAYMENT_QR_PATH}")
        return None

    qr = Image.open(PAYMENT_QR_PATH).convert("RGBA")

    bg = Image.new("RGBA", qr.size, (255, 255, 255, 255))
    bg.paste(qr, mask=qr.split()[3])

    qr = bg.convert("L")
    qr.thumbnail(max_size)
    return qr


def print_check_bill(
    table: str,
    order_no: str,
    items: list,
    subtotal: float,
    vat: float,
    service_charge: float,
    grand_total: float,
    discount: float = 0.0,
    created_at: datetime = None,
):
    if created_at is None:
        created_at = datetime.now()

    img = Image.new("L", (PAPER_WIDTH_PX, 1500), 255)
    d = ImageDraw.Draw(img)
    y = 12

    logo = safe_open_logo(CHECK_LOGO_SIZE)
    if logo:
        img.paste(logo, ((PAPER_WIDTH_PX - logo.width) // 2, y))
        y += logo.height + 6
    
    # QR Payment
    payment_qr = safe_open_payment_qr()
    if payment_qr:
        center(d, "สแกนเพื่อชำระเงิน", y, font(CHECK_INFO_FONT_SIZE, True))
        y += 24

        img.paste(payment_qr, ((PAPER_WIDTH_PX - payment_qr.width) // 2, y))
        y += payment_qr.height + 10

        # center(d, f"ยอดชำระ {grand_total:,.2f} บาท", y, font(CHECK_INFO_FONT_SIZE, True))
        # y += 28

        draw_thick_line(d, y)
        y += 18
        

    center(d, "ใบเช็คบิล", y, font(CHECK_TITLE_FONT_SIZE, True)); y += 30
    center(d, SHOP_NAME, y, font(CHECK_INFO_FONT_SIZE, True)); y += 24
    center(d, SHOP_NAME_ENG, y, font(CHECK_INFO_FONT_SIZE)); y += 20
    center(d, f"โทร: {SHOP_TEL}", y, font(CHECK_INFO_FONT_SIZE)); y += 26

    draw_thick_line(d, y); y += 14

    d.text((MARGIN_X, y), "โต๊ะ", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
    right_text(d, table, PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE, True))
    y += 22

    d.text((MARGIN_X, y), "ออเดอร์", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
    right_text(d, order_no, PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE, True))
    y += 22

    d.text((MARGIN_X, y), "วันที่", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
    right_text(
        d,
        created_at.strftime("%d/%m/%Y %H:%M"),
        PAPER_WIDTH_PX - MARGIN_X,
        y,
        font(CHECK_INFO_FONT_SIZE),
    )
    y += 28

    draw_thick_line(d, y); y += 14

    d.text((MARGIN_X, y), "รายการ", font=font(CHECK_ITEM_FONT_SIZE, True), fill=0)
    d.text((240, y), "จำนวน", font=font(CHECK_ITEM_FONT_SIZE, True), fill=0)
    right_text(d, "ราคา", PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_ITEM_FONT_SIZE, True))
    y += 30

    draw_dash_line(d, y); y += 12

    for name, qty, price in items:
        d.text((MARGIN_X, y), name, font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
        d.text((248, y), f"x{qty}", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
        right_text(
            d,
            f"{qty * price:,.2f}",
            PAPER_WIDTH_PX - MARGIN_X,
            y,
            font(CHECK_NORMAL_FONT_SIZE),
        )
        y += 24

    y += 4
    draw_dash_line(d, y); y += 14

    d.text((MARGIN_X, y), "ยอดรวม", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
    right_text(d, f"{subtotal:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE))
    y += 22

    if discount > 0:
        d.text((MARGIN_X, y), "ส่วนลด 10% ค่าอาหาร", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"-{discount:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE))
        y += 22

    if vat > 0:
        d.text((MARGIN_X, y), "VAT 7%", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{vat:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE))
        y += 22

    if service_charge > 0:
        d.text((MARGIN_X, y), "Service 10%", font=font(CHECK_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{service_charge:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(CHECK_NORMAL_FONT_SIZE))
        y += 22

    y += 4
    draw_thick_line(d, y); y += 12

    d.text((MARGIN_X, y), "รวมทั้งสิ้น", font=font(CHECK_TOTAL_FONT_SIZE, True), fill=0)
    right_text(
        d,
        f"{grand_total:,.2f}",
        PAPER_WIDTH_PX - MARGIN_X,
        y,
        font(CHECK_TOTAL_FONT_SIZE, True),
    )
    y += 36

    draw_thick_line(d, y); y += 18

    d.text((MARGIN_X, y), "หมายเหตุ", font=font(CHECK_INFO_FONT_SIZE, True), fill=0)
    y += 18
    draw_dotted_line(d, y); y += 16
    # draw_dotted_line(d, y); y += 22

    draw_dash_line(d, y); y += 14
    center(d, "*** นี่คือใบเช็คบิล ไม่ใช่ใบเสร็จ ***", y, font(12)); y += 18
    center(d, "กรุณาแจ้งพนักงานเพื่อชำระเงิน", y, font(CHECK_INFO_FONT_SIZE)); y += 20
    center(d, "Please inform staff to pay", y, font(CHECK_INFO_FONT_SIZE)); y += 20
    center(d, "ขอบคุณที่ใช้บริการ  Thank you!", y, font(CHECK_INFO_FONT_SIZE, True)); y += 24

    img = img.crop((0, 0, PAPER_WIDTH_PX, y))
    output_slip(img, PRINTER_CASHIER, "preview_check_bill.png", "Check Bill")


def print_invoice(
    invoice_id: str,
    table: str,
    items: list,
    subtotal: float,
    vat: float,
    service_charge: float,
    grand_total: float,
    discount: float = 0.0,
    payment_method: str = "เงินสด",
    cash_received: float = 0.0,
    created_at: datetime = None,
):
    if created_at is None:
        created_at = datetime.now()

    change = max(cash_received - grand_total, 0.0)

    img = Image.new("L", (PAPER_WIDTH_PX, 1200), 255)
    d = ImageDraw.Draw(img)
    y = 12

    logo = safe_open_logo(BILL_LOGO_SIZE)
    if logo:
        img.paste(logo, ((PAPER_WIDTH_PX - logo.width) // 2, y))
        y += logo.height + 8

    center(d, "ใบเสร็จรับเงิน", y, font(BILL_TITLE_FONT_SIZE, True)); y += 36
    center(d, SHOP_NAME, y, font(BILL_SHOP_FONT_SIZE, True)); y += 27
    center(d, SHOP_NAME_ENG, y, font(BILL_INFO_FONT_SIZE)); y += 20
    center(d, f"โทร: {SHOP_TEL}", y, font(BILL_INFO_FONT_SIZE)); y += 20
    center(d, f"เลขภาษี: {SHOP_TAX_ID}", y, font(BILL_INFO_FONT_SIZE)); y += 26

    draw_dash_line(d, y); y += 17

    d.text((MARGIN_X, y), "โต๊ะ", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
    right_text(d, table, PAPER_WIDTH_PX - MARGIN_X, y, font(16, True))
    y += 24

    d.text((MARGIN_X, y), "เลขที่", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
    right_text(d, invoice_id, PAPER_WIDTH_PX - MARGIN_X, y, font(14, True))
    y += 24

    d.text((MARGIN_X, y), "วันที่", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
    right_text(d, created_at.strftime("%d/%m/%Y %H:%M"), PAPER_WIDTH_PX - MARGIN_X, y, font(13))
    y += 24

    d.text((MARGIN_X, y), "ชำระโดย", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
    right_text(d, payment_method, PAPER_WIDTH_PX - MARGIN_X, y, font(15, True))
    y += 26

    draw_dash_line(d, y); y += 16

    d.text((MARGIN_X, y), "รายการ", font=font(BILL_ITEM_FONT_SIZE, True), fill=0)
    d.text((238, y), "จำนวน", font=font(BILL_ITEM_FONT_SIZE, True), fill=0)
    right_text(d, "ราคา", PAPER_WIDTH_PX - MARGIN_X, y, font(14, True))
    y += 23

    draw_dash_line(d, y); y += 14

    for name, qty, price in items:
        d.text((MARGIN_X, y), name, font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        d.text((248, y), f"x{qty}", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{qty * price:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(15))
        y += 27

    y += 8
    draw_dash_line(d, y); y += 16

    d.text((MARGIN_X, y), "ยอดรวม", font=font(BILL_BOLD_FONT_SIZE, True), fill=0)
    right_text(d, f"{subtotal:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(16))
    y += 25

    if discount > 0:
        d.text((MARGIN_X, y), "ส่วนลด 10% ค่าอาหาร", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"-{discount:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(16))
        y += 25

    if vat > 0:
        d.text((MARGIN_X, y), "VAT 7%", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{vat:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(16))
        y += 25

    if service_charge > 0:
        d.text((MARGIN_X, y), "Service 10%", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{service_charge:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(16))
        y += 30

    draw_thick_line(d, y); y += 16

    d.text((MARGIN_X, y), "รวมทั้งสิ้น", font=font(BILL_TOTAL_LABEL_FONT_SIZE, True), fill=0)
    right_text(d, f"{grand_total:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(20, True))
    y += 38

    draw_thick_line(d, y); y += 18

    if payment_method in ("เงินสด", "cash") and cash_received > 0:
        d.text((MARGIN_X, y), "รับมา", font=font(BILL_NORMAL_FONT_SIZE), fill=0)
        right_text(d, f"{cash_received:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(17))
        y += 25

        d.text((MARGIN_X, y), "เงินทอน", font=font(BILL_BOLD_FONT_SIZE, True), fill=0)
        right_text(d, f"{change:,.2f}", PAPER_WIDTH_PX - MARGIN_X, y, font(17, True))
        y += 38

    draw_dash_line(d, y); y += 23
    center(d, "ขอบคุณที่ใช้บริการ", y, font(16)); y += 25
    center(d, "Thank you!", y, font(16)); y += 28

    img = img.crop((0, 0, PAPER_WIDTH_PX, y))
    output_slip(img, PRINTER_CASHIER, "preview_invoice.png", "Invoice / ใบเสร็จ")


if __name__ == "__main__":
    sample_items = [
        ("ข้าวผัดกุ้ง", 1, 120.00),
        ("ต้มยำกุ้ง", 1, 150.00),
        ("ข้าวสวย", 2, 40.00),
        ("น้ำเปล่า", 1, 15.00),
    ]

    subtotal = sum(q * p for _, q, p in sample_items)
    vat = round(subtotal * 0.07, 2)
    service = round(subtotal * 0.10, 2)
    total = subtotal + vat + service

    print_check_bill(
        table="A-05",
        order_no="#0042",
        items=sample_items,
        subtotal=subtotal,
        vat=vat,
        service_charge=service,
        grand_total=total,
    )

    # print_invoice(
    #     invoice_id="INV-0042",
    #     table="A-05",
    #     items=sample_items,
    #     subtotal=subtotal,
    #     vat=vat,
    #     service_charge=service,
    #     grand_total=total,
    #     payment_method="เงินสด",
    #     cash_received=500.00,
    # )