import psycopg2
import os

DATABASE_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

def check():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT * FROM evento_kpi_snapshots WHERE date = '2026-05-18'")
        rows = cur.fetchall()
        for row in rows:
            print(f"SNAPSHOT FOUND for 2026-05-18: {row}")
        
        cur.execute("SELECT date, bultos_b2c, bultos_b2b, despachados_bultos FROM evento_kpi_snapshots ORDER BY date DESC LIMIT 10")
        rows = cur.fetchall()
        print("Recent snapshots:")
        for row in rows:
            print(row)
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
