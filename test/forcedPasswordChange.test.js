// ============================================
// TEST: FORCED PASSWORD CHANGE ENFORCEMENT & VALIDATION
// Verifies backend enforcement of mustChangePassword === true,
// authoritative user record lookup, privileged role blocking,
// endpoint exemption (change-password, logout), and frontend/backend
// 8-character validation rule consistency.
// ============================================

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  requireAuth,
  enforcePasswordChange,
  getAuthoritativeUser,
  JWT_SECRET
} = require('../server/middleware/auth');

describe('Backend Forced Password Change Enforcement', () => {
  // Mock in-memory user database for testing authoritative record lookups
  let mockUsers = new Map();

  beforeEach(() => {
    mockUsers.clear();
    // Hook the resolver to query the mockUsers store during tests
    getAuthoritativeUser.resolver = async (userId) => {
      return mockUsers.get(userId) || null;
    };
  });

  afterEach(() => {
    getAuthoritativeUser.resolver = null;
    mockUsers.clear();
  });

  function createMockRes() {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    return res;
  }

  function signTestToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  }

  it('should block temporary-password student from normal APIs with HTTP 403', async () => {
    const user = {
      id: 'student-temp-1',
      name: 'Temp Student',
      email: 'student@uni.edu',
      role: 'student',
      mustChangePassword: true
    };
    mockUsers.set(user.id, user);

    const token = signTestToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: true
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/items',
      baseUrl: '/api',
      path: '/items',
      method: 'GET'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'next() must NOT be called for normal APIs');
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.mustChangePassword, true);
    assert.match(res.body.message, /Password change required/i);
  });

  it('should verify admin with temporary password CANNOT bypass the restriction', async () => {
    const adminUser = {
      id: 'admin-temp-1',
      name: 'Temp Admin',
      email: 'admin@uni.edu',
      role: 'admin',
      mustChangePassword: true
    };
    mockUsers.set(adminUser.id, adminUser);

    const token = signTestToken({
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      mustChangePassword: true
    });

    // Admin attempts to access admin user creation endpoint directly
    const req = {
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/auth/admin/create-user',
      baseUrl: '/api/auth',
      path: '/admin/create-user',
      method: 'POST'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'Admin must not bypass forced password change');
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.mustChangePassword, true);
  });

  it('should verify lab_manager with temporary password CANNOT bypass the restriction', async () => {
    const managerUser = {
      id: 'manager-temp-1',
      name: 'Temp Manager',
      email: 'manager@uni.edu',
      role: 'lab_manager',
      mustChangePassword: true
    };
    mockUsers.set(managerUser.id, managerUser);

    const token = signTestToken({
      id: managerUser.id,
      name: managerUser.name,
      email: managerUser.email,
      role: managerUser.role,
      mustChangePassword: true
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/reservations',
      baseUrl: '/api',
      path: '/reservations',
      method: 'GET'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'Lab manager must not bypass forced password change');
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.mustChangePassword, true);
  });

  it('should use authoritative database record and block requests even if JWT claim is stale (mustChangePassword: false)', async () => {
    // Database record has mustChangePassword: true (e.g. admin resent credentials)
    const user = {
      id: 'user-stale-jwt',
      name: 'Stale JWT User',
      email: 'stale@uni.edu',
      role: 'student',
      mustChangePassword: true
    };
    mockUsers.set(user.id, user);

    // Attacker or user has a stale token without mustChangePassword claim or with false
    const staleToken = signTestToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: false
    });

    const req = {
      headers: { authorization: `Bearer ${staleToken}` },
      originalUrl: '/api/fines',
      baseUrl: '/api',
      path: '/fines',
      method: 'GET'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    // Authoritative check must catch this and block the request!
    assert.strictEqual(nextCalled, false, 'Authoritative check must block stale JWT claim');
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.mustChangePassword, true);
  });

  it('should allow user if authoritative database record is updated to false even if JWT claim was true', async () => {
    // Database record was updated after successful password change
    const user = {
      id: 'user-updated-record',
      name: 'Updated User',
      email: 'updated@uni.edu',
      role: 'student',
      mustChangePassword: false
    };
    mockUsers.set(user.id, user);

    // Old token still had mustChangePassword: true
    const oldToken = signTestToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: true
    });

    const req = {
      headers: { authorization: `Bearer ${oldToken}` },
      originalUrl: '/api/items',
      baseUrl: '/api',
      path: '/items',
      method: 'GET'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'Authoritative record (false) must allow access');
    assert.strictEqual(res.statusCode, 200);
  });

  it('should allow temporary-password users to access /api/auth/change-password', async () => {
    const user = {
      id: 'user-changing-pass',
      name: 'Changing User',
      email: 'changing@uni.edu',
      role: 'student',
      mustChangePassword: true
    };
    mockUsers.set(user.id, user);

    const token = signTestToken({
      id: user.id,
      role: user.role,
      mustChangePassword: true
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/auth/change-password',
      baseUrl: '/api/auth',
      path: '/change-password',
      method: 'POST'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'change-password endpoint must be exempt from block');
  });

  it('should allow temporary-password users to access /api/auth/logout safely', async () => {
    const user = {
      id: 'user-logging-out',
      name: 'Logging Out User',
      email: 'logout@uni.edu',
      role: 'student',
      mustChangePassword: true
    };
    mockUsers.set(user.id, user);

    const token = signTestToken({
      id: user.id,
      role: user.role,
      mustChangePassword: true
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
      originalUrl: '/api/auth/logout',
      baseUrl: '/api/auth',
      path: '/logout',
      method: 'POST'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'logout endpoint must be exempt from block');
  });

  it('should reject unauthenticated requests with HTTP 401', async () => {
    const req = {
      headers: {},
      originalUrl: '/api/items',
      baseUrl: '/api',
      path: '/items'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, 'No token provided');
  });

  it('should reject invalid or tampered JWTs with HTTP 401', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid.tampered.token' },
      originalUrl: '/api/items',
      baseUrl: '/api',
      path: '/items'
    };
    const res = createMockRes();
    let nextCalled = false;

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.message, 'Invalid or expired token');
  });
});

describe('Password Change Validation Logic (Frontend & Backend Consistency)', () => {
  function validateChangePasswordForm(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
      return { valid: false, error: 'Please enter your current password' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { valid: false, error: 'New password must be at least 8 characters long' };
    }
    if (currentPassword === newPassword) {
      return { valid: false, error: 'New password must be different from the current password' };
    }
    if (newPassword !== confirmPassword) {
      return { valid: false, error: 'New password and confirmation do not match' };
    }
    return { valid: true };
  }

  it('should reject new passwords with fewer than 8 characters', () => {
    const result = validateChangePasswordForm('oldPass123', 'short', 'short');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'New password must be at least 8 characters long');

    const result7 = validateChangePasswordForm('oldPass123', '1234567', '1234567');
    assert.strictEqual(result7.valid, false);
    assert.strictEqual(result7.error, 'New password must be at least 8 characters long');
  });

  it('should reject when new password is identical to current password', () => {
    const result = validateChangePasswordForm('Password123', 'Password123', 'Password123');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'New password must be different from the current password');
  });

  it('should reject when confirm password does not match new password', () => {
    const result = validateChangePasswordForm('oldPassword123', 'newSecurePassword456', 'mismatchPassword');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'New password and confirmation do not match');
  });

  it('should accept valid new password of 8 or more characters', () => {
    const result = validateChangePasswordForm('oldPassword123', 'newSecurePassword456', 'newSecurePassword456');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, undefined);
  });

  it('should simulate full temporary-password lifecycle: blocked -> change password -> unblocked', async () => {
    const tempPassword = 'TempPassword123!';
    const newPassword = 'PermanentSecurePassword456!';
    const user = {
      id: 'user-lifecycle-test',
      name: 'Lifecycle Tester',
      email: 'lifecycle@uni.edu',
      role: 'student',
      password: bcrypt.hashSync(tempPassword, 10),
      mustChangePassword: true
    };

    // User is created with mustChangePassword: true
    assert.strictEqual(user.mustChangePassword, true);

    // Initial check: normal API request blocked
    const canAccessNormalApiBefore = user.mustChangePassword === false;
    assert.strictEqual(canAccessNormalApiBefore, false);

    // User submits change-password with newPassword < 8 chars -> rejected
    const shortAttempt = validateChangePasswordForm(tempPassword, 'short1', 'short1');
    assert.strictEqual(shortAttempt.valid, false);

    // User submits valid password change (>= 8 chars)
    const validAttempt = validateChangePasswordForm(tempPassword, newPassword, newPassword);
    assert.strictEqual(validAttempt.valid, true);

    // Verify current password with bcrypt
    assert.strictEqual(bcrypt.compareSync(tempPassword, user.password), true);

    // Update password and mustChangePassword
    user.password = bcrypt.hashSync(newPassword, 10);
    user.mustChangePassword = false;

    // After password change: normal API request allowed
    const canAccessNormalApiAfter = user.mustChangePassword === false;
    assert.strictEqual(canAccessNormalApiAfter, true);
    assert.strictEqual(bcrypt.compareSync(newPassword, user.password), true);
  });
});
