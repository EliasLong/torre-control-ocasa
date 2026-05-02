import urllib.request
import csv
import io
import re

SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM'

url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_B2C}/export?format=csv&gid=0"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = response.read().decode('utf-8')
    reader = csv.reader(io.StringIO(data))
    for cols in reader:
        if len(cols) > 3 and cols[3] == '558479':
            print(f"Row 558479: {cols}")
