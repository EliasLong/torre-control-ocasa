
import urllib.request
import csv
import io

API_KEY = 'AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4'
SHEET_ID = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

def fetch_rows(gid):
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            return list(reader)
    except Exception as e:
        print(f"Error fetching {gid}: {e}")
        return []

def get_breakdown(rows, target_date_patterns):
    meli = 0
    andreani = 0
    flota = 0
    otros = 0
    
    for i, r in enumerate(rows):
        if len(r) < 29: continue
        date_val = r[9].strip().upper()
        match = False
        for p in target_date_patterns:
            if p in date_val:
                match = True
                break
        if not match: continue
        
        try:
            bultos = float(r[28])
        except:
            bultos = 0
            
        transporte = r[23].strip().upper()
        if 'MELI' in transporte:
            meli += bultos
        elif 'ANDREANI' in transporte:
            andreani += bultos
        elif 'FLOTA PROPIA' in transporte:
            flota += bultos
        else:
            otros += bultos
            
    return meli, andreani, flota, otros

pl2_rows = fetch_rows('0')
pl3_rows = fetch_rows('1150456694')

patterns = ['11/05/2026', '11/5/2026', '11-MAY-26']
m1, a1, f1, o1 = get_breakdown(pl2_rows, patterns)
m2, a2, f2, o2 = get_breakdown(pl3_rows, patterns)

print(f"D1 Ingresados Breakdown:")
print(f"Retira Meli: {m1 + m2}")
print(f"Andreani: {a1 + a2}")
print(f"Flota Propia: {f1 + f2}")
print(f"Otros: {o1 + o2}")
print(f"Total: {m1+m2+a1+a2+f1+f2+o1+o2}")
