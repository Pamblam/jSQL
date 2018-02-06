
module.exports = function(grunt) {
	
	var pkg = grunt.file.readJSON('package.json');
	pkg.version = pkg.version.split(".");
	var subversion = pkg.version.pop();
	subversion++;
	pkg.version.push(subversion);
	pkg.version = pkg.version.join(".");
	grunt.file.write('package.json', JSON.stringify(pkg, null, 2));
	
	console.log("---------------------------------------");
	console.log("  Building jSQL Version "+pkg.version);
	console.log("---------------------------------------");
	
	grunt.initConfig({
		pkg: pkg,
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
					'src/wrapper/head.js.part', 
					'src/error_handling/jSQL_Error.js',
					'src/error_handling/jSQL_Lexer_Error.js',
					'src/error_handling/jSQL_Parse_Error.js',
					'src/error_handling/error_handling.js',
					'src/data_types/jSQLDataTypeList.js',
					'src/table/jSQLTable.js',
					'src/query_types/jSQLQuery.js',
					'src/query_types/jSQLDeleteQuery.js',
					'src/query_types/jSQLDropQuery.js',
					'src/query_types/jSQLInsertQuery.js',
					'src/query_types/jSQLSelectQuery.js',
					'src/query_types/jSQLUpdateQuery.js',
					'src/query_types/jSQLCreateQuery.js',
					'src/lexer/jSQLLexer.js',
					'src/lexer/token_types.js',
					'src/lexer/token.js',
					'src/parser/jSQLParseQuery.js',
					'src/parser/jSQLParseCreateTokens.js',
					'src/parser/jSQLParseInsertTokens.js',
					'src/parser/jSQLParseSelectTokens.js',
					'src/parser/jSQLParseUpdateTokens.js',
					'src/parser/jSQLParseDeleteTokens.js',
					'src/parser/jSQLParseDropTokens.js',
					'src/parser/jSQLParseWhereClause.js',
					'src/parser/jSQLWhereClause.js',
					'src/persistence/API.js',
					'src/persistence/persistenceManager.js',
					'src/sugar/createTable.js',
					'src/sugar/select.js',
					'src/sugar/update.js',
					'src/sugar/insertInto.js',
					'src/sugar/dropTable.js',
					'src/sugar/deleteFrom.js',
					'src/sugar/tokenize.js',
					'src/helpers/jSQLReset.js',
					'src/helpers/jSQLMinifier.js',
					'src/helpers/removeQuotes.js',
					'src/import_export/export.js',
					'src/import_export/import.js',
					'src/wrapper/foot.js.part'
				],
				dest: 'jSQL.js',
			},
		},
		'string-replace': {
			source: {
				files: {
					"jSQL.js": "jSQL.js"
				},
				options: {
					replacements: [{
						pattern: /{{ VERSION }}/g,
						replacement: '"<%= pkg.version %>"'
					}]
				}
			},
			readme: {
				files: {
					"README.md": "README.md"
				},
				options: {
					replacements: [{
						pattern: /\d+.\d+.\d+/g,
						replacement: '<%= pkg.version %>'
					}]
				}
			}
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
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	
	grunt.registerTask('default', [
		'concat',
		'string-replace',
		'uglify'
	]);
	
};