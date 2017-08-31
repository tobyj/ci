/* globals jQuery, Modernizr, dataLayer, Mage, Handlebars, newrelic, JST, inst_price_format, formatCurrency, MageUrl, MageInfo, StoreService, MagentoAPI, MBPAPI, PB_Console, Base64, JSON */

/**
 * Quickcheckout functions required before it's initialised
 * (by opening sideCart)
 * All ajax requests in here should work with either standard or multibrand controllers
 */

window.dataLayer = window.dataLayer || [];
var checkoutInSidecart = false; //todo this would be set via initCheckout (an admin checkbox)
var userCountry;

/**
 * Generic global function for grabbing url params into an object
 * e.g. ?blah=123
 * var x = getUrlParams(); x.blah === 123;
 * @return {Array}
 */
var getUrlParams = function() {
    "use strict";
    var params = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        params.push(hash[0]);
        params[hash[0]] = hash[1];
    }
    return params;
};

/**
 * isInteger polyfill
 */
Number.isInteger = Number.isInteger || function(value) {
        "use strict";
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    };
/**
 * Object.Keys polyfill
 * from https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/keys#Polyfill
 * Needed to iterate named arrays from php (which are simply objects in JS)
 */
if (!Object.keys) {
    Object.keys = (function() {
        "use strict";
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
            if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }

            var result = [], prop, i;

            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }

            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}

(function($) {
    "use strict";
    var doc = $(document);
    window.quickCheckout = window.quickCheckout || {};
    userCountry = {}; //$.jStorage.get('qc_userCountry', {}); //don't cache user country any more

    /**
     * Replace Customer Service Text into Customer Service Link
     * Links to Contact Page
     */
    var replaceCustomerServiceText = function (mgs) {
        //Replace any text that says "Customer Service" with a link to customer service page
        var csUrl = '<a href="' + MageUrl.base + 'contact-us" class="customer-service-link">Customer Service</a>';
        mgs = mgs.replace(/Customer Service/gi, csUrl);
        return mgs;
    };

    $.extend({
        /**
         * addCheckoutMessage()
         *
         * @param msg {string}
         * @param classes {string}
         * @param translate {boolean}
         *
         * @example jQuery.addCheckoutMessage('my html message', 'success autodismiss', true);
         */
        addCheckoutMessage: function(msg, classes, translate) {
            var epayload = msg.replace(/<\/?[^>]+(>|$)/g, "");
            //translate strings by default, set to false if already translated, or large string (e.g. modal)
            translate = (typeof translate !== "undefined") ? translate : true;
            if (translate && window.quickCheckout.translate) {
                msg = window.quickCheckout.translate(msg);
                msg = replaceCustomerServiceText(msg);
            }
            classes = typeof classes !== 'undefined' ? classes : 'autodismiss';
            msg = $('<div class="msg" role="alert"></div>').addClass(classes).html(msg).prependTo('.global-msgs');
            msg.one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function(e) {
                //after css animation ends:
                if (e.originalEvent.animationName === 'autodismiss') {
                    msg.addClass('dismissed').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
                        //after css transition ends:
                        msg.remove();
                    });
                }
            });

            //push message to datalayer
            var classesArray = classes.split(' '),
                etype = "Message";
            if (classesArray.indexOf('error') !== -1) {
                etype = "Error";
            } else if (classesArray.indexOf('success') !== -1) {
                etype = "Success";
            }
            dataLayer.push({'event': 'feedback',
                'etype': etype,
                'epayload': epayload
            });

        },
        /**
         * clear previous checkout messages by css class
         *
         * @param classes {string} If empty will clear all messages
         */
        clearCheckoutMessage: function(classes) {
            classes = (typeof classes !== "undefined") ? classes : '.msg';
            $('.global-msgs').find(classes).addClass('dismissed').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
                //after css transition ends:
                $(this).remove();
            });
        }
    });

    doc.ajaxStop(function() {
        //all ajax requests finished, remove loading states
        //don't remove from #tjcheckout as we leave that on while page redirects during order submit / sign in etc.
        $('#tjcheckout').find('.minicart, .summary, li[data-inputid="rg_top2"]').removeClass('isloading');
    });

    doc.on('ready', function() {

        /**
         *
         * quickCheckout.Cart - Functions & Binding for side cart
         * required before whole quickCheckout is loaded
         *
         * */

        /**
         * Decode and display message if present in url e.g.
         * ?message=eyJ0eXBlIjoiZXJyb3IiLCJjYXRlZ29yeSI6bnVsbCwidGV4dCI6IlZhbGlkYXRpb24gSXNzdWU6IHBhbnRzIGhlbGxvISIsInN0b3JlIjpudWxsfQ%3D%3D
         */
        var urlVars = getUrlParams();
        if (urlVars.message) {
            if (typeof window.JSON !== "undefined") {
                var msgObj = JSON.parse(Base64.decode(decodeURIComponent(urlVars.message)));
                $.addCheckoutMessage(msgObj.text, 'autodismiss ' + msgObj.type, true);
            }
        }

        window.quickCheckout.translate = function(string) {
            if (!window.quickCheckout.lang.translations || !window.quickCheckout.lang.translations[string]) {
                //no translation file (lang.js) provided, or string doesn't exist in it, return original string
                return string;
            }
            return window.quickCheckout.lang.translations[string];
        };

        Handlebars.registerHelper("qc_translate", function(value, options) {
            return window.quickCheckout.translate(value);
        });
        Handlebars.registerHelper("formatcurrency", function(value, options) {
            //format a number as currency using Magento's built in global function
            return formatCurrency(value, inst_price_format);
        });
        Handlebars.registerHelper("formatcurrencyNoSymbol", function(value, options) {
            //copy object & set pattern as simply %s (removing any currency symbols that may be there)
            var format = jQuery.extend(true, {}, inst_price_format);
            format.pattern = "%s";
            return formatCurrency(value, format);
        });
        Handlebars.registerHelper("toLowerCase", function(value, options) {
            //format a number as currency using Magento's built in global function
            return value.toLowerCase();
        });
        Handlebars.registerHelper("calculateSaving", function(originalPrice, sellPrice, options) {
            return formatCurrency((originalPrice - sellPrice), inst_price_format);
        });
        Handlebars.registerHelper("getOptionValue", function(key, value, options) {
            if (key !== "jobid") {
                return value;
            }

            //strip size from end of value (M/L):
            switch (value.slice(0, -1)) {
                case "NAME-BACK": return "Name on back";
                case "NAME-LEG ": return "Name on leg";
                case "YEAR-BACK": return "Year on back";
                case "ILVE_NAME": return "I heart name";
                case "LDAD_NAME": return "Name heart dad";
            }
            return value;

        });
        Handlebars.registerHelper("getLocationHostname", function() {
            return window.location.hostname;
        });
        Handlebars.registerHelper("each-reverse", function(context, limit) {
            //same as each, but reversed
            var options = arguments[arguments.length - 1];
            var ret = '';

            if (context && context.length > 0) {
                for (var i = context.length - 1; i >= 0; i--) {
                    ret += options.fn(context[i]);
                }
            } else {
                ret = options.inverse(this);
            }

            return ret;
        });

        function get(obj, prop) {
            var parts = prop.split('.'),
                last = parts.pop();

            while ((prop = parts.shift())) {
                obj = obj[prop];

                if (obj === null) {
                    return;
                }
            }

            return obj[last];
        }

        function noop() {
            return '';
        }
        Handlebars.registerHelper("group", function(list, options) {
            options = options || {};

            var fn = options.fn || noop,
                inverse = options.inverse || noop,
                hash = options.hash,
                prop = hash && hash.by,
                keys = [],
                groups = {};

            if (!prop || !list || !list.length) {
                return inverse(this);
            }

            function groupKey(item) {
                var key = get(item, prop);

                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                }

                if (!groups[key]) {
                    groups[key] = {
                        value: key,
                        items: []
                    };
                }

                groups[key].items.push(item);
            }

            function renderGroup(buffer, key) {
                return buffer + fn(groups[key]);
            }

            list.forEach(groupKey);

            return keys.reduce(renderGroup, '');
        });

        //hacky but just for IE. who cares?
        if ($.browser && $.browser.msie && $.browser.version.substring(0, 2) === "10") {
            $("html").addClass("ie10");
        } else if (!!window.MSInputMethodContext && !!document.documentMode) {
            $("html").addClass("ie11");
        }

        /**
         * displayXhrErrorMessage
         * Show xhr error message, or a default message if none returned
         * @type {Function}
         */
        var displayXhrErrorMessage = (function(jqxhr, defaultMsg) {
            var msg = '';
            if (typeof defaultMsg !== "undefined") {
                msg = defaultMsg;
            }
            if (jqxhr && jqxhr.responseJSON && jqxhr.responseJSON.error) {
                msg = jqxhr.responseJSON.error;
            } else if (jqxhr && jqxhr.responseText) {
                msg = jqxhr.responseText;
            }
            $.addCheckoutMessage(msg, 'error autodismiss');
        });
        $.extend(window.quickCheckout, {displayXhrErrorMessage: displayXhrErrorMessage});

        window.quickCheckout.cart = (function() {

            var $body                   = $('body'),
                pageHeader              = $('.header'),
                pushClass               = $('.push_when_sidepanel_is_open'),
                cartToggle              = $('.js_toggle_cart'),
                $sidebar                = $('.sidecart'),
                $checkout               = $('#tjcheckout'),
                $minicart               = $('.minicart'),
                $minicartArticles       = $('#minicart'),
                headerCart              = $('#header-cart'),
                form_key                = headerCart.data('formKey'),
                isQuickCheckoutPage     = !!$('body.quickcheckout-index-index').length,
                cartTemplate            = JST["js/quickcheckout/cart_items.hbs"],
                summaryTemplate         = JST["js/quickcheckout/summary.hbs"],
                $summary                = $checkout.find('.summary');

            /**
             * ajaxUrl
             *
             * **/
            var ajaxUrl = function(path) {
                return MageUrl.base + path;
            };

            /**
             * openCart
             *
             * **/
            var openCart = function() {
                $sidebar.addClass('is_open');
                $body.addClass('panel_is_open');
                cartToggle.addClass('search_is_open');
                pushClass.addClass('is_pushed_left');
            };

            /**
             * closeCart
             * **/
            var closeCart = function(e) {

                if (typeof e !== "undefined") {
                    e.preventDefault();
                }
                $sidebar.removeClass('is_open');
                $body.removeClass('panel_is_open');
                cartToggle.removeClass('search_is_open');
                pushClass.removeClass('is_pushed_left');

                setTimeout(function() {
                    pageHeader.removeClass('change_transition_type');
                }, 500);
            };

            /**
             * toggleCart
             *
             * **/
            var toggleCart = function(e) {
                if (e && !isQuickCheckoutPage) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (isQuickCheckoutPage) {
                    openCart();
                } else {
                    if (!$minicartArticles.hasClass('done')) {
                        //for better loading experience in mbp
                        $checkout.removeClass('empty');
                        $minicart.addClass('isloading');
                    }
                    $sidebar.toggleClass('is_open');
                    $body.toggleClass('panel_is_open');
                    cartToggle.toggleClass('search_is_open');
                    pushClass.toggleClass('is_pushed_left');
                }

                // Change the transition type of the header since we want the transition
                // to be different if pushed, as opposed to when it appears from the top.
                // Wait for the left transition before changing.
                if (pageHeader.hasClass('change_transition_type')) {
                    setTimeout(function() {
                        pageHeader.removeClass('change_transition_type');
                    }, 500);
                }
                pageHeader.addClass('change_transition_type');
            };

            /**
             * cartAndSummaryLoadingState
             */
            var setCartAndSummaryLoadingState = function(isLoading) {
                if (isLoading) {
                    $minicart.addClass('isloading');
                    $summary.addClass('isloading');
                } else {
                    $minicart.removeClass('isloading');
                    $summary.removeClass('isloading');
                }
            };

            /**
             * updateCartQty
             * **/
            var updateCartQty = function(qty) {

                $('[data-ajax-totalitems]').attr('data-show-val', qty).text((qty === 0) ? ' ' : qty);
                $('.sidecart').attr('data-totalitems', qty);
                
                var whenStoreServiceReady = function() {

                    if ((StoreService.mode === "single" && qty === 0) || (StoreService.mode === "multi" && !StoreService.suspectItemsInCart()) || (StoreService.mode === "multi" && qty === 0 && $minicartArticles.find('article').length === 0)) {
                        $checkout.addClass('empty');
                    } else {
                        $checkout.removeClass('empty');
                    }

                    /**
                     * if qty not zero, and not already flagged: we flag.
                     */
                    if (typeof StoreService.MBP !== "undefined" && StoreService.MBP.config.enabled && (qty > 0)) {

                        var currentStoreNotFlagged = StoreService.MBP.getActiveStores().filter(function (store) {
                            return store.flag === false && store.current === true;
                        });

                        if (!StoreService.suspectItemsInCart() || currentStoreNotFlagged.length) {
                            StoreService.MBP.flagCartActivity();
                        }
                    }
                };

                if (!StoreService.ready) {
                    //store service is enabled, waiting for it to be ready:
                    doc.on('storeservice_ready', whenStoreServiceReady);
                } else {
                    //store service is either enabled and already 'ready', or disabled, proceed immediately:
                    whenStoreServiceReady();
                }

            };

            /**
             * populateCartAndSummary
             */
            var populateCartAndSummary = function(json) {

                /**
                 * add currency name (e.g. AUD) to summary json.
                 * It won't be visible in sidecart but not critical.
                 * It will display once whole checkout is loaded.
                 */
                $.extend(json, {MageUrl: MageUrl});
                if (typeof window.quickCheckout.config !== "undefined" && typeof window.quickCheckout.config.config !== "undefined") {
                    $.extend(json, {currency: window.quickCheckout.config.config.currency});
                }

                $.extend(window.quickCheckout, {cartView: json});

                $summary = $checkout.find('.summary');

                $minicartArticles.html(cartTemplate(json)).find('article').imagesLoaded()
                    .progress( function( instance, image ) {
                        $(image.img).closest('article').addClass('loaded');
                    })
                    .always( function( instance ) {
                        //all images loaded
                        $minicartArticles.find('article').addClass('loaded');
                    });

                updateCartQty(json.summary.item_count);

                //add instance=1 so we can use the same handlebars template twice, and no IDs are repeated
                var json_instance2 = $.extend({} , json, {instance: "1"});
                $summary.filter('.sidebar-only-slideout').html(summaryTemplate(json))
                    .one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
                        //reset the offset bottom option for headroom (summary height may have changed):
                        //after css transition ends:
                        $('.fixtop').data('headroom').offsetBottom = $('.summary.sidebar-only-slideout').height();
                    });
                $summary.not('.sidebar-only-slideout').html(summaryTemplate(json_instance2));

                //window.quickCheckout.getAssumedCountry(json.summary.shipping.country);

                if (typeof window.quickCheckout.reInitCheckout !== "undefined") {
                    //update checkout template in case of changes in payment types etc.
                    window.quickCheckout.reInitCheckout();
                }

                if (typeof json.messages !== "undefined") {
                    $.each(json.messages, function (i) {
                        /**
                         * e.g.
                         * category     : gift_box | gift_card_redemption | store_credit | shipping_country
                         * store_code   : bonds
                         * text         : Gift Boxes removed from quote.
                         * type         : notice
                         */
                        var msgObj = json.messages[i];
                        console.log(msgObj);
                        $.addCheckoutMessage('<i class="q_' + msgObj.store_code + '"></i> ' + msgObj.text, 'autodismiss ' + msgObj.type + ' category-' + msgObj.category, true);
                    });
                }

                //match heights update
                $.fn.matchHeight._update();

                $checkout.removeClass('isloading');

            };

            /**
             * updateCart
             * **/
            var updateCart = function() {

                setCartAndSummaryLoadingState(true);

                var whenStoreServiceReady = function() {

                    if (userCountry && userCountry.code && ((StoreService.mode === "single" && userCountry.allowed_single) || (StoreService.mode === "multi" && userCountry.allowed_multi)) && !userCountry.set) {
                        StoreService.setCountry(userCountry.code).done(function (json) {
                            userCountry.set = true;
                            //$.jStorage.set('qc_userCountry', userCountry);
                            populateCartAndSummary(json);
                        }).fail(function(jqxhr, textStatus, error) {
                            /**
                             * Could return an error related to a shipping restriction, e.g.
                             * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
                             * If that's the case we need to set the shipping select back to previous country.
                             */
                            displayXhrErrorMessage(jqxhr, "Error updating shipping country");
                            if (jqxhr.status === 400) {
                                //PB_Console.log('reset back to current country');
                                if (typeof window.quickCheckout.cartView !== "undefined") {
                                    $checkout.find('select[name="shipping[country_id]"]').val(window.quickCheckout.cartView.summary.shipping.country !== 'NZ' ? window.quickCheckout.cartView.summary.shipping.country : 'AU').trigger('change', ['']);
                                }
                            }

                            $checkout.removeClass('isloading');
                            setCartAndSummaryLoadingState(false);
                        });
                    } else {
                        StoreService.getCart().done(function (json) {
                            populateCartAndSummary(json);
                        }).fail(function (jqxhr, textStatus, error) {
                            displayXhrErrorMessage(jqxhr, "Error fetching bag.");

                            /**
                             * Cart failed. This could return an error related to a shipping restriction, e.g.
                             * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
                             * If that's the case we need to set the shipping select back to default country.
                             */
                            StoreService.setCountry('DEFAULT').done(function (json) {
                                $.addCheckoutMessage('Shipping country set to ' + json.summary.shipping.country, 'success autodismiss');
                                userCountry.set = true;
                                //$.jStorage.set('qc_userCountry', userCountry);
                                populateCartAndSummary(json);
                                if (typeof window.quickCheckout.cartView !== "undefined") {
                                    $checkout.find('select[name="shipping[country_id]"]').val(window.quickCheckout.cartView.summary.shipping.country !== 'NZ' ? window.quickCheckout.cartView.summary.shipping.country : 'AU').trigger('change', ['']);
                                }
                            }).fail(function(jqxhr, textStatus, error) {
                                //unrecoverable fail
                                displayXhrErrorMessage(jqxhr, "Error updating shipping country to default.");

                            }).always(function(){
                                $checkout.removeClass('isloading');
                                $minicartArticles.removeClass('done');
                                setCartAndSummaryLoadingState(false);
                            });

                        });
                    }
                };

                if (!StoreService.ready) {
                    //store service is enabled, waiting for it to be ready:
                    doc.on('storeservice_ready', whenStoreServiceReady);
                } else {
                    //store service is either enabled and already 'ready', or disabled, proceed immediately:
                    whenStoreServiceReady();
                }

            };

            /**
             * emptyCart
             * **/
            var emptyCart = function() {
                setCartAndSummaryLoadingState(true);
                //was $.getJSON(ajaxUrl('checkout/cart/clear')

                var whenStoreServiceReady = function() {
                    StoreService.cartClear().done(function (json) {

                        var btn = $checkout.find('.emptycart .prompt');

                        /**
                         * @param json.dataLayerObj
                         * @param json.href
                         * @param json.items
                         * @param json.summary
                         */

                        populateCartAndSummary(json);

                        if (window.quickCheckout.resetDeliveryToAU) {
                            window.quickCheckout.resetDeliveryToAU(true);
                        }

                        btn.text(btn.data('textDefault'));
                        $checkout.find('.emptycart button').removeClass('show');
                        $.addCheckoutMessage(window.quickCheckout.translate("Bag is empty.") + ' <a href="' + MageUrl.base + '" class="empty-cart home-link">Continue Shopping</a>', 'success autodismiss', false);

                        if (json.dataLayerObj) {
                            dataLayer.push(json.dataLayerObj);
                        }
                        dataLayer.push({'event': 'emptyCart'});

                        $checkout.find('[data-ajax-grandtotal]').attr('data-show-val', '0').find('span').text('$0.00');

                    }).fail(function (jqxhr, textStatus, error) {
                        displayXhrErrorMessage(jqxhr, "Error emptying bag.");
                    }).always(function () {
                        setCartAndSummaryLoadingState(false);
                    });
                };

                if (!StoreService.ready) {
                    doc.on('storeservice_ready', whenStoreServiceReady);
                } else {
                    whenStoreServiceReady();
                }

            };

            /**
             * loadCheckout
             * **/
            var loadCheckout = function() {

                if (!$minicartArticles.hasClass('done') && typeof MBPAPI !== "undefined") {
                    //for better loading experience in mbp
                    $checkout.addClass('isloading');
                }

                if ($('.quickcheckout-loaded').length) {
                    //full checkout already loaded, then item added to cart
                    if (!$minicartArticles.hasClass('done')) {
                        $minicartArticles.addClass('done');
                        updateCart();
                    }
                    return;
                }
                $minicart.addClass('isloading');

                var whenStoreServiceReady = function() {
                    $.getScript(MageUrl.skin + '../default/js/quickcheckout/quickcheckout.min.js').done(function (script, textStatus) {
                        //load the full checkout
                        $('html').addClass('quickcheckout-loaded'); //optionally add fullwidth (primed for a/b test)
                        window.quickCheckout.loadFullCheckout();
                        $sidebar.removeClass('full-not-loaded');
                    }).fail(function (jqxhr, settings, exception) {
                        PB_Console.log(jqxhr);
                        $minicart.removeClass('isloading');
                    }).always(function () {
                        if ($checkout.hasClass('empty')) {
                            $minicart.removeClass('isloading');
                        }
                    });
                };

                if (!StoreService.ready) {
                    doc.on('storeservice_ready', whenStoreServiceReady);
                } else {
                    whenStoreServiceReady();
                }

            };

            /**
             * This happens when minibag is clicked
             */
            var cartToggleAction = function() {
                if (!$sidebar.hasClass('full-not-loaded') || isQuickCheckoutPage) {
                    loadCheckout();
                } else if (!$minicartArticles.hasClass('done')) {
                    $minicartArticles.addClass('done');
                    updateCart();
                }
            };

            /**
             * bind critical events. Stuff that needs to happen now, not waiting for MBP.
             * **/
            var bindEvents = function() {

                /**
                 * COLORBOX EVENT HOOKS - applied universally
                 *
                 * cbox_open        triggers when Colorbox is first opened, but after a few key variable assignments take place.
                 * cbox_load        triggers at the start of the phase where content type is determined and loaded.
                 * cbox_complete    triggers when the transition has completed and the newly loaded content has been revealed.
                 * cbox_cleanup     triggers as the close method begins.
                 * cbox_closed      triggers as the close method ends.
                 **/
                /**
                 * Add/remove class when colorbox is opened/closed.
                 */
                doc.on('cbox_open', function () {
                    $('body').addClass('colorbox-open');
                }).on('cbox_closed', function () {
                    $('body').removeClass('colorbox-open');
                });

                // Close the sideCart if you click anywhere but sideCart or PostCodeAnywhere (pca) or Google location (pac-container)
                doc.on('click', function(e) {

                    if ($(e.target).is('[class^="pac-"]') || $(e.target).is('body')) {
                        //google autocomplete (strangely sometimes target for this is body)
                        return;
                    }

                    if (!$(e.target).closest('.sidecart, .pca, .pcaitem, .pac-container').length && $('.sidecart.is_open').length) {
                        closeCart();
                    }

                });

                // Delegate the sidebar close so it still works
                doc.on('click', '.js_toggle_cart', toggleCart);

                //match-heights
                $checkout.find('.match-height').matchHeight({property: 'min-height'});

                //CLOSE SIDECART / CONTINUE SHOPPING
                $checkout.on('click', '.back-link a', function(e){
                    e.preventDefault();
                    if (isQuickCheckoutPage) {
                        dataLayer.push({'event':'quickCheckout', 'etype':'CONTINUE SHOPPING'});
                        //go back if in same domain otherise go to home page
                        if (document.referrer.indexOf(window.location.host) !== -1) {
                            history.go(-1); return false;
                        } else {
                            window.location.href = MageUrl.base;
                        }
                    } else {
                        closeCart(e);
                    }
                });

                //GO HOME
                doc.on('click', '.home-link', function(e){
                    e.preventDefault();
                    if (!isQuickCheckoutPage && $(this).hasClass('empty-link')) {
                        closeCart(e);
                    } else {
                        window.location.href = MageUrl.base;
                    }
                });

                //DISMISS GLOBAL MSG
                $checkout.on('click', '.global-msgs .msg, .msg.can-dismiss', function(e){
                    var $t = $(this),
                        o = $t.offset(),
                        w = $t.width(),
                        x = $t.hasClass('modal') ? 45 : -10;

                    if ((e.pageX - o.left - w + x) > 0) {
                        //pseudo element 'X' clicked
                        $t.addClass('dismissed').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
                            //after css transition ends:
                            $t.remove();
                        });
                    }
                });

                //HIDE HEADER ON SCROLL see http://wicky.nillia.ms/headroom.js/
                var $scroller = ((!isQuickCheckoutPage && $('.sidecart.full-not-loaded').length) ? $checkout.find('.primary')[0] : window);
                $('.fixtop').headroom({
                    offset: 42,
                    offsetBottom: $('.summary.sidebar-only-slideout').height(),
                    tolerance: 5,
                    scroller: $scroller,
                    onPin: function(){
                        if (!$('.quickcheckout-loaded').length) {
                            return;
                        }
                        var $scrollContext = ($('.sidecart.full-not-loaded').length ? $checkout.find('.primary') : $(window));
                        if (($('[data-waypoint="delivery"]').offset().top - $scrollContext.scrollTop() - 86) < 0) {
                            this.elem.classList.remove(this.classes.pinned);
                            this.elem.classList.add(this.classes.unpinned);
                        }
                    }
                });

                //LOAD CART ON CLICK
                doc.on('click', '.js_toggle_cart.header_utilities_cart, .js_toggle_cart.header_utilities_cart_mobile', cartToggleAction);

                //CLICK 'PROCEED TO CHECKOUT' AFTER ADDING PRODUCT
                doc.on('click', '.cart-message-buttons .proceed-checkout', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (checkoutInSidecart && $checkout.length) {
                        //slide bag open
                        $.colorbox.close();
                        cartToggleAction();
                    } else {
                        //redirect to /quickcheckout
                        window.location.href = MageUrl.base + 'quickcheckout';
                    }
                });

                //don't allow link clicks if in one step checkout
                $('.onestepcheckout-index-index .sidecart_inner a').on('click', function(e){
                    e.preventDefault();
                });

                //CHANGE PRODUCT QTY/REMOVE
                $checkout.on('click', '.plusminus button', function(e) {
                    var $t = $(this),
                        $p = $t.parent(),
                        input = $p.find('input'),
                        min = parseInt(input.attr('min'), 10),
                        max = parseInt(input.attr('max'), 10),
                        i = parseInt(input.val(), 10),
                        qty;

                    if ($t.is(':first-child')) {
                        qty = 1;
                    } else {
                        qty = -1;
                    }

                    if ((i < max && (qty > 0)) || (i > min && (qty <= 0) )) {
                        input.val(i + qty).change();
                    } else if ($t.hasClass('zero') && i === 0) {
                        input.change();
                    }
                });

                var editQtySuccess = function(json, customMsg) {
                    populateCartAndSummary(json);

                    var msg;
                    if (typeof customMsg !== "undefined" && StoreService.mode !== "multi") {
                        msg = customMsg;
                    } else {
                        var sauce = window.quickCheckout.lang.sauce ? window.quickCheckout.lang.sauce[(Math.floor(Math.random() * window.quickCheckout.lang.sauce.length))] + " " : "";
                        msg = sauce + window.quickCheckout.translate('Quantity updated.');
                    }

                    /**
                     * Reload locations (if already searched for) as products in cart have changed,
                     * and therefore collect locations may have changed
                     */
                    var $pickupLocations = $checkout.find('.pickuplocations');
                    if (window.quickCheckout.getPickupLocations && $pickupLocations.find('.pickuphbs.populated').length) {
                        //pickup location list has been populated.

                        if ($pickupLocations.hasClass('selected')) {
                            //a pickup location is selected, save it, clear it and reset it once locations have refreshed (if still there)
                            $pickupLocations.data('lastSelectedId', $pickupLocations.find('.locationlist .expanded').data('id'));
                            $pickupLocations.find('.changelocation').click();
                        } else {
                            $pickupLocations.data('lastSelectedId', false);
                        }

                        //refresh locations using last values (and inside getPickupLocations it will set last ID again if present):
                        var last = $pickupLocations.data('lastParams');
                        window.quickCheckout.getPickupLocations(last.postcode, last.lat, last.lon);
                    }

                    $.clearCheckoutMessage('.quantity-update');
                    $.addCheckoutMessage(msg, 'success autodismiss quantity-update', false);

                    if (json.dataLayerObj) {
                        dataLayer.push(json.dataLayerObj);
                    }
                };

                var editQtyFailure = function(jqxhr, textStatus, error) {
                    //reset last changed qty to current
                    var $lastPlusMinus = $checkout.find('.plusminus[data-ajax-id="' + $minicartArticles.data('lastQtyChange') + '"]');
                    $lastPlusMinus.find('input').val($lastPlusMinus.find('input').data('current'));

                    //re-enable plusminus qty buttons and inputs
                    $minicartArticles.not('.free-product').find('.plusminus').each(function(){
                        var $p      = $(this),
                            input   = $p.find('input'),
                            p       = $p.find('button:first-child').prop('disabled', false),
                            max     = parseInt(input.attr('max'), 10),
                            i       = parseInt(input.val(), 10);

                        //enable minus
                        $p.find('button:last-child').prop('disabled', false);

                        if (i >= max) {
                            //disable plus
                            p.prop('disabled', true);
                        }
                    });

                    displayXhrErrorMessage(jqxhr, "Error editing product quantity.");
                    if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                };

                //action for UPDATE
                function editQtyUpdate(id, qty, customMsg) {

                    //disable qty edit buttons
                    $checkout.find('.plusminus :input').prop('disabled', true);

                    //GIFT BOX - include options if available
                    var giftBox_data = [];
                    if( $checkout.find('.gift-boxing.has-gift-option').length ) {
                        giftBox_data = $checkout.find('article.gift-boxing input[name="gift_option_id"], article.gift-boxing .form-container :input').serializeArray();
                    }

                    setCartAndSummaryLoadingState(true);

                    var whenStoreServiceReady = function() {
                        StoreService.updateQuantity({quote_item_id: id, qty: qty, form_data: giftBox_data}).done(function(json) {
                            editQtySuccess(json, customMsg);
                        }).fail(editQtyFailure).always(function(){
                            setCartAndSummaryLoadingState(false);
                        });
                    };

                    if (!StoreService.ready) {
                        doc.on('storeservice_ready', whenStoreServiceReady);
                    } else {
                        whenStoreServiceReady();
                    }
                }

                //action for DELETE
                function editQtyRemove(id, customMsg) {

                    //disable qty edit buttons
                    $checkout.find('.plusminus :input').prop('disabled', true);

                    //GIFT BOX - include options if available
                    var giftBox_data = [];
                    if( $checkout.find('.gift-boxing.has-gift-option').length ) {
                        giftBox_data = $checkout.find('article.gift-boxing input[name="gift_option_id"], article.gift-boxing .form-container :input').serializeArray();
                    }

                    setCartAndSummaryLoadingState(true);

                    var whenStoreServiceReady = function() {
                        StoreService.removeItem({quote_item_id: id, form_data: giftBox_data}).done(function (json) {
                            editQtySuccess(json, customMsg);
                        }).fail(editQtyFailure).always(function () {
                            setCartAndSummaryLoadingState(false);
                        });
                    };

                    if (!StoreService.ready) {
                        doc.on('storeservice_ready', whenStoreServiceReady);
                    } else {
                        whenStoreServiceReady();
                    }
                }

                //QTY CHANGE INPUT
                $checkout.on('change', '.plusminus input', function(e) {
                    e.preventDefault();

                    var $t      = $(this),
                        $p      = $t.parent(),
                        id      = $p.attr('data-ajax-id'),
                        input   = $p.find('input'),
                        current = input.data('current'),
                        p       = $p.find('button:first-child'),
                        m       = $p.find('button:last-child'),
                        min     = parseInt(input.attr('min'), 10),
                        max     = parseInt(input.attr('max'), 10),
                        i       = parseInt(input.val(), 10);

                    //store id of item we are changing in case of error
                    $minicartArticles.data('lastQtyChange', id);

                    if ( (i <= min) || (!i) ) {
                        i = min;
                        p.prop('disabled', false); //m.prop('disabled', true);
                    } else if (i >= max) {
                        i = max;
                        p.prop('disabled', true); m.prop('disabled', false);
                    } else {
                        p.prop('disabled', false); m.prop('disabled', false);
                    }

                    input.val(i);
                    $p.attr('data-val', i);

                    if (i >= 1) {
                        m.removeClass('zero');
                        if (i !== current) {
                            editQtyUpdate(id, input.val());
                        }
                    } else {

                        if (m.hasClass('zero')) {

                            m.prop('disabled', true);

                            var $article = $p.closest('article').not('.removing').addClass('removing'),
                                url;

                            if ($article.attr("data-parent-pid") !== $article.attr("data-pid")) {
                                //configurable product add with super attributes (e.g. Bonds/Berlei)
                                url = ajaxUrl('catalog/ajax/add/') + 'product/' + $article.attr("data-parent-pid") + '/isAjax/1/?' + $article.attr("data-super-attribute");
                            } else {
                                //simple add (e.g. Sheridan)
                                url = ajaxUrl('catalog/ajax/add/') + 'product/' + $article.attr("data-pid") + '/isAjax/1/';
                            }

                            var undoRemoveMsg = '<span class="limitwidth">' + $article.find('.product_title').text() + '</span> removed';

                            //show undo button if product not out of stock and not giftcard and not a free product (gwp)
                            if (!$article.hasClass('out-of-stock') && $article.attr('data-type') !== 'giftcard' && !$article.hasClass('free-product')) {
                                undoRemoveMsg += ' <a class="undo-remove" data-ajax="' + url + '" href="' + $article.data('url') + '">UNDO</a>';
                            }

                            editQtyRemove(id, undoRemoveMsg);

                            $article.slideUp(function(){
                                $article.remove();
                            });

                        } else {
                            m.addClass('zero');
                        }

                    }

                });

                //CATCH ENTER KEY
                $checkout.on('keypress', '.plusminus input', function(event) {
                    if (event.keyCode === 13) {
                        event.preventDefault();
                        $(this).blur();
                    }
                });

                //UNDO REMOVE (RE-ADD PRODUCT)
                $checkout.on('click', '.undo-remove', function(e) {
                    e.preventDefault();
                    var $t = $(this),
                        $p = $t.parent(),
                        prodName = $p.find('.limitwidth').text(),
                        url = $t.attr('data-ajax');

                    if (!$t.hasClass('done')) {

                        $p.addClass('dismissed').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
                            //after css transition ends:
                            if (e.originalEvent.propertyName === 'opacity') {
                                $p.remove();
                            }
                        });

                        setCartAndSummaryLoadingState(true);
                        $.getJSON(url, {form_key: form_key, undo: 1}, function (json) {
                            //success
                            $t.addClass('done');
                            if (json.success === true) {
                                //TODO Temporary! This is not cool. replace with single json request that has minicart included, and move success message out:

                                setCartAndSummaryLoadingState(true);
                                $minicartArticles.addClass('done');

                                var getCartSuccess = function(json) {

                                    populateCartAndSummary(json);

                                    if (window.quickCheckout.cartView) {
                                        $checkout.find('select[name="shipping[country_id]"]').val(window.quickCheckout.cartView.summary.shipping.country).trigger('change', ['']);
                                    }

                                    $.addCheckoutMessage(window.quickCheckout.translate("%product% is back in the bag.").replace('%product%', '<i class="q_checkmark"></i> <span class="limitwidth">' + prodName + '</span>'), 'success autodismiss', false);

                                    /*
                                     if (window.quickCheckout.resetDeliveryToAU) {
                                     window.quickCheckout.resetDeliveryToAU();
                                     }
                                     */

                                    setCartAndSummaryLoadingState(false);
                                };

                                var whenStoreServiceReady = function() {
                                    StoreService.getCart().done(function (json) {

                                        getCartSuccess(json);

                                    }).fail(function (jqxhr, textStatus, error) {
                                        //fail
                                        displayXhrErrorMessage(jqxhr, "Error fetching bag.");
                                        if (typeof newrelic !== 'undefined') {
                                            newrelic.noticeError(error);
                                        }

                                        /**
                                         * Cart failed. This could return an error related to a shipping restriction, e.g.
                                         * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
                                         * If that's the case we need to set the shipping select back to default country.
                                         */
                                        StoreService.setCountry('DEFAULT').done(function (json) {
                                            $.addCheckoutMessage('Shipping country set to ' + json.summary.shipping.country, 'success autodismiss');
                                            $checkout.find('input[name="address_ship_picker"]').prop('checked', false);
                                            $checkout.find('.address.selected-ship').removeClass('selected-ship');
                                            userCountry.set = true;
                                            //$.jStorage.set('qc_userCountry', userCountry);
                                            getCartSuccess(json);
                                        }).fail(function(jqxhr, textStatus, error) {
                                            //unrecoverable fail
                                            displayXhrErrorMessage(jqxhr, "Error updating shipping country to default.");
                                        }).always(function(){
                                            $minicartArticles.removeClass('done');
                                            setCartAndSummaryLoadingState(false);
                                        });
                                    });
                                };

                                if (!StoreService.ready) {
                                    doc.on('storeservice_ready', whenStoreServiceReady);
                                } else {
                                    whenStoreServiceReady();
                                }

                                //quickCheckout.cartAndTotals();

                                if (json.dataLayerObj) {
                                    dataLayer.push(json.dataLayerObj);
                                    if (json.qty === 0) {
                                        dataLayer.push({'event': 'emptyCart'});
                                    }
                                }

                            } else {
                                $.addCheckoutMessage('Error re-adding your item.', 'error autodismiss');
                            }
                        }).fail(function (jqxhr, textStatus, error) {
                            $t.removeClass('done');
                            $.addCheckoutMessage('Error re-adding your item.', 'error autodismiss');
                            if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                        }).always(function () {
                            setCartAndSummaryLoadingState(false);
                        });

                    }

                });

                //GO TO PRODUCT URL IN MINICART
                $checkout.on('click', '.articles [data-url]', function(e){
                    //if click product title or image...
                    var $target = $(e.target);
                    if ($target.hasClass('product_title') || $target.is('figure > img')){
                        window.location.href = $(this).data('url');
                    }
                });

                //EMPTY CART
                $checkout.on('click', '.emptycart .prompt', function(e){
                    e.preventDefault();
                    var $t = $(this);

                    if ($t.hasClass('show')) {

                        emptyCart();

                    } else {
                        $t.find('span').text($t.data('textSure'));
                        $('.emptycart button').addClass('show');
                    }
                });

                //CANCEL EMPTY CART
                $checkout.on('click', '.emptycart .no', function(e){
                    e.preventDefault();
                    var $p = $('.emptycart .prompt');
                    $p.find('span').text($p.data('textDefault'));
                    $('.emptycart button').removeClass('show');
                });

                /****************
                 *** GIFT BOX ***
                 ****************/
                //GIFT BOXING EVENT
                $checkout.on('keypress', '.giftbox-action-container', function(e) {
                    var notAllowedKeys = [13, // \n enter
                        44, // ,  comma
                        45];// -  dash
                    if( $.inArray(e.which, notAllowedKeys)!==-1 ){
                        return false;
                    }
                    return true;
                });

                //GIFT BOX MESSAGE TEXTAREA CHAR COUNT
                $checkout.on('input', '.giftbox-action-container textarea, #giftcard_message', function() {
                    var $this = $(this);
                    var maxLength = parseInt($this.attr("maxlength"), 10);
                    var cLength   = $this.val().length;
                    $checkout.find('label[for=' + this.id + '] .charCount').text(maxLength - cLength);
                    if (cLength) {
                        $this.addClass('has-value');
                    } else {
                        $this.removeClass('has-value');
                    }
                });

                //GIFT BOX SAVE
                function saveGiftbox(){

                    //updateGiftOption requires form_key and gift_option_id
                    var form_data = $checkout.find('input[name="form_key"], article.gift-boxing :input').serializeArray(),
                        $createBtn = $('.giftbox-action-container button.create').prop('disabled', true);

                    setCartAndSummaryLoadingState(true);
                    $.getJSON(MageUrl.base + 'quickcheckout/checkout/updateGiftOption', form_data).done(function (json) {

                        //TODO: this updateCart will be replaced with `minicart.html(cartTemplate(json))` in the json response (currently html)
                        //PB_Console.log(json);
                        updateCart();

                    }).fail(function (jqxhr, textStatus, error) {

                        displayXhrErrorMessage(jqxhr, 'Gift box could not be added.');

                        //todo: remove when response above is json not html:
                        setCartAndSummaryLoadingState(true);
                        $createBtn.prop('disabled', false);

                    }).always(function () {
                        //todo: uncomment when response above is json not html:
                        //setCartAndSummaryLoadingState(true);
                    });
                }

                //GIFT BOX CREATE
                $checkout.on('click', '.giftbox-action-container button.create', function(e) {
                    e.preventDefault();
                    // add gift box:
                    saveGiftbox();
                });

                //GIFT BOX REMOVE
                function removeGiftbox() {
                    var $checkout_tab       = $checkout.find('li[data-inputid="rg_top2"]');

                    //remove gift option requires only form_key
                    var form_data = {
                        form_key: form_key
                    };

                    $checkout_tab.addClass('isloading');
                    setCartAndSummaryLoadingState(true);
                    $.getJSON(MageUrl.base + 'quickcheckout/checkout/removeGiftOption', form_data).done(function (json) {

                        //TODO: this updateCart will be replaced with `minicart.html(cartTemplate(json))` in the json response (currently html)
                        //PB_Console.log(json);
                        updateCart();

                        //todo: remove when response above is json not html:
                        $checkout_tab.removeClass('isloading');

                    }).fail(function (jqxhr, textStatus, error) {
                        PB_Console.log(jqxhr);

                        displayXhrErrorMessage(jqxhr, 'Gift box could not be removed.');

                        //todo: remove when response above is json not html:
                        $checkout_tab.removeClass('isloading');
                        setCartAndSummaryLoadingState(true);

                    }).always(function () {
                        //todo: uncomment when response above is json not html:
                        //$checkout_tab.removeClass('isloading');
                        //setCartAndSummaryLoadingState(true);
                    });

                }

                //GIFT BOX REMOVE HANDLER
                $checkout.on('click', '.giftbox_remove', function(e) {
                    e.preventDefault();
                    removeGiftbox();
                });

                //GIFT BOX MESSAGE
                $checkout.on('change', '.giftbox-action-container #has_gift_message', function(e) {
                    var $giftBoxing = $(this).closest('.gift-boxing');

                    if( $(this).is(':checked') ){
                        $giftBoxing.find('.toggle-on').addClass('hidden');
                        $giftBoxing.find('.toggle-off').removeClass('hidden');

                        //retrieve old values from data-val
                        $giftBoxing.find(':input[name^="gift_message"]').each(function(){
                            var $this = $(this);
                            if (!$this.data('val')) {
                                return;
                            }
                            $this.val($this.data('val'));
                        });
                        $giftBoxing.find('.form').show();
                        $giftBoxing.find('.form #gift-message-from').focus().select();
                    } else {
                        $giftBoxing.find('.toggle-on').removeClass('hidden');
                        $giftBoxing.find('.toggle-off').addClass('hidden');

                        $giftBoxing.find('.form').hide();
                        //store old values in data-val
                        $giftBoxing.find(':input[name^="gift_message"]').each(function(){
                            var $this = $(this);
                            $this.data('val', $this.val());
                        }).val('');
                    }
                });

                //PROCEED TO CART BUTTON (WITHIN CHECKOUT)
                $checkout.on('click', '.proceed-checkout', function(e) {
                    e.preventDefault();

                    if (checkoutInSidecart) {
                        loadCheckout();
                    } else {
                        //save gift message and put back when quickcheckout is loaded
                        if ($checkout.find('.giftbox-action-container').length) {
                            $.jStorage.set("qc_gift_message", $checkout.find(':input[name^="gift_message"]').serializeArray());
                        }

                        if (typeof StoreService.MBP !== "undefined" && StoreService.mode === "multi") {

                            var currentStoreNotFlagged = StoreService.MBP.getActiveStores().filter(function (store) {
                                return store.flag === false && store.current === true;
                            });

                            /**
                             * Need to also check if items from this store is 0 as the flag doesn't reset it self until page reload
                             * e.g. Remove last item from current store from cart, and click checkout without refreshing
                             */
                            var itemsFromThisStore = window.quickCheckout.cartView.items.filter(function (item) {
                                return item.store_code === MageInfo.store_code;
                            });

                            if (currentStoreNotFlagged.length || itemsFromThisStore.length === 0) {
                                //current store has no flag
                                var otherFlaggedStores = StoreService.MBP.getActiveStores().filter(function (store) {
                                    return store.flag === true && store.current === false;
                                });

                                if (otherFlaggedStores.length === 1) {
                                    //only 1 other store has a flag, use their checkout:
                                    window.location.href = '//' + otherFlaggedStores[0].hostname + '/quickcheckout';
                                    return;
                                }
                            }
                        }

                        //default
                        window.location.href = MageUrl.base + 'quickcheckout';
                    }
                });

                //MODAL - AfterPay
                if (!$.fn.colorbox) {
                    $('#what-is-afterpay-trigger').hide();
                }
                doc.on('click', '#what-is-afterpay-trigger', function(e){
                    e.preventDefault();
                    $.colorbox({
                        html: $('#afterpay-what-is-modal').html(),
                        className: "afterpay-what-is-modal colorbox-scrollable"
                    });
                });

                doc.on('click', '.saved-addresses-unavail-why', function(e){
                    e.preventDefault();
                    $.colorbox({
                        html: $('#addresses-unavailable-info').html(),
                        className: "colorbox-scrollable"
                    });
                });

                //CLOSE AFTERPAY MODAL
                doc.on('click', '.close-afterpay-button', function (e) {
                    e.preventDefault();
                    if ($.fn.colorbox) {
                        $.colorbox.close();
                    }
                });

                //generic colorbox close
                doc.on('click', '.colorbox-close', function () {
                    $.colorbox.close();
                });

                /**
                 * Return the full name of a country (e.g. Australia) given its 2 letter code (e.g. AU)
                 * NOTE: will only return label if country is listed in available shipping destinations
                 * @param countryCode {string}
                 * @return {string|false}
                 */
                var getCountryNameFromCode = function(countryCode) {

                    if (window.quickCheckout.countries) {
                        var resultA = $.grep(window.quickCheckout.countries, function (e) {
                            return e.value === countryCode;
                        });

                        if (resultA.length) {
                            return resultA[0].label;
                        }
                    }

                    if (StoreService.mode === "multi") {
                        //try getting it from magento mode country list
                        var qc_shipping_info = $.jStorage.get('qc_shipping_info');
                        if (qc_shipping_info && qc_shipping_info.single && qc_shipping_info.single.countries) {
                            var resultB = $.grep(qc_shipping_info.single.countries, function (e) {
                                return e.value === countryCode;
                            });

                            if (resultB.length) {
                                return resultB[0].label;
                            }
                        }
                    }

                    return countryCode; //return country code as fallback

                };
                $.extend(window.quickCheckout, {getCountryNameFromCode: getCountryNameFromCode});

                /**
                 * Update MBP Header
                 */
                var updateMBPStoresHeader = function() {

                    var $flagModal = $('.flag-modal-popup'),
                        $mbpHeader = $('.mbp-header');

                    if (typeof StoreService.MBP !== "undefined") {
                        var activeStores = StoreService.MBP.getActiveStores(),
                            activeStoresLength = activeStores.length,
                            activeStoreTextList = '',
                            activeStoreCount = 0;
                        for (var i = 0; i < activeStoresLength; i++) {
                            if (activeStores[i].enabled) {
                                activeStoreCount ++;
                                $mbpHeader.find('li[data-mbp-system-name="' + activeStores[i].system_name + '"]').addClass('enabled').find('a').attr('href', '//' + activeStores[i].hostname);
                                activeStoreTextList += '<a class="mbp-store-link mbp-store-link-' + activeStores[i].system_name + '" href="//' + activeStores[i].hostname + '">' + activeStores[i].friendly_name + '</a>';
                                if (i !== activeStoresLength - 1) {
                                    activeStoreTextList += ', ';
                                }
                            }
                        }
                        $mbpHeader.find('li').not('.enabled').addClass('disabled');

                        $flagModal.find('.mbp-store-list').html(activeStoreTextList);
                        $mbpHeader.find('.mbp-store-count').text(activeStoreCount);

                        /**
                         * Set current store
                         */
                        //PB_Console.log('CURRENT STORE: %c' + StoreService.activeAPI.currentStore.friendly_name, 'color: yellow');
                        $flagModal.find('.current-site-name').text(MageInfo.website_name);
                        $mbpHeader.find('li[data-mbp-system-name]').not($mbpHeader.find('[data-mbp-system-name="' + MageInfo.store_code + '"]').addClass('current')).removeClass('current');
                    }
                };

                /**
                 *
                 * @param userCountry {Object}
                 */
                var populateCountryShippingDetails = function(userCountry, countryInfo) {

                    PB_Console.log(countryInfo);

                    $('.mbp-info').addClass('ready'); //makes flag and shipping cta visible

                    var $flagWrapper = $('.your-country-flag'),
                        $flagModal = $('.flag-modal-popup');

                    //update flag image to user country
                    var flagUrl = MageUrl.skin + '../default/images/flags/' + userCountry.code.toLowerCase() + '.png';
                    $flagWrapper.find('img').attr('src', flagUrl);
                    $checkout.find('.mbp-flag img').attr('src', flagUrl);
                    $('.assumed-country').text(userCountry.name);

                    var countryAllowedResultSingle = false;
                    if (countryInfo.single.countries) {
                        countryAllowedResultSingle = $.grep(countryInfo.single.countries, function (e) {
                            return e.value === userCountry.code;
                        });
                    }
                    var countryAllowedResultMulti = false;
                    if (countryInfo.multi.countries) {
                        countryAllowedResultMulti = $.grep(countryInfo.multi.countries, function (e) {
                            return e.value === userCountry.code;
                        });
                    }

                    if (countryAllowedResultSingle.length) {
                        PB_Console.log('Country is in allowed list [single mode]! %c' + userCountry.name, 'color: lime');
                        userCountry.allowed_single = true;
                    } else {
                        PB_Console.log('Country is NOT in allowed list [single mode]! %c' + userCountry.name, 'color: red');
                        userCountry.allowed_single = false;
                    }
                    if (countryAllowedResultMulti.length) {
                        PB_Console.log('Country is in allowed list [multi mode]! %c' + userCountry.name, 'color: lime');
                        userCountry.allowed_multi = true;
                    } else {
                        PB_Console.log('Country is NOT in allowed list [multi mode]! %c' + userCountry.name, 'color: red');
                        userCountry.allowed_multi = false;
                    }

                    if ((StoreService.mode === "single" && userCountry.allowed_single) || (StoreService.mode === "multi" && userCountry.allowed_multi)) {
                        //SINGLE MODE, COUNTRY ALLOWED || MULTI MODE, COUNTRY ALLOWED

                        $flagWrapper.removeClass('not-allowed').addClass('allowed');
                        if (userCountry.code === "AU") {
                            $flagModal.find('.ship-text').not($flagModal.find('.ship-text-au').removeClass('hidden')).addClass('hidden');
                        } else if (userCountry.code === "NZ") {
                            $flagModal.find('.ship-text').not($flagModal.find('.ship-text-nz').removeClass('hidden')).addClass('hidden');
                        } else {
                            $flagModal.find('.ship-text').not($flagModal.find('.ship-text-other').removeClass('hidden')).addClass('hidden');
                        }
                    }

                    if (StoreService.mode === "multi" && !userCountry.allowed_multi) {
                        //MULTI MODE, COUNTRY NOT ALLOWED, BUT ALLOWED IN SINGLE MODE
                        $flagWrapper.removeClass('allowed').addClass('not-allowed');
                        $flagModal.find('.ship-text').not($flagModal.find('.ship-text-other').removeClass('hidden')).addClass('hidden');
                        $('.mbp-shipping-cta').text('Shipping to ' + userCountry.name + ' not available*');

                        $flagModal.find('.single-mode-ship-available').removeClass('hidden');
                        $flagModal.find('.single-mode-ship-na').addClass('hidden');
                    }

                    if (StoreService.mode === "multi" && !userCountry.allowed_multi && !userCountry.allowed_single) {
                        //MULTI MODE, COUNTRY NOT ALLOWED (EVEN IN SINGLE MODE)
                        $flagModal.find('.single-mode-ship-available').addClass('hidden');
                        $flagModal.find('.single-mode-ship-na').removeClass('hidden');
                    }

                    //build a list of allowed countries in single mode
                    var allowedCountryTextList = '';
                    var allowedCountries = countryInfo.single.countries;
                    var arrayLength = allowedCountries.length;
                    for (var i = 0; i < arrayLength; i++) {
                        if (userCountry.code === allowedCountries[i].value) {
                            allowedCountryTextList += '<strong>' + allowedCountries[i].label + '</strong>';
                        } else {
                            allowedCountryTextList += allowedCountries[i].label;
                            if (i !== arrayLength - 1) {
                                allowedCountryTextList += ', ';
                            }
                        }
                    }

                    $flagModal.find('.allowed-country-magento-list').html(allowedCountryTextList);

                    //resize colorbox in case it was open while content changed.
                    $.colorbox.resize();

                };

                var populateShippingThresholdText = function(country, countryInfo) {

                    var data;
                    if (StoreService.mode === "multi") {
                        data = countryInfo.multi.rates[country];
                    } else {
                        data = countryInfo.single.rates[country];
                    }

                    var $flagModal = $('.flag-modal-popup'),
                        $mbpShippingCta = $('.mbp-shipping-cta');

                    var dataLength = data.length,
                        costUnderThreshold,
                        costOverThreshold,
                        threshold;

                    if (dataLength === 0) {
                        //no shipping rate info - configuration error!
                        //$mbpShippingCta.html('Shipping rates unavailable for ' + country);

                    } else if (dataLength === 1) {
                        //one shipping price (probably AU)
                        costOverThreshold = data[0].cost === 0 ? 'FREE' : formatCurrency(data[0].cost, inst_price_format);
                        threshold = formatCurrency(data[0].from, inst_price_format);

                        if (country === "AU" && data[0].cost === 0) {
                            $mbpShippingCta.html('<i class="q_van"></i> Free Shipping and Returns Australia Wide*');
                        } else {
                            $mbpShippingCta.html('<i class="q_van"></i> ' + costOverThreshold + ' Shipping to ' + getCountryNameFromCode(country) + '*');
                        }
                    } else if (dataLength >= 2) {
                        //get last bracket only

                        costUnderThreshold = formatCurrency(data[0].cost, inst_price_format);
                        costOverThreshold = data[dataLength - 1].cost === 0 ? 'FREE' : formatCurrency(data[dataLength - 1].cost, inst_price_format);
                        threshold = formatCurrency(data[dataLength - 1].from, inst_price_format);

                        /**
                         * Strip decimal if zero
                         */
                        if (data[dataLength - 1].cost === 0 && threshold.substr(threshold.lastIndexOf(inst_price_format.decimalSymbol)) === inst_price_format.decimalSymbol + "00") {
                            threshold = threshold.substring(0, threshold.lastIndexOf(inst_price_format.decimalSymbol));
                        }

                        $mbpShippingCta.html('<i class="q_van"></i> ' + costOverThreshold + ' Shipping for orders over ' + threshold + ' to ' + getCountryNameFromCode(country) + '*');

                    }

                    $flagModal.find('.ship-cost-under-threshold').text(costUnderThreshold);
                    $flagModal.find('.ship-cost-over-threshold').text(costOverThreshold);
                    $flagModal.find('.ship-threshold').text(threshold);
                    if (StoreService.mode === "multi") {

                        if (typeof countryInfo.single.rates !== "undefined" && typeof countryInfo.single.rates[country] !== "undefined") {
                            data = countryInfo.single.rates[country];
                            dataLength = data.length;

                            if (dataLength === 0) {
                                //no shipping rate info
                                //$mbpShippingCta.html('No shipping rates for your country');
                                $('.single-mode-ship-rates-available').addClass('hidden');

                            } else if (dataLength === 1) {
                                //one shipping price (probably AU)
                                costOverThreshold = data[0].cost === 0 ? 'FREE' : formatCurrency(data[0].cost, inst_price_format);
                                threshold = formatCurrency(data[0].from, inst_price_format);

                                if (country === "AU" && data[0].cost === 0) {
                                    $mbpShippingCta.html('<i class="q_van"></i> Free Shipping and Returns Australia Wide*');
                                } else {
                                    $mbpShippingCta.html('<i class="q_van"></i> ' + costOverThreshold + ' Shipping to ' + getCountryNameFromCode(country) + '*');
                                }
                            } else if (dataLength >= 2) {
                                //get last bracket only

                                costUnderThreshold = formatCurrency(data[0].cost, inst_price_format);
                                costOverThreshold = data[dataLength - 1].cost === 0 ? 'FREE' : formatCurrency(data[dataLength - 1].cost, inst_price_format);
                                threshold = formatCurrency(data[dataLength - 1].from, inst_price_format);

                                /**
                                 * Strip decimal if zero
                                 */
                                if (data[dataLength - 1].cost === 0 && threshold.substr(threshold.lastIndexOf(inst_price_format.decimalSymbol)) === inst_price_format.decimalSymbol + "00") {
                                    threshold = threshold.substring(0, threshold.lastIndexOf(inst_price_format.decimalSymbol));
                                }

                                $mbpShippingCta.html('<i class="q_van"></i> ' + costOverThreshold + ' Shipping for orders over ' + threshold + ' to ' + getCountryNameFromCode(country) + '*');

                            }

                            $flagModal.find('.ship-cost-under-threshold-single').text(costUnderThreshold);
                            $flagModal.find('.ship-cost-over-threshold-single').text(costOverThreshold);
                            $flagModal.find('.ship-threshold-single').text(threshold);
                        }
                    }

                    //update the header again - so we can dynamically switch between multi and single mode without page refresh
                    updateMBPStoresHeader();
                };

                /**
                 * Get allowed shipping countries and shipping rates
                 * @param country {string} - Country Code e.g. "AU"
                 * @return {Object}
                 */
                var getShippingCountriesAndCosts = function(country) {
                    if (typeof country !== "string") {
                        country = "AU"; //todo replace with default country (not required immediately as all mbp sites are AU)
                    }

                    var d = $.Deferred();
                    var deferred = [];

                    var qc_shipping_info = $.jStorage.get('qc_shipping_info', {single: {}, multi: {}});

                    if (qc_shipping_info.single.countries) {
                        //get from cookie
                        PB_Console.log('%cSingle mode countries info in cookie', 'color: aqua');
                    } else {
                        deferred.push(
                            MagentoAPI.prototype.getCountries().done(function (json) {
                                PB_Console.log('%cSingle countries info fetched', 'color: blue');
                                $.extend(qc_shipping_info, {single: {default_country: json.default_country, countries: json.countries}});
                            })
                        );
                    }

                    if (typeof MBPAPI !== "undefined") {
                        if (qc_shipping_info.multi.countries) {
                            //get from cookie
                            PB_Console.log('%cMulti mode countries info in cookie', 'color: aqua');
                        } else {
                            deferred.push(
                                MBPAPI.prototype.getCountries().done(function (json) {
                                    PB_Console.log('%cMulti countries info fetched', 'color: blue');
                                    $.extend(qc_shipping_info, {
                                        multi: {
                                            default_country: json.default_country,
                                            countries: json.countries
                                        }
                                    });
                                })
                            );
                        }
                    }

                    if (qc_shipping_info.single.rates && qc_shipping_info.single.rates[country]) {
                        //get from cookie
                        PB_Console.log('%cSingle mode rates info for ' + country + ' in cookie', 'color: aqua');
                    } else {
                        deferred.push(
                            MagentoAPI.prototype.getShippingRates(country).done(function (data) {
                                PB_Console.log('%cSingle rates info for ' + country + ' fetched', 'color: blue');
                                if (typeof qc_shipping_info.single.rates === "undefined") {
                                    $.extend(qc_shipping_info.single, {rates: {}});
                                }
                                qc_shipping_info.single.rates[country] = data;
                            })
                        );
                    }

                    if (typeof MBPAPI !== "undefined") {
                        if (qc_shipping_info.multi.rates && typeof qc_shipping_info.multi.rates[country] === "object") {
                            //get from cookie
                            PB_Console.log('%cMulti mode rates info for ' + country + ' in cookie', 'color: aqua');
                        } else {
                            deferred.push(
                                MBPAPI.prototype.getShippingRates(country).done(function (data) {
                                    PB_Console.log('%cMulti rates info for ' + country + ' fetched', 'color: blue');
                                    if (typeof qc_shipping_info.multi.rates === "undefined") {
                                        $.extend(qc_shipping_info.multi, {rates: {}});
                                    }
                                    qc_shipping_info.multi.rates[country] = data;
                                })
                            );
                        }
                    }

                    $.when.apply(
                        $, deferred
                    ).then(function() {
                        d.resolve(qc_shipping_info);
                        $.jStorage.set('qc_shipping_info', qc_shipping_info);

                        //merge allowed shipping countries into quickCheckout
                        if (StoreService.mode === "multi") {
                            $.extend(window.quickCheckout, {countries: qc_shipping_info.multi.countries});
                        } else {
                            $.extend(window.quickCheckout, {countries: qc_shipping_info.single.countries});
                        }
                        populateShippingThresholdText(country, qc_shipping_info);
                    });

                    return d.promise();
                };


                /**
                 * Detect user's assumed shipping destination country
                 */
                var getAssumedCountry = function(forceSetToCode) {

                    function setAssumedCountry() {
                        if (userCountry.code) {
                            PB_Console.info('Your assumed shipping destination is %c' + userCountry.name + ' (' + userCountry.code + ')' + ' %c[via ' + userCountry.type + ']', 'color: yellow', 'color: default');

                            getShippingCountriesAndCosts(userCountry.code).done(function (data) {
                                populateCountryShippingDetails(userCountry, data);
                            });

                            //$.jStorage.set('qc_userCountry', userCountry);

                        } else {
                            PB_Console.info('Your assumed shipping destination is ' + '%cDEFAULT', 'color: yellow');
                            userCountry = {code: "AU", name: "Australia"};
                            getShippingCountriesAndCosts(userCountry.code).done(function (data) {
                                populateCountryShippingDetails(userCountry, data);
                            });
                        }
                    }

                    if (typeof forceSetToCode !== "undefined") {
                        userCountry = {};
                        userCountry.code = forceSetToCode;
                        userCountry.name = getCountryNameFromCode(userCountry.code);
                        setAssumedCountry();
                        return;
                    }

                    if (!navigator.geolocation){
                        PB_Console.info('browser geolocation not supported, leaving as default.');
                        setAssumedCountry();
                        return;
                    }

                    function geoSuccess(position) {
                        var crd = position.coords;
                        PB_Console.log("YOUR LOCATION (device): Latitude: " + crd.latitude + ", Longitude: " + crd.longitude + " (±" + crd.accuracy + "m)");
                        /**
                         * Reverse geocode users latlong to get country.
                         */
                        $.getJSON('//maps.googleapis.com/maps/api/geocode/json', {
                            sensor: false,
                            latlng: crd.latitude + ',' + crd.longitude
                            //key: "AIzaSyDoE3IFnGRZ4XI6cNr0lEhfanNvKvYMFDw" //Toby's dev key
                        }).done(function(data){
                            //PB_Console.log('Reverse geocode status: ' + data.status);
                            if (data.status === "OK") {
                                /**
                                 * without a premium paid google api plan we can't easily get country,
                                 * have to iterate through address components to find it.
                                 */
                                var r = data.results;
                                for (var i = 0; i < r.length; i++) {
                                    for (var j = 0; j < r[i].address_components.length; j++) {
                                        if ($.inArray('country', r[i].address_components[j].types) !== -1) {
                                            userCountry = {
                                                code: r[i].address_components[j].short_name,
                                                name: r[i].address_components[j].long_name,
                                                type: 'geo'
                                            };

                                            return;
                                        }
                                    }
                                }
                            }

                        }).always(function(){
                            setAssumedCountry();
                        });

                    }
                    function geoError() {
                        PB_Console.info('browser geolocation error, using default country.');
                        setAssumedCountry();
                    }

                    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
                };
                $.extend(window.quickCheckout, {getAssumedCountry: getAssumedCountry});

                doc.on('click', '.trigger-flag-modal, .mbp-shipping-cta', function(e){
                    e.preventDefault();
                    $.colorbox({
                        html: $('.flag-modal-popup').parent().html(),
                        className: $(e.target).closest('.trigger-flag-modal').hasClass('triggered-from-cart') ? "colorbox-scrollable triggered-from-cart" : "colorbox-scrollable",
                        /**
                         * Need to hide sidecart if toggling colorbox from there because you
                         * can't click the colorbox to close it. Once colorbox is closed
                         * we re-open sidecart again. tada.
                         */
                        onOpen: function(){
                            if ($('.sidecart.full-not-loaded.is_open').length) {
                                $sidebar.data('cartWasClosed', true);
                                closeCart(e);
                            }
                        },
                        onClosed: function() {
                            if ($sidebar.data('cartWasClosed')) {
                                openCart();
                                $sidebar.data('cartWasClosed', false);
                            }
                        }
                    });
                });

                /**
                 * init user country flag etc.
                 */
                (function(){

                    /**
                     * Add message to gift card PDPs if MBP is enabled
                     */
                    $('.mbp-on .product-view-giftcard .product-info').append('<div class="mbp-giftcard-note">Please note you cannot purchase gift cards if you check out through Bonds & Co. You will be prompted to remove this item on the checkout page.</div>');

                    /**
                     * Mobile header headroom
                     */
                    function getMobileOffset() {
                        //sheridanoutlet doesn't have a footer.header_mobile
                        var height = $('footer.header_mobile').length ? $('footer.header_mobile').outerHeight() : $('header.header_mobile').outerHeight();
                        return height - 1;
                    }
                    function getDesktopOffset() {
                        return $('header.header').outerHeight() - 1;
                    }
                    function setOffset() {
                        var offset = ($(window).width() > 768) ? getDesktopOffset() : getMobileOffset();
                        $body.css('paddingTop', offset);
                    }

                    $('.mbp-on footer.header_mobile').headroom({
                        offset: $('.mbp-header').height(),
                        tolerance: 5
                    });
                    $(window).smarterresize(setOffset);
                    //init
                    setOffset();

                    var whenStoreServiceReady = function() {
                        updateMBPStoresHeader();

                        if (typeof StoreService.MBP !== "undefined" && StoreService.MBP.config.enabled) {

                            if (userCountry && userCountry.code) {
                                //set flag
                                PB_Console.log('%cUser country is cached', 'color: aqua');
                                getShippingCountriesAndCosts(userCountry.code).done(function (data) {
                                    populateCountryShippingDetails(userCountry, data);
                                });
                            } else {
                                getAssumedCountry();
                            }
                        }
                    };

                    if (!StoreService.ready) {
                        doc.on('storeservice_ready', whenStoreServiceReady);
                    } else {
                        whenStoreServiceReady();
                    }
                })();

            };

            /**
             * init
             * **/
            var init = function() {
                PB_Console.log('%cQUICKCHECKOUT v1.14', 'background: #333; color: #fff');

                doc.on('storeservice_ready', function() {
                    PB_Console.log('StoreService: %cready %cMBP enabled: %c' + !!StoreService.MBP.config.enabled + ' %cMBP mode: %c' + StoreService.mode, 'color: yellow', 'color: default', 'color: yellow', 'color: default', 'color: yellow');
                });

                PB_Console.log('%cBINDEVENTS', 'background: #333; color: #fff');
                bindEvents();

                // If checkout page (/quickcheckout) apply fullwidth class & open sideCart immediately
                if (isQuickCheckoutPage) {
                    $('html').addClass('fullwidth');
                    //initialise quickcheckout immediately:
                    cartToggleAction();
                }


                var whenStoreServiceReady = function(){
                    if (typeof StoreService.MBP !== "undefined" && StoreService.MBP.config.enabled) {
                        //MBP is enabled
                        if (StoreService.suspectItemsInCart()) {
                            //items in MBP cart
                            updateCartQty($('.sidecart').data('totalitems'));
                        }
                    } else {
                        //mbp is disabled
                        updateCartQty($('.sidecart').data('totalitems'));
                    }

                };

                if (!StoreService.ready) {
                    doc.on('storeservice_ready', whenStoreServiceReady);
                } else {
                    whenStoreServiceReady();
                }

            };

            return {
                //Cart:
                init:                   init,
                open:                   openCart,
                close:                  closeCart,
                update:                 updateCart,
                populateCartAndSummary: populateCartAndSummary,
                updateCartQty:          updateCartQty,
                empty:                  emptyCart,
                ajaxUrl:                ajaxUrl,
                loadCheckout:           loadCheckout
            };

        })();

        window.quickCheckout.cart.init();

    });

}(jQuery));