import jwt from 'jsonwebtoken';

export const ROLES = {
  ADMIN: 'admin',
  BASE_COMMANDER: 'base_commander',
  LOGISTICS_OFFICER: 'logistics_officer',
};

const ROLE_ALIASES = {
  owner: ROLES.ADMIN,
  admin: ROLES.ADMIN,
  commander: ROLES.BASE_COMMANDER,
  base_commander: ROLES.BASE_COMMANDER,
  logistics: ROLES.LOGISTICS_OFFICER,
  logistics_officer: ROLES.LOGISTICS_OFFICER,
};

export function normalizeRole(role) {
  return ROLE_ALIASES[String(role || '').toLowerCase()] || ROLES.ADMIN;
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      assignedBaseId: user.assignedBaseId ?? user.assigned_base_id ?? null,
    },
    process.env.JWT_SECRET || 'military-asset-secret',
    { expiresIn: '12h' }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'military-asset-secret');
      req.user = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: normalizeRole(payload.role),
        assignedBaseId: payload.assignedBaseId || null,
      };
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }
  }

  const role = normalizeRole(req.headers['x-user-role']);
  req.user = {
    id: 0,
    name: 'Demo Operator',
    email: null,
    role,
    assignedBaseId: role === ROLES.BASE_COMMANDER ? 1 : null,
  };
  next();
}

export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    const role = req.user?.role || normalizeRole(req.headers['x-user-role']);

    if (allowedRoles.length && !allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role privilege.' });
    }

    req.user = req.user || { role };
    next();
  };
}

export function requireRole(allowedRoles = []) {
  return authorize(allowedRoles);
}

export function scopedBaseId(req) {
  if (req.user?.role === ROLES.BASE_COMMANDER) {
    return Number(req.user.assignedBaseId || 0) || null;
  }
  return null;
}

export function requireBaseAccess(req, res, next) {
  const role = req.user?.role || ROLES.ADMIN;
  const requestedBaseId = Number(req.query.baseId || req.body.baseId || 0);

  if (role === ROLES.ADMIN || role === ROLES.LOGISTICS_OFFICER) {
    return next();
  }

  if (role === ROLES.BASE_COMMANDER) {
    const assigned = Number(req.user.assignedBaseId || 0);
    if (assigned > 0 && (!requestedBaseId || requestedBaseId === assigned)) {
      return next();
    }
  }

  return res.status(403).json({ message: 'Base access denied for this role.' });
}
