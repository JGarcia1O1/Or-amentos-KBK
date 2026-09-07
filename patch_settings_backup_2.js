const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), 'src/components/settings/SettingsView.tsx');
let c = fs.readFileSync(p, 'utf8');

// The end of the file currently is:
//         </div>
//       </div>
//     </div>
//   );
// }

// Let's use a regex to replace the final `    </div>\n  );\n}` with the BackupCard

const newEnd = `      </div>
      <BackupCard />
    </div>
  );
}
`;

c = c.replace(/      <\/div>\s*<\/div>\s*\);\s*}\s*$/, `      </div>\n      <BackupCard />\n    </div>\n  );\n}\n`);

fs.writeFileSync(p, c, 'utf8');
console.log('Appended BackupCard');
