// scripts/setup.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up project...');

// Check if .env.local exists
if (!fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  console.log('📝 Creating .env.local file...');
  fs.writeFileSync(
    path.join(process.cwd(), '.env.local'),
    `# Next.js Environment Variables
NEXT_PUBLIC_SITE_NAME=Gayathri Homely Delights
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_TELEMETRY_DISABLED=1
`
  );
  console.log('✅ .env.local created');
}

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the project
console.log('🏗️ Building project...');
execSync('npm run build', { stdio: 'inherit' });

console.log('✅ Setup complete!');
console.log('🚀 Run "npm run dev" to start development server');