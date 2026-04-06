const fs = require('fs');
const cp = require('child_process');
const path = require('path');

const services = [
  'auth-service',
  'catalog-service',
  'chat-service',
  'inventory-service',
  'order-service',
  'payment-service',
  'saga-orchestrator',
  'search-service',
  'shop-service',
  'user-service',
  'voucher-service'
];

for (const svc of services) {
  const svcPath = path.join('d:/tmdt', svc);
  const hasPrisma = fs.existsSync(path.join(svcPath, 'prisma.config.ts')) || fs.existsSync(path.join(svcPath, 'src/infrastructure/database/prisma/schema.prisma'));
  
  if (hasPrisma) {
    console.log(`\n================================`);
    console.log(`Processing migration for ${svc}...`);
    try {
      // Bắt buộc Prisma reset DB (chấp nhận drop dev data)
      console.log('Resetting database...');
      cp.execSync('yarn prisma migrate reset --force --skip-seed', { cwd: svcPath, stdio: 'inherit' });
      
      // Chạy migrate dev bình thường tạo migration folder
      console.log('Creating initial schema migration...');
      cp.execSync('yarn prisma migrate dev --name init_schema', { cwd: svcPath, stdio: 'inherit' });
    } catch (e) {
      console.error(`Migration failed for ${svc}, skipping...`);
    }
  }
}
console.log('\nMigration generation completed for all services!');
