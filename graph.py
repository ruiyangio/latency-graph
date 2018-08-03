import csv
import networkx as nx
import community
import matplotlib.pyplot as plt

graph = nx.Graph()
with open("./data.tsv", "r") as data_file:
    data_file = csv.reader(data_file, delimiter='\t')
    for row in data_file:
        if row[0] == "[null]" or row[1] == "[null]":
            continue
        m1 = row[0][0:2]
        m2 = row[1][0:2]
        if m1 == m2:
            continue
        graph.add_edge(m1, m2, weight=int(float(row[2])))

#first compute the best partition
partition = community.best_partition(graph)

#drawing
size = float(len(set(partition.values())))
pos = nx.spring_layout(graph)
count = 0.
for com in set(partition.values()) :
    count = count + 1.
    list_nodes = [nodes for nodes in partition.keys()
                                if partition[nodes] == com]
    nx.draw_networkx_nodes(graph, pos, list_nodes, node_size = 20,
                                node_color = str(count / size))


nx.draw_networkx_edges(graph, pos, alpha=0.5)
plt.show()