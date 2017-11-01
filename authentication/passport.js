const passport = require('passport');
const oauthObj = require('./oauth.js');
// const configure = require('./config.js');
const strategies = require('./strategies.js');
const serial = require('./serial.js');


let myAccessToken;

passport.serializeUser(serial.storeUser);
passport.deserializeUser(serial.attachUser);
passport.use(new strategies.Github(oauthObj.github, (accessToken, refreshToken, profile, done) => {
  console.log('NOT HAPPENING??');
  myAccessToken = accessToken;
  process.nextTick(() => done(null, profile));
}));

function getToken() {
  console.log(myAccessToken);
  return myAccessToken;
}
module.exports = { passport, getToken };
