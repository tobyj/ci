
/**
 * Pacific Brands Catalog Javascript
 *
 */
pbCatalog = {


    initialize: function() {

        // Carousel
        this.init_carousel();

        // Image Zoom                    
        $j("#image-main").elevateZoom({
            gallery:            'product-image-thumbs',
            zoomType:           "inner",
            zoomWindowFadeIn:   250,
            zoomWindowFadeOut:  250,
            responsive:         false,
            cursor:             'pointer',
            galleryActiveClass: "active",
            imageCrossfade:     true,
            carousel:           $j('#product-image-carousel')
        });


        // Add to Cart
        $j('#product_addtocart_form .add-to-cart-buttons .btn-cart').prop("onclick", null).attr("onclick", null);
        $j('#product_addtocart_form .add-to-cart-buttons .btn-cart').on('click', function(event) {
            event.preventDefault();

            // Run the standard Form validator
            var productAddToCartForm = new VarienForm('product_addtocart_form');
            if (productAddToCartForm.validator.validate()) {
                $j('.add-to-cart-buttons .btn-cart span span').text('Processing...');
                $j('.add-to-cart-buttons .btn-cart').addClass('processing').prop('disabled', true);

                var form = $j('#product_addtocart_form');
                var action = form.data('ajax');
                $j.post(action, form.serialize(), function(data) {
                    // Enable the Button
                    $j('.add-to-cart-buttons .btn-cart span span').text('Add to Bag');
                    $j('.add-to-cart-buttons .btn-cart').removeClass('processing').prop('disabled', false);

                    // Colorbox message - Added to the cart / error
                    if (data.message) {
                        // Colorbox Mode, just look for the class in the message
                        if (data.message.indexOf('product-cart-colorbox') != -1) {
                            $j.colorbox({
                                html:data.message
                            });

                        } else {
                            var slidetime = 5000;
                            if (!data.success) slidetime = 10000;
                            $j('.add-to-cart-buttons').prepend(data.message);
                            $j('.add-to-cart-buttons .product-cart-message').slideDown('slow', function() {
                                $j(this).delay(slidetime).slideUp("slow", function() { $j(this).remove() });
                            });
                        }
                    }

                    // GTM Data Layer
                    if (data.success && dataLayer && data.dataLayerObj) {
                        try {
                            dataLayer.push(data.dataLayerObj);
                        } catch(e) {
                            console.log('dataLayer.push failed.');
                        }
                    }

                    // Trigger the Mini Cart - turning off for speed improvements
                    /*if ($j('#header-cart').data('ajax')) {
                        $j.get($j('#header-cart').data('ajax'), null, pbCatalog.minicart_update );
                    }*/

                    //allow minicart to be updated again on next click
                    $j('#minicart, #tjcheckout .summary').removeClass('done');

                    //Header Cart counter Update
                    if (data.success && data.qty) {
                        pbCatalog.update_qty(data.qty);
                    }

                    if (data.qty) {
                        $j('[data-ajax-totalitems]').attr('data-show-val', data.qty);
                        $j('[data-ajax-grandtotal]').attr('data-show-val', '');
                        $j('#tjcheckout').removeClass('empty');
                    }

                }, 'json');
            }
        });
    },

    minicart_update: function(data) {
        
        $j('#minicart').html(data.content);

        // Quick Fix: Magento will redirect to mini cart url on remove
        // after an item has been updated.
        $j('#header-cart .btn-remove').prop("onclick", null).attr("onclick", null);
        $j('#header-cart .btn-remove').on('click', function(event) {
            event.preventDefault();
            if ( confirm('Are you sure you would like to remove this item from the shopping cart?') ) {
                $j.get($j(event.target).attr('href'), null, pbCatalog.minicart_update );
            }
        });

    },
    update_qty: function (qty) {
        if (quickCheckout && quickCheckout.cart) {
            quickCheckout.cart.updateCartQty(qty);
        } else {
            //old crap way:
            var qtyString = qty ? ' (' + qty + ')' : '';
            var replaceString  = qty > 0 ? qty + ' item' + (qty>1?'s':'') : 'Bag' + qtyString;
            $j('.header_mobile_inner .header_utilities_cart_mobile').text(replaceString);
            var myBagText = $j('.header_utilities_cart').text().trim().split('(')[0];
            replaceString = qty ? myBagText +' (' + qty  + ')' : myBagText;
            $j('.header_utilities_cart').html(replaceString);
        }
    },

    init_carousel: function() {
        var windowWidth = $j(window).width();
        var carousel = $j('#product-image-carousel');

        // Mobile Mode
        if (windowWidth <= 479) {
            if (carousel.hasClass('product-image-carousel-horizontal')) {
                carousel.tinycarousel({ axis : "x" });
            }
        } else if (carousel.hasClass('product-image-carousel-vertical')) {
            carousel.tinycarousel({ axis : "y" });
        }
    },

    resize: function() {
        if ($j('#product-image-carousel').data('plugin_tinycarousel')) {
            $j('#product-image-carousel').data('plugin_tinycarousel').remove();
            $j('#product-image-carousel').removeData('plugin_tinycarousel');
        }
        this.init_carousel();
    }
}

$j(document).on('ready pjax:end', function(event) {
    pbCatalog.initialize();
});


$j(window).on('delayed-resize', function(event) {
    pbCatalog.resize();
});


//Store current size selected attribute ID
var size_retain = "";

/**
 * Product Color Change
 * Uses the pjax module to maintain push state urls
 * reloads just the product area
 */
$j(document).on('ready pjax:end', function(event) {
    // Timeout 10secs to handle long pages before forcing a page reload
    $j(document).pjax('[data-pjax] a, a[data-pjax]', '.main-container', { timeout: 10000 });

    //Only retain the colour when the option is not out of stock
    if(!$j("#attribute190 option[value='" + size_retain + "']").is(':disabled'))
    {
        $j('#attribute190').val( size_retain );
    }
});

// Swatch Loading
$j(document).on('pjax:clicked', function(event) {
    size_retain = $j('#attribute190').val();
    $j('.product-swatches .swatch-loading').removeClass('swatch-loading');
    $j(event.target).parents('.product-swatch').addClass('swatch-loading');
});

/**
 * Extend Configurable Attribtue selection
 * to also update available quantity in selection list
 * EXTENDS CORE PROTOTYPE
 */

Product.Config.addMethods({
    configureElement : function(element) {
        this.reloadOptionLabels(element);
        if(element.value){
            this.state[element.config.id] = element.value;
            if(element.nextSetting){
                element.nextSetting.disabled = false;
                this.fillSelect(element.nextSetting);
                this.resetChildren(element.nextSetting);
            }
        }
        else {
            this.resetChildren(element);
        }
        this.reloadPrice();
        this.reloadQty();
    },

    fillSelect: function(element) {
        var attributeId = element.id.replace(/[a-z]*/, '');
        var options = this.getAttributeOptions(attributeId);
        this.clearSelect(element);
        element.options[0] = new Option('', '');
        element.options[0].innerHTML = this.config.chooseText;

        var prevConfig = false;
        if(element.prevSetting){
            prevConfig = element.prevSetting.options[element.prevSetting.selectedIndex];
        }

        if(options) {
            var index = 1;
            for(var i=0;i<options.length;i++){
                var allowedProducts = [];
                if(prevConfig) {
                    for(var j=0;j<options[i].products.length;j++){
                        if(prevConfig.config.allowedProducts
                            && prevConfig.config.allowedProducts.indexOf(options[i].products[j])>-1){
                            allowedProducts.push(options[i].products[j]);
                        }
                    }
                } else {
                    allowedProducts = options[i].products.clone();
                }

                if(allowedProducts.size()>0){
                    options[i].allowedProducts = allowedProducts;
                    element.options[index] = new Option(this.getOptionLabel(options[i], options[i].price), options[i].id);
                    element.options[index].config = options[i];

                    // Disable out of stock items to prevent selection
                    if (options[i].inventory <= 0) {
                        element.options[index].disabled = true;
                    }

                    index++;
                }
            }
        }
    },

    getOptionLabel: function(option, price){
        var price = parseFloat(price);
        if (this.taxConfig.includeTax) {
            var tax = price / (100 + this.taxConfig.defaultTax) * this.taxConfig.defaultTax;
            var excl = price - tax;
            var incl = excl*(1+(this.taxConfig.currentTax/100));
        } else {
            var tax = price * (this.taxConfig.currentTax / 100);
            var excl = price;
            var incl = excl + tax;
        }

        if (this.taxConfig.showIncludeTax || this.taxConfig.showBothPrices) {
            price = incl;
        } else {
            price = excl;
        }

        var str = option.label;
        if(price){
            if (this.taxConfig.showBothPrices) {
                str+= ' ' + this.formatPrice(excl, true) + ' (' + this.formatPrice(price, true) + ' ' + this.taxConfig.inclTaxTitle + ')';
            } else {
                str+= ' ' + this.formatPrice(price, true);
            }
        }

        // Display Out of Stock + Low Stock
        if (option.inventory <= 0) {
            str += ' - Out of Stock';

        } else if (this.config.lowStockDisplay && option.inventory <= this.config.lowStockDisplay) {
            str += ' - Low Stock';
        }

        return str;
    },


    reloadQty: function() {

        // Not ready to reload                   
        if (!$('qty')) return;                   

        //  this is using the offset model, technically its wrong if we have multiple
        //  attribtues going on..
        var maxqty = 0;

        for(var i=this.settings.length-1;i>=0;i--){
            var selected = this.settings[i].options[this.settings[i].selectedIndex];
            if (selected.config) maxqty += parseFloat(selected.config.inventory);
            else return;        // invalid combination
        }

        // Our absolute max
        if (maxqty > 20) maxqty = 20;

        // Remember previously selected, otherwise default to qty 1
        var selected = 1;
        if ($('qty').options) selected = $('qty').options.selectedIndex;

        // Update Quantity Selection
        if ($('qty')) $('qty').options.length = 0;
        
        // Add Blank Label
        $('qty').insert(new Element('option', {value: ""}).update("Qty"));

        if (maxqty > 0) {
            $$('.add-to-cart-buttons .btn-cart span span').each(function(e) { e.update('Add to Bag'); });
            $$('.add-to-cart-buttons .btn-cart').each(function(e) { e.removeClassName('nostock').disabled = false; });
            if ($('qty')) $('qty').disabled = false;
            for(i = 1; i <= maxqty; i++) {
                $('qty').insert(new Element('option', {value: i}).update(i));
            }

            // Select the closest option if not available
            if (selected > maxqty) selected = maxqty;
            $('qty').options[selected].selected = true;

        } else {
            // out of stock 
            $$('.add-to-cart-buttons .btn-cart span span').each(function(e) { e.update('Size Out of Stock'); });
            $$('.add-to-cart-buttons .btn-cart').each(function(e) { e.addClassName('nostock').disabled = true; });
            if ($('qty')) $('qty').disabled = true;
        }
    }
});
