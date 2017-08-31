/*globals jQuery, Handlebars, dataLayer, JST*/

/*Note: Run grunt magento/skin/frontend/pacbrands/default if modifying*/
(function($) {
    "use strict";

        var $delivery_estimate = $('.delivery-estimate'),
            $postcode = $delivery_estimate.find('input[name="postcode"]'),
            storedData = $.jStorage.get('pbDeliverEstimate');

        function showEstimate(data, results_div, cached) {
            var template = JST["js/delivery-estimate/delivery-estimate.hbs"];
            results_div.html(template(data));
            if (cached) {
                $delivery_estimate.removeClass('isloading');
                $delivery_estimate.find('.btn').prop('disabled', false);
            }
        }

        if (storedData) {
            $postcode.val(storedData.postcode);
        }

        $delivery_estimate.on('click', '.btn', function(e){

            var $btn = $(this).prop('disabled', true),
                $delivery_estimate = $btn.closest('.delivery-estimate'),
                $results_div = $delivery_estimate.find('.results'),
                $postcode = $delivery_estimate.find('input[name="postcode"]');

            var postcode_regex = new RegExp("^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$");
            storedData = $.jStorage.get('pbDeliverEstimate');

            if (!postcode_regex.test($postcode.val())) {
                $delivery_estimate.addClass('error');
                $results_div.text('Please enter a valid Australian postcode.');
                return;
            }

            if (storedData && storedData.postcode === $postcode.val()) {
                showEstimate(storedData, $results_div, true);
                return;
            }

            var $form_key = $delivery_estimate.find('input[name="form_key"]');
            $btn.prop('disabled', true);
            $delivery_estimate.removeClass('error').addClass('isloading');

            $.ajax({
                url: $form_key.data('baseUrl') + 'auspost/delivery/date',
                data: $delivery_estimate.find(':input').serializeArray(),
                dataType: 'json',
                method: 'post'})
                .done(function(data) {
                    //console.log(data);
                    $.extend(true, data, {postcode: $postcode.val(), cutoff: $delivery_estimate.attr('data-cutoff'), standard: {price: $delivery_estimate.attr('data-standard-price')}});
                    $.jStorage.set('pbDeliverEstimate', data, {TTL: 60 * 60 * 1000});
                    showEstimate(data, $results_div, false);
                })
                .fail(function(xhr) {
                    $delivery_estimate.addClass('error');
                    console.log(xhr);
                    if (xhr && xhr.responseJSON) {
                        $results_div.text(xhr.responseJSON.message);
                    } else {
                        $results_div.text('There was an error fetching your delivery estimate.');
                    }
                }).always(function(){
                $delivery_estimate.removeClass('isloading');
                $btn.prop('disabled', false);
            });

        }).on('keyup', 'input', function(e){
            if (e.keyCode === 13) {
                // enter key was pressed
                e.preventDefault();
                var $btn = $(this).closest('.delivery-estimate').find('.btn').not(':disabled');
                $btn.click();
            }
        });

}(jQuery));