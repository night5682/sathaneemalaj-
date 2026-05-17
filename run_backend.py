import uvicorn
import os

if __name__ == "__main__":
    # Ensure the image directories exist
    os.makedirs("uploads/menus", exist_ok=True)
    
    print("Starting Sathani Mala Python Backend on http://localhost:42091")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=42091, reload=True, reload_dirs=["backend"])
