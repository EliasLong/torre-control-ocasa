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
print("\n--- PL2 Client Indices ---")
for i, row in enumerate(rows[1:11]):
    c18 = row[18] if len(row) > 18 else "N/A"
    c19 = row[19] if len(row) > 19 else "N/A"
    print(f"Row {i+1}: Idx18={repr(c18)}, Idx19={repr(c19)}")
