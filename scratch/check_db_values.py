import os
from dotenv import load_dotenv
import psycopg2

load_dotenv('.env.local')

def check_db():
    try:
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        cur.execute("SELECT date, bultos_b2c, bultos_b2b FROM evento_kpi_snapshots WHERE date = '2026-05-15'")
        rows = cur.fetchall()
        print("Snapshots for 2026-05-15 in DB:")
        for row in rows:
            print(f"Date: {row[0]}, B2C: {row[1]}, B2B: {row[2]}")
        
        cur.execute("SELECT date, pick_b2c, pick_b2b FROM evento_resultados_finales WHERE date = '2026-05-15'")
        rows = cur.fetchall()
        print("\nResultados Finales for 2026-05-15 in DB:")
        for row in rows:
            print(f"Date: {row[0]}, B2C: {row[1]}, B2B: {row[2]}")
            
    except Exception as e:
        print(f"Error: {e}")

check_db()
