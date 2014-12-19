module.exports = (grunt) ->
	require('time-grunt') grunt
	
	require('load-grunt-config') grunt,
		config:
			pkg: grunt.file.readJSON 'package.json'
		scope: ['devDependencies']
		loadGruntTasks:
			pattern: ['grunt-*', '!grunt-template-*']
