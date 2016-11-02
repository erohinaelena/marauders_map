import networkx as nx
import json

location = 'au_graph.gexf'

def get_path_json(G, node1, node2):
	result = {}
	path = nx.shortest_path(G, node1, node2)
	result['path'] = path

	for node in path:
		result[node] = G.node[node]	
	return json.dumps(result)


G = nx.read_gexf(location)
#print json.dumps(nx.shortest_path(G, '1', '2'))

print get_path_json(G, '105', '0')
