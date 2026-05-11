import urllib.request
import csv
from io import StringIO

ALL_SHEETS = [
    {'name': 'B2C PL2', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '0'},
    {'name': 'B2C PL3', 'id': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', 'gid': '2008554442'},
    {'name': 'B2B PL2', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '1832488493'},
    {'name': 'B2B PL3', 'id': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', 'gid': '2114457503'},
    {'name': 'DEVOLUCIONES PL2', 'id': '1NyuFejOKhFnu_VNvUBqoWTP6hpMUSPPd', 'gid': '745153814'},
    {'name': 'DEVOLUCIONES PL3', 'id': '1NyuFejOKhFnu_VNvUBqoWTP6hpMUSPPd', 'gid': '573838045'},
    {'name': 'INGRESADOS PL2', 'id': '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY', 'gid': '0'},
    {'name': 'INGRESADOS PL3', 'id': '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY', 'gid': '1150456694'},
    {'name': 'INCIDENCIAS', 'id': '1IABChnxxxRB9JnUe83OdNxRq6doDpDntg9j_rXxYK7s', 'gid': '468898453'},
]

TARGET_DATE = '18/05/2026'
TARGET_DATE_ALT = '18/5/2026'

def find_rows():
    for s in ALL_SHEETS:
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
            line = ",".join(row)
            if TARGET_DATE in line or TARGET_DATE_ALT in line:
                print(f"MATCH: {s['name']} Row {i+1}: {row}")

if __name__ == "__main__":
    find_rows()
