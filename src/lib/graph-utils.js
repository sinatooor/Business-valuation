// src/lib/graph-utils.js

export const getConnectedElements = (nodeId, nodes, edges) => {
  const connectedNodes = new Set();
  const connectedEdges = new Set();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Find all ancestors
  const findAncestors = (id) => {
    if (connectedNodes.has(id)) return;
    connectedNodes.add(id);
    const incomingEdges = edges.filter(e => e.target === id);
    for (const edge of incomingEdges) {
      connectedEdges.add(edge.id);
      findAncestors(edge.source);
    }
  };

  // Find all descendants
  const findDescendants = (id) => {
    if (connectedNodes.has(id)) return;
    connectedNodes.add(id);
    const outgoingEdges = edges.filter(e => e.source === id);
    for (const edge of outgoingEdges) {
      connectedEdges.add(edge.id);
      findDescendants(edge.target);
    }
  };

  const startNode = nodeMap.get(nodeId);
  if (startNode) {
      // For a model node, we only want its ancestors
      findAncestors(startNode.id);
  }

  return { connectedNodes, connectedEdges };
};