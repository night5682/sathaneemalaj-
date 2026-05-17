@echo off

cd /d D:\web_pos\sathaneemalaj-

python -m uvicorn backend.main:app --host 0.0.0.0 --port 42091

pause