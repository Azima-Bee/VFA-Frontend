const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(distDir, 'assets');
const nodeModulesDir = path.join(assetsDir, 'node_modules');
const vendorDir = path.join(assetsDir, 'vendor');

console.log('[fix-web-export] Starting post-export asset relocation...');

if (!fs.existsSync(distDir)) {
  console.error('[fix-web-export] Error: dist/ directory does not exist. Run "npx expo export -p web" first.');
  process.exit(1);
}

// 1. Move/copy dist/assets/node_modules to dist/assets/vendor
if (fs.existsSync(nodeModulesDir)) {
  console.log('[fix-web-export] Relocating dist/assets/node_modules -> dist/assets/vendor...');
  fs.mkdirSync(vendorDir, { recursive: true });
  fs.cpSync(nodeModulesDir, vendorDir, { recursive: true });
  // Remove node_modules from dist so Vercel CLI doesn't skip it or warn
  fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  console.log('[fix-web-export] Successfully copied to dist/assets/vendor and cleaned up node_modules.');
} else if (fs.existsSync(vendorDir)) {
  console.log('[fix-web-export] dist/assets/vendor already exists.');
} else {
  console.warn('[fix-web-export] Warning: neither dist/assets/node_modules nor dist/assets/vendor found.');
}

// 2. Scan and replace "/assets/node_modules/" with "/assets/vendor/" in all bundled files
function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath);
    } else if (/\.(js|html|json|css|map)$/.test(entry.name)) {
      if (entry.name === 'vercel.json') continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('assets/node_modules/')) {
        const updated = content
          .replaceAll('/assets/node_modules/', '/assets/vendor/')
          .replaceAll('assets/node_modules/', 'assets/vendor/');
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log(`[fix-web-export] Patched asset paths in: ${path.relative(distDir, fullPath)}`);
      }
    }
  }
}

replaceInDir(distDir);

// 3. Find Ionicons font file to inject preload and @font-face in index.html
const fontsDir = path.join(vendorDir, '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
let ioniconsFile = null;
if (fs.existsSync(fontsDir)) {
  const fontFiles = fs.readdirSync(fontsDir);
  ioniconsFile = fontFiles.find(f => f.startsWith('Ionicons') && f.endsWith('.ttf'));
}

const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath) && ioniconsFile) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  const fontUrl = `/assets/vendor/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/${ioniconsFile}`;
  
  const fontPreload = `<link rel="preload" href="${fontUrl}" as="font" type="font/ttf" crossorigin="anonymous" />`;
  const fontFaceStyle = `
    <style id="expo-vector-icons-fonts">
      @font-face {
        font-family: 'ionicons';
        src: url('${fontUrl}') format('truetype');
        font-display: swap;
      }
    </style>`;

  const inputResetStyle = `
    <style id="vfa-web-input-focus-reset">
      input, textarea, select, [contenteditable="true"] {
        outline: none !important;
        outline-style: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input:focus, textarea:focus, select:focus {
        outline: none !important;
        outline-style: none !important;
      }
      input:focus-visible, textarea:focus-visible {
        outline: none !important;
      }
    </style>`;

  let modified = false;
  if (!html.includes('rel="preload"') || !html.includes(fontUrl)) {
    html = html.replace('</head>', `  ${fontPreload}\n${fontFaceStyle}\n${inputResetStyle}\n</head>`);
    modified = true;
  } else if (!html.includes('vfa-web-input-focus-reset')) {
    html = html.replace('</head>', `${inputResetStyle}\n</head>`);
    modified = true;
  }
  if (modified) {
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log(`[fix-web-export] Injected Ionicons preload, @font-face, and input outline reset into index.html (${ioniconsFile})`);
  }
}

// 4. Create vercel.json in dist/ and in rootDir
const vercelConfig = {
  version: 2,
  cleanUrls: true,
  routes: [
    {
      src: "^/assets/node_modules/(.*)$",
      dest: "/assets/vendor/$1"
    },
    {
      handle: "filesystem"
    },
    {
      src: "^/(.*)$",
      dest: "/index.html"
    }
  ],
  rewrites: [
    {
      source: "/assets/node_modules/(.*)",
      destination: "/assets/vendor/$1"
    },
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ],
  headers: [
    {
      source: "/assets/vendor/(.*)\\.(ttf|woff|woff2)",
      headers: [
        {
          key: "Content-Type",
          value: "font/ttf"
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      source: "/assets/vendor/(.*)\\.(png|jpg|jpeg|gif|svg|webp)",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
};

const rootVercelConfig = {
  ...vercelConfig,
  buildCommand: "npm run build:web",
  outputDirectory: "dist"
};

fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2), 'utf8');
fs.writeFileSync(path.join(rootDir, 'vercel.json'), JSON.stringify(rootVercelConfig, null, 2), 'utf8');
console.log('[fix-web-export] Generated dist/vercel.json and root vercel.json');

// 5. Ensure dist/.vercel/project.json is preserved for vfa-flatmate
const vercelDir = path.join(distDir, '.vercel');
fs.mkdirSync(vercelDir, { recursive: true });
const projectConfig = {
  projectId: "prj_xg462IRqUw2SHpXJoMop6Y5hh6kE",
  orgId: "team_k2H56hNnY64eR2cZTzBn21RA",
  projectName: "vfa-flatmate"
};
fs.writeFileSync(path.join(vercelDir, 'project.json'), JSON.stringify(projectConfig), 'utf8');
console.log('[fix-web-export] Preserved dist/.vercel/project.json for vfa-flatmate');

console.log('[fix-web-export] Finished successfully! Ready for Vercel deployment.');
