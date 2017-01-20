module.exports = function(grunt){

  // загружаем файлы
  [
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-exec'
  ].forEach(function(task){
    grunt.loadNpmTasks(task);
  });

  // наcтраиваем плагины
  grunt.initConfig({
    cafemocha: {
      all: {
        src: 'qa/tests-*.js',
        options: {
          ui: 'tdd'
        }
      }
    },
    jshint: {
      app: ['index.js', 'public/js/**/*/js', 'lib/**/*.js'],
      qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js']
    },
    exec: {
      linkchecker: { cmd: '"C:\\Program Files (x86)\\LinkChecker\\linkchecker.exe" http://localhost:3000' }
    }
  });

  //регистрируем задания
    grunt.registerTask('default', ['cafemocha', 'jshint', 'exec']);
};