import urllib.request
import json

try:
    req = urllib.request.Request('http://localhost:3000/api/evento/kpis')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        for day in data.get('availableDays', []):
            d = data['byDay'][day]
            print(f"Day {day}: ingresados={d.get('ingresados')}")
            
except Exception as e:
    print(e)
