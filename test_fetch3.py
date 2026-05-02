import urllib.request
import csv
import io
import re

SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'

sheets = {
    'PL2_B2C': (SPREADSHEET_B2C, '0', 'B2C'),
    'PL3_B2C': (SPREADSHEET_B2C, '2008554442', 'B2C'),
}

totals_c4 = {}
totals_c7 = {}

for name, (sid, gid, typ) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            sheet_c4 = 0
            sheet_c7 = 0
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
                        try: c4 = float(cols[4])
                        except: c4 = 0
                        try: c7 = float(cols[7])
                        except: c7 = 0
                        sheet_c4 += c4
                        sheet_c7 += c7
            totals_c4[name] = sheet_c4
            totals_c7[name] = sheet_c7
    except Exception as e:
        print(f"Error {name}: {e}")

print("B2C col 4 sums:")
print(totals_c4)
print("B2C col 7 sums:")
print(totals_c7)
