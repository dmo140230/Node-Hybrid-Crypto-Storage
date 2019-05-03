var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var upload = require('jquery-file-upload-middleware');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var hybridCrypto = require('./hybridCryptoStore');
var uploadDir = '/public/uploads/'
var app = express();

// configure upload middleware
upload.configure({
	uploadDir: __dirname + uploadDir,
	uploadUrl: '/upload'
});
upload.on('end', function (fileInfo, req, res) {
	if(req.query.type == 'encrypt'){
		hybridCrypto.store(uploadDir + fileInfo.name, 3, function(err, data){
			console.log(data);
			//return res.download(__dirname + '/' + data.image);
		})
	}
	else if(req.query.type == 'decrypt'){
		hybridCrypto.restore(uploadDir + fileInfo.name, function(err, data){
			console.log('received data ' , data);
			//return res.download(__dirname + '/' + data.result);
		});
	}
});

/// Redirect all to home except post
app.get('/upload', function( req, res ){
	res.redirect('/');
});

app.put('/upload', function( req, res ){
	res.redirect('/');
});

app.delete('/upload', function( req, res ){
	res.redirect('/');
});

app.use('/upload', function(req, res, next){
	upload.fileHandler({
		uploadDir: function () {
			return __dirname + '/public/uploads/'
		},
		uploadUrl: function () {
			return '/uploads'
		}
	})(req, res, next);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
