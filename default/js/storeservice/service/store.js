/* globals MagentoAPI, MagentoTransformer, MBPAPI, MBPTransformer */

jQuery("document").ready(function () {
    "use strict";

    /**
     * This object is a service helper object that allows the theme javascript to access cart and checkout API data
     * without needing to know where to get it from. It abstracts the MBP/Magento API access.
     */

    var StoreService = function () {

        PB_Console.info('Instantiating a StoreService object');

        // Set up for default Magento usage
        this.ready = false;
        this.Magento = new MagentoAPI();
        this.activeAPI = this.Magento;
        this.transformer = new MagentoTransformer();
        this.mode = "single";

        // If we have a MBP object, let's initialise and see if it's enabled
        // @TODO: implement some form of store connector registration,
        // @TODO: rather than hard code implementation in the StoreService
        var $this = this;
        if(typeof MBPAPI !== "undefined") {

            this.MBP = new MBPAPI();
            this.MBP.init().done(function () {

                $this.detectMBPMode();

            }).always(function () {
                $this.ready = true;
                jQuery(document).trigger('storeservice_ready');
                jQuery('html').addClass('mbp-' + $this.mode);
            });
        } else {
            PB_Console.info('%cStoreService is ready. MBP enabled: false', 'color:yellow');
            $this.ready = true;
            jQuery(document).trigger('storeservice_ready');
            jQuery('html').addClass('mbp-' + $this.mode);
        }

    };

    StoreService.prototype.detectMBPMode = function() {

        // If this store is enabled
        if (typeof MBPAPI !== "undefined" && this.MBP.config.enabled) {

            // Get a lost of all flagged stores that aren't this store
            var otherActiveStores = this.MBP.getActiveStores().filter(function (store) {
                return store.enabled === 1 && store.flag === true && store.current === false;
            });

            /**
             * Which do we want for this scenario??\
             * Scenario: Add item on Bonds, visit Berlei (no berlei items yet), open bag
             *
             * A: Bonds items appear in the cart on there own - you have entered mbp mode
             * --OR--
             * B: Cart is empty until you add a Berlei item
             *
             * Currently we are using A.
             * To switch to B remove the "store.current === false" condition from otherActiveStores above,
             * and set "otherActiveStores.length > 1" below.
             */

            // If other MBP stores have items in the cart
            if (otherActiveStores.length > 0) {

                // Set activeAPI to MBP, and replace Transformer
                PB_Console.info('MBP reports this store is active and other active stores contain cart items');
                this.activeAPI = this.MBP;
                this.transformer = new MBPTransformer();
                this.mode = "multi";

            } else {

                // Set activeAPI to Magento, and replace Transformer
                PB_Console.info('MBP reports this is the only active store, or that other active stores have empty carts');
                this.activeAPI = this.Magento;
                this.transformer = new MagentoTransformer();
                this.mode = "single";
            }

            jQuery('html').removeClass("mbp-" + (this.mode === "single" ? "multi" : "single")).addClass("mbp-" + this.mode);

        }
    };

    /**
     * Return a list of active stores
     * @return array <p>A list of stores with the following attributes<br/>
     * - hello</p>
     */
    StoreService.prototype.getActiveStores = function () {
        // @TODO: This is hacky; there must be a better way. Perhaps StoreConnectors can signify if they
        // @TODO: support multiple stores, and if so, which ones? Or perhaps this doesn't belong in the StoreService?
        // @TODO: This might want to be refactored, but for now, it can stay here (MVP, KISS)
        if(typeof this.MBP !== "undefined") {
            return this.MBP.getActiveStores();
        } else {
            return [];
        }
    };

    /**
     * Returns a boolean value to indicate if either carts suspect there to be items available foro checkout.
     * @return boolean True if we suspect there are items in the cart
     */
    StoreService.prototype.suspectItemsInCart = function () {
        var stores = this.getActiveStores();
        for (var i = 0; i < stores.length; ++i) {
            if (stores[i].flag) {
                return true;
            }
        }
        return false;
    };

    /**
     * Returns the checkout init configuration
     * @return object Checkout configuration
     */
    StoreService.prototype.getCheckoutConfig = function () {
        PB_Console.info('Getting checkout config from active API');
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.getCheckoutConfig().then(function (config) {
            config = transformer.formatCheckoutConfig(config);
            d.resolve(config);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Returns the cart
     * @return object Checkout configuration
     */
    StoreService.prototype.getCart = function () {
        PB_Console.info('Getting cart from active API');

        var d = jQuery.Deferred();

        // Let's register with MBP again, to see if the status has changed (unless on quickcheckout page - we just registered)
        var $this = this;
        var transformer;
        if (jQuery('body.quickcheckout-index-index').length) {

            $this.detectMBPMode();

            // We have the correct API and Transformer active now
            transformer = $this.transformer;
            $this.activeAPI.getCart().then(function (cart) {
                cart = transformer.formatCart(cart);
                d.resolve(cart);
            }).fail(function (jqxhr, textStatus, error) {
                d.reject(jqxhr, textStatus, error);
            });

        } else {

            if (typeof MBPAPI !== "undefined" && this.MBP.config.enabled) {
                this.MBP.register().done(function () {

                    $this.detectMBPMode();

                    // We have the correct API and Transformer active now
                    var transformer = $this.transformer;
                    $this.activeAPI.getCart().then(function (cart) {
                        cart = transformer.formatCart(cart);
                        d.resolve(cart);
                    }).fail(function (jqxhr, textStatus, error) {
                        d.reject(jqxhr, textStatus, error);
                    });

                }).fail(function (jqxhr, textStatus, error) {
                    d.reject(jqxhr, textStatus, error);
                });
            } else {
                transformer = $this.transformer;
                $this.activeAPI.getCart().then(function (cart) {
                    cart = transformer.formatCart(cart);
                    d.resolve(cart);
                }).fail(function (jqxhr, textStatus, error) {
                    d.reject(jqxhr, textStatus, error);
                });
            }
        }

        return d.promise();

    };

    /**
     * Updates the qty of an item in a quote, and returns the new cart
     * @param quote_item_id
     * @param quantity
     */
    StoreService.prototype.updateQuantity = function (data) {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.updateQuantity(data).then(function (cart) {
            cart = transformer.formatCart(cart);
            d.resolve(cart);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Removes an item from a quote, and returns the new cart
     * @param quote_item_id
     */
    StoreService.prototype.removeItem = function (data) {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.removeItem(data).then(function (cart) {
            cart = transformer.formatCart(cart);
            d.resolve(cart);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Applies a coupon code to the cart
     * @param coupon_code
     */
    StoreService.prototype.addCoupon = function (coupon_code) {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.addCoupon(coupon_code).then(function (cart) {
            cart = transformer.formatCart(cart);
            d.resolve(cart);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Empties all carts
     * @return proise Resolves as cart object
     */
    StoreService.prototype.cartClear = function () {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.cartClear().then(function (cart) {
            cart = transformer.formatCart(cart);
            d.resolve(cart);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Set the country for the current cart
     * @param country_code
     */
    StoreService.prototype.setCountry = function (country_code) {

        var d = jQuery.Deferred();

        // Let's register with MBP again, to see if the status has changed
        var $this = this;
        if(typeof MBPAPI !== "undefined") {
            this.MBP.register().done(function () {

                $this.detectMBPMode();

                // We have the correct API and Transformer active now
                var transformer = $this.transformer;
                $this.activeAPI.setCountry(country_code).then(function (cart) {
                    cart = transformer.formatCart(cart);
                    d.resolve(cart);
                }).fail(function (jqxhr, textStatus, error) {
                    d.reject(jqxhr, textStatus, error);
                });

            }).fail(function (jqxhr, textStatus, error) {
                d.reject(jqxhr, textStatus, error);
            });
        } else {
            var transformer = $this.transformer;
            $this.activeAPI.setCountry(country_code).then(function (cart) {
                cart = transformer.formatCart(cart);
                d.resolve(cart);
            }).fail(function (jqxhr, textStatus, error) {
                d.reject(jqxhr, textStatus, error);
            });
        }

        return d.promise();
    };

    /**
     * Get a list of available countries for the current cart
     * @return promise Resolves as array of country codes
     */
    StoreService.prototype.getCountries = function () {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.getCountries().then(function (countries) {
            countries = transformer.formatCountries(countries);
            d.resolve(countries);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Set the Shipping Method for the current cart
     * @param method
     */
    StoreService.prototype.setShippingMethod = function (method) {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.setShippingMethod(method).then(function (cart) {
            cart = transformer.formatCart(cart);
            d.resolve(cart);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Get a list of profiles from active stores
     * @return promise Resolves as profile object (includes identities and addresses)
     */
    StoreService.prototype.getProfile = function () {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.getProfile().then(function (profile) {
            profile = transformer.formatProfile(profile);
            d.resolve(profile);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    StoreService.prototype.getShippingRates = function (country) {
        var d = jQuery.Deferred();
        var transformer = this.transformer;
        this.activeAPI.getShippingRates(country).then(function (rates) {
            rates = transformer.formatProfile(rates);
            d.resolve(rates);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });
        return d.promise();
    };

    /**
     * Handle checkout form submission
     * @param payload The submission data
     */
    StoreService.prototype.checkout = function (payload) {

        var d = jQuery.Deferred();
        var transformer = this.transformer;
        var transformedPayload = transformer.formatCheckoutPayload(payload);

        this.activeAPI.checkout(transformedPayload).then(function (checkoutResponse) {
            checkoutResponse = transformer.formatCheckoutResponse(checkoutResponse);
            d.resolve(checkoutResponse);
        }).fail(function (jqxhr, textStatus, error) {
            d.reject(jqxhr, textStatus, error);
        });

        return d.promise();
    };

    window.StoreService = new StoreService();


    /**
     * Provide a store client for use in the developer console
     * @constructor
     */
    var StoreClient = function () {

        this.checkoutData = {};

        PB_Console.group();
        PB_Console.log("%cStoreClient is active", "color: green; font-size: x-large");
        PB_Console.log("%cYou can interact with this store using the StoreClient like this:", "color: green");
        PB_Console.log("%c* %cStoreClient.suspectItemsInCart() %cDo we suspect there are items in the cart? Returns boolean", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.getCart() %cGets the current cart from Magento or MBP, depending on which is active", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.prettyCart() %cPrints the current cart from Magento or MBP, depending on which is active", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.updateQuantity({quote_item_id: quote_item_id, qty: quantity}) %cSets the quantity for a quote_line_id", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.removeItem({quote_item_id: quote_item_id}) %cRemoves an item by quote_line_id", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.addCoupon(coupon_code) %cTries to apply a coupon code to the cart", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.cartClear() %cEmpties all carts", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.setCountry(country_code) %cSets the country for the cart", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.getCountries() %cGets a list of available countries for the cart", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.getProfile() %cGets the customer profiles from all active stores", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.checkout() %cSubmit for checkout, based on checkout data", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.prefillCheckoutData() %cSets dummy data for the checkout data", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.log("%c* %cStoreClient.setCheckoutData(key, value) %cSets a piece of checkout data", "colour: green", "color: green; font-weight: bold", "colour: green");
        PB_Console.groupEnd();
    };

    StoreClient.prototype.getCart = function () {
        window.StoreService.getCart().then(function (cart) {
            PB_Console.log("%cStoreClient.getCart", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.prettyCart = function () {
        window.StoreService.getCart().then(function (cart) {
            var quote_item_id = "Quote Item ID  ";
            var sku = "SKU         ";
            var name = "Name                                              ";
            var sell_price = "        Sell";
            var discount = "    Discount";
            var quantity = "   Qty";
            var total_price = "        Total";
            PB_Console.log("%c%s %s %s %s %s %s %s", "color: Red", quote_item_id, sku, name, sell_price, discount, quantity, total_price);
            cart.items.each(function (item) {
                quote_item_id = (item.quote_item_id + "                    ").slice(0, 15);
                sku = (item.sku + "                    ").slice(0, 12);
                name = (item.name + "                                                            ").slice(0, 50);
                sell_price = ("             $" + item.sell_price).slice(-12);
                discount = ("             $" + item.discount).slice(-12);
                quantity = ("     " + item.quantity).slice(0, 6);
                total_price = ("             $" + item.total_price).slice(-13);
                PB_Console.log("%c%s %s %s %s %s %s %s", "color: orange", quote_item_id, sku, name, sell_price, discount, quantity, total_price);
            });
        });
        return 'OK';
    };

    StoreClient.prototype.updateQuantity = function (data) {
        window.StoreService.updateQuantity(data).then(function (cart) {
            PB_Console.log("%cStoreClient.updateQuantity", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.removeItem = function (quote_item_id) {
        window.StoreService.removeItem(quote_item_id).then(function (cart) {
            PB_Console.log("%cStoreClient.remoteItem", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.addCoupon = function (coupon_code) {
        window.StoreService.addCoupon(coupon_code).then(function (cart) {
            PB_Console.log("%cStoreClient.addCoupon", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.cartClear = function () {
        window.StoreService.cartClear().then(function (cart) {
            PB_Console.log("%cStoreClient.cartClear", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.suspectItemsInCart = function () {
        PB_Console.log("%cStoreClient.suspectItemsInCart", "color: green", window.StoreService.suspectItemsInCart());
        return 'OK';
    };

    StoreClient.prototype.setCountry = function (country_code) {
        window.StoreService.setCountry(country_code).then(function (cart) {
            PB_Console.log("%cStoreClient.setCountry", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.getCountries = function () {
        window.StoreService.getCountries().then(function (countries) {
            PB_Console.log("%cStoreClient.getCountries", "color: green", countries);
        });
        return 'OK';
    };

    StoreClient.prototype.setShippingMethod = function (method) {
        window.StoreService.setShippingMethod(method).then(function (cart) {
            PB_Console.log("%cStoreClient.setShippingMethod", "color: green", cart);
        });
        return 'OK';
    };

    StoreClient.prototype.getProfile = function () {
        window.StoreService.getProfile().then(function (profile) {
            PB_Console.log("%cIdentities", "font-weight: bold; color: red");
            for(var identity in profile.identities) {
                PB_Console.log("%c%s %c%s %s <%s>", "color: orange", identity, "color: inherit", profile.identities[identity].firstname, profile.identities[identity].lastname, profile.identities[identity].email);
            }
            PB_Console.log("%cAddresses", "font-weight: bold; color: red");
            for(var address in profile.addresses) {
                PB_Console.log("%c%s %c%s, %s, %s, %s, %s %s, %s", "color: orange", address, "color: inherit", profile.addresses[address].street[0], profile.addresses[address].street[1], profile.addresses[address].street[2], profile.addresses[address].city, profile.addresses[address].region, profile.addresses[address].postcode, profile.addresses[address].country);
            }
        });

        return 'OK';
    };

    StoreClient.prototype.checkout = function () {
        window.StoreService.checkout(this.generateCheckoutPayload()).then(function (order) {
            PB_Console.log("%cStoreClient.checkout", "color: green", order);
        });
        return 'OK';
    };

    StoreClient.prototype.prefillCheckoutData = function() {

        this.checkoutData = {
            "form_key": jQuery('#tjcheckout').find('input[name="form_key"]').val(),
            "rg_checkout": "rg_checkout1",
            "guest_email": "ben@dechrai.com",
            "rg_delivery": "delivery",
            "shipping[firstname]": "Ben",
            "shipping[lastname]": "Dechrai",
            "shipping[country_id]": "AU",
            "shipping[street][0]": "1096 Toorak Rd",
            "shipping[street][1]": "",
            "shipping[street][2]": "",
            "shipping[city]": "Camberwell",
            "shipping[postcode]": "3124",
            "shipping[region_id]": "491",
            "shipping[region]": "Victoria",
            "shipping[telephone]": "",
            "billing[use_for_shipping]": "1",
            "billing[firstname]": "Ben",
            "billing[lastname]": "Dechrai",
            "billing[country_id]": "AU",
            "billing[street][0]": "1096 Toorak Rd",
            "billing[street][1]": "",
            "billing[city]": "Camberwell",
            "billing[postcode]": "3124",
            "billing[region_id]": "491",
            "billing[region]": "Victoria",
            "giftcard_num": "",
            "shipping_method": "premiumrate_FREE_Standard_Shipping",
            "rg_payment": "on",
            "card_num": "4444 3333 2222 1111",
            "card_exp": "12 / 19",
            "card_cvc": "123",
            "payment[method]": "cybersource_soap",
            "payment_method": "",
            "payment[cc_number]": "4444333322221111",
            "payment[cc_type]": "VI",
            "payment[cc_last4]": "21111",
            "payment[cc_exp_month]": "12",
            "payment[cc_exp_year]": "2019",
            "payment[cc_cid]": "123",
            "firstname": "Ben",
            "lastname": "Dechrai"
        };

        var $this = this;
        window.StoreService.getCart().then(function (cart) {
            cart.items.each(function (item) {
                var key = "prodQty[" + item.quote_item_id + "]";
                $this.checkoutData[key] = item.quantity;
            });
        });
    };

    StoreClient.prototype.setCheckoutDatum = function(key, value) {
        this.checkoutData[key] = value;
    };

    StoreClient.prototype.generateCheckoutPayload = function() {
        var checkoutPayload = [];
        for(var key in this.checkoutData) {
            checkoutPayload.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.checkoutData[key]));
        }
        checkoutPayload = checkoutPayload.join('&');
        return checkoutPayload;
    };

    window.StoreClient = new StoreClient();

});