
const { google } = require("googleapis");

const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

const getGoogleAuthorizationUrl = (state) => {
  const oauth2Client = getGoogleOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "openid",
      "email"
    ],
    state
  });
};

module.exports = {
  getGoogleOAuthClient,
  getGoogleAuthorizationUrl
};
