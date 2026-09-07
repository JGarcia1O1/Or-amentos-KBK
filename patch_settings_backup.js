const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'src/components/settings/SettingsView.tsx');
let c = fs.readFileSync(p, 'utf8');

// Add import if not exists
if (!c.includes('import BackupCard')) {
  c = c.replace(
    "import ConditionsLivePreview from './ConditionsLivePreview';",
    "import ConditionsLivePreview from './ConditionsLivePreview';\nimport BackupCard from './BackupCard';"
  );
}

// Add the BackupCard right after the "Base de Dados e Catálogo" div
// We will replace the last few divs
const targetStr = `        </div>
      </div>
    </div>
  );
}`;

const replacementStr = `        </div>
      </div>

      <BackupCard />
    </div>
  );
}`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync(p, c, 'utf8');
console.log('SettingsView patched.');
