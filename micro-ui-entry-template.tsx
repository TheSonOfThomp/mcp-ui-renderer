import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import { __COMPONENT_NAME__ as Component } from '/src/micro-uis/__COMPONENT_NAME__.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)

