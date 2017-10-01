var cluster = require('cluster');

function startWorker() {
  var worker = cluster.fork();
  console.log('КЛАСТЕР: Исполнитель %d запущен', worker.id);
}
if(cluster.isMaster){
  require('os').cpus().forEach(function(){
    startWorker();
  });
  //Записываем в журнал всех отключившыхся
  //исполнителей
  //Если исполнитель отключается, он должен затем
  //завершить работу, так что подождем
  //события завершения работы ему на замену
  cluster.on('disconnect', function(worker){
    console.log('КЛАСТЕР: Испольнитель %d отключился от кластера.', worker.id);
  });
  //Когда испольнитель завершает работу,
  //создаем исполнителя ему на замену
  cluster.on('exit', function(worker, code, signal){
    console.log('КЛАСТЕР: Исполнитель %d завершил работу' +
      'с кодом завершения %d (%s)', worker.id, code, signal);
    startWorker();
  });
}else{
  //Запускаем наше приложение на исполнителеЖ
  require('./index.js')();
}