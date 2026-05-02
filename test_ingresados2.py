import urllib.request
import csv
import io

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

sheets = {
    'PL2': '0',
    'PL3': '1150456694',
}

months = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 
          'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}

by_day = {}

for name, gid in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_INGRESADOS}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            for i, row in enumerate(reader):
                if i == 0 or len(row) < 29: continue
                
                # Parse date from col 9 "Programada"
                prog = row[9].strip() # e.g. '30-APR-26'
                if not prog: continue
                parts = prog.split('-')
                if len(parts) == 3:
                    dd = parts[0].zfill(2)
                    mm = months.get(parts[1].upper(), '00')
                    dateKey = f"{dd}/{mm}"
                else:
                    dateKey = prog
                
                try: cant = float(row[28])
                except: cant = 0
                
                by_day[dateKey] = by_day.get(dateKey, 0) + cant
    except Exception as e:
        print(f"Error {name}: {e}")

print("Ingresados por dia:")
for k in sorted(by_day.keys()):
    print(f"{k}: {by_day[k]}")
