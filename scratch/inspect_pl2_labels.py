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
tipos = set()
subs = set()

for row in rows[1:]:
    if len(row) < 14: continue
    if row[0] == "15-05-2026" or row[0] == "15/05/2026":
        tipos.add(row[13])
        subs.add(row[9] if len(row) > 9 else "N/A")

print(f"Unique Types for today: {tipos}")
print(f"Unique SubTrans for today: {subs}")
