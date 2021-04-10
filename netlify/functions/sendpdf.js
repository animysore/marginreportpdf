const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const fetch = require('node-fetch');
const unzipper = require('unzipper');

const OAuth2 = google.auth.OAuth2;

exports.handler = async function(event, context, callback) {
  const { AttachmentUrl: url } = JSON.parse(event.body);
  const zipname = url.match(/[0-9]*-[0-9]*_dms_[0-9]*\.zip/g)[0];
  const filename = zipname.match(/[0-9]*_dms_[0-9]*\./g)[0].toUpperCase() + 'htm';
  
  try {
    const res = await fetch(url);
    res.body.pipe(unzipper.Extract({ path: './' }));
  } catch (e) {
    console.error(e); // should contain code (exit code) and signal (that caused the termination).
  }
  
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Redirect URL
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const accessToken = oauth2Client.getAccessToken();

  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.MAIL_LOGIN,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken
    }
  });
  console.log(event.body);
  console.log(process.env.MAIL_LOGIN)
  
  try { 
    const res = await transporter.sendMail({
      from: process.env.MAIL_LOGIN,
      to: process.env.MAIL_TO,
      subject: "Margin Statement: " + new Date().toLocaleString(),
      text: " Margin statement attached! ",
      attachments: [{
        path: filename
      }],
    });
    console.log(res);
    callback(null, { statusCode: 200, body: "Ok" });
  } catch (error) {
    console.error(error);
    callback(error);
  }
}
