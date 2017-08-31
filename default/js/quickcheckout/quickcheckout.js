/*globals jQuery, quickCheckout, dataLayer, JST, Handlebars, checkout_variant, V, newrelic, Waypoint, viewportSize, Mage, MageUrl, MageInfo, formatCurrency, inst_price_format, pca, JSON, google, AfterPay, dataForm, StoreService, userCountry*/

//This script gets loaded dynamically when quickcheckout is opened

var initAutoComplete,
    pcaUpdateCallback; //fired on successful postcodeAnywhere address change (billing address also!)

(function($) {
    "use strict";
    var $checkout           = $('#tjcheckout'),
        $checkout_tab       = $checkout.find('li[data-inputid="rg_top2"]'),
        $minicart           = $checkout.find('.minicart'),
        $minicartArticles   = $checkout.find('#minicart'),
        $giftcard_buy       = $checkout.find('.giftcard-buy'),
        $summary            = $checkout.find('.summary'),
        form_key            = $checkout.find('input[name="form_key"]').val(),
        firstLoad           = true,
        //ajax_url_config     = quickCheckout.cart.ajaxUrl('quickcheckout/checkout/initCheckout'),
        //ajax_url_customer   = quickCheckout.cart.ajaxUrl('checkout/customer/profile'),
        //ajax_cartAndSummary = quickCheckout.cart.ajaxUrl('checkout/cart/view'),
        //ajax_countries      = quickCheckout.cart.ajaxUrl('checkout/shipping/countries'),
        isQuickCheckoutPage = !!$('body.quickcheckout-index-index').length;

    /**
     * $.isValid()
     *
     * @usage $(':input').isValid() //accepts 1 or more input fields
     * @return boolean //false if any field is invalid
     *
     * Note: required fields must have class "required-entry" for old browser support
     *
     * */
    $.fn.isValid = function() {
        var valid = true,
            validationSupport =
                (typeof document.createElement("input").checkValidity === "function");
        this.each(function() {
            if (validationSupport) {
                if (!this.checkValidity()) {
                    valid = false;
                }
            } else {
                //basic old browser support:
                //invalid if not disabled & required but blank/unselected
                var $this = $(this);
                if (!$this.prop('disabled') && $this.hasClass('required-entry')) {
                    switch($this.attr('type')) {
                        case "radio":
                        case "checkbox":
                            if (!($('input[name=' + $this.attr('name') + ']')).is(":checked")) {
                                valid = false;
                            }
                            break;
                        default:
                            if (!$this.val()) {
                                valid = false;
                            }
                    }
                }
            }
            //console.log($(this).attr('name') + ' valid? ' + valid);
        });
        return valid;
    };

    $.fn.selectRange = function(start, end) {
        if(typeof end === 'undefined') {
            end = start;
        }
        return this.each(function() {
            if('selectionStart' in this) {
                this.selectionStart = start;
                this.selectionEnd = end;
            } else if(this.setSelectionRange) {
                this.setSelectionRange(start, end);
            } else if(this.createTextRange) {
                var range = this.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        });
    };

    /**
     * Checks if current methods is click and collect (both store and warehouse)
     */
    var isMethodClickCollect = function() {
        var method = quickCheckout.cartView.summary.shipping.method,
            result = false;
        if (method) {
            result = method.substring(0, 13) === "clickcollect_";
        }
        return result;
    };

    /**
     * Check if afterpay can be used:
     * - No Giftcards
     * - No Pickup
     * - No orders over afterpay max
     */
    var canPayWithAfterpay = function() {
        return !quickCheckout.cartView.summary.has_giftcard_items &&
            !isMethodClickCollect() &&
            (quickCheckout.cartView.summary.totals.grand_total.value <= quickCheckout.config.config.payment_methods.afterpay.maxprice);
    };

    Handlebars.registerHelper("round", function(options) {
        var num = options.fn(this);
        num = parseFloat(num);
        return num >= 10 ? num.toFixed(1) : num.toFixed(2);
    });
    Handlebars.registerHelper("substring", function(passedString, startString, endString) {
        var theString = passedString.substring( startString, endString );
        return new Handlebars.SafeString(theString);
    });
    Handlebars.registerHelper("increment", function(value, options) {
        return parseInt(value, 10) + 1;
    });
    Handlebars.registerHelper("math", function(lvalue, operator, rvalue, options) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue
        }[operator];
    });
    /**
     * Get Region ID by looking up region name (e.g. New South Wales) for country
     */
    Handlebars.registerHelper("getRegionIdByName", function(country, region, options) {
        var ret = "";
        var countryRegions = quickCheckout.config.countryRegions;
        if (countryRegions && countryRegions.config.regions_required.indexOf(country) !== -1) {
            //this country has selectable list of states
            for (var property in countryRegions[country]) {
                if (countryRegions[country].hasOwnProperty(property)) {
                    /**
                     * e.g. region ID 486:
                     * quickCheckout.config.countryRegions.AU[486].name = New South Wales
                     */
                    if (countryRegions[country][property].name === region) {
                        ret = property;
                    }
                }
            }
        }
        return new Handlebars.SafeString(ret);

    });
    /**
     * is region (state) a required field?
     * @param country e.g. AU
     */
    var isRegionRequired = function(country) {
        if (typeof quickCheckout !== "undefined" && typeof quickCheckout.config !== "undefined" && typeof quickCheckout.config.countryRegions !== "undefined") {
            return (quickCheckout.config.countryRegions.config.regions_required.indexOf(country) !== -1);
        } else {
            return true;
        }
    };
    Handlebars.registerHelper("regionRequired", function(country, options) {
        if (isRegionRequired(country)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });

    /**
     * Generic function to remove duplicates from an array of objects.
     * @param originalArray {array}
     * @param objKey {string} Object key to check for duplicates
     */
    function removeDuplicates(originalArray, objKey) {
        var uniqueArray = [];
        var values = [];
        var value;

        for(var i = 0; i < originalArray.length; i++) {
            value = originalArray[i][objKey];

            if(values.indexOf(value) === -1) {
                uniqueArray.push(originalArray[i]);
                values.push(value);
            }
        }
        return uniqueArray;
    }

    /**
     * Generic function to remove duplicates from a named array (js: object)
     * @param originalNamedArray {Object}
     * @param objKey {string} Object key to check for duplicates
     */
    function removeDuplicatesNamedArray(originalNamedArray, objKey) {
        var uniqueNamedArray = {};
        var values = [];
        var value;

        for (var key in originalNamedArray){
            if (originalNamedArray.hasOwnProperty(key)) {
                value = originalNamedArray[key][objKey];

                if (values.indexOf(value) === -1) {
                    //not in values, add it
                    uniqueNamedArray[key] = jQuery.extend(true, originalNamedArray[key], {});
                    values.push(value);
                }
            }
        }

        return uniqueNamedArray;
    }

    /**
     *
     * @param identity
     * @param store_code
     * @param includePostcode
     * @param includeAllMBPTracking
     * @return {Object}
     */
    var getUserTrackingCode = function(identity, store_code, includePostcode, includeAllMBPTracking) {
        var result = {};
        result.loggedin = (!!(identity !== null && identity.length)).toString(); //dataLayer booleans should be strings.
        //if logged in:
        if (identity !== null && identity.length) {

            if (identity[0].tracking) {
                var t = identity[0].tracking;
                result.hash     = t.sha256        ? t.sha256 : null; //sha256 hash of lower-cased, normalised email
                result.hash5    = t.md5           ? t.md5 : null; //md5 of lower-cased email
                result.group    = t.group_name    ? t.group_name : null; //e.g. "Bonds & Me 20%"
                result.loyalty  = t.loyalty_level ? t.loyalty_level : null; //e.g. "BONDSME"
            }

        }

        //fetch ga + mbp client ids from store for this identity
        if (StoreService.mode === "multi") {
            var matchingStore = StoreService.activeAPI.getActiveStores().filter(function (store) {
                return store.system_name === store_code;
            });
            result.gaCID = (matchingStore[0] && matchingStore[0].tracking && matchingStore[0].tracking.ga_site_client_id) ? matchingStore[0].tracking.ga_site_client_id : null;
            result.mbpCID = (matchingStore[0] && matchingStore[0].tracking && matchingStore[0].tracking.ga_mbp_client_id) ? matchingStore[0].tracking.ga_mbp_client_id : null;

            /*
            if (includeAllMBPTracking) {
                $.each(StoreService.activeAPI.getActiveStores(), function (i, store) {
                    result['gaCID_' + store.system_name] = store.tracking ? store.tracking.ga_site_client_id : null;
                });
            }
            */
        }

        if (includePostcode) {
            result.postcode = $checkout.find('#shipping\\:postcode').val();
        }
        return result;
    };

    var getProductTrackingCode = function(items) {
        var result = [];
        $.each(items, function (i, product) {
            result.push({
                name:      product.name,
                id:        product.sku.split("-").first(),
                sku:       product.sku,
                price:     product.sell_price,
                brand:     product.brand,
                category:  product.category_path,
                season:    product.season,
                range:     product.range,
                variant:   (product.options && product.options.color) ? product.options.color.value : "",
                coupon:    product.special_offer, //product coupon in GA is magento special_offer attribute
                size:      (product.options && product.options.size) ? product.options.size.value : "",
                rrp:       product.original_price,
                monogram:  (!!(product.options && product.options.jobid)).toString(), //dataLayer booleans should be strings.
                quantity:  product.quantity
            });
        });
        return result;
    };

    var getCheckoutTrackingCode = function() {
        var dataLayerArr = [];
        var storesInOrder = removeDuplicatesNamedArray(quickCheckout.cartView.items, 'store_code');
        $.each(storesInOrder, function (i, store) {

            var thisStoreIdentity = null;
            if (quickCheckout.customer) {
                thisStoreIdentity = $.map(quickCheckout.customer.identities, function (a) {
                    return (a.store_code === store.store_code ? a : null);
                });
            }

            var thisStoreItems = $.map(quickCheckout.cartView.items, function( a ) {
                return (a.store_code === store.store_code ? a : null);
            });

            /**
             * create dataLayer object for this store
             */
            var dataLayerObj = {
                user: getUserTrackingCode(thisStoreIdentity, store.store_code, false, false),
                event: "checkout",
                mbpCartMode: StoreService.mode,
                ecommerce: {
                    store: store.store_code,
                    checkout: {
                        actionField: {
                            step: 1,
                            coupon: null
                        },
                        products: getProductTrackingCode(thisStoreItems)
                    }
                }
            };

            /**
             * push into array of dataLayer objects
             */
            dataLayerArr.push(dataLayerObj);
        });

        /**
         * Add a consolidated tracking event for multibrand purchases (all products):
         */
        if (StoreService.mode === "multi") {

            var thisStoreIdentity = null;
            if (quickCheckout.customer) {
                thisStoreIdentity = $.map(quickCheckout.customer.identities, function (a) {
                    return (a.store_code === MageInfo.store_code ? a : null);
                });
            }

            var dataLayerObj = {
                user: getUserTrackingCode(thisStoreIdentity, MageInfo.store_code, false, true),
                event: "checkout",
                mbpCartMode: StoreService.mode,
                ecommerce: {
                    store: "bondsandco",
                    checkout: {
                        actionField: {
                            step: 1,
                            coupon: null
                        },
                        products: getProductTrackingCode(quickCheckout.cartView.items)
                    }
                }
            };

            /**
             * push into array of dataLayer objects
             */
            dataLayerArr.push(dataLayerObj);
        }

        return dataLayerArr;
    };

    /**
     * Build dataLayer objects for each store in order and store in cookie,
     * this will be pushed into dataLayer on success page (and cleared there)
     * @param payment_method
     */
    var getPurchaseTrackingCode = function(payment_method) {
        var dataLayerArr = [];
        var storesInOrder = removeDuplicatesNamedArray(quickCheckout.cartView.items, 'store_code');

        //Payment Method titles for GA
        var payment_method_title;
        switch(payment_method) {
            case "cybersource_soap":
                payment_method_title = "Credit Card";
                break;
            case "afterpaypayovertime":
                payment_method_title = "AfterPay";
                break;
            case "paypal_express":
                payment_method_title = "PayPal Express";
                break;
            case "free":
                payment_method_title = "No Payment Info Needed";
                break;
            case "vme":
                payment_method_title = "Visa Checkout";
                break;
            default:
                payment_method_title = payment_method;
        }

        $.each(storesInOrder, function (i, store) {

            var thisStoreIdentity = null;
            if (quickCheckout.customer) {
                thisStoreIdentity = $.map(quickCheckout.customer.identities, function (a) {
                    return (a.store_code === store.store_code ? a : null);
                });
            }

            var thisStoreItems = $.map(quickCheckout.cartView.items, function( a ) {
                return (a.store_code === store.store_code ? a : null);
            });

            var thisStoreCoupons = $.map(quickCheckout.cartView.summary.discounts, function( a ) {
                return ((a.store_code === store.store_code && a.coupon_code) ? a : null);
            });

            /**
             * create dataLayer object for this store
             */
            var dataLayerObj = {
                user: getUserTrackingCode(thisStoreIdentity, store.store_code, true, false),
                event: "purchase",
                mbpCartMode: StoreService.mode,
                ecommerce: {
                    store: store.store_code,
                    purchase: {
                        actionField: {
                            id: null, //set order number on order success
                            revenue: quickCheckout.cartView.store_totals ? quickCheckout.cartView.store_totals[store.store_code].total : quickCheckout.cartView.summary.totals.grand_total.value, //store_totals only present for MBP orders
                            tax: quickCheckout.cartView.store_totals ? quickCheckout.cartView.store_totals[store.store_code].tax : (quickCheckout.cartView.summary.totals.tax ? quickCheckout.cartView.summary.totals.tax.value : 0),
                            shipping: quickCheckout.cartView.summary.totals.shipping ? quickCheckout.cartView.summary.totals.shipping.value : 0, //send same value per store
                            discount: quickCheckout.cartView.store_totals ? quickCheckout.cartView.store_totals[store.store_code].discounts : (quickCheckout.cartView.summary.totals.discount ? quickCheckout.cartView.summary.totals.discount.value : 0),
                            option: payment_method_title,
                            coupon: thisStoreCoupons.length ? thisStoreCoupons : null,
                            delivery: {
                                addressvalidated: null,
                                shippingmethod: quickCheckout.cartView.summary.totals.shipping.title,
                                parcellocker: false,
                                parcelcollect: false
                            }
                        },
                        products: getProductTrackingCode(thisStoreItems)
                    }
                }
            };

            /**
             * push into array of dataLayer objects
             */
            dataLayerArr.push(dataLayerObj);
        });

        /**
         * Add a consolidated tracking event for multibrand purchases (all products):
         */
        if (StoreService.mode === "multi") {

            var thisStoreIdentity = null;
            if (quickCheckout.customer) {
                thisStoreIdentity = $.map(quickCheckout.customer.identities, function (a) {
                    return (a.store_code === MageInfo.store_code ? a : null);
                });
            }

            var dataLayerObj = {
                user: getUserTrackingCode(thisStoreIdentity, MageInfo.store_code, true, true),
                event: "purchase",
                mbpCartMode: StoreService.mode,
                ecommerce: {
                    store: "bondsandco",
                    purchase: {
                        actionField: {
                            id: null, //set order number on order success
                            revenue: quickCheckout.cartView.summary.totals.grand_total.value,
                            tax: quickCheckout.cartView.summary.totals.tax ? quickCheckout.cartView.summary.totals.tax.value : 0,
                            shipping: quickCheckout.cartView.summary.totals.shipping ? quickCheckout.cartView.summary.totals.shipping.value : 0,
                            discount: quickCheckout.cartView.summary.totals.discount ? quickCheckout.cartView.summary.totals.discount.value : 0,
                            option: payment_method_title,
                            coupon: null, //todo pipe separated lists of all applied coupons
                            delivery: {
                                addressvalidated: null,
                                shippingmethod: quickCheckout.cartView.summary.totals.shipping.title,
                                parcellocker: false,
                                parcelcollect: false
                            }
                        },
                        products: getProductTrackingCode(quickCheckout.cartView.items) //ALL items
                    }
                }
            };

            /**
             * push into array of dataLayer objects
             */
            dataLayerArr.push(dataLayerObj);
        }

        return dataLayerArr;
    };

    /**
     * Get Region ID by looking up region code (e.g. NSW) for country
     */
    Handlebars.registerHelper("getRegionIdByCode", function(country, region, options) {
        var ret = "";
        var countryRegions = quickCheckout.config.countryRegions;
        if (countryRegions && countryRegions.config.regions_required.indexOf(country) !== -1) {
            //this country has selectable list of states
            for (var property in countryRegions[country]) {
                if (countryRegions[country].hasOwnProperty(property)) {
                    /**
                     * e.g. region ID 486:
                     * quickCheckout.config.countryRegions.AU[486].code = NSW
                     */
                    if (countryRegions[country][property].code === region) {
                        ret = property;
                    }
                }
            }
        }
        return new Handlebars.SafeString(ret);

    });
    Handlebars.registerHelper("shippingMethodIsPickup", function(options) {
        if (isMethodClickCollect()) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    Handlebars.registerHelper("canPayWithAfterpay", function(method, options) {
        if (canPayWithAfterpay()) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    Handlebars.registerHelper("countryallowed", function(country, options) {

        var result = false,
            allowed = quickCheckout.countries;

        for (var property in allowed) {
            if (allowed.hasOwnProperty(property)) {
                if (allowed[property].value === country) {
                    result = true;
                }
            }
        }

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }

    });
    Handlebars.registerHelper("replaceSignUpPlaceholder", function(text, options) {

        var link = '<a class="signup-link" href="' + MageUrl.base + 'customer/account/create">' + quickCheckout.translate("Sign Up") + '</a>';

        return new Handlebars.SafeString(text.replace("%sign_up%", link));

    });
    Handlebars.registerHelper("getStoreBaseUrl", function(store_code, options) {

        var store = $.grep(StoreService.activeAPI.stores, function(e){ return e.system_name === store_code; });
        var result = store.length ? '//' + store[0].hostname + '/' : '';

        return new Handlebars.SafeString(result);

    });
    Handlebars.registerHelper("onlyOneEmail", function(options) {

        var result = 0;

        if (typeof quickCheckout.customer !== "undefined") {
            var unique = removeDuplicatesNamedArray(quickCheckout.customer.identities, 'email');
            result = Object.keys(unique).length;
        }

        if (result <= 1) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }

    });
    Handlebars.registerHelper("prepareProfileOptions", function(options) {

        var result = '';

        if (typeof quickCheckout.customer !== "undefined") {
            var unique = removeDuplicatesNamedArray(quickCheckout.customer.identities, 'email');

            var count = 0;
            for (var key in unique){
                if (unique.hasOwnProperty(key)) {
                    result = result + '<option value="' + key + '"' + ((count === 0) ? ' selected' : '') + '>' + unique[key].email + '</option>';
                    count++;
                }
            }

        }

        return new Handlebars.SafeString(result);

    });


    /**
     * Update grand totals (in summary and on payment buttons etc.)
     */
    var updateGrandTotals = function() {
        var grand_total = quickCheckout.cartView.summary.totals.grand_total.value;
        //update grand total fields
        $('[data-ajax-grandtotal]').attr('data-show-val', grand_total).find('span').text(formatCurrency(grand_total, inst_price_format));
    };

    /**
     * Free payment option may show or hide if order has changed
     */
    var checkIfFreePayment = function() {

        $checkout.find('.paymentoptions').addClass('hidden');

        //handle free payment (e.g. if store credit / gift cards pay for whole order)
        if (quickCheckout.cartView.summary.totals.grand_total.value === 0) {
            $checkout.find('.paymentoptions').addClass('hidden');
            $checkout.find('.freepayment').removeClass('hidden');
            $checkout.find('input[name="payment[method]"]').val('free');
        } else {
            $checkout.find('.paymentoptions').removeClass('hidden');
            $checkout.find('.freepayment').addClass('hidden');
            $checkout.find('input[name="payment[method]"]').val('cybersource_soap');
        }
        if ($('input[name="rg_checkout"]:checked').val() === "rg_checkout3") {
            //checkout with paypal, hide paymentoptions
            $checkout.find('.paymentoptions').addClass('hidden');
        }
    };

    /**
     * Paypal button hide if order total is zero
     */
    var updatePaypalButton = function() {
        var $paypal_checkout_btn    = $checkout.find('.paypal-express-checkout .paypal-logo'),
            $paypal_unavailable     = $checkout.find('.paypal-express-checkout .paypal-unavailable');

        if (quickCheckout.cartView.summary.totals.grand_total.value) {
            $paypal_checkout_btn.removeClass('hidden');
            $paypal_unavailable.addClass('hidden');
        } else {
            //show paypal not required message
            $paypal_checkout_btn.addClass('hidden');
            $paypal_unavailable.removeClass('hidden');
        }

    };

    /**
     * afterpay installments need updating if order has changed
     */
    var updateAfterpayOptions = function() {
        /** @note Requires [summary.afterpay_is_shown] **/
        var $afterpayContainer = $checkout.find('.paymentitems li[data-payment_method="afterpay"]'),
            grand_total = quickCheckout.cartView.summary.totals.grand_total.value;

        if ($afterpayContainer.length) {

            if (canPayWithAfterpay()) {
                //populate quickCheckout.afterpay object
                quickCheckout.calculateAfterpayInstallment();
                $afterpayContainer.find('.afterpay-installment-details .grand-total').html(formatCurrency(grand_total, inst_price_format));
                $afterpayContainer.find('.afterpay-installment-details .installment').html(formatCurrency(quickCheckout.afterpay.installment, inst_price_format));
                $afterpayContainer.find('.afterpay-installment-details .last-installment').html(formatCurrency(quickCheckout.afterpay.last_installment, inst_price_format));

                //hide messages relating to afterpay being unavailable
                $afterpayContainer.find('.hide-quote-has-giftcard, .hide-store-pickup, .hide-min-max-amount').addClass('hidden');

                //show afterpay form
                $afterpayContainer.find('.afterpay-installment-details').removeClass('hidden');
            } else {
                //show messages relating to afterpay being unavailable
                //default states + hide afterpay form
                $afterpayContainer.find('.hide-quote-has-giftcard, .hide-store-pickup, .hide-min-max-amount, .afterpay-installment-details').addClass('hidden');

                if (quickCheckout.cartView.summary.has_giftcard_items) {
                    //gift cards in bag, no afterpay
                    $afterpayContainer.find('.hide-quote-has-giftcard').removeClass('hidden');
                }
                if (isMethodClickCollect()) {
                    $afterpayContainer.find('.hide-store-pickup').removeClass('hidden');
                }
                if (quickCheckout.cartView.summary.totals.grand_total.value > quickCheckout.config.config.payment_methods.afterpay.maxprice) {
                    $afterpayContainer.find('.hide-min-max-amount').removeClass('hidden');
                }

            }
        }
    };

    /**
     * Update stuff in checkout if Shipping Country changed
     */
    var afterShippingCountryChange = function() {

        var country         = quickCheckout.cartView.summary.shipping.country,
            deliverToTab    = $checkout.find('li[data-inputid="rg_delivery1"]'),
            pickupTab       = $checkout.find('li[data-inputid="rg_delivery2"]');

        if (country === 'AU') {
            //Reveal AU-only elements
            $checkout.find('.aus-only').not('.delivery-estimate').removeClass('hidden');

            if (isMethodClickCollect()) {
                //METHOD IS PICKUP:
                $checkout.find('.aus-only').addClass('hidden');

                //set to "COLLECT FROM" tab
                $checkout.find('input[id="rg_delivery2"]').prop('checked', true);
                $checkout.find('li[data-inputid^="rg_delivery"]').addClass('picked').not(pickupTab.addClass('active')).removeClass('active');

                if (!$checkout.find('input[name="clickcollect_storecode"]').val()) {
                    var $pickupLocations = $checkout.find('.pickuplocations');
                    $pickupLocations.removeClass('selected').attr('data-selected-type', '').find('.expanded').removeClass('expanded');
                    $pickupLocations.find('#filter_store').focus();
                }
            } else {
                //METHOD IS DELIVERY (or just clicked pickup tab and coming from a non-AU country)

                //set to "DELIVER TO" tab
                if (!pickupTab.hasClass('active')) {
                    //quickCheckout.deliveryEstimate();
                    $checkout.find('input[id="rg_delivery1"]').prop('checked', true);
                    $checkout.find('li[data-inputid^="rg_delivery"]').addClass('picked').not(deliverToTab.addClass('active')).removeClass('active');
                }
            }

        } else {
            //Hide AU-only elements
            $checkout.find('.aus-only').addClass('hidden');

            //set to "DELIVER TO" tab
            $checkout.find('input[id="rg_delivery1"]').prop('checked', true);
            $checkout.find('li[data-inputid^="rg_delivery"]').addClass('picked').not(deliverToTab.addClass('active')).removeClass('active');
        }

        /*
         if (countryChanged) {
         $checkout.find('input[name="address_ship_picker"]').prop('checked', false);
         $checkout.find('.address.selected-ship').removeClass('selected-ship');
         $checkout.find('.pickuplocations').removeClass('selected').find('li.expanded').removeClass('expanded');
         $checkout.find('input[name="clickcollect_storecode"]').val('');
         $checkout.find('input[name="shipping_method"]').val('');
         $checkout.find('input[name^="shipping[street]"]').val('');
         $checkout.find('input[id="shipping\\:city"]').val('');
         $checkout.find('input[id="shipping\\:postcode"]').val('');
         $checkout.find('input[id="shipping\\:region"]').val('');
         $checkout.find('select[id="shipping\\:region_id"]').val('');
         }
         */

        //click the new country in postcodeAnywhere country selector
        /*
         var selected_country = $.grep(pca.countries, function(e){ return e.iso2 === country; });
         if (country.length === 1) {
         $checkout.find('.pcaitem[title="' + selected_country[0].name + '"]').first().click(); //set shipping country
         }
         */
    };

    /**
     * Update Shipping Method
     *
     * @param method {string} Shipping Method, e.g. premiumrate_FREE_Standard_Shipping
     */
    var setShippingMethod = function(method) {

        console.info('set shipping method to ' + method);

        //$checkout.addClass('isloading');
        $minicart.addClass('isloading');
        $checkout_tab.addClass('isloading');

        //was $.getJSON(quickCheckout.cart.ajaxUrl('checkout/shipping/method'), {method: method})
        StoreService.setShippingMethod(method).done(function(json) {

            //this also replaces cartView in quickCheckout
            quickCheckout.cart.populateCartAndSummary(json);

            /*if (!json.summary.shipping.method) {
                //MBP doesn't set a method.
                $.addCheckoutMessage('Debug: Shipping method not set!', 'error autodismiss');
            }*/

            if (quickCheckout.cartView.summary.shipping.country === 'AU') {
                quickCheckout.deliveryEstimate();
            }

        }).fail(function(jqxhr, textStatus, error){
            quickCheckout.displayXhrErrorMessage(jqxhr, "Error updating shipping method");
        }).always(function(){
            //$checkout.removeClass('isloading');
            $minicart.removeClass('isloading');
            $checkout_tab.removeClass('isloading');
        });

    };

    /**
     * Updates stuff in checkout.hbs so we don't have to reload the whole thing
     * This gets called every time cart and summary is populated
     */
    var reInitCheckout = function() {
        updateGrandTotals();
        checkIfFreePayment();
        updatePaypalButton();
        updateAfterpayOptions();
    };
    $.extend(quickCheckout, {reInitCheckout: reInitCheckout});

    /**
     * Update the regions select dropdown (or alternatively text input for some countries).
     * Also sets the region if new_region is provided.
     *
     * @param country {string}              Country Code, e.g. AU
     * @param regionSelect {Object}         jQuery element for state select input
     * @param regionInput {Object}          jQuery element for state text input
     * @param new_region {string|number}    Optional. Region ID or string to set.
     */
    var setRegionsForCountry = function(country, regionSelect, regionInput, new_region) {

        //console.log(["setRegionsForCountry", country, regionSelect, regionInput, new_region]);

        var countryRegions = quickCheckout.config.countryRegions;
        if (countryRegions && countryRegions.config.regions_required.indexOf(country) !== -1) {
            var opts = ['<option value="">State / Territory</option>'];
            //this country has selectable list of states
            for (var property in countryRegions[country]) {
                if (countryRegions[country].hasOwnProperty(property)) {
                    opts.push('<option value="' + property + '">' + countryRegions[country][property].name + '</option>');
                }
            }
            //populate & show state selector, hide free-form input
            regionInput.prop('required', false).removeClass('required-entry').parent().addClass('hidden');
            regionSelect.html(opts.join('')).prop('required', true).addClass('required-entry').find('option').filter(function() {
                if (new_region !== null) {
                    if (Number.isInteger(+new_region)) {
                        //int
                        return $(this).val() === new_region;
                    } else {
                        //string
                        return $(this).text() === new_region;
                    }
                }
            }).attr('selected', true);
            regionSelect.parent().removeClass('hidden');
        } else {
            //hide state selector, show free-form input
            var regionIsRequiredField = isRegionRequired(country);
            var regionInputLabel = $checkout.find("label[for='"+regionInput.attr('id')+"']");

            //console.log('region required: ', regionIsRequiredField);

            regionInput.prop('required', regionIsRequiredField).toggleClass('required-entry', regionIsRequiredField).val(new_region).parent().removeClass('hidden');
            regionInputLabel.toggleClass('required', regionIsRequiredField);
            regionSelect.prop('required', false).removeClass('required-entry').parent().addClass('hidden');
        }

        afterShippingCountryChange();

    };

    /**
     * Clears all shipping fields (delivery and pickup)
     */
    var clearShippingAddressFields = function() {
        //console.log('clearing address fields');
        //clear existing shipping address
        $checkout.find('input[name="address_ship_picker"]').prop('checked', false);
        $checkout.find('.address.selected-ship').removeClass('selected-ship');
        $checkout.find('input[name="shipping_method"]').val('');
        $checkout.find('input[name^="shipping[street]"]').val('');
        $checkout.find('input[id="shipping\\:city"]').val('');
        $checkout.find('input[id="shipping\\:postcode"]').val('');
        $checkout.find('input[id="shipping\\:region"]').val('');
        $checkout.find('select[id="shipping\\:region_id"]').val('');

        //clear selected pickup location
        $checkout.find('.pickuplocations').removeClass('selected').find('li.expanded').removeClass('expanded');
        $checkout.find('input[name="clickcollect_storecode"]').val('');

        //hide delivery estimate
        $checkout.find('.delivery-estimate').addClass('hidden');
    };

    /**
     * Update Shipping Country (and set's default shipping method for that country)
     *
     * @param code {string}             Country Code, e.g. AU
     * @param region {string|number}    Optional. Sets state after states have been populated. Region ID {int} or name {string}.
     */
    var setShippingCountry = function(code, region) {

        //console.info('set shipping country to ' + code);

        //$checkout.addClass('isloading');
        $minicart.addClass('isloading');
        $checkout_tab.addClass('isloading');

        if (quickCheckout.cartView.summary.shipping.country === code && code !== 'NZ') { //setting NZ even if already set to get potential shipping errors back
            //speed: country already set, just do region update
            console.log('country/region update not required.');
            setRegionsForCountry(code, $checkout.find('select[name="shipping[region_id]"]'), $checkout.find('input[name="shipping[region]"]'), region);
            $minicart.removeClass('isloading');
            $checkout_tab.removeClass('isloading');
            return;
        }

        //was $.getJSON(quickCheckout.cart.ajaxUrl('checkout/shipping/country'), {code: code})
        StoreService.setCountry(code).done(function(json) {

            //this also replaces cartView in quickCheckout
            quickCheckout.cart.populateCartAndSummary(json);

            setRegionsForCountry(code, $checkout.find('select[name="shipping[region_id]"]'), $checkout.find('input[name="shipping[region]"]'), region);

        }).fail(function(jqxhr, textStatus, error){
            /**
             * Could return an error related to a shipping restriction, e.g.
             * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
             * If that's the case we need to set the shipping select back to previous country.
             */
            quickCheckout.displayXhrErrorMessage(jqxhr, "Error updating shipping country");
            if (jqxhr.status === 400) {
                clearShippingAddressFields();
                $checkout.find('select[name="shipping[country_id]"]').val(quickCheckout.cartView.summary.shipping.country).trigger('change', ['']);
            }

        }).always(function(){
            //$checkout.removeClass('isloading');
            $minicart.removeClass('isloading');
            $checkout_tab.removeClass('isloading');
        });

    };

    /** RELOAD CART IF CHANGES OCCUR ON ANOTHER TAB **/
    /*
    $(window).on("blur focus", function(e) {
        var prevType    = $(this).data("prevType"),
            newValues   = $.jStorage.get("quickCheckout"),
            oldValues   = $('.count[data-ajax-grandtotal]').attr('data-show-val'),
            $toggleCart = $('.js_toggle_cart'),
            panelOpen   = $('.panel_is_open').length;

        if (prevType !== e.type) {   //prevent multiple calls
            switch (e.type) {
                case "blur":
                    if (oldValues) {
                        $.jStorage.set("quickCheckout", oldValues);
                    }
                    break;
                case "focus":
                    if ((oldValues && newValues) && (oldValues !== newValues)) {
                        if (panelOpen) {$toggleCart.click();}
                        $checkout.find('#minicart, .summary').removeClass('done');
                        //if (panelOpen) {$toggleCart.click();}
                        $.jStorage.set("quickCheckout", oldValues);
                    }
                    break;
            }
        }

        $(this).data("prevType", e.type);
    });
    */

    /**
     * Fully clear all found pickup locations. Also
     */
    var resetPickupLocations = function() {
        $checkout.find('#pickupNear').val('');
        $checkout.find('.pickuphbs').empty().removeClass('populated');
        $checkout.find('input[name="clickcollect_storecode"]').val('');
    };

    /**
     * Sets delivery to AU if not already AU.
     * @param setShippingMethodToStandard   if true and method is currently click and collect (or country not AU)
     *                                      it will get set to AU - STANDARD (most likely 'premiumrate_FREE_Standard_Shipping')
     */
    var resetDeliveryToAU = function(setShippingMethodToStandard) {

        setShippingMethodToStandard = (typeof setShippingMethodToStandard !== "undefined") ? setShippingMethodToStandard : false;

        clearShippingAddressFields();

        //set shipping back to AUS / standard methods
        if (quickCheckout.cartView.summary.shipping.country !== 'AU') {
            $checkout.find('select[name="shipping[country_id]"]').val('AU').trigger('change', ['']);
        } else if (setShippingMethodToStandard && isMethodClickCollect()) {
            setShippingMethod('STANDARD'); //sets to 'premiumrate_FREE_Standard_Shipping' or whichever method is the default
        }

    };

    var calculateAfterpayInstallment = function() {

        var grand_total = quickCheckout.cartView.summary.totals.grand_total.value;

        var installment     = grand_total / 4;
        var installment2dec = installment.toFixed(2);//installment.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
        var lastInstallment = installment2dec;

        var isEqualInstallment = ( installment2dec * 4 === grand_total );
        if(!isEqualInstallment) {
            lastInstallment = (grand_total - (installment2dec * 3)).toFixed(2);
        }

        //make available to templates
        $.extend(quickCheckout, {afterpay : {
            'installment'  : installment,
            'last_installment' : parseFloat(lastInstallment)}
        });

    };
    $.extend(quickCheckout, {calculateAfterpayInstallment: calculateAfterpayInstallment});

    var resetBilling= function() {
        //clear existing billing address
        $checkout.find('input[name="address_bill_picker"]').prop('checked', false);
        $checkout.find('.address.selected-bill').removeClass('selected-bill');
        $checkout.find('input[name^="billing[street]"]').val('');
        $checkout.find('input[id="billing\\:city"]').val('');
        $checkout.find('input[id="billing\\:postcode"]').val('');
        $checkout.find('input[id="billing\\:region"]').val('');
        $checkout.find('select[id="billing\\:region_id"]').val('');
    };
    $.extend(quickCheckout, {resetBilling: resetBilling});

    var bindEvents = function() {

        var $gci                = $checkout.find('.giftcardinput'),
            $gcimsg             = $gci.find('.msg span'),
            $login              = $checkout.find('.signininput'),
            $pickupLocations    = $checkout.find('.pickuplocations'),
            $shippingSelect     = $checkout.find('select[name="shipping[country_id]"]'),
            autoComplete_done   = false,
            pac_input           = document.getElementById('pickupNear'),
            autoComplete;

        /**
         * Build and push checkout tracking code
         */
        $.each(getCheckoutTrackingCode(), function (i, obj) {
            dataLayer.push(obj);
        });

        // Get section or article by href
        var getRelatedContent = function(el){
            return $('[data-waypoint="' + $(el).attr('href').substring(1) + '"]');
        };

        //smooth scroll to section
        $('.header-sub a').on('click', function(e){
            e.preventDefault();
            var offset = $(this).hasClass('bag') ? 86 : 42,
                scrollDivNotBody = ($('.sidecart.full-not-loaded').length || !isQuickCheckoutPage),
                $scrollContext,
                newTop;

            if (scrollDivNotBody) {
                $scrollContext = $checkout.find('.primary');
                if ($(this).attr('href').substring(1) === "payment") {
                    newTop = $scrollContext.scrollTop() + getRelatedContent(this).offset().top;
                } else {
                    newTop = $scrollContext.scrollTop() + getRelatedContent(this).position().top;
                }

            } else {
                $scrollContext = $('html,body');
                newTop = getRelatedContent(this).offset().top;
            }

            $scrollContext.animate({scrollTop:newTop - offset});

        });

        /**
         * Restore saved gift box message if entered in sidecart
         */
        (function(){
            var $giftBoxContainer = $checkout.find('.giftbox-action-container');
            if ($giftBoxContainer.length) {
                var data = $.jStorage.get("qc_gift_message");
                if (data) {
                    var arrayLength = data.length;
                    for (var i = 0; i < arrayLength; i++) {
                        $giftBoxContainer.find(':input[name="' + data[i].name + '"]').val(data[i].value);
                    }
                    //$.jStorage.deleteKey("qc_gift_message");
                }
            }
        })();

        /**
         * Update confirmation email address text
         */
        $checkout.on('change', 'select[name="identity_hash"]', function () {
            $checkout.find('.select-profile .msg strong').text( $(this).find(':selected').text() );
        });

        /*****************
         ** GEOLOCATION **
         *****************/
        var getPickupLocations = function(postcode,lat,lon) {

            //console.log('retrieving locations for postcode ' + postcode + ', lat: ' + lat + ', lon: ' + lon);

            //store postcode/lat/lon for refreshing list if products change
            $pickupLocations.data('lastParams', {postcode: postcode, lat: lat, lon: lon});

            if (!$pickupLocations.hasClass('isloading')) {
                $pickupLocations.addClass('isloading');
                $.getJSON(quickCheckout.cart.ajaxUrl('quickcheckout/checkout/locations'), {
                    postcode: postcode,
                    lat: lat,
                    lon: lon,
                    form_key: form_key
                }).done(function (locations) {

                    //sort by index (moves stores higher in list) - move to back-end for performance boost?
                    /*
                     locations.sort(function (a, b) {
                     return a.index - b.index;
                     });
                     */
                    //console.log(locations);

                    //merge delivery_methods config into locations
                    $.extend(true, locations, {pickup_methods: quickCheckout.cartView.summary.pickup_methods});

                    $pickupLocations.find('.pickuphbs').html(JST["js/quickcheckout/pickup.hbs"](locations)).addClass('populated');

                    //click the last selected ID again (e.g. after a location list refresh because of product qty changes)
                    if ($pickupLocations.data('lastSelectedId')) {
                        $pickupLocations.find('.locationlist li[data-id="' + $pickupLocations.data('lastSelectedId') + '"]').click();
                    }

                    //update match heights
                    $.fn.matchHeight._update();

                }).fail(function (jqxhr, textStatus, error) {
                    var msg = 'Error fetching locations.';
                    if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
                        msg = jqxhr.responseJSON.message;
                    }
                    $.addCheckoutMessage(msg, 'error autodismiss');
                    console.log(jqxhr);
                    if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                }).always(function () {
                    $pickupLocations.removeClass('isloading');
                });
            }
        };
        $.extend(quickCheckout, {getPickupLocations: getPickupLocations});

        var updatePickupLocations = function() {
            // #pickupNear google place was changed...
            var place = autoComplete.getPlace(),
                postcode = 3000;

            if (!place.address_components) {
                //$.addCheckoutMessage('Select a postcode or suburb from dropdown', 'error autodismiss');
                return;
            }

            for (var i = 0; i < place.address_components.length; i++) {
                if (place.address_components[i].types[0] === "postal_code") {
                    postcode = place.address_components[i].short_name;
                }
            }
            //request pickup options near this location...
            getPickupLocations(postcode, place.geometry.location.lat(), place.geometry.location.lng());
        };

        /**
         * callback function for google maps API (global):
         * @return {boolean}
         */
        initAutoComplete = function() {
            // store the original event binding function
            if (!pac_input) {
                //pickup option disabled, button is not there.
                return false;
            }

            var _addEventListener = (pac_input.addEventListener) ? pac_input.addEventListener : pac_input.attachEvent;

            function addEventListenerWrapper(type, listener) {
                // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
                // and then trigger the original listener.
                if (type === "keydown") {
                    var orig_listener = listener;
                    listener = function(event) {
                        var suggestion_selected = $(".pac-item-selected").length > 0;
                        if (event.which === 13 && !suggestion_selected) {
                            var simulated_downarrow = $.Event("keydown", {
                                keyCode: 40,
                                which: 40
                            });
                            orig_listener.apply(pac_input, [simulated_downarrow]);
                        }

                        orig_listener.apply(pac_input, [event]);
                    };
                }

                _addEventListener.apply(pac_input, [type, listener]);
            }

            pac_input.addEventListener = addEventListenerWrapper;
            pac_input.attachEvent = addEventListenerWrapper;

            // Create the autocomplete object, restricting the search to geographical
            // location types.
            var options = {
                types: ['(regions)'], //geocode
                componentRestrictions: {country: "au"}
            };
            autoComplete = new google.maps.places.Autocomplete(pac_input, options);

            // When the user selects an address from the dropdown, populate the address
            // fields in the form.
            autoComplete.addListener('place_changed', updatePickupLocations);

        };

        if (typeof google === 'object' && typeof google.maps === 'object' && typeof google.maps.places === 'object') {
            initAutoComplete();
        } else {
            /**
             * Only load google places API if not already loaded.
             * Previous key was AIzaSyB8C_qXS8Hpsbe47K6JFRWZqXo09SeFPis - not auth'd for bonds.dev
             * key below is Toby's
             * key=AIzaSyDl1WfFv3Vd31yv0mNCaH-fHhttPFHuTH8&signed_in=true&
             */
            console.log('google places library not loaded, injecting...');
            $.getScript('//maps.googleapis.com/maps/api/js?libraries=places&callback=initAutoComplete');
        }

        var getMyPostcode = function() {
            var $locationfield = $('.locationfield'),
                $postcodeInput = $locationfield.find('input'),
                defaultPlaceholder = $postcodeInput.attr('placeholder');

            if (!navigator.geolocation){
                $locationfield.addClass('unsupported');
                $postcodeInput.prop('disabled', false).attr('placeholder', defaultPlaceholder);
                $.addCheckoutMessage('Geolocation is not supported by your browser.', 'error autodismiss');
                return;
            }

            function geoSuccess(position) {

                var crd = position.coords,
                    postcode = '3000'; //default
                //console.log("YOUR LOCATION (device): Latitude: " + crd.latitude + ", Longitude: " + crd.longitude + " (±" + crd.accuracy + "m)");
                /* reverse geocode users latlong to get postcode. */
                $.getJSON('//maps.googleapis.com/maps/api/geocode/json', {
                    sensor: false,
                    latlng: crd.latitude + ',' + crd.longitude
                }).done(function(data){
                    if (data.status === "OK") {
                        var r = data.results;
                        for (var i = 0; i < r.length; i++) {
                            if ($.inArray('postal_code', r[i].types) !== -1) {
                                postcode = r[i].address_components[0].short_name;
                            }
                        }
                    }
                    getPickupLocations(postcode, crd.latitude, crd.longitude);
                }).fail(function(jqxhr, textStatus, error) {
                    console.log(jqxhr);
                    if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                }).always(function() {
                    $locationfield.removeClass('locating');
                    $postcodeInput.prop('disabled', false).attr('placeholder', defaultPlaceholder);
                    if (postcode !== '') {
                        $postcodeInput.val(postcode);
                        $locationfield.addClass('located');
                    } else {
                        $locationfield.addClass('failed');
                    }
                });

            }
            function geoError() {
                $locationfield.removeClass('locating').addClass('failed');
                $postcodeInput.prop('disabled', false).attr('placeholder', defaultPlaceholder);
            }

            $postcodeInput.prop('disabled', true).val('').attr('placeholder', 'Aligning satellites...');
            $locationfield.addClass('locating').removeClass('failed located');
            navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
        };

        /**
         * Bias the autocomplete object to the user's geographical location,
         * as supplied by the browser's 'navigator.geolocation' object.
         */
        var geolocate = function() {
            //called on focus of #pickupNear input
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var geolocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    var circle = new google.maps.Circle({
                        center: geolocation,
                        radius: position.coords.accuracy
                    });
                    autoComplete.setBounds(circle.getBounds());
                });
            }
        };

        $checkout.on('focus', '#pickupNear', function(){
            if (!autoComplete_done && typeof autoComplete === "object") {
                autoComplete_done = true;
                geolocate();
            }
        });

        /**
         * Check cart for items that are not allowed to be express shipped
         * An item cannot be expressed if it has a dispatch_time set.
         * @return {boolean}
         */
        var cartHasNonExpressItems = function() {
            var offending = $.grep(quickCheckout.cartView.items, function(e){ return typeof e.dispatch_time === "string"; });
            return !!offending.length;
        };

        var deliveryEstimate = function(postcode) {

            //console.log('delivery estimate for ' + postcode);

            var field = $checkout.find('.delivery-estimate'),
                msg,
                speed = 'standard',
                $ship_street = $checkout.find('#shipping\\:street1'),
                $bill_street = $checkout.find('#billing\\:street1'),
                $shippingSelect     = $checkout.find('select[name="shipping[country_id]"]');

            //if you select a pca item with keyboard the change event for that address field doesn't fire
            //so checking here instead
            if ($ship_street.val()) {
                $ship_street.parent().removeClass('invalid');
            }
            if ($bill_street.val()) {
                $bill_street.parent().removeClass('invalid');
            }

            postcode = $checkout.find('#shipping\\:postcode').val();

            if (quickCheckout.cartView.summary.shipping.method === "flatrate_flatrate") {
                //express shipping selected
                speed = 'express';
            }

            //No postcode or not shipping to AU
            if ((typeof postcode === "undefined") || ($.isNumeric(postcode) === false || postcode.length !== 4) || ($shippingSelect.val() !== 'AU') || (quickCheckout.cartView.summary.shipping.country !== 'AU')) {
                field.addClass('hidden');
                return;
            }

            if (field.length) {

                field.removeClass('hidden').addClass('isloading');

                $.getJSON(quickCheckout.cart.ajaxUrl('auspost/delivery/date'), {postcode: postcode}).done(function (json) {
                    //console.log(json);
                    if (json.message) {
                        $.addCheckoutMessage(json.message, 'error autodismiss');
                        field.addClass('hidden');
                        return;
                    }

                    var expressPrice = formatCurrency(quickCheckout.config.config.delivery_methods.au.flatrate_flatrate.price, inst_price_format);

                    if (speed !== 'express') {
                        //standard
                        msg = '<i class="q_van"></i> Based on these details, your order will be delivered by <wbr><strong>' + json.standard.date + '</strong>';
                        if (quickCheckout.config && quickCheckout.config.config.delivery_methods.au.flatrate_flatrate.status && !cartHasNonExpressItems()) {
                            msg = msg + ' <br>Want it sooner? <span class="add-express-ship"><a href="#">UPGRADE TO EXPRESS (' + expressPrice + ')</a></span>';
                        }
                        field.removeClass('success');
                    } else {
                        //express
                        msg = '<i class="q_scooter"></i> Based on these details, your order will be delivered by <wbr><strong>' + json.express.date + '</strong> using EXPRESS shipping';
                        msg = msg + ' <span class="remove-express-ship"><a href="#">REMOVE EXPRESS (&ndash;' + expressPrice + ')</a></span>';
                        if (json.standard === json.express) {
                            msg = msg + '<br><span class="note">Express service to ' + postcode + ' not guaranteed by AusPost.</span>';
                        }
                        field.addClass('success');
                    }

                    field.removeClass('hidden').html(msg);
                }).fail(function(jqxhr, textStatus, error) {
                    field.addClass('hidden');
                    if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
                        //$.addCheckoutMessage(jqxhr.responseJSON.message, 'error autodismiss');
                        console.log(jqxhr.responseJSON.message);
                    }
                    if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                }).always(function(){

                    field.removeClass('isloading');

                });
            }
        };
        $.extend(quickCheckout, {deliveryEstimate: deliveryEstimate});
        pcaUpdateCallback = deliveryEstimate;

        var popup = function(href) {
            var sopener;
            if (sopener && !sopener.closed) {
                sopener.focus();
            } else {
                var sw = window.open(href,"VRSN_Splash","location=yes,status=yes,resizable=yes,scrollbars=yes,width=560,height=500");
                if (sw) {
                    sw.focus();
                    sopener = sw;
                }
            }
        };
        $.extend(quickCheckout, {popup: popup});

        /**
         * Payment type changes
         */
        $checkout.on('change init', 'input[name="rg_payment"]', function (e) {
            e.preventDefault();

            // Human Triggered EE Event for Payment Method Selection
            if ((e.isTrigger === undefined || e.type === "init")) {
                dataLayer.push({
                    'event': 'checkoutOption',
                    'ecommerce': {
                        'checkout_option': {
                            'actionField': {
                                'step': 1,
                                'option': $checkout.find("label[for='"+$(this).attr('id')+"']").attr('title'),
                                'action': 'checkout_option'
                            }
                        }
                    }
                });
            }
        });

        // triger GTM event for default payment method (credit card)
        $('#rg_payment1').trigger('init');

        $checkout.on('change', 'select[name="shipping[region_id]"], select[name="billing[region_id]"]', function () {
            var $this = $(this);

            if ($this.val()) {
                $this.parent().removeClass('invalid');
            } else {
                $this.parent().addClass('invalid');
            }
        });

        //UPGRADE TO EXPRESS SHIPPING
        $checkout.on('click', '.add-express-ship a', function(e) {
            e.preventDefault();
            var $this = $(this);

            $this.css('width', $this.width()).text('PLEASE WAIT...').prop('disabled', true);

            //Update Shipping Method to Express
            setShippingMethod('EXPRESS'); //will set to 'flatrate_flatrate' or whichever rate is the express rate

            dataLayer.push({'event':'quickCheckout', 'etype':'SHIPPING METHOD', 'epayload':'express'});
        });

        //REMOVE EXPRESS SHIPPING
        $checkout.on('click', '.remove-express-ship a', function(e) {
            e.preventDefault();
            var $this = $(this),
                regionid = $checkout.find('select[name="shipping[region_id]"]').val();
            $this.css('width', $this.width()).text('PLEASE WAIT...').prop('disabled', true);

            //Update Shipping Method to Standard
            setShippingMethod('STANDARD'); //sets method to 'premiumrate_FREE_Standard_Shipping' or whichever is default

            dataLayer.push({'event':'quickCheckout', 'etype':'SHIPPING METHOD', 'epayload':'standard'});
        });

        /*****************
         ** GIFT CARDS ***
         *****************/

        var giftCardAlways = function() {
            $gci.removeClass('isloading');
            //reset inputs
            $gci.find('.msg').removeClass('success').find('span').html('Enter your <span class="mbp-multi-hide">gift card or </span>promo code');
            //re-enable inputs
            $gci.find(':input').prop('disabled', false);
            //select and focus on giftcard input
            $checkout.find('input[name="giftcard_num"]').selectRange(0,19).focus();
        };

        /**
         * Apply Coupon Code / Promo Code
         * @param {string} code
         */
        var applyCoupon = function(code) {

            //was $.getJSON(quickCheckout.cart.ajaxUrl('checkout/coupon/add'), {code: code})
            StoreService.addCoupon(code).done(function (json) {

                quickCheckout.cart.populateCartAndSummary(json);

                $.clearCheckoutMessage('.coupon-code');
                $.addCheckoutMessage('<i class="q_checkmark"></i> Promo code <strong>' + code + '</strong> applied to order', 'success autodismiss coupon-code');

            }).fail(function (jqxhr, textStatus, error) {
                var msg = 'Error applying promo code.';

                //403 means coupon failed to add but this was also removing valid coupons, so we need to repopulate cart and notify user
                if (jqxhr.status === 403 && jqxhr.responseJSON) {
                    msg = 'Invalid promo code.';
                    quickCheckout.cart.populateCartAndSummary(jqxhr.responseJSON);
                } else if (jqxhr.status === 400 && jqxhr.responseText) {
                    msg = jqxhr.responseText;
                }
                $.clearCheckoutMessage('.coupon-code');
                $.addCheckoutMessage(msg, 'error autodismiss coupon-code');

            }).always(giftCardAlways);

        };

        /**
         * @param number Gift card no.
         * @param pin    Optional.
         */
        var applyGiftcard = function(number, pin) {

            /*
            $shippingSelect.prop('disabled', true).parent().addClass('will-load');
            $grand_total.not('.amount').addClass('will-load');
            $paypal_checkout_btn.addClass('isloading');
            */

            $.getJSON(quickCheckout.cart.ajaxUrl('checkout/giftcard/add'), {number: number, pin: pin}, function (json) {

                /**
                 * json.summary.giftcardaccount {array}
                 *
                 * number
                 * total
                 * applied
                 * expiry
                 */

                quickCheckout.cart.populateCartAndSummary(json);

                $gci.find('input').val('');

                //get card that was just applied
                var appliedCard = $.grep(json.summary.giftcardaccount, function(e){ return e.number === number; });
                var amt = appliedCard.length ? formatCurrency(appliedCard[0].total, inst_price_format) : '';

                $.addCheckoutMessage('<i class="q_checkmark"></i> ' + amt + ' Gift card applied to order.', 'success autodismiss');

                //this is the card that was just applied...
                $checkout.find('.giftcards [data-cardno="' + number + '"]').parent().addClass('attention');
                giftCardAlways();

            }).fail(function (jqxhr, textStatus, error) {
                //gc failed, if no pin try again as promo code...
                if (!pin) {
                    applyCoupon(number);
                    return;
                }

                var msg = 'Wrong gift card or zero balance on card.';
                /*
                //commenting this out because it's getting errors with links to popups for which content doesn't exist here
                if (jqxhr.status === 400 && jqxhr.responseText) {
                    msg = jqxhr.responseText;
                }
                */
                $.addCheckoutMessage(msg, 'error autodismiss');
                giftCardAlways();
            });

        };

        /**
         * @param number Gift card no.
         */
        var removeGiftCard = function(number) {

            $checkout_tab.addClass('isloading');

            $.getJSON(quickCheckout.cart.ajaxUrl('checkout/giftcard/remove'), {number: number}, function (json) {

                quickCheckout.cart.populateCartAndSummary(json);

                $.clearCheckoutMessage('.gift-card');
                $.addCheckoutMessage('Gift card removed from order.', 'success autodismiss gift-card');

            }).fail(function (jqxhr, textStatus, error) {
                var msg = 'Error removing gift card.';
                if (jqxhr.status === 400 && jqxhr.responseText) {
                    msg = jqxhr.responseText;
                }
                $.clearCheckoutMessage('.gift-card');
                $.addCheckoutMessage(msg, 'error autodismiss gift-card');
            }).always(function(){
                $checkout_tab.removeClass('isloading');
            });

        };

        /**
         * applyCouponOrGiftcard
         *
         * @param params object {coupon_add: [coupon_add], card_pin: [card_pin], card_type: "giftcards"|"cartrules"}
         *
         */
        var applyCouponOrGiftcard = function(params) {
            switch (params.card_type) {
                case "giftcards" :
                    if (StoreService && StoreService.mode !== "multi") {
                        applyGiftcard(params.coupon_add, params.card_pin);
                    } else {
                        //multi mode - gift card not allowed
                        console.log('Attempting to enter gift card in multi mode');
                    }
                    break;
                case "cartrules" :
                    applyCoupon(params.coupon_add);
            }
        };

        var applyStoreCredit = function(apply) {

            $checkout.find('.msg-cust-bal').addClass('isloading');

            $summary.removeClass('done');

            //$checkout.addClass('isloading');
            $minicart.addClass('isloading');
            $checkout_tab.addClass('isloading');

            $.getJSON(quickCheckout.cart.ajaxUrl('checkout/credit/' + (apply ? 'add' : 'remove'))).done(function(json) {

                //this also replaces cartView in quickCheckout
                quickCheckout.cart.populateCartAndSummary(json);

            }).fail(function(jqxhr, textStatus, error){
                quickCheckout.displayXhrErrorMessage(jqxhr, 'Could not ' + (apply ? 'apply' : 'remove') + ' store credit.');
            }).always(function(){
                //$checkout.removeClass('isloading');
                $minicart.removeClass('isloading');
                $checkout_tab.removeClass('isloading');
            });
        };

        $checkout.on('change', '#entercode', function () {
            $gci.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
                //after css transition ends:
                $gci.find('input[name="giftcard_num"]').focus();
            });

            dataLayer.push({'event':'quickCheckout', 'etype':'PROMO/COUPON CODE'});
        });

        $gci.on('input keyup', 'input[name="giftcard_num"]', function () {

            var $this = $(this);
            if ($this.val().length === 19) {
                $gci.addClass('pin');
                $gci.find('input[name="giftcard_pin"]').prop('disabled', false).prop('tabindex', 0);
            } else {
                $gci.removeClass('pin');
                $gci.find('input[name="giftcard_pin"]').prop('disabled', true).prop('tabindex', -1);
            }
        });

        //on Enter key press (code or pin)
        $gci.on('keydown', 'input', function (e) {
            if (e.keyCode === 13) {
                // enter key was pressed
                e.preventDefault();
                $gci.find('button').click();
            }
        });

        $gci.on('change', 'input[name="giftcard_num"]', function (e) {
            var $this       = $(this),
                re          = new RegExp($this.attr('pattern')),
                str         = $this.val(),
                m           = re.exec(str),
                $card_pin   = $gci.find('input[name="giftcard_pin"]');

            if (m !== null) {
                if (m.index === re.lastIndex) {
                    re.lastIndex++;
                }
                if (m && (m[1] || m[2]) && StoreService.mode === "multi") {
                    $gci.removeClass('pin');
                    $gcimsg.text('Payment via gift cards for BONDS & CO. orders is not yet available');
                } else if (m && m[1]) {
                    $gcimsg.text('This gift card requires a 4 digit PIN');
                    $gci.addClass('pin');
                    $card_pin.prop('required', true);
                    $this.attr('data-card-type', 'giftcards');
                } else if (m && m[2]) {
                    $this.parent().removeClass('invalid').addClass('valid');
                    $gcimsg.text('Click add to apply gift card'); //Magento - No PIN
                    $gci.removeClass('pin');
                    $card_pin.prop('required', false);
                    $this.attr('data-card-type', 'giftcards');
                } else if (m && m[3]) {
                    $this.parent().removeClass('invalid').addClass('valid');
                    $gcimsg.text('Click add to apply promo code'); //Promo code
                    $gci.removeClass('pin');
                    $card_pin.prop('required', false);
                    $this.attr('data-card-type', 'cartrules');
                }
            } else {
                $gcimsg.text('Please enter a valid code');
                $this.parent().addClass('invalid');
            }

            if (typeof e.originalEvent === "undefined" && m) {
                //triggered by click
                var coupon_add  = $this.val(),
                    card_pin    = $card_pin.val(),
                    card_type   = $this.attr('data-card-type');

                if ($gci.find('input').isValid()) {
                    $this.prop('disabled', true).parent().removeClass('invalid').addClass('valid');
                    $gci.addClass('isloading').find('.msg').removeClass('success').find('span').text('Verifying code details...');

                    if (StoreService.mode === "single") {
                        applyCouponOrGiftcard({coupon_add: coupon_add, card_pin: card_pin, card_type: card_type});
                    } else {
                        applyCoupon(coupon_add);
                    }

                } else {
                    $this.prop('disabled', false).parent().removeClass('valid').addClass('invalid');
                    var msg = '';
                    if (!$gci.find('input[name="giftcard_num"]').isValid()) {
                        msg = 'Please enter a valid code';
                    }
                    if ($gci.hasClass('pin') && !$card_pin.isValid()) {
                        if (msg !== '') {
                            msg += ' and PIN';
                        } else {
                            msg = 'This gift card requires a 4 digit PIN';
                        }
                    }
                    if (msg) {
                        $gcimsg.text(msg);
                    }
                }
            }

        });

        $gci.on('change', 'input[name="giftcard_pin"]', function (e) {
            if (e.target.validity.valid) {
                if ($gci.find('input').isValid()) {
                    $gcimsg.text('Click add to apply gift card');
                }
            } else {
                $gcimsg.text('This gift card requires a 4 digit PIN');
            }
        });

        $gci.on('click', 'button', function (e) {
            e.preventDefault();
            $gci.find('input[name="giftcard_num"]').trigger('change');
        });

        //GIFTCARD REMOVE
        $checkout.on('click', '.giftcards a', function(e) {
            e.preventDefault();
            var $this = $(this),
                cardno = $this.data('cardno');
            $summary.removeClass('done');

            removeGiftCard(cardno);

        });

        //APPLY STORE CREDIT
        $checkout.on('change', 'input[name="payment[use_customer_balance]"]', function() {
            var $this = $(this),
                use_customer_balance = $this.is(':checked');

            $this.val(use_customer_balance ? 1 : 0);

            applyStoreCredit($this.val());
        });

        //STORE CREDIT / CUSTOMER BALANCE REMOVE
        $checkout.on('click', '.storecredit a', function(e) {

            e.preventDefault();
            $checkout.find('input[name="payment[use_customer_balance]"]').prop('checked', false);

            applyStoreCredit(0);

        });

        //LOGIN
        $login.on('click', '.btn.login', function (e) {
            e.preventDefault();

            var $this = $(this),
                $username = $login.find('input[name="login[username]"]'),
                username = $username.val(),
                $password = $login.find('input[name="login[password]"]'),
                password = $password.val(),
                $msg = $login.find('.msg.login span'),
                default_msg = $msg.html(),
                guestItems = (typeof quickCheckout.cartView !== "undefined" && quickCheckout.cartView.summary.item_count) ? quickCheckout.cartView.summary.item_count : 0;

            if ($login.find('.fields input').isValid()) {
                $this.prop('disabled', true);
                $username.parent().removeClass('invalid').addClass('valid');
                $password.parent().removeClass('invalid').addClass('valid');
                $login.addClass('isloading');
                $msg.text('Verifying login details...');

                $.ajax({url: quickCheckout.cart.ajaxUrl('quickcheckout/checkout/customerLogin'), method: "POST", dataType: "json", data: {login: {username: username, password: password}, form_key: form_key}}).done(function (json) {

                    //store merge cart message in cookie for display after log in
                    var mergeCartMsg = guestItems ? '<br><strong>' + guestItems + ((guestItems !== 1) ? ' items' : ' item') + '</strong> added as a guest have been moved to Your Bag' : '';
                    $.cookie('qc_merge_cart_msg', mergeCartMsg);

                    //have to reload because otherwise we get invalid form key errors
                    $msg.text('Logged in, please wait...');
                    window.location.reload();

                    //LOAD CART AGAIN
                    /*
                     var $minicartArticles = $('#minicart').removeClass('done');
                     if (form_key && !minicart.hasClass('done')) {
                     $minicartArticles.addClass('done');
                     //was $.getJSON(ajax_cartAndSummary)
                     StoreService.getCart().done(function (json) {
                     $minicartArticles.html(json.content);
                     //console.log(json);
                     }).fail(function(jqxhr, textStatus, error) {
                     var msg = 'Error fetching bag!';
                     if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
                     msg = jqxhr.responseJSON.message;
                     }
                     $.addCheckoutMessage(msg, 'error autodismiss');
                     $minicartArticles.removeClass('done');
                     if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}
                     }).always(function() {
                     $('.minicart').removeClass('isloading');
                     });
                     }

                     //re init checkout tab
                     $checkout.find('li[data-inputid="rg_top2"]').removeClass('done').addClass('isloading');
                     quickCheckout.loadFullCheckout(true); //causes invalid form key

                     $('body').addClass('customer-logged-in');
                     $('.header_utilities_sign_in').text('Your Account');
                     var mergeCartMsg = guestItems ? '<br><strong>' + guestItems + ((guestItems !== 1) ? ' items' : ' item') + '</strong> added as a guest have been moved to Your Bag' : '';
                     $.addCheckoutMessage('Welcome back ' + json.customer.firstname + '!' + mergeCartMsg, 'success autodismiss');

                     */

                }).fail(function (jqxhr, textStatus, error) {

                    quickCheckout.displayXhrErrorMessage(jqxhr, 'Error, sign in failed.');
                    if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}

                    $this.prop('disabled', false);
                    $login.removeClass('isloading');
                    $msg.html(default_msg);

                }).always(function () {
                    /*
                    $this.prop('disabled', false);
                    $login.removeClass('isloading');
                    $msg.html(default_msg);
                     */
                });

            } else {
                $this.prop('disabled', false);
                if (!$username.isValid()) {
                    $username.parent().removeClass('valid').addClass('invalid');
                }
                if (!password.length) {
                    $password.parent().removeClass('valid').addClass('invalid');
                }
                $msg.html(default_msg);
            }
        });

        //LOGIN - FORGOT PASSWORD
        $login.on('click', '.btn.reset', function(){

            var $email = $login.find('#reset_email'),
                email = $email.val(),
                $msg = $login.find('.msg.forgot span'),
                default_msg = $msg.html();

            $login.addClass('isloading');

            $.ajax({url: quickCheckout.cart.ajaxUrl('quickcheckout/checkout/forgotPassword'), method: "POST", dataType: "json", data: {email: email, form_key: form_key}}).done(function (json) {

                if (json.success) {
                    $.addCheckoutMessage('We have sent a new password to your email address.', 'success autodismiss');
                    //copy email back to login form for convenience
                    $login.find('input[name="login[username]"]').val(email).parent().removeClass('invalid');
                    $login.find('#forgot').prop('checked', false);
                } else {
                    $msg.html('Please enter a registered email address.');
                    $email.parent().addClass('invalid');
                }

            }).fail(function (jqxhr, textStatus, error) {

                $.addCheckoutMessage('Password reset failed.', 'error autodismiss');

            }).always(function () {
                $login.removeClass('isloading');
                $msg.html(default_msg);
            });

        });

        //LOGIN copy guest email back to sign in field (if valid)
        $checkout.on('change', 'input[name="guest_email"]', function(){
            var $this = $(this),
                $username = $login.find('input[name="login[username]"]');
            if ($username.val() === "" && $this.isValid()) {
                $username.val($this.val());
                //TODO save/update email on order via ajax
            }
        });

        //LOGIN - POPULATE FORGOTTEN PASSWORD FIELD
        $login.on('change', '#forgot', function(){
            $login.find('input[name="reset_email"]').val($login.find('input[name="login[username]"]').val());
        });

        //LOGIN ON ENTER KEY PRESS
        $login.on('keydown', function(e) {
            if (e.keyCode === 13) {
                // enter key was pressed
                e.preventDefault();

                if (e.target.id === 'reset_email') {
                    $login.find('.btn.reset').click();
                } else {
                    $login.find('.btn.login').click();
                }
            }
        });

        //PASSWORD FLIP
        $login.on('click', '.reveal', function(){
            var $this = $(this),
                fld = $this.parent().find('input').toggleClass('flip');
            if (fld.hasClass('flip')) {
                fld.attr('type', 'text');
            } else {
                fld.attr('type', 'password');
            }
            fld.focus();
        });

        //FOCUS CLASS
        $checkout.on('focus blur', '.creditcardinput input', function(e){
            if (e.type === 'focusin') {
                $(this).parent().addClass('focus');
            } else {
                $(this).parent().removeClass('focus');
            }
        });

        //GENERIC INPUT VALIDATION CLASSES
        $checkout.on('change', 'input[type="email"], input[type="text"], input[type="tel"]', function(){
            var $this = $(this),
                val = $this.val(),
                valid = $this.isValid(),
                fld = $this.parent(),
                req = $this.is('required');

            if (req) {
                // append msg to required fields if left empty
                var r = '[required]',
                    p = $this.attr('placeholder'),
                    l = val.length;
                if (p && !l) {
                    $(this).attr('placeholder', (p===r) ? p : r); //replace
                }
            }

            if (val) {
                fld.addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
            } else if (req) {
                fld.removeClass('valid').addClass('invalid');
            }
        });

        //MODAL - Parcel Locker
        $checkout.on('click', '.parcel-locker-more', function(e){
            e.preventDefault();
            $checkout.find('.parcel-locker-modal').parent().remove();

            var msg = quickCheckout.translate("For this delivery option, you must first <a>create an Australia Post MyPost account</a>.").replace('<a>', '<a class="discreet" href="https://id.auspost.com.au/csso/login/popupEntry/register" target="_blank">') +
                quickCheckout.translate("A Parcel Locker is perfect for when you won't be at home/work to receive a parcel.") +
                quickCheckout.translate("Find out more <a>here</a>.").replace('<a>', '<a class="discreet" href="https://auspost.com.au/lockers.html#main" target="_blank">');

            $.addCheckoutMessage('<div class="modal-title parcel-locker-modal"><i class="q_locker"></i> AusPost Parcel Lockers</div>' +
                '<div class="modal-content">' + msg +'</div>', 'modal', false);
        });

        //MODAL - Sign Up (Create Account)
        $checkout.on('click', '.signup-link', function(e){
            var href = '#register-form-validate';
            var $signup_form = $(href);
            if (!$signup_form.length) {
                //form not present, follow link to /customer/account/create
                return;
            }
            e.preventDefault();

            if ($.fn.colorbox) {
                $.colorbox({
                    title: "Sign Up",
                    inline: true,
                    href: href,
                    width: "550px",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    className: "colorbox-register-form"
                });
            } else {
                //no colorbox library, redirect
                window.location.href = $(this).attr('href');
            }

        });

        /**
         * Catch submit register click and send to quickcheckout controller
         * see app/design/frontend/pacbrands/default/template/customer/form/registerform.phtml
         */
        $('body').on('click', '#register-form-validate button[type="submit"]', function(e){
            e.preventDefault();

            var $register = $('.colorbox-register-form #register-form-validate'),
                isValid = false,
                $this = $(this);

            if (typeof dataForm !== "undefined"){
                isValid = dataForm.validator.validate();
            }

            if (!isValid) {
                return;
            }

            //loading state
            $this.prop('disabled', true);
            $('.colorbox-register-form  #cboxContent').addClass('will-load isloading');

            var registerValues = {
                'firstname'     : $register.find('input[name="firstname"]').val(),
                'lastname'      : $register.find('input[name="lastname"]').val(),
                'email'         : $register.find('input[name="email"]').val(),
                'password'      : $register.find('input[name="password"]').val(),
                'gender'        : $register.find('select[name="gender"] :selected').val(),
                'dob'           : $register.find('input[name="dob"]').val(),
                'is_subscribed' : $register.find('input[name="is_subscribed"]').is(':checked')
            };

            $.ajax({
                url: quickCheckout.cart.ajaxUrl('quickcheckout/checkout/customerRegister'),
                method: "POST",
                dataType: "json",
                data: {'register': registerValues, 'form_key': form_key}
            }).done(function () {
                //success
                $.colorbox.close();
                $.cookie('qc_sign_up', 1);
                $.addCheckoutMessage('Sign up successful, please wait...', 'success', true);
                location.reload();
            }).fail(function (jqxhr) {
                var msg;
                if (typeof jqxhr.responseJSON !== 'undefined'){
                    msg = jqxhr.responseJSON.message;
                } else {
                    msg = jqxhr.responseText;
                }
                //can't use $.addCheckoutMessage as it's under colorbox:
                $('<div class="msg error" role="alert"></div>').html(msg).prependTo('#cboxContent').delay(3000).fadeOut();
            }).always(function(){
                $('.colorbox-register-form  #cboxContent').removeClass('isloading');
                $this.prop('disabled', false);
            });
        });

        $pickupLocations.on('keydown', '#pickupNear', function (e) {
            if (e.keyCode === 13) {
                // enter key was pressed, prevent form submitting
                e.preventDefault();
            }
        });

        $pickupLocations.on('click', '#nearMe', function () {
            getMyPostcode();
        });

        //Copy first/last name & telephone to duplicate fields
        $checkout.on('change', 'input[name="shipping[firstname]"], input[name="shipping[lastname]"], input[name="shipping[telephone]"]', function(){
            var $this = $(this);
            $checkout.find('input[name="' + $this.attr('name') + '"]').val($this.val());
        });

        //CHANGE PICKUP FILTERS
        $pickupLocations.on('change', '.filters input', function(){
            var $this = $(this),
                $divs = false,
                checked = $this.is(':checked'),
                showStores = $pickupLocations.find('input[name="filter_store"]').is(':checked'),
                hideUnavailStores = $pickupLocations.find('input[name="filter_store_disabled"]').is(':checked'),
                stores = $pickupLocations.find('li.store');

            if ($this.attr('name') === 'filter_locker')  {$divs = $pickupLocations.find('.shadow .locker-only, li.locker');}
            if ($this.attr('name') === 'filter_store')   {$divs = $pickupLocations.find('li.store, .store-only');}
            if ($this.attr('name') === 'filter_auspost') {$divs = $pickupLocations.find('li.auspost');}

            if (checked && $divs) {
                $divs.not('.store-only-phone').removeClass('off');
            } else {
                $divs.addClass('off').removeClass('expanded');
            }
            if ($pickupLocations.find('.filters input:checked').length === 0) {
                //don't allow zero selection
                $pickupLocations.find('.filters input').prop('checked', true);
                $pickupLocations.find('.locationlist > li').removeClass('off');
                if ($pickupLocations.find('#filter_locker').length) {
                    $pickupLocations.find('.locker-only').not('.locker-only-phone').removeClass('off');
                }
                if ($pickupLocations.find('#filter_store').length) {
                    $pickupLocations.find('.store-only').not('.locker-only-phone').removeClass('off');
                }
            }

            if (showStores && hideUnavailStores) {
                stores.removeClass('off').filter('.unavailable').addClass('off');
            } else if (showStores && !hideUnavailStores) {
                stores.removeClass('off');
            } else if (!showStores) {
                stores.addClass('off');
            }
        });

        //Hide disabled/out-of-stock stores
        $pickupLocations.on('change', 'input[name="filter_store_disabled"]', function(){
            if ($(this).is(':checked')) {
                $pickupLocations.find('li.store.unavailable').addClass('off');
            } else {
                $pickupLocations.find('li.store.unavailable').removeClass('off');
            }
        });

        /**
         * Expand a pickup location, and click "collect here" if it's available.
         */
        $pickupLocations.on('click', '.locationlist > li', function(e){
            var $this = $(this),
                isButton = $(e.target).hasClass('btn');

            if($this.hasClass('expanded')) {
                //item is already expanded.
                return;
            }

            if (!isButton && !$pickupLocations.hasClass('selected')) {
                e.preventDefault();
                $pickupLocations.find('.locationlist > li').not($this).removeClass('expanded');
                $this.toggleClass('expanded');
                if (!$this.hasClass('unavailable')) {
                    $this.find('.primarybtn').prop('disabled', false).click(); //immediate selection
                }
            } else {
                $summary.removeClass('done');

                if (typeof $this.data('shipping') !== "undefined") {
                    setShippingMethod($this.data('shipping'));
                }
            }

        });

        $pickupLocations.on('keyup', '.locationlist > li', function(e){
            if ( e.keyCode === 13 || e.keyCode === 32 ) { // 13 = enter key, 32 = space
                $(this).click();
                e.preventDefault();
            }
        });

        //SET PICKUP LOCATION
        $pickupLocations.on('click', '.primarybtn', function(){
            var $this = $(this),
                $pl = $pickupLocations.addClass('selected'),
                $type = $this.closest('li.expanded'),
                shipping_method = $this.attr('data-method') ? $this.attr('data-method') : 'STANDARD', //STANDARD == premiumrate_FREE_Standard_Shipping in most cases
                regionId = $type.find('#pickup\\:region_id').val(),
                region = $type.find('#pickup\\:region').val(),
                $shipping_street_3 = $checkout.find('#shipping\\:street3');

            $pickupLocations.find('.locationlist').removeClass('error');

            if ($type.hasClass('locker')) {
                $pl.attr('data-selected-type', 'locker');
                $checkout.find('input[name="clickcollect_storecode"]').val('');
                $pickupLocations.find('.store-only').addClass('off');
                $pickupLocations.find('#shipping\\:telephone').prop('required', false);
                $pickupLocations.find('.locker-only.shadowup').removeClass('off');
                $pickupLocations.find('#mobilephone').prop('required', true);
            } else if ($type.hasClass('auspost')) {
                $pl.attr('data-selected-type', 'auspost');
                $checkout.find('input[name="clickcollect_storecode"]').val('');
                $pickupLocations.find('.store-only').addClass('off');
                $pickupLocations.find('#shipping\\:telephone').prop('required', false);
                $pickupLocations.find('.locker-only.shadowup').addClass('off');
                $pickupLocations.find('#mobilephone').prop('required', false);
            } else if ($type.hasClass('store')) {
                $pl.attr('data-selected-type', 'store');
                $checkout.find('input[name="clickcollect_storecode"]').val($type.attr('data-id'));
                $checkout.find('input[name="shipping_method"]').val($type.attr('data-shipping'));
                $pickupLocations.find('.store-only').removeClass('off');
                $pickupLocations.find('#shipping\\:telephone').prop('required', true);
                $pickupLocations.find('.locker-only.shadowup').addClass('off');
                $pickupLocations.find('#mobilephone').prop('required', false);
            }

            //$checkout.find('input[name="billing[use_for_shipping]"]').prop('checked', true);
            $checkout.find('#shipping\\:street1').val($type.find('#pickup\\:street1').val());
            $checkout.find('#shipping\\:street2').val($type.find('#pickup\\:street2').val());
            $shipping_street_3.val($type.find('#pickup\\:street3').val());
            $checkout.find('#shipping\\:city').val($type.find('#pickup\\:city').val());
            $checkout.find('#shipping\\:postcode').val($type.find('#pickup\\:postcode').val()).change(); //trigger delivery estimate

            if ($shipping_street_3.val()) {
                $shipping_street_3.parent().removeClass('hidden');
            } else {
                $shipping_street_3.parent().addClass('hidden');
            }

            if (regionId) {
                $checkout.find('select[name="shipping[region_id]"]').val(regionId);
            } else {
                $checkout.find('input[name="shipping[region]"]').val(region);
            }

            //country is already AU (set when switching to pickup tab)
            //setShippingCountry('AU', (regionId ? regionId : region));

            //Update Shipping Method to $this.attr('data-method') (if set) or 'STANDARD' (if not already set)
            if (quickCheckout.cartView.summary.shipping.method !== shipping_method) {
                setShippingMethod(shipping_method);
            }

            //if logged in: uncheck any chosen 'ship to' address
            $checkout.find('input[name="address_ship_picker"]').prop('checked', false).parent().removeClass('selected-ship');
            //and click 'add new address'
            $checkout.find('input[name="newaddress"]').prop('checked', true);

        });

        //CHANGE PICKUP LOCATION
        $pickupLocations.on('click', '.changelocation', function(e){
            e.preventDefault();

            //hide phone fields and make not required
            $pickupLocations.find('.store-only, .locker-only.shadowup').addClass('off');
            $pickupLocations.find('#shipping\\:telephone, #mobilephone').prop('required', false);

            $pickupLocations.removeClass('selected').attr('data-selected-type', '').find('.expanded').removeClass('expanded');
            $pickupLocations.find('#filter_store').focus();

            //clear last address
            $checkout.find('input[name="clickcollect_storecode"]').val('');
            $checkout.find('#shipping\\:street1').val('');
            $checkout.find('#shipping\\:street2').val('');
            $checkout.find('#shipping\\:street3').val('');
            $checkout.find('#shipping\\:city').val('');
            $checkout.find('#shipping\\:postcode').val('');
            $checkout.find('#shipping\\:region').val('');
            $checkout.find('#shipping\\:region_id').val('');
        });

        //POSTCODEANYWHERE Address search/validation
        (function() {
            var magentoFields = [
                {
                    //Company: "shipping:company",
                    Line1: "shipping:street1",
                    Line2: "shipping:street2",
                    City: "shipping:city",
                    State: "shipping:region",
                    StateSelect: "shipping:region_id",
                    Postcode: "shipping:postcode",
                    CountrySelect: "shipping:country_id"
                },
                {
                    //Company: "billing:company",
                    Line1: "billing:street1",
                    Line2: "billing:street2",
                    City: "billing:city",
                    State: "billing:region",
                    StateSelect: "billing:region_id",
                    Postcode: "billing:postcode",
                    CountrySelect: "billing:country_id"
                }
            ];

            function load() {

                function createAddressControl(addressFields) {
                    var countryField = pca.getElement(addressFields.CountrySelect),
                        magentoCountries = [];

                    for (var c = 0; c < countryField.options.length; c++) {
                        magentoCountries.push(countryField.options[c].value);
                    }

                    var fields = [
                            //{ element: addressFields.Company, field: "Company", mode: pca.fieldMode.DEFAULT | pca.fieldMode.PRESERVE },
                            { element: addressFields.Line1, field: "Line1" },
                            { element: addressFields.Line2, field: "Line2", mode: pca.fieldMode.POPULATE },
                            { element: addressFields.City, field: "City", mode: pca.fieldMode.POPULATE },
                            { element: addressFields.State, field: "ProvinceName", mode: pca.fieldMode.POPULATE },
                            { element: addressFields.StateSelect, field: "ProvinceName", mode: pca.fieldMode.POPULATE },
                            { element: addressFields.Postcode, field: "PostalCode", mode: pca.fieldMode.POPULATE },
                            { element: addressFields.CountrySelect, field: "CountryIso2", mode: pca.fieldMode.COUNTRY }
                        ],
                        options = {
                            key: quickCheckout.config.settings.key,
                            suppressAutocomplete: false,
                            countries: {
                                codesList: magentoCountries.join(","),
                                valueType: pca.countryNameType.ISO2
                            },
                            source: "magento",
                            bar: {
                                showLogo: false
                            }
                        },
                        control = new pca.Address(fields, options);

                    //perform IP country lookup if required
                    if (quickCheckout.config.settings.countryByIP) {
                        control.setCountryByIP();
                    }

                }

                for (var i = 0; i < magentoFields.length; i++) {
                    if (pca.getElement(magentoFields[i].Line1) && quickCheckout.config.settings) {
                        createAddressControl(magentoFields[i]);
                    }
                }

                //move pca so it scrolls with checkout tab...ugly
                //$('body > .pca').addClass('parentpca').prependTo($checkout.find('.pca-here'));

                //set Saved Address for default ship/bill on load (if logged in...)
                //otherwise init regions for selected country
                var bill_countryid = $checkout.find('select[name="billing[country_id]"]'),
                    default_bill = $checkout.find('.setaddress.bill[data-default-bill]'),
                    default_ship = $checkout.find('.setaddress.ship[data-default-ship]');

                if (!default_bill.length && bill_countryid.val() !== 'AU') {
                    setRegionsForCountry(bill_countryid.val(), $checkout.find('select[name="billing[region_id]"]'), $checkout.find('input[name="billing[region]"]'), null);
                }

                if (!default_ship.length) {
                    setRegionsForCountry($shippingSelect.val(), $checkout.find('select[name="shipping[region_id]"]'), $checkout.find('input[name="shipping[region]"]'), null);
                }

            }

            pca.fuzzyMatch = false;
            pca.ready(load);

        })();

        //TURN OFF AUTOCOMPLETE ON FOCUS (because postcodeAnywere suppressAutocomplete is false)
        $checkout.on('focus blur', '#shipping\\:street1, #billing\\:street1', function(e){
            if (e.type === 'focusin') {
                $(this).prop('autocomplete','off');
            } else {
                $(this).prop('autocomplete','on');
            }
        });

        //CLEAR ADDRESS FIELDS WHEN CLICKING ADD NEW ADDRESS
        $checkout.on('change', '#newaddress', function() {
            clearShippingAddressFields();
            dataLayer.push({'event':'quickCheckout', 'etype':'NEW SHIPPING ADDRESS'});
        });
        $checkout.on('change', '#newaddress_bill', function() {
            quickCheckout.resetBilling();
            dataLayer.push({'event':'quickCheckout', 'etype':'NEW BILLING ADDRESS'});
        });

        //GET DELIVERY ESTIMATE ON POSTCODE CHANGE
        $checkout.on('change', '#shipping\\:postcode', function(){
            deliveryEstimate($(this).val());
        });

        //COUNTRY CHANGE - UPDATE REGIONS(STATES) - SHIPPING
        $checkout.on('change', 'select[name="shipping[country_id]"]', function(e, new_region){

            //console.log('shipping dropdown change');

            new_region = (typeof new_region !== "undefined") ? new_region : null;

            setShippingCountry($(this).val(), new_region);

        });

        //COUNTRY CHANGE - UPDATE REGIONS(STATES) - BILLING
        $checkout.on('change', 'select[id="billing\\:country_id"]', function(e, new_region){

            var regionSelect = $checkout.find('select[name="billing[region_id]"]'),
                regionInput = $checkout.find('input[name="billing[region]"]');

            new_region = (typeof new_region !== "undefined") ? new_region : '';

            setRegionsForCountry($(this).val(), regionSelect, regionInput, new_region);

        });

        //SET SAVED SHIPPING ADDRESS (FROM LOGGED IN SAVED ADDRESSES)
        $checkout.on('click touch', '.setaddress.ship', function(e) {
            var $this = $(this),
                $p = $this.parent(),
                loader = $checkout.find('.left-side'),
                $ship_address = $p.find('#' + $this.attr('for')), //input
                ship_address_id = $ship_address.val(),
                bill_address_id = $checkout.find('input[name="address_bill_picker"]:checked').val();

            dataLayer.push({'event':'quickCheckout', 'etype':'STORED SHIPPING ADDRESS'});

            if (loader.hasClass('isloading')) {
                e.preventDefault();
            } else {
                $ship_address.prop('checked', true);
                $checkout.find('.address').removeClass('selected-ship');
                $p.addClass('selected-ship');

                $checkout.find('input[name="billing[use_for_shipping]"]').prop('checked', (ship_address_id === bill_address_id));

                //copy saved address to shipping fields
                $checkout.find('#shipping\\:firstname').val($p.find('.firstname').text());
                $checkout.find('#shipping\\:lastname').val($p.find('.lastname').text());
                $checkout.find('#shipping\\:street1').val($p.find('.street1').text()).parent().removeClass('invalid').addClass('valid');
                $checkout.find('#shipping\\:street2').val($p.find('.street2').text());
                $checkout.find('#shipping\\:street3').val($p.find('.street3').text());
                $checkout.find('#shipping\\:city').val($p.find('.city').text());
                $checkout.find('#shipping\\:postcode').val($p.find('.postcode').text()).change(); //trigger delivery estimate

                $checkout.find('.addresses').removeClass('invalid');

                var country     = $p.find('.country_id').text(),
                    new_region  = $p.find('.region_id').text() ? $p.find('.region_id').text() : $p.find('.region').text();

                //console.log('$shippingSelect', country);
                $shippingSelect.val(country).trigger('change', [new_region]);
            }
        });

        //SET SAVED BILLING ADDRESS
        $checkout.on('click touch', '.setaddress.bill', function(e) {
            var $this = $(this), //label
                $p = $this.parent(), //.address
                loader = $checkout.find('.left-side'),
                ship_address_id = $checkout.find('input[name="address_ship_picker"]:checked').val(),
                $bill_address = $p.find('#' + $this.attr('for')), //input
                bill_address_id = $bill_address.val();

            dataLayer.push({'event':'quickCheckout', 'etype':'STORED BILLING ADDRESS'});

            $bill_address.prop('checked', true);
            $checkout.find('.address').removeClass('selected-bill');
            $p.addClass('selected-bill');

            //copy saved address to billing fields
            $checkout.find('#billing\\:street1').val($p.find('.street1').text()).parent().removeClass('invalid').addClass('valid');
            $checkout.find('#billing\\:street2').val($p.find('.street2').text());
            $checkout.find('#billing\\:street3').val($p.find('.street3').text());
            $checkout.find('#billing\\:city').val($p.find('.city').text());
            $checkout.find('#billing\\:postcode').val($p.find('.postcode').text());
            //hide region_id + clear value, show region + populate value
            $checkout.find('#billing\\:country_id').val($p.find('.country_id').text()).trigger('change', [$p.find('.region').text()]);

            //on first load (not click)
            if (typeof e.originalEvent !== "undefined") {
                //fake load for user feedback
                $checkout.find('input[name="billing[use_for_shipping]"]').prop('checked', (ship_address_id === bill_address_id));
                loader.addClass('isloading');
                setTimeout(function () {
                    loader.removeClass('isloading');
                }, 300);
            }

            $('input[id^="billing"], #billing\\:region_id').each(function() {
                if (!$(this).val() && $(this).attr('id')!=="billing:street2") {
                    console.warn($(this).attr('id'), 'EMPTY');
                }
            });
        });

        //Move postcodeanywhere autocompleter
        $checkout.on('focus', 'input[id="shipping\\:street1"]', function() {
            //$('.pcaautocomplete').removeClass('bill');
            //$checkout.find('.parentpca').insertAfter($checkout.find('.pca-ship'));
            $checkout.find('.parentpca .pcaautocomplete').css('marginTop', (
                    $checkout.find('.address-fields > .msg:first-child').outerHeight() +
                    $checkout.find('.address-fields .firstlast').height() +
                    $checkout.find('.address-fields .field:first-of-type').height()
                )
            );
        });
        $checkout.on('focus', 'input[id="billing\\:street1"]', function() {
            //$('.pcaautocomplete').addClass('bill');
            //$checkout.find('.parentpca').insertAfter($checkout.find('.pca-bill'));
            //get height of all fields between pca-here and billing address 1:
            $checkout.find('.parentpca .pcaautocomplete').css('marginTop', (
                    $checkout.find('.pca-here').height() +
                    $checkout.find('.different-billing').outerHeight() +
                    $checkout.find('.billing-fields > div:nth(0)').height() +
                    $checkout.find('.billing-fields > div:nth(1)').height()
                )
            );
        });

        /**
         * CREDIT CARDS
         * stripe/jquery.payment credit card validation:
         */
        $checkout.find('.cc-exp').payment('formatCardExpiry');
        $checkout.find('.cc-cvc').payment('formatCardCVC');
        $checkout.find('.cc-num').payment('formatCardNumber');

        function toggleCardType(cardType) {
            var $label = $checkout.find('label[for="rg_payment1"]');

            if ($label.attr('class') === cardType) {
                return;
            }

            $.each($.payment.cards, function(i){
                var ct = $.payment.cards[i].type;
                if (ct === cardType) {
                    $label.addClass(ct);
                } else {
                    $label.removeClass(ct);
                }
            });
        }

        function enableSubmitButton() {
            var cardNum  = $checkout.find('input[name="card_num"]').val().replace(/\s/g, ''),
                cardType = $.payment.cardType(cardNum),
                cardExpiry = $checkout.find('input[name="card_exp"]').payment('cardExpiryVal'),
                cardCVC = $checkout.find('input[name="card_cvc"]').val(),
                $submitBtn = $checkout.find('#submit-order');

            if ($.payment.validateCardNumber(cardNum) && $.payment.validateCardExpiry(cardExpiry.month, cardExpiry.year) && $.payment.validateCardCVC(cardCVC, cardType)) {
                $submitBtn.addClass('valid');
            } else {
                $submitBtn.removeClass('valid');
            }
        }

        //CC NUMBER
        $checkout.on({
            'change' : function() {
                var $this = $(this),
                    valid = $.payment.validateCardNumber($this.val()),
                    $cvc,
                    $p = $this.parent(),
                    cardType = $.payment.cardType($this.val());
                toggleCardType(cardType);
                $p.addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
                if (valid) {
                    //re-validate cvv in case card type changed
                    $cvc = $p.parent().find('.cc-cvc');
                    if ($cvc.val()) {
                        var validCVC = $.payment.validateCardCVC($cvc.val(), cardType);
                        $cvc.parent().addClass((validCVC ? 'valid' : 'invalid')).removeClass((!validCVC ? 'valid' : 'invalid'));
                    }
                }
            },
            'input' : function() {
                var $this = $(this),
                    valid = $.payment.validateCardNumber($this.val()),
                    l = $this.val().length,
                    $p = $this.parent(),
                    cardType = $.payment.cardType($this.val());
                toggleCardType(cardType);
                if (valid && l > 16) { //there are 13 digit visa cards (16 w/ spaces) e.g. 4222 2222 2222 2. Hold off until more digits are in.
                    //jump to next field
                    $p.removeClass('invalid').addClass('valid').next().find('input').first().focus();
                } else {
                    //wait until input is complete...
                    if (((cardType === "visa" || cardType === 'mastercard') && l === 19) || (cardType === 'amex' && l === 17)) {
                        //maxlength reached for this card type - it's wrong.
                        //TODO change l comparisons to highest length value in $.payment.cards array for this card type
                        $p.addClass('invalid').removeClass('valid');
                    }
                }
                enableSubmitButton();
            }
        }, '.cc-num');

        var ccKeyDown = function(e) {
            //move to previous field on backspace (set caret at end)
            if ((e.which === 8 || e.which === 46) && $(this).val() === '') {
                $(this).parent().prev().find('input').selectRange(99).focus();
                return false; //prevent deleting last character of prev. field
            }
        };

        //CC EXPIRY
        $checkout.on({
            'input' : function() {
                var $this = $(this),
                    l = $this.val().length,
                    valid = $.payment.validateCardExpiry($this.payment('cardExpiryVal'));
                $this.parent().removeClass((!valid ? 'valid' : 'invalid'));
                if (l === 7 && valid) {
                    $this.parent().next().find('input').focus();
                }
                enableSubmitButton();
            },
            'change' : function() {
                var $this = $(this);
                var valid = $.payment.validateCardExpiry($this.payment('cardExpiryVal'));
                $this.parent().addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
            },
            'keydown' : ccKeyDown
        }, '.cc-exp');

        //CC CVC
        $checkout.on({
            'input' : function() {
                var type = $.payment.cardType($(this).parent().parent().parent().find('.cc-num').val());

                //need to improve this - sets maxlength for valid cvc for detected card type
                var card, _i, _len;
                for (_i = 0, _len = $.payment.cards.length; _i < _len; _i++) {
                    card = $.payment.cards[_i];
                    if (card.type === type) {
                        $(this).attr('maxlength', card.cvcLength[card.cvcLength.length-1]);
                    }
                }
                enableSubmitButton();
            },
            'change' : function() {
                var $this = $(this);
                var valid = $.payment.validateCardCVC($this.val(), $.payment.cardType($this.parent().parent().find('.cc-num').val()));
                $this.parent().addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
            },
            'keydown' : ccKeyDown
        }, '.cc-cvc');

        $checkout.on('change', '#billing\\:use_for_shipping_yes', function(){
            var same_billing = $checkout.find('input[name="billing[use_for_shipping]"]').is(':checked');
            //unset saved bill address
            $checkout.find('input[name="address_bill_picker"]').prop('checked', false);
            $checkout.find('.address').removeClass('selected-bill');

            if (!same_billing) {
                $checkout.find('.selected-ship .setaddress.bill').click();
            }

            $.fn.matchHeight._update();
        });

        //SUBMIT ORDER
        $checkout.on('click visavalidate', '.submit-order', function(e) {
            e.preventDefault();

            dataLayer.push({'event':'quickCheckout', 'etype':'SUBMIT ORDER'});

            //clear old validation messages
            $.clearCheckoutMessage('.order-validation');

            //$('input[id^="shipping"]').each(function() {console.log($(this).attr('id'), $(this).val());});
            //$('input[id^="billing"]').each(function() {console.log($(this).attr('id'), $(this).val());});

            var $this = $(this),
                payment_method  = $this.data('paymentMethod'),
                member          = quickCheckout.customer,
                guestEmail      = $checkout.find('input[name="guest_email"]'),
                firstname       = $checkout.find('input[name="shipping[firstname]"]'),
                lastname        = $checkout.find('input[name="shipping[lastname]"]'),
                $mobilephone    = $pickupLocations.find('input[name="mobilephone"]'), //used for parcel collect
                $telephone      = $pickupLocations.find('input[name="shipping[telephone]"]'); //used for click+collect

            if (quickCheckout.cartView.summary.totals.grand_total.value === 0) {
                //gift cards or store credit has covered cost of order
                payment_method = "free";
            }

            //not checking out with PAYPAL or VISA/EXPRESS:
            if ($checkout.find('input[name="rg_checkout"]:checked').prop('id') === 'rg_checkout1' || member) {

                //Guest:
                if (e.type !== "visavalidate" && !member) {
                    //validate email address
                    if (!guestEmail.isValid()) {
                        guestEmail.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Please enter a valid email address.', 'error autodismiss order-validation');
                        return false;
                    }

                    //validate first name
                    if (!firstname.isValid()) {
                        firstname.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Please enter your first name.', 'error autodismiss order-validation');
                        return false;
                    }

                    //validate last name
                    if (!lastname.isValid()) {
                        lastname.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Please enter your last name.', 'error autodismiss order-validation');
                        return false;
                    }
                }

                //VALIDATE DELIVERY/PICKUP
                if ($checkout.find('input[name="rg_delivery"]:checked').val() === "delivery") {
                    //DELIVERY:
                    //validate delivery address

                    var providing_new_ship_address      = $checkout.find('input[name="newaddress"]').is(':checked'),
                        providing_new_bill_address      = $checkout.find('input[name="newaddress_bill"]').is(':checked'),
                        has_saved_ship_addresses        = $checkout.find('input[name="address_ship_picker"]').length,
                        has_saved_bill_addresses        = $checkout.find('input[name="address_bill_picker"]').length,
                        has_selected_saved_ship_address = $checkout.find('input[name="address_ship_picker"]:checked').length,
                        has_selected_saved_bill_address = $checkout.find('input[name="address_bill_picker"]:checked').length,
                        same_billing                    = $checkout.find('input[name="billing[use_for_shipping]"]').is(':checked');

                    var shipping_region_select  = $checkout.find('select[name="shipping[region_id]"]'),
                        shipping_region_input   = $checkout.find('input[name="shipping[region]"]'),
                        shipping_region         = (!shipping_region_select.parent().hasClass('hidden')) ? shipping_region_select : shipping_region_input,
                        billing_region_select   = $checkout.find('select[name="billing[region_id]"]'),
                        billing_region_input    = $checkout.find('input[name="billing[region]"]'),
                        billing_region          = (!billing_region_select.parent().hasClass('hidden')) ? billing_region_select : billing_region_input;

                    /**
                     * Copy Region ID text to region field for MBP
                     */
                    if (!shipping_region_select.parent().hasClass('hidden')) {
                        //using select, not input. Copy text of selected region to the input
                        shipping_region_input.val(shipping_region_select.find(':selected').text());
                    }
                    if (!billing_region_select.parent().hasClass('hidden')) {
                        //using select, not input. Copy text of selected region to the input
                        billing_region_input.val(billing_region_select.find(':selected').text());
                    }

                    if (quickCheckout.customer && !providing_new_ship_address && has_saved_ship_addresses && !has_selected_saved_ship_address) {
                        //logged in, has saved SHIPPING addresses but none selected
                        $checkout.find('.addresses-ship').addClass('invalid');
                        $.addCheckoutMessage('Please choose a "SHIP TO" address or add a new address.', 'error autodismiss order-validation');
                        return false;
                    }
                    if (quickCheckout.customer && !same_billing && !providing_new_bill_address && (has_saved_bill_addresses && !has_selected_saved_bill_address)) {

                        console.log("same_billing", same_billing);
                        console.log("providing_new_bill_address", providing_new_bill_address);
                        console.log("has_saved_bill_addresses", has_saved_bill_addresses);
                        console.log("has_selected_saved_bill_address", has_selected_saved_bill_address);


                        //logged in, has saved BILLING addresses but none selected
                        $checkout.find('.addresses-bill').addClass('invalid');
                        $.addCheckoutMessage('Please choose a "BILL TO" address or add a new address.', 'error autodismiss order-validation');
                        return false;
                    }

                    if ((quickCheckout.customer && providing_new_bill_address) ||
                        (quickCheckout.customer && providing_new_ship_address) ||
                        (quickCheckout.customer && !has_saved_ship_addresses) ||
                        (quickCheckout.customer && !same_billing && !providing_new_bill_address && !has_selected_saved_bill_address) ||
                        (!quickCheckout.customer)
                    ) {
                        //logged in, not using saved address OR logged out. check fields are filled
                        var shipping_firstname      = $checkout.find('#shipping\\:firstname').prop('required', true),
                            shipping_lastname       = $checkout.find('#shipping\\:lastname').prop('required', true),
                            shipping_country        = $checkout.find('#shipping\\:country_id').prop('required', true),
                            shipping_street         = $checkout.find('#shipping\\:street1').prop('required', true),
                            shipping_city           = $checkout.find('#shipping\\:city').prop('required', true),
                            shipping_postcode       = $checkout.find('#shipping\\:postcode').prop('required', true);

                        var fields = [
                            {field: shipping_firstname, errMsg: 'Please enter your first name.'},
                            {field: shipping_lastname,  errMsg: 'Please enter your last name.'},
                            {field: shipping_country,   errMsg: 'Please select a delivery country.'},
                            {field: shipping_street,    errMsg: 'Please enter a delivery address.'},
                            {field: shipping_city,      errMsg: 'Please enter a delivery suburb.'},
                            {field: shipping_postcode,  errMsg: 'Please enter a delivery postcode.'}
                        ];

                        //some countries don't require region:
                        shipping_region.prop('required', isRegionRequired(shipping_country.val()));
                        if (shipping_region.prop('required')) {
                            fields.push({
                                field: shipping_region,
                                errMsg: 'Please select a delivery state or territory.'
                            });
                        }

                        if (!same_billing) {
                            //validate billing address
                            var billing_firstname       = $checkout.find('#billing\\:firstname').prop('required', true),
                                billing_lastname        = $checkout.find('#billing\\:lastname').prop('required', true),
                                billing_street          = $checkout.find('#billing\\:street1').prop('required', true),
                                billing_city            = $checkout.find('#billing\\:city').prop('required', true),
                                billing_postcode        = $checkout.find('#billing\\:postcode').prop('required', true),
                                billing_country         = $checkout.find('#billing\\:country_id').prop('required', true);

                            fields.push(
                                {field: billing_firstname,  errMsg: 'Please enter a billing first name.'},
                                {field: billing_lastname,   errMsg: 'Please enter a billing last name.'},
                                {field: billing_country,    errMsg: 'Please select a billing country.'},
                                {field: billing_street,     errMsg: 'Please enter a billing address.'},
                                {field: billing_city,       errMsg: 'Please enter a billing suburb.'},
                                {field: billing_postcode,   errMsg: 'Please enter a billing postcode.'}
                            );

                            //some countries don't require region:
                            billing_region.prop('required', isRegionRequired(billing_country.val()));
                            if (shipping_region.prop('required')) {
                                fields.push({
                                    field: billing_region,
                                    errMsg: 'Please select a billing state or territory.'
                                });
                            }

                        } else {
                            // copy the shipping to the billing if they are the same (-;
                            // this is just for afterpay that ignores the "use shipping for billing" value
                            $checkout.find('#billing\\:firstname').val(shipping_firstname.val());
                            $checkout.find('#billing\\:lastname').val(shipping_lastname.val());
                            $checkout.find('#billing\\:street1').val(shipping_street.val());
                            $checkout.find('#billing\\:city').val(shipping_city.val());
                            $checkout.find('#billing\\:postcode').val(shipping_postcode.val());
                            $checkout.find('#billing\\:country_id').val(shipping_country.val());
                            $checkout.find('select[name="billing[region_id]"]').val(shipping_region_select.val());
                            $checkout.find('input[name="billing[region]"]').val(shipping_region_input.val());
                        }
                        //loop through and validate required fields
                        var fieldsLength = fields.length;
                        for (var i = 0; i < fieldsLength; i++) {
                            var f = fields[i];
                            if (!f.field.val()) {
                                $.addCheckoutMessage(f.errMsg, 'error autodismiss order-validation');
                                f.field.change();
                                return false;
                            }
                        }

                    }
                } else {
                    //PICKUP:
                    //validate a pickup address is selected
                    if ($pickupLocations.length && !$pickupLocations.find('.pickuphbs').hasClass('populated')) {
                        $.addCheckoutMessage('Please search for and select a location to collect from.', 'error autodismiss order-validation');
                        $pickupLocations.find('#pickupNear').focus();
                        return false;
                    }
                    if ($pickupLocations.length && !$pickupLocations.hasClass('selected')) {
                        $pickupLocations.find('.locationlist').addClass('error');
                        $.addCheckoutMessage('Please select a location to collect from.', 'error autodismiss order-validation');
                        return false;
                    }
                    //validate mobile phone number (required for parcel locker)
                    if ($pickupLocations.filter('.selected').find('.locker.expanded').length && !$mobilephone.isValid()) {
                        $mobilephone.change();
                        $.addCheckoutMessage('Mobile phone is required for Parcel Locker collection.', 'error autodismiss order-validation');
                        return false;
                    }
                    //validate mobile phone number (required for Click & Collect)
                    if ($pickupLocations.filter('.selected').find('.store.expanded').length && !$telephone.isValid()) {
                        $telephone.change();
                        $.addCheckoutMessage('Phone number is required for Store collection.', 'error autodismiss order-validation');
                        return false;
                    }
                }

            }

            if (e.type !== "visavalidate") {
                //set payment method
                $checkout.find('input[name="payment[method]"]').val(payment_method);

                if (payment_method === "cybersource_soap") {
                    //credit card payment...
                    var $cardNum = $checkout.find('input[name="card_num"]'),
                        cardNum = $cardNum.val().replace(/\s/g, ''),
                        cardType = $.payment.cardType(cardNum),
                        $cardExpiry = $checkout.find('input[name="card_exp"]'),
                        cardExpiry = $cardExpiry.payment('cardExpiryVal'), //=> {month: X, year: XXXX}
                        $cardCVC = $checkout.find('input[name="card_cvc"]'),
                        cardCVC = $cardCVC.val();

                    if (!$.payment.validateCardNumber(cardNum)) {
                        $cardNum.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Invalid credit card number.', 'error autodismiss order-validation');
                        return false;
                    }
                    if (!$.payment.validateCardExpiry(cardExpiry.month, cardExpiry.year)) {
                        $cardExpiry.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Invalid credit card expiry.', 'error autodismiss order-validation');
                        return false;
                    }
                    if (!$.payment.validateCardCVC(cardCVC, cardType)) {
                        $cardCVC.focus().parent().addClass('invalid');
                        $.addCheckoutMessage('Invalid credit card CVC.', 'error autodismiss order-validation');
                        return false;
                    }

                    //strip spaces etc. and store credit card details in hidden fields
                    $checkout.find('input[name="payment[cc_number]"]').val(cardNum);
                    $checkout.find('input[name="payment[cc_last4]"]').val(cardNum.slice(-5));

                    switch (cardType) {
                        case 'visa':
                            cardType = "VI";
                            break;
                        case 'mastercard':
                            cardType = "MC";
                            break;
                        case 'amex':
                            cardType = "AE";
                            break;
                    }
                    $checkout.find('input[name="payment[cc_type]"]').val(cardType);
                    $checkout.find('input[name="payment[cc_exp_month]"]').val(cardExpiry.month);
                    $checkout.find('input[name="payment[cc_exp_year]"]').val(cardExpiry.year);
                    $checkout.find('input[name="payment[cc_cid]"]').val(cardCVC);
                }

                /**
                 * Strip out fields not required for checkout
                 */
                var form_data = $checkout.find(':input').not('select[name="product"], input[name^="pickup"], input[name^="prodQty"], input[name^="rg_"], input[name^="login["], input[name="reset_email"], input[name^="filter_"], input[name="giftcard_num"]').serialize();
                /**
                 * Append duplicates of first and last name for broken back end.
                 */
                form_data = form_data + "&firstname=" + $checkout.find('input[name="shipping[firstname]"]').val() + "&lastname=" + $checkout.find('input[name="shipping[lastname]"]').val();
                // afterpay, modelled after :  afterpay-magento/src/main/php/js/Afterpay/checkout/idev_onestep.js
                // as atm idev_onestep.js was the best available working example of how this works
                if (payment_method === 'afterpaypayovertime' && window.Afterpay.paymentAction === 'authorize_capture') {
                    $this.prop('disabled', true);
                    $checkout.addClass('isloading');

                    var request = new Ajax.Request(
                        window.Afterpay.saveUrl,
                        {
                            method: 'post',
                            parameters: form_data,
                            onSuccess: function (transport) {
                                var response = {};

                                // Parse the response - lifted from original method
                                try {
                                    if (typeof window.JSON !== "undefined") {
                                        response = JSON.parse(transport.responseText);
                                    } else {
                                        //resort to afterpay's eval way
                                        response = eval('(' + transport.responseText + ')');
                                    }
                                }
                                catch (e) {
                                    response = {};
                                }

                                // if the order has been successfully placed
                                if (response.success) {

                                    //modified to suit API V1
                                    if( window.afterpayReturnUrl === false ) {
                                        AfterPay.init();
                                    }
                                    else {
                                        AfterPay.init({
                                            relativeCallbackURL: window.afterpayReturnUrl
                                        });
                                    }

                                    switch (window.Afterpay.redirectMode) {
                                        case 'lightbox':
                                            AfterPay.display({
                                                token: response.token
                                            });

                                            break;

                                        case 'redirect':
                                            AfterPay.redirect({
                                                token: response.token
                                            });

                                            break;
                                    }
                                } else {
                                    this.isSuccess = false;
                                    /**
                                     * afterpay submit failed. could be address verification or similar.
                                     * There is a `redirect` url returned but we don't want that, just show the error message
                                     */
                                    $.addCheckoutMessage(response.message, 'error');
                                    $this.prop('disabled', false);
                                    $checkout.removeClass('isloading');
                                }

                            }.bind(this),
                            onFailure: function () {
                                $.addCheckoutMessage('AfterPay Gateway is not available.', 'error');
                            }
                        }
                    );
                    return true;
                }

                if (!$checkout.hasClass('isloading')) {
                    $this.prop('disabled', true);
                    $checkout.addClass('isloading');

                    $.addCheckoutMessage('Please wait...', 'success autodismiss order-submit');

                    StoreService.checkout(form_data).done(function (json) {

                        console.log('%cStoreService.checkout json:', 'color: orange');
                        console.log(json);

                        var msg = (payment_method === "paypal_express") ? 'Proceeding to PayPal for payment. Please wait...' : 'Order submitted! Please wait...';

                        $.clearCheckoutMessage('.order-submit');
                        $.addCheckoutMessage(msg, 'success autodismiss');

                        /**
                         * Build purchase event dataLayer object for passing to success page
                         * @see magento/skin/frontend/pacbrands/default/js/mbp/success.js
                         */
                        $.jStorage.set("qc_payment_dls", getPurchaseTrackingCode(payment_method));

                        if (json.data && json.data.url && json.data.params) {
                            //mbp cybersource success, build a form and submit (to get params to success page via post)

                            var tempForm = $('<form/>').attr('action', json.data.url).attr('method', 'POST');

                            $.each(json.data.params, function (index, value){
                                console.log(value);
                                tempForm.append($('<input>', {
                                    'name': value.name,
                                    'value': value.value,
                                    'type': 'hidden'
                                }));
                            });

                            console.log('------- TEMP FORM VALUES: -------');
                            console.log(tempForm.serializeArray());

                            //have to append to body otherwise old IE doesn't work
                            tempForm.appendTo('body').submit().remove();

                        } else if (json.redirect) {
                            //redirect exists in JSON response, go there
                            window.location.replace(json.redirect);
                        } else if (json.data && json.data.url) {
                            //MBP PayPal redirect url:
                            window.location.replace(json.data.url);
                        } else {
                            $.clearCheckoutMessage('.order-submit');
                            $.addCheckoutMessage('Order submitted but nowhere to go', 'autodismiss');
                        }

                    }).fail(function (jqxhr, textStatus, error) {
                        quickCheckout.displayXhrErrorMessage(jqxhr, 'Order submissions failed.');

                        $checkout.removeClass('isloading');
                        if (typeof newrelic !== 'undefined') {newrelic.noticeError(error);}

                    }).always(function () {
                        $this.prop('disabled', false);

                    });
                }
            }

        });

        /**
         * Waypoints for highlighting scrolled to item
         */
        var $scrollContext = (($('.sidecart.full-not-loaded').length || !isQuickCheckoutPage) ? $checkout.find('.primary')[0] : window);
        var waypoint_bag = new Waypoint({
            element: $('[data-waypoint="bag"]')[0],
            handler: function() {
                $('.header-sub a').not($('.header-sub .bag').addClass('active')).removeClass('active');
                if (viewportSize.getWidth() < 960) {
                    dataLayer.push({'event':'quickCheckout', 'etype':'QUICKLINK SHOPPING BAG'});
                }
            },
            offset:  '84px',
            context: $scrollContext
        });
        var waypoint_deliveryDown = new Waypoint({
            element: $('[data-waypoint="delivery"]')[0],
            handler: function(direction) {
                if (direction === "down") {
                    $('.header-sub a').not($('.header-sub .delivery').addClass('active')).removeClass('active');

                    dataLayer.push({'event':'quickCheckout', 'etype':'QUICKLINK DELIVERY'});
                }
            },
            offset: '42px',
            context: $scrollContext
        });
        var waypoint_deliveryUp = new Waypoint({
            element: $('[data-waypoint="delivery"]')[0],
            handler: function(direction) {
                if (direction === "up") {
                    $('.header-sub a').not($('.header-sub .delivery').addClass('active')).removeClass('active');
                    dataLayer.push({'event':'quickCheckout', 'etype':'QUICKLINK DELIVERY'});
                }
            },
            offset: '0',
            context: $scrollContext
        });
        var waypoint_payment = new Waypoint({
            element: $('[data-waypoint="payment"]')[0],
            handler: function() {
                //if (viewportSize.getWidth() < 960) {
                $('.header-sub a').not($('.header-sub .payment').addClass('active')).removeClass('active');
                dataLayer.push({'event':'quickCheckout', 'etype':'QUICKLINK PAYMENT'});
                //}
            },
            offset: '42px',
            context: $scrollContext
        });

        //CHANGE TABS
        $checkout.on('change', 'input[name^=rg_]', function(){
            var $this = $(this),
                id = $this.attr("id"),
                x = $('li[data-inputid=' + id + ']').addClass('active'),
                shipping_method = $checkout.find('input[name="shipping_method"]').val(),
                checkout_method = $checkout.find('input[name="rg_checkout"]:checked').val();

            var etype,
                epayload;

            switch(id) {
                case 'rg_checkout1':
                    etype = 'CHECKOUT METHOD';
                    epayload = 'guest';
                    break;
                case 'rg_checkout4':
                    etype = 'CHECKOUT METHOD';
                    epayload = 'member';
                    break;
                case 'rg_checkout3':
                    etype = 'CHECKOUT METHOD';
                    epayload = 'paypal';
                    break;
                case 'rg_delivery1':
                    etype = 'DELIVERY METHOD';
                    epayload = 'deliver';
                    break;
                case 'rg_delivery2':
                    etype = 'DELIVERY METHOD';
                    epayload = 'collect';
                    break;
                case 'rg_payment1':
                    etype = 'PAYMENT METHOD';
                    epayload = 'credit card';
                    break;
                case 'rg_payment2':
                    etype = 'PAYMENT METHOD';
                    epayload = 'paypal';
                    break;
                case 'rg_payment3':
                    etype = 'PAYMENT METHOD';
                    epayload = 'visaCheckout';
                    break;
                case 'rg_payment4':
                    etype = 'PAYMENT METHOD';
                    epayload = 'afterpay';
                    break;
            }

            if (etype && epayload) {
                dataLayer.push({'event': 'quickCheckout', 'etype': etype, 'epayload': epayload});
            }

            //reset delivery if changing delivery tabs
            //"AS GUEST"
            if (id === "rg_delivery1") {
                resetDeliveryToAU(true);
            }
            //"COLLECT FROM"
            if (id === "rg_delivery2") {
                resetDeliveryToAU(true);
            }

            if (id.substring(0, 11) === "rg_checkout") {
                //hide "how do you want to pay" and .paymentoptions if checking out with paypal/visa checkout
                if (id === 'rg_checkout1') {
                    //"as guest"
                    $checkout.find('.how-want-pay, .paymentoptions').removeClass('hidden');
                    $checkout.find('li[data-inputid="rg_checkout1"] .required-entry').prop('required', true);
                } else if (id === 'rg_checkout4') {
                    //"as member"
                    $checkout.find('.how-want-pay').removeClass('hidden');
                    $checkout.find('.paymentoptions').addClass('hidden');
                    $checkout.find('li[data-inputid="rg_checkout1"] .required-entry').prop('required', false);
                } else {
                    //"paypal checkout" / "visa checkout"
                    $checkout.find('.how-want-pay, .paymentoptions').addClass('hidden');
                    $checkout.find('li[data-inputid="rg_checkout1"] .required-entry').prop('required', false);
                }
                checkIfFreePayment();
            }

            if (quickCheckout.config && quickCheckout.config.config &&
                (quickCheckout.config.config.checkout_methods.visa_checkout || quickCheckout.config.config.payment_methods.visa_checkout) &&
                quickCheckout.config.config.payment_methods.visa_checkout_visible &&
                (id === "rg_checkout2" || id === "rg_payment3" || (id === "rg_checkout1" && $checkout.find('input[id="rg_payment3"]').is(':checked')))) {
                //re-initialise visa checkout with collectShipping either True (CHECKOUT with Visa Checkout) or False (PAYING with Visa Checkout).
                if (($this.hasClass('vc-ship-true') && quickCheckout.visaInit.settings.shipping.collectShipping === "false") || ($this.hasClass('vc-ship-false') && quickCheckout.visaInit.settings.shipping.collectShipping === "true")) {
                    quickCheckout.visaInit.settings.shipping.collectShipping = ($this.hasClass('vc-ship-true') ? "true" : "false");
                    V.init(quickCheckout.visaInit);
                }
            }

            if (checkout_method === "rg_checkout3" && isMethodClickCollect()) {
                //paypal checkout selected...cannot use click and collect. Reset shipping method to Standard
                $.addCheckoutMessage('Click &amp; Collect is not available via Paypal Checkout.', 'error autodismiss');
                resetDeliveryToAU(true);
            }
            if (checkout_method === "rg_checkout2" && isMethodClickCollect()) {
                //visacheckout selected...cannot use click and collect. Reset shipping method to Standard
                $.addCheckoutMessage('Click &amp; Collect is not available via Visa Checkout.', 'error autodismiss');
                resetDeliveryToAU(true);
            }

            $('li[data-inputid^=' + $this.attr("name") + ']').addClass('picked').not(x).removeClass('active');
            //x.find('input:nth(0)').focus();
        });

        //Purchase a giftcard inline
        if ($giftcard_buy.length) {
            //BUY GIFTCARD - CHANGE VALUE (Button)
            $giftcard_buy.on('click', '.btn[data-amt]', function () {
                var $this = $(this).addClass('selected'),
                    amt = $this.data('amt'),
                    $amt_wrapper = $giftcard_buy.find('.giftcard-amt');

                $giftcard_buy.find('.btn[data-amt]').not($this).removeClass('selected');
                $giftcard_buy.find('input[name="custom_giftcard_amount"]').val('').parent().removeClass('valid invalid');
                $amt_wrapper.removeClass('valid invalid');
                $giftcard_buy.find('input[name="giftcard_amount"]').val(amt);
                $giftcard_buy.find('.btn-add-giftcard').addClass('valid');
            });

            //BUY GIFTCARD - INPUT/CHANGE VALUE (Custom)
            $giftcard_buy.on({
                'input': function () {
                    $giftcard_buy.find('.btn[data-amt]').removeClass('selected');
                },
                'change': function () {
                    var $this           = $(this),
                        $parent         = $this.parent(),
                        amt             = parseInt($this.val(), 10),
                        min             = $this.attr('min'),
                        max             = $this.attr('max'),
                        valid           = (Number.isInteger(amt) && amt >= min && amt <= max),
                        $amt_wrapper    = $giftcard_buy.find('.giftcard-amt'),
                        err;

                    $giftcard_buy.find('input[name="giftcard_amount"]').val('');
                    err = amt > max ? 'Custom Amt. Max ' + max : amt < min ? 'Custom Amt. Min ' + min : 'OR Custom Amount';
                    $parent.addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid')).find('label').text(err);
                    $amt_wrapper.addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
                    $this.val(amt.toFixed(2)); //round to 2 places
                    $giftcard_buy.find('.btn-add-giftcard').addClass((valid ? 'valid' : 'invalid')).removeClass((!valid ? 'valid' : 'invalid'));
                }
            }, 'input[name="custom_giftcard_amount"]');

            //BUY GIFTCARD - TEXTAREA CHANGE
            $giftcard_buy.on('change', 'textarea', function () {
                var $this = $(this);

                if ($this.val()) {
                    $this.parent().removeClass('invalid').addClass('valid');
                } else {
                    $this.parent().removeClass('valid').addClass('invalid');
                }
            });

            //BUY GIFTCARD - CLICK ADD
            $giftcard_buy.on('click', '.btn-add-giftcard', function () {
                var $this = $(this),
                    valid = true;

                //validate fields
                $giftcard_buy.find('input[type="text"], input[type="email"], textarea').each(function () {
                    var $this = $(this);
                    if (!$this.isValid()) {
                        $this.parent().removeClass('valid').addClass('invalid');
                        valid = false;
                        return false;
                    }
                });

                if (!valid) {
                    return false;
                }

                if (!$giftcard_buy.find('input[name="giftcard_amount"]').val() && !$giftcard_buy.find('input[name="custom_giftcard_amount"]').isValid()) {
                    $giftcard_buy.find('.giftcard-amt').removeClass('valid').addClass('invalid');
                    return false;
                }

                var giftcard_pid = $giftcard_buy.find('select[name="product"]').val() ? $giftcard_buy.find('select[name="product"]').val() : 200000,
                    form_data = $giftcard_buy.find('input, textarea').serialize(),
                    url = quickCheckout.cart.ajaxUrl('catalog/ajax/add') + '/product/' + giftcard_pid + '/isAjax/1/' + '?' + form_data,
                    recipientName = $giftcard_buy.find('input[name="giftcard_recipient_name"]').val();

                //add gift card via ajax
                $this.addClass('valid').prop('disabled', true);
                $minicart.addClass('isloading');

                var inner = 0, outer = 0;

                console.log(url);

                $.ajax({url: url, method: "POST", dataType: "json", data: {form_key: form_key, qty: 1}}).done(function (json) {
                    //success
                    if (json.success !== true) {
                        $minicart.removeClass('isloading');
                        $.addCheckoutMessage('Error adding gift card.', 'error autodismiss');
                        return;
                    }

                    $.addCheckoutMessage('<i class="q_checkmark"></i>' + quickCheckout.translate("Gift card for %recipient% added to bag.").replace('%recipient%', '<span class="limitwidth">' + recipientName + '</span>'), 'success autodismiss', false);

                    //TODO Temporary! This is not cool. replace with single json request that has cart/view included, and move success message out:
                    $minicart.addClass('isloading');
                    $minicartArticles.addClass('done');

                    //was $.getJSON(ajax_cartAndSummary)
                    StoreService.getCart().done(function (json) {
                        $checkout.removeClass('empty');
                        quickCheckout.cart.populateCartAndSummary(json);

                        //collapse add gift card
                        $minicart.find('input[name="giftcard-add"]').prop('checked', false);
                        //reset gift card add fields
                        $minicart.find('input[name^="giftcard_recipient_"], input[name="giftcard_message"]').val('');
                        $minicart.find('.giftcard-amt button').removeClass('selected');
                        $minicart.find('.giftcard-amt input').val('');
                        $minicart.find('.btn-add-giftcard').removeClass('valid');

                        $summary.removeClass('done');

                    }).fail(function (jqxhr, textStatus, error) {
                        //fail
                        quickCheckout.displayXhrErrorMessage(jqxhr, 'Error fetching bag.');
                        $minicartArticles.removeClass('done');
                        if (typeof newrelic !== 'undefined') {
                            newrelic.noticeError(error);
                        }
                    }).always(function () {
                        inner = 1;
                        if (inner && outer) {
                            $minicart.removeClass('isloading');
                        }
                    });

                }).fail(function (jqxhr, textStatus, error) {
                    $minicart.removeClass('isloading');
                    $.addCheckoutMessage('Error adding gift card.', 'error autodismiss');
                    if (typeof newrelic !== 'undefined') {
                        newrelic.noticeError(error);
                    }
                }).always(function () {
                    outer = 1;
                    $this.prop('disabled', false);
                    if (inner && outer) {
                        $minicart.removeClass('isloading');
                    }
                });

            });
        } //end giftcard_buy

        $checkout.on('click', '.set-shipping-to-au', function(){
            setShippingCountry('AU');
        });

    };

    //LOAD CHECKOUT ON CLICK OF THAT TAB
    var loadFullCheckout = function() {

        if (!form_key || $checkout_tab.hasClass('done')) {
            console.log('loadFullCheckout already loaded or something missing');
            return;
        }

        var deferred = [],
            checkout_template = JST["js/quickcheckout/checkout.hbs"],
            cart_fail = false;

        //prefetch huge postcodeanywhere flag image file to improve country change responsiveness
        $('body').append('<img style="display:none;" src="https://expresscapture.datatoolscloud.net.au/images/flags16x16.png">');

        $checkout_tab.addClass('isloading done');

        var getCartSuccess = function(json) {
            //replace cartView in quickCheckout
            $.extend(quickCheckout, {cartView: json});
            //new we have totals add afterpay object to quickcheckout so it can be used in templates
            quickCheckout.calculateAfterpayInstallment();
        };
        var getCartFailure = function(jqxhr, textStatus, error, default_msg) {
            quickCheckout.displayXhrErrorMessage(jqxhr, default_msg);
        };

        if (userCountry && userCountry.code && ((StoreService.mode === "single" && userCountry.allowed_single) || (StoreService.mode === "multi" && userCountry.allowed_multi)) && !userCountry.set) {
            /**
             * user has assumed country, get cart via setCountry (not already set)
             */
            deferred.push(
                StoreService.setCountry(userCountry.code).done(function (json) {
                    userCountry.set = true;
                    //$.jStorage.set('qc_userCountry', userCountry);
                    getCartSuccess(json);
                }).fail(function(jqxhr, textStatus, error) {
                    /**
                     * Could return an error related to a shipping restriction, e.g.
                     * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
                     * If that's the case we need to set the shipping select back to previous country.
                     */
                    getCartFailure(jqxhr, textStatus, error, "Error updating shipping country");
                    cart_fail = true;
                })
            );
        } else {
            /**
             * no user country, get cart regular way
             */
            deferred.push(
                StoreService.getCart().done(function (json) {
                    getCartSuccess(json);
                }).fail(function(jqxhr, textStatus, error) {
                    getCartFailure(jqxhr, textStatus, error, "Error fetching cart");
                    cart_fail = true;
                })
            );
        }

        deferred.push(
            StoreService.getCheckoutConfig({form_key: form_key}).done(function(json) {
                //merge config into quickCheckout
                $.extend(quickCheckout, {config: json});

                /**
                 * Display any session messages
                 * e.g. afterpay payment returns session warnings, the string would be something like "error : payment declined"
                 */
                if (json.session_messages) {
                    $.each(json.session_messages, function (index, value) {
                        $.addCheckoutMessage(value.message, value.type);
                    });
                }
            }),
            StoreService.getProfile().done(function(json) {
                console.log(json);
                //set default identity and merge config into quickCheckout
                if (Object.keys(json.identities).length) {
                    json.defaultIdentity = json.identities[Object.keys(json.identities)[0]];

                    if (!Object.keys(json.addresses).length) {
                        //no addresses, set to null
                        json.addresses = null;
                    }

                    $.extend(quickCheckout, {customer: json});

                    //logged in, show merge cart message if set
                    if (typeof $.cookie('qc_merge_cart_msg') !== 'undefined') {
                        $.addCheckoutMessage('Welcome back ' + json.defaultIdentity.first_name + '!' + $.cookie('qc_merge_cart_msg'), 'success autodismiss');
                        $.removeCookie('qc_merge_cart_msg');
                    }
                }
            }),
            StoreService.getCountries().done(function(json) {
                //merge allowed shipping countries into quickCheckout
                $.extend(quickCheckout, {countries: json.countries});
            }).fail(function(jqxhr, textStatus, error) {
                getCartFailure(jqxhr, textStatus, error, "Error fetching available shipping countries");
            })
        );

        var all_success = function() {
            //GREAT SUCCESS - We now have cartView, config, customer and countries.

            if (firstLoad) {

                if (quickCheckout.customer) {
                    //logged in, set default addresses
                    setTimeout(function () {
                        $checkout.find('.addresses-ship .setaddress.ship[data-default-ship]').click();
                        $checkout.find('.addresses-bill .setaddress.bill[data-default-bill]').click();
                    }, 100);
                }

                //VISA CHECKOUT
                if (quickCheckout.config.config &&
                    (quickCheckout.config.config.checkout_methods.visa_checkout || quickCheckout.config.config.payment_methods.visa_checkout) &&
                    quickCheckout.config.config.payment_methods.visa_checkout_visible) {

                    var visa_gateway = quickCheckout.config.config.payment_methods.visa_gateway;

                    quickCheckout.visaInit = {
                        apikey: visa_gateway.apikey,
                        settings: {
                            shipping: {
                                collectShipping: "true" //true = visa checkout will ask for shipping address
                            },
                            countryCode: 'AU',
                            logoUrl: visa_gateway.logoUrl,
                            websiteUrl: visa_gateway.websiteUrl,
                            review: {
                                buttonAction: "Pay"
                            }
                        },
                        paymentRequest: {
                            currencyCode: "AUD",
                            subtotal: quickCheckout.cartView.summary.totals.grand_total.value,
                            total: quickCheckout.cartView.summary.totals.grand_total.value
                        }
                    };

                    $.getScript(visa_gateway.url_sdk, function () {
                        //see Visa Checkout callback at bottom of file (onVisaCheckoutReady)
                    });
                }
            }

            //saved addresses that can't be shipped to (country not in allowed shipping list)
            //note: if zippy in cart, NZ is still in allowed list?!
            var hidden = 0;
            if (quickCheckout.countries && quickCheckout.customer && quickCheckout.customer.addresses) {
                var allowed = quickCheckout.countries,
                    addresses = quickCheckout.customer.addresses;

                $.each(addresses, function () {
                    var result = false;

                    for (var property in allowed) {
                        if (allowed.hasOwnProperty(property)) {
                            if (allowed[property].value === this.country) {
                                result = true;
                            }
                        }
                    }

                    if (!result) {
                        hidden++;
                    }
                });
            }

            var allBillingCountries = [
                {"value":"AU","label":"Australia"},{"value":"AT","label":"Austria"},{"value":"BE","label":"Belgium"},{"value":"BR","label":"Brazil"},{"value":"CA","label":"Canada"},{"value":"DK","label":"Denmark"},{"value":"EG","label":"Egypt"},{"value":"FJ","label":"Fiji"},{"value":"FI","label":"Finland"},{"value":"FR","label":"France"},{"value":"DE","label":"Germany"},{"value":"GR","label":"Greece"},{"value":"HK","label":"Hong Kong SAR China"},{"value":"IN","label":"India"},{"value":"IE","label":"Ireland"},{"value":"IL","label":"Israel"},{"value":"IT","label":"Italy"},{"value":"JP","label":"Japan"},{"value":"MY","label":"Malaysia"},{"value":"NL","label":"Netherlands"},{"value":"NZ","label":"New Zealand"},{"value":"NO","label":"Norway"},{"value":"PK","label":"Pakistan"},{"value":"PH","label":"Philippines"},{"value":"PL","label":"Poland"},{"value":"SA","label":"Saudi Arabia"},{"value":"SG","label":"Singapore"},{"value":"ZA","label":"South Africa"},{"value":"KR","label":"South Korea"},{"value":"ES","label":"Spain"},{"value":"LK","label":"Sri Lanka"},{"value":"SE","label":"Sweden"},{"value":"CH","label":"Switzerland"},{"value":"TH","label":"Thailand"},{"value":"TR","label":"Turkey"},{"value":"GB","label":"U.K."},{"value":"AE","label":"United Arab Emirates"},{"value":"US","label":"U.S."},{"value":"VN","label":"Vietnam"}
            ];

            //add hidden addresses etc. to config object:
            $.extend(quickCheckout.config, {
                skin_url: MageUrl.skin,
                hidden_addresses: hidden,
                billing_countries: StoreService.mode === "multi" ? allBillingCountries : quickCheckout.countries
            });

            //populate checkout.hbs
            $checkout_tab.html(checkout_template(quickCheckout));

            //move employee header in
            var mybrandsheader = $('.mypacificbrands-header');
            if (mybrandsheader.length) {
                var mybrands_name   = mybrandsheader.find('.mypacificbrands-group').text();
                //mybrands_img    = mybrandsheader.find('img')
                $checkout.find('.welcome-back').append('<div><strong>' + mybrands_name + '</strong></div>');
            }

            //populate cart and summary
            quickCheckout.cart.populateCartAndSummary(quickCheckout.cartView);

            if (firstLoad) {
                updateGrandTotals();
            } else {
                reInitCheckout();
            }

            bindEvents();
            //scroll to delivery section
            if (!isQuickCheckoutPage || (isQuickCheckoutPage && viewportSize.getWidth() < 960) || typeof $.cookie('qc_sign_up') !== 'undefined') {
                $checkout.find('.header-sub a.delivery').click();
                if ($.cookie('qc_sign_up')) {
                    $checkout.find('.welcome-back').addClass('attention');
                    $.removeCookie('qc_sign_up');
                }
            }

            //set default tab to from admin config setting:
            if (quickCheckout.config && quickCheckout.config.config && quickCheckout.config.config.checkout_methods.default_tab === "member") {
                $checkout.find('label[for="rg_checkout4"]').click();
            }

            //firefox saves form state - so 'click' the selected radio buttons:
            $checkout.find("#" + $('input[name="rg_top"]:checked').val()).change();

            if (!quickCheckout.customer) {
                //not logged in, can take loading state off now
                $checkout_tab.removeClass('isloading');
            }

            firstLoad = false;

        };

        $.when.apply(
            $, deferred
        ).then(all_success, function(jqxhr, textStatus, error) {
            //EPIC FAIL
            if (cart_fail) {
                /**
                 * Cart failed. This could return an error related to a shipping restriction, e.g.
                 * "Unfortunately we are unable to deliver Baby products to NZ customers. Please remove the items from your cart in order to proceed."
                 * If that's the case we need to set the shipping select back to default country.
                 */
                StoreService.setCountry('DEFAULT').done(function (json) {
                    $.addCheckoutMessage('Country reset to ' + json.summary.shipping.country, 'success autodismiss');
                    getCartSuccess(json);
                    all_success();
                }).fail(function(jqxhr, textStatus, error) {
                    //unrecoverable fail
                    getCartFailure(jqxhr, textStatus, error, "Error updating shipping country to default.");
                });
            } else {
                //unrecoverable fail
                quickCheckout.displayXhrErrorMessage(jqxhr, 'Error fetching checkout.');

                $checkout_tab.removeClass('done');
                if (typeof newrelic !== 'undefined') {
                    newrelic.noticeError(error);
                }
            }
        }).always(function() {
            $checkout.removeClass('isloading');
        });

    };
    $.extend(quickCheckout, {loadFullCheckout: loadFullCheckout});

    //http://stackoverflow.com/questions/23757345/android-does-not-correctly-scroll-on-input-focus-if-not-body-element
    if(/Android (4\.[0-3]|6\.0)/.test(navigator.appVersion)){
        window.addEventListener("resize", function(){
            if(document.activeElement.tagName === "INPUT"){
                window.setTimeout(function(){
                    document.activeElement.scrollIntoViewIfNeeded();
                },0);
            }
        });
    }

    //An experiment for later - progressive reveal of form options
    /*
     $('input[name^=rg_delivery], input[name^=rg_payment]').prop('checked',false);
     $('li[data-inputid^=rg_delivery], li[data-inputid^=rg_payment]').removeClass('active');
     $('.paymentoptions').hide();
     $('.deliveryoptions label').on('click', function(){$('.paymentoptions').show()});
     */

}(jQuery));

//VISA CHECKOUT
function postToURL(path, params) {
    "use strict";
    var form;

    if (quickCheckout.visaInit.settings.shipping.collectShipping === "true") {
        //visa checkout has collected address, use a new form
        jQuery.addCheckoutMessage('Please wait while we process your order...', 'success');
        jQuery('#tjcheckout').addClass('isloading');
        form = document.createElement("form");
    } else {
        //use checkout form so we can use checkout data
        form = document.getElementById('tjcheckout');
        jQuery('.submit-order').trigger('visavalidate');
    }

    form.setAttribute("method", "post");
    form.setAttribute("action", path);

    for (var key in params){
        if (params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
    }

    if (quickCheckout.visaInit.settings.shipping.collectShipping === "true") {
        document.body.appendChild(form);
    } else {
        var formdata = jQuery('#tjcheckout').serializeArray();
        /*
         var arrayLength = formdata.length;
         for (var i = 0; i < arrayLength; i++) {
         if (formdata[i].value) {
         console.log(formdata[i].name + ': ' + formdata[i].value);
         }
         }
         */
    }
    form.submit();

}

function onVisaCheckoutReady() {
    "use strict";

    V.init(quickCheckout.visaInit);
    V.on("payment.success", function(payment){
        //console.log(payment);
        postToURL(MageUrl.base + "vme/index/visasuccess/",payment);
    });
    V.on("payment.cancel", function(payment){
        //console.log(JSON.stringify(payment));
    });
    V.on("payment.error", function(payment, error){
        //error handling
        //console.log(error);
        postToURL(MageUrl.base + "vme/index/error/",error);
    });
}