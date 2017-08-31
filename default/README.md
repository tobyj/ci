# libsass

## Getting started

If you're on es-dev01 you'll just need to run `bower install`. This will create the bower_components directory and download the required packages.

The compass-mixins package requires an update before it will work.

FILE: bower_components/compass-mixins/lib/compass/functions/_lists.scss: update the `@function compact($vars...){ ... }` with the following:

```scss
@function compact($vars...) {
    $first: nth($vars, 1);
    $sep: comma;
    $list: ();
    @if length($vars) == 1 and type_of($first) == 'list' {
        $vars: $first;
        $sep: list-separator($vars);
    }
    @each $var in $vars {
        @if $var {
            $list: append($list, $var, $sep);
        }
    }
    @return $list;
}
```

## Fresh Install

To compile with libsass you'll need node-sass (the wrapper around libsass), grunt-sass (for integration with grunt) and a few bower packages.

* `npm init` (creates package.json)
* `npm install node-sass`
* `npm install --save-dev grunt-sass`
* `bower init` (creates bower.json)
* `bower install --save -F compass-mixins#0.12.7` (force version 0.12.7)
* `bower install --save-dev breakpoint-sass`
* `bower install --save-dev susy`
