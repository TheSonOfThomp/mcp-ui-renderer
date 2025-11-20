import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Dynamically find all micro-UI components
const microUIs = import.meta.glob('./micro-uis/*.tsx');

const Index = () => {
  const links = Object.keys(microUIs).map((path) => {
    // path is like "./micro-uis/HelloWorld.tsx"
    // we want "HelloWorld"
    const name = path.split('/').pop()?.replace('.tsx', '');
    return {
      name,
      url: `/${name}.html`
    };
  }).filter(link => link.name);

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Micro UIs</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {links.map(link => (
          <li key={link.name} style={{ margin: '0.5rem 0' }}>
            <a 
              href={link.url} 
              style={{ 
                color: '#646cff', 
                textDecoration: 'none',
                fontSize: '1.2rem'
              }}
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Index />
  </StrictMode>,
)
