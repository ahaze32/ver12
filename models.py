from datetime import datetime
from app import db

class TaskGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(7), default="#2d5a30")  # HEX color code
    tasks = db.relationship('Task', backref='group', lazy=True)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    time_start = db.Column(db.Time)
    time_end = db.Column(db.Time)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    completed = db.Column(db.Boolean, default=False)
    group_id = db.Column(db.Integer, db.ForeignKey('task_group.id'))