import urllib.request
import csv
from io import StringIO

SHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'
SHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI'

TRIP_SHEETS = [
    {'id': SHEET_B2C, 'gid': '2008554442', 'dateCol': 13},
    {'id': SHEET_B2C, 'gid': '0', 'dateCol': 12},
    {'id': SHEET_B2B, 'gid': '2114457503', 'dateCol': 16},
    {'id': SHEET_B2B, 'gid': '1832488493', 'dateCol': 16},
]

def parse_sheet_date(raw):
    if not raw or not raw.strip(): return None
    s = "".join([c for c in raw if c.isdigit() or c == '/'])
    parts = s.split('/')
    if len(parts) != 3: return None
    try:
        day = int(parts[0])
        month = int(parts[1])
        year = int(parts[2])
        if year < 100: year += 2000
        return f"{day:02d}/{month:02d}"
    except:
        return None

def check():
    counts = {}
    for s in TRIP_SHEETS:
        url = f"https://docs.google.com/spreadsheets/d/{s['id']}/export?format=csv&gid={s['gid']}"
        try:
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
        except:
            continue
        
        f = StringIO(text)
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if len(row) <= s['dateCol']: continue
            date_val = row[s['dateCol']].split(' ')[0]
            key = parse_sheet_date(date_val)
            if key:
                counts[key] = counts.get(key, 0) + 1
    
    for k in sorted(counts.keys()):
        if counts[k] > 0:
            print(f"Date {k}: Trips={counts[k]}")

if __name__ == "__main__":
    check()
