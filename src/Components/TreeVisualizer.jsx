import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { JSONPath } from "jsonpath-plus";
import { jsonToFlow } from "../Utils/jsonToNodes";
import SearchBar from "../Components/SearchBar";
import { toPng } from "html-to-image";

function TreeVisualizer({ jsonData, onJsonDataChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [message, setMessage] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [copyNotification, setCopyNotification] = useState("");
  const [currentSearchPath, setCurrentSearchPath] = useState("");
  const { fitView, setViewport, getNode } = useReactFlow();
  const reactFlowWrapper = useRef(null);

  const nodeTypes = useMemo(() => ({}), []);
  const edgeTypes = useMemo(() => ({}), []);

  // Generating tree
  useEffect(() => {
    if (jsonData) {
      try {
        const { nodes, edges } = jsonToFlow(jsonData);
        setNodes(nodes);
        setEdges(edges);
        setMessage("");
        setCurrentSearchPath("");

        setTimeout(() => {
          fitView({
            padding: 0.2,
            duration: 800,
            minZoom: 0.1,
            maxZoom: 2,
          });
        }, 100);
      } catch (error) {
        setMessage("❌ Invalid JSON structure");
      }
    } else {
      setNodes([]);
      setEdges([]);
      setMessage("");
      setCurrentSearchPath("");
    }
  }, [jsonData, fitView, setNodes, setEdges]);

  // Copy path function
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch (fallbackErr) {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }, []);

  const onNodeClick = useCallback(
    async (event, node) => {
      const path = node.data.path;
      const success = await copyToClipboard(path);

      if (success) {
        setCopyNotification(`✅ Copied: ${path}`);
        setTimeout(() => setCopyNotification(""), 2000);
      } else {
        setCopyNotification("❌ Failed to copy path");
        setTimeout(() => setCopyNotification(""), 2000);
      }
    },
    [copyToClipboard]
  );

  // Reset all nodes & to fit view
  const resetView = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          border: `3px solid ${n.style.borderColor || "#999"}`,
          boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
        },
      }))
    );

    setTimeout(() => {
      fitView({
        padding: 0.2,
        duration: 600,
        minZoom: 0.1,
        maxZoom: 2,
      });
    }, 100);
  }, [setNodes, fitView]);

  // Search function
  const handleSearch = useCallback(
    (path) => {
      if (!jsonData) {
        setMessage("❌ No JSON data available");
        return;
      }

      if (!path.trim()) {
        setCurrentSearchPath("");
        setMessage("");
        resetView();
        return;
      }

      try {
        const normalizedPath = path.trim().startsWith("$")
          ? path.trim()
          : `$.${path.trim()}`;
        const result = JSONPath({ path: normalizedPath, json: jsonData });

        if (!result.length) {
          setMessage("❌ No match found!");
          setCurrentSearchPath("");
          resetView();
          return;
        }

        const matchedValue = result[0];
        let foundNode = null;
        setNodes((nds) =>
          nds.map((node) => {
            const isMatch = node.data.path === normalizedPath;
            if (isMatch) foundNode = node;
            return isMatch
              ? {
                  ...node,
                  style: {
                    ...node.style,
                    border: "4px solid #ff4444",
                    boxShadow: "0 0 12px rgba(255, 68, 68, 0.8)",
                  },
                }
              : {
                  ...node,
                  style: {
                    ...node.style,
                    border: `3px solid ${node.style.borderColor || "#999"}`,
                    boxShadow: "0 3px 6px rgba(0,0,0,0.16)",
                  },
                };
          })
        );

        if (foundNode) {
          setMessage(`✅ Match found! Path: ${normalizedPath}`);
          setCurrentSearchPath(normalizedPath);
          setTimeout(() => {
            setViewport(
              {
                x:
                  -foundNode.position.x +
                  reactFlowWrapper.current.clientWidth / 2,
                y:
                  -foundNode.position.y +
                  reactFlowWrapper.current.clientHeight / 2,
                zoom: 1,
              },
              { duration: 600 }
            );
          }, 100);
        } else {
          setMessage("❌ Path exists but node not found in visualization");
          setCurrentSearchPath("");
          resetView();
        }
      } catch (error) {
        setMessage("⚠️ Invalid JSONPath syntax!");
        console.error("JSONPath error:", error);
        setCurrentSearchPath("");
        resetView();
      }
    },
    [jsonData, setNodes, setViewport, resetView]
  );

  const onNodeMouseEnter = useCallback((event, node) => {
    setHoverInfo({
      path: node.data.path,
      value: JSON.stringify(node.data.value, null, 2),
      type: node.data.type,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // Download tree as image
  const downloadTreeAsImage = useCallback(async () => {
    if (!reactFlowWrapper.current || nodes.length === 0) {
      setMessage("❌ No tree to download");
      return;
    }

    try {
      setMessage("⏳ Generating image...");
      const flowElement =
        reactFlowWrapper.current.querySelector(".react-flow__renderer");
      if (!flowElement) {
        throw new Error("Could not find flow element");
      }

      fitView({ padding: 0.2, duration: 500 });
      await new Promise((resolve) => setTimeout(resolve, 600));

      const dataUrl = await toPng(flowElement, {
        backgroundColor: "#fafafa",
        quality: 1.0,
        pixelRatio: 2,
        filter: (node) => {
          return !(
            node.classList?.contains("react-flow__controls") ||
            node.classList?.contains("react-flow__minimap") ||
            node.classList?.contains("react-flow__panel") ||
            node.classList?.contains("search-message") ||
            node.classList?.contains("hover-info") ||
            node.classList?.contains("download-btn")
          );
        },
      });

      const link = document.createElement("a");
      link.download = `json-tree-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();

      setMessage("✅ Tree downloaded successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error downloading tree:", error);
      setMessage("❌ Failed to download tree");
      setTimeout(() => setMessage(""), 3000);
    }
  }, [nodes, fitView]);

  useEffect(() => {
    if (message && !message.includes("⏳")) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="tree-visualizer-container">
      <div className="search-bar-container">
        <SearchBar onSearch={handleSearch} />
      </div>

      {copyNotification && (
        <div className="copy-notification">{copyNotification}</div>
      )}

      <div className="tree-container" ref={reactFlowWrapper}>
        {nodes.length === 0 ? (
          <div className="placeholder">
            <p>No JSON data to visualize</p>
            <p>Enter valid JSON and click "Generate Tree"</p>
          </div>
        ) : (
          <>
            {/* download tree functionality */}
            <div className="download-btn-container">
              <button
                className="download-btn"
                onClick={downloadTreeAsImage}
                title="Download tree as PNG image"
                disabled={nodes.length === 0}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Download
              </button>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              nodesConnectable={false}
              zoomOnScroll={true}
              panOnDrag={true}
              zoomOnPinch={true}
              minZoom={0.1}
              maxZoom={2}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{
                padding: 0.2,
                includeHiddenNodes: false,
                duration: 500,
              }}
            >
              {/* MiniMap functionality */}
              <MiniMap
                position="bottom-right"
                zoomable
                pannable
                nodeColor={(node) => {
                  switch (node.data.type) {
                    case "object":
                      return "#5859a4";
                    case "array":
                      return "#3e8970";
                    case "primitive":
                      return "#a48449";
                    default:
                      return "#ccc";
                  }
                }}
                style={{
                  width: 120,
                  height: 80,
                  backgroundColor: "var(--panel-bg)",
                  border: "1px solid var(--border-color)",
                }}
                nodeStrokeWidth={1}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
              <Controls position="top-right" showFitView={true} showInteractive={false} />
              <Background gap={20} size={1} />

              {message && (
                <Panel position="top-left" className="search-message-panel">
                  <div className="search-message">{message}</div>
                </Panel>
              )}

              {hoverInfo && (
                <Panel position="top-left" className="hover-info">
                  <div className="hover-card">
                    <strong>Path:</strong> {hoverInfo.path}
                    <br />
                    <strong>Type:</strong> {hoverInfo.type}
                    <br />
                    <strong>Value:</strong> {hoverInfo.value}
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </>
        )}
      </div>
    </div>
  );
}

export default TreeVisualizer;
