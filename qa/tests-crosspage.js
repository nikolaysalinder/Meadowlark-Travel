var Browser = require('zombie');
var assert = require('chai').assert;

var browser;

suite('Межстраничные тесты', function() {

	setup(function(){
		browser = new Browser();
	});

	test('запрос расценок для групп со страницы туров по реке Худ должен заполнятьть поле реферера', function(done){
		var referrer = 'http://localhost:3000/tours/hood-river';
		browser.visit(referrer, function(){
			browser.clickLink('.requestGroupRate', function(){
				//Корректный поиск на странице - input с именем referrer в документации Zombie@5.0.5
				// Uncaught AssertionError: Unspecified AssertionError 
				// at qa\tests-crosspage.js:
				//Right search on the page hidden input with name referrer in documentation Zombie@5.0.5
				// Uncaught AssertionError: Unspecified AssertionError 
				// at qa\tests-crosspage.js:
				assert(browser.field('referrer').value === referrer);
				done();
			});
		});
	});

	test('запрос расценок ДЛЯ ГРУПП СО СТРАНИЦЫ ТУРОВ пансионата Орегон Коуст должен заполнять поле реферрера', function(done){
		var referrer = 'http://localhost:3000/tours/oregon-coast';
		browser.visit(referrer, function(){
			browser.clickLink('.requestGroupRate', function(){				
				//Корректный поиск на странице - input с именем referrer в документации Zombie@5.0.5
				// Uncaught AssertionError: Unspecified AssertionError 
				// at qa\tests-crosspage.js:
				//Right search on the page hidden input with name referrer in documentation Zombie@5.0.5
				// Uncaught AssertionError: Unspecified AssertionError 
				// at qa\tests-crosspage.js:
				browser.assert.element('form input[name=referrer]', referrer);
				done();
			});
		});
	});

	test('посещение страницы "ЗАПРОС ЦЕНЫ ДЛЯ ГРУПП" напрямую должен приводить к пустому полю реферера', function(done){
		browser.visit('http://localhost:3000/tours/request-group-rate', function(){			
			//Корректный поиск на странице - input с именем referrer в документации Zombie@5.0.5
			// Uncaught AssertionError: Unspecified AssertionError 
			// at qa\tests-crosspage.js:
			//Right search on the page hidden input with name referrer in documentation Zombie@5.0.5
			// Uncaught AssertionError: Unspecified AssertionError 
			// at qa\tests-crosspage.js:
			browser.assert.element('form input[name=referrer]', '');
			done();
		});
	});
});

// git commit -m "Исправил ошибку в файле index.js Error: Missing helper 'section' . Установил zombie@5.0.5 для windows, изменил код в 'qa/tests-crosspage.js' чтобы функции выполнялись коректно"
