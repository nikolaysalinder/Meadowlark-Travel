var express = require('express');
var fortune = require('./lib/fortune.js')

var app = express();

// Установка механизма представления HTML handlebars
var handlebars = require('express-handlebars').create({
	defaultLayout:'main',
	//этот код надо внести для того чтобы не было Error: Missing helper "section"
	//this piece of a code is necessary to avoid Error: Missing helper "section"
	helpers: {
		section: function(name, options){
			if(!this._sections) this._sections = {};
			this._sections[name]=options.fn(this);
			return null;
		}
	} 
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.port || 3000);

app.use(function(req, res, next){
	res.locals.showTests = app.get('env') !== 'production' && 
		req.query.test === '1';
	next();
});

app.get('/tours/hood-river', function(req, res){
	res.render('tours/hood-river');
});

app.get('/tours/oregon-coast', function(req, res){
	res.render('tours/oregon-coast');
});

app.get('/tours/request-group-rate', function(req, res){
	res.render('tours/request-group-rate');
});

app.get('/', function(req, res){
	res.render('home');
});

app.get('/about', function(req,res){
	res.render('about', { 
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js' 
	} );
});

app.use(express.static(__dirname + '/public'));

// Обобщенный обработчик 404 (промежуточное ПО)
app.use(function(req, res) {
	res.status(404);
	res.render('404');
});

// Обобщенный обработчик 500 (промежуточное ПО)
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log( 'Express запущен на http://localhost:' + app.get('port') + ':нажмите Ctrl+C для завершения.' );
});