import express from 'express';
import { isDatabaseReady, logAudit, query } from '../db.js';
import { authorize, requireBaseAccess, scopedBaseId, ROLES } from '../middleware/rbac.js';
import { adjustInventory } from '../services/inventory.js';

export const apiRouter = express.Router();

function applyCommanderBase(req, requestedBaseId) {
  const scoped = scopedBaseId(req);
  if (scoped) return scoped;
  return requestedBaseId ? Number(requestedBaseId) : null;
}

async function loadDashboard(req) {
  const startDate = req.query.startDate || req.query.date || null;
  const endDate = req.query.endDate || null;
  const equipmentTypeId = req.query.equipmentTypeId ? Number(req.query.equipmentTypeId) : null;
  const baseId = applyCommanderBase(req, req.query.baseId);

  const params = [];
  const push = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  const baseClause = (column) => (baseId ? `AND ${column} = ${push(baseId)}` : '');
  const typeClause = (column) => (equipmentTypeId ? `AND ${column} = ${push(equipmentTypeId)}` : '');

  const openingResult = await query(
    `SELECT COALESCE(SUM(opening_balance), 0)::int AS opening
     FROM inventory
     WHERE 1=1 ${baseClause('base_id')} ${typeClause('equipment_type_id')}`,
    params
  );

  const purchaseParams = [];
  const pushP = (value) => {
    purchaseParams.push(value);
    return `$${purchaseParams.length}`;
  };
  const purchaseWhere = [
    '1=1',
    baseId ? `p.base_id = ${pushP(baseId)}` : null,
    equipmentTypeId ? `p.equipment_type_id = ${pushP(equipmentTypeId)}` : null,
    startDate ? `p.purchase_date >= ${pushP(startDate)}` : null,
    endDate ? `p.purchase_date <= ${pushP(`${endDate}T23:59:59`)}` : null,
  ].filter(Boolean).join(' AND ');

  const purchasesResult = await query(
    `SELECT COALESCE(SUM(p.quantity), 0)::int AS total FROM purchases p WHERE ${purchaseWhere}`,
    purchaseParams
  );

  const transferInParams = [];
  const pushIn = (value) => {
    transferInParams.push(value);
    return `$${transferInParams.length}`;
  };
  const transferInWhere = [
    '1=1',
    baseId ? `t.to_base_id = ${pushIn(baseId)}` : null,
    equipmentTypeId ? `t.equipment_type_id = ${pushIn(equipmentTypeId)}` : null,
    startDate ? `t.transfer_date >= ${pushIn(startDate)}` : null,
    endDate ? `t.transfer_date <= ${pushIn(`${endDate}T23:59:59`)}` : null,
  ].filter(Boolean).join(' AND ');

  const transferInResult = await query(
    `SELECT COALESCE(SUM(t.quantity), 0)::int AS total FROM transfers t WHERE ${transferInWhere}`,
    transferInParams
  );

  const transferOutParams = [];
  const pushOut = (value) => {
    transferOutParams.push(value);
    return `$${transferOutParams.length}`;
  };
  const transferOutWhere = [
    '1=1',
    baseId ? `t.from_base_id = ${pushOut(baseId)}` : null,
    equipmentTypeId ? `t.equipment_type_id = ${pushOut(equipmentTypeId)}` : null,
    startDate ? `t.transfer_date >= ${pushOut(startDate)}` : null,
    endDate ? `t.transfer_date <= ${pushOut(`${endDate}T23:59:59`)}` : null,
  ].filter(Boolean).join(' AND ');

  const transferOutResult = await query(
    `SELECT COALESCE(SUM(t.quantity), 0)::int AS total FROM transfers t WHERE ${transferOutWhere}`,
    transferOutParams
  );

  const assignedParams = [];
  const pushA = (value) => {
    assignedParams.push(value);
    return `$${assignedParams.length}`;
  };
  const assignedWhere = [
    '1=1',
    baseId ? `a.base_id = ${pushA(baseId)}` : null,
    equipmentTypeId ? `a.equipment_type_id = ${pushA(equipmentTypeId)}` : null,
    startDate ? `a.assigned_at >= ${pushA(startDate)}` : null,
    endDate ? `a.assigned_at <= ${pushA(`${endDate}T23:59:59`)}` : null,
  ].filter(Boolean).join(' AND ');

  const assignedResult = await query(
    `SELECT COALESCE(SUM(a.quantity), 0)::int AS total FROM assignments a WHERE ${assignedWhere}`,
    assignedParams
  );

  const expendedParams = [];
  const pushE = (value) => {
    expendedParams.push(value);
    return `$${expendedParams.length}`;
  };
  const expendedWhere = [
    '1=1',
    baseId ? `ex.base_id = ${pushE(baseId)}` : null,
    equipmentTypeId ? `ex.equipment_type_id = ${pushE(equipmentTypeId)}` : null,
    startDate ? `ex.expenditure_date >= ${pushE(startDate)}` : null,
    endDate ? `ex.expenditure_date <= ${pushE(`${endDate}T23:59:59`)}` : null,
  ].filter(Boolean).join(' AND ');

  const expendedResult = await query(
    `SELECT COALESCE(SUM(ex.quantity), 0)::int AS total FROM expenditures ex WHERE ${expendedWhere}`,
    expendedParams
  );

  const purchases = Number(purchasesResult.rows[0]?.total || 0);
  const transferIn = Number(transferInResult.rows[0]?.total || 0);
  const transferOut = Number(transferOutResult.rows[0]?.total || 0);
  const assigned = Number(assignedResult.rows[0]?.total || 0);
  const expended = Number(expendedResult.rows[0]?.total || 0);
  const opening = Number(openingResult.rows[0]?.opening || 0);
  const netMovement = purchases + transferIn - transferOut;
  const closing = opening + netMovement - expended;

  const purchasesList = await query(
    `SELECT p.id, p.quantity, p.purchase_date, p.unit_cost, p.notes, b.name AS base, e.name AS equipment_type
     FROM purchases p
     JOIN bases b ON b.id = p.base_id
     JOIN equipment_types e ON e.id = p.equipment_type_id
     WHERE ${purchaseWhere}
     ORDER BY p.purchase_date DESC
     LIMIT 20`,
    purchaseParams
  );

  const transferInList = await query(
    `SELECT t.id, t.quantity, t.transfer_date, t.notes, fb.name AS from_base, tb.name AS to_base, e.name AS equipment_type
     FROM transfers t
     JOIN bases fb ON fb.id = t.from_base_id
     JOIN bases tb ON tb.id = t.to_base_id
     JOIN equipment_types e ON e.id = t.equipment_type_id
     WHERE ${transferInWhere}
     ORDER BY t.transfer_date DESC
     LIMIT 20`,
    transferInParams
  );

  const transferOutList = await query(
    `SELECT t.id, t.quantity, t.transfer_date, t.notes, fb.name AS from_base, tb.name AS to_base, e.name AS equipment_type
     FROM transfers t
     JOIN bases fb ON fb.id = t.from_base_id
     JOIN bases tb ON tb.id = t.to_base_id
     JOIN equipment_types e ON e.id = t.equipment_type_id
     WHERE ${transferOutWhere}
     ORDER BY t.transfer_date DESC
     LIMIT 20`,
    transferOutParams
  );

  const assignments = await query(
    `SELECT a.id, a.asset_name, a.assigned_to, a.quantity, a.status, a.assigned_at, b.name AS base, e.name AS equipment_type
     FROM assignments a
     JOIN bases b ON b.id = a.base_id
     JOIN equipment_types e ON e.id = a.equipment_type_id
     WHERE ${assignedWhere}
     ORDER BY a.assigned_at DESC
     LIMIT 12`,
    assignedParams
  );

  const expenditures = await query(
    `SELECT ex.id, ex.asset_name, ex.quantity, ex.expenditure_date, ex.notes, b.name AS base, e.name AS equipment_type
     FROM expenditures ex
     JOIN bases b ON b.id = ex.base_id
     JOIN equipment_types e ON e.id = ex.equipment_type_id
     WHERE ${expendedWhere}
     ORDER BY ex.expenditure_date DESC
     LIMIT 12`,
    expendedParams
  );

  return {
    metrics: {
      openingBalance: opening,
      currentBalance: closing,
      closingBalance: closing,
      netMovement,
      assigned,
      expended,
      purchases,
      transferIn,
      transferOut,
    },
    netMovementDetails: {
      purchases: purchasesList.rows,
      transferIn: transferInList.rows,
      transferOut: transferOutList.rows,
    },
    recentPurchases: purchasesList.rows,
    recentTransfers: [...transferInList.rows, ...transferOutList.rows]
      .sort((a, b) => new Date(b.transfer_date) - new Date(a.transfer_date))
      .slice(0, 8),
    recentAssignments: assignments.rows,
    recentExpenditures: expenditures.rows,
    filters: { startDate, endDate, baseId, equipmentTypeId },
  };
}

apiRouter.get('/meta', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER, ROLES.LOGISTICS_OFFICER]), async (req, res) => {
  try {
    const bases = await query('SELECT id, name, commander FROM bases ORDER BY name');
    const types = await query('SELECT id, name FROM equipment_types ORDER BY name');
    const scoped = scopedBaseId(req);
    res.json({
      bases: scoped ? bases.rows.filter((base) => base.id === scoped) : bases.rows,
      equipmentTypes: types.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load lookup data.' });
  }
});

apiRouter.get('/dashboard', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER, ROLES.LOGISTICS_OFFICER]), async (req, res) => {
  if (!isDatabaseReady) {
    return res.json({
      metrics: { openingBalance: 0, closingBalance: 0, currentBalance: 0, netMovement: 0, assigned: 0, expended: 0, purchases: 0, transferIn: 0, transferOut: 0 },
      netMovementDetails: { purchases: [], transferIn: [], transferOut: [] },
      recentPurchases: [],
      recentTransfers: [],
      recentAssignments: [],
      recentExpenditures: [],
    });
  }

  try {
    const payload = await loadDashboard(req);
    await logAudit('dashboard', 'view', req.user.role, { endpoint: '/api/dashboard', filters: payload.filters });
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

apiRouter.get('/purchases', authorize([ROLES.ADMIN, ROLES.LOGISTICS_OFFICER, ROLES.BASE_COMMANDER]), requireBaseAccess, async (req, res) => {
  try {
    const baseId = applyCommanderBase(req, req.query.baseId);
    const params = [];
    let sql = `
      SELECT p.id, p.quantity, p.purchase_date, p.unit_cost, p.notes, p.base_id, p.equipment_type_id,
             b.name AS base, e.name AS equipment_type
      FROM purchases p
      JOIN bases b ON b.id = p.base_id
      JOIN equipment_types e ON e.id = p.equipment_type_id
      WHERE 1=1
    `;

    if (baseId) {
      params.push(baseId);
      sql += ` AND p.base_id = $${params.length}`;
    }
    if (req.query.equipmentTypeId) {
      params.push(Number(req.query.equipmentTypeId));
      sql += ` AND p.equipment_type_id = $${params.length}`;
    }
    if (req.query.date) {
      params.push(req.query.date);
      sql += ` AND p.purchase_date::date = $${params.length}`;
    }

    sql += ' ORDER BY p.purchase_date DESC';
    const result = await query(sql, params);
    await logAudit('purchases', 'view', req.user.role, { filter: req.query });
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load purchases.' });
  }
});

apiRouter.post('/purchases', authorize([ROLES.ADMIN, ROLES.LOGISTICS_OFFICER]), async (req, res) => {
  const { baseId, equipmentTypeId, quantity, unitCost, purchaseDate, notes } = req.body;

  if (!baseId || !equipmentTypeId || !quantity || !purchaseDate) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId, quantity and purchaseDate are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, purchase_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [baseId, equipmentTypeId, quantity, unitCost || 0, purchaseDate, notes || null]
    );

    await adjustInventory(baseId, equipmentTypeId, { onHand: Number(quantity) });
    await logAudit('purchases', 'create', req.user.role, { id: result.rows[0].id, baseId, equipmentTypeId, quantity });
    res.status(201).json({ message: 'Purchase recorded successfully.', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record purchase.' });
  }
});

apiRouter.get('/transfers', authorize([ROLES.ADMIN, ROLES.LOGISTICS_OFFICER, ROLES.BASE_COMMANDER]), async (req, res) => {
  try {
    const scoped = scopedBaseId(req);
    const params = [];
    let sql = `
      SELECT t.id, t.quantity, t.transfer_date, t.notes, t.from_base_id, t.to_base_id, t.equipment_type_id,
             fb.name AS from_base, tb.name AS to_base, e.name AS equipment_type
      FROM transfers t
      JOIN bases fb ON fb.id = t.from_base_id
      JOIN bases tb ON tb.id = t.to_base_id
      JOIN equipment_types e ON e.id = t.equipment_type_id
      WHERE 1=1
    `;

    if (scoped) {
      params.push(scoped);
      sql += ` AND (t.from_base_id = $${params.length} OR t.to_base_id = $${params.length})`;
    }

    sql += ' ORDER BY t.transfer_date DESC';
    const result = await query(sql, params);
    await logAudit('transfers', 'view', req.user.role, { endpoint: '/api/transfers' });
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load transfers.' });
  }
});

apiRouter.post('/transfers', authorize([ROLES.ADMIN, ROLES.LOGISTICS_OFFICER, ROLES.BASE_COMMANDER]), async (req, res) => {
  const { fromBaseId, toBaseId, equipmentTypeId, quantity, transferDate, notes } = req.body;

  if (!fromBaseId || !toBaseId || !equipmentTypeId || !quantity || !transferDate) {
    return res.status(400).json({ message: 'fromBaseId, toBaseId, equipmentTypeId, quantity and transferDate are required.' });
  }

  if (Number(fromBaseId) === Number(toBaseId)) {
    return res.status(400).json({ message: 'Source and destination bases must be different.' });
  }

  const scoped = scopedBaseId(req);
  if (scoped && Number(fromBaseId) !== scoped && Number(toBaseId) !== scoped) {
    return res.status(403).json({ message: 'Commanders can only move assets involving their assigned base.' });
  }

  try {
    const result = await query(
      `INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, transfer_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [fromBaseId, toBaseId, equipmentTypeId, quantity, transferDate, notes || null]
    );

    await adjustInventory(fromBaseId, equipmentTypeId, { onHand: -Number(quantity) });
    await adjustInventory(toBaseId, equipmentTypeId, { onHand: Number(quantity) });
    await logAudit('transfers', 'create', req.user.role, { id: result.rows[0].id, fromBaseId, toBaseId, quantity });
    res.status(201).json({ message: 'Transfer recorded successfully.', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record transfer.' });
  }
});

apiRouter.get('/assignments', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER]), requireBaseAccess, async (req, res) => {
  try {
    const baseId = applyCommanderBase(req, req.query.baseId);
    const params = [];
    let sql = `
      SELECT a.id, a.asset_name, a.assigned_to, a.quantity, a.status, a.assigned_at, a.base_id, a.equipment_type_id,
             b.name AS base, e.name AS equipment_type
      FROM assignments a
      JOIN bases b ON b.id = a.base_id
      JOIN equipment_types e ON e.id = a.equipment_type_id
      WHERE 1=1
    `;

    if (baseId) {
      params.push(baseId);
      sql += ` AND a.base_id = $${params.length}`;
    }

    sql += ' ORDER BY a.assigned_at DESC';
    const result = await query(sql, params);
    await logAudit('assignments', 'view', req.user.role, { endpoint: '/api/assignments' });
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assignments.' });
  }
});

apiRouter.post('/assignments', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER]), async (req, res) => {
  const { baseId, equipmentTypeId, assetName, assignedTo, quantity } = req.body;
  const scoped = scopedBaseId(req);
  const resolvedBaseId = scoped || baseId;

  if (!resolvedBaseId || !equipmentTypeId || !assetName || !assignedTo || !quantity) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId, assetName, assignedTo and quantity are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO assignments (base_id, equipment_type_id, asset_name, assigned_to, quantity, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
      [resolvedBaseId, equipmentTypeId, assetName, assignedTo, quantity]
    );

    await adjustInventory(resolvedBaseId, equipmentTypeId, { assigned: Number(quantity) });
    await logAudit('assignments', 'create', req.user.role, { id: result.rows[0].id, baseId: resolvedBaseId, assetName, assignedTo });
    res.status(201).json({ message: 'Asset assignment recorded.', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign asset.' });
  }
});

apiRouter.get('/expenditures', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER]), async (req, res) => {
  try {
    const baseId = applyCommanderBase(req, req.query.baseId);
    const params = [];
    let sql = `
      SELECT ex.id, ex.asset_name, ex.quantity, ex.expenditure_date, ex.notes, ex.base_id, ex.equipment_type_id,
             b.name AS base, e.name AS equipment_type
      FROM expenditures ex
      JOIN bases b ON b.id = ex.base_id
      JOIN equipment_types e ON e.id = ex.equipment_type_id
      WHERE 1=1
    `;

    if (baseId) {
      params.push(baseId);
      sql += ` AND ex.base_id = $${params.length}`;
    }

    sql += ' ORDER BY ex.expenditure_date DESC';
    const result = await query(sql, params);
    await logAudit('expenditures', 'view', req.user.role, { endpoint: '/api/expenditures' });
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load expenditures.' });
  }
});

apiRouter.post('/expenditures', authorize([ROLES.ADMIN, ROLES.BASE_COMMANDER]), async (req, res) => {
  const { baseId, equipmentTypeId, assetName, quantity, expenditureDate, notes } = req.body;
  const scoped = scopedBaseId(req);
  const resolvedBaseId = scoped || baseId;

  if (!resolvedBaseId || !equipmentTypeId || !assetName || !quantity || !expenditureDate) {
    return res.status(400).json({ message: 'baseId, equipmentTypeId, assetName, quantity and expenditureDate are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO expenditures (base_id, equipment_type_id, asset_name, quantity, expenditure_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [resolvedBaseId, equipmentTypeId, assetName, quantity, expenditureDate, notes || null]
    );

    await adjustInventory(resolvedBaseId, equipmentTypeId, { onHand: -Number(quantity), expended: Number(quantity) });
    await logAudit('expenditures', 'create', req.user.role, { id: result.rows[0].id, baseId: resolvedBaseId, assetName, quantity });
    res.status(201).json({ message: 'Expenditure recorded.', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record expenditure.' });
  }
});

apiRouter.get('/audit-logs', authorize([ROLES.ADMIN]), async (req, res) => {
  try {
    const result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 80');
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load audit logs.' });
  }
});
