import urllib.request
import csv
from io import StringIO

SHEETS = [
    {'name': 'B2C PL2', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0', 'dispatchCol': 12},
    {'name': 'B2C PL3', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442', 'dispatchCol': 13},
    {'name': 'B2B PL2', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '1832488493', 'dispatchCol': 16},
    {'name': 'B2B PL3', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '2114457503', 'dispatchCol': 16},
]

TARGET_DATE = '18/05/2026'
TARGET_DATE_ALT = '18/5/2026'

def find_rows():
    for s in SHEETS:
        print(f"Checking {s['name']}...")
        url = f"https://docs.google.com/spreadsheets/d/{s['id']}/export?format=csv&gid={s['gid']}"
        try:
            with urllib.request.urlopen(url) as response:
                text = response.read().decode('utf-8')
        except Exception as e:
            print(f"Error fetching {s['name']}: {e}")
            continue
        
        f = StringIO(text)
        reader = csv.reader(f)
        rows = list(reader)
        
        for i, row in enumerate(rows):
            if len(row) <= s['dispatchCol']:
                continue
            
            dispatch_val = row[s['dispatchCol']].strip()
            if TARGET_DATE in dispatch_val or TARGET_DATE_ALT in dispatch_val:
                print(f"MATCH in {s['name']} Row {i+1}: {row}")

if __name__ == "__main__":
    find_rows()
