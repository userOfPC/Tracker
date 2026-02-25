
import React, { useState } from 'react';

const AddressSearch = ({ onAdd }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Введите адрес для поиска');
      return;
    }

    setLoading(true);
    setError('');

    const result = await onAdd(address);
    
    if (result.success) {
      setAddress('');
    } else {
      setError(result.error || 'Ошибка поиска адреса');
    }
    
    setLoading(false);
  };

  const handleClear = () => {
    setAddress('');
    setError('');
  };

  return (
    <div className="address-search">
      <div className="search-header">
        <h3>Поиск по адресу</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Введите адрес..."
            disabled={loading}
            className="search-input"
          />
          {address && (
            <button 
              type="button"
              onClick={handleClear}
              className="clear-search-btn"
              disabled={loading}
            >
              ✕
            </button>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !address.trim()}
          className="search-submit-btn"
        >
          {loading ? (
            <>
              <span className="search-spinner"></span>
              Поиск...
            </>
          ) : 'Найти'}
        </button>
      </form>
      
      {error && (
        <div className="search-error">
          <span>⚠️</span>
          {error}
        </div>
      )}
      
  
    </div>
  );
};

export default AddressSearch;