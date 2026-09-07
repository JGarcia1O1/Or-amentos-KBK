import fs from 'fs';
import path from 'path';

const filepath = path.join(process.cwd(), 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(filepath, 'utf8');

const regex = /const \[currentUser, setCurrentUser\] = useState<string>\('Departamento Comercial'\);\s*const \[userRole, setUserRole\] = useState<UserRole>\('admin'\);/;
const replacement = `const [currentUser, setCurrentUser] = useState<string>('A Carregar...');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.email);
      } else {
        setCurrentUser('Não autenticado');
      }
    });

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.email) {
          setCurrentUser(session.user.email);
        } else {
          setCurrentUser('Não autenticado');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);`;

content = content.replace(regex, replacement);
fs.writeFileSync(filepath, content, 'utf8');
