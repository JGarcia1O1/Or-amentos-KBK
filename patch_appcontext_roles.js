const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/context/AppContext.tsx');
let c = fs.readFileSync(p, 'utf8');

// 1. We need to fetch the role from user_roles
// Search for:
/*
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
      } else {
*/

const searchAuthInit = `    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
      } else {
        setCurrentUser('Não autenticado');
      }
    });`;

const newAuthInit = `    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
        // Fetch role from Supabase DB
        supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
          .then(({ data }) => {
             if (data && data.role === 'admin') setUserRole('admin');
             else setUserRole('gestor'); // Fallback regular user
          });
      } else {
        setCurrentUser('Não autenticado');
      }
    });`;

c = c.replace(searchAuthInit, newAuthInit);

// Also need to do the same for onAuthStateChange
const searchAuthChange = `    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.email) {
          setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
        } else {
          setCurrentUser('Não autenticado');
        }
      }
    );`;

const newAuthChange = `    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.email) {
          setCurrentUser(session.user.user_metadata?.display_name || 'Utilizador KUBIK');
          supabase.from('user_roles').select('role').eq('user_id', session.user.id).single()
            .then(({ data }) => {
               if (data && data.role === 'admin') setUserRole('admin');
               else setUserRole('gestor');
            });
        } else {
          setCurrentUser('Não autenticado');
        }
      }
    );`;

c = c.replace(searchAuthChange, newAuthChange);

fs.writeFileSync(p, c, 'utf8');
console.log('AppContext patched to fetch DB roles');
