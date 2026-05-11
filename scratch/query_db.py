import psycopg2

DB_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

try:
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT * FROM evento_kpi_snapshots ORDER BY date DESC LIMIT 5;")
    rows = cur.fetchall()
    
    # Get column names
    colnames = [desc[0] for desc in cur.description]
    
    print(f"Found {len(rows)} rows.")
    for row in rows:
        row_dict = dict(zip(colnames, row))
        print(f"Date: {row_dict['date']}, Ingresados: {row_dict['ingresados']}, Ingresados_Flota: {row_dict['ingresados_flota']}")

    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
