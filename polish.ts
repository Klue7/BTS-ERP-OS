import fs from 'fs';

let content = fs.readFileSync('src/components/EmployeePortal.tsx', 'utf8');

// Headings
content = content.replace(/text-5xl font-serif font-black/g, 'text-4xl font-serif font-bold');

// Spacing
content = content.replace(/space-y-12/g, 'space-y-8');
content = content.replace(/gap-12/g, 'gap-8');

// Border radii
content = content.replace(/rounded-\[40px\]/g, 'rounded-3xl');
content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');

// Green accents - reduce opacity in some places
content = content.replace(/hover:border-\[\#00ff88\]\/30/g, 'hover:border-[#00ff88]/20');
content = content.replace(/shadow-\[0_10px_40px_-10px_rgba\(0,255,136,0\.1\)\]/g, 'shadow-[0_10px_30px_-15px_rgba(0,255,136,0.15)]');

fs.writeFileSync('src/components/EmployeePortal.tsx', content);
