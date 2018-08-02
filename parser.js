const fs = require('fs'); 
const parse = require('csv-parse');
const SCALE = 4;

const nodes = {};
let edges = {};

function takeDCPrefix(s) {
    return s.substring(0, 2);
}

function avg(a) {
    return parseInt(a.reduce((p, e) => p + e, 0) / a.length);
}

fs.createReadStream('./PingMeshFull.tsv')
.pipe(parse({delimiter: '\t'}))
.on('data', tsvrow => {
    let dc1 = tsvrow[0];
    let dc2 = tsvrow[1];
    const latency = parseInt(tsvrow[2]);

    if (dc1 === '[null]' || dc2 === '[null]') return;
    // if (latency > 30) return;

    dc1 = takeDCPrefix(dc1);
    dc2 = takeDCPrefix(dc2);
    if (dc1 === dc2) return;

    if (!nodes[dc1]) {
        nodes[dc1] = { id: dc1, label: dc1 };
    }
    
    if (!nodes[dc2]) {
        nodes[dc2] = { id: dc2, label: dc2 };
    }
    
    if (dc1 > dc2) {
        [dc1, dc2] = [dc2, dc1];
    }

    if (!edges[dc1]) {
        edges[dc1] = {};
    }

    if (!edges[dc1][dc2]) {
        edges[dc1][dc2] = [];
    }

    edges[dc1][dc2].push(latency);
})
.on('end', () => {
    const edgeList = [];
    Object.keys(edges).forEach(source => {
        Object.keys(edges[source]).forEach(target => {
            const weight = avg(edges[source][target]);
            edgeList.push({
                from: source,
                to: target,
                length: weight * SCALE,
                smooth: { enabled: false },
                label: weight.toString()
            });
        });
    });

    const nodeList = Object.keys(nodes).map(machine => nodes[machine]);

    fs.writeFileSync('./edges.js', `const edgeList = ${JSON.stringify(edgeList)}`);
    fs.writeFileSync('./nodes.js', `const nodeList = ${JSON.stringify(nodeList)}`);
});
