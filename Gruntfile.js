module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      // src/jsフォルダ以下のjs拡張子ファイルを対象に監視
      files: ['lib/*.js'],
      // 変更があったらタスクjasmineを実行
      tasks: ['jasmine_node']
    },
/*
    jasmine: {
        // プロパティ名はテストケース名
        brooktest: {
          // このテストケースでテストするファイルの指定
          src: 'lib/brook.js',
          options: {
            // テストケース
            specs: 'spec/*Spec.js',
            // ヘルパー
            helpers: 'spec/*Helper.js'
          }
        }
    }
*/
    jasmine_node: {
      projectRoot: "./spec/",
      forceExit: true
    }
  });
  // gruntでjasmineを使う
  grunt.loadNpmTasks('grunt-jasmine-node');
  // 変更したファイルを監視するためのwatch
  grunt.loadNpmTasks('grunt-contrib-watch');
};
