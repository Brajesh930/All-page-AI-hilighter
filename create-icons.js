// Simple script to create placeholder icon files
// This creates basic icon files that can be replaced with proper icons later

const fs = require('fs');
const path = require('path');

// Create a simple PNG data URL for each icon size
function createIconDataURL(size) {
  // This is a simple base64 encoded PNG of a brain emoji-style icon
  // In a real implementation, you'd use proper image generation
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="url(#grad)" stroke="white" stroke-width="2"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central" 
            font-size="${size*0.6}" fill="white">🧠</text>
    </svg>
  `;
  
  return canvas;
}

// Create icon files
const iconSizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

iconSizes.forEach(size => {
  const svgContent = createIconDataURL(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  
  fs.writeFileSync(filename, svgContent);
  console.log(`Created ${filename}`);
});

console.log('Icon files created successfully!');
console.log('Note: These are SVG placeholders. For production, convert to PNG using an image editor or online converter.');
