export const baseOptions = ['All Bases', 'Base Alpha', 'Base Bravo', 'Base Charlie'];
export const equipmentTypes = ['All Types', 'Vehicle', 'Weapon', 'Ammunition'];

export const dashboardData = {
  openingBalance: 482,
  closingBalance: 536,
  netMovement: 54,
  assigned: 32,
  expended: 18,
  purchases: [
    { id: 1, date: '2026-09-01', base: 'Base Alpha', type: 'Vehicle', quantity: 8, amount: 120000 },
    { id: 2, date: '2026-09-05', base: 'Base Bravo', type: 'Weapon', quantity: 12, amount: 90000 },
    { id: 3, date: '2026-09-10', base: 'Base Charlie', type: 'Ammunition', quantity: 1500, amount: 45000 }
  ],
  transfers: [
    { id: 1, date: '2026-09-03', from: 'Base Alpha', to: 'Base Bravo', type: 'Vehicle', quantity: 4 },
    { id: 2, date: '2026-09-08', from: 'Base Charlie', to: 'Base Alpha', type: 'Weapon', quantity: 6 }
  ],
  assignments: [
    { id: 1, asset: 'MRAP-12', assignedTo: 'Maj. Patel', base: 'Base Alpha', status: 'Active' },
    { id: 2, asset: 'Rifle-9', assignedTo: 'Capt. Lee', base: 'Base Bravo', status: 'Active' }
  ],
  expenditures: [
    { id: 1, asset: 'Ammunition Box-7', quantity: 200, base: 'Base Charlie', date: '2026-09-11' },
    { id: 2, asset: 'Vehicle-4', quantity: 1, base: 'Base Alpha', date: '2026-09-15' }
  ]
};

export const purchaseRecords = [
  { id: 1, date: '2026-09-01', base: 'Base Alpha', type: 'Vehicle', quantity: 8, amount: 120000 },
  { id: 2, date: '2026-09-04', base: 'Base Bravo', type: 'Weapon', quantity: 12, amount: 90000 },
  { id: 3, date: '2026-09-09', base: 'Base Charlie', type: 'Ammunition', quantity: 1500, amount: 45000 },
  { id: 4, date: '2026-09-11', base: 'Base Alpha', type: 'Vehicle', quantity: 5, amount: 78000 }
];

export const transferRecords = [
  { id: 1, date: '2026-09-03', from: 'Base Alpha', to: 'Base Bravo', type: 'Vehicle', quantity: 4 },
  { id: 2, date: '2026-09-08', from: 'Base Charlie', to: 'Base Alpha', type: 'Weapon', quantity: 6 },
  { id: 3, date: '2026-09-12', from: 'Base Bravo', to: 'Base Charlie', type: 'Ammunition', quantity: 250 },
  { id: 4, date: '2026-09-15', from: 'Base Alpha', to: 'Base Bravo', type: 'Vehicle', quantity: 2 }
];

export const assignmentRecords = [
  { id: 1, asset: 'MRAP-12', assignedTo: 'Maj. Patel', base: 'Base Alpha', status: 'Active', equipment: 'Vehicle' },
  { id: 2, asset: 'Rifle-9', assignedTo: 'Capt. Lee', base: 'Base Bravo', status: 'Active', equipment: 'Weapon' },
  { id: 3, asset: 'Ammunition Box-14', assignedTo: 'Sgt. Gomez', base: 'Base Charlie', status: 'Reserved', equipment: 'Ammunition' }
];

export const expenditureRecords = [
  { id: 1, asset: 'Ammunition Box-7', quantity: 200, base: 'Base Charlie', date: '2026-09-11', type: 'Ammunition' },
  { id: 2, asset: 'Vehicle-4', quantity: 1, base: 'Base Alpha', date: '2026-09-15', type: 'Vehicle' },
  { id: 3, asset: 'Weapon Cache-3', quantity: 3, base: 'Base Bravo', date: '2026-09-17', type: 'Weapon' }
];

export const roleOptions = ['admin', 'base_commander', 'logistics_officer'];
