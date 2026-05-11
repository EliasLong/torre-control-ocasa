import urllib.request
import os
import json

API_KEY = os.environ.get('GOOGLE_SHEETS_API_KEY')
SHEET_ID = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk'
TABS = ['PL2', 'PL3']

TARGET_DATE = '18/05/2026'
TARGET_DATE_ALT = '18/5/2026'

def find():
    for tab in TABS:
        url = f'https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{tab}!A:Z?key={API_KEY}'
        try:
            with urllib.request.urlopen(url) as response:
                data = json.loads(response.read().decode('utf-8'))
                values = data.get('values', [])
                for i, row in enumerate(values):
                    if not row: continue
                    fecha = row[0]
                    if TARGET_DATE in fecha or TARGET_DATE_ALT in fecha:
                        print(f"MATCH: {tab} Row {i+1}: {row}")
        except Exception as e:
            print(f"Error {tab}: {e}")

if __name__ == "__main__":
    find()
