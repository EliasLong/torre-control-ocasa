import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

def check_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("--- evento_resultados_finales ---")
        cur.execute("SELECT date, pick_b2c, pick_b2b, source, imported_at FROM evento_resultados_finales ORDER BY date ASC")
        rows = cur.fetchall()
        for row in rows:
            print(f"Date: {row['date']}, B2C: {row['pick_b2c']}, B2B: {row['pick_b2b']}, Source: {row['source']}, Imported: {row['imported_at']}")
            
        print("\n--- evento_kpi_snapshots (last 10) ---")
        cur.execute("SELECT date, bultos_b2c, bultos_b2b FROM evento_kpi_snapshots WHERE date >= '2026-05-11' ORDER BY date ASC LIMIT 10")
        snaps = cur.fetchall()
        for snap in snaps:
            print(f"Date: {snap['date']}, Snap B2C: {snap['bultos_b2c']}, Snap B2B: {snap['bultos_b2b']}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
