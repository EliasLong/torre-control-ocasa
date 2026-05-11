import urllib.request
import csv
import io

MONTHS = {
  'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
  'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
}

def parse_date(raw):
    raw = raw.strip()
    if not raw: return None
    if '-' in raw:
        parts = raw.split('-')
        if len(parts) == 3:
            try:
                year = int(parts[2])
                if year < 100: year += 2000
                return year
            except: pass
    return None

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'
SHEETS = {
    'PL2_INGRESADOS': (SPREADSHEET_INGRESADOS, '0'),
    'PL3_INGRESADOS': (SPREADSHEET_INGRESADOS, '1150456694'),
}

volumenRetiMeli = 0
volumenAndreani = 0
volumenFlotaPropia = 0
volumenOtros = 0

for name, (sid, gid) in SHEETS.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            rows = list(reader)
            
            for i, cols in enumerate(rows):
                if type == 'ING': pass # just matching logic
                if len(cols) < 29: continue
                col0 = cols[0].strip()
                col9 = cols[9].strip()
                if col0.lower() == 'unidad operativa': continue
                if col9 == '' or col9.lower() == 'programada': continue
                
                year = parse_date(col9)
                if year and year != 2026:
                    continue
                
                try:
                    bultos = float(cols[28])
                except:
                    bultos = 0
                    
                transportType = cols[23].strip().upper()
                
                if 'MELI' in transportType:
                    volumenRetiMeli += bultos
                elif 'ANDREANI' in transportType:
                    volumenAndreani += bultos
                elif 'FLOTA PROPIA' in transportType:
                    volumenFlotaPropia += bultos
                else:
                    volumenOtros += bultos
                    
    except Exception as e:
        print(f"Error: {e}")

print(f"RetiMeli: {volumenRetiMeli}")
print(f"Andreani: {volumenAndreani}")
print(f"FlotaPropia: {volumenFlotaPropia}")
print(f"Otros: {volumenOtros}")
print(f"Total: {volumenRetiMeli + volumenAndreani + volumenFlotaPropia + volumenOtros}")
