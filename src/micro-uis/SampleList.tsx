import { useState } from 'react';

interface Item {
  id: number;
  text: string;
}

export const SampleList = () => {
  const [items] = useState<Item[]>([
    { id: 1, text: 'Learn React' },
    { id: 2, text: 'Build Micro-UIs' },
    { id: 3, text: 'Deploy to Production' },
  ]);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginTop: '1rem' }}>
      <h2>Sample List</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

