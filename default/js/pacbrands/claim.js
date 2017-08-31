/**
 *
 **/
function refundCash(history_id, url)
{
    $('message_' + history_id).hide();
    if (!validateCashRefund(history_id)) {
        return false;
    }

    cashRefund(history_id, $('cashrefund_' + history_id).value, url);

    return true;
}

/**
 * validate user input value
 **/
function validateCashRefund(history_id)
{
    var min = parseFloat(0);
    var max = parseFloat($('availablecash_' + history_id).value);
    var input = parseFloat($('cashrefund_' + history_id).value);

    if (input <= min) {
        displayMsg(history_id, 'error', 'Error: cash value less than ' + min);
        return false;
    }

    if (input > max) {
        displayMsg(history_id, 'error', 'Error: cash value more than ' + max);
        return false;
    }

    return true;
}

/**
 * ajax call to refund cash
 **/
function cashRefund(history_id, refund_value, url)
{
    $('sc-please-wait-' + history_id).show();
    new Ajax.Request(url, {
            parameters: {history_id: history_id, refund_value: refund_value},
            method: 'POST',
            onComplete: function(transport) {
            $('sc-please-wait-' + history_id).hide();
            if(transport.status == 200) {
                var result = transport.responseText.evalJSON();
                if(!result.success) {
                    $('refund_' + history_id).show();
                    if (result.error_msg) {
                        displayMsg(history_id, 'error', result.error_msg);
                    } else {
                        displayMsg(history_id, 'error', 'Error: processing refund failed');
                    }
                } else {
                    //if remaining balance greater than zero
                    //then show the input with the new balance
                    if (result.balance > 0) {
                        $('cashrefund_' + history_id).setValue(result.balance);
                        $('availablecash_' + history_id).setValue(result.balance);
                    }else {
                        $('refund_' + history_id).hide();
                    }
                    displayMsg(history_id, 'confirm', 'Success: refund has been processed');
                }
            } else {
                displayMsg(history_id, 'error', 'Error: server processing failure');
            }
        }
    });

    return false;
}

/**
 * display error msg
 **/
function displayMsg(history_id, type, msg)
{
    var lable = $('message_' + history_id);

    if (type == 'error') {
        if (lable.hasClassName('confirm')) {
            lable.removeClassName('confirm');
        }
        lable.addClassName('error_note');
    }

    if (type == 'confirm') {
        if (lable.hasClassName('error_note')) {
            lable.removeClassName('error_note');
        }
        lable.addClassName('confirm');
    }

    lable.update(msg);
    lable.show();
}
