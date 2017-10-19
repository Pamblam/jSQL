module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				banner: '/**\n * <%= pkg.name %> - v<%= pkg.version %>' +
						'\n * <%= pkg.description %>' +
						'\n * @author <%= pkg.author %>' +
						'\n * @website <%= pkg.homepage %>' +
						'\n * @license <%= pkg.license %>' +
						'\n */\n\n'
			},
			dist: {
				src: [
					'src/head.js.part', 
					'src/jSQL.js', 
					'src/foot.js.part'
				],
				dest: 'jSQL.js',
			},
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> */'
			},
			build: {
				src: 'jSQL.js',
				dest: 'jSQL.min.js'
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	grunt.registerTask('default', [
		'concat',
		'uglify'
	]);
};