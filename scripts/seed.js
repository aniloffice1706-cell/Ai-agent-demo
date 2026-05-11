const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@plexus-property.com' },
    update: {},
    create: {
      email: 'admin@plexus-property.com',
      password: adminPassword,
      name: 'Admin',
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Seed Lucknow areas
  const areas = [
    { areaName: 'Gomti Nagar', description: 'Premium residential area with modern amenities' },
    { areaName: 'Indira Nagar', description: 'Well-established residential locality' },
    { areaName: 'Hazratganj', description: 'Commercial and residential hub' },
    { areaName: 'Aliganj', description: 'Residential area in central Lucknow' },
    { areaName: 'Jankipuram', description: 'Planned residential development' },
    { areaName: 'Shaheed Path', description: 'Developing area with good connectivity' },
    { areaName: 'Sushant Golf City', description: 'Premium gated community' },
    { areaName: 'Transport Nagar', description: 'Well-connected commercial area' },
    { areaName: 'Mahanagar', description: 'Residential locality' },
    { areaName: 'Amar Shaheed Path', description: 'Commercial corridor' },
    { areaName: 'Chowk', description: 'Historic market area' },
    { areaName: 'Aminabad', description: 'Traditional market area' },
  ];

  for (const area of areas) {
    await prisma.lucknowArea.upsert({
      where: { areaName: area.areaName },
      update: {},
      create: area,
    });
  }
  console.log(`✅ Seeded ${areas.length} Lucknow areas`);

  // Create sample knowledge base
  const kb = await prisma.knowledgeBase.create({
    data: {
      title: 'Property Guide',
      content: `We provide comprehensive real estate solutions for modern property seekers.
      
Property types range from apartments to villas to commercial spaces.
We have properties across multiple locations with excellent connectivity.`,
      fileType: 'text',
    },
  });
  console.log('✅ Knowledge base created');

  // Create sample leads
  const leads = [
    {
      name: 'Raj Kumar',
      phone: '9876543210',
      email: 'raj@example.com',
      budget: '50-75 Lakhs',
      location: 'Gomti Nagar',
      propertyType: '2 BHK Apartment',
      intent: 'purchase',
      timeline: '3months',
      source: 'chat',
    },
    {
      name: 'Priya Singh',
      phone: '9876543211',
      email: 'priya@example.com',
      budget: '20,000 - 30,000',
      location: 'Indira Nagar',
      propertyType: '1 BHK Apartment',
      intent: 'rent',
      timeline: 'immediate',
      source: 'voice',
    },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        ...lead,
        status: 'new',
      },
    });
  }
  console.log(`✅ Created ${leads.length} sample leads`);

  console.log('✨ Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
