var test = require('loadtest');
var expect = require('chai').expect;

suite('Стрессовые тесты', function(){
  test('Домашняя страница должна обрабатываться 50 запросов в секунду', function(done){
    var options = {
      url: 'http://localhost:3000',
      concurrency: 4,
      maxRequests: 500
    };
    loadtest.loadTest(options, function(err, result){
      expect(!err);
      expect(result.totalTimeSeconds < 1);
      done();
    })
  })
})