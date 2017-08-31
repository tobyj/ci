/*globals __dirname, require, module */
// All scripts to be included in project go here
var path = require('path');
module.exports = function(grunt) {

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        // Grunt-sass
        sass: {
            app: {
                // Takes every file that ends with .scss from the scss
                // directory and compile them into the css directory.
                // Note: file names that begins with _ are ignored automatically
                options: {
                    sourceMap: true,
                    outputStyle: 'compressed', //nested, expanded, compact, compressed
                    imagePath: '../',
                    includePaths: [
                        path.resolve(__dirname, '../default/bower_components/compass-mixins/lib/'),
                        path.resolve(__dirname, '../default/bower_components/breakpoint-sass/stylesheets/'),
                        path.resolve(__dirname, '../default/bower_components/susy/sass/'),
                        path.resolve(__dirname, '../default/scss')
                    ]
                },
                files: [{
                    '../berlei2/css/quickcheckout.css'          : '../berlei2/scss/quickcheckout.scss',
                    '../bonds2/css/quickcheckout.css'           : '../bonds2/scss/quickcheckout.scss',
                    '../bondsoutlet2/css/quickcheckout.css'     : '../bondsoutlet2/scss/quickcheckout.scss',
                    '../champion2/css/quickcheckout.css'        : '../champion2/scss/quickcheckout.scss',
                    '../dunlopillo2/css/quickcheckout.css'      : '../dunlopillo2/scss/quickcheckout.scss',
                    '../fairydown2/css/quickcheckout.css'       : '../fairydown2/scss/quickcheckout.scss',
                    '../jockey2/css/quickcheckout.css'          : '../jockey2/scss/quickcheckout.scss',
                    '../playtex2/css/quickcheckout.css'         : '../playtex2/scss/quickcheckout.scss',
                    '../sheridan2/css/quickcheckout.css'        : '../sheridan2/scss/quickcheckout.scss',
                    '../sheridanoutlet2/css/quickcheckout.css'  : '../sheridanoutlet2/scss/quickcheckout.scss'
                }]
            }
        },

        // split css files for ie selector issue
        bless: {
            css: {
                options: {
                    cacheBuster: false,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */'
                }
            }
        },

        uglify: {
            order_status_check: {
                options: {
                    banner: '/*! Order Status Check: Handlebars Templates + order-status-check.js <%= grunt.template.today("dd-mm-yyyy") %> */\n'
                },
                files: {
                    'js/order-status-check/order-status-check.min.js': ['js/order-status-check/order-status-check.hbs.js', 'js/order-status-check/order-status-check.js']
                }
            },
            delivery_estimate: {
                options: {
                    banner: '/*! Delivery Estimate: Handlebars Templates + delivery-estimate.js <%= grunt.template.today("dd-mm-yyyy") %> */\n'
                },
                files: {
                    'js/delivery-estimate/delivery-estimate.min.js': ['js/delivery-estimate/delivery-estimate.hbs.js', 'js/delivery-estimate/delivery-estimate.js']
                }
            },
            quickcheckout_full: {
                options: {
                    banner: '/*! Quick Checkout full: Handlebars Templates + quickcheckout.JS, expresscapture, jquery.payment <%= grunt.template.today("dd-mm-yyyy") %> */\n'
                },
                files: {
                    'js/quickcheckout/quickcheckout.min.js': ['js/quickcheckout/pickup.hbs.js', 'js/quickcheckout/checkout.hbs.js', 'js/quickcheckout/quickcheckout.js', 'js/quickcheckout/expresscapture-2.30.js', 'js/quickcheckout/jquery.payment.js']
                }
            },
            quickcheckout_cart: {
                options: {
                    banner: '/*! Quick Checkout Waypoints, Headroom, Setup & Cart <%= grunt.template.today("dd-mm-yyyy") %> */\n'
                },
                files: {
                    'js/quickcheckout/setup.min.js': ['js/quickcheckout/summary.hbs.js', 'js/quickcheckout/cart_items.hbs.js', 'js/vendor/jquery.waypoints.min.js', 'js/vendor/headroom.js', 'js/vendor/jQuery.headroom.js', 'js/quickcheckout/setup.js']
                }
            },
            quickcheckout_lang: {
                files: {
                    'js/quickcheckout/lang.min.js': ['js/quickcheckout/lang.js']
                }
            }
        },

        handlebars: {
            compile: {
                options: {
                    namespace: 'JST' //JavaScript Template
                },
                files: {
                    'js/order-status-check/order-status-check.hbs.js'   : 'js/order-status-check/order-status-check.hbs',
                    'js/delivery-estimate/delivery-estimate.hbs.js'     : 'js/delivery-estimate/delivery-estimate.hbs',
                    'js/quickcheckout/checkout.hbs.js'                  : 'js/quickcheckout/checkout.hbs',
                    'js/quickcheckout/summary.hbs.js'                   : 'js/quickcheckout/summary.hbs',
                    'js/quickcheckout/pickup.hbs.js'                    : 'js/quickcheckout/pickup.hbs',
                    'js/quickcheckout/cart_items.hbs.js'                : 'js/quickcheckout/cart_items.hbs',
                    'js/mixmatch/mixmatch.hbs.js'                       : 'js/mixmatch/mixmatch.hbs',
                    'js/mixmatch/mixmatch_detail.hbs.js'                : 'js/mixmatch/mixmatch_detail.hbs'
                }
            }
        },

        watch: {

            grunt: { files: ['Gruntfile.js'] },

            sass: {
                files: [
                    //paths to watch for changes:
                    'scss/**/*.scss',
                    'fonts/*.scss'
                ],
                tasks: ['sass', 'bless:css'],
                options: {
                    spawn: false
                }
            },

            order_status_check: {
                files: ['js/order-status-check/order-status-check.js'],
                tasks: ['uglify:order_status_check'],
                options: {
                    spawn: false
                }
            },
            delivery_estimate: {
                files: ['js/delivery-estimate/delivery-estimate.js'],
                tasks: ['uglify:delivery_estimate'],
                options: {
                    spawn: false
                }
            },

            handlebars_order_status_check: {
                files: ['js/order-status-check/order-status-check.hbs'],
                tasks: ['handlebars', 'uglify:order_status_check']
            },
            handlebars_delivery_estimate: {
                files: ['js/delivery-estimate/delivery-estimate.hbs'],
                tasks: ['handlebars', 'uglify:delivery_estimate']
            },
            //watch and uglify quickcheckout(full) js separately
            quickcheckout_full: {
                files: ['js/quickcheckout/quickcheckout.js', 'js/quickcheckout/jquery.payment.js', 'js/quickcheckout/expresscapture-2.30.js'],
                tasks: ['uglify:quickcheckout_full'],
                options: {
                    spawn: false
                }
            },
            quickcheckout_cart: {
                files: ['js/quickcheckout/setup.js'],
                tasks: ['uglify:quickcheckout_cart'],
                options: {
                    spawn: false
                }
            },
            quickcheckout_lang: {
                files: ['js/quickcheckout/lang.js'],
                tasks: ['uglify:quickcheckout_lang'],
                options: {
                    spawn: false
                }
            },
            handlebars_quickcheckout_full: {
                files: ['js/quickcheckout/pickup.hbs', 'js/quickcheckout/checkout.hbs'],
                tasks: ['handlebars', 'uglify:quickcheckout_full']
            },
            handlebars_quickcheckout_cart: {
                files: ['js/quickcheckout/summary.hbs', 'js/quickcheckout/cart_items.hbs'],
                tasks: ['handlebars', 'uglify:quickcheckout_cart']
            }

        }

    });

    // Default task (Watch)
    grunt.registerTask('default', ['watch']);

    grunt.registerTask('order_status_check', ['handlebars', 'uglify:order_status_check']);
    grunt.registerTask('delivery_estimate', ['handlebars', 'uglify:delivery_estimate']);

    grunt.registerTask('build', ['sass', 'bless:css', 'handlebars', 'uglify']);

};
