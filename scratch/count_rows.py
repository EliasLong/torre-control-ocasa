import urllib.request
import json
import os

API_KEY = "AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4"
SHEET_ID = "15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk"

def fetch_sheet(sheet_id, tab_name):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'{tab_name}'?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode('utf-8')).get('values', [])
    except Exception as e:
        print(f"Error fetching {tab_name}: {e}")
        return []

def count_today(rows, label):
    if not rows:
        return 0
    count = 0
    for row in rows[1:]:
        fecha = row[0] if len(row) > 0 else ""
        if fecha == "15-05-2026":
            count += 1
    return count

pl2_rows = fetch_sheet(SHEET_ID, "PL2")
pl3_rows = fetch_sheet(SHEET_ID, "PL3")

print(f"PL2 rows for 15-05-2026: {count_today(pl2_rows, 'PL2')}")
print(f"PL3 rows for 15-05-2026: {count_today(pl3_rows, 'PL3')}")
