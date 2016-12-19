/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = function(grunt) {
    var objFinal = {};
    grunt.file.recurse('assets/js', function(abspath, rootdir, subdir, filename){objFinal[filename] = abspath});
    
    
    
  grunt.config.set('cachebreaker', {
    prod: {
        options: {
            match: ['/min/production.min.js'],
            position: 'append'
        },
        files: {
            src: ['views/layout.ejs']
        }
    },
    dev: {
        options: {
            match: [
                objFinal
            ],
            replacement: 'md5',
            position: 'append'
        },
        files: {
            src: ['views/layout.ejs']
        }
    }
  });

  grunt.loadNpmTasks('grunt-cache-breaker');
};