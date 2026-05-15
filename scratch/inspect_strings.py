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

pl2_rows = fetch_sheet(SHEET_ID, "PL2")

def analyze_rows(rows, label):
    if not rows:
        return

    print(f"\n--- Detailed Analysis for {label} ---")
    for i, row in enumerate(rows[1:5]):
        tipo = row[13] if len(row) > 13 else "N/A"
        sub_trans = row[9] if len(row) > 9 else "N/A"
        print(f"Row {i+1}: Type={repr(tipo)}, SubTrans={repr(sub_trans)}")

analyze_rows(pl2_rows, "PL2")
