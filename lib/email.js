let nodemailer = require('nodemailer');

module.exports = function(credentials){

  let mailTransport = nodemailer.createTransport({
    // эти строчки необходимы для того чтобы не было ошибки this.mailTransport.mailer = this
    // но перед этим необходимо перейти в свой аккаунт гугл и разрешить доступ приложениям https://myaccount.google.com/lesssecureapps
    // This code is nessesery to avoid Error this.mailTransport.mailer = this 
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
  let from = '"Meadowlark Travel" <meadowlarktravel1@gmail.com>';
  let errorRecipient = '<meadowlarktravel1@gmail.com>';

  return {
    send: function(to, subj, body){
      mailTransport.sendMail({
        from: from,
        to: to,
        subject: subj,
        html: body,
        generateTextFromHtml: true
      }, function(err){
        if(err) console.error('Невозможно отпрвить сообщение ' + err);
      })
    },
    emailError: function(message, filename, execption){
      let body = '<h1>Meadowlark Travel ошибка на сайте</h1>' +
        'Сообщение:<br><pre>' + message + '</pre><br>';
      if(execption) body += 'Ошибка:<br><pre>' + exception + '</pre><br>';
      if(filename) body += 'Имя файла:<br><pre>' + filename + '</pre><br>';
      mailTransport.sendMail({
        from: from,
        to: errorRecipient,
        subject: 'Meadowlark Travel Site Error',
        html: body,
        generateTextFromHtml: true,
      }, function(err){
        if(err) console.error('Невозможно отправить сообщение ' + err);
      })
    },
  };


  // mailTransport.sendMail({
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
};