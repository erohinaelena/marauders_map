from time import strftime

from flask import flash
from flask import render_template, flash, redirect, session, url_for, request, g
from app import app
import datetime
from flask_login import LoginManager
from flask_login import UserMixin
from flask_login import current_user
from wtforms import validators
from wtforms.validators import Required
from flask_wtf import Form
import networkx as nx
import json
import flask_login
from wtforms import StringField

from flask import Flask, Response, redirect, url_for, request, session, abort
from flask_login import LoginManager, UserMixin, \
    login_required, login_user, logout_user

# flask-login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

users = {}
location = 'app/static/au_graph.gexf'
G = nx.read_gexf(location)
tmp = nx.get_node_attributes(G, 'no_room')
rooms_map = {v: k for k, v in tmp.iteritems()}
rooms_map[777] = '16'

def load_users():
    from os import listdir
    from os.path import isfile, join
    onlyfiles = [('app/users/' + f) for f in listdir('app/users/') if isfile(join('app/users/', f))]
    print onlyfiles
    for f in onlyfiles:
        if (f.split('.')[0] != 'app/users/None' and f.split('.')[0] != 'app/users/'):
            with open(f, 'r') as cur_user:
                for line in cur_user:
                    params = line.split()
                    print params
                    users[params[0]] = {'name': params[0], 'no_room': int(params[2]), 'group': int(params[1]), 'hours': params[3], 'minutes': params[4]}



class LoginForm(Form):
    username = StringField('Login:', [validators.DataRequired()])
    group = StringField('Group:', [validators.AnyOf(values=['504', '503', '603'], message='There is no such group in AU.')])
    location = StringField('Where are you?', [validators.DataRequired()])

    def __init__(self, *args, **kwargs):
        kwargs['csrf_enabled'] = False
        Form.__init__(self, *args, **kwargs)


class User(UserMixin):
    def __init__(self, username, group, location):
        self.username = username
        self.group = group
        self.location = location
        self.hour = str(datetime.datetime.now().hour)
        self.minutes = str(datetime.datetime.now().minute)
        with open('app/users/' + str(username) + '.txt', 'w') as info:
            info.write(str(username) + ' ' + str(group) + ' ' + str(location) + ' ' + self.hour + ' ' + self.minutes)
            info.close()


@app.before_request
def before_request():
    g.user = current_user


@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    # print load_users()
    # if g.user is not None and g.user.is_authenticated():
    #     return redirect(url_for("index"))
    form = LoginForm()
    if form.validate_on_submit():
        location = form.location.data
        if location not in rooms_map.keys():
            location = 777
        user = User(form.username.data, form.group.data, location)
        return redirect(url_for("index"))
    return render_template('login.html', form=form)


# some protected url

@app.route('/index')
def index():
    return render_template("base.html",
                           title='Home')


# somewhere to logout
@app.route("/logout")
@login_required
def logout():
    logout_user()
    return Response('<p>Logged out</p>')


# handle login failed
@app.errorhandler(401)
def page_not_found(e):
    return Response('<p>Login failed</p>')


def check_valid_users():
    for user in users.keys():
        current_hours = datetime.datetime.now().hour
        current_minutes = datetime.datetime.now().minute
        print('CURRENT TIME', current_hours, current_minutes)
        print ('USERS LAST LOGIN', users[user]['hours'], users[user]['minutes'])
        tdelta = (int(current_hours)*60 + int(current_minutes) - int(users[user]['hours']) * 60 - int(users[user]['minutes']))
        print ('DIFF', tdelta)
        if tdelta >= 90:
            del users[user]



@app.route('/who_is_online')
def who_is_online():
    load_users()
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


def get_path(G, node1, node2):
    result = {}
    path = nx.shortest_path(G, node1, node2)
    result['path'] = path

    path2, path4, path5 = [[x for x in path if get_floor_by_id(x) == i] for i in (2, 4, 5)]
    result['path2'] = path2
    result['path4'] = path4
    result['path5'] = path5

    for node in path:
        result[node] = G.node[node]
    return result


@app.route('/graph/<node1>/<node2>')
def get_path_json(node1, node2):
    return json.dumps(get_path(G, node1, node2))

# print G.nodes()

# tmp = nx.get_node_attributes(G,'no_room')

# print json.dumps(dict((v,k) for k,v in tmp.iteritems()))
