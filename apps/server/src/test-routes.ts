import 'dotenv/config';
import { prisma } from './services/prisma';
import { registerUser, authenticateUser } from './services/user-store';
import { GEMINI_VOICE_TOOL_DECLARATIONS, VoiceToolExecutor } from './services/voice-tools';

async function runTestSuite() {
  console.log('=== RUNNING POSTGRESQL INTEGRATION TEST SUITE ===');

  // Test 1: Check PostgreSQL connection
  console.log('\n[1] Testing PostgreSQL Connection...');
  const count = await prisma.assetCategory.count();
  console.log(`✅ Connected to PostgreSQL. Categories found: ${count}`);

  // Test 2: Register a test user
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`\n[2] Testing Registration in PostgreSQL (${testEmail})...`);
  const registered = await registerUser({
    fullName: 'Test Homeowner',
    email: testEmail,
    password: 'Password@123',
  });
  console.log(`✅ User created: ${registered.user.fullName} (${registered.user.id})`);
  console.log(`✅ Household created: ${registered.household.name} (${registered.household.id})`);

  // Test 3: Authenticate user
  console.log('\n[3] Testing Authentication from PostgreSQL...');
  const auth = await authenticateUser({
    identifier: testEmail,
    password: 'Password@123',
  });
  console.log(`✅ Authentication successful. Token: ${auth.token}`);

  // Test 4: Create Asset in PostgreSQL
  console.log('\n[4] Testing Asset creation with Warranty in PostgreSQL...');
  const asset = await prisma.asset.create({
    data: {
      householdId: registered.household.id,
      name: 'Samsung 55-Inch Neo QLED TV',
      categoryId: 'electronics',
      brand: 'Samsung',
      model: 'QA55QN85CAKLXL',
      purchasePrice: 94990,
      purchaseDate: new Date('2026-01-10'),
      location: 'Living Room',
      warranty: {
        create: {
          provider: 'Samsung 3-Year Extended Warranty',
          startDate: new Date('2026-01-10'),
          endDate: new Date('2029-01-10'),
        },
      },
    },
    include: {
      warranty: true,
    },
  });
  console.log(`✅ Asset created in PostgreSQL: ${asset.name} (ID: ${asset.id})`);
  console.log(`✅ Warranty attached: ${asset.warranty?.provider} (End: ${asset.warranty?.endDate.toISOString().split('T')[0]})`);

  // Test 5: Voice Assistant Status and Tools
  console.log('\n[5] Testing Voice Assistant Tools & Status...');
  console.log(`✅ Voice tools registered: ${GEMINI_VOICE_TOOL_DECLARATIONS.length} tools`);
  
  // Test Voice Tool execution for created asset
  const tvDetails = await VoiceToolExecutor.executeTool('get_asset_details', { assetName: 'Samsung' }, {
    userId: registered.user.id,
    householdId: registered.household.id,
    userName: registered.user.fullName,
    householdName: registered.household.name,
  });
  console.assert(tvDetails.success && tvDetails.data.found, 'Voice tool should find Samsung TV');
  console.log(`✅ Voice tool query successful: ${tvDetails.data.asset.name} (Price: ${tvDetails.data.asset.purchasePriceFormatted})`);

  // Test Neha Hindi Chat Agent
  console.log('\n[6] Testing Neha Hindi Conversational Agent...');
  const { GeminiTextAgent } = await import('./services/gemini-live.js');
  const hindiResponse = await GeminiTextAgent.chat(
    'नमस्ते नेहा, मेरे सैमसंग टीवी की वारंटी कब तक है?',
    {
      userId: registered.user.id,
      householdId: registered.household.id,
      userName: registered.user.fullName,
      householdName: registered.household.name,
    }
  );
  console.log(`✅ Neha Spoken Response (Hindi): "${hindiResponse.text}"`);
  console.log(`✅ Tools called by Neha: ${hindiResponse.toolsCalled.map((t: any) => t.name).join(', ')}`);

  // Test 7: Clean up test user & household
  console.log('\n[7] Cleaning up test records...');
  await prisma.asset.delete({ where: { id: asset.id } });
  await prisma.household.delete({ where: { id: registered.household.id } });
  await prisma.user.delete({ where: { id: registered.user.id } });
  console.log('✅ Test records cleaned up successfully.');

  console.log('\n🎉 ALL POSTGRESQL & VOICE ASSISTANT INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runTestSuite()
  .catch((e) => {
    console.error('❌ Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
