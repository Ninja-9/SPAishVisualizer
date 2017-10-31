const express = require('express');
const session = require('express-session');
const dotEnv = require('dotenv');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const partials = require('express-partials');
const path = require('path');

const api = express();
dotEnv.config();

const passport = require('./authentication/passport.js');
const testAuth = require('./authentication/testAuth.js');

api.set('views', path.join(__dirname, '/views'));
api.set('view engine', 'ejs');
api.use(partials());
api.use(bodyParser.urlencoded({ extended: true }));
api.use(bodyParser.json());
api.use(methodOverride());
api.use(session({ secret: 'tttt', resave: false, saveUninitialized: false }));
api.use(passport.initialize());
api.use(passport.session());
api.use(express.static(path.join(__dirname, '/public'))); // < No clue why this is being used...

api.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

api.get('/account', testAuth.confirm, testAuth.success);

api.get('/login', (req, res) => {
  res.render('login', { user: req.user });
});

api.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }));

// redirects back to login if authentication fails otherwise '/' route
api.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  });

api.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function getJSON_Obj(req, res) {
  let objGraphQL = {};
  objGraphQL.user = req.user;
  const { graphql, buildSchema } = require('graphql');

  return objGraphQL;
}

api.get('/graphQL-Query', testAuth.confirm, (req, res) => {
  res.render('graphQL-Query', getJSON_Obj(req, res));
});
// api.get('/login', passport.authenticate('github')); // <-- login 'route' could be anything
// api.get('/auth/github/callback', (req, res) => {
//   if (req.isAuthenticated()) ;
//   res.send('Callback Done');
// }); // <---testing .isAuthenticated, it gives false (which means I am missing something
// but when I delete my key on github and login through '/login' route key re-appears
// and if users (under github Oauth Apps) are reset
// it adds a user
// api.get('/home', testAuth.confirm, testAuth.success);

api.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  console.log(`server is listening on ${process.env.PORT}`);
});
