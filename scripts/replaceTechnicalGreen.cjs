const fs = require('fs');

const path = 'c:/Users/rikus/OneDrive/Documents/3D-BTS-Landing-page-main/src/components/TechnicalSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure useTheme is imported
if (!content.includes('useTheme')) {
  content = content.replace(
    /import \{ useVisualLab \} from '\.\/VisualLabContext';/,
    "import { useVisualLab, useTheme } from './VisualLabContext';"
  );
}

function injectTheme(funcName) {
  const marker = `function ${funcName}(`;
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    const endBracket = content.indexOf('{', idx);
    const blockStart = content.substring(endBracket, endBracket + 150);
    if (!blockStart.includes('useTheme(')) {
      content = content.substring(0, endBracket + 1) + 
        `\n  const { primaryColor: accentColor, textClass, borderClass, bgClass } = useTheme();` + 
        content.substring(endBracket + 1);
    }
  }
}

injectTheme('InlineQuoteWizard');
injectTheme('CalculatorButton');

const mainMarker = 'export function TechnicalSection() {';
const mainIdx = content.indexOf(mainMarker);
if (mainIdx !== -1) {
  const blockStart = content.substring(mainIdx, mainIdx + 150);
  if (!blockStart.includes('useTheme(')) {
    content = content.replace(
      mainMarker,
      `${mainMarker}\n  const { primaryColor: accentColor, textClass, borderClass, bgClass } = useTheme();`
    );
  }
}

// Global String Replacements
content = content.split("accent: string = '#22c55e'").join("accent?: string");
content = content.split("accent=\"#22c55e\"").join("accent={accentColor}");

content = content.split("text-[#22c55e]").join("${textClass}");
content = content.split("border-[#22c55e]/60").join("${borderClass}/60");
content = content.split("border-[#22c55e]/30").join("${borderClass}/30");
content = content.split("border-[#22c55e]/25").join("${borderClass}/25");
content = content.split("border-[#22c55e]/20").join("${borderClass}/20");
content = content.split("bg-[#22c55e]/10").join("${bgClass}/10");
content = content.split("bg-[#22c55e]/5").join("${bgClass}/5");
content = content.split("bg-[#22c55e]").join("${bgClass}");
content = content.split("focus:border-[#22c55e]").join("focus:${borderClass}");
content = content.split("caret-[#22c55e]").join(""); // remove caret specific, or keep default
// Let's manually replace the inline ones so we don't accidentally break className strings
// We'll replace className="..." with className={\`...\`}
content = content.replace(/className="([^"]*\$\{[^"]*)"/g, 'className={`$1`}');

// Color string hex replacements for inline styles
content = content.split("'#22c55e'").join("accentColor");
content = content.split("\"#22c55e\"").join("accentColor");
content = content.split("'#22c55e10'").join("`${accentColor}1A`");
content = content.split("'#22c55e30'").join("`${accentColor}4D`");
content = content.split("'rgba(34,197,94,0.35)'").join("`${accentColor}59`");
content = content.split("'rgba(34,197,94,0.2)'").join("`${accentColor}33`");
content = content.split("'rgba(34,197,94,0.6)'").join("`${accentColor}99`");

// Some complex classes in JS templates
content = content.split("shadow-[0_20px_40px_-10px_rgba(34,197,94,0.35)]").join("shadow-2xl");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed TechnicalSection cleanly');
