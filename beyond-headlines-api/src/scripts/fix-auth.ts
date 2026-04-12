import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'editor@beyondheadlines.com';
  const plainPassword = 'password';
  
  console.log(`[Fix] Manually updating password for ${email}...`);
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hash },
  });
  
  console.log(`[Fix] User ${user.email} updated successfully.`);
  
  // Verification check in the same script
  const isValid = await bcrypt.compare(plainPassword, user.password);
  console.log(`[Fix] Verification check: ${isValid ? 'PASS' : 'FAIL'}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
