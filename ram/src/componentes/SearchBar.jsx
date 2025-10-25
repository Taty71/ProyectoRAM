import React from 'react';
import '../estilos/search_bar.css';

function SearchBar({
  value = '',
  placeholder = 'Buscar por nombre o código...',
  onChange,
  onSubmit,
  debounceMs = 250
}) {
  const [internal, setInternal] = React.useState(value || '');
  const debRef = React.useRef(null);

  // Keep internal in sync when value prop changes from outside
  React.useEffect(() => setInternal(value || ''), [value]);

  // Debounced propagate change
  React.useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      onChange && onChange(internal);
    }, debounceMs);
    return () => clearTimeout(debRef.current);
  }, [internal, debounceMs, onChange]);

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debRef.current) clearTimeout(debRef.current);
      onChange && onChange(internal);
      onSubmit && onSubmit(internal);
    }
  }

  function clear() {
    setInternal('');
    if (debRef.current) clearTimeout(debRef.current);
    onChange && onChange('');
  }

  return (
    <div className="searchbar-root">
      <div className="searchbar-icon" aria-hidden>
        {/* simple magnifier SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-4.35-4.35" stroke="#2b7f72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="#2b7f72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <input
        className="searchbar-input"
        type="text"
        value={internal}
        placeholder={placeholder}
        onChange={e => setInternal(e.target.value)}
        onKeyDown={handleKey}
        aria-label="Buscar materia"
      />
      {internal ? (
        <button className="searchbar-clear" onClick={clear} aria-label="Limpiar búsqueda">✕</button>
      ) : null}
    </div>
  );
}

export default SearchBar;
