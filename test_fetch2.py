import urllib.request
import csv
import io
import re

SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'
SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI'

sheets = {
    'PL2_B2C': (SPREADSHEET_B2C, '0', 'B2C'),
    'PL3_B2C': (SPREADSHEET_B2C, '2008554442', 'B2C'),
    'PL2_B2B': (SPREADSHEET_B2B, '1832488493', 'B2B'),
    'PL3_B2B': (SPREADSHEET_B2B, '2114457503', 'B2B'),
}

totals = {}

for name, (sid, gid, typ) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            sheet_total = 0
            for cols in reader:
                if len(cols) < 5: continue
                raw_date = cols[0].strip()
                if not raw_date: continue
                
                s = "".join(c for c in raw_date if c.isdigit() or c == '/')
                match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{2,4})$', s)
                if match:
                    dd = match.group(1).zfill(2)
                    mm = match.group(2).zfill(2)
                    dateKey = f"{dd}/{mm}"
                else:
                    dateKey = None
                
                if dateKey == "27/04":
                    is_dispatched = any('liberado' in str(c).lower() for c in cols)
                    if is_dispatched:
                        if typ == 'B2C':
                            b4 = 0
                            b7 = 0
                            try: b4 = float(cols[4])
                            except: pass
                            try: b7 = float(cols[7])
                            except: pass
                            bultos = b4 + b7
                        else:
                            try: bultos = float(cols[8])
                            except: bultos = 0
                        sheet_total += bultos
            totals[name] = sheet_total
    except Exception as e:
        print(f"Error {name}: {e}")

print("Bultos Liberados para 27/04:")
for k, v in totals.items():
    print(f"{k}: {v}")
print(f"Total B2C: {totals.get('PL2_B2C', 0) + totals.get('PL3_B2C', 0)}")
print(f"Total B2B: {totals.get('PL2_B2B', 0) + totals.get('PL3_B2B', 0)}")
print(f"Grand Total: {sum(totals.values())}")
