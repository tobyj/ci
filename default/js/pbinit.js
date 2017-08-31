/** 
 * Pacbrands Global JS
 *
 * Initialise global JS libraries and functionality
 * Anything that is page/functionally specific should
 * be separate into a different JS file
 *
 */
$j(document).on('ready pjax:end', function(event) {


    // Dropkick JS custom dropdowns
    // causing some problems, needs some work
    // $j('select').dropkick();

    // bxSliders
    $j('.bxslider').bxSlider({ auto: true, pause: 8000 });

    // colorbox
    $j('a.colorbox').colorbox();

});


