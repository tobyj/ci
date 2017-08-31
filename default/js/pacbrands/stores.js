(function($) {

// Favourite Store
$(document).ready(function() {
    var favourite_store = $.cookie('pb_stores_favourite_store');
    $('.store-favourite').each(function(e) {
        if ($(this).data('store-id') == favourite_store) {
            $(this).addClass('current');
        }
    });

    if (favourite_store) {
        $('.store-availability').addClass('current_store');
    }
});

/* Store Page - Set Favourite Store */
$(document).on('click', '.store-info .store-favourite', function(e) {
    var store_id = $(this).data('store-id');
    var action   = $(this).data('ajax');
    var button   = $(this);
    $.post(action, 'id='+store_id, function(data) {
        $.addSuccessMessage(data.store+' is now your favourite!');
        button.addClass('current');
    });
});

/* Product Detail Page - Accordion Availability Button & Back to Map */
$(document).on('click', '.store-availability button, .store-availability .back-to-map', function(e) {
    $.colorbox({
        width: '95%',
        maxWidth: '800px',
        href: $(this).data('ajax'),
        onComplete: function() {
            if ($('#map').length) pbStoresMap.initialize();
            $.colorbox.resize();
        }
    });
});

/* Store Selection Popup - Set Favourite and Show Stock */
$(document).on('click touchend', '.store-select .store-favourite', function(e) {
    e.preventDefault();
    var store_id = $(this).data('store-id');
    var action   = $(this).data('ajax');
    var available = $(this).data('available');
    var button   = $(this);
    $.post(action, 'id='+store_id, function(data) {
        button.addClass('current');
        $.colorbox({
            width: '95%',
            maxWidth: '800px',
            href: available,
            onComplete: function() {
                if ($('#map').length) pbStoresMap.initialize();
                $.colorbox.resize();

                var favourite_store = $.cookie('pb_stores_favourite_store');
                if (favourite_store) {
                    $('.store-availability').addClass('current_store');
                }

            }
        });

    });
});

// More Store Groups
$(document).on('click', '.store-more', function(e) {
    e.preventDefault();
    $('#store-filter').toggleClass('active', '250ms');
    $(this).text($(this).text().trim() == 'Less' ? 'More' : ' Less');
    $(this).toggleClass('active');
});

// Responsive auto-resize
$(document).ready(function() {
    if ($('.product-view .store-availability').length > 0) {
        $(window).resize(function() {
            clearTimeout(window.storesResizedFinished);
            window.storesResizedFinished = setTimeout(function(){
                $.colorbox.resize({ width: window.innerWidth > 800 ? 800 : "95%" });
            }, 250);
        });
    }
});

 // Loader for Geolocation
$(document).on('click', '.btn_icon_target', function(e) {
e.preventDefault();
var loader = $('.store-heading .loader');
loader.addClass('show');
});

})(jQuery);
