import urllib.request
import json

def test_api():
    url = "http://localhost:3000/api/evento/kpis"
    print(f"Fetching from {url}...")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))
            day_15 = data.get('byDay', {}).get('15/05', {})
            print(f"Results for 15/05: B2C={day_15.get('bultosB2C')}, B2B={day_15.get('bultosB2B')}")
            
            # Check totals
            print(f"Totals: B2C={data.get('totals', {}).get('bultosB2C')}, B2B={data.get('totals', {}).get('bultosB2B')}")
            
    except Exception as e:
        print(f"Error: {e}")

test_api()
