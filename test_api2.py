import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request('http://localhost:3000/api/evento/kpis')
    with urllib.request.urlopen(req) as response:
        print("Success")
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
except Exception as e:
    print(e)
