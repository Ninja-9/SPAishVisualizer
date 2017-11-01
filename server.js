const express = require('express');
const session = require('express-session');
const dotEnv = require('dotenv');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const partials = require('express-partials');
const path = require('path');

const api = express();
dotEnv.config();

const { passport, getToken } = require('./authentication/passport.js');
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


function getJSON_Obj(req, res, next) {
  console.log('Enter getJSON_obj');
  const objGraphQL = {};
  objGraphQL.user = req.user;
  const client = require('graphql-client')({
    url: 'https://api.github.com/graphql',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  const variables = {};

  let qryStrSchema;
  qryStrSchema = `
  {
    __schema {
      types {
        name
        kind
        description
        fields {
          name
        }
      }
    }
  }
  `;

  //  the query for the [root] of the [master] branch (which works...)
  qryStrSchema = `
  {
    viewer {
      repository(name: "XHR-Demystified_byGeorge2.0") {
        object(expression: "master:") {
        ... on Tree{
          entries{
            name
            type
            mode
          }
        }
      }
      }
    }
  }
  `;

  qryStrSchema = `
  query {
    repository(name: "XHR-Demystified_byGeorge2.0", owner: "PracticalCode") {
      object(expression: "master:WebFunctions.js") {
        ... on Blob {
          text
        }
      }
    }
  }
  `;

  console.log('Hit clientQuery');
  client.query(qryStrSchema, variables, (req, res, next) => {
    console.log(`Inside client.query --- status = ${res}`);
    if (res.status === 401) {
      console.log('Inside if Statement')
      throw new Error('Not authorized');
    }
  })
  .then((body) => {
    console.log(`Body Exists: ${body !== undefined}`);
    res.locals.graphQLData = body.data.repository.object;
    next();
  })
  .catch(err => err.message);
}

api.get('/graphQL-Query', testAuth.confirm, getJSON_Obj, (req, res) => {
  console.log('inside api.get');
  res.render('/graphQL-Query', { user: req.user, graphQLData: res.locals.graphQLData });
});


api.listen(process.env.PORT, (err) => {
  if (err) console.log(err);
  console.log(`server is listening on ${process.env.PORT}`);
});
