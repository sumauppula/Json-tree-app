import { useState, useEffect } from "react";
import JsonInput from "./Components/JsonInput";
import TreeVisualizer from "./Components/TreeVisualizer";
import { ReactFlowProvider } from "reactflow";
import "./App.css";

function App() {
  const [jsonData, setJsonData] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    document.body.classList.toggle('dark-theme', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className={`app-container ${isDarkTheme ? 'dark-theme' : ''}`}>
      <header className="header-container">
        <h1 className="title">JSON Tree Visualizer</h1>
        <div className="theme-switcher">
          <span>Dark Mode</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={isDarkTheme} onChange={toggleTheme} />
            <span className="toggle-slider"></span>
          </label>
          <span>{isDarkTheme ? 'ON' : 'OFF'}</span>
        </div>
      </header>

      <div className="main-content">
        <div className="left-panel">
          <JsonInput setJsonData={setJsonData} />
        </div>
        <div className="right-panel">
          <ReactFlowProvider>
            <TreeVisualizer jsonData={jsonData} onJsonDataChange={setJsonData} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default App;