import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src/components/layout/Header.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Add LogOut import
content = content.replace(
  /UserCircle2,/,
  `UserCircle2,\n  LogOut,`
);

// Destructure currentUser
content = content.replace(
  /userRole,\n\s*setUserRole,\n\s*\} = useApp\(\);/,
  `userRole,\n    setUserRole,\n    currentUser,\n  } = useApp();`
);

// Remove the select and replace with currentUser and logout button
const regex = /<div className="flex items-center gap-2 mr-4 border-r border-gray-200 pr-4">[\s\S]*?<\/div>/;
const replacement = `<div className="flex items-center gap-3 mr-4 border-r border-gray-200 pr-4">
          <UserCircle2 className="w-5 h-5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">{currentUser}</span>
          <button
            onClick={() => {
              import('@/lib/supabase').then(({ supabase }) => {
                supabase.auth.signOut().then(() => {
                  window.location.href = '/login';
                });
              });
            }}
            className="p-1.5 ml-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            title="Terminar Sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync(filepath, content, 'utf8');
