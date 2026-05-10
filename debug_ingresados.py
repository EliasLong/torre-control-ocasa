import urllib.request
import csv
import io

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

sheets = {
    'PL2_INGRESADOS': (SPREADSHEET_INGRESADOS, '0'),
    'PL3_INGRESADOS': (SPREADSHEET_INGRESADOS, '1150456694'),
}

for name, (sid, gid) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    print(f"\n{'='*60}")
    print(f"Sheet: {name} (gid={gid})")
    print(f"{'='*60}")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = list(csv.reader(io.StringIO(data)))
            
            # Print header row with indices
            if reader:
                print("\n--- HEADER (row 0) ---")
                for i, col in enumerate(reader[0]):
                    print(f"  [{i}] {col}")
            
            # Print first few data rows
            print(f"\n--- FIRST 5 DATA ROWS ---")
            count = 0
            for row in reader[1:]:
                if any(c.strip() for c in row):
                    print(f"\nRow {count+1}:")
                    for i, col in enumerate(row):
                        if col.strip():
                            print(f"  [{i}] {col}")
                    count += 1
                    if count >= 5:
                        break
            
            # Count total non-empty rows
            total = sum(1 for r in reader[1:] if any(c.strip() for c in r))
            print(f"\nTotal non-empty data rows: {total}")
            
            # Check columns 9 (Programada) and 28 (Cantidad) as used in code
            print(f"\n--- CHECKING COLS 9 (date) and 28 (bultos) in first 10 data rows ---")
            for row in reader[1:11]:
                if len(row) > 9:
                    col9 = row[9] if len(row) > 9 else 'N/A'
                    col28 = row[28] if len(row) > 28 else 'N/A (row too short)'
                    col23 = row[23] if len(row) > 23 else 'N/A (row too short)'
                    print(f"  col9(date)={col9!r}  col23(transport)={col23!r}  col28(bultos)={col28!r}  total_cols={len(row)}")

    except Exception as e:
        print(f"ERROR: {e}")
