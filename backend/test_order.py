import requests
import json

base_url = "http://localhost:8000"

def test_place_order():
    url = f"{base_url}/api/orders.php"
    payload = {
        "table_number": "99",
        "items": [
            {
                "id": 1,
                "name": "Test Item",
                "price": 50.0,
                "qty": 2
            }
        ]
    }
    
    print(f"Placing first order for table 99...")
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print(f"\nPlacing second order for table 99 (should merge)...")
        response2 = requests.post(url, json=payload)
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.text}")

if __name__ == "__main__":
    try:
        test_place_order()
    except Exception as e:
        print(f"Request failed: {e}")
