let path = require('path'),
    fs = require('fs'),
    formidable = require('formidable');

// Проверяем существует ли каталог
let dataDir = __dirname + '/data';
let vacationPhotoDir = dataDir + '/vacation-photo';
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir); 
if(!fs.existsSync(vacationPhotoDir)) fs.mkdirSync(vacationPhotoDir);

exports.vacationPhoto = function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', { year: now.getFullYear(), month: now.getMonth() });
};

function saveContestEntry(contestName, email, year, month, photoPath){
    // заполним позже
}

exports.vacationPhotoProcessPost =  function(req, res){
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    if(err) {
      req.session.flash = {
        type: 'danger',
        intro: 'Упсс!',
        message: 'Во время обработки отправленной Вами формы произошла ошибка. Пожалуйста, попробуйте позже.',
      };
      return res.redirect(303, '/contest/vacation-photo');
    }
    let photo = files.photo;
    let dir = vacationPhotoDir + '/' + Date.now();
    let path = dir + '/' + photo.name;
    fs.mkdirSync(dir);
    fs.renameSync(photo.path, dir + '/' + photo.name);
    saveContestEntry(
      'vacation-photo',
      fields.email,
      req.params.year,
      req.params.month, path
    );
    req.session.flash = {
      type: 'success',
      intro: 'Удачи Вась!',
      message: 'Поздравляю Вы стали участником конкурса.',
    };
    return res.redirect(303, '/contest/vacation-photo/entries');
  });
};

exports.vacationPhotoEntries = function(req, res){
  res.render('contest/vacation-photo/entries');
};