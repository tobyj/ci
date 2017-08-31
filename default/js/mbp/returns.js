/* globals dataForm, MageUrl, Base64, getUrlParams */

(function($) {
    "use strict";
    var doc = $(document);

    doc.on('ready', function() {

        var regex = /^(.+?)(\d+)$/i;
        var cloneIndex = $(".clonedInput").length;
        var $form = $("#mbp-returns-form");

        var urlVars = getUrlParams();

        if (urlVars.order_number) {
            $form.find('input[name="order_number"]').val(urlVars.order_number);
        }
        if (urlVars.email) {
            console.log(urlVars.email);
            $form.find('input[name="email"]').val(Base64.decode(decodeURIComponent(urlVars.email)));
        }

        $form.on("click", ".add-another", function(){
            cloneIndex++;
            $form.find('fieldset:first-of-type').clone()
                .hide() //optional
                .appendTo(".productlist")
                .attr("id", "clonedInput" +  cloneIndex)
                .slideDown() //optional
                .find("*")
                .each(function() {
                    var $this = $(this).removeClass('validation-error, validation-passed, validation-failed');
                    if ($this.is('legend')) {
                        $this.text('Product purchased #' + cloneIndex);
                        return;
                    }
                    if ($this.hasClass('validation-advice')) {
                        $this.remove();
                    }
                    if ($this.is('select') && $this.parent().hasClass('validation-error')) {
                        $this.parent().removeClass('validation-error');
                    }
                    if ($this.is('input')) {
                        $this.val('');
                    }
                    var id = this.id || "";
                    var label = $this.attr('for') || "";

                    var idMatch = id.match(regex) || [];
                    var labelMatch = label.match(regex) || [];
                    if (idMatch.length === 3) {
                        this.id = idMatch[1] + (cloneIndex);
                    }
                    if (labelMatch.length === 3) {
                        $this.attr('for', labelMatch[1] + (cloneIndex));
                    }
                });
        });

        $form.on("click", "button.remove", function(){
            $(this).parent().slideUp(function(){
                $(this).remove();
            });
        });

        $form.on("click", 'button[type="reset"]', function(){
            $form.find('fieldset').not(':first-of-type').remove();
            cloneIndex = 1;

            //remove validation messages and classes
            $form.find('.validation-advice').hide();
            $form.find('.validation-error, .validation-passed, .validation-failed').removeClass('validation-error validation-passed validation-failed')
            $form.find(':input:visible').first().focus();
        });

        $form.on("click", 'button[type="submit"]', function(e){
            e.preventDefault();
            if (dataForm.validator && dataForm.validator.validate()) {


                var output = '\n\n\n======== RETURN REQUEST: ========\n\n';
                var prodCount = 0;
                var data = $form.serializeArray();

                $.each(data, function (index, value) {
                    if (value.name === "reason_id[]") {
                        prodCount++;
                        output += "\n-------- PRODUCT RETURN #" + prodCount + ' --------\n';
                    }
                    if (value.name === "description") {
                        output += '\n';
                    }
                    if (value.name.substr(value.name.length - 2, value.name.length) === "[]") {
                        output += value.name.substr(0, value.name.length - 2);
                    } else {
                        output += value.name;
                    }
                    output += ': ' + value.value + '\n';
                });

                /**
                 * Append all output to description field - so Salesforce can consume easily
                 */
                $form.find('input[name="description"]').val(output);

                $form.submit();

                /**
                 * Submit via ajax not allowed from dev - No 'Access-Control-Allow-Origin' header is present
                 */
                /*
                $.ajax({
                    type: $form.attr('method'),
                    url: $form.attr('action'),
                    data: $form.serialize()
                }).done(function(data) {
                    console.log(data);
                    $.colorbox({html: '<h2>Return request received</h2><div style="white-space: pre">' + output + '</div>'});
                    $form.find('button[type="reset"]').click();
                }).fail(function(data) {
                    console.log(data);
                });
                */

            }
        });


        doc.on('click', 'a[href="#help-modal"]', function(e){
            e.preventDefault();
            $.colorbox({
                html: $('#help-modal').parent().html(),
                className: "colorbox-scrollable"
            });
        });

        /**
         * Catch MBP order numbers in guest returns form and redirect to here
         */
        doc.on('click', '#awrma-new-submit', function(e){

            var orderNo = $('#awrma-orderid').val(),
                /**
                 * MBP orders start with 110
                 */
                pattern = new RegExp("^110\\d+$");

            if (pattern.test(orderNo)) {
                e.preventDefault();
                window.location.href = MageUrl.base + "mbp/returns?order_number=" + orderNo + '&email=' + encodeURIComponent(Base64.encode($('#awrma-email').val()));
            }

        });

    });

}(jQuery));