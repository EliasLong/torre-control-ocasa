import urllib.request
import csv
import io

sheets = [
    {
        'name': 'PL2_B2B (SPREADSHEET_B2C, gid=2008554442)',
        'sid': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM',
        'gid': '2008554442',
        'target_col': 'FECHA DE DESPACHO',
    },
    {
        'name': 'PL3_B2B (SPREADSHEET_B2C, gid=0)',
        'sid': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM',
        'gid': '0',
        'target_col': 'Fecha de Salida',
    },
    {
        'name': 'PL3_B2B (SPREADSHEET_B2B, gid=2114457503)',
        'sid': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI',
        'gid': '2114457503',
        'target_col': 'Hora Inicio',
    },
    {
        'name': 'PL2_B2B (SPREADSHEET_B2B, gid=1832488493)',
        'sid': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI',
        'gid': '1832488493',
        'target_col': 'Fecha de Salida',
    },
]

for sheet in sheets:
    url = f"https://docs.google.com/spreadsheets/d/{sheet['sid']}/export?format=csv&gid={sheet['gid']}"
    print(f"\n{'='*60}")
    print(f"Sheet: {sheet['name']}")
    print(f"Looking for column: '{sheet['target_col']}'")
    print(f"{'='*60}")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = list(csv.reader(io.StringIO(data)))

            if not reader:
                print("  EMPTY SHEET")
                continue

            header = reader[0]
            print(f"\nAll headers:")
            for i, h in enumerate(header):
                marker = " <<<" if sheet['target_col'].lower() in h.lower() else ""
                print(f"  [{i}] {h!r}{marker}")

            # Find target column index
            target_idx = None
            for i, h in enumerate(header):
                if sheet['target_col'].lower() in h.lower():
                    target_idx = i
                    break

            if target_idx is None:
                print(f"\n  !! Column '{sheet['target_col']}' NOT FOUND in headers !!")
            else:
                print(f"\n  Found at index [{target_idx}]")
                print(f"\nSample values in col [{target_idx}] (first 10 data rows):")
                for row in reader[1:11]:
                    val = row[target_idx] if len(row) > target_idx else 'N/A'
                    print(f"  {val!r}")

                # Count non-empty values
                count = sum(1 for r in reader[1:] if len(r) > target_idx and r[target_idx].strip())
                print(f"\n  Rows with non-empty date: {count} / {len(reader)-1}")

    except Exception as e:
        print(f"  ERROR: {e}")
