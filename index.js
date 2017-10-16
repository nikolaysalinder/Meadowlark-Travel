let http = require('http');
let express = require('express');
let formidable = require('formidable');
let nodemailer = require('nodemailer');
let fs = require('fs');
let vhost = require('vhost');
let Vacation = require('./models/vacation.js');
let VacationInSeasonListener = require('./models/vacationInSeasonListener.js');

let app = express();

let credentials = require('./credentials.js');

let fortune = require('./lib/fortune.js');

// Установка механизма представления HTML handlebars
let handlebars = require('express-handlebars').create({
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

// позволяет лучше перехватывать ошибки 
app.use(function(req, res, next){
  // создаем домен
  let domain = require('domain').create();
  // обрабатываем ошибки на этом домене
  domain.on('error', function(err){
    console.error('Перехвачена ошибка домена\n', err.stack);
    try {
      // Отказобезопасный останов через 5 секунд
      setTimeout(function(){
        console.error('Отказобезопасный останов');
        process.exit(1);
      }, 5000);

      // Отключение от кластера
      let worker = require('cluster').worker;
      if(worker) worker.disconnect();

      // прекращение принятя новых запросов
      server.close();

      try {
        // пытаемся обработать ошибки в express
        next(err);
      } catch(error){
        // если express обработчик ошибок не сработал 
        // пробуем выдать текстовый ответ node
        console.error('Обработчик ошибок экспресс не сработал.\n', error.stack);
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Ошибка сервера.');
      }
    } catch(error){
      console.error('Невозможно отправить ответ 500.\n', error.stack);
    }
  });

  // добавляем объекты запроса и ответа в домен
  domain.add(req);
  domain.add(res);

  // выполняем оставшиеся цепочки запроса в домене
  domain.run(next);
});

// Логирование
switch(app.get('env')){
  case 'development': 
    //сжатое многоцветовое журналирование для разработки
    app.use(require('morgan')('dev'));
    break;
  case 'production':
    //Модуль express-logger поддерживает ежедневное 
    //чередование файлов журнала
    app.use(require('express-logger')({
      path: __dirname + '/log/requests.log'
    }));
    break; 
}

let MongoSessionStore = require('session-mongoose')(require('connect'));
let sessionStore = new MongoSessionStore({ url: credentials.mongo[app.get('env')].connectionString });

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret,
  store: sessionStore
}));

app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({ extended: true }));
//app.use(csurf);

//конфигурация базы данных
let mongoose = require('mongoose');
let options = {
  server: {
    socketOptions: { keepAlive: 1 }
  }
};

switch(app.get('env')){
  case 'development':
    mongoose.connect(credentials.mongo.development.connectionString, options);
    break;
  case 'production':
    mongoose.connect(credentials.mongo.production.connectionString, options);
    break;
  default:
    throw new Error('Незнакомая среда выполнения : ' + app.get('env'));
}

Vacation.find(function(err, vacations){
  if(vacations.length) return;

  new Vacation({
    name: 'Hood River Day Trip',
    slug: 'hood-river-day-trip',
    category: 'Day Trip',
    sku: 'HR199',
    description: 'Проведите день, приезжайте в Колумбию и наслаждаясь крафтовым пивом в Худ-Ривер!',
    priceInCents: 9995,
    tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
    inSeason: true,
    maximumGuests: 16,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Oregon Coast Getaway',
    slug: 'oregon-coast-getaway',
    category: 'Weekend Getaway',
    sku: 'OC39',
    description: 'Наслаждайтесь океанским воздухом и странными прибрежными городами!',
    priceInCents: 269995,
    tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
    inSeason: true,
    maximumGuests: 8,
    available: true,
    packagesSold: 0,
  }).save();

  new Vacation({
    name: 'Rock Climbing in Bend',
    slug: 'rock-climbing-in-bend',
    category: 'Adventure',
    sku: 'B99',
    description: 'Испытайте острые ощущения скалолазания в высокой пустыне.',
    priceInCents: 289995,
    tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
    inSeason: true,
    requiresWaiver: false,
    maximumGuests: 4,
    available: false,
    packagesSold: 0,
    notes: 'Гид в настоящее время восстанавливается с лыжного несчастного случая.',
  }).save();
});

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

// app.use('/upload', function(req, res, next){
//   let now = Date.now();
//   jqupload.fileHandler({
//     uploadDir: function(){
//       return __dirname + '/public/uploads/' + now;
//     },
//     uploadUrl: function(){
//       return '/uploads/' + now;
//     },
//   })(req, res, next);
// });


// app.get('/newsletter', function(req, res){
//   res.render('newsletter', {csrf: "CSRF  token goes here" });
// });


// app.post('/vacations', function(req, res){
//   Vacation.findOne({ sku: req.body.purchaseSku }, function(err, vacation){
//     if(err || !vacation) {
//       req.session.flash = {
//         type: 'warning',
//         intro: 'Упссс!',
//         message: 'Что-то пошло не так, ваша вакансия не зарезервирована, пожалуйста <a href="/contact">свяжитесь с нами</a>.',
//       };
//       return res.redirect(303, '/vacations');
//     }
//     vacation.packagesSold++;
//     vacation.save();
//     req.session.flash = {
//       type: 'success',
//       intro: 'Спасибо!',
//       message: 'Ваша вакация зарезервирована.',
//     };
//     res.redirect(303, '/vacations');
//   });
// });


// Созадем admin субдомен, который должен быть ябъявлен
// до всех маршрутов
let admin = express.Router();
app.use(require('vhost')('admin.*', admin));

// Создаем маршруты для admin; могут быть объявлены где угодно
admin.get('/', function(req, res){
  res.render('admin/home');
});
admin.get('/users', function(req, res){
  res.render('admin/users');
});


// Добавляем маршруты
require('./routes.js')(app);

// api

let Attraction = require('./models/attraction.js');


let rest = require('connect-rest');

rest.get('/attractions', function(req, content, cb){
    Attraction.find({ approved: true }, function(err, attractions){
        if(err) return cb({ error: 'Внутренняя ошибка.' });
        cb(null, attractions.map(function(a){
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

rest.post('/attraction', function(req, content, cb){
    let a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function(err, a){
        if(err) return cb({ error: 'Невозможно добавить достопримечательность.' });
        cb(null, { id: a._id });
    }); 
});

rest.get('/attraction/:id', function(req, content, cb){
    Attraction.findById(req.params.id, function(err, a){
        if(err) return cb({ error: 'Невозможно получить достопримечательность' });
        cb(null, { 
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});

// api Конфигурация
let apiOptions = {
    context: '/',
    domain: require('domain').create(),
};

apiOptions.domain.on('error', function(err){
    console.log('API ошибка домена\n', err.stack);
    setTimeout(function(){
        console.log('Сервер прекратил работу после API ошибки домена.');
        process.exit(1);
    }, 5000);
    server.close();
    let worker = require('cluster').worker;
    if(worker) worker.disconnect();
});

// link API into pipeline
app.use(vhost('api.*', rest.rester(apiOptions)));


// Доавляем поддержку auto views
let autoViews = {};

app.use(function(req,res,next){
    let path = req.path.toLowerCase();  
    // проверяем кэш; если присутствует рендерим представления
    if(autoViews[path]) return res.render(autoViews[path]);
    // if it's not in the cache, see if there's
    // a .handlebars file that matches
    if(fs.existsSync(__dirname + '/views' + path + '.handlebars')){
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // не нашли совпадения для маршрута; передаем ошибку в обработчик 404
    next();
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
  let s = '';
  for(let name in req.headers) {
    s += name + ": " + req.headers[name] + '\n';
  }
  res.send(s);
});


// app.post('/process', function(req, res){
//   if(req.xhr || req.accepts('json.html' )=== 'json'){
//     res.send({success: true});
//   } else {
//     res.redirect(303, '/thank-you');
//   }
// });

// app.get('/tours/hood-river', function(req, res){
//   res.render('tours/hood-river');
// });

// app.get('/tours/oregon-coast', function(req, res){
//   res.render('tours/oregon-coast');
// });

// app.get('/tours/request-group-rate', function(req, res){
//   res.render('tours/request-group-rate'); 
// });


// app.post('/contest/vacation-photo/:year/:month', function(req, res){
//   let form = new formidable. IncomingForm();
//   form.parse(req, function(err, fields, files){
//     if(err) return res.redirect(303, '/error');
//     console.log('received fields:');
//     console.log(fields);
//     console.log('received files:');
//     console.log(files);
//     res.redirect(303, '/thank-you');
//   });
// });



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

let server;

function startServer() {
  server = http.createServer(app).listen(app.get('port'), function(){
    console.log( 'Экспресс запущен в режиме ' + app.get('env') +
      ' на http://localhost:' + app.get('port') +
      '; нажми Ctrl-C для выхода.' );
  });
}

if(require.main === module){
  //приложение запускается непосредственно,
  //запускаем сервер приложения
  startServer();
}else{
  //приложение импортируется как модуль
  //экспортируем функция для создания сервера
  module.exports = startServer;
}
