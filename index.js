var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');

var app = express();

var credentials = require('./credentials.js');

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

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret
}));
app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({ extended: true }));

// Обработчик событий Flash message
app.use(function(req, res, next){
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
})

app.use(function(req, res, next){
  res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
  next();
});

// промежуточная функция для добавления погоды в контекст partials.weather
function getWeatherData(){
  return {
    locations: [
      {
        name: 'Портленд',
        forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
        iconUrl: 'https://icons.wxug.com/i/c/v4/cloudy.svg',
        weather: 'Сплошая облачность',
        tepm: '54.1 F (12.3 C)'
      },
      {
        name: 'Бенд',
        forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
        iconUrl: 'https://icons.wxug.com/i/c/v4/cloudy.svg',
        weather: 'Малооблачно',
        temp: '55.0 F (12.8 C)'
      },
      {
        name: 'Манзанита',
        forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
        iconUrl: 'https://icons.wxug.com/i/c/v4/rain.svg',
        weather: 'Небольшой дождь',
        temp: '55.0 F (12.8 C)'
      }
    ]
  };
}

app.use(function(req,res, next){
  if(!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weatherContext = getWeatherData();
  next();
});

app.use('/upload', function(req, res, next){
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function(){
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function(){
            return '/uploads/' + now;
        },
    })(req, res, next);
});

app.get('/newsletter', function(req, res){
  res.render('newsletter', {csrf: "CSRF  token goes here" });
});

function NewsletterSignup(){
};
NewsletterSignup.prototype.save = function(cb){
  cb();
};
var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/newsletter', function(req, res){
  var name = req.body.name || '', email = req.body.email || '';
  if(!email.match(VALID_EMAIL_REGEX)) {
    if(req.xhr) return res.json({ error: 'Invalid name email address.'});
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.',
    };
    return res.redirect(303, '/newsletter/archive');
  }
  new NewsletterSignup({name: name, email: email}).save(function(err){
    if(err) {
      if(req.xhr) return res.json({error: 'Database error'});
      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a tatabase error; please try again later.'
      };
      return res.redirect(303, '/newsletter/archive');
    };
    if(req.xhr) return res.json({succes: true});
  })
  res.session.flash = {
    type: 'succes',
    intro: 'Thank you!',
    message: 'You have now been signed up for the newsletter.'
  };
  return res.redirect(303, '/newsletter/archive');
});
app.get('/newsletter/archive', function(req, res){
  res.render('newsletter/archive');
});

app.post('/process', function(req, res){
  console.log('Form (from querystring: ' + req.query.form);
  console.log('CSRF token (from hidden form field): ' + req.body._csrf);
  console.log('Email (from visible form field): ' + req.body.name);
  console.log('Email (from visible form field): ' + req.body.email);
  res.redirect(303, '/thank-you');
});

app.get('/headers', function(req, res){
  res.set('Content-Type', 'text/plain');
  var s = '';
  for(var name in req.headers) {
    s += name + ": " + req.headers[name] + '\n';
  }
  res.send(s);
});

app.get('/nursery-rhyme', function(req, res){
  res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function(req, res){
  res.json({
    animal: 'бельчонок',
    bodyPart: 'хвост',
    adjective: 'пушистый',
    noun: 'черт'
  });
});

app.post('/process', function(req, res){
  if(res.xhr || req.accepts('json.html' )=== 'json'){
    res.send({success: true});
  } else {
    res.redirect(303, '/thank-you');
  }
});

app.get('/jquery-test', function(req, res){
  res.render('jquery-test');
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
  });
});

app.get('/thank-you', function(req, res){
  res.render('thank-you');
});



app.get('/contest/vacation-photo', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
});

app.post('/contest/vacation-photo/:year/:month', function(req, res){
  var form = new formidable. IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err) return res.redirect(303, '/error');
    console.log('received fields:');
    console.log(fields);
    console.log('received files:');
    console.log(files);
    res.redirect(303, '/thank-you');
  });
});

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