import urllib.request
import json
import os

API_KEY = "AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4"
SHEET_ID = "15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk"

def fetch_sheet(sheet_id, tab_name):
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/'{tab_name}'?key={API_KEY}"
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode('utf-8')).get('values', [])
    except Exception as e:
        print(f"Error: {e}")
        return []

rows = fetch_sheet(SHEET_ID, "PL3")
print(f"Headers: {rows[0]}")
print(f"Row 1: {rows[1]}")
