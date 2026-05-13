import psycopg2
DATABASE_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres"

def get_schema():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'evento_resultados_finales';
        """)
        cols = cur.fetchall()
        print("Table: evento_resultados_finales")
        for col in cols:
            print(f"  {col[0]}: {col[1]}")
            
        cur.execute("SELECT count(*) FROM evento_resultados_finales;")
        count = cur.fetchone()[0]
        print(f"\nTotal rows: {count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_schema()
