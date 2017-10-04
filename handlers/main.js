let fortune = require('../lib/fortune.js');

exports.home = function(req, res){
  res.render('home');
};

exports.about = function(req, res){
  res.render('about', { 
    fortune: fortune.getFortune(),
    pageTestScript: '/qa/tests-about.js' 
  });
};

exports.newsletter = function(req, res){
  res.render('newsletter');
};

function NewsletterSignup(){
};

NewsletterSignup.prototype.save = function(cb){
  cb();
};

let VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

exports.newsletterProcessPost = function(req, res){
  let name = req.body.name || '', email = req.body.email || '';
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
      if(req.xhr) return res.json({error: 'Ошибка базы данных'});
      req.session.flash = {
        type: 'danger',
        intro: 'Ошибка базы данных!',
        message: 'Ошибка базы данных. Пожалуйста, попробуйте позднее.'
      };
      return res.redirect(303, '/newsletter/archive');
    };
    if(req.xhr) return res.json({succes: true});
    req.session.flash = {
      type: 'succes',
      intro: 'Спасибо!',
      message: 'Вы подписаны на нашу рассылку.'
    };
    return res.redirect(303, '/newsletter/archive');
  });
};

exports.newsletterArchive = function(req, res){
  res.render('newsletter/archive');
};

exports.genericThankYou = function(req, res){
  res.render('thank-you');
};