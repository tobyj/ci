(function($) {

pbGTM = {

    product_impression: function(elem) {
        var products = [];
        $(elem).find('.product[data-id]').each(function(p) { 
            var data  = $(this).data();
            data.list = $(this).parents('*[data-list]').first().data('list') || '';
            products.push(data);
        });
        if (products.length > 0) {
            dataLayer.push({
                'event':     'productImpression',
                'ecommerce': { 'impressions': products }
            });
        }
    },

    product_click: function(elem) {
        dataLayer.push({
            'event': 'productClick',
            'ecommerce': {
                'click': {
                    'actionField': { 
                        'action': 'click',
                        'list':   elem.parents('*[data-list]').first().data('list') || ''
                    },
                    'products': [ elem.data() ]
                }
            }
        });
    },

    promotion_impression: function(elem) {
        var promotions = [];
        $('.promotion[data-id]').each(function(p) { promotions.push($(this).data()); });
        if (promotions.length > 0) {
            dataLayer.push({ 
                'event':     'promotionImpression',
                'ecommerce': { 'promoView': { 'promotions': promotions } }
            });
        }
    },

    promotion_click: function(elem) {
        dataLayer.push({
            'event': 'promotionClick',
            'ecommerce': { 'promoClick': { 'promotions': [ elem.data()] }
            }
        });
    }
}


/**
 * GTM Impressions
 *
 * Scans passed element (defaults to whole page) and
 * pushess through product and promotion impressions
 */
$(document).on('ready', function(e) {
    pbGTM.promotion_impression(document);

    // Don't trigger if its a back button reload
    if (!location.href.split("#")[1]) pbGTM.product_impression(document);
});

$(document).on('infinite-add-content', function(e, elem) {
    pbGTM.product_impression(elem);
});


/**
 * GTM Events
 *
 * Catch click events and push through to the GTM
 * dataLayer based on data properties
 */
$(document).on('click', '.product[data-id]', function(e) {
    pbGTM.product_click($(this));
});

$(document).on('click', '.promotion[data-id]', function(e) {
    pbGTM.promotion_click($(this));
});

})(jQuery);
