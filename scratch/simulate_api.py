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

def is_picking(tipo, sub_trans):
    return tipo.strip().lower() == "sales order pick" and sub_trans.strip().upper() == "PORTONES"

def classify(lpn, cli):
    cli = cli.strip().upper()
    lpn = lpn.strip().upper()
    is_b2c = cli == 'B2C' or lpn.startswith('B2C')
    is_b2b = cli == 'B2B' or lpn.startswith('B2B')
    return is_b2c, is_b2b

pl2_rows = fetch_sheet(SHEET_ID, "PL2")
pl3_rows = fetch_sheet(SHEET_ID, "PL3")

def analyze(rows, label):
    if not rows: return
    b2c = 0
    b2b = 0
    skipped_turno = 0
    
    # NEW INDICES AFTER FIX
    turno_idx = 15 
    cli_idx = 19 if label == "PL2" else 16 
    
    for i, row in enumerate(rows[1:]):
        if len(row) < 14: continue
        
        fecha = parse_sheet_date(row[0])
        if fecha != "2026-05-15": continue
        
        # Turno filter
        turno = row[turno_idx].strip().upper() if len(row) > turno_idx else ""
        if turno not in ["MAÑANA", "TARDE"]:
            skipped_turno += 1
            continue
            
        tipo = row[13]
        sub_trans = row[9]
        if is_picking(tipo, sub_trans):
            lpn = row[10] if len(row) > 10 else ""
            cli = row[cli_idx] if len(row) > cli_idx else ""
            
            is_b2c, is_b2b = classify(lpn, cli)
            cant = abs(float(row[4].replace(',', '.'))) if len(row) > 4 else 0
            
            if is_b2c: b2c += cant
            elif is_b2b: b2b += cant
            
    print(f"\n--- {label} Results for 15-05-2026 (POST-FIX) ---")
    print(f"B2C: {b2c}")
    print(f"B2B: {b2b}")
    print(f"Skipped due to Turno: {skipped_turno}")

analyze(pl2_rows, "PL2")
analyze(pl3_rows, "PL3")
