// Using SMTP.js to send emails
//* SmtpJS.com - v3.0.0 */

const fetch = require('node-fetch');
const key_map = require('./config');

const Email = {
  sendEmail: function(name, email, message) {
    return new Promise(function(resolve, reject) {
      try {
        const body = `
          Name: ${name}
          Email: ${email}
          Message: ${message}
        `;

        const smtpDetails = {
          Host: key_map.get('smtp_host'),
          Username: key_map.get('smtp_out'),
          Password: key_map.get('smtp_pass'),
          To: key_map.get('smtp_in'),
          From: key_map.get('smtp_out'),
          Subject: "New Email Alert",
          Body: body,
        };

        Email.send(smtpDetails)
          .then(message => resolve(message))
          .catch(error => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  },

  send: function(smtpDetails) {
    return new Promise(function(resolve, reject) {
      smtpDetails.nocache = Math.floor(1e6 * Math.random() + 1);
      smtpDetails.Action = "Send";
      const body = JSON.stringify(smtpDetails);

      fetch('https://smtpjs.com/v3/smtpjs.aspx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(data => resolve(data))
      .catch(error => reject(error));
    });
  }
};

module.exports = Email;




