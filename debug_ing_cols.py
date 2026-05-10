import urllib.request, csv, io

SHEETS = [
    {'name': 'PL2_INGRESADOS', 'sid': '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY', 'gid': '0'},
    {'name': 'PL3_INGRESADOS', 'sid': '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY', 'gid': '1150456694'},
]

for sheet in SHEETS:
    url = f"https://docs.google.com/spreadsheets/d/{sheet['sid']}/export?format=csv&gid={sheet['gid']}"
    print(f"\n{'='*60}")
    print(f"Sheet: {sheet['name']}")
    try:
        with urllib.request.urlopen(url) as r:
            data = list(csv.reader(io.StringIO(r.read().decode('utf-8'))))
        print(f"  Total rows: {len(data)-1}")
        print("\n  HEADERS (all columns):")
        for i, h in enumerate(data[0]):
            print(f"    [{i:2d}] {h!r}")
        print("\n  First 5 data rows (abbreviated, cols 0-30):")
        for row in data[1:6]:
            print(f"  {row[:31]}")
    except Exception as e:
        print(f"  ERROR: {e}")
