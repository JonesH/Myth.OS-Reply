const { execSync } = require('child_process');

if (process.env.NO_DATABASE !== 'true') {
  console.log('Generating Prisma client...');
  try {
    execSync('prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
} else {
  console.log('Skipping Prisma generation (NO_DATABASE=true)');
}