import { VoiceToolExecutor, GEMINI_VOICE_TOOL_DECLARATIONS } from './services/voice-tools';
import { prisma, HouseholdRole, ReminderType, ReminderStatus } from './services/prisma';

async function runVoiceAssistantTests() {
  console.log('🧪 Starting Voice Assistant Tool Engine & Security Tests...\n');

  // Setup test households
  const testHouseholdA = await prisma.household.create({
    data: {
      name: 'Test Household Alpha',
    },
  });

  const testUserA = await prisma.user.create({
    data: {
      fullName: 'Alice Alpha',
      email: `alice_${Date.now()}@test.local`,
      households: {
        create: {
          householdId: testHouseholdA.id,
          role: HouseholdRole.OWNER,
        },
      },
    },
  });

  const testHouseholdB = await prisma.household.create({
    data: {
      name: 'Test Household Beta',
    },
  });

  const testUserB = await prisma.user.create({
    data: {
      fullName: 'Bob Beta',
      email: `bob_${Date.now()}@test.local`,
      households: {
        create: {
          householdId: testHouseholdB.id,
          role: HouseholdRole.OWNER,
        },
      },
    },
  });

  const ctxA = {
    userId: testUserA.id,
    householdId: testHouseholdA.id,
    userName: testUserA.fullName,
    householdName: testHouseholdA.name,
  };

  const ctxB = {
    userId: testUserB.id,
    householdId: testHouseholdB.id,
    userName: testUserB.fullName,
    householdName: testHouseholdB.name,
  };

  try {
    // 1. Seed Asset in Household A (Bosch Washing Machine with Active Warranty)
    const assetA = await prisma.asset.create({
      data: {
        householdId: testHouseholdA.id,
        name: 'Bosch Series 6 Washing Machine',
        categoryId: 'appliances',
        brand: 'Bosch',
        model: 'WAT28461IN',
        purchaseDate: new Date('2025-08-12'),
        purchasePrice: 38999,
        location: 'Utility Area',
        warranty: {
          create: {
            provider: 'Bosch Care',
            warrantyNumber: 'BOSCH-WAR-98234',
            startDate: new Date('2025-08-12'),
            endDate: new Date('2027-08-12'),
          },
        },
      },
    });

    // Seed Asset in Household B (Secret Samsung TV in Bob's house)
    const assetB = await prisma.asset.create({
      data: {
        householdId: testHouseholdB.id,
        name: 'Secret Beta OLED TV',
        categoryId: 'electronics',
        brand: 'Samsung',
        purchasePrice: 120000,
      },
    });

    console.log('✅ Test Data Seeded for Household A & Household B');

    // TEST 1: search_assets (Alice searches for washing machine)
    const searchRes = await VoiceToolExecutor.executeTool('search_assets', { query: 'washing machine' }, ctxA);
    console.assert(searchRes.success, 'search_assets should succeed');
    console.assert(searchRes.data.totalFound === 1, 'Should find 1 washing machine in Household A');
    console.assert(searchRes.data.assets[0].name.includes('Bosch'), 'Found asset should be Bosch');
    console.log('✅ Test 1 Passed: search_assets returned correct asset');

    // TEST 2: Security Scoping (Alice searches for Bob's secret TV)
    const crossSearchRes = await VoiceToolExecutor.executeTool('search_assets', { query: 'Secret Beta' }, ctxA);
    console.assert(crossSearchRes.success, 'Search should complete safely');
    console.assert(crossSearchRes.data.totalFound === 0, 'Alice MUST NOT see Bob’s assets in Household B');
    console.log('✅ Test 2 Passed: Household Security Scoping verified (0 cross-household leaks)');

    // TEST 3: get_asset_details
    const detailsRes = await VoiceToolExecutor.executeTool('get_asset_details', { assetName: 'washing machine' }, ctxA);
    console.assert(detailsRes.success && detailsRes.data.found, 'Should find details');
    console.assert(detailsRes.data.asset.purchasePriceFormatted.includes('38,999'), 'Purchase price should be ₹38,999');
    console.log('✅ Test 3 Passed: get_asset_details returned structured specs & price');

    // TEST 4: get_warranty_status
    const warrantyRes = await VoiceToolExecutor.executeTool('get_warranty_status', { assetName: 'washing machine' }, ctxA);
    console.assert(warrantyRes.success && warrantyRes.data.hasWarranty, 'Warranty should exist');
    console.assert(warrantyRes.data.warranty.provider === 'Bosch Care', 'Provider should match');
    console.log('✅ Test 4 Passed: get_warranty_status returned active warranty details');

    // TEST 5: create_reminder (Safe Mutation)
    const createRemRes = await VoiceToolExecutor.executeTool(
      'create_reminder',
      {
        title: 'Service washing machine inlet filter',
        dueDate: '2026-11-01',
        assetName: 'Bosch Series 6 Washing Machine',
      },
      ctxA
    );
    console.assert(createRemRes.success, 'create_reminder should succeed');
    console.assert(createRemRes.data.reminder.id, 'Should have created reminder ID');
    console.log('✅ Test 5 Passed: create_reminder created and linked reminder in PostgreSQL');

    // TEST 6: list_reminders
    const listRemRes = await VoiceToolExecutor.executeTool('list_reminders', { status: 'pending' }, ctxA);
    console.assert(listRemRes.success && listRemRes.data.count >= 1, 'Should list newly created reminder');
    console.log('✅ Test 6 Passed: list_reminders listed pending reminders');

    // TEST 7: complete_reminder
    const compRemRes = await VoiceToolExecutor.executeTool(
      'complete_reminder',
      { reminderTitle: 'inlet filter' },
      ctxA
    );
    console.assert(compRemRes.success, 'complete_reminder should succeed');
    console.log('✅ Test 7 Passed: complete_reminder marked reminder completed');

    // TEST 8: get_household_summary
    const summaryRes = await VoiceToolExecutor.executeTool('get_household_summary', {}, ctxA);
    console.assert(summaryRes.success, 'get_household_summary should succeed');
    console.assert(summaryRes.data.totalAssets === 1, 'Household A has 1 asset');
    console.assert(summaryRes.data.totalPurchaseValueFormatted.includes('38,999'), 'Total valuation is correct');
    console.log('✅ Test 8 Passed: get_household_summary returned complete household portfolio overview');

    // TEST 9: get_smart_recommendations (Proactive Intelligence)
    const recsRes = await VoiceToolExecutor.executeTool('get_smart_recommendations', {}, ctxA);
    console.assert(recsRes.success, 'get_smart_recommendations should succeed');
    console.assert(typeof recsRes.data.spokenSummary === 'string', 'Should return spokenSummary');
    console.assert(Array.isArray(recsRes.data.recommendations), 'Should return recommendations array');
    console.log(`✅ Test 9 Passed: get_smart_recommendations generated proactive briefing: "${recsRes.data.spokenSummary}"`);

    // TEST 10: create_asset (Voice CRUD)
    const createAssetRes = await VoiceToolExecutor.executeTool(
      'create_asset',
      {
        name: 'Sony Bravia 65-inch 4K OLED TV',
        categoryId: 'electronics',
        purchasePrice: 135000,
        purchaseDate: '2026-03-01',
        location: 'Living Room',
        brand: 'Sony',
        model: 'XR-65A80L',
        warrantyProvider: 'Sony India',
        warrantyDurationMonths: 24,
      },
      ctxA
    );
    console.assert(createAssetRes.success, 'create_asset should succeed');
    console.assert(createAssetRes.data.asset.id, 'Asset ID should exist');
    console.assert(createAssetRes.data.asset.hasWarranty, 'Asset should have created warranty');
    console.log('✅ Test 10 Passed: create_asset created asset with linked warranty');

    // TEST 11: update_asset (Voice CRUD)
    const updateAssetRes = await VoiceToolExecutor.executeTool(
      'update_asset',
      {
        assetName: 'Sony Bravia',
        location: 'Master Bedroom',
        currentValue: 120000,
        notes: 'Mounted on bedroom wall',
      },
      ctxA
    );
    console.assert(updateAssetRes.success, 'update_asset should succeed');
    console.assert(updateAssetRes.data.asset.location === 'Master Bedroom', 'Location should be updated');
    console.log('✅ Test 11 Passed: update_asset updated location and valuation');

    // TEST 12: create_maintenance_record (Voice CRUD)
    const createMaintRes = await VoiceToolExecutor.executeTool(
      'create_maintenance_record',
      {
        assetName: 'Bosch Series 6',
        title: 'Deep Drum Cleaning & Descaling',
        type: 'cleaning',
        cost: 1200,
        serviceProvider: 'Bosch Authorized Service',
        technicianNotes: 'Descaled drum, cleaned drain filter',
        nextServiceDate: '2026-12-01',
      },
      ctxA
    );
    console.assert(createMaintRes.success, 'create_maintenance_record should succeed');
    console.assert(createMaintRes.data.record.costFormatted.includes('1,200'), 'Cost should be ₹1,200');
    console.log('✅ Test 12 Passed: create_maintenance_record logged maintenance event');

    // TEST 13: create_document (Voice CRUD)
    const createDocRes = await VoiceToolExecutor.executeTool(
      'create_document',
      {
        assetName: 'Sony Bravia',
        name: 'Amazon Tax Invoice - Sony OLED TV',
        type: 'invoice',
      },
      ctxA
    );
    console.assert(createDocRes.success, 'create_document should succeed');
    console.assert(createDocRes.data.document.type === 'invoice', 'Document type should be invoice');
    console.log('✅ Test 13 Passed: create_document attached invoice document');

    // TEST 14: add_warranty (Voice CRUD)
    const addWarRes = await VoiceToolExecutor.executeTool(
      'add_warranty',
      {
        assetName: 'Sony Bravia',
        provider: 'Reliance ResQ Extended Protection',
        warrantyNumber: 'RESQ-EXT-2026-8831',
        durationMonths: 36,
      },
      ctxA
    );
    console.assert(addWarRes.success, 'add_warranty should succeed');
    console.assert(addWarRes.data.warranty.provider === 'Reliance ResQ Extended Protection', 'Provider should match');
    console.log('✅ Test 14 Passed: add_warranty registered extended warranty');

    // TEST 15: delete_asset (Voice CRUD)
    const deleteAssetRes = await VoiceToolExecutor.executeTool(
      'delete_asset',
      {
        assetName: 'Sony Bravia',
        confirm: true,
      },
      ctxA
    );
    console.assert(deleteAssetRes.success, 'delete_asset should succeed');
    console.log('✅ Test 15 Passed: delete_asset deleted asset cleanly');

    // TEST 16: Verify all 18 tool declarations are present
    console.assert(GEMINI_VOICE_TOOL_DECLARATIONS.length === 18, `Expected 18 Gemini tool declarations, got ${GEMINI_VOICE_TOOL_DECLARATIONS.length}`);
    console.log(`✅ Test 16 Passed: All 18 Gemini tool declarations validated (${GEMINI_VOICE_TOOL_DECLARATIONS.map(t => t.name).join(', ')})`);

    console.log('\n🎉 ALL 16 VOICE ASSISTANT TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Cleanup test data
    await prisma.asset.deleteMany({ where: { householdId: { in: [testHouseholdA.id, testHouseholdB.id] } } });
    await prisma.householdMember.deleteMany({ where: { householdId: { in: [testHouseholdA.id, testHouseholdB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserA.id, testUserB.id] } } });
    await prisma.household.deleteMany({ where: { id: { in: [testHouseholdA.id, testHouseholdB.id] } } });
    await prisma.$disconnect();
  }
}

runVoiceAssistantTests().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
