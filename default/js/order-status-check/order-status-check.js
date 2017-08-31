/*globals jQuery, Handlebars, dataLayer, JST*/

/*Note: Run grunt magento/skin/frontend/pacbrands/default if modifying*/

(function($) {
    "use strict";

    $(document).on('ready', function () {

        var $order_status_check = $('.order-status-check');

        Handlebars.registerHelper('tracking_link', function(trackingid, carrier) {
            trackingid = Handlebars.Utils.escapeExpression(trackingid);
            carrier = Handlebars.Utils.escapeExpression(carrier);

            var url = "",
                text = trackingid,
                result;

            switch(carrier) {
                case "eparcel":
                    url = "https://auspost.com.au/parcels-mail/track.html#/track?id=" + trackingid;
                    text = "<i class='i_auspost'></i> " + trackingid;
                    break;
                case "dhlint":
                    url = "http://www.dhl.com.au/en/express/tracking.html?AWB=" + trackingid + "&brand=DHL";
                    text = "DHL: " + trackingid;
                    break;
            }

            if (url) {
                result = "<a target='_blank' href='" + url + "'>" + text + "</a>";
            } else {
                result = "<span class='carrier-" + carrier + "'>" + trackingid + "</span>";
            }

            return new Handlebars.SafeString(result);
        });
        Handlebars.registerHelper('status_detail', function(status, tracking) {
            status = Handlebars.Utils.escapeExpression(status);
            var result;

            if (status === "processing" && tracking.length) {
                status = "short-shipped";
            }

            switch(status) {
                case "processing":
                    result = "Your order is being picked & packed.";
                    break;
                case "short-shipped":
                    result = "Only part of your order has been shipped.";
                    break;
                case "holded":
                    result = "You may be contacted to confirm order or address details.";
                    break;
                case "in-transit":
                    result = "Your order has left the warehouse and is en route for delivery.";
                    break;
                case "complete":
                    result = "";
                    break;
                default:
                    result = "";
            }

            return new Handlebars.SafeString(result);
        });
        Handlebars.registerHelper('better_status', function(status, tracking) {
            status = Handlebars.Utils.escapeExpression(status);

            if (status === "processing" && tracking.length) {
                status = "partially shipped";
            } else if (status === "holded") {
                status = "on hold";
            }

            return new Handlebars.SafeString(status);
        });

        $order_status_check.on('click', '.btn', function(){

            var $results_div = $order_status_check.find('.order-status-results');

            if (!($order_status_check.find('input[name="order"]').val() && $order_status_check.find('input[name="postcode"]').val())) {
                $order_status_check.addClass('error');
                $results_div.text('Please enter a valid order number and delivery postcode.');
                return;
            }

            var $form_key = $order_status_check.find('input[name="form_key"]');
            var $btn = $(this).prop('disabled', true);
            var now,epoch,show_msg;
            $order_status_check.removeClass('error').addClass('isloading');

            $.when(
                //get current time from server with client fallback:
                $.ajax({url: "/timestamp.php",dataType:'text',cache:false})
                    .done(function(data) {
                        epoch = data*1;
                        now = new Date(epoch);
                    })
                    .fail(function() {
                        now = new Date();
                        epoch = Math.round(now.getTime());
                    }),

                $.ajax({
                    url: $form_key.data('baseUrl') + 'pacbrands_sales/order/status',
                    data: $order_status_check.find(':input').serializeArray(),
                    dataType: 'json',
                    method: 'post'})
                    .done(function(data) {
                        //console.log(data);
                        var template = JST["js/order-status-check/order-status-check.hbs"];
                        $results_div.html(template(data));
                    })
                    .fail(function(xhr) {
                        $order_status_check.addClass('error');
                        if (xhr.status === 400) {
                            $results_div.text(xhr.responseText);
                        } else if (xhr.status === 404) {
                            $results_div.html('<strong>Order not found.</strong><br>Please confirm details and try again. Note: Only orders placed in the last 60 days can be checked.');
                        } else {
                            $results_div.text('There was an error retrieving your order details. Please check your order number and postcode and try again.');
                        }
                        console.log(xhr);
                    })

            ).then(function(data1, data2) {
                //all success
                if (!data2[0].tracking.length) {
                    return;
                }
                var shipped_ms = Math.round(new Date(data2[0].tracking.slice(-1)[0].shipped_date).getTime());
                show_msg = (epoch - shipped_ms) < (3600 * 6 * 1000); //true if dispatched less than 6 hours ago
                $order_status_check.toggleClass('show-tracking-warning', show_msg);
            }, function(xhr, status, error) {
                //fail
            }).always(function(){
                $order_status_check.removeClass('isloading');
                $btn.prop('disabled', false);
            });

        }).on('keydown', 'input', function(e){
            if (e.keyCode === 13) {
                // enter key was pressed
                e.preventDefault();
                $order_status_check.find('.btn').not(':disabled').click();
            } else {
                $order_status_check.removeClass('error');
            }
        });

    });//doc ready

}(jQuery));