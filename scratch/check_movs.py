
import urllib.request
import json

API_KEY = 'AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4'
SHEET_ID = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk'

def fetch_rows(tab_name):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/'{tab_name}'?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data.get('values', [])
    except Exception as e:
        print(f"Error fetching {tab_name}: {e}")
        return []

pl2_rows = fetch_rows('PL2')
pl3_rows = fetch_rows('PL3')

print(f"PL2 rows: {len(pl2_rows)}")
print(f"PL3 rows: {len(pl3_rows)}")

# Sample first 5 rows to see structure
print("PL2 sample structure (first 5):")
for r in pl2_rows[:5]: print(r)

d1_date = '11/05/2026'
d1_date_short = '11/5/2026'
d1_date_alt = '11-05-2026'

def count_d1(rows, name):
    count = 0
    for r in rows:
        if not r: continue
        date_val = r[0]
        if d1_date in date_val or d1_date_short in date_val or d1_date_alt in date_val:
            count += 1
    print(f"Found {count} rows for D1 in {name}")

count_d1(pl2_rows, 'PL2')
count_d1(pl3_rows, 'PL3')
