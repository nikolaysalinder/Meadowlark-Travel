module.exports = function(grunt){

  // загруажем плагины
  [
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-exec',
  ].forEach(function(task){
    grunt.loadNpmTasks(task);
  });

  // настраиваем плагины
  grunt.initConfig({
    cafemocha: {
      all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
    },
    jshint: {
      app: ['index.js', 'public/js/**/*.js', 'lib/**/*.js'],
      qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
    },
    exec: {
      //linkchecker: { cmd: 'linkchecker --ignore-url=\'!^(https?:)\/\/localhost\b\' http://localhost:3000' }
    },
  }); 

  // регистрируем задачи
  grunt.registerTask('default', ['cafemocha','jshint']);
};
