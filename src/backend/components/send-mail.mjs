import sgMail from '@sendgrid/mail';

import config from "../config/default.json" with { type: "json" };


export async function sendEmailToAdmin (subject, html) {
  if (config.sendGrid.apiKey.length > 0) {
    sgMail.setApiKey(config.sendGrid.apiKey);
    // sgMail.setDataResidency('eu'); // Uncomment if using an EU regional subuser

    const msg = {
      to: config.sendGrid.to, // Change to your recipient
      from: config.sendGrid.from, // Change to your verified sender
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
