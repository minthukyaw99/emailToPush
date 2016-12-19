/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = function(grunt) {

  grunt.config.set('cacheBust', {
        taskName: {
            options: {
                assets: ['assets/js/*.js'],
                deleteOriginals : true
            },
            src: ['views/layout.ejs']
        }
    
  });

  grunt.loadNpmTasks('grunt-cache-bust');
};
