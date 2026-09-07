const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'context', 'AppContext.tsx');
let content = fs.readFileSync(filepath, 'utf8');

const newFetchCatalog = `    const fetchCatalog = async () => {
      try {
        const [mRes, hRes, wRes, eRes, cRes, compRes] = await Promise.all([
          supabase.from('materials').select('*').order('created_at', { ascending: true }),
          supabase.from('hardware').select('*').order('created_at', { ascending: true }),
          supabase.from('workstations').select('*').order('created_at', { ascending: true }),
          supabase.from('edges').select('*').order('created_at', { ascending: true }),
          supabase.from('clients').select('*').order('created_at', { ascending: true }),
          supabase.from('company_info').select('*').limit(1).single()
        ]);

        if (mRes.data && mRes.data.length > 0) setMaterials(mRes.data);
        if (hRes.data && hRes.data.length > 0) setHardware(hRes.data);
        if (wRes.data && wRes.data.length > 0) setWorkstations(wRes.data);
        if (eRes.data && eRes.data.length > 0) {
          const mappedEdges = eRes.data.map(edge => ({
            ...edge,
            pricePerMeter: edge.price_per_meter || edge.pricePerMeter
          }));
          setEdges(mappedEdges);
        }
        if (cRes.data && cRes.data.length > 0) setClients(cRes.data);
        if (compRes.data) setCompanyInfo(compRes.data);

        // Fetch quotes
        const quotesData = await QuoteService.getAll();
        if (quotesData && quotesData.length > 0) setQuotes(quotesData);

      } catch (error) {
        console.error('Error fetching initial data from Supabase', error);
      }
    };`;

content = content.replace(
  /const fetchCatalog = async \(\) => \{[\s\S]*?console\.error\('Error fetching initial catalog', error\);\s*\}\s*\};/m,
  newFetchCatalog
);

fs.writeFileSync(filepath, content, 'utf8');
