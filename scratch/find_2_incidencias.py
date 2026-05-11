import urllib.request
import csv
from io import StringIO

INCIDENCIAS_ID = '1IABChnxxxRB9JnUe83OdNxRq6doDpDntg9j_rXxYK7s'
GID = '468898453'

def find_2():
    url = f"https://docs.google.com/spreadsheets/d/{INCIDENCIAS_ID}/export?format=csv&gid={GID}"
    try:
        with urllib.request.urlopen(url) as response:
            text = response.read().decode('utf-8')
    except:
        return
    
    f = StringIO(text)
    reader = csv.reader(f)
    for i, row in enumerate(reader):
        if not row: continue
        # if any cell has '2'
        if '2' in row or '2.0' in row:
            print(f"INCIDENCIA Row {i+1}: {row}")

if __name__ == "__main__":
    find_2()
