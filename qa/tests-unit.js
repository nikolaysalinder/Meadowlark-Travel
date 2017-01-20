var fortune = require('../lib/fortune.js');
var expect = require('chai').expect;

suite('Тесты печений-предсказаний', function(){
	test('getFotune() должна возвращать предсказание', function(){
		expect(typeof fortune.getFortune() === 'string');
	});
});