
/**
 * Pacbrands Recently Viewed using jStorage
 *
 * Stores recently viewed products into local storage
 * and then renders back out again using a keychange
 * event listening that works across multiplate windows
 */
pbRecentlyViewed = {

    initialize: function() {
        this.listener();
        this.scan();

        // Capture on color change too
        $j(document).on('pjax:end', this.scan);
    },

    listener: function() {
        var recentlyViewedList = $j('.recently-viewed-products > ul'),
            recentlyViewedBtns = $j('#utils_show_recently_viewed, .open-recently-viewed'),
            numItems = 0,
            dataItems = $j('#utils_recently_viewed, #utils_show_recently_viewed, #utils_show_recently_viewed .utils_heading, .open-recently-viewed, #a-primary-recently-viewed span, #a-primary-recently-viewed'),
            mobileMenuList = $j('.nav_main_inner .recently-viewed'),
            slider = recentlyViewedList.bxSlider({
                easing: 'easeInOutQuart',
                hideControlOnEnd: true,
                infiniteLoop: false,
                mode: 'horizontal',
                slideWidth: 180,
                minSlides: 4,
                maxSlides: 6,
                preloadImages: 'all',
                slideMargin: 20,
                prevText: '',
                nextText: '',
                onSlideBefore: function($slideElement, oldIndex, newIndex) {
                    $j('.recently-viewed-products .product-ribbon').css({'opacity': 0});
                },
                onSlideAfter: function($slideElement, oldIndex, newIndex) {
                    $j('.recently-viewed-products .product-ribbon').css({'opacity': 1});
                }
            });

        $j.jStorage.listenKeyChange('products-viewed', function(key, action) {
            if (rv = $j.jStorage.get('products-viewed')) {
                var block = '';
                rv.each(function(p) {
                    block += '<li class="item" data-id="'+p.id+'" data-style="'+p.style+'" data-color="'+p.color+'">' + p.html + '</li>';
                });
                recentlyViewedList.html(block);
                mobileMenuList.html(block);
                numItems = rv.length;
                if (slider.length) slider.reloadSlider(); //in case recently viewed panel is open on another tab, or opened during swatch change
            }
            dataItems.attr('data-item-count', numItems);
        });

        recentlyViewedBtns.on('click', function(event){
            if ( numItems > 0 ) {
                t = window.setTimeout(function(){
                    slider.reloadSlider();
                }, 200);
            }
        });

        $j('#a-primary-recently-viewed').on('click', function(event){
            event.preventDefault();
        });
    },

    scan: function() {
        var rv = $j.jStorage.get('products-viewed');
        if (!rv) rv = [];

        if ($j('.recently-viewed-add')) {
            $j('.recently-viewed-add').each(function(i,b) {

                // Get data for reference and capture content
                var add  = $j(b).data();
                add.html = $j(b).html();

                // Remove existing by ID
                for(var i = rv.length; i--;) if (rv[i].id == add.id) rv.splice(i, 1);

                // Add Item
                rv.unshift(add);
            });
        }

        // Save maximum of 10 for maximum 1 hour
        $j.jStorage.set('products-viewed', rv.splice(0,12));
        $j.jStorage.setTTL('products-viewed', 60 * 60 * 1000);
    }
};

$j(document).on('ready', function(event) {
    pbRecentlyViewed.initialize();
});