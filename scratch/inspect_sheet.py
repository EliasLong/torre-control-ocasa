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
pl3_rows = fetch_sheet(SHEET_ID, "PL3")

def analyze_rows(rows, label):
    if not rows:
        print(f"\nNo rows found for {label}")
        return

    print(f"\n--- Analysis for {label} ---")
    headers = rows[0]
    
    for i, row in enumerate(rows[1:10]):
        fecha = row[0] if len(row) > 0 else "N/A"
        tipo = row[13].strip() if len(row) > 13 else "N/A"
        sub_trans = row[9].strip() if len(row) > 9 else "N/A"
        
        # indices from indicadores.service.ts
        lpn_idx = 10
        cli_idx = 19
        turno_idx = 15 if label == "PL2" else 18
        
        lpn = row[lpn_idx] if len(row) > lpn_idx else "N/A"
        cli = row[cli_idx] if len(row) > cli_idx else "N/A"
        turno = row[turno_idx] if len(row) > turno_idx else "N/A"
        
        # classification logic
        is_pick = (tipo.lower() == 'sales order pick' and sub_trans == 'PORTONES')
        is_b2c = cli.upper() == 'B2C' or lpn.upper().startswith('B2C')
        is_b2b = cli.upper() == 'B2B' or lpn.upper().startswith('B2B')
        
        print(f"Row {i+1}: Date={fecha}, Turno={turno}, LPN={lpn}, Cli={cli} -> IS_PICK={is_pick}, IS_B2C={is_b2c}, IS_B2B={is_b2b}")

analyze_rows(pl2_rows, "PL2")
analyze_rows(pl3_rows, "PL3")
