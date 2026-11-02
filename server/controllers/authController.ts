import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbState, AddressRow } from '../services/relationalStore.ts';
import { signToken } from '../middleware/authMiddleware.ts';
import {
  getPool,
  getLastConnectionState,
  verifyMySQLConnection,
  RowDataPacket,
  ResultSetHeader,
  PoolConnection,
} from '../config/db.ts';

/**
 * Helper to ensure we have an active MySQL connection pool before executing DB mutations
 */
async function ensureActivePool() {
  let connState = getLastConnectionState();
  if (!connState.connected || !getPool()) {
    connState = await verifyMySQLConnection(true);
  }
  const pool = getPool();
  return { pool, connState };
}

export async function register(req: Request, res: Response) {
  let connection: PoolConnection | null = null;
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const mobileNumber =
      typeof body.mobile_number === 'string' && body.mobile_number.trim() !== ''
        ? body.mobile_number.trim()
        : typeof body.phone === 'string'
        ? body.phone.trim()
        : '';
    const normalizedEmail =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    // Parse optional address (supports string `address`, object `address`, or `street_address`)
    const addressObj =
      body.address && typeof body.address === 'object' && !Array.isArray(body.address)
        ? body.address
        : null;
    const rawAddressString =
      typeof body.address === 'string'
        ? body.address
        : addressObj?.street_address || addressObj?.address || body.street_address || '';
    const streetAddress = String(rawAddressString || '').trim();
    const city = String(addressObj?.city ?? body.city ?? 'Mumbai').trim() || 'Mumbai';
    const state = String(addressObj?.state ?? body.state ?? 'Maharashtra').trim() || 'Maharashtra';
    const postalCode =
      String(addressObj?.postal_code ?? body.postal_code ?? '400001').trim() || '400001';
    const landmark =
      addressObj?.landmark ?? body.landmark
        ? String(addressObj?.landmark ?? body.landmark).trim()
        : null;
    const label = String(addressObj?.label ?? body.label ?? 'Home').trim() || 'Home';

    // Validate required fields
    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required (minimum 2 characters).',
      });
    }

    if (!mobileNumber || !/^[0-9+\-\s()]{7,20}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number (7 to 20 digits).',
      });
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const { pool, connState } = await ensureActivePool();
    if (!pool || !connState.connected) {
      return res.status(503).json({
        success: false,
        mysql_status: 'NOT CONNECTED',
        error_code: connState.errorCode || 'MYSQL_NOT_CONNECTED',
        message:
          connState.errorMessage ||
          'MySQL 8 Database is NOT CONNECTED. Cannot save customer registration.',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Check duplicate email inside the transaction
    const [existingRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingRows.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists (UNIQUE constraint on users.email).',
      });
    }

    // 2. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert customer into `users` table
    const [userInsert] = await connection.execute<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [fullName, normalizedEmail, passwordHash, mobileNumber, 'customer']
    );

    const insertedUserId = Number(userInsert.insertId);
    if (!insertedUserId) {
      throw new Error('Failed to insert customer record into MySQL users table.');
    }

    // 4. Insert optional delivery address into `addresses` table within the same transaction
    if (streetAddress.length > 0) {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO addresses
          (user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          insertedUserId,
          label,
          fullName,
          mobileNumber,
          streetAddress,
          landmark,
          city,
          state,
          postalCode,
        ]
      );
    }

    // 5. Commit MySQL transaction before returning success
    await connection.commit();

    // 6. Query committed user & addresses from MySQL
    const [userRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, full_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [insertedUserId]
    );
    const [addressRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default, created_at, updated_at FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
      [insertedUserId]
    );

    const dbUser = userRows[0];
    if (!dbUser) {
      throw new Error('Customer record could not be verified after commit.');
    }

    const nowIso = new Date().toISOString();
    const syncedUser = {
      id: Number(dbUser.id),
      full_name: String(dbUser.full_name),
      email: String(dbUser.email),
      password_hash: passwordHash,
      phone: String(dbUser.phone),
      role: (dbUser.role as 'customer' | 'admin') || 'customer',
      is_active: Number(dbUser.is_active ?? 1),
      created_at: dbUser.created_at ? new Date(dbUser.created_at).toISOString() : nowIso,
      updated_at: dbUser.updated_at ? new Date(dbUser.updated_at).toISOString() : nowIso,
    };

    const syncedAddresses: AddressRow[] = addressRows.map((a) => ({
      id: Number(a.id),
      user_id: Number(a.user_id),
      label: String(a.label),
      recipient_name: String(a.recipient_name),
      phone: String(a.phone),
      street_address: String(a.street_address),
      landmark: a.landmark ? String(a.landmark) : null,
      city: String(a.city),
      state: String(a.state),
      postal_code: String(a.postal_code),
      is_default: Number(a.is_default ?? 1),
      created_at: a.created_at ? new Date(a.created_at).toISOString() : nowIso,
      updated_at: a.updated_at ? new Date(a.updated_at).toISOString() : nowIso,
    }));

    // Keep in-memory relational cache synchronized with MySQL
    const existingIdx = dbState.users.findIndex((u) => u.id === syncedUser.id);
    if (existingIdx >= 0) {
      dbState.users[existingIdx] = syncedUser;
    } else {
      dbState.users.push(syncedUser);
    }
    for (const addr of syncedAddresses) {
      if (!dbState.addresses.some((a) => a.id === addr.id)) {
        dbState.addresses.push(addr);
      }
    }

    const token = signToken({
      userId: syncedUser.id,
      email: syncedUser.email,
      role: syncedUser.role,
    });

    return res.status(201).json({
      success: true,
      message:
        syncedAddresses.length > 0
          ? 'Customer account and delivery address saved to MySQL in an ACID transaction.'
          : 'Customer account saved to MySQL users table.',
      token,
      user: {
        id: syncedUser.id,
        full_name: syncedUser.full_name,
        email: syncedUser.email,
        phone: syncedUser.phone,
        mobile_number: syncedUser.phone,
        role: syncedUser.role,
        created_at: syncedUser.created_at,
        addresses: syncedAddresses,
      },
    });
  } catch (err: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // ignore rollback error
      }
    }
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists (UNIQUE constraint on users.email).',
      });
    }
    return res.status(500).json({
      success: false,
      message: err?.message || 'Registration failed due to a database error.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function login(req: Request, res: Response) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const normalizedEmail =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const { pool, connState } = await ensureActivePool();

    if (pool && connState.connected) {
      const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, full_name, email, password_hash, phone, role, is_active, created_at FROM users WHERE LOWER(email) = ? LIMIT 1',
        [normalizedEmail]
      );

      if (userRows.length > 0) {
        const dbUser = userRows[0];
        if (Number(dbUser.is_active) === 0) {
          return res.status(401).json({
            success: false,
            message: 'Account is disabled.',
          });
        }

        const isMatch = await bcrypt.compare(password, String(dbUser.password_hash));
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password.',
          });
        }

        const [addressRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
          [dbUser.id]
        );

        const token = signToken({
          userId: Number(dbUser.id),
          email: String(dbUser.email),
          role: dbUser.role as 'customer' | 'admin',
        });

        return res.json({
          success: true,
          message: 'Login successful.',
          token,
          user: {
            id: Number(dbUser.id),
            full_name: String(dbUser.full_name),
            email: String(dbUser.email),
            phone: String(dbUser.phone),
            mobile_number: String(dbUser.phone),
            role: dbUser.role as 'customer' | 'admin',
            created_at: dbUser.created_at
              ? new Date(dbUser.created_at).toISOString()
              : new Date().toISOString(),
            addresses: addressRows as AddressRow[],
          },
        });
      }
    }

    // Fallback check against seeded in-memory state if user not found above
    const user = dbState.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.is_active === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const addresses = dbState.addresses.filter((a) => a.user_id === user.id);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        mobile_number: user.phone,
        role: user.role,
        created_at: user.created_at,
        addresses,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Login failed.' });
  }
}

export async function getMe(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { pool, connState } = await ensureActivePool();
    if (pool && connState.connected) {
      const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      if (userRows.length > 0) {
        const dbUser = userRows[0];
        const [addressRows] = await pool.execute<RowDataPacket[]>(
          'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
          [userId]
        );
        return res.json({
          success: true,
          user: {
            id: Number(dbUser.id),
            full_name: String(dbUser.full_name),
            email: String(dbUser.email),
            phone: String(dbUser.phone),
            mobile_number: String(dbUser.phone),
            role: dbUser.role as 'customer' | 'admin',
            created_at: dbUser.created_at
              ? new Date(dbUser.created_at).toISOString()
              : new Date().toISOString(),
            addresses: addressRows as AddressRow[],
          },
        });
      }
    }

    const user = dbState.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const addresses = dbState.addresses.filter((a) => a.user_id === user.id);
    return res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        mobile_number: user.phone,
        role: user.role,
        created_at: user.created_at,
        addresses,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch user profile.' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { pool, connState } = await ensureActivePool();
    if (!pool || !connState.connected) {
      return res.status(503).json({
        success: false,
        mysql_status: 'NOT CONNECTED',
        message:
          'MySQL 8 Database is NOT CONNECTED. Customer profile changes cannot be saved until MySQL is connected.',
      });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const dbUser = userRows[0];
    const updatedName =
      typeof body.full_name === 'string' && body.full_name.trim()
        ? body.full_name.trim()
        : String(dbUser.full_name);
    const updatedPhone =
      typeof body.mobile_number === 'string' && body.mobile_number.trim()
        ? body.mobile_number.trim()
        : typeof body.phone === 'string' && body.phone.trim()
        ? body.phone.trim()
        : String(dbUser.phone);
    let updatedPasswordHash = String(dbUser.password_hash);

    if (body.new_password) {
      if (!body.current_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }
      const validCurrent = await bcrypt.compare(
        String(body.current_password),
        updatedPasswordHash
      );
      if (!validCurrent) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
      updatedPasswordHash = await bcrypt.hash(String(body.new_password), 10);
    }

    await pool.execute(
      'UPDATE users SET full_name = ?, phone = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedName, updatedPhone, updatedPasswordHash, userId]
    );

    const memUser = dbState.users.find((u) => u.id === userId);
    if (memUser) {
      memUser.full_name = updatedName;
      memUser.phone = updatedPhone;
      memUser.password_hash = updatedPasswordHash;
      memUser.updated_at = new Date().toISOString();
    }

    const [addressRows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
      [userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated in MySQL users table.',
      user: {
        id: Number(dbUser.id),
        full_name: updatedName,
        email: String(dbUser.email),
        phone: updatedPhone,
        mobile_number: updatedPhone,
        role: dbUser.role as 'customer' | 'admin',
        created_at: dbUser.created_at
          ? new Date(dbUser.created_at).toISOString()
          : new Date().toISOString(),
        addresses: addressRows as AddressRow[],
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to update profile.',
    });
  }
}

export async function addAddress(req: Request, res: Response) {
  let connection: PoolConnection | null = null;
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { pool, connState } = await ensureActivePool();
    if (!pool || !connState.connected) {
      return res.status(503).json({
        success: false,
        mysql_status: 'NOT CONNECTED',
        message:
          'MySQL 8 Database is NOT CONNECTED. Delivery addresses cannot be saved until MySQL is connected.',
      });
    }

    const userId = req.user!.userId;
    const street_address = typeof body.street_address === 'string' ? body.street_address.trim() : '';
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const postal_code = typeof body.postal_code === 'string' ? body.postal_code.trim() : '';

    if (!street_address || !city || !state || !postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Street address, city, state, and postal code are required.',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [userRows] = await connection.execute<RowDataPacket[]>(
      'SELECT full_name, phone FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const fallbackName = userRows[0]?.full_name || 'Customer';
    const fallbackPhone = userRows[0]?.phone || '';

    const isDefault = body.is_default ? 1 : 0;
    if (isDefault) {
      await connection.execute('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
      dbState.addresses.forEach((a) => {
        if (a.user_id === userId) a.is_default = 0;
      });
    }

    const label = String(body.label || 'Home').trim();
    const recipientName = String(body.recipient_name || fallbackName).trim();
    const phone = String(body.mobile_number || body.phone || fallbackPhone).trim();
    const landmark = body.landmark ? String(body.landmark).trim() : null;

    const [insertRes] = await connection.execute<ResultSetHeader>(
      `INSERT INTO addresses
        (user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        label,
        recipientName,
        phone,
        street_address,
        landmark,
        city,
        state,
        postal_code,
        isDefault,
      ]
    );

    await connection.commit();

    const [addressRows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default, created_at, updated_at FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
      [userId]
    );

    const now = new Date().toISOString();
    const newAddr: AddressRow = {
      id: Number(insertRes.insertId),
      user_id: userId,
      label,
      recipient_name: recipientName,
      phone,
      street_address,
      landmark,
      city,
      state,
      postal_code,
      is_default: isDefault,
      created_at: now,
      updated_at: now,
    };
    dbState.addresses.push(newAddr);

    return res.status(201).json({
      success: true,
      message: 'Address saved to MySQL addresses table.',
      address: newAddr,
      addresses: addressRows,
    });
  } catch (err: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        // ignore
      }
    }
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to save address.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function deleteAddress(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const addressId = Number(req.params.id);
    const { pool, connState } = await ensureActivePool();

    if (pool && connState.connected) {
      await pool.execute('DELETE FROM addresses WHERE id = ? AND user_id = ?', [
        addressId,
        userId,
      ]);
      const [addressRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, user_id, label, recipient_name, phone, street_address, landmark, city, state, postal_code, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC',
        [userId]
      );
      const idx = dbState.addresses.findIndex((a) => a.id === addressId && a.user_id === userId);
      if (idx !== -1) dbState.addresses.splice(idx, 1);

      return res.json({
        success: true,
        message: 'Address deleted from MySQL addresses table.',
        addresses: addressRows,
      });
    }

    const idx = dbState.addresses.findIndex((a) => a.id === addressId && a.user_id === userId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    dbState.addresses.splice(idx, 1);
    return res.json({
      success: true,
      message: 'Address deleted.',
      addresses: dbState.addresses.filter((a) => a.user_id === userId),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to delete address.',
    });
  }
}
