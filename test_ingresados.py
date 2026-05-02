import urllib.request
import csv
import io

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

sheets = {
    'PL2': '0',
    'PL3': '1150456694',
}

for name, gid in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_INGRESADOS}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            print(f"--- {name} Headers ---")
            for i, row in enumerate(reader):
                if i < 5:
                    print(f"Row {i}: {row}")
                else:
                    break
    except Exception as e:
        print(f"Error {name}: {e}")
