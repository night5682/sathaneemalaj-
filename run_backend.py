import uvicorn
import os

if __name__ == "__main__":
    # Ensure the image directories exist
    os.makedirs("public/assets/img/menus", exist_ok=True)
    
    print("Starting Sathani Mala Python Backend on http://localhost:8000")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
