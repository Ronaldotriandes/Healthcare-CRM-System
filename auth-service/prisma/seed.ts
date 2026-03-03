import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // Create Admin User
  const adminEmail = 'admin@healthcare.com';
  const adminPassword = 'Admin123!'; // Change this in production

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullname: 'System Administrator',
        password: hashedPassword,
      },
    });

    console.log('✅ Admin user created:', {
      id: admin.id,
      email: admin.email,
      fullname: admin.fullname,
    });
    console.log('📝 Admin credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   ⚠️  Please change the password after first login!');
  }

  // Create Sample Users for testing (optional)
  const sampleUsers = [
    {
      email: 'doctor@healthcare.com',
      fullname: 'Dr. John Smith',
      password: 'Doctor123!',
    },
    {
      email: 'nurse@healthcare.com',
      fullname: 'Nurse Jane Doe',
      password: 'Nurse123!',
    },
    {
      email: 'patient@healthcare.com',
      fullname: 'Patient Mike Johnson',
      password: 'Patient123!',
    },
  ];

  for (const userData of sampleUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          fullname: userData.fullname,
          password: hashedPassword,
        },
      });

      console.log('✅ Sample user created:', {
        email: user.email,
        fullname: user.fullname,
      });
    }
  }

  console.log('🌱 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
