import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__, static_url_path='', static_folder='static')
app.secret_key = os.environ.get("SESSION_SECRET")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    from models import Task
    date_str = request.args.get('date')
    date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else datetime.utcnow().date()
    tasks = Task.query.filter_by(date=date).all()
    return jsonify([{
        'id': task.id,
        'text': task.text,
        'time_start': task.time_start.strftime('%H:%M') if task.time_start else None,
        'time_end': task.time_end.strftime('%H:%M') if task.time_end else None,
        'completed': task.completed,
        'color': task.color,
        'group_id': task.group_id
    } for task in tasks])

@app.route('/api/tasks', methods=['POST'])
def create_task():
    from models import Task
    data = request.json
    task = Task(
        text=data['text'],
        time_start=datetime.strptime(data['time_start'], '%H:%M').time() if data.get('time_start') else None,
        time_end=datetime.strptime(data['time_end'], '%H:%M').time() if data.get('time_end') else None,
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        color=data.get('color'),
        group_id=data.get('group_id')
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({
        'id': task.id,
        'text': task.text,
        'time_start': task.time_start.strftime('%H:%M') if task.time_start else None,
        'time_end': task.time_end.strftime('%H:%M') if task.time_end else None,
        'completed': task.completed,
        'color': task.color,
        'group_id': task.group_id
    })

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    from models import Task
    task = Task.query.get_or_404(task_id)
    data = request.json
    if 'completed' in data:
        task.completed = data['completed']
    if 'color' in data:
        task.color = data['color']
    if 'group_id' in data:
        task.group_id = data['group_id']
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    from models import Task
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/groups', methods=['GET'])
def get_groups():
    from models import TaskGroup
    groups = TaskGroup.query.all()
    return jsonify([{
        'id': group.id,
        'name': group.name,
        'color': group.color
    } for group in groups])

@app.route('/api/groups', methods=['POST'])
def create_group():
    from models import TaskGroup
    data = request.json
    group = TaskGroup(name=data['name'], color=data.get('color', '#2d5a30'))
    db.session.add(group)
    db.session.commit()
    return jsonify({
        'id': group.id,
        'name': group.name,
        'color': group.color
    })

@app.route('/api/groups/<int:group_id>', methods=['PUT'])
def update_group(group_id):
    from models import TaskGroup
    group = TaskGroup.query.get_or_404(group_id)
    data = request.json
    if 'color' in data:
        group.color = data['color']
    if 'name' in data:
        group.name = data['name']
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/groups/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    from models import TaskGroup
    group = TaskGroup.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({'success': True})

with app.app_context():
    import models
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)