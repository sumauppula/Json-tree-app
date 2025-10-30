let nodeId = 1;

export function jsonToFlow(json) {
  nodeId = 1;
  const nodes = [];
  const edges = [];
  const nodeWidth = 220; // Increased width for better text visibility
  const nodeHeight = 90; // Increased height for better text visibility
  const horizontalSpacing = 60; // Increased spacing for better layout
  const verticalSpacing = 180; // Increased vertical spacing for taller tree

  const getId = () => `node_${nodeId++}`;

  const computeSubtreeWidth = (value) => {
    if (typeof value !== "object" || value === null) return nodeWidth;
    const entries = Array.isArray(value)
      ? value.map((v, i) => [i, v])
      : Object.entries(value);
    if (entries.length === 0) return nodeWidth;

    let totalWidth = 0;
    for (const [, childVal] of entries) {
      totalWidth += computeSubtreeWidth(childVal);
    }
    return Math.max(totalWidth + (entries.length - 1) * horizontalSpacing, nodeWidth);
  };

  const traverse = (key, value, parent = null, depth = 0, xOffset = 0, path = "$") => {
    const id = getId();
    
    let currentPath;
    if (key === "root") {
      currentPath = "$";
    } else if (Array.isArray(parent?.data?.value)) {
      currentPath = `${path}[${key}]`;
    } else {
      currentPath = `${path}.${key}`;
    }

    let label;
    let nodeColor;
    let type;
    let borderColor;
    let textColor = "#ffffff"; // White text for better contrast

    if (Array.isArray(value)) {
      type = 'array';
      // Simplified label - only key and [] with count
      label = key !== "root" ? `${key}\n[${value.length}]` : `Root\n[${value.length}]`;
      nodeColor = "#1e8a5e"; // Darker green for better contrast
      borderColor = "#0d6e47";
    } else if (typeof value === "object" && value !== null) {
      type = 'object';
      const keyCount = Object.keys(value).length;
      // Simplified label - only key and {} with count
      label = key !== "root" ? `${key}\n{${keyCount}}` : `Root\n{${keyCount}}`;
      nodeColor = "#2c5aa0"; // Darker blue for better contrast
      borderColor = "#1a4785";
    } else {
      type = 'primitive';
      const displayValue = String(value);
      // Better text formatting for primitives
      if (displayValue.length > 15) {
        label = `${key}:\n${displayValue.substring(0, 15)}...`;
      } else {
        label = `${key}:\n${displayValue}`;
      }
      nodeColor = "#b07c32"; // Darker orange for better contrast
      borderColor = "#8e6126";
    }

    const node = {
      id,
      type: type,
      data: { 
        label, 
        value, 
        path: currentPath,
        type,
        fullValue: value
      },
      position: { x: xOffset, y: depth * verticalSpacing },
      style: {
        border: `3px solid ${borderColor}`,
        borderRadius: "10px",
        padding: "18px 15px", // Increased padding
        backgroundColor: nodeColor,
        color: textColor,
        fontSize: "22px", // Optimal font size for readability
        fontWeight: 600, // Better weight for clarity
        width: nodeWidth,
        height: nodeHeight,
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        wordWrap: "break-word",
        overflow: "hidden",
        lineHeight: "1.5", // Better line spacing
        boxShadow: "0 6px 12px rgba(0,0,0,0.3)", // Enhanced shadow for depth
        whiteSpace: "pre-line",
        fontFamily: "'Segoe UI', 'Arial', sans-serif", // Better font stack
        cursor: "pointer",
        textShadow: "1px 1px 2px rgba(0,0,0,0.5)", // Text shadow for better readability
      },
    };

    nodes.push(node);

    if (parent) {
      edges.push({
        id: `e_${parent.id}_${id}`,
        source: parent.id,
        target: id,
        type: "smoothstep",
        style: { 
          stroke: "#2d3748", 
          strokeWidth: 3, // Thicker edges for better visibility
        },
        animated: false,
      });
    }

    if (typeof value === "object" && value !== null) {
      const entries = Array.isArray(value)
        ? value.map((v, i) => [i, v])
        : Object.entries(value);

      if (entries.length > 0) {
        const childWidths = entries.map(([_, childVal]) => computeSubtreeWidth(childVal));
        const totalWidth = childWidths.reduce((a, b) => a + b, 0) + (entries.length - 1) * horizontalSpacing;
        let startX = xOffset - totalWidth / 2;

        entries.forEach(([childKey, childVal], i) => {
          const childWidth = childWidths[i];
          traverse(
            String(childKey),
            childVal,
            node,
            depth + 1,
            startX + childWidth / 2,
            currentPath
          );
          startX += childWidth + horizontalSpacing;
        });
      }
    }
  };

  const startX = 0;
  traverse("root", json, null, 0, startX, "$");
  
  return { nodes, edges };
}