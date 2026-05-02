import urllib.request
import csv
import io
import re

SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI'

sheets = {
    'PL2_B2B': (SPREADSHEET_B2B, '1832488493', 'B2B'),
    'PL3_B2B': (SPREADSHEET_B2B, '2114457503', 'B2B'),
}

totals_c8 = {}

for name, (sid, gid, typ) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            sheet_c8 = 0
            for cols in reader:
                if len(cols) < 5: continue
                raw_date = cols[0].strip()
                if not raw_date: continue
                
                s = "".join(c for c in raw_date if c.isdigit() or c == '/')
                match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{2,4})$', s)
                if match:
                    dateKey = f"{match.group(1).zfill(2)}/{match.group(2).zfill(2)}"
                    if dateKey == "27/04":
                        is_dispatched = any('liberado' in str(c).lower() for c in cols)
                        if is_dispatched:
                            try: c8 = float(cols[8])
                            except: c8 = 0
                            sheet_c8 += c8
            totals_c8[name] = sheet_c8
    except Exception as e:
        print(e)

print("B2B col 8 sums:")
print(totals_c8)
