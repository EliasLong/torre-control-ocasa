import urllib.request
import csv
import io
from datetime import date, timedelta

SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

MONTHS = {
    'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
    'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
}

def parse_ingresados_date(raw):
    if not raw or not raw.strip():
        return None
    s = raw.strip()
    if '-' in s:
        parts = s.split('-')
        if len(parts) == 3:
            try:
                day = int(parts[0])
                month = MONTHS.get(parts[1].upper(), 0)
                year = int(parts[2])
                if year < 100:
                    year += 2000
                return date(year, month, day)
            except:
                pass
    return None

# Build EVENT_DAYS (last 8 days from today)
today = date.today()
print(f"Today: {today}")
event_days = []
for i in range(7, -1, -1):
    d = today - timedelta(days=i)
    event_days.append(f"{d.day:02d}/{d.month:02d}")
print(f"Event days window: {event_days}")

sheets = {
    'PL2_INGRESADOS': (SPREADSHEET_INGRESADOS, '0'),
    'PL3_INGRESADOS': (SPREADSHEET_INGRESADOS, '1150456694'),
}

totals_by_day = {}
totals_by_transport = {}
grand_total = 0
unmatched_count = 0

for name, (sid, gid) in sheets.items():
    url = f"https://docs.google.com/spreadsheets/d/{sid}/export?format=csv&gid={gid}"
    print(f"\n{'='*50}")
    print(f"Sheet: {name}")
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read().decode('utf-8')
            reader = list(csv.reader(io.StringIO(data)))
            
            sheet_total = 0
            for row in reader[1:]:  # skip header
                if len(row) < 29:
                    continue
                raw_date = row[9]
                parsed = parse_ingresados_date(raw_date)
                if not parsed:
                    continue
                key = f"{parsed.day:02d}/{parsed.month:02d}"
                try:
                    cantidad = float(row[28])
                except:
                    cantidad = 0
                transport = row[23].strip() if len(row) > 23 else ''
                
                # Aggregate by day
                totals_by_day[key] = totals_by_day.get(key, 0) + cantidad
                totals_by_transport[transport] = totals_by_transport.get(transport, 0) + cantidad
                
                if key in event_days:
                    sheet_total += cantidad
                    grand_total += cantidad
                else:
                    unmatched_count += 1
            
            print(f"  In-window total (cantidad): {sheet_total}")
    except Exception as e:
        print(f"  ERROR: {e}")

print(f"\n{'='*50}")
print(f"\nTotals by day (all):")
for k in sorted(totals_by_day):
    status = "*** IN WINDOW ***" if k in event_days else ""
    print(f"  {k}: {totals_by_day[k]:.0f} {status}")

print(f"\nTotals by transport:")
for k, v in sorted(totals_by_transport.items(), key=lambda x: -x[1]):
    print(f"  {k!r}: {v:.0f}")

print(f"\nGrand total (in-window): {grand_total:.0f}")
print(f"Rows outside window: {unmatched_count}")
