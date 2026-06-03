/**
 * One-time setup routes — for seeding production DB via HTTP.
 * Protected by SETUP_SECRET env var.
 * Remove this file once setup is complete.
 */
import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

const ACCOUNT_TYPES_VALUE = [
  { value: 'BANK',        label: 'ธนาคาร',         category: 'ASSET',     subCategory: 'NONE' },
  { value: 'CASHFLOW',    label: 'กระแสเงินสด',    category: 'ASSET',     subCategory: 'NONE' },
  { value: 'INTERNAL',    label: 'ภายใน',           category: 'ASSET',     subCategory: 'NONE' },
  { value: 'SAVING',      label: 'เงินออม',         category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'EMERGENCY',   label: 'เงินฉุกเฉิน',     category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'GOAL',        label: 'เป้าหมาย',        category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'GOAL_SAVING', label: 'เงินมีเป้าหมาย', category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'FAMILY',      label: 'ครอบครัว',        category: 'ASSET',     subCategory: 'LIQUID' },
  { value: 'STOCK',       label: 'หุ้น',             category: 'ASSET',     subCategory: 'INVESTMENT' },
  { value: 'GOLD',        label: 'ทอง',             category: 'ASSET',     subCategory: 'INVESTMENT' },
  { value: 'INVESTMENT',  label: 'การลงทุน',        category: 'ASSET',     subCategory: 'INVESTMENT' },
  { value: 'LIABILITY',   label: 'หนี้สิน',         category: 'LIABILITY', subCategory: 'NONE' },
];

export default async function setupRoutes(server: FastifyInstance) {
  server.post('/seed-account-types', async (request, reply) => {
    const secret = (request.query as any).secret;
    if (!secret || secret !== process.env.SETUP_SECRET) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const result = await prisma.systemConfig.upsert({
      where: { key: 'ACCOUNT_TYPES' },
      update: { value: ACCOUNT_TYPES_VALUE as any, category: 'DROPDOWNS', updatedBy: 'SETUP_ENDPOINT' },
      create: { key: 'ACCOUNT_TYPES', value: ACCOUNT_TYPES_VALUE as any, category: 'DROPDOWNS', updatedBy: 'SETUP_ENDPOINT' },
    });

    return reply.send({
      success: true,
      message: `ACCOUNT_TYPES seeded with ${ACCOUNT_TYPES_VALUE.length} types`,
      id: result.id,
      preview: {
        assets_shown:       ACCOUNT_TYPES_VALUE.filter(t => t.category === 'ASSET' && t.subCategory !== 'NONE').map(t => t.value),
        assets_non_counted: ACCOUNT_TYPES_VALUE.filter(t => t.category === 'ASSET' && t.subCategory === 'NONE').map(t => t.value),
        liabilities:        ACCOUNT_TYPES_VALUE.filter(t => t.category === 'LIABILITY').map(t => t.value),
      }
    });
  });
}
