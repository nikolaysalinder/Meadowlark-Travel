var express = require('express');

var app = express();

var fortunes = [
	"Победи",
	"win",
	"You are winner",
	"You are the best",
	"Ты лучший",
	"The best ever"
];

// Установка механизма представления HTML handlebars
var handlebars = require('express-handlebars')
	.create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.port || 3000);

app.get('/', function(req, res){
	res.render('home');
});
app.get('/about', function(req, res){
	var randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
	res.render('about', { fortune: randomFortune });
});

app.use(express.static(__dirname + '/public'));

// Обобщенный обработчик 404 (промежуточное ПО)
app.use(function(req, res) {
	res.status(404);
	res.render('404');
});

// Обобщенный обработчик 500 (промежуточное ПО)
app.use(function(err, req, res, next) {
	console.log(err.stack);
	res.type('text/plain');
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log( 'Express запущен на http://localhost:' + app.get('port') + ':нажмите Ctrl+C для завершения.' );
});