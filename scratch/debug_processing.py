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

def parse_sheet_date(raw):
    if not raw: return None
    raw = raw.strip()
    sep = '/' if '/' in raw else '-'
    parts = raw.split(sep)
    if len(parts) != 3: return None
    day = parts[0].zfill(2)
    month = parts[1].zfill(2)
    year = parts[2]
    if len(year) == 2: year = "20" + year
    return f"{year}-{month}-{day}"

pl2_rows = fetch_sheet(SHEET_ID, "PL2")
pl3_rows = fetch_sheet(SHEET_ID, "PL3")

def debug_warehouse(rows, org):
    print(f"\n--- Debugging {org} ---")
    if not rows:
        print("No rows found!")
        return

    total_rows = len(rows)
    today_rows = 0
    valid_turno_rows = 0
    picking_rows = 0
    b2c_count = 0
    b2b_count = 0
    
    turno_idx = 15
    cli_idx = 19 if org == "PL2" else 16
    
    for i, row in enumerate(rows[1:]):
        if len(row) < 14: continue
        
        fecha = parse_sheet_date(row[0])
        if fecha != "2026-05-15": continue
        today_rows += 1
        
        turno = row[turno_idx].strip().upper() if len(row) > turno_idx else ""
        if turno not in ["MAÑANA", "TARDE"]:
            continue
        valid_turno_rows += 1
            
        tipo = row[13].strip().lower()
        sub_trans = row[9].strip().upper()
        
        if tipo == "sales order pick" and sub_trans == "PORTONES":
            picking_rows += 1
            lpn = row[10].strip().upper() if len(row) > 10 else ""
            cli = row[cli_idx].strip().upper() if len(row) > cli_idx else ""
            
            is_b2c = cli == 'B2C' or lpn.startswith('B2C')
            is_b2b = cli == 'B2B' or lpn.startswith('B2B')
            
            cant = abs(float(row[4].replace(',', '.'))) if len(row) > 4 else 0
            
            if is_b2c: b2c_count += cant
            elif is_b2b: b2b_count += cant
            
    print(f"Total rows in sheet: {total_rows}")
    print(f"Rows for 2026-05-15: {today_rows}")
    print(f"Rows with valid Turno: {valid_turno_rows}")
    print(f"Rows matching isPicking: {picking_rows}")
    print(f"B2C Sum: {b2c_count}")
    print(f"B2B Sum: {b2b_count}")

debug_warehouse(pl2_rows, "PL2")
debug_warehouse(pl3_rows, "PL3")
