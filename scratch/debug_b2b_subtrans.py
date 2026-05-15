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
print("\n--- PL2 Column 9 (Sub-trans) for B2B rows ---")
for row in rows[1:11]:
    if len(row) > 13 and "Sales Order Pick" in row[13]:
        s9 = row[9] if len(row) > 9 else "N/A"
        l10 = row[10] if len(row) > 10 else "N/A"
        c19 = row[19] if len(row) > 19 else "N/A"
        print(f"LPN={l10}, SubTrans={repr(s9)}, Cli={repr(c19)}")
