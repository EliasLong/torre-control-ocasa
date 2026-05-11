import urllib.request
import csv
from io import StringIO

SHEETS = [
    {'name': 'B2C PL2', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0', 'dispatchCol': 12, 'bultosCols': [4, 7]},
    {'name': 'B2C PL3', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442', 'dispatchCol': 13, 'bultosCols': [4, 7]},
    {'name': 'B2B PL2', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '1832488493', 'dispatchCol': 16, 'bultosCols': [8]},
    {'name': 'B2B PL3', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '2114457503', 'dispatchCol': 16, 'bultosCols': [8]},
]

def find_rows():
    for s in SHEETS:
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
            if len(row) <= s['dispatchCol']:
                continue
            
            bultos = 0
            for bc in s['bultosCols']:
                try:
                    bultos += float(row[bc])
                except:
                    pass
            
            if bultos > 0:
                dispatch_val = row[s['dispatchCol']].strip()
                if dispatch_val:
                    print(f"{s['name']} Row {i+1}: Bultos={bultos}, DispatchDate='{dispatch_val}'")

if __name__ == "__main__":
    find_rows()
