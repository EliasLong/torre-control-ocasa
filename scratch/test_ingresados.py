import urllib.request
import csv
import io

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'
SHEETS = {
    'PL2_INGRESADOS': (SPREADSHEET_INGRESADOS, '0'),
    'PL3_INGRESADOS': (SPREADSHEET_INGRESADOS, '1150456694'),
}

for name, (sid, gid) in SHEETS.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    print(f"\nFetching {name}...")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = csv.reader(io.StringIO(data))
            rows = list(reader)
            print(f"Total rows: {len(rows)}")
            if len(rows) > 0:
                header = rows[0]
                print(f"Header: {header[:10]} ... {header[20:30]}")
                # Check some data rows
                count = 0
                for i, cols in enumerate(rows[1:10]):
                    if len(cols) > 28:
                        print(f"Row {i+1}: Date={cols[9]}, Bultos={cols[28]}, Transp={cols[23]}")
                        count += 1
                if count == 0:
                    print("No rows with > 28 columns found in first 10 rows.")
                    # Show one row if possible
                    if len(rows) > 1:
                        print(f"Sample row length: {len(rows[1])}")
                        print(f"Sample row: {rows[1]}")
    except Exception as e:
        print(f"Error fetching {name}: {e}")
