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
  generateContractorDocuments,
  generateAuditEvents,
  generateNotification,
  randomPick,
  randomBetween,
  randomBool,
  randomDateOnly,
} from './fixtures/generators';
import type { ComplianceBucket } from './fixtures/generators';

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
      [SEED_ORG_ID, 'Acme Corp', 'acme-corp', JSON.stringify({ defaultPaymentTerms: 'net_30', defaultCurrency: 'USD', reminderDays: [7, 3, 1] })],
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
    interface OnboardedContractor {
      id: string;
      type: 'domestic' | 'foreign';
      tinLastFour: string | null;
      name: string;
      createdAt: string;
      status: string;
    }
    const onboardedContractors: OnboardedContractor[] = [];

    for (let ci = 0; ci < contractors.length; ci++) {
      const c = contractors[ci]!;
      // Spread contractor created_at across last 6 months for growth chart
      const monthsAgo = Math.floor(ci / Math.ceil(contractors.length / 6));
      const createdDaysAgo = monthsAgo * 30 + randomBetween(1, 28);
      const createdAt = new Date(Date.now() - createdDaysAgo * 86_400_000).toISOString();
      const activatedAt = ['active', 'suspended'].includes(c.status)
        ? new Date(Date.now() - Math.max(createdDaysAgo - 5, 1) * 86_400_000).toISOString()
        : null;

      await pool.query(
        `INSERT INTO contractors (
          id, organization_id, email, first_name, last_name, status, type,
          phone, city, state, zip_code, country,
          tin_last_four, bank_name, bank_account_last_four, bank_verified,
          activated_at, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          c.id, c.organizationId, c.email, c.firstName, c.lastName, c.status, c.type,
          c.phone ?? null, c.city ?? null, c.state ?? null, c.zipCode ?? null, c.country,
          c.tinLastFour ?? null, c.bankName ?? null, c.bankAccountLastFour ?? null, c.bankVerified,
          activatedAt, createdAt,
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
        onboardedContractors.push({
          id: c.id,
          type: c.type,
          tinLastFour: c.tinLastFour ?? null,
          name: `${c.firstName} ${c.lastName}`,
          createdAt,
          status: c.status,
        });
      }
    }
    // Link first contractor to the contractor user account, and align its
    // identity with that user (John Smith / john.smith@example.com) so every
    // screen — portal greeting, sidebar, profile, contractor record — agrees.
    const linkedContractorId = contractors[0]!.id;
    await pool.query(
      `UPDATE contractors
       SET user_id = $1, first_name = 'John', last_name = 'Smith', email = 'john.smith@example.com'
       WHERE id = $2`,
      [SEED_CONTRACTOR_USER_ID, linkedContractorId],
    );
    // Keep the in-memory refs (used by audit/invoice name lookups, built
    // below) consistent with the renamed contractor.
    const linkedOnboarded = onboardedContractors.find((o) => o.id === linkedContractorId);
    if (linkedOnboarded) {
      linkedOnboarded.name = 'John Smith';
    }
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

    // Invoices — spread across last 6 months for rich chart data
    const contractorNameById = new Map(
      onboardedContractors.map((c) => [c.id, c.name] as const),
    );
    const invoiceRefs: Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      contractorName: string;
      submittedAt: string | null;
      approvedAt: string | null;
      scheduledAt: string | null;
      paidAt: string | null;
    }> = [];
    let invoiceNum = 0;
    let invoiceCount = 0;
    const PAID_MONTHS = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 5]; // weighted toward recent months
    for (const eng of engagementMap) {
      const count = randomBetween(2, 5);
      for (let i = 0; i < count; i++) {
        invoiceNum++;
        const status = randomPick(INVOICE_STATUS_DISTRIBUTION);
        // For paid invoices, distribute across months; others use recent dates
        const monthsAgo = status === 'paid' ? randomPick(PAID_MONTHS) : randomBetween(0, 1);
        const inv = generateInvoice(eng.contractorId, eng.id, SEED_ORG_ID, invoiceNum, status, monthsAgo);

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

        // Status history + approval steps so the Invoice detail panels are
        // populated and consistent with the Details dates (a Paid invoice
        // must not show "No status history yet").
        if (inv.status !== 'draft' && inv.submittedAt) {
          const history: Array<[string | null, string, string]> = [
            ['draft', 'submitted', inv.submittedAt],
          ];
          if (inv.approvedAt) history.push(['submitted', 'approved', inv.approvedAt]);
          if (inv.scheduledAt) history.push(['approved', 'scheduled', inv.scheduledAt]);
          if (inv.paidAt) history.push(['scheduled', 'paid', inv.paidAt]);
          if (inv.status === 'rejected') {
            const rejectedAt = new Date(
              new Date(inv.submittedAt).getTime() + 86_400_000,
            ).toISOString();
            history.push(['submitted', 'rejected', rejectedAt]);
          }
          for (const [from, to, at] of history) {
            const changedBy = to === 'submitted' ? SEED_MANAGER_ID : SEED_ADMIN_ID;
            await pool.query(
              `INSERT INTO invoice_status_history (invoice_id, from_status, to_status, changed_by, reason, created_at)
               VALUES ($1,$2::invoice_status,$3::invoice_status,$4,$5,$6)`,
              [inv.id, from, to, changedBy, to === 'rejected' ? 'Amounts require revision' : null, at],
            );
          }

          // Every invoice that reached approval (or beyond) gets a decided
          // approval step; rejected ones get a rejected step.
          if (inv.approvedAt) {
            await pool.query(
              `INSERT INTO approval_steps (invoice_id, approver_id, step_order, decision, decided_at, notes, created_at)
               VALUES ($1,$2,1,'approved'::approval_decision,$3,$4,$5)`,
              [inv.id, SEED_ADMIN_ID, inv.approvedAt, 'Approved for payment', inv.submittedAt],
            );
          } else if (inv.status === 'rejected') {
            const rejectedAt = new Date(
              new Date(inv.submittedAt).getTime() + 86_400_000,
            ).toISOString();
            await pool.query(
              `INSERT INTO approval_steps (invoice_id, approver_id, step_order, decision, decided_at, notes, created_at)
               VALUES ($1,$2,1,'rejected'::approval_decision,$3,$4,$5)`,
              [inv.id, SEED_ADMIN_ID, rejectedAt, 'Amounts require revision', inv.submittedAt],
            );
          }
        }

        invoiceRefs.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          contractorName: contractorNameById.get(eng.contractorId) ?? 'Contractor',
          submittedAt: inv.submittedAt,
          approvedAt: inv.approvedAt,
          scheduledAt: inv.scheduledAt,
          paidAt: inv.paidAt,
        });

        invoiceCount++;
      }
    }
    console.log(`Inserted ${invoiceCount} invoices`);

    // Documents — coherent compliance distribution across onboarded contractors.
    // ~70% fully compliant, ~15% compliant-but-expiring (still compliant, drives
    // the "expiring soon" alerts), ~15% missing exactly one required document.
    // The bucket is deterministic by index so the org-wide compliance rate is
    // stable across reseeds (~85%).
    function bucketForIndex(i: number): ComplianceBucket {
      const m = i % 7;
      if (m === 6) return 'noncompliant';
      if (m === 5) return 'expiring';
      return 'compliant';
    }
    let docCount = 0;
    const complianceTally: Record<ComplianceBucket, number> = {
      compliant: 0,
      expiring: 0,
      noncompliant: 0,
    };
    for (let oi = 0; oi < onboardedContractors.length; oi++) {
      const oc = onboardedContractors[oi]!;
      const bucket = bucketForIndex(oi);
      complianceTally[bucket]++;
      const docs = generateContractorDocuments(
        oc.id,
        SEED_ORG_ID,
        SEED_ADMIN_ID,
        oc.type,
        bucket,
        oi,
        oc.tinLastFour,
      );
      for (const doc of docs) {
        await pool.query(
          `INSERT INTO tax_documents (id, contractor_id, organization_id, document_type, file_path, file_name,
            file_size_bytes, mime_type, uploaded_by, expires_at, tin_last_four, is_current, version, notes, created_at)
           VALUES ($1,$2,$3,$4::tax_document_type,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [doc.id, doc.contractorId, doc.organizationId, doc.documentType, doc.filePath, doc.fileName,
            doc.fileSizeBytes, doc.mimeType, doc.uploadedBy, doc.expiresAt, doc.tinLastFour, doc.isCurrent, doc.version, doc.notes, doc.createdAt],
        );
        docCount++;
      }
    }
    const complianceRate = onboardedContractors.length
      ? Math.round(
          ((complianceTally.compliant + complianceTally.expiring) /
            onboardedContractors.length) *
            100,
        )
      : 0;
    console.log(
      `Inserted ${docCount} documents across ${onboardedContractors.length} onboarded contractors ` +
        `(compliant ${complianceTally.compliant}, expiring ${complianceTally.expiring}, ` +
        `non-compliant ${complianceTally.noncompliant} → ~${complianceRate}% compliance rate)`,
    );

    // Classification assessments — the gauge (overall) must agree with its
    // own Test Scores. Pick a target tier, derive the three component scores
    // within that tier's band, then compute the weighted overall and re-derive
    // the risk level from the canonical thresholds so they can never disagree.
    const TIER_BANDS: Record<string, [number, number]> = {
      low: [8, 28],
      medium: [33, 53],
      high: [58, 73],
      critical: [78, 98],
    };
    const riskFromScore = (s: number): 'low' | 'medium' | 'high' | 'critical' =>
      s <= 30 ? 'low' : s <= 55 ? 'medium' : s <= 75 ? 'high' : 'critical';
    // Split a target subtotal into n positive parts that sum exactly to it.
    const splitScore = (total: number, parts: number): number[] => {
      const out: number[] = [];
      let remaining = total;
      for (let p = 0; p < parts; p++) {
        if (p === parts - 1) {
          out.push(Math.max(0, remaining));
        } else {
          const slice = Math.round(remaining / (parts - p));
          out.push(Math.max(0, slice));
          remaining -= slice;
        }
      }
      return out;
    };
    let assessmentCount = 0;
    for (const cId of activeContractorIds.slice(0, 35)) {
      const tier = randomPick(RISK_LEVELS);
      const [lo, hi] = TIER_BANDS[tier]!;
      const irsScore = randomBetween(lo, hi);
      const dolScore = randomBetween(lo, hi);
      const abcScore = randomBetween(lo, hi);
      const overallScore = Math.round(irsScore * 0.4 + dolScore * 0.3 + abcScore * 0.3);
      const overallRisk = riskFromScore(overallScore);

      // IRS factors: three groups (max 40/30/30) whose scores sum to irsScore.
      const [irsBehavioral, irsFinancial, irsRelationship] = splitScore(irsScore, 3);
      // ABC factors: three prongs whose scores sum to abcScore.
      const [abcA, abcB, abcC] = splitScore(abcScore, 3);

      // Spread assessed_at over roughly the last 45 days (always in the past).
      const assessedAt = new Date(
        Date.now() - randomBetween(1, 45) * 86_400_000 - randomBetween(0, 23) * 3_600_000,
      ).toISOString();

      await pool.query(
        `INSERT INTO classification_assessments (id, contractor_id, organization_id, assessed_at, overall_risk, overall_score,
          irs_score, irs_factors, dol_score, dol_factors, abc_score, abc_factors, input_data)
         VALUES ($1,$2,$3,$4,$5::risk_level,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          randomUUID(), cId, SEED_ORG_ID, assessedAt, overallRisk, overallScore,
          irsScore, JSON.stringify({
            behavioral_control: { score: Math.min(irsBehavioral!, 40), max: 40, factors: {} },
            financial_control: { score: Math.min(irsFinancial!, 30), max: 30, factors: {} },
            relationship_type: { score: Math.min(irsRelationship!, 30), max: 30, factors: {} },
          }),
          dolScore, JSON.stringify({ score: dolScore, max: 100, factors: {} }),
          abcScore, JSON.stringify({
            prong_a: { passed: abcA! < 12, weight: 34, score: Math.min(abcA!, 34) },
            prong_b: { passed: abcB! < 11, weight: 33, score: Math.min(abcB!, 33) },
            prong_c: { passed: abcC! < 11, weight: 33, score: Math.min(abcC!, 33) },
          }),
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
          [cId, randomPick(factorCategories), randomBool(), '2025-01-01', '2025-12-31', 'manual'],
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
    const offboardingIds: string[] = [];
    for (const cId of activeContractorIds.slice(0, 5)) {
      const workflowId = randomUUID();
      offboardingIds.push(workflowId);
      const status = offboardStatuses[offboardCount % offboardStatuses.length]!;
      const effectiveDate = randomDateOnly(30, 0);
      await pool.query(
        `INSERT INTO offboarding_workflows (id, contractor_id, organization_id, initiated_by, reason, effective_date, status, notes)
         VALUES ($1,$2,$3,$4,$5::offboarding_reason,$6,$7::offboarding_status,$8)`,
        [workflowId, cId, SEED_ORG_ID, SEED_ADMIN_ID, randomPick(offboardReasons), effectiveDate, status, null],
      );

      // A completed offboarding means the contractor has truly left — flip
      // their status so the Contractors list / dashboard don't contradict the
      // workflow. The checklist items are all 'completed' in this branch.
      if (status === 'completed') {
        await pool.query(
          `UPDATE contractors SET status = 'offboarded', offboarded_at = $2 WHERE id = $1`,
          [cId, new Date(`${effectiveDate}T12:00:00.000Z`).toISOString()],
        );
        await pool.query(
          `UPDATE contractor_status_history SET effective_until = now()
           WHERE contractor_id = $1 AND effective_until IS NULL`,
          [cId],
        );
        await pool.query(
          `INSERT INTO contractor_status_history (contractor_id, status, changed_by, reason, effective_from)
           VALUES ($1, 'offboarded', $2, 'Offboarding completed', $3)`,
          [cId, SEED_ADMIN_ID, new Date(`${effectiveDate}T12:00:00.000Z`).toISOString()],
        );
      }

      const checklistTypes = ['revoke_system_access', 'revoke_code_repo_access', 'revoke_communication_tools',
        'retrieve_equipment', 'process_final_invoice', 'archive_documents',
        'freeze_tax_data', 'exit_interview', 'remove_from_tools'] as const;
      for (const itemType of checklistTypes) {
        await pool.query(
          `INSERT INTO offboarding_checklist_items (workflow_id, item_type, status)
           VALUES ($1,$2::checklist_item_type,$3::checklist_status)`,
          [workflowId, itemType, status === 'completed' ? 'completed' : (randomBool(0.4) ? 'completed' : 'pending')],
        );
      }
      offboardCount++;
    }
    console.log(`Inserted ${offboardCount} offboarding workflows`);

    // Notifications — reference REAL invoice numbers from the seeded set so a
    // notification never points at an invoice that doesn't exist, and spread
    // created_at over the trailing ~14 days (handled in generateNotification).
    const realInvoices = invoiceRefs.length > 0 ? invoiceRefs : null;
    const pickInvoiceNumber = (): string =>
      realInvoices ? randomPick(realInvoices).invoiceNumber : 'INV-2026-001';
    const notifData = [
      ...Array.from({ length: 20 }, () => {
        const invNo = pickInvoiceNumber();
        return generateNotification(
          SEED_ADMIN_ID,
          randomPick(NOTIFICATION_TYPES),
          'Invoice Activity',
          `Invoice ${invNo} status changed`,
          { invoiceNumber: invNo },
        );
      }),
      ...Array.from({ length: 15 }, () => generateNotification(
        SEED_MANAGER_ID,
        randomPick(NOTIFICATION_TYPES),
        'System Notification',
        'A system event occurred',
      )),
      ...Array.from({ length: 15 }, () => {
        const invNo = pickInvoiceNumber();
        return generateNotification(
          SEED_CONTRACTOR_USER_ID,
          randomPick(['invoice_approved', 'invoice_paid', 'invoice_rejected']),
          'Invoice Update',
          `Your invoice ${invNo} has been updated`,
          { invoiceNumber: invNo },
        );
      }),
    ];
    for (const n of notifData) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, data, created_at)
         VALUES ($1,$2::notification_type,$3,$4,$5,$6)`,
        [n.userId, n.type, n.title, n.body, JSON.stringify(n.data), n.createdAt],
      );
    }
    console.log(`Inserted ${notifData.length} notifications`);

    // Audit events — a believable activity stream over the trailing ~75 days.
    const auditEvents = generateAuditEvents(
      [
        { id: SEED_ADMIN_ID, email: 'admin@acme-corp.com', role: 'admin' },
        { id: SEED_MANAGER_ID, email: 'manager@acme-corp.com', role: 'manager' },
        { id: SEED_CONTRACTOR_USER_ID, email: 'john.smith@example.com', role: 'contractor' },
      ],
      onboardedContractors.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        status: c.status,
      })),
      invoiceRefs,
      offboardingIds,
    );
    for (const ev of auditEvents) {
      await pool.query(
        `INSERT INTO audit_events
          (organization_id, user_id, entity_type, entity_id, action, old_values, new_values, ip_address, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::inet,$9)`,
        [
          SEED_ORG_ID,
          ev.userId,
          ev.entityType,
          ev.entityId,
          ev.action,
          ev.oldValues ? JSON.stringify(ev.oldValues) : null,
          ev.newValues ? JSON.stringify(ev.newValues) : null,
          ev.ipAddress,
          ev.createdAt,
        ],
      );
    }
    console.log(`Inserted ${auditEvents.length} audit events`);

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
