/* globals AbstractAPI, MageUrl, MageInfo */
/**
 * This object encapsulates functionality provided by the Magento API
 * @extends API
 */

function MagentoAPI() {
    AbstractAPI.apply(this, arguments);
    this.config = [];
    this.token = null;
    this.currentStore = {
        current: true,
        enabled: 1,
        friendly_name: MageInfo.website_name,
        hostname: MageInfo.hostname,
        system_name: MageInfo.store_code,
        visited: true
    };
    this.stores = [
        this.currentStore
    ];
    this.forceSessionReset = false;
    this.form_key = null;
}
MagentoAPI.prototype = Object.create(AbstractAPI.prototype);
MagentoAPI.prototype.constructor = MagentoAPI;

MagentoAPI.prototype.init = function () {
    this.form_key = jQuery('#tjcheckout').find('input[name="form_key"]').val();
};

MagentoAPI.prototype.getCart = function () {

    PB_Console.info('Getting Magento Cart');

    var d = jQuery.Deferred();

    // Get config for this extension
    jQuery.ajax({
        url: MageUrl.base + 'checkout/cart/view',
        type: "GET",
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();

};

MagentoAPI.prototype.updateQuantity = function (data) {

    PB_Console.info('Updating quote item ' + data.quote_item_id + ' to qty ' + data.qty);

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/cart/update/id/' + data.quote_item_id + '/qty/' + data.qty,
        type: "GET",
        data: data.form_data,
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.removeItem = function (data) {

    PB_Console.info('Removing quote item ' + data.quote_item_id);

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/cart/remove/id/' + data.quote_item_id,
        type: "GET",
        data: data.form_data,
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.addCoupon = function (coupon_code) {

    PB_Console.info('Adding coupon ' + coupon_code + ' to the cart');

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/coupon/add',
        type: "GET",
        data: {
            code: coupon_code
        },
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();

};

MagentoAPI.prototype.cartClear = function () {

    PB_Console.info('Clearing Magento cart');

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/cart/clear',
        type: "GET",
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.getCheckoutConfig = function () {

    PB_Console.info('Getting Magento initCheckout');

    var d = jQuery.Deferred();

    // Get config for this extension
    jQuery.ajax({
        url: MageUrl.base + 'quickcheckout/checkout/initCheckout',
        type: "GET",
        data: {
            form_key: this.form_key,
        },
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.setCountry = function (country_code) {

    console.log('Setting Magento cart country to ' + country_code);

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/shipping/country',
        type: "GET",
        data: {
            code: country_code
        },
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();

};

MagentoAPI.prototype.getCountries = function () {

    PB_Console.info("Get Magento countries");

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/shipping/countries',
        type: "GET",
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.setShippingMethod = function (method) {

    PB_Console.info('Setting Magento cart shipping method to ' + method);

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/shipping/method',
        type: "GET",
        data: {
            method: method
        },
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();

};

MagentoAPI.prototype.getProfile = function () {

    PB_Console.info("Get Magento profile");

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'checkout/customer/profile',
        type: "GET",
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};

MagentoAPI.prototype.getShippingRates = function(country) {

    PB_Console.info("Get Magento shipping rates");

    var d = jQuery.Deferred();

    jQuery.getJSON(MageUrl.base + 'checkout/shipping/cost', {
        country: country
    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
}


/**
 * Submit the cart for payment and order completion
 * @param payload The submission data
 */
MagentoAPI.prototype.checkout = function (payload) {
    PB_Console.info("Checkout Magento order");

    var d = jQuery.Deferred();

    jQuery.ajax({
        url: MageUrl.base + 'quickcheckout/checkout/submitorder',
        type: "POST",
        dataType: "json",
        data: payload,
        context: this

    }).done(function (data) {
        d.resolve(data);

    }).fail(function(jqxhr, textStatus, error){
        d.reject(jqxhr, textStatus, error);
    });

    return d.promise();
};
