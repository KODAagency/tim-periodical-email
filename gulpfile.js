/*
 *
 * _ C O N F I G
 */
var gulp = require('gulp');

var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var exec = require('child_process').exec;

var runSequence = require('run-sequence');    // Temporary solution until gulp 4
                                              // https://github.com/gulpjs/gulp/issues/355

var pkg = require('./package.json');
var dirs = pkg['site-configs'].directories;


/*
 *
 * _ T A S K S
 */


/*
 *
 * _ j e k y l l
 *
     The jekyll task split into dev and non-dev

     todo: add :dist task that uses _config.buid.yml
 */
gulp.task('jekyll', function (cb) {
  exec('jekyll build -s' + dirs.src + ' -d ' + dirs.dist + ' --config _config.yml', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (err) return cb(err); // return error
    cb();
  });
});

gulp.task('open-file', function (cb) {
  exec('open ' + dirs.dist + '/index.html', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    if (err) return cb(err);
    cb();
  });
});


/*
 *
 * _
 */
gulp.task('inject', function () {
  var target = gulp.src(dirs.dist + '/index.html');
  var sources = gulp.src(dirs.dist + '/assets/styles/*.css', {read: true}, {
                                                      transform: function (filepath) {
                                                        return file.contents.toString('utf8')
                                                        // return '<link rel="stylesheet" href="' + filepath + '" inline>';
                                                      }
                                                    });

  return target.pipe(plugins.inject(sources))
               .pipe(gulp.dest(dirs.dist));
});


gulp.task('inline-source', function () {
  return gulp.src(dirs.dist + '/index.html')
             .pipe(plugins.inlineSource({
               rootpath: dirs.dist,
               attribute: '',
               // swallowErrors: false
             }))
             .pipe(gulp.dest(dirs.dist));
});


/*
 *
 * _ s a s s

     Both sass tasks use the same sass options, the :build version just
     doesn't produce maps.
 */
var sassOpts = {
  indentedSyntax: true,
  includePaths: ['bower_components/'],
  errLogToConsole: true
}

gulp.task('sass', function () {
  return gulp.src(dirs.src + '/assets/sass/*.{sass,scss}')
             .pipe(plugins.sourcemaps.init())
               .pipe(plugins.sass(sassOpts))
             .pipe(plugins.sourcemaps.write('./maps'))
             .pipe(gulp.dest(dirs.dist + '/assets/styles'));
});


/*
 *
 * _ useref
 */
gulp.task('useref', function () {
  var assets = plugins.useref.assets({searchPath: ['.']});

  return gulp.src(dirs.dist + '/index.html')
             .pipe(assets)
             .pipe(assets.restore())
             .pipe(plugins.useref())
             .pipe(gulp.dest(dirs.dist));
});


/*
 *
 * _ c s s  i n l i n e
 */
gulp.task('inline-css', function () {
  return gulp.src(dirs.dist + '/index.html')
             .pipe(plugins.inlineCss({
               preserveMediaQueries: true,
               applyLinkTags: false,
             }))
             .pipe(gulp.dest(dirs.dist));
});


/*
 *
 * _ b r o w s e r  s y n c
 *
     Serve complied html and css form dist/ and all other
     assets from either bower_components/ or src/.
 */
gulp.task('browser-sync', function () {
   browserSync({
     notify: false,
     port: 9000,
     server: {
       baseDir: [dirs.dist, dirs.src],
       routes: {
         '/bower_components': 'bower_components',
       }
     }
   });
});


gulp.task('clipboard', function () {
  return gulp.src(dirs.dist + '/index.html')
      .pipe(plugins.clipboard())
      .pipe(gulp.dest(dirs.dist));
});

/*
 *
 * _ c l e a n
 *
     Removes dist/ directory,
     https://github.com/gulpjs/gulp/blob/master/docs/recipes/delete-files-folder.md
 */
gulp.task('clean', function (cb) {
  require('del')([dirs.dist], cb);
});


/*
 *
 * _ c o p y
 *
     Copy all files to dist/ that aren't handled by other tasks.
 */
gulp.task('copy:img', function () {
  return gulp.src(dirs.src + '/assets/images/**/*.{gif,jpg,png,svg}')
             .pipe(gulp.dest(dirs.dist + '/assets/images'));
});

gulp.task('copy', [
  'copy:img'
]);


/*
 *
 * _ html min
 */
gulp.task('htmlmin', function () {
  return gulp.src(dirs.dist + '/*.html')
             .pipe(plugins.htmlmin())
             .pipe(gulp.dest(dirs.dist));
});


/*
 *
 * _ w a t c h
 */
gulp.task('watch:jekyll', function () {
  gulp.watch(dirs.src + '/**/*.{html,yml,md,mkd,markdown}', ['jekyll', reload]);
});

gulp.task('watch:sass', function () {
  gulp.watch(dirs.src + '/assets/sass/**/*.{sass,scss}', ['sass', reload]);
});

gulp.task('watch:image', function () {
  gulp.watch(dirs.src + '/assets/images/**/*.{jpg,png,gif}', [reload]);
});

gulp.task('watch', [
  'watch:jekyll',
  'watch:sass',
]);


/*
 *
 * _ M A I N   T A S K S
 */
gulp.task('serve', function (done) {
  runSequence(
    'clean',
    'jekyll',
    'sass',
    'browser-sync',
    'watch',
  done);
});

gulp.task('build', function (done) {
  runSequence(
    'clean',
    'jekyll',
    'sass',
    'useref',
    // 'inject',
    'inline-source',
    'inline-css',
    // 'copy',
    // 'htmlmin',
    'open-file',
  done);
});
