const express = require('express');
const session = require('express-session');
const dotEnv = require('dotenv');
const bodyParser = require('body-parser');

const api = express();
dotEnv.config();

const passport = require('./authentication/passport.js');
const testAuth = require('./authentication/testAuth.js');

api.use(bodyParser);
api.use(session({ secret: 'tttt', resave: false, saveUninitialized: false }));
api.use(passport.initialize());
api.use(passport.session());

api.get('/login', passport.authenticate('github')); // <-- login could be anything
api.get('/auth/github/callback', (req, res) => {
  console.log(req.isAuthenticated());
  res.send('Callback Done');
}); // <---testing .isAuthenticated, it gives false (which means I am missing something
// but when I delete my key on github and login through '/login' route key re-appears 
// and if users (under github Oauth Apps) are reset
// it adds a user
api.get('/home', testAuth.confirm, testAuth.success);

api.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  console.log(`server is listening on ${process.env.PORT}`);
});
