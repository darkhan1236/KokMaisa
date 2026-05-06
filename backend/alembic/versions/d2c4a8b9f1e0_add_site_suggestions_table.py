"""add site suggestions table

Revision ID: d2c4a8b9f1e0
Revises: a8f3c2d1b7e4
Create Date: 2026-05-06
"""

from alembic import op
import sqlalchemy as sa


revision = "d2c4a8b9f1e0"
down_revision = "a8f3c2d1b7e4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "site_suggestions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=40), nullable=False, server_default="general"),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="new"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_site_suggestions_id"), "site_suggestions", ["id"], unique=False)
    op.create_index(op.f("ix_site_suggestions_email"), "site_suggestions", ["email"], unique=False)
    op.create_index(op.f("ix_site_suggestions_category"), "site_suggestions", ["category"], unique=False)
    op.create_index(op.f("ix_site_suggestions_status"), "site_suggestions", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_site_suggestions_status"), table_name="site_suggestions")
    op.drop_index(op.f("ix_site_suggestions_category"), table_name="site_suggestions")
    op.drop_index(op.f("ix_site_suggestions_email"), table_name="site_suggestions")
    op.drop_index(op.f("ix_site_suggestions_id"), table_name="site_suggestions")
    op.drop_table("site_suggestions")
