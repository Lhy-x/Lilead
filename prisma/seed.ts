import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('ChangeMe123!', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin',
      companyName: 'Lilead',
      emailVerified: true
    }
  });

  const form = await prisma.form.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      userId: user.id,
      name: 'Formulaire de démonstration',
      description: 'Un exemple de formulaire de qualification',
      slug: 'demo',
      isPublished: true,
      successTitle: 'Merci pour votre intérêt !',
      successMessage: 'Nous vous contacterons très rapidement.',
      enableTestMode: true,
      questions: {
        create: [
          {
            label: 'Quel est votre email ?',
            type: 'EMAIL',
            isRequired: true,
            order: 0
          },
          {
            label: 'Quel est votre numéro de téléphone ?',
            type: 'PHONE',
            isRequired: false,
            order: 1
          },
          {
            label: 'Quel est votre budget mensuel ?',
            type: 'SHORT_TEXT',
            isRequired: true,
            order: 2
          }
        ]
      }
    }
  });

  await prisma.leadRule.upsert({
    where: { id: form.id },
    update: {},
    create: {
      id: form.id,
      userId: user.id,
      formId: form.id,
      fieldKey: 'budget',
      operator: 'contains',
      value: '1000',
      weight: 1
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
