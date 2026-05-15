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
print("\n--- B2B Row Inspection in PL2 ---")
count = 0
for row in rows[1:]:
    if len(row) < 14: continue
    if row[0] != "15-05-2026": continue
    
    tipo = row[13].strip().lower()
    sub_trans = row[9].strip().upper()
    
    if tipo == "sales order pick" and sub_trans == "PORTONES":
        lpn = row[10].strip().upper() if len(row) > 10 else ""
        cli = row[19].strip().upper() if len(row) > 19 else ""
        
        if "B2B" in cli or "B2B" in lpn or lpn.startswith("PL2") or lpn.startswith("PL3"):
            print(f"LPN={repr(lpn)}, CLI={repr(cli)}")
            count += 1
            if count >= 10: break
