import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { query, logAudit } from '../db.js';
import { authenticate, signToken, normalizeRole } from '../middleware/rbac.js';

export const authRouter = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: normalizeRole(row.role),
    assignedBaseId: row.assigned_base_id,
    picture: row.picture,
  };
}

async function findUserByEmail(email) {
  const result = await query(
    'SELECT * FROM users WHERE lower(email) = lower($1) AND active = true LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    await logAudit('users', 'login', user.role, { email: user.email, method: 'password' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.' });
  }
});

authRouter.post('/google', async (req, res) => {
  const { credential, demoEmail } = req.body || {};
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

  try {
    let email;
    let name;
    let googleId;
    let picture;

    if (credential && clientId) {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
      picture = payload.picture;
    } else if (demoEmail && !clientId) {
      email = demoEmail;
      name = email.split('@')[0];
      googleId = `demo-${email}`;
    } else if (demoEmail && clientId) {
      return res.status(400).json({ message: 'Google client is configured. Use a Google ID token.' });
    } else {
      return res.status(400).json({ message: 'Google credential is required.' });
    }

    if (!email) {
      return res.status(401).json({ message: 'Google account did not return an email.' });
    }

    let user = await findUserByEmail(email);

    if (!user) {
      const created = await query(
        `INSERT INTO users (name, username, email, google_id, picture, role, active)
         VALUES ($1, $2, $3, $4, $5, 'logistics_officer', true)
         RETURNING *`,
        [name || email, email, email, googleId || null, picture || null]
      );
      user = created.rows[0];
    } else if (googleId) {
      await query('UPDATE users SET google_id = COALESCE(google_id, $1), picture = COALESCE($2, picture) WHERE id = $3', [
        googleId,
        picture || null,
        user.id,
      ]);
    }

    await logAudit('users', 'login', user.role, { email: user.email, method: 'google' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(401).json({ message: 'Google sign-in failed.' });
  }
});

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});
