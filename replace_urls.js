const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');
const API_BASE = "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api";

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace 'http://localhost:5000/api
      let newContent = content.replace(/'http:\/\/localhost:5000\/api/g, API_BASE);
      // It might have closing quote ' to handle
      // E.g. fetch('http://localhost:5000/api/products') -> fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`)
      
      // A better regex:
      newContent = newContent.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api$1`");
      newContent = newContent.replace(/"http:\/\/localhost:5000\/api([^"]*)"/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api$1`");
      newContent = newContent.replace(/`http:\/\/localhost:5000\/api([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api$1`");

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Done");
