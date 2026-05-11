import urllib.request
import csv
from io import StringIO

TRIP_SHEETS = [
    {'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442', 'dateCol': 13},
    {'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0', 'dateCol': 12},
    {'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '2114457503', 'dateCol': 16},
    {'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '1832488493', 'dateCol': 16},
]

TARGET_DATE = '18/05/2026'
TARGET_DATE_ALT = '18/5/2026'

def find_trips():
    for s in TRIP_SHEETS:
        url = f"https://docs.google.com/spreadsheets/d/{s['id']}/export?format=csv&gid={s['gid']}"
        try:
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
        except:
            continue
        
        f = StringIO(text)
        reader = csv.reader(f)
        rows = list(reader)
        
        for i, row in enumerate(rows):
            if len(row) <= s['dateCol']:
                continue
            
            date_val = row[s['dateCol']].strip()
            if TARGET_DATE in date_val or TARGET_DATE_ALT in date_val:
                print(f"TRIP MATCH: GID {s['gid']} Row {i+1}: Date='{date_val}'")

if __name__ == "__main__":
    find_trips()
