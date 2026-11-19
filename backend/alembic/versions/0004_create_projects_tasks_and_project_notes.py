"""create projects tasks and project notes

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-19 10:17:04.339573

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: projects, tasks, notes, and a real foreign key from chats to projects (decisions A27)."""
    op.create_table('projects',
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), server_default='', nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], name=op.f('fk_projects_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('project_id', name=op.f('pk_projects'))
    )
    op.create_index('uq_projects_user_id_lower_title', 'projects', ['user_id', sa.literal_column('lower(title)')], unique=True)
    op.create_table('project_notes',
    sa.Column('note_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(length=20), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('content', sa.Text(), server_default='', nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("kind IN ('summary', 'decision')", name=op.f('ck_project_notes_kind_valid')),
    sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], name=op.f('fk_project_notes_project_id_projects'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('note_id', name=op.f('pk_project_notes'))
    )
    op.create_index('ix_project_notes_project_id', 'project_notes', ['project_id'], unique=False)
    op.create_table('tasks',
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('project_id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), server_default='', nullable=False),
    sa.Column('status', sa.String(length=20), server_default='todo', nullable=False),
    sa.Column('due_date', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status IN ('todo', 'in_progress', 'done')", name=op.f('ck_tasks_status_valid')),
    sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], name=op.f('fk_tasks_project_id_projects'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('task_id', name=op.f('pk_tasks'))
    )
    op.create_index('ix_tasks_project_id_status', 'tasks', ['project_id', 'status'], unique=False)
    op.create_index('ix_chats_project_id', 'chats', ['project_id'], unique=False)
    op.create_foreign_key(op.f('fk_chats_project_id_projects'), 'chats', 'projects', ['project_id'], ['project_id'], ondelete='CASCADE')


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(op.f('fk_chats_project_id_projects'), 'chats', type_='foreignkey')
    op.drop_index('ix_chats_project_id', table_name='chats')
    op.drop_index('ix_tasks_project_id_status', table_name='tasks')
    op.drop_table('tasks')
    op.drop_index('ix_project_notes_project_id', table_name='project_notes')
    op.drop_table('project_notes')
    op.drop_index('uq_projects_user_id_lower_title', table_name='projects')
    op.drop_table('projects')
