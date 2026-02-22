import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { loadDatabaseConfig } from '../../config/database.config';
import { SEED_ORG_ID } from './fixtures/organizations';
import { SEED_ADMIN_ID, SEED_MANAGER_ID, SEED_CONTRACTOR_USER_ID } from './fixtures/users';
import {
  generateContractor,
  generateEngagement,
  generateTimeEntries,
  generateInvoice,
  generateDocument,
  generateNotification,
  randomPick,
  randomBetween,
  randomDateOnly,
} from './fixtures/generators';

const BCRYPT_ROUNDS = 12;
const CONTRACTOR_COUNT = 55;
const INVOICE_STATUS_DISTRIBUTION = ['draft', 'submitted', 'submitted', 'approved', 'approved', 'scheduled', 'paid', 'paid', 'paid', 'rejected'] as const;
const RISK_LEVELS = ['low', 'low', 'low', 'medium', 'medium', 'high', 'critical'] as const;
const NOTIFICATION_TYPES = [
  'invoice_submitted', 'invoice_approved', 'invoice_rejected',
  'invoice_paid', 'classification_risk_change', 'offboarding_started',
  'document_expiring',
] as const;

async function demoSeed() {
  const config = loadDatabaseConfig();
  const pool = new Pool(config.pool);

  console.log('Running demo seed (large dataset)...\n');

  try {
    // Clean all data
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM offboarding_checklist_items');
    await pool.query('DELETE FROM offboarding_workflows');
    await pool.query('DELETE FROM equipment');
    await pool.query('DELETE FROM approval_steps');
    await pool.query('DELETE FROM invoice_status_history');
    await pool.query('DELETE FROM invoice_line_items');
    await pool.query('DELETE FROM invoices');
    await pool.query('DELETE FROM time_entries');
    await pool.query('DELETE FROM engagements');
    await pool.query('DELETE FROM onboarding_steps');
    await pool.query('DELETE FROM contractor_status_history');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM audit_events');
    await pool.query('DELETE FROM classification_factors');
    await pool.query('DELETE FROM classification_assessments');
    await pool.query('DELETE FROM tax_documents');
    await pool.query('DELETE FROM contractors');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM organizations');
    console.log('Cleared existing data');

    // Organization
    await pool.query(
      `INSERT INTO organizations (id, name, slug, settings) VALUES ($1, $2, $3, $4)`,
      [SEED_ORG_ID, 'Acme Corp', 'acme-corp', JSON.stringify({})],
    );
    console.log('Inserted 1 organization');

    // Users
    const hash = await bcrypt.hash('Password1', BCRYPT_ROUNDS);
    const users = [
      { id: SEED_ADMIN_ID, email: 'admin@acme-corp.com', role: 'admin', firstName: 'Sarah', lastName: 'Chen' },
      { id: SEED_MANAGER_ID, email: 'manager@acme-corp.com', role: 'manager', firstName: 'Michael', lastName: 'Torres' },
      { id: SEED_CONTRACTOR_USER_ID, email: 'john.smith@example.com', role: 'contractor', firstName: 'John', lastName: 'Smith' },
    ];
    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, organization_id, email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [u.id, SEED_ORG_ID, u.email, hash, u.role, u.firstName, u.lastName],
      );
    }
    console.log(`Inserted ${users.length} users`);

    // Contractors
    const contractors = Array.from({ length: CONTRACTOR_COUNT }, (_, i) =>
      generateContractor(SEED_ORG_ID, i),
    );
    const activeContractorIds: string[] = [];

    for (const c of contractors) {
      const activatedAt = ['active', 'suspended'].includes(c.status)
        ? new Date(Date.now() - 30 * 86_400_000).toISOString()
        : null;

      await pool.query(
        `INSERT INTO contractors (
          id, organization_id, email, first_name, last_name, status, type,
          phone, city, state, zip_code, country,
          tin_last_four, bank_name, bank_account_last_four, bank_verified,
          activated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          c.id, c.organizationId, c.email, c.firstName, c.lastName, c.status, c.type,
          c.phone ?? null, c.city ?? null, c.state ?? null, c.zipCode ?? null, c.country,
          c.tinLastFour ?? null, c.bankName ?? null, c.bankAccountLastFour ?? null, c.bankVerified,
          activatedAt,
        ],
      );

      await pool.query(
        `INSERT INTO contractor_status_history (contractor_id, status, changed_by, reason, effective_from)
         VALUES ($1, $2, $3, $4, $5)`,
        [c.id, c.status, SEED_ADMIN_ID, 'Seeded', new Date().toISOString()],
      );

      // Onboarding steps
      const stepTypes = ['invite_accepted', 'tax_form_submitted', 'contract_signed', 'bank_details_submitted'];
      const statusToCompleted: Record<string, number> = {
        invite_sent: 0, tax_form_pending: 1, contract_pending: 2,
        bank_details_pending: 3, active: 4, suspended: 4, offboarded: 4,
      };
      const completedCount = statusToCompleted[c.status] ?? 0;
      for (let i = 0; i < stepTypes.length; i++) {
        await pool.query(
          `INSERT INTO onboarding_steps (contractor_id, step_type, status, completed_at)
           VALUES ($1, $2, $3, $4)`,
          [c.id, stepTypes[i], i < completedCount ? 'completed' : 'pending', i < completedCount ? new Date().toISOString() : null],
        );
      }

      if (c.status === 'active' || c.status === 'suspended') {
        activeContractorIds.push(c.id);
      }
    }
    // Link first contractor to user account
    await pool.query(`UPDATE contractors SET user_id = $1 WHERE id = $2`, [SEED_CONTRACTOR_USER_ID, contractors[0]!.id]);
    console.log(`Inserted ${CONTRACTOR_COUNT} contractors`);

    // Engagements
    let engagementCount = 0;
    const engagementMap: Array<{ id: string; contractorId: string }> = [];
    for (const cId of activeContractorIds) {
      const count = randomBetween(1, 3);
      for (let i = 0; i < count; i++) {
        const eng = generateEngagement(cId, SEED_ORG_ID, engagementCount);
        await pool.query(
          `INSERT INTO engagements (id, contractor_id, organization_id, title, description,
            start_date, end_date, hourly_rate, fixed_rate, currency, payment_terms, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [eng.id, eng.contractorId, eng.organizationId, eng.title, eng.description,
            eng.startDate, eng.endDate, eng.hourlyRate, eng.fixedRate, eng.currency, eng.paymentTerms, eng.status],
        );
        if (eng.status === 'active') {
          engagementMap.push({ id: eng.id, contractorId: cId });
        }
        engagementCount++;
      }
    }
    console.log(`Inserted ${engagementCount} engagements`);

    // Time entries
    let timeEntryCount = 0;
    for (const eng of engagementMap) {
      const entries = generateTimeEntries(eng.contractorId, eng.id, randomBetween(5, 15));
      for (const t of entries) {
        await pool.query(
          `INSERT INTO time_entries (id, contractor_id, engagement_id, entry_date, hours, description)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [t.id, t.contractorId, t.engagementId, t.entryDate, t.hours, t.description],
        );
        timeEntryCount++;
      }
    }
    console.log(`Inserted ${timeEntryCount} time entries`);

    // Invoices
    let invoiceNum = 0;
    let invoiceCount = 0;
    for (const eng of engagementMap) {
      const count = randomBetween(2, 5);
      for (let i = 0; i < count; i++) {
        invoiceNum++;
        const status = randomPick(INVOICE_STATUS_DISTRIBUTION);
        const inv = generateInvoice(eng.contractorId, eng.id, SEED_ORG_ID, invoiceNum, status);

        await pool.query(
          `INSERT INTO invoices (id, contractor_id, engagement_id, organization_id,
            invoice_number, status, submitted_at, approved_at, scheduled_at, paid_at,
            due_date, notes, period_start, period_end)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [inv.id, inv.contractorId, inv.engagementId, inv.organizationId,
            inv.invoiceNumber, inv.status, inv.submittedAt, inv.approvedAt, inv.scheduledAt, inv.paidAt,
            inv.dueDate, inv.notes, inv.periodStart, inv.periodEnd],
        );

        for (let j = 0; j < inv.lineItems.length; j++) {
          const item = inv.lineItems[j]!;
          await pool.query(
            `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, sort_order)
             VALUES ($1,$2,$3,$4,$5)`,
            [inv.id, item.description, item.quantity, item.unitPrice, j],
          );
        }

        await pool.query(
          `UPDATE invoices SET
            subtotal = (SELECT COALESCE(SUM(amount),0) FROM invoice_line_items WHERE invoice_id = $1),
            total_amount = (SELECT COALESCE(SUM(amount),0) FROM invoice_line_items WHERE invoice_id = $1) + tax_amount
           WHERE id = $1`,
          [inv.id],
        );

        invoiceCount++;
      }
    }
    console.log(`Inserted ${invoiceCount} invoices`);

    // Documents
    let docCount = 0;
    for (const cId of activeContractorIds.slice(0, 40)) {
      const count = randomBetween(1, 3);
      for (let i = 0; i < count; i++) {
        const doc = generateDocument(cId, SEED_ORG_ID, SEED_ADMIN_ID, docCount);
        await pool.query(
          `INSERT INTO tax_documents (id, contractor_id, organization_id, document_type, file_path, file_name,
            file_size_bytes, mime_type, uploaded_by, expires_at, tin_last_four, is_current, version, notes)
           VALUES ($1,$2,$3,$4::tax_document_type,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [doc.id, doc.contractorId, doc.organizationId, doc.documentType, doc.filePath, doc.fileName,
            doc.fileSizeBytes, doc.mimeType, doc.uploadedBy, doc.expiresAt, doc.tinLastFour, doc.isCurrent, doc.version, doc.notes],
        );
        docCount++;
      }
    }
    console.log(`Inserted ${docCount} documents`);

    // Classification assessments
    let assessmentCount = 0;
    for (const cId of activeContractorIds.slice(0, 35)) {
      const riskLevel = randomPick(RISK_LEVELS);
      const score = riskLevel === 'low' ? randomBetween(10, 30) : riskLevel === 'medium' ? randomBetween(31, 55) : riskLevel === 'high' ? randomBetween(56, 75) : randomBetween(76, 100);

      await pool.query(
        `INSERT INTO classification_assessments (id, contractor_id, organization_id, overall_risk, overall_score,
          irs_score, irs_factors, dol_score, dol_factors, abc_score, abc_factors, input_data)
         VALUES ($1,$2,$3,$4::risk_level,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          randomUUID(), cId, SEED_ORG_ID, riskLevel, score,
          randomBetween(10, 80), JSON.stringify({ behavioral_control: { score: randomBetween(5, 30), max: 40, factors: {} }, financial_control: { score: randomBetween(5, 20), max: 30, factors: {} }, relationship_type: { score: randomBetween(5, 20), max: 30, factors: {} } }),
          randomBetween(10, 80), JSON.stringify({}),
          randomBetween(10, 80), JSON.stringify({ prong_a: { passed: Math.random() > 0.5, weight: 34, score: randomBetween(0, 34) }, prong_b: { passed: Math.random() > 0.5, weight: 33, score: randomBetween(0, 33) }, prong_c: { passed: Math.random() > 0.5, weight: 33, score: randomBetween(0, 33) } }),
          JSON.stringify({ hoursPerWeek: randomBetween(10, 50) }),
        ],
      );
      assessmentCount++;
    }
    console.log(`Inserted ${assessmentCount} classification assessments`);

    // Classification factors
    const factorCategories = ['set_schedule', 'tools_provided', 'training_provided', 'supervision_level', 'profit_loss_opportunity'] as const;
    let factorCount = 0;
    for (const cId of activeContractorIds.slice(0, 20)) {
      const count = randomBetween(2, 5);
      for (let i = 0; i < count; i++) {
        await pool.query(
          `INSERT INTO classification_factors (contractor_id, category, boolean_value, period_start, period_end, source)
           VALUES ($1, $2::factor_category, $3, $4, $5, $6::factor_source)`,
          [cId, randomPick(factorCategories), Math.random() > 0.5, '2025-01-01', '2025-12-31', 'manual'],
        );
        factorCount++;
      }
    }
    console.log(`Inserted ${factorCount} classification factors`);

    // Equipment
    let equipmentCount = 0;
    for (const cId of activeContractorIds.slice(0, 15)) {
      const items = ['MacBook Pro 14"', 'Dell Monitor 27"', 'Ergonomic Keyboard', 'Webcam HD', 'USB-C Dock'];
      await pool.query(
        `INSERT INTO equipment (id, contractor_id, organization_id, description, serial_number, status)
         VALUES ($1,$2,$3,$4,$5,$6::equipment_status)`,
        [randomUUID(), cId, SEED_ORG_ID, randomPick(items), `SN-${randomBetween(10000, 99999)}`, randomPick(['assigned', 'assigned', 'returned'])],
      );
      equipmentCount++;
    }
    console.log(`Inserted ${equipmentCount} equipment items`);

    // Offboarding workflows
    const offboardReasons = ['project_completed', 'budget_cut', 'performance', 'mutual_agreement', 'compliance_risk'] as const;
    const offboardStatuses = ['initiated', 'in_progress', 'pending_final_invoice', 'completed', 'cancelled'] as const;
    let offboardCount = 0;
    for (const cId of activeContractorIds.slice(0, 5)) {
      const workflowId = randomUUID();
      const status = offboardStatuses[offboardCount % offboardStatuses.length]!;
      await pool.query(
        `INSERT INTO offboarding_workflows (id, contractor_id, organization_id, initiated_by, reason, effective_date, status, notes)
         VALUES ($1,$2,$3,$4,$5::offboarding_reason,$6,$7::offboarding_status,$8)`,
        [workflowId, cId, SEED_ORG_ID, SEED_ADMIN_ID, randomPick(offboardReasons), randomDateOnly(30, 0), status, null],
      );

      const checklistTypes = ['revoke_system_access', 'revoke_code_repo_access', 'revoke_communication_tools',
        'retrieve_equipment', 'process_final_invoice', 'archive_documents',
        'freeze_tax_data', 'exit_interview', 'remove_from_tools'] as const;
      for (const itemType of checklistTypes) {
        await pool.query(
          `INSERT INTO offboarding_checklist_items (workflow_id, item_type, status)
           VALUES ($1,$2::checklist_item_type,$3::checklist_status)`,
          [workflowId, itemType, status === 'completed' ? 'completed' : (Math.random() > 0.6 ? 'completed' : 'pending')],
        );
      }
      offboardCount++;
    }
    console.log(`Inserted ${offboardCount} offboarding workflows`);

    // Notifications
    const notifData = [
      ...Array.from({ length: 20 }, () => generateNotification(
        SEED_ADMIN_ID,
        randomPick(NOTIFICATION_TYPES),
        'Invoice Activity',
        `Invoice INV-2025-${String(randomBetween(1, invoiceNum)).padStart(3, '0')} status changed`,
        { invoiceNumber: `INV-2025-${String(randomBetween(1, invoiceNum)).padStart(3, '0')}` },
      )),
      ...Array.from({ length: 15 }, () => generateNotification(
        SEED_MANAGER_ID,
        randomPick(NOTIFICATION_TYPES),
        'System Notification',
        'A system event occurred',
      )),
      ...Array.from({ length: 15 }, () => generateNotification(
        SEED_CONTRACTOR_USER_ID,
        randomPick(['invoice_approved', 'invoice_paid', 'invoice_rejected']),
        'Invoice Update',
        'Your invoice has been updated',
      )),
    ];
    for (const n of notifData) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data)
         VALUES ($1,$2::notification_type,$3,$4,$5)`,
        [n.userId, n.type, n.title, n.body, JSON.stringify(n.data)],
      );
    }
    console.log(`Inserted ${notifData.length} notifications`);

    // Refresh materialized view
    await pool.query('REFRESH MATERIALIZED VIEW mv_classification_risk_summary');
    console.log('Refreshed classification risk summary materialized view');

    console.log('\nDemo seed complete!');
    console.log(`Summary: ${CONTRACTOR_COUNT} contractors, ${engagementCount} engagements, ${timeEntryCount} time entries, ${invoiceCount} invoices, ${docCount} documents, ${assessmentCount} assessments, ${offboardCount} offboarding workflows, ${notifData.length} notifications`);
    console.log('\nLogin credentials:');
    console.log('  admin: admin@acme-corp.com / Password1');
    console.log('  manager: manager@acme-corp.com / Password1');
    console.log('  contractor: john.smith@example.com / Password1');
  } finally {
    await pool.end();
  }
}

demoSeed().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
