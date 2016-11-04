import datetime
import json
import os

import networkx as nx
from flask import Response, redirect, url_for
from flask import render_template, g
from flask_login import LoginManager, \
    login_required, login_user, logout_user
from flask_login import current_user
from forms import LoginForm
from models import User

from app import app

users = {}
location = 'app/static/au_graph.gexf'
G = nx.read_gexf(location)
tmp = nx.get_node_attributes(G, 'no_room')
rooms_map = {v: k for k, v in tmp.iteritems()}
rooms_map[777] = '16'

# flask-login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"


@login_manager.user_loader
def load_user(id):
    with open('app/users/' + id + '.txt', 'r') as user:
        for line in user:
            params = line.split()
            return User(params[0], params[1], params[2])


def load_users():
    from os import listdir
    from os.path import isfile, join
    onlyfiles = [('app/users/' + f) for f in listdir('app/users/') if isfile(join('app/users/', f))]
    print onlyfiles
    for f in onlyfiles:
        if f.split('.')[0] != 'app/users/None' and f.split('.')[0] != 'app/users/':
            with open(f, 'r') as cur_user:
                for line in cur_user:
                    params = line.split()
                    print params
                    users[params[0]] = {'name': params[0], 'no_room': int(params[2]), 'group': int(params[1]),
                                        'hours': params[3], 'minutes': params[4]}


@app.before_request
def before_request():
    g.user = current_user


@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    print g.user
    if g.user is not None and g.user.is_authenticated:
        return redirect(url_for("index"))
    form = LoginForm()
    if form.validate_on_submit():
        location = form.location.data
        if location not in rooms_map.keys():
            location = 777
        user = User(form.username.data, form.group.data, location)
        users[form.username.data] = {'name': user.username, 'no_room': user.location, 'group': user.group,
                                     'hours': user.hour, 'minutes': user.minutes}
        login_user(user)
        print g.user
        return redirect(url_for("index"))
    return render_template('login.html', form=form)


# some protected url

@app.route('/index')
@login_required
def index():
    return render_template("base.html",
                           title='Home')


# somewhere to logout
@app.route("/logout")
@login_required
def logout():
    print g.user.username
    os.remove('app/users/' + g.user.username + '.txt')
    logout_user()
    return redirect(url_for("login"))


# handle login failed
@app.errorhandler(401)
def page_not_found(e):
    return Response('<p>Login failed</p>')


def check_valid_users():
    for user in users.keys():
        current_hours = datetime.datetime.now().hour
        current_minutes = datetime.datetime.now().minute
        print('CURRENT TIME', current_hours, current_minutes)
        print ('USER\'S LAST LOGIN', users[user]['hours'], users[user]['minutes'])
        tdelta = (
            int(current_hours) * 60 + int(current_minutes) - int(users[user]['hours']) * 60 - int(
                users[user]['minutes']))
        print ('DIFF', tdelta)
        if tdelta >= 90:
            del users[user]
            os.remove('app/users/' + user + '.txt')


@app.route('/who_is_online')
def who_is_online():
    check_valid_users()
    print ('ROOMS MAP', rooms_map)
    response = []
    for u in users.keys():
        user_room_id = rooms_map[users[u]['no_room']]
        response.append({'name': u, 'x': G.node[user_room_id]['x'], 'y': G.node[user_room_id]['y']})
    return json.dumps(response)


def get_floor_by_id(node):
    node = int(node)
    if node <= 111:
        return 4
    elif str(node)[:1] == '2':
        return 2
    else:
        return 5


def get_path(node1, node2):
    result = {}
    path = nx.shortest_path(G, node1, node2, weight='weight')
    result['path'] = path

    path2, path4, path5 = [[x for x in path if get_floor_by_id(x) == i] for i in (2, 4, 5)]
    result['path2'] = path2
    result['path4'] = path4
    result['path5'] = path5

    for node in path:
        result[node] = G.node[node]
    return result


@app.route('/check_in/<node1>', methods=['GET', 'POST'])
def check_in(node1):
    print ("User ", g.user.username, " wants to change location to ", node1)
    users[g.user.username]['no_room'] = int(node1)
    new_hour = str(datetime.datetime.now().hour)
    new_minutes = str(datetime.datetime.now().minute)
    users[g.user.username]['hours'] = new_hour
    users[g.user.username]['minutes'] = new_minutes
    with open('app/users/' + g.user.username + '.txt', 'w') as cur_user:
        cur_user.write(str(g.user.username) + ' ' + str(g.user.group) + ' ' + str(
            g.user.location) + ' ' + g.user.hour + ' ' + g.user.minutes)
    return redirect(url_for("index"))


@app.route('/whoami')
def who_am_i():
    return json.dumps(users[g.user.username])

@app.route('/graph/<node1>/<node2>')
def get_path_json(node1, node2):
    return json.dumps(get_path(node1, node2))


@app.route('/graph/<node1>/wc_m')
def find_wc_m(node1):
    wc_m = ['5061', '15', '2123']
    path = [nx.shortest_path_length(G, node1, x, weight='weight') for x in wc_m]
    return get_path_json(node1, wc_m[path.index(min(path))])


@app.route('/graph/<node1>/wc_f')
def find_wc_f(node1):
    wc_f = ['5015', '61', '2126']
    path = [nx.shortest_path_length(G, node1, x, weight='weight') for x in wc_f]
    return get_path_json(node1, wc_f[path.index(min(path))])


@app.route('/graph/<node1>/living_room')
def find_living_room(node1):
    liv_room = ['5065', '60', '65']
    path = [nx.shortest_path_length(G, node1, x, weight='weight') for x in liv_room]
    return get_path_json(node1, liv_room[path.index(min(path))])


@app.route('/graph/<node1>/to_AD')
def find_academic_department(node1):
    return redirect(url_for('get_path_json', node1=node1, node2=67))
