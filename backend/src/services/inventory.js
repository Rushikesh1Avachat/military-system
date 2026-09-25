import { query } from '../db.js';

export async function getOrCreateInventory(baseId, equipmentTypeId) {
  const existing = await query(
    'SELECT * FROM inventory WHERE base_id = $1 AND equipment_type_id = $2 LIMIT 1',
    [baseId, equipmentTypeId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const created = await query(
    `INSERT INTO inventory (base_id, equipment_type_id, opening_balance, closing_balance, quantity_on_hand)
     VALUES ($1, $2, 0, 0, 0)
     RETURNING *`,
    [baseId, equipmentTypeId]
  );

  return created.rows[0];
}

export async function adjustInventory(baseId, equipmentTypeId, changes) {
  await getOrCreateInventory(baseId, equipmentTypeId);
  await query(
    `UPDATE inventory
     SET
       closing_balance = GREATEST(closing_balance + $3, 0),
       quantity_on_hand = GREATEST(quantity_on_hand + $3, 0),
       assigned_quantity = GREATEST(assigned_quantity + $4, 0),
       expended_quantity = GREATEST(expended_quantity + $5, 0),
       updated_at = NOW()
     WHERE base_id = $1 AND equipment_type_id = $2`,
    [
      baseId,
      equipmentTypeId,
      Number(changes.onHand || 0),
      Number(changes.assigned || 0),
      Number(changes.expended || 0),
    ]
  );
}
