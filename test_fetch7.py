import urllib.request
import csv
import io
import re

SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'

sheets = {
    'PL2_B2C': (SPREADSHEET_B2C, '0', 'B2C'),
}

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
                s = "".join(c for c in raw_date if c.isdigit() or c == '/')
                match = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{2,4})$', s)
                if match:
                    dateKey = f"{match.group(1).zfill(2)}/{match.group(2).zfill(2)}"
                    if dateKey == "27/04":
                        has_liberado_in_all = any('liberado' in str(c).lower() for c in cols)
                        has_liberado_in_col8 = len(cols) > 8 and 'liberado' in str(cols[8]).lower()
                        
                        if has_liberado_in_all and not has_liberado_in_col8:
                            try: bultos = float(cols[7])
                            except: bultos = 0
                            print(f"Bultos {bultos} has 'liberado' but NOT in col 8! Cols: {cols}")
                            
    except Exception as e:
        print(e)
