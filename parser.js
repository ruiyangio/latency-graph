const fs = require('fs'); 
const parse = require('csv-parse');
const SCALE = 6;
const THRES = 20;

function takeDCPrefix(s) {
    return s.substring(0, 2);
}

function avg(a) {
    return parseInt(a.reduce((p, e) => p + e, 0) / a.length);
}

function findGroupId(machine, groups) {
    for (let i = 0; i < groups.length; i++) {
        if (groups[i].nodes[machine]) {
            return groups[i].id;
        }
    }
}

const nodes = {};
let edges = {};
let groupCounts = 1;

fs.createReadStream('./resources/PingMeshFull.tsv')
.pipe(parse({delimiter: '\t'}))
.on('data', tsvrow => {
    let dc1 = tsvrow[0];
    let dc2 = tsvrow[1];
    const latency = parseInt(tsvrow[2]);

    if (dc1 === '[null]' || dc2 === '[null]') return;

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
    const groups = [];
    
    Object.keys(edges).forEach(source => {
        Object.keys(edges[source]).forEach(target => {
            const weight = avg(edges[source][target]);
            if (weight < THRES) {
                let hasGroup = false;
                groups.forEach(group => {
                    if (group.nodes[source] || group.nodes[target]) {
                        group.nodes[source] = true;
                        group.nodes[target] = true;
                        hasGroup = true;
                    }
                });

                if (!hasGroup) {
                    const newGroup = { nodes: {}, id: groupCounts };
                    newGroup.nodes[source] = true;
                    newGroup.nodes[target] = true;
                    groups.push(newGroup);
                    groupCounts++;
                }
            }
        });
    });

    const groupEdges = {};
    Object.keys(edges).forEach(source => {
        Object.keys(edges[source]).forEach(target => {
            let sourceGroupId = findGroupId(source, groups);
            let targetGroupId = findGroupId(target, groups);
            if (!sourceGroupId || !targetGroupId) return;
            if (sourceGroupId === targetGroupId) return;
            if (sourceGroupId > targetGroupId) {
                [sourceGroupId, targetGroupId] = [targetGroupId, sourceGroupId];
            }

            if (!groupEdges[sourceGroupId]) {
                groupEdges[sourceGroupId] = {};
            }
            if (!groupEdges[sourceGroupId][targetGroupId]) {
                groupEdges[sourceGroupId][targetGroupId] = [];
            }
            groupEdges[sourceGroupId][targetGroupId].push(avg(edges[source][target]));
        });
    });

    Object.keys(groupEdges).forEach(source => {
        Object.keys(groupEdges[source]).forEach(target => {
            const weight = avg(groupEdges[source][target]);
            edgeList.push({
                from: source,
                to: target,
                length: weight * SCALE,
                smooth: { enabled: false },
                label: weight.toString()
            });
        });
    });

    const nodeList = groups.map(group => {
        return {
            id: group.id.toString(),
            label: Object.keys(group.nodes).join(',')
        };
    });

    fs.writeFileSync('./edges.js', `const edgeList = ${JSON.stringify(edgeList)}`);
    fs.writeFileSync('./nodes.js', `const nodeList = ${JSON.stringify(nodeList)}`);
});
