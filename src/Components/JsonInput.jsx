import { useState } from "react";

function JsonInput({ setJsonData }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = () => {
    setError("");
    if (!input.trim()) {
      setError("❌ Please enter JSON data");
      setJsonData(null);
      return;
    }
    try {
      setJsonData(JSON.parse(input));
    } catch {
      setError("❌ Invalid JSON format");
      setJsonData(null);
    }
  };

  const handleClear = () => {
    setInput("");
    setError("");
    setJsonData(null);
  };

  return (
    <div className="json-input-container">
      <textarea
        className="json-textarea"
        placeholder='Paste JSON here...'
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      
      <div className="button-group">
        <button className="generate-btn" onClick={handleGenerate}>Generate Tree</button>
        <button className="clear-btn" onClick={handleClear}>Clear</button>
      </div>
      
      <p className="helper-text">Enter valid JSON and click Generate Tree.</p>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default JsonInput;