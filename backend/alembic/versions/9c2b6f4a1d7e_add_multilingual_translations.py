"""add multilingual translations to farms and pastures

Revision ID: 9c2b6f4a1d7e
Revises: e7a5c2d9b8f1
Create Date: 2026-05-27
"""

from alembic import op
import sqlalchemy as sa


revision = "9c2b6f4a1d7e"
down_revision = "e7a5c2d9b8f1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("farms", sa.Column("translations", sa.JSON(), nullable=True))
    op.add_column("pastures", sa.Column("translations", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("pastures", "translations")
    op.drop_column("farms", "translations")
