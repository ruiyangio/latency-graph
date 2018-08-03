import csv
import random
import numpy as np
import string

nodes = []
for i in range(120):
    nodes.append(''.join((random.choice(string.ascii_uppercase), random.choice(string.ascii_uppercase), random.choice(string.digits))))

edges = []
for i in range(15000):
    edges.append( random.choice(nodes) + "\t" + random.choice(nodes) + "\t" + str(np.random.uniform(400)) + "\n" )

with open('data.tsv', 'w') as file:
    for edge in edges:
        file.write(edge)