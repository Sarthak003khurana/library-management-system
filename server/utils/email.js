// ============================================
// EMAIL.JS - ResourceHub Email Service
// ============================================
//
// Sends account-creation emails using Gmail
// through Nodemailer.
//
// Required .env variables:
//
// EMAIL_USER=yourgmail@gmail.com
// EMAIL_APP_PASSWORD=your-gmail-app-password
//
// ============================================

const nodemailer = require('nodemailer');


// ============================================
// EMAIL TRANSPORTER
// ============================================

const transporter = nodemailer.createTransport({

  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }

});


// ============================================
// VERIFY EMAIL CONFIGURATION
// ============================================

async function verifyEmailConfiguration() {

  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_APP_PASSWORD
  ) {

    console.warn(
      '⚠️ Email configuration is missing. Account emails will not be sent.'
    );

    return false;

  }


  try {

    await transporter.verify();

    console.log(
      '✓ Email service initialized successfully'
    );

    return true;

  }
  catch (error) {

    console.error(
      '✕ Email service verification failed:',
      error.message
    );

    return false;

  }

}


// ============================================
// SEND ACCOUNT CREATION EMAIL
// ============================================

async function sendAccountCreationEmail({

  name,
  email,
  role,
  temporaryPassword,
  loginUrl

}) {

  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_APP_PASSWORD
  ) {

    throw new Error(
      'Email service is not configured. Please check EMAIL_USER and EMAIL_APP_PASSWORD in .env'
    );

  }


  const roleNames = {

    student: 'Student',

    faculty: 'Faculty',

    lab_manager: 'Lab Manager',

    admin: 'Administrator'

  };


  const roleName =
    roleNames[role] || role;


  const mailOptions = {

    from: {

      name: 'ResourceHub',

      address: process.env.EMAIL_USER

    },

    to: email,

    subject:
      'Your ResourceHub Account Has Been Created',


    text: `

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

    `.trim(),


    html: `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <title>
    ResourceHub Account
  </title>

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
        Hello <strong>${name}</strong>,
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
          ${name}
        </p>

        <p>
          <strong>Email:</strong>
          ${email}
        </p>

        <p>
          <strong>Role:</strong>
          ${roleName}
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
          ${temporaryPassword}
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

    `.trim()

  };


  const result =
    await transporter.sendMail(
      mailOptions
    );


  console.log(
    `✓ Account creation email sent to ${email}`
  );


  return result;

}


// ============================================
// EXPORT
// ============================================

module.exports = {

  sendAccountCreationEmail,

  verifyEmailConfiguration

};