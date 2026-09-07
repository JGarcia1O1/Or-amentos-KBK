const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/layout/ProfileSettingsModal.tsx');
let c = fs.readFileSync(p, 'utf8');

if (!c.includes('createPortal')) {
  c = c.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';");
  
  c = c.replace(/return \(\s*<div className="fixed inset-0/, "const modalContent = (\n    <div className=\"fixed inset-0");
  
  // Find the end of the return statement. It's the last `  );` before `}`
  const lastIndex = c.lastIndexOf("  );\n}");
  if (lastIndex !== -1) {
    c = c.substring(0, lastIndex) + "  );\n\n  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;\n}";
  }
}

fs.writeFileSync(p, c, 'utf8');
