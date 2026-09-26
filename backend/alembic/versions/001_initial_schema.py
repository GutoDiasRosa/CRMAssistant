"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "usuario",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("perfil", sa.String(32), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_usuario_email", "usuario", ["email"], unique=True)

    op.create_table(
        "leads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rd_lead_id", sa.String(128), nullable=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=True),
        sa.Column("nome", sa.String(512), nullable=False, server_default=""),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("telefone", sa.String(64), nullable=True),
        sa.Column("status", sa.String(128), nullable=True),
        sa.Column("dados_extras", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_leads_rd_lead_id", "leads", ["rd_lead_id"], unique=True)

    op.create_table(
        "oportunidade",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("rd_deal_id", sa.String(128), nullable=True),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=True),
        sa.Column("nome", sa.String(512), nullable=False, server_default=""),
        sa.Column("etapa_funil", sa.String(255), nullable=True),
        sa.Column("valor", sa.Numeric(14, 2), nullable=True),
        sa.Column("status", sa.String(128), nullable=True),
        sa.Column("dados_extras", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_oportunidade_rd_deal_id", "oportunidade", ["rd_deal_id"], unique=True)
    op.create_index("ix_oportunidade_etapa_funil", "oportunidade", ["etapa_funil"])

    op.create_table(
        "interacao",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("oportunidade_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("oportunidade.id"), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=True),
        sa.Column("tipo", sa.String(64), nullable=False, server_default="nota"),
        sa.Column("descricao", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_interacao_oportunidade_id", "interacao", ["oportunidade_id"])

    op.create_table(
        "conversa_chatbot",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("titulo", sa.String(512), nullable=True),
        sa.Column("sumario", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_conversa_usuario", "conversa_chatbot", ["usuario_id"])

    op.create_table(
        "mensagem",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversa_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("conversa_chatbot.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("papel", sa.String(32), nullable=False, server_default="user"),
        sa.Column("conteudo", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_mensagem_conversa_id", "mensagem", ["conversa_id"])

    op.create_table(
        "relatorio",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuario.id"), nullable=False),
        sa.Column("tipo", sa.String(128), nullable=False),
        sa.Column("parametros", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("resultado", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_relatorio_usuario", "relatorio", ["usuario_id"])

    op.create_table(
        "sincronizacao",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("fonte", sa.String(64), nullable=False),
        sa.Column("event_type", sa.String(128), nullable=True),
        sa.Column("rd_entity_id", sa.String(128), nullable=True),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("detalhe", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_sinc_fonte", "sincronizacao", ["fonte"])
    op.create_index("ix_sinc_rd_entity", "sincronizacao", ["rd_entity_id"])

    op.create_table(
        "rd_station_token",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("rd_station_token")
    op.drop_table("sincronizacao")
    op.drop_table("relatorio")
    op.drop_table("mensagem")
    op.drop_table("conversa_chatbot")
    op.drop_table("interacao")
    op.drop_table("oportunidade")
    op.drop_table("leads")
    op.drop_table("usuario")
