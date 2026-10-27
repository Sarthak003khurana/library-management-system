// ============================================
// TEST: EMAIL ESCAPING & TEMPLATE SAFETY
// Tests verifying HTML escaping of user-controlled values
// in email templates, preserving plain-text readability,
// and preventing XSS/HTML injection.
// ============================================

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { escapeHtml, buildEmailContent } = require('../server/utils/email');

describe('Email Template HTML Escaping & Security', () => {
  it('should correctly escape HTML special characters: <, >, &, ", \'', () => {
    assert.strictEqual(
      escapeHtml('<test>&"quote"\'single\'</test>'),
      '&lt;test&gt;&amp;&quot;quote&quot;&#39;single&#39;&lt;/test&gt;'
    );
  });

  it('should neutralize attempted script and HTML tags', () => {
    const maliciousPayload = '<script>alert("XSS & injection")</script>';
    const escaped = escapeHtml(maliciousPayload);

    assert.strictEqual(
      escaped,
      '&lt;script&gt;alert(&quot;XSS &amp; injection&quot;)&lt;/script&gt;'
    );
    assert.ok(!escaped.includes('<script>'));
    assert.ok(!escaped.includes('</script>'));
  });

  it('should safely handle null, undefined, and non-string inputs', () => {
    assert.strictEqual(escapeHtml(null), '');
    assert.strictEqual(escapeHtml(undefined), '');
    assert.strictEqual(escapeHtml(12345), '12345');
    assert.strictEqual(escapeHtml(''), '');
  });

  it('should escape user-controlled values (name, email, role) in HTML email', () => {
    const input = {
      name: 'Dr. Jane <Hacker> & "Tester"',
      email: 'jane+<attack>&"test"@university.edu',
      role: 'faculty',
      temporaryPassword: 'Temp<123>&"Pass"',
      loginUrl: 'https://resourcehub.edu/login?redirect=dashboard&source=email'
    };

    const { text, html } = buildEmailContent(input);

    // HTML assertions: must be escaped
    assert.ok(html.includes('&lt;Hacker&gt;'));
    assert.ok(html.includes('&amp; &quot;Tester&quot;'));
    assert.ok(html.includes('jane+&lt;tag&gt;') || html.includes('&lt;attack&gt;'));
    assert.ok(html.includes('Temp&lt;123&gt;&amp;&quot;Pass&quot;'));

    // HTML must NEVER contain unescaped raw user tags
    assert.ok(!html.includes('<Hacker>'));
    assert.ok(!html.includes('<attack>'));
    assert.ok(!html.includes('<123>'));

    // Verify role label is rendered safely
    assert.ok(html.includes('Faculty'));
  });

  it('should neutralize malicious injection in custom role strings', () => {
    const input = {
      name: 'Bob Attacker',
      email: 'bob@example.com',
      role: '<b onmouseover="alert(1)">InjectedRole</b>',
      temporaryPassword: 'Password123!',
      loginUrl: 'https://example.com/login'
    };

    const { html } = buildEmailContent(input);
    assert.ok(!html.includes('<b onmouseover'));
    assert.ok(html.includes('&lt;b onmouseover=&quot;alert(1)&quot;&gt;InjectedRole&lt;/b&gt;'));
  });

  it('should preserve the plain-text email readability and layout without HTML entity encoding', () => {
    const input = {
      name: 'John <Doe> & Friends',
      email: 'john@example.com',
      role: 'student',
      temporaryPassword: 'T3mp&P@ss<123>',
      loginUrl: 'http://localhost:5000/login'
    };

    const { text } = buildEmailContent(input);

    // Plain text must contain the literal unescaped characters for human readability
    assert.ok(text.includes('Hello John <Doe> & Friends,'));
    assert.ok(text.includes('T3mp&P@ss<123>'));
    assert.ok(!text.includes('&lt;Doe&gt;'));
    assert.ok(!text.includes('&amp;'));

    // Layout sections must be intact
    assert.ok(text.includes('ACCOUNT DETAILS'));
    assert.ok(text.includes('LOGIN'));
    assert.ok(text.includes('IMPORTANT'));
  });

  it('should not alter the login URL incorrectly or double-escape query parameters', () => {
    const testUrl = 'https://portal.university.edu/auth/callback?code=abc123&state=xyz789#section';
    const input = {
      name: 'Sam Student',
      email: 'sam@university.edu',
      role: 'student',
      temporaryPassword: 'safePassword123',
      loginUrl: testUrl
    };

    const { html, text } = buildEmailContent(input);

    // loginUrl should appear directly in href and in plain text
    assert.ok(html.includes(`href="${testUrl}"`));
    assert.ok(text.includes(testUrl));
  });
});
