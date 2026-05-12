
import csv

def calculate_kpis(filename, target_date):
    bultos_b2c = 0
    bultos_b2b = 0
    
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if not row: continue
            if i == 0: continue # Header? Actually movs.csv might not have one or it might.
            
            # Date check
            date_val = row[0].strip()
            if date_val != target_date:
                continue
            
            # isPicking check
            tipo_transaccion = row[13].strip().lower()
            sub_transferencia = row[9].strip().upper()
            
            if tipo_transaccion == 'sales order pick' and sub_transferencia == 'PORTONES':
                try:
                    cantidad = abs(float(row[4].replace(',', '.')))
                except:
                    cantidad = 0
                
                cliente = row[19].strip().upper() if len(row) > 19 else ""
                lpn = row[10].strip().upper() if len(row) > 10 else ""
                
                is_b2c = cliente == 'B2C' or lpn.startswith('B2C')
                is_b2b = cliente == 'B2B' or lpn.startswith('B2B')
                
                if is_b2c:
                    bultos_b2c += cantidad
                elif is_b2b:
                    bultos_b2b += cantidad
                else:
                    # If neither, maybe it's B2C or B2B in another way?
                    # The route.ts logic also checks mov.cliente
                    pass
                    
    return bultos_b2c, bultos_b2b

date = "11-05-2026"
b2c, b2b = calculate_kpis('movs.csv', date)
print(f"Totals for {date} from movs.csv:")
print(f"Pick B2C: {b2c}")
print(f"Pick B2B: {b2b}")

# Also check movs_pl3.csv if it exists
import os
if os.path.exists('movs_pl3.csv'):
    b2c_pl3, b2b_pl3 = calculate_kpis('movs_pl3.csv', date)
    print(f"Totals for {date} from movs_pl3.csv:")
    print(f"Pick B2C: {b2c_pl3}")
    print(f"Pick B2B: {b2b_pl3}")
    print(f"GRAND TOTAL:")
    print(f"Pick B2C: {b2c + b2c_pl3}")
    print(f"Pick B2B: {b2b + b2b_pl3}")
