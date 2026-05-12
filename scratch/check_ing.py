
import urllib.request
import json

API_KEY = 'AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4'
SHEET_ID = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

def fetch_rows(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            import csv
            import io
            reader = csv.reader(io.StringIO(data))
            return list(reader)
    except Exception as e:
        print(f"Error fetching {gid}: {e}")
        return []

pl2_rows = fetch_rows('0')
pl3_rows = fetch_rows('1150456694')

print(f"PL2 Ingresados rows: {len(pl2_rows)}")
print(f"PL3 Ingresados rows: {len(pl3_rows)}")

d1_date = '11/05/2026'
d1_date_short = '11/5/2026'
d1_date_alt = '11-MAY-26'

def count_d1(rows, name):
    count = 0
    total_bultos = 0
    for i, r in enumerate(rows):
        if len(r) < 10: continue
        date_val = r[9].strip().upper() # Column 9 is "Programada"
        if d1_date in date_val or d1_date_short in date_val or d1_date_alt in date_val:
            count += 1
            try:
                bultos = float(r[28]) # Column 28 is "Bultos"
                total_bultos += bultos
            except: pass
    print(f"Found {count} rows for D1 in {name}, Total Bultos: {total_bultos}")

count_d1(pl2_rows, 'PL2')
count_d1(pl3_rows, 'PL3')
