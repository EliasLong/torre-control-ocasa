import urllib.request
import csv
import io
from datetime import date, timedelta

# Looking for the actual date column structure and sample data with values
sheets = [
    {
        'name': 'Sheet1 (B2C-sheet, gid=2008554442)',
        'sid': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM',
        'gid': '2008554442',
    },
    {
        'name': 'Sheet2 (B2C-sheet, gid=0)',
        'sid': '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM',
        'gid': '0',
    },
    {
        'name': 'PL3_B2B (gid=2114457503) - Hora Inicio at col 16',
        'sid': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI',
        'gid': '2114457503',
        'date_col': 16,
    },
    {
        'name': 'PL2_B2B (gid=1832488493) - Fecha de Salida at col 16',
        'sid': '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI',
        'gid': '1832488493',
        'date_col': 16,
    },
]

for sheet in sheets:
    url = f"https://docs.google.com/spreadsheets/d/{sheet['sid']}/export?format=csv&gid={sheet['gid']}"
    print(f"\n{'='*60}")
    print(f"Sheet: {sheet['name']}")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = list(csv.reader(io.StringIO(data)))

        if not reader:
            print("  EMPTY")
            continue

        header = reader[0]
        print(f"  Total rows: {len(reader)-1}")
        print(f"  Num columns: {len(header)}")

        if 'date_col' in sheet:
            dc = sheet['date_col']
            print(f"\n  Non-empty values in col [{dc}] ({header[dc] if dc < len(header) else 'N/A'}):")
            seen = {}
            for r in reader[1:]:
                val = r[dc].strip() if len(r) > dc else ''
                if val:
                    seen[val] = seen.get(val, 0) + 1
            for k, v in sorted(seen.items(), key=lambda x: -x[1])[:20]:
                print(f"    {k!r}: {v} rows")
        else:
            # Print all rows that have any non-empty cell beyond col 0
            print(f"\n  First 5 rows with data (all columns):")
            count = 0
            for i, row in enumerate(reader[:20]):
                if i == 0 or any(c.strip() for c in row):
                    print(f"  Row {i}: {row}")
                    count += 1
                    if count >= 6:
                        break

    except Exception as e:
        print(f"  ERROR: {e}")

# Also check actual recent dates in the two B2B sheets
print("\n\n" + "="*60)
print("RECENT DATA in PL3_B2B and PL2_B2B (last 30 days in col 16):")
today = date.today()
window = set()
for i in range(30):
    d = today - timedelta(days=i)
    window.add(f"{d.day:02d}/{d.month:02d}/{d.year}")
    window.add(f"{d.day}/{d.month}/{d.year}")
    window.add(f"{d.day:02d}/{d.month:02d}/{str(d.year)[2:]}")

for sid, gid, label in [
    ('1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', '2114457503', 'PL3_B2B Hora Inicio'),
    ('1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', '1832488493', 'PL2_B2B Fecha Salida'),
]:
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
        reader = list(csv.reader(io.StringIO(data)))
        print(f"\n{label}:")
        recent = [r[16] for r in reader[1:] if len(r) > 16 and r[16].strip()]
        print(f"  Recent non-empty samples: {recent[:10]}")
        # Count by date prefix (first 8 chars likely contain date)
        from collections import Counter
        c = Counter(v[:10] for v in recent if v)
        for k, v in c.most_common(10):
            print(f"    {k!r}: {v}")
    except Exception as e:
        print(f"  ERROR: {e}")
