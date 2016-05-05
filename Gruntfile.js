module.exports = function(grunt) {
	var root = 'www/';

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		sass: {
			prod: {
                options: {
					sourcemap: 'auto',
					style: 'compressed'
				},
				files: [
					{
						expand: true,
						cwd: root + 'scss/',
						src: ['*.scss'],
						dest: root + 'css/',
						ext: '.css'
					}
				]
			}
		},

        execute: {
            target: {
                src: ['server.js']

            }
        },

        watch: {
            scss: {
                files: [root + 'scss/*.scss'],
                tasks: ['sass:prod']
            }
        },

        concurrent: {
            target: {
                tasks: ['watch:scss', 'execute'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }

	});

	grunt.registerTask('start', ['concurrent']);
	grunt.option('force', true);

};
