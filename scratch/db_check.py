
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

def check_snapshots():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT * FROM evento_kpi_snapshots WHERE date = '2026-05-11'")
        rows = cur.fetchall()
        
        colnames = [desc[0] for desc in cur.description]
        print(f"Column Names: {colnames}")
        
        if not rows:
            print("No snapshot found for 2026-05-11")
        else:
            for row in rows:
                print(dict(zip(colnames, row)))
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

check_snapshots()
