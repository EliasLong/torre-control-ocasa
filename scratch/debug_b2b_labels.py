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
        print(f"Error: {e}")
        return []

rows = fetch_sheet(SHEET_ID, "PL2")
print("\n--- PL2 B2B Row Inspection ---")
for i, row in enumerate(rows[1:]):
    if len(row) < 20: continue
    if row[19].strip().upper() == "B2B":
        s9 = row[9] if len(row) > 9 else "N/A"
        t13 = row[13] if len(row) > 13 else "N/A"
        l10 = row[10] if len(row) > 10 else "N/A"
        print(f"LPN={l10}, SubTrans={repr(s9)}, Type={repr(t13)}")
        # Only print first few
        if i > 1000: break
