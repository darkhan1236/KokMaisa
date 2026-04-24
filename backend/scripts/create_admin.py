# backend/scripts/create_admin.py
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import SessionLocal
from model.models import User
from core.security import get_password_hash

db = SessionLocal()

admin = User(
    full_name       = "Admin KokMaisa",
    phone           = "+70000000000",
    email           = "admin@kokmaisa.kz",
    hashed_password = get_password_hash("admin123"),  # поменяй пароль!
    account_type    = "admin",
    country         = "Kazakhstan",
    city            = "Astana",
    is_active       = True,
)

db.add(admin)
db.commit()
print(f"✅ Admin created: {admin.email}")
db.close()