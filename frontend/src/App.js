import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

const styles = {
  body:       { fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f5f5f5', color: '#222' },
  header:     { background: '#1a1a2e', color: '#fff', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  h1:         { margin: 0, fontSize: '24px', letterSpacing: '1px' },
  badge:      { background: '#e94560', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' },
  main:       { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' },
  filters:    { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
  filterBtn:  { padding: '8px 18px', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', background: '#fff', fontSize: '14px' },
  activeBtn:  { background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' },
  card:       { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tag:        { background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block', marginBottom: '10px' },
  name:       { fontWeight: '600', fontSize: '16px', marginBottom: '8px' },
  desc:       { color: '#666', fontSize: '13px', marginBottom: '14px', lineHeight: '1.4' },
  price:      { color: '#e94560', fontWeight: '700', fontSize: '18px' },
  stock:      { color: '#888', fontSize: '12px', marginTop: '4px' },
  source:     { fontSize: '11px', padding: '4px 10px', borderRadius: '20px', marginLeft: '10px' },
  db:         { background: '#fff3cd', color: '#856404' },
  cache:      { background: '#d1e7dd', color: '#0f5132' },
  error:      { background: '#f8d7da', color: '#842029', padding: '16px', borderRadius: '8px', marginBottom: '20px' },
  loading:    { textAlign: 'center', padding: '60px', color: '#888', fontSize: '18px' },
};

export default function App() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected]     = useState('All');
  const [source, setSource]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then(r => r.json())
      .then(d => setCategories([{ id: 0, name: 'All' }, ...d.data]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(d => { setProducts(d.data); setSource(d.source); })
      .catch(() => setError('Could not reach the API. Check ALB URL in REACT_APP_API_URL.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selected === 'All'
    ? products
    : products.filter(p => p.category === selected);

  return (
    <div style={styles.body}>
      <header style={styles.header}>
        <h1 style={styles.h1}>ShopAPI</h1>
        <div>
          <span style={{ color: '#aaa', fontSize: '13px' }}>Data source:</span>
          <span style={{ ...styles.source, ...(source === 'cache' ? styles.cache : styles.db) }}>
            {source || '—'}
          </span>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.filters}>
          {categories.map(c => (
            <button
              key={c.id}
              style={{ ...styles.filterBtn, ...(selected === c.name ? styles.activeBtn : {}) }}
              onClick={() => setSelected(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading
          ? <div style={styles.loading}>Loading products...</div>
          : <div style={styles.grid}>
              {filtered.map(p => (
                <div key={p.id} style={styles.card}>
                  <span style={styles.tag}>{p.category}</span>
                  <div style={styles.name}>{p.name}</div>
                  <div style={styles.desc}>{p.description}</div>
                  <div style={styles.price}>₹{Number(p.price).toLocaleString('en-IN')}</div>
                  <div style={styles.stock}>Stock: {p.stock} units</div>
                </div>
              ))}
            </div>
        }
      </main>
    </div>
  );
}
