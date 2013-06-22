
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
  	title: 'Vocada'
  });
};


/*
 * GET login page.
 */

exports.login = function(req, res){
  res.render('user/login', {
  	title: 'Vocada | Login',
  	loginError: false,
  	passwordReset: false
  });
};