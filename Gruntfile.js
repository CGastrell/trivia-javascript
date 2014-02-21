module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['src/triviaJS.js'],
            options: {
                curly: true,
                eqeqeq: false,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                unused: false,
                // indent: 4,
                jquery: true,
                asi: true,
                smarttabs: true,
                devel: true,
                globals: {
                    jQuery: true,
                    TimelineMax: true,
                    TimelineLite: true,
                    TweenLite: true,
                    Back: true,
                    Power4: true,
                    TweenMax: true,
                    store: true,
                    Elastic: true
                }
            }
        },
        concat: {
            options: {
                separator: ';',
            },
            basic: {
                src: [
                    'lib/jquery-1.11.0.min.js',
                    'lib/jquery.ui.widget.min.js',
                    'lib/store+json2.min.js',
                    'lib/TweenMax-1.11.4.min.js',
                    'src/<%= pkg.name %>.min.js'
                ],
                dest: '<%= pkg.name %>.min.js',
            }
        },
        uglify: {
            options: {
                report: 'min',
                compress: true,
                join_vars: true,
                unsafe: false,
                mangle: {
                    except: [
                        "jQuery",
                        "TimelineMax",
                        "TimelineLite",
                        "TweenLite",
                        "Back",
                        "Power4",
                        "TweenMax",
                        "Elastic",
                        "store"
                    ]
                },
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'src/<%= pkg.name %>.min.js'
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');

    // Default task(s).
    grunt.registerTask('default', ['jshint']);
    grunt.registerTask('build', ['jshint','uglify','concat']);

};
