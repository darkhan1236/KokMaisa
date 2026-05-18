"""add ai chat sessions

Revision ID: e7a5c2d9b8f1
Revises: d2c4a8b9f1e0
Create Date: 2026-05-17
"""

from alembic import op
import sqlalchemy as sa


revision = "e7a5c2d9b8f1"
down_revision = "d2c4a8b9f1e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_chat_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False, server_default="New chat"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_chat_sessions_id"), "ai_chat_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_ai_chat_sessions_user_id"), "ai_chat_sessions", ["user_id"], unique=False)

    op.create_table(
        "ai_chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["ai_chat_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_chat_messages_id"), "ai_chat_messages", ["id"], unique=False)
    op.create_index(op.f("ix_ai_chat_messages_session_id"), "ai_chat_messages", ["session_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_chat_messages_session_id"), table_name="ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_messages_id"), table_name="ai_chat_messages")
    op.drop_table("ai_chat_messages")
    op.drop_index(op.f("ix_ai_chat_sessions_user_id"), table_name="ai_chat_sessions")
    op.drop_index(op.f("ix_ai_chat_sessions_id"), table_name="ai_chat_sessions")
    op.drop_table("ai_chat_sessions")
