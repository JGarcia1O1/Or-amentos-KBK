import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Add import if not exists
if (!content.includes("CompanyDashboard")) {
  content = content.replace(
    "import QuotesDashboard from '@/components/quotes/QuotesDashboard';",
    "import CompanyDashboard from '@/components/dashboard/CompanyDashboard';\nimport QuotesDashboard from '@/components/quotes/QuotesDashboard';"
  );
  
  // Add the render condition
  content = content.replace(
    "{currentView === 'quotes-list' && <QuotesDashboard />}",
    "{currentView === 'dashboard' && <CompanyDashboard />}\n          {currentView === 'quotes-list' && <QuotesDashboard />}"
  );
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('page.tsx patched successfully');
} else {
  console.log('page.tsx already patched');
}
