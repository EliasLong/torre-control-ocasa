import urllib.request
import json
import os

API_KEY = "AIzaSyCU5BxKklb8d9LOcMpLyH1nMVzmsvzMMT4"
SHEET_ID = "15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk"
GID_ACUMULADO = "1670433793"

def fetch_sheet_csv(sheet_id, gid):
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    print(f"Fetching CSV from {url}...")
    try:
        with urllib.request.urlopen(url) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching CSV: {e}")
        return ""

csv_text = fetch_sheet_csv(SHEET_ID, GID_ACUMULADO)
print("\n--- Acumulado Evento Content ---")
lines = csv_text.splitlines()
for line in lines[:20]: # Print first 20 lines
    print(line)
