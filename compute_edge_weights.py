from math import sqrt

import networkx as nx
import json

from networkx.readwrite.gexf import GEXFWriter

filename = 'au_graph.gexf'

G = nx.read_gexf(filename)


def compute_weight(inp, outp):
    print(G.node[str(inp)])
    return sqrt(
        (G.node[str(inp)]['x'] - G.node[str(outp)]['x']) ** 2 + (G.node[str(inp)]['y'] - G.node[str(outp)]['y']) ** 2)

# print('Nodes length ', len(G.nodes()))
#
# for node in G.nodes(data=True):
#     print(node)


for edge in G.edges_iter():
    print(edge)
    if (int(edge[0]) > int(edge[1])):
        inp = edge[1]
        outp = edge[0]
    else:
        inp = edge[0]
        outp = edge[1]
    print(inp, outp)
    G[edge[0]][edge[1]]['weight'] = compute_weight(inp, outp)


writer = GEXFWriter(encoding='utf-8')
writer.add_graph(G)
writer.write('updated_au_graph.gexf')