"""add coordinates and color to pastures

Revision ID: a8f3c2d1b7e4
Revises: f3d1a91dd36e
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "a8f3c2d1b7e4"
down_revision = "f3d1a91dd36e"
branch_labels = None
depends_on = None


def _column_names(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    existing = _column_names("pastures")

    if "coordinates" not in existing:
        op.add_column("pastures", sa.Column("coordinates", sa.JSON(), nullable=True))

    if "color" not in existing:
        op.add_column(
            "pastures",
            sa.Column("color", sa.String(length=20), nullable=True, server_default="#22c55e"),
        )


def downgrade() -> None:
    existing = _column_names("pastures")

    if "color" in existing:
        op.drop_column("pastures", "color")

    if "coordinates" in existing:
        op.drop_column("pastures", "coordinates")
