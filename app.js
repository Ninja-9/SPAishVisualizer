var express = require('express');
var passport = require('passport');
var util = require('util');
var session = require('express-session');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var partials = require('express-partials');


// var GITHUB_CLIENT_ID = "--insert-github-client-id-here--";
// var GITHUB_CLIENT_SECRET = "--insert-github-client-secret-here--";

// var GITHUB_CLIENT_ID = "275d77acee736e151d9b";
// var GITHUB_CLIENT_SECRET = "77b04016d99710285d91867ec13194a031808e35";

let {GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET} = require('./keys.env');
console.log("GITHUB_CLIENT_ID === ", GITHUB_CLIENT_ID);
console.log("GITHUB_CLIENT_SECRET === ", GITHUB_CLIENT_SECRET);

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

let myAccessToken;
// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    myAccessToken = accessToken;
    console.log("IN app.js >> myAccessToken === ");
    console.log(JSON.stringify(myAccessToken));
    console.log(myAccessToken);
    
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));




var app = express();

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res){
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("IN app.js >> res.header === ");
    console.log(JSON.stringify(res._headers));
    console.log(req.headers);
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



// http://www.embeddedjs.com/getting_started.html

function getJSON_Obj(req, res, next) {
  console.log("IN  app.js >> getJSON_Obj(req, res, next)");
  let objGraphQL = {};
  objGraphQL.user = req.user;

  console.log(myAccessToken);

  // https://developer.github.com/v4/
  // https://developer.github.com/v4/guides/forming-calls/#the-graphql-endpoint
  // https://api.github.com/graphql

  const client = require('graphql-client')({
    url: 'https://api.github.com/graphql',
    headers: {
      Authorization: 'Bearer ' + myAccessToken
    }
  })

  // const variables = {
  //   query: "Search Query",
  //   limit: 100,
  //   from: 0
  // }

  // query search ($query: String, $from: Int, $limit: Int) {
  //   search(query: $query, from: $from, limit: $limit) {
  //     took,
  //     totalHits,
  //     hits {
  //       name
  //     }
  //   }
  // }

  const variables = {  
  }

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
  //   the following is the "parser" code for the above query
  // console.log("PROMISE(body) app.js >> getJSON_Obj(req, res)");
  // console.log(body);
  // console.log("_____________________________________________");
  // console.log(body.data.viewer.repository);
  // console.log("_____________________________________________");
  // let arrEntries = body.data.viewer.repository.object.entries;
  // for (let i = 0; i < arrEntries.length; i += 1) {
  //   console.log(arrEntries[i]);
  //   console.log("^^^^ [" + i + "]______________________");
  // }


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
  
client.query(qryStrSchema, variables, function(req, res, next) {
    if(res.status === 401) {
      throw new Error('Not authorized')
    }
  })
  .then(function(body) {
    console.log("PROMISE(body) app.js >> getJSON_Obj(req, res)");
    console.log(body);
    console.log("_____________________________________________");
    console.log(body.data.repository.object.text);
    console.log("_____________________________________________");
    // let arrEntries = body.data.viewer.repository.object.entries;
    // for (let i = 0; i < arrEntries.length; i += 1) {
    //   console.log(arrEntries[i]);
    //   console.log("^^^^ [" + i + "]______________________");
    // }
    res.locals.graphQLData = body.data.repository.object;
    next();
    
  })
  .catch(function(err) {
    console.log(err.message)
  });

  
  // ToDo   stuff objGraphQL somewhere in req ??? where ???

  //        http://expressjs.com/en/api.html#app.locals
  //             app.locals for objects which don't vary from request to request
  //        http://expressjs.com/en/api.html#res.locals
  //             Express has a response.locals object which is meant for this purpose
  //              - extending the response from middleware to make it available to views.

  console.log("OUT app.js >> getJSON_Obj(req, res, next)");
}

app.get('/graphQL-Query', ensureAuthenticated, getJSON_Obj, function(req, res){
  res.render('graphQL-Query', { user: req.user, graphQLData : res.locals.graphQLData });
});






console.log("Tharr be dragons  @  http://127.0.0.1:3000  on  ", Date());
app.listen(3000);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}