(function($){

    $(document).on('submit', '#giftcard-form', function(event) {

        var giftcardForm = new VarienForm($(this)[0]);
        if (giftcardForm.validator && !giftcardForm.validator.validate()) {
            return false;
        }

        if (!$('#giftcard_pin_checked').val()) {
            event.stopPropagation();
            event.preventDefault();
            $('#giftcard_pin').val('');
            new Ajax.Request($('#giftcard-pin-form').data('ajax-pinreq'), {
                parameters: { giftcard_code:$('#giftcard_code').val() },
                onComplete: function(data) {
                    if (data.responseJSON.result) {
                        pinPrompt($('#giftcard_pin_prompt').html(), function() {
                            $('#giftcard_pin_checked').val(1);
                            $('#giftcard-form').submit();
                        });
                    } else {
                        $('#giftcard_pin_checked').val(1);
                        $('#giftcard-form').submit();
                    }
                }
            });
        }
    });

    $(document).on('click', '.check-gc-status', function(e) {
        e.preventDefault();

        var giftcardForm = new VarienForm($(this)[0]);
        if (giftcardForm.validator && !giftcardForm.validator.validate()) {
            return false;
        }

        $('#giftcard_pin').val('');
        new Ajax.Request(
            $('#giftcard-pin-form').data('ajax-pinreq'),
            {
                onCreate:   function() { $('#gc-please-wait').show(); },
                onComplete: function(data) {
                    if (data && data.responseJSON && data.responseJSON.result == false) {
                        giftCardQuickCheck();
                    } else {
                        pinPrompt($('#giftcard_pin_prompt').html(), giftCardQuickCheck);
                    }
                },
                parameters : {giftcard_code : $('#giftcard_code').val() }
            }
        );
    });

    $(document).on('submit', '#cboxContent #giftcard-pin-form', function(event) {
        event.stopPropagation();
        event.preventDefault();

        var pform = new VarienForm($(this)[0]);
        if (!pform.validator.validate()) return false;

        $('#giftcard_pin').val($('#cboxContent #gc_pin').val());
        $.colorbox.close();
    });

    function giftCardQuickCheck() {
        new Ajax.Updater(
            'giftcard_balance_lookup',
            $('#giftcard_balance_lookup').data('ajax-quickcheck'),
            {
                onComplete: function() { $('#gc-please-wait').hide(); },
                parameters: { giftcard_code: $('#giftcard_code').val(),
                              giftcard_pin:  $('#giftcard_pin').val() }
            }
        );
    }

}(jQuery));


// Reference functions used in Checkout
function giftCardPinCheck(giftcard_code, url, prompt_html, callback) {
    new Ajax.Request(url, {
        parameters: {giftcard_code:giftcard_code},
        onComplete: function(data) {
            if (!data.responseJSON.result) {
                callback();
            } else {
                pinPrompt(prompt_html, callback);
            }
        }
    });
}

function pinPrompt(prompt_html, callback) {
    if (typeof callback === 'function') {
        $j.colorbox({
            html:prompt_html,
            closeButton:false,
            onComplete: function(c) { $j('#cboxContent #gc_pin').first().focus(); },
            onCleanup:callback
        });
    }
}

function show_giftcard_invalid() {
    $j.colorbox({html: $j('#gift-card-not-valid-content').html()});
}
