import { useState } from 'react';

function SearchBar({ onSearch }) {
  const [searchPath, setSearchPath] = useState('');

  const handleSearch = () => {
    onSearch(searchPath);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchPath(value);
    if (value === '') {
      onSearch('');
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Enter JSON path (e.g. $.user.address.city)"
        value={searchPath}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <button onClick={handleSearch}>
        Search
      </button>
    </div>
  );
}

export default SearchBar;
