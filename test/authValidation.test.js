// ============================================
// TEST: AUTHENTICATION & VALIDATION
// Unit tests verifying registration role validation,
// password hashing, token verification, and email validation.
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

describe('Authentication & Security Validation', () => {
  const TEST_JWT_SECRET = 'unit-test-secret-key-12345';

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateRegistration({ name, email, password, role }) {
    if (!name || !String(name).trim()) {
      return { valid: false, error: 'Full name is required', status: 400 };
    }
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized || !isValidEmail(normalized)) {
      return { valid: false, error: 'A valid email address is required', status: 400 };
    }
    if (!password || String(password).length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long', status: 400 };
    }
    if (role === 'admin' || role === 'lab_manager') {
      return {
        valid: false,
        error: 'Public registration cannot provision administrative roles. Contact an administrator.',
        status: 403
      };
    }
    const assignedRole = role === 'faculty' ? 'faculty' : 'student';
    return { valid: true, assignedRole };
  }

  function generateTemporaryPassword() {
    return crypto.randomBytes(9).toString('base64url');
  }

  it('should reject public registration attempting to escalate to admin role', () => {
    const result = validateRegistration({
      name: 'Sneaky User',
      email: 'attacker@university.edu',
      password: 'password123',
      role: 'admin',
    });

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.status, 403);
    assert.match(result.error, /cannot provision administrative roles/);
  });

  it('should reject public registration attempting to escalate to lab_manager role', () => {
    const result = validateRegistration({
      name: 'Manager Aspirant',
      email: 'aspirant@university.edu',
      password: 'password123',
      role: 'lab_manager',
    });

    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.status, 403);
  });

  it('should accept valid student and faculty registrations', () => {
    const studentRes = validateRegistration({
      name: 'Alice Student',
      email: 'alice@university.edu',
      password: 'mypassword123',
      role: 'student',
    });
    assert.strictEqual(studentRes.valid, true);
    assert.strictEqual(studentRes.assignedRole, 'student');

    const facultyRes = validateRegistration({
      name: 'Prof. Bob',
      email: 'bob@university.edu',
      password: 'mypassword123',
      role: 'faculty',
    });
    assert.strictEqual(facultyRes.valid, true);
    assert.strictEqual(facultyRes.assignedRole, 'faculty');
  });

  it('should reject short passwords and invalid emails', () => {
    const shortPass = validateRegistration({
      name: 'Test',
      email: 'test@example.com',
      password: '123',
    });
    assert.strictEqual(shortPass.valid, false);
    assert.strictEqual(shortPass.status, 400);

    const badEmail = validateRegistration({
      name: 'Test',
      email: 'not-an-email',
      password: 'validpassword123',
    });
    assert.strictEqual(badEmail.valid, false);
    assert.strictEqual(badEmail.status, 400);
  });

  it('should generate cryptographically strong temporary passwords of at least 12 characters', () => {
    const pass1 = generateTemporaryPassword();
    const pass2 = generateTemporaryPassword();

    assert.ok(pass1.length >= 12);
    assert.notStrictEqual(pass1, pass2);
  });

  it('should hash password and correctly verify with bcrypt', () => {
    const password = generateTemporaryPassword();
    const hash = bcrypt.hashSync(password, 10);

    assert.notStrictEqual(password, hash);
    assert.strictEqual(bcrypt.compareSync(password, hash), true);
    assert.strictEqual(bcrypt.compareSync('wrong-password', hash), false);
  });

  it('should sign and verify JWT correctly with claims', () => {
    const userPayload = {
      id: 'usr-123',
      name: 'Test User',
      email: 'test@uni.edu',
      role: 'student'
    };

    const token = jwt.sign(userPayload, TEST_JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, TEST_JWT_SECRET);

    assert.strictEqual(decoded.id, userPayload.id);
    assert.strictEqual(decoded.role, userPayload.role);
    assert.strictEqual(decoded.email, userPayload.email);
  });
});
