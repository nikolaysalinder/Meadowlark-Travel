var express = require('express');
var formidable = require('formidable');
var jqupload = require('jquery-file-upload-middleware');
var nodemailer = require('nodemailer');
var csurf = require('csurf');


var app = express();

var credentials = require('./credentials.js');
var fortune = require('./lib/fortune.js');
var cartValidation = require('./lib/tourRequiresWaiver.js');

var transporter = nodemailer.createTransport({
  // эти строчки необходимы для того чтобы не было ошибки this.transporter.mailer = this
  // но перед этим необходимо перейти в свой аккаунт гугл и разрешить доступ приложениям https://myaccount.google.com/lesssecureapps
  // This code is nessesery to avoid Error this.transporter.mailer = this 
  // But first you need to login in your gmail account https://myaccount.google.com/lesssecureapps and turn on access applications with low security level
  service: 'gmail',
  secure: false,
  port: 25,
  auth: {
    user: credentials.gmail.user,
    pass: credentials.gmail.password
  },
  tls: {
    rejectUnauthorized: false
  }
});
// transporter.sendMail({
//   from: '"John" <foo@gmail.com>',
//   to: 'bar@gmail.com, "Vasya" <foo@gmail.com>',
//   subject: 'It\'s third letter',
//   text: 'Текст сообщения тут'
// }, function(err, res){
//   if(err){ 
//     console.log('Невозможно отправить письмо' + err);
//   } else {
//     console.log('Сообщение отправлено');
//     console.log(res);
//   }
// });

// Установка механизма представления HTML handlebars
var handlebars = require('express-handlebars').create({
  defaultLayout:'main',
  //этот код надо внести для того чтобы не было Error: Missing helper "section"
  //this code is necessary to avoid Error: Missing helper "section"
  helpers: {
    section: function(name, options){
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
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
//app.use(csurf);



// Обработчик событий Flash message 
app.use(function(req, res, next){
  //если есть флэш сообщение то
  //присвоаиваем в контекст ответа и удаляем
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
        temp: '54.1 F (12.3 C)'
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
// промежуточная функция для добавления погоды в контекст
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

// Шаблон для искусственной базы данных
function Product(){
}
Product.find = function(conditions, fields, options, cb){
  if(typeof conditions==='function') {
    cb = conditions;
    conditions = {};
    fields = null;
    options = {};
  } else if(typeof fields==='function') {
    cb = fields;
    fields = null;
    options = {};
  } else if(typeof options==='function') {
    cb = options;
    options = {};
  }
  var products = [
    {
      name: 'Hood River Tour',
      slug: 'hood-river',
      category: 'tour',
      maximumGuests: 15,
      sku: 723,
    },
    {
      name: 'Oregon Coast Tour',
      slug: 'oregon-coast',
      category: 'tour',
      maximumGuests: 10,
      sku: 446,
    },
    {
      name: 'Rock Climbing in Bend',
      slug: 'rock-climbing/bend',
      category: 'adventure',
      requiresWaiver: true,
      maximumGuests: 4,
      sku: 944,
    }
  ];
  cb(null, products.filter(function(p) {
    if(conditions.category && p.category!==conditions.category) return false;
    if(conditions.slug && p.slug!==conditions.slug) return false;
    if(isFinite(conditions.sku) && p.sku!==Number(conditions.sku)) return false;
    return true;
  }));
};
Product.findOne = function(conditions, fields, options, cb){
  if(typeof conditions==='function') {
    cb = conditions;
    conditions = {};
    fields = null;
    options = {};
  } else if(typeof fields==='function') {
    cb = fields;
    fields = null;
    options = {};
  } else if(typeof options==='function') {
    cb = options;
    options = {};
  }
  Product.find(conditions, fields, options, function(err, products){
    cb(err, products && products.length ? products[0] : null);
  });
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
    req.session.flash = {
      type: 'succes',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.'
    };
    return res.redirect(303, '/newsletter/archive');
  });
});
app.get('/newsletter/archive', function(req, res){
  res.render('newsletter/archive');
});

app.get('/contest/vacation-photo', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', {
    year: now.getFullYear(),
    month: now.getMonth()
  });
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
  if(req.xhr || req.accepts('json.html' )=== 'json'){
    res.send({success: true});
  } else {
    res.redirect(303, '/thank-you');
  }
});

app.get('/jquery-test', function(req, res){
  res.render('jquery-test');
});

// app.get('/tours/hood-river', function(req, res){
//   res.render('tours/hood-river');
// });

// app.get('/tours/oregon-coast', function(req, res){
//   res.render('tours/oregon-coast');
// });

// app.get('/tours/request-group-rate', function(req, res){
//   res.render('tours/request-group-rate'); 
// });

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

app.get('/tours/:tour', function(req, res, next){
  Product.findOne({ category: 'tour', slug: req.params.tour }, function(err, tour){
    if(err) return next(err);
    if(!tour) return next();
    res.render('tour', { tour: tour });
  });
});
app.get('/adventures/:subcat/:name', function(req, res, next){
  Product.findOne({ category: 'adventure', slug: req.params.subcat + '/' + req.params.name  }, function(err, adventure){
    if(err) return next(err);
    if(!adventure) return next();
    res.render('adventure', { adventure: adventure });
  });
});

var cartValidation = require('./lib/cartValidation.js');

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

app.post('/cart/add', function(req, res, next){
  var cart = req.session.cart || (req.session.cart = {items: [] });
  Product.findOne({ sku: req.body.sku }, function(err, product){
    if(err) return next(err);
    if(!product) return next(new Error('Unknown product SKU: ' + req.body.sku));
    cart.items.push({
      product: product,
      guests: req.body.guests || 0,
    });
    res.redirect(303, '/cart');
  });
});


app.get('/cart', function(req, res, next){
  var cart = req.session.cart;
  if(!cart) next();
  res.render('cart', { cart: cart });
});

app.get('/cart/checkout', function(req, res, next){
  var cart = req.session.cart;
  if(!cart) next();
  res.render('cart-checkout');
});

app.get('/cart/thank-you', function(req, res){
  res.render('cart-thank-you', { cart: req.session.cart });
});

app.get('/email/cart/thank-you', function(req, res){
  res.render('email/cart-thank-you', { cart: req.session.cart, layout: null });
});

app.post('/cart/checkout', function(req, res, next){
  var cart = req.session.cart;
  if(!cart) return next(new Error('Корзина не существует.'));
  var name = req.body.name || '',
      email = req.body.email || '';
  // проверка вводимых данных
  if(!email.match(VALID_EMAIL_REGEX)){
    return res.next(new Error('некорректный адресс электронной почты'));
  }
  //Присваиваем случайный идентификатор корзины
  //При обычных условиях мы бы использовали здесь идентификатор из БД
  cart.number = Math.random().toString().replace(/^0\.0*/,'');
  cart.billing = {
    name: name,
    email: email,
  },
  res.render('email/cart-thank-you',{layout: null, cart: cart}, function(err,  html){
    if(err) console.log('Ошибка в шаблоне письма');
    transporter.sendMail({
      from: '"Meadow-lark Travel": <info@meadowlarktravel.com>',
      to: cart.billing.email,
      subject: 'Спасибо за заказ поездки в Meadowlarktravel',
      html: html,
      generateTextFromHtml: true
    }, function(err){
      if(err){
        console.error('Не могу отправить подтверждение: ' + err.stack);
      }
    });
  });
  res.render('cart-thank-you', {cart: cart});
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