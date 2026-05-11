import urllib.request
import csv
from io import StringIO

SHEETS = [
    {'name': 'B2C PL2', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0', 'dispatchCol': 12, 'bultosCols': [4, 7], 'dateCol': 0, 'b2c': True},
    {'name': 'B2C PL3', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442', 'dispatchCol': 13, 'bultosCols': [4, 7], 'dateCol': 0, 'b2c': True},
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
            
            d0 = parse_sheet_date(row[s['dateCol']])
            d_disp = parse_sheet_date(row[s['dispatchCol']].split(' ')[0])
            actual_dispatch = d_disp if d_disp else d0
            
            if actual_dispatch == '18/05':
                bultos = 0
                for bc in s['bultosCols']:
                    try: bultos += float(row[bc])
                    except: pass
                if bultos > 0:
                    print(f"B2C DISPATCH on 18/05: {s['name']} Row {i+1}: Bultos={bultos}")

if __name__ == "__main__":
    check()
