import urllib.request
import csv
import io

SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'
SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI'

sheets = {
    'PL2_B2C': (SPREADSHEET_B2C, '0', 'B2C'),
    'PL3_B2C': (SPREADSHEET_B2C, '2008554442', 'B2C'),
    'PL2_B2B': (SPREADSHEET_B2B, '1832488493', 'B2B'),
    'PL3_B2B': (SPREADSHEET_B2B, '2114457503', 'B2B'),
}

total_despachados = 0

for name, (sid, gid, typ) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            for i, cols in enumerate(reader):
                if len(cols) < 5: continue
                raw_date = cols[0].strip()
                if not raw_date: continue
                
                # Check how Next.js parses the date
                # s = raw.replace(/[^\d/]/g, '')
                import re
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
                        total_despachados += bultos
                        print(f"[{name} row {i}] Date:{raw_date} Bultos:{bultos} Cols:{cols[:9]}")
    except Exception as e:
        print(f"Error {name}: {e}")

print(f"Grand Total 27/04: {total_despachados}")
