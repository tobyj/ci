/**
 * Object pbSalesShippingAddressEdit
 * object used to setup page events for sales shipping address update
 * identified : #shipping-address-select
 * required   : form.sales-shippingaddress-edit
 *
 * @type {{init: pbSalesShippingAddressEdit.init,
 *         bindEvents: pbSalesShippingAddressEdit.bindEvents,
 *         populateShippingAddressForm: pbSalesShippingAddressEdit.populateShippingAddressForm
 *         }}
 */
pbSalesShippingAddressEdit = {

    init : function() {
        this._shippingAddressSelect = $j('#shipping-address-select');
        this._form                  = $j('form.sales-shippingaddress-edit');
        this._addressesData         = JSON.parse(this._shippingAddressSelect.attr('data-rawdata'));

        this.bindEvents();

        this._shippingAddressSelect.change(); // initial show/hide
    },

    bindEvents : function() {
        var _this = this;

        // shipping address select changed
        _this._shippingAddressSelect.on("change", function() {
            if( _this._shippingAddressSelect.val()!='' ) {
                _this.populateShippingAddressForm(_this._shippingAddressSelect.val());
            } else {
                _this.populateShippingAddressForm(0);
            }
        } );

        // form submit button clicked
        _this._form.find('.buttons-set button[type="submit"]').on("click", function(){
            // something failed validation, exit for now
            if( _this._form.find('.validation-failed').length > 0 ){
                return false;
            }

            return true;
        });
    },

    // functions
    /**
     *
     * Populate shipping address form
     *
     * @param index the value of the selected shipping address select option
     */
    populateShippingAddressForm : function(index) {
        var _this = this;

        if(index==0){ // empties the form
            _this._form.find('input[type!="hidden"]')          // dont empty hidden fields
                       .filter("[id!='country']") // dont empty country
                       .not(".country") // dont empty country
                       .filter("[id!='save_in_address_book']") // dont empty save to address
                       .val('');
            _this._form.find('select#region_id').val('');
        } else {

            var cAddressRow = _this._addressesData[index];

            $j.each(cAddressRow, function(key, val){
                _this._form.find('input[name="'+key+'"]').val(val);
                if(key=='region_id') {
                    _this._form.find('select#region_id').val(val);
                }
            });
        }
    }
} // class pbSalesShippingAddressEdit

/**
 * Object pbSalesShippingAddressUpdateCountdown
 * used to initialize order shipping address countdown timer widget
 * identified : #shipping-address-update-countdown
 * require    : .shipping-address-update-countdown-container
 *
 * @type {{init: pbSalesShippingAddressUpdateCountdown.init,
 *         start: pbSalesShippingAddressUpdateCountdown.start
 *         }}
 */
pbSalesShippingAddressUpdateCountdown = {

    init : function() {
        this._countdown_interval  = 1000;// 1 sec = 1000 milisec

        this._countdown           = $j('#shipping-address-update-countdown');
        this._countdown_container = $j('.shipping-address-update-countdown-container');
        this._due_timestamp       = this._countdown.attr('data-shippingaddress_updatedue_timestamp'); // unix timestamp
        this._curr_timestamp      = this._countdown.attr('data-curr_timestamp');                      // unix timestamp
        this._internal_timestamp  = this._due_timestamp - this._curr_timestamp; // the difference in unix timestamp

        this._timer               = this.start();

        return this;
    },

    /**
     * start our counter
     *
     * @returns {number}
     */
    start : function() {
        var _this = this;

        return setInterval( function(){ _this.tick(); }, _this._countdown_interval);
    },

    /**
     * called on every interval, initiated by start()
     */
    tick : function() {
        var _this = this;

        if( _this._internal_timestamp > 0 ) {
            _this._internal_timestamp -= 1;
            _this._countdown.text( _this.jsTimestampToTimeFormat( _this._internal_timestamp ) );

        } else {
            _this.timeisup();
        }
    },

    /**
     * Our time is up, undo the counter variable and hide the update shipping address div
     *
     * @returns {boolean}
     */
    timeisup : function() {
        var _this = this;

        _this._countdown_container.hide();
        clearTimeout( _this._timer );

        return false;
    },

    /**
     * Parse our js timestamp to our hours:minute:seconds format
     *
     * @param timestamp
     * @returns {string}
     */
    jsTimestampToTimeFormat(timestamp) {
        var date = new Date(timestamp * this._countdown_interval); // convert unix to js timestamp

        // it seems that the order createAt is generated via Varien_Date::now(), which is UTC based
        var hours   = "0" + date.getUTCHours();   // Hours part from the timestamp
        var minutes = "0" + date.getUTCMinutes(); // Minutes part from the timestamp
        var seconds = "0" + date.getUTCSeconds(); // Seconds part from the timestamp

        return hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2); // returns H:i:s
    }

} // pbSalesShippingAddressUpdateCountdown

$j(document).on('ready', function() {

    if( $j('body.sales-shippingaddress-edit').length > 0 ) { // on this page only please
        pbSalesShippingAddressEdit.init();
    }

    // if we the order shippung address update countdown widget anywhere
    if( $j('#shipping-address-update-countdown').length > 0 ) {
        window.shippingAddressUpdateCountdown = pbSalesShippingAddressUpdateCountdown.init();
    }
});