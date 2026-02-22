
import json
import os
from datetime import datetime

class BuildingDevelopmentsForensics:
    """
    Enterprise Python Auditor for Building Developments & Technologies Ledger System.
    Analyzes project profitability and detects fiscal anomalies.
    """
    
    def __init__(self, data_path='ledger_store.json'):
        self.data_path = data_path
        self.ledger = self.load_data()

    def load_data(self):
        if not os.path.exists(self.data_path):
            return None
        with open(self.data_path, 'r') as f:
            return json.load(f)

    def run_audit(self):
        if not self.ledger:
            print("[!] No data found to audit.")
            return

        print(f"--- BUILDING DEVELOPMENTS & TECHNOLOGIES ENTERPRISE AUDIT: {datetime.now()} ---")
        
        transactions = self.ledger.get('transactions', [])
        projects = self.ledger.get('projects', [])
        
        for project in projects:
            p_id = project['id']
            p_name = project['name']
            markup = project.get('serviceMarkup', 0)
            
            p_tx = [t for t in transactions if t['projectId'] == p_id]
            income = sum(float(t['amount']) for t in p_tx if t['type'] == 'deposit')
            expenses = sum(float(t['amount']) for t in p_tx if t['type'] == 'expense')
            
            # Calculate enterprise profit margin
            real_cost = expenses * (1 + (markup / 100))
            profit = income - real_cost
            
            print(f"\nProject: {p_name}")
            print(f" > Total Deposits: ${income:,.2f}")
            print(f" > Raw Expenses:  ${expenses:,.2f}")
            print(f" > Service Fee:    {markup}%")
            print(f" > Net Treasury:   ${profit:,.2f}")
            
            if profit < 0:
                print(f" [ALERT] Deficit detected in project node: {p_id}")

        print("\n--- AUDIT COMPLETE ---")

if __name__ == "__main__":
    auditor = BuildingDevelopmentsForensics()
    auditor.run_audit()
