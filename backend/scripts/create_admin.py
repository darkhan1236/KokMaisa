# backend/scripts/create_admin.py
import sys, os
from getpass import getpass
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import SessionLocal
from model.models import User
from core.security import get_password_hash

db = SessionLocal()

email = os.getenv("ADMIN_EMAIL", "admin@kokmaisa.kz")
password = os.getenv("ADMIN_PASSWORD") or getpass("Admin password: ")
if len(password) < 12:
    raise SystemExit("Admin password must be at least 12 characters")
if password.lower() in {"admin123", "password", "password123", "changeme"}:
    raise SystemExit("Admin password is too weak")
if db.query(User).filter(User.email == email).first():
    raise SystemExit(f"Admin already exists: {email}")

admin = User(
    full_name       = "Admin KokMaisa",
    phone           = "+70000000000",
    email           = email,
    hashed_password = get_password_hash(password),
    account_type    = "admin",
    country         = "Kazakhstan",
    city            = "Astana",
    is_active       = True,
)

db.add(admin)
db.commit()
print(f"✅ Admin created: {admin.email}")
db.close()
