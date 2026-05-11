import win32print
from datetime import datetime

PRINTER_NAME = "POS58"  # เปลี่ยนให้ตรงกับชื่อ Printer ใน Windows

def print_receipt():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    text = f"""
========================
      POS58 RECEIPT
========================
Date: {now}

Item              Price
------------------------
Coffee             50
Water              20
------------------------
TOTAL              70 THB

Thank you


"""

    # ESC/POS commands
    data = b"\x1b\x40"              # reset
    data += text.encode("utf-8")
    data += b"\n\n\n"
    data += b"\x1d\x56\x00"         # cut paper

    hPrinter = win32print.OpenPrinter(PRINTER_NAME)
    try:
        job = win32print.StartDocPrinter(hPrinter, 1, ("POS Receipt", None, "RAW"))
        win32print.StartPagePrinter(hPrinter)
        win32print.WritePrinter(hPrinter, data)
        win32print.EndPagePrinter(hPrinter)
        win32print.EndDocPrinter(hPrinter)
        print("Print success")
    finally:
        win32print.ClosePrinter(hPrinter)

print_receipt()