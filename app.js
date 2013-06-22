/**
 * Module dependencies.
 */
var express = require('express'),
		//passport = require('passport'),
		//LocalStrategy = require('passport-local').Strategy;
		fs = require('fs'),
		db = require('./server/database/database')
		//mongoose = require('mongoose'),
		routes = require('./routes'),
		user = require('./routes/user'),
		http = require('http'),
		path = require('path'),
		Auth = require('./server/auth'),
		Boot = require('./server/load');
		//UserController = require('./controllers/user'),
		User = require('./models/user');
		//hash = require('./server/pass').hash;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
// middleware
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('The world is full of secrets!'));
app.use(express.session('Yes, even wizards have secrets...'));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));

// Custom middleware must go here
// MOVE BELOW MW TO MIDDLEWARE.JS CALLED FROM LOAD.JS
app.use(function(req, res, next){
	var msgs = req.session.messages || [];
  // expose "messages" local variable
  res.locals.messages = msgs;
  // expose "hasMessages"
  res.locals.hasMessages = msgs.length;
	next();
	// "flush" the messages so they don't build up
  req.session.messages = [];
});

app.use(express.static(path.join(__dirname, 'public')));



// Connect to database
var Database = new db;
Database.connect('mongoose');


// passport strategy configurations
passport.use(new LocalStrategy({
    usernameField: 'email'
  },
  function(email, password, callback) {
    User.findOne({ email: email }, function(err, user) {
    	if (err) return callback(err);

			if(!user) return callback(null, false, {message: 'email-password-error'});

			// check is password is a match
			user.authenticate(password, function(err, match) {
				if (err) return callback(err);
				if(!match) return callback(null, false, {message: 'email-password-error'});
				return callback(null, user);
			});
		});
  }
));

passport.serializeUser(function(user, callback) {
  callback(null, user._id);
});

passport.deserializeUser(function(id, callback) {
	// User.findOne({_id: id}, function(err, user) {
  User.findById(id, function(err, user) {
    callback(err, user);
  });
});


//SAMPLE USAGE - MONGOOSE/PASSPORT TEST
/*
// fetch user and test password verification
User.findOne({ email: 'admin' }, function(err, user) {
	if (err) throw err;
	// console.log(user);
	// test a matching password
	user.authenticate('scotty', function(err, match) {
		if (err) throw err;
		console.log('scotty:', match); // -> Password123: true
	});

	// test a failing password
	user.authenticate('h34dtr1p', function(err, match) {
		if (err) throw err;
		console.log('h34dtr1p:', match); // -> 123Password: false
	});
});
*/


// Controller Area (routing)
app.get('/', routes.index);

Server = new Boot(app);
Server.load();

/*
app.get('/login', routes.login);
app.post('/login', passport.authenticate('local', { successRedirect: '/restricted',
                                   failureRedirect: '/login',
                                   failureFlash: false }));

app[Logout.method](Logout.path, Logout.get);

/*app.get('/logout', function(req, res){
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

app.get('/restricted', auth.restrict, function(req, res){
  res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});*/

//app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});