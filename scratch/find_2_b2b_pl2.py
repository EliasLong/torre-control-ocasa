import urllib.request
import csv
from io import StringIO

SHEET_ID = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI'
GID = '1832488493'

def find_2():
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}"
    try:
        with urllib.request.urlopen(url) as response:
            text = response.read().decode('utf-8')
    except:
        return
    
    f = StringIO(text)
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if not row: continue
        # Col 8 is Bultos
        try:
            if float(row[8]) == 2:
                print(f"B2B PL2 Row {i+1}: Col0='{row[0]}', Col16='{row[16]}'")
        except:
            pass

if __name__ == "__main__":
    find_2()
