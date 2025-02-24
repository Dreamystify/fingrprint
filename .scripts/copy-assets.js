const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '..', 'src', 'scripts');
const destination = path.join(__dirname, '..', 'lib', 'scripts');

try {
  fs.cpSync(source, destination, { recursive: true });
  console.log(`Copied ${source} to ${destination}`);
} catch (error) {
  console.error('Error copying assets:', error);
  process.exit(1);
}