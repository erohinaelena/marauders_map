from flask import render_template
from app import app
from forms import LoginForm
import networkx as nx
import json

@app.route('/')
@app.route('/index')
def index():
    user = { 'nickname': 'Miguel' } 
    return render_template("index.html",
                  title = 'Home',
                  user = user)

@app.route('/login', methods = ['GET', 'POST'])
def login():
    form = LoginForm()
    return render_template('login.html', 
        title = 'Sign In',
        form = form)

@app.route('/graph/<node1>/<node2>')
def get_path_json(node1,node2):
        location = 'app/static/au_graph.gexf'
        G = nx.read_gexf(location)
	result = {}
	path = nx.shortest_path(G, node1, node2, weight='weight')
	result['path'] = path

	for node in path:
		result[node] = G.node[node]	
	return json.dumps(result)
