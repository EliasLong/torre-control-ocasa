import urllib.request
import csv
from io import StringIO

SHEET_MOVIMIENTOS = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk'

def find_d8():
    # Try common gids for PL2/PL3 in this sheet
    # We can try to guess or use the API if we had the key, but we do!
    # However, let's try the CSV export for gid 0 and gid 2123512351 (common)
    gids = ['0', '1899120668'] # guessed gid for PL3
    for gid in gids:
        url = f"https://docs.google.com/spreadsheets/d/{SHEET_MOVIMIENTOS}/export?format=csv&gid={gid}"
        try:
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
        except:
            continue
        
        f = StringIO(text)
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            line = ",".join(row)
            if '18/05/2026' in line or '18/5/2026' in line:
                print(f"MATCH in Movimientos GID {gid} Row {i+1}: {row}")

if __name__ == "__main__":
    find_d8()
