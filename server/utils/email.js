// ============================================
// EMAIL.JS - ResourceHub Email Service
// ============================================
//
// Supports two email providers:
//
// LOCAL:
//   EMAIL_PROVIDER=gmail
//   Uses Gmail + Nodemailer
//
// PRODUCTION / RENDER:
//   EMAIL_PROVIDER=resend
//   Uses Resend HTTPS API
//
// ============================================

const nodemailer = require('nodemailer');


// ============================================
// PROVIDER CLIENTS
// ============================================

let gmailTransporter = null;
let resendClient = null;


// ============================================
// GET EMAIL PROVIDER
// ============================================

function getEmailProvider() {
  if (process.env.EMAIL_PROVIDER) {
    return process.env.EMAIL_PROVIDER.toLowerCase().trim();
  }
  // Auto-detect provider if not explicitly specified
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }
  return 'gmail';
}


// ============================================
// GMAIL TRANSPORTER
// ============================================

function getGmailTransporter() {
  if (!process.env.EMAIL_USER) {
    throw new Error('EMAIL_USER is not configured.');
  }

  if (!process.env.EMAIL_APP_PASSWORD) {
    throw new Error('EMAIL_APP_PASSWORD is not configured.');
  }

  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      // Timeout settings to prevent hangs on network or credential issues
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return gmailTransporter;
}


// ============================================
// RESEND CLIENT
// ============================================

function getResendClient() {

  if (!process.env.RESEND_API_KEY) {

    throw new Error(
      'RESEND_API_KEY is not configured.'
    );

  }


  if (!resendClient) {

    const {
      Resend
    } = require('resend');


    resendClient =
      new Resend(
        process.env.RESEND_API_KEY
      );

  }


  return resendClient;

}


// ============================================
// VERIFY EMAIL CONFIGURATION
// ============================================

async function verifyEmailConfiguration() {

  const provider =
    getEmailProvider();


  // ==========================================
  // GMAIL
  // ==========================================

  if (provider === 'gmail') {

    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_APP_PASSWORD
    ) {

      console.warn(
        '⚠️ Gmail email configuration is missing.'
      );

      return false;

    }


    try {

      await getGmailTransporter().verify();

      console.log(
        '✓ Gmail email service initialized successfully'
      );

      return true;

    }
    catch (error) {

      console.error(
        '✕ Gmail email service verification failed:',
        error.message
      );

      return false;

    }

  }


  // ==========================================
  // RESEND
  // ==========================================

  if (provider === 'resend') {

    if (!process.env.RESEND_API_KEY) {

      console.warn(
        '⚠️ RESEND_API_KEY is missing.'
      );

      return false;

    }


    if (!process.env.EMAIL_FROM) {
      console.warn(
        '⚠️ EMAIL_FROM is not explicitly set; defaulting to "ResourceHub <onboarding@resend.dev>".'
      );
    }

    try {
      getResendClient();
      console.log(
        '✓ Resend email service initialized successfully'
      );
      return true;
    }
    catch (error) {
      console.error(
        '✕ Resend email service initialization failed:',
        error.message
      );
      return false;
    }
  }


  // ==========================================
  // INVALID PROVIDER
  // ==========================================

  console.error(
    `✕ Unsupported EMAIL_PROVIDER: ${provider}`
  );

  console.error(
    'Supported providers: gmail, resend'
  );

  return false;

}


// ============================================
// HTML ESCAPING HELPER
// ============================================
// Reusable HTML escaping helper. Escapes &, <, >, ", and '.
// Prevents HTML injection / XSS in rendered email clients.
// ============================================

function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ============================================
// BUILD EMAIL CONTENT
// ============================================

function buildEmailContent({

  name,
  email,
  role,
  temporaryPassword,
  loginUrl

}) {


  // ==========================================
  // ROLE NAMES
  // ==========================================

  const roleNames = {

    student:
      'Student',

    faculty:
      'Faculty',

    lab_manager:
      'Lab Manager',

    admin:
      'Administrator'

  };


  const roleName =
    roleNames[role] || role;


  // ==========================================
  // PLAIN TEXT EMAIL
  // ==========================================
  // Unescaped plain text preserves natural readability
  // and original layout without HTML entity encoding.

  const text = `

Hello ${name},

Your ResourceHub account has been created successfully.

----------------------------------------
ACCOUNT DETAILS
----------------------------------------

Name:
${name}

Email:
${email}

Role:
${roleName}

Temporary Password:
${temporaryPassword}

----------------------------------------
LOGIN
----------------------------------------

Login here:
${loginUrl}

----------------------------------------
IMPORTANT
----------------------------------------

This is a temporary password.

You must change your password after
your first login.

Please keep these credentials secure.

If you did not expect this account,
please contact your administrator.

Regards,
ResourceHub Administration

  `.trim();


  // ==========================================
  // HTML EMAIL
  // ==========================================
  // User-controlled values are safely HTML-escaped.
  // loginUrl is preserved directly without alteration or double-escaping.

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeRoleName = escapeHtml(roleName);
  const safeTemporaryPassword = escapeHtml(temporaryPassword);

  const html = `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <title>ResourceHub Account</title>

</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:600px;
      margin:40px auto;
      background:#ffffff;
      border-radius:12px;
      overflow:hidden;
      box-shadow:0 4px 20px rgba(0,0,0,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        background:#4f46e5;
        padding:30px;
        color:#ffffff;
      "
    >

      <h1
        style="
          margin:0;
          font-size:28px;
        "
      >
        ResourceHub
      </h1>

      <p
        style="
          margin:8px 0 0;
          opacity:0.9;
        "
      >
        Library &amp; Lab Booking System
      </p>

    </div>


    <!-- CONTENT -->

    <div
      style="
        padding:30px;
        color:#334155;
      "
    >

      <h2>
        Your account has been created
      </h2>


      <p>
        Hello <strong>${safeName}</strong>,
      </p>


      <p>
        An administrator has created your
        ResourceHub account.
      </p>


      <!-- ACCOUNT DETAILS -->

      <div
        style="
          margin:25px 0;
          padding:20px;
          background:#f8fafc;
          border-radius:10px;
          border:1px solid #e2e8f0;
        "
      >

        <p>
          <strong>Name:</strong>
          ${safeName}
        </p>

        <p>
          <strong>Email:</strong>
          ${safeEmail}
        </p>

        <p>
          <strong>Role:</strong>
          ${safeRoleName}
        </p>

      </div>


      <!-- PASSWORD -->

      <div
        style="
          margin:25px 0;
          padding:20px;
          background:#fef3c7;
          border:1px solid #f59e0b;
          border-radius:10px;
        "
      >

        <p
          style="
            margin-top:0;
            font-weight:bold;
            color:#92400e;
          "
        >
          Temporary Password
        </p>


        <div
          style="
            padding:14px;
            background:#ffffff;
            border-radius:8px;
            font-family:monospace;
            font-size:20px;
            font-weight:bold;
            color:#111827;
            text-align:center;
            letter-spacing:1px;
          "
        >
          ${safeTemporaryPassword}
        </div>


        <p
          style="
            margin-bottom:0;
            font-size:13px;
            color:#92400e;
          "
        >
          You will be required to change this
          password after your first login.
        </p>

      </div>


      <!-- LOGIN BUTTON -->

      <div
        style="
          text-align:center;
          margin:30px 0;
        "
      >

        <a
          href="${loginUrl}"
          style="
            display:inline-block;
            padding:14px 28px;
            background:#4f46e5;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-weight:bold;
          "
        >
          Login to ResourceHub
        </a>

      </div>


      <p
        style="
          font-size:13px;
          color:#64748b;
        "
      >
        If you did not expect this account,
        please contact your administrator.
      </p>

    </div>


    <!-- FOOTER -->

    <div
      style="
        padding:20px 30px;
        background:#f8fafc;
        border-top:1px solid #e2e8f0;
        font-size:12px;
        color:#64748b;
        text-align:center;
      "
    >

      ResourceHub Administration

    </div>

  </div>

</body>

</html>

  `.trim();


  return {
    text,
    html
  };

}


// ============================================
// SEND ACCOUNT CREATION EMAIL
// ============================================

async function sendAccountCreationEmail({
  name,
  email,
  role,
  temporaryPassword,
  loginUrl,
}) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error(`Invalid recipient email address: "${email}"`);
  }

  const provider = getEmailProvider();

  const { text, html } = buildEmailContent({
    name,
    email,
    role,
    temporaryPassword,
    loginUrl,
  });

  // ==========================================
  // GMAIL
  // ==========================================

  if (provider === 'gmail') {
    const transporter = getGmailTransporter();

    const mailOptions = {
      from: {
        name: 'ResourceHub',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Your ResourceHub Account Has Been Created',
      text,
      html,
    };

    try {
      const result = await transporter.sendMail(mailOptions);

      console.log(
        `✓ Account creation email sent to ${email} using Gmail`
      );

      if (result.messageId) {
        console.log(`✓ Gmail message ID: ${result.messageId}`);
      }

      return result;
    } catch (error) {
      console.error(
        `✕ Gmail email failed for ${email}:`,
        error.message
      );
      throw error;
    }
  }

  // ==========================================
  // RESEND
  // ==========================================

  if (provider === 'resend') {
    const fromAddress =
      process.env.EMAIL_FROM || 'ResourceHub <onboarding@resend.dev>';

    const resend = getResendClient();

    try {
      const result = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: 'Your ResourceHub Account Has Been Created',
        text,
        html,
      });

      if (result.error) {
        throw new Error(
          result.error.message || 'Resend failed to send the email.'
        );
      }

      console.log(
        `✓ Account creation email sent to ${email} using Resend`
      );

      console.log(
        `✓ Resend email ID: ${result.data?.id || 'unknown'}`
      );

      return result.data;
    } catch (error) {
      console.error(
        `✕ Resend email failed for ${email}:`,
        error.message
      );
      throw error;
    }
  }


  // ==========================================
  // INVALID PROVIDER
  // ==========================================

  throw new Error(
    `Unsupported EMAIL_PROVIDER: ${provider}. ` +
    `Use "gmail" or "resend".`
  );

}


// ============================================
// EXPORT
// ============================================

module.exports = {

  escapeHtml,

  buildEmailContent,

  sendAccountCreationEmail,

  verifyEmailConfiguration

};