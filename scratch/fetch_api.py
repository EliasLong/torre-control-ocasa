import urllib.request
import json

try:
    req = urllib.request.Request("http://localhost:3000/api/evento/kpis")
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print("API Response for 11/05:")
        print(json.dumps(data['byDay']['11/05'], indent=2))
        print("\nVolumen Variables:")
        print(f"RetiMeli: {data.get('volumenRetiMeli')}")
        print(f"Andreani: {data.get('volumenAndreani')}")
        print(f"FlotaPropia: {data.get('volumenFlotaPropia')}")
        print(f"Otros: {data.get('volumenOtros')}")
except Exception as e:
    print(f"Error: {e}")
