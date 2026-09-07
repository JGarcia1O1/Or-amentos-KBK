const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'src/components/emails/EmailsView.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/import toast from 'react-hot-toast';/g, "import { toast } from 'sonner';");

fs.writeFileSync(p, c, 'utf8');
