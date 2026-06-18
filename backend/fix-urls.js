const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUrls() {
  try {
    console.log('Updating URLs from HTTP to HTTPS...');

    const updated = await prisma.contestLead.updateMany({
      where: {
        OR: [
          { fotoExteriorUrl: { contains: 'http://concurso.intercutmedia.com' } },
          { fotoInteriorUrl: { contains: 'http://concurso.intercutmedia.com' } },
        ],
      },
      data: {
        fotoExteriorUrl: {
          set: undefined, // will be handled manually
        },
      },
    });

    console.log(`Updated ${updated.count} records`);

    // Get all records and fix them manually
    const leads = await prisma.contestLead.findMany({
      where: {
        OR: [
          { fotoExteriorUrl: { contains: 'http://' } },
          { fotoInteriorUrl: { contains: 'http://' } },
        ],
      },
    });

    console.log(`Found ${leads.length} records to fix`);

    for (const lead of leads) {
      const exterior = lead.fotoExteriorUrl?.replace('http://', 'https://');
      const interior = lead.fotoInteriorUrl?.replace('http://', 'https://');

      await prisma.contestLead.update({
        where: { id: lead.id },
        data: {
          fotoExteriorUrl: exterior || lead.fotoExteriorUrl,
          fotoInteriorUrl: interior || lead.fotoInteriorUrl,
        },
      });
    }

    console.log('✓ All URLs updated to HTTPS');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUrls();
