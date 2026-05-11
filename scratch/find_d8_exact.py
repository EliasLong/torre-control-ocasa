import urllib.request
import csv
from io import StringIO

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
        return f"{year}-{month:02d}-{day:02d}"
    except:
        return None

SHEETS = [
    {'name': 'B2C PL2', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0', 'dispatchCol': 12, 'bultosCols': [4, 7], 'dateCol': 0},
    {'name': 'B2C PL3', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442', 'dispatchCol': 13, 'bultosCols': [4, 7], 'dateCol': 0},
    {'name': 'B2B PL2', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '1832488493', 'dispatchCol': 16, 'bultosCols': [8], 'dateCol': 0},
    {'name': 'B2B PL3', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '2114457503', 'dispatchCol': 16, 'bultosCols': [8], 'dateCol': 0},
]

TARGET = '2026-05-18'

def find():
    for s in SHEETS:
        url = f"https://docs.google.com/spreadsheets/d/{s['id']}/export?format=csv&gid={s['gid']}"
        try:
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
        except:
            continue
        
        f = StringIO(text)
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if len(row) <= s['dispatchCol']: continue
            
            # Check date column
            d0 = parse_sheet_date(row[s['dateCol']])
            # Check dispatch column
            d_disp = parse_sheet_date(row[s['dispatchCol']].split(' ')[0])
            
            actual_dispatch = d_disp if d_disp else d0
            
            if actual_dispatch == TARGET:
                bultos = 0
                for bc in s['bultosCols']:
                    try: bultos += float(row[bc])
                    except: pass
                if bultos > 0:
                    print(f"MATCH in {s['name']} Row {i+1}: Bultos={bultos}, DateCol={row[s['dateCol']]}, DispatchCol={row[s['dispatchCol']]}")

if __name__ == "__main__":
    find()
