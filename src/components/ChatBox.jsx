import React, { useState } from 'react';
import { kirimPesan } from '../utils/ai'; // Mengimpor fungsi yang baru saja Anda buat

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [pesanList, setPesanList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const teksUser = input;
    setInput('');
    
    // 1. Tambahkan pesan user ke layar
    setPesanList((prev) => [...prev, { role: 'user', content: teksUser }]);
    
    setLoading(true);
    // 2. Panggil fungsi kirimPesan dari file ai.js
    const balasanAi = await kirimPesan(teksUser);
    setLoading(false);

    // 3. Tambahkan balasan AI ke layar
    setPesanList((prev) => [...prev, { role: 'assistant', content: balasanAi }]);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h2>Asisten AI</h2>
      
      {/* Area Riwayat Chat */}
      <div style={{ border: '1px solid #ccc', padding: '15px', height: '350px', overflowY: 'scroll', marginBottom: '10px', borderRadius: '5px' }}>
        {pesanList.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              background: msg.role === 'user' ? '#007bff' : '#f1f0f0',
              color: msg.role === 'user' ? '#fff' : '#000'
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: '#666', fontStyle: 'italic' }}>AI sedang berpikir...</p>}
      </div>

      {/* Form Input Pesan */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan atau pertanyaan..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Kirim
        </button>
      </form>
    </div>
  );
}
