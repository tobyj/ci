this["JST"] = this["JST"] || {};

this["JST"]["js/quickcheckout/summary.hbs"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return " BEFORE DISCOUNTS";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.discounts : stack1),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(6, data, 0),"data":data})) != null ? stack1 : "")
    + " GIFT CARDS";
},"4":function(container,depth0,helpers,partials,data) {
    return " &";
},"6":function(container,depth0,helpers,partials,data) {
    return " BEFORE";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "    <div class=\"discounts\">\n        <input type=\"checkbox\" id=\"toggleDiscounts"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.instance : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">\n        <label for=\"toggleDiscounts"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.instance : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\">DISCOUNTS</label>\n        <div class=\"amount\" data-ajax-discounts-total data-show-val=\""
    + alias3((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias2).call(alias1,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.discount : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\">"
    + alias3((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias2).call(alias1,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.discount : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</div>\n        <div class=\"all\">\n"
    + ((stack1 = helpers.each.call(alias1,((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.discounts : stack1),{"name":"each","hash":{},"fn":container.program(11, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </div>\n    </div>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var helper;

  return container.escapeExpression(((helper = (helper = helpers.instance || (depth0 != null ? depth0.instance : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"instance","hash":{},"data":data}) : helper)));
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "                <div class=\"discount\" data-id=\""
    + alias4(((helper = (helper = helpers.identifier || (depth0 != null ? depth0.identifier : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"identifier","hash":{},"data":data}) : helper)))
    + "\" data-store-code=\""
    + alias4(((helper = (helper = helpers.store_code || (depth0 != null ? depth0.store_code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"store_code","hash":{},"data":data}) : helper)))
    + "\" data-type=\""
    + alias4(((helper = (helper = helpers.type || (depth0 != null ? depth0.type : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data}) : helper)))
    + "\" data-method=\""
    + alias4(((helper = (helper = helpers.method || (depth0 != null ? depth0.method : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"method","hash":{},"data":data}) : helper)))
    + "\" data-method-amount=\""
    + alias4(((helper = (helper = helpers.method_amount || (depth0 != null ? depth0.method_amount : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"method_amount","hash":{},"data":data}) : helper)))
    + "\" title=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\">\n                    <div class=\"desc\" "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.code : depth0),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "><i class=\"mbp-on-only q_"
    + alias4(((helper = (helper = helpers.store_code || (depth0 != null ? depth0.store_code : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"store_code","hash":{},"data":data}) : helper)))
    + "\"></i> "
    + alias4(((helper = (helper = helpers.label || (depth0 != null ? depth0.label : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"label","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.code : depth0),{"name":"if","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n                    <div class=\"amount\" data-ajax-discount data-show-val=\"-"
    + alias4((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias2).call(alias1,(depth0 != null ? depth0.value : depth0),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\">SAVE "
    + alias4((helpers.formatcurrency || (depth0 && depth0.formatcurrency) || alias2).call(alias1,(depth0 != null ? depth0.value : depth0),{"name":"formatcurrency","hash":{},"data":data}))
    + "</div>\n                </div>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var helper;

  return "data-code=\""
    + container.escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"code","hash":{},"data":data}) : helper)))
    + "\"";
},"14":function(container,depth0,helpers,partials,data) {
    var helper;

  return " ["
    + container.escapeExpression(((helper = (helper = helpers.code || (depth0 != null ? depth0.code : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"code","hash":{},"data":data}) : helper)))
    + "]";
},"16":function(container,depth0,helpers,partials,data) {
    return "In Store";
},"18":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "TO "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.country : stack1), depth0));
},"20":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<input type=\"hidden\" name=\"shipping_method\" value=\""
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.method : stack1), depth0))
    + "\">";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.escapeExpression;

  return "    <div class=\"giftbox\">\n        <div>\n            <b>Gift Box (Incl. Tax) <a class=\"giftbox_remove remove\" title=\"Remove Gift Box\" href=\"#removegiftbox\"><i class=\"q_cross\"></i></a></b>\n        </div>\n        <div class=\"amount\" data-giftbox-cost=\""
    + alias1(container.lambda(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.giftwrapping : stack1)) != null ? stack1.value : stack1), depth0))
    + "\">"
    + alias1((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.giftwrapping : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</div>\n    </div>\n";
},"24":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "    <div class=\"giftcards\">\n"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : {},((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.giftcardaccount : stack1),{"name":"each","hash":{},"fn":container.program(25, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    </div>\n";
},"25":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression, alias4="function";

  return "            <div><b>"
    + alias3((helpers.formatcurrency || (depth0 && depth0.formatcurrency) || alias2).call(alias1,(depth0 != null ? depth0.total : depth0),{"name":"formatcurrency","hash":{},"data":data}))
    + " Gift card</b> <span class=\"code\">"
    + alias3(((helper = (helper = helpers.number || (depth0 != null ? depth0.number : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"number","hash":{},"data":data}) : helper)))
    + "</span> <a class=\"remove full-only\" title=\"Remove Gift Card\" href=\"#removegiftcard\" data-cardno=\""
    + alias3(((helper = (helper = helpers.number || (depth0 != null ? depth0.number : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"number","hash":{},"data":data}) : helper)))
    + "\" data-expiry=\""
    + alias3(((helper = (helper = helpers.expiry || (depth0 != null ? depth0.expiry : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"expiry","hash":{},"data":data}) : helper)))
    + "\"><i class=\"q_cross\"></i></a>\n                <div class=\"amount\" data-ajax-giftcards data-show-val=\"-"
    + alias3(((helper = (helper = helpers.applied || (depth0 != null ? depth0.applied : depth0)) != null ? helper : alias2),(typeof helper === alias4 ? helper.call(alias1,{"name":"applied","hash":{},"data":data}) : helper)))
    + "\">-"
    + alias3((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias2).call(alias1,(depth0 != null ? depth0.applied : depth0),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</div></div>\n";
},"27":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : {}, alias3=helpers.helperMissing;

  return "<div class=\"storecredit\">\n    <div><b>"
    + alias1(container.lambda(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.customerbalance : stack1)) != null ? stack1.title : stack1), depth0))
    + "</b>"
    + ((stack1 = helpers["if"].call(alias2,((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.customerbalance : stack1)) != null ? stack1.remaining : stack1),{"name":"if","hash":{},"fn":container.program(28, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + " <a class=\"remove full-only\" href=\"#removestorecredit\" title=\"Remove "
    + alias1((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias3).call(alias2,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.customerbalance : stack1)) != null ? stack1.title : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\"><i class=\"q_cross\"></i></a></div>\n    <div class=\"amount\" data-show-val=\""
    + alias1((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias3).call(alias2,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.customerbalance : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\"><span>"
    + alias1((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias3).call(alias2,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.customerbalance : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</span></div>\n</div>\n";
},"28":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<span> (Balance "
    + container.escapeExpression((helpers.formatcurrency || (depth0 && depth0.formatcurrency) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.customerbalance : stack1)) != null ? stack1.remaining : stack1),{"name":"formatcurrency","hash":{},"data":data}))
    + ")</span>";
},"30":function(container,depth0,helpers,partials,data) {
    var helper;

  return " "
    + container.escapeExpression(((helper = (helper = helpers.currency || (depth0 != null ? depth0.currency : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"currency","hash":{},"data":data}) : helper)))
    + " excl. import taxes+fees";
},"32":function(container,depth0,helpers,partials,data) {
    var stack1;

  return ((stack1 = (helpers.compare || (depth0 && depth0.compare) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.tax : stack1)) != null ? stack1.value : stack1),"!=","0.00",{"name":"compare","hash":{},"fn":container.program(33, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"33":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.escapeExpression;

  return " INC <span data-ajax-tax>"
    + alias1((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || helpers.helperMissing).call(depth0 != null ? depth0 : {},((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.tax : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + " "
    + alias1(container.lambda(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.tax : stack1)) != null ? stack1.title : stack1), depth0))
    + "</span>";
},"35":function(container,depth0,helpers,partials,data) {
    return "<button type=\"button\" class=\"button btn btn_full proceed-checkout\">PROCEED TO CHECKOUT</button>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : {}, alias4=helpers.helperMissing;

  return "<div class=\"total-before-discounts\">\n    <div><b><span data-ajax-totalitems data-show-val=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.item_count : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.item_count : stack1), depth0))
    + "</span></b>"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.discounts : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ((stack1 = helpers["if"].call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.giftcardaccount : stack1)) != null ? stack1.value : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n    <div class=\"amount\" data-total-before-discount>"
    + alias2((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias4).call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.subtotal : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</div>\n</div>\n\n"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.discounts : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n<div class=\"shipping\">\n    <div>\n        <b title=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.method : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.shipping : stack1)) != null ? stack1.title : stack1), depth0))
    + "</b> "
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias4).call(alias3,((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.method : stack1),"==","clickcollect_store",{"name":"compare","hash":{},"fn":container.program(16, data, 0),"inverse":container.program(18, data, 0),"data":data})) != null ? stack1 : "")
    + "\n        <span class=\"mbp-on-only mbp-flag your-country-flag trigger-flag-modal triggered-from-cart allowed\"><i class=\"q_cross\"></i><i class=\"q_checkmark\"></i><img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.MageUrl : depth0)) != null ? stack1.skin : stack1), depth0))
    + "../default/images/flags/"
    + alias2((helpers.toLowerCase || (depth0 && depth0.toLowerCase) || alias4).call(alias3,((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.country : stack1),{"name":"toLowerCase","hash":{},"data":data}))
    + ".png\"></span>\n    </div>\n    <div class=\"amount\" data-ajax-shipping data-show-val=\""
    + alias2((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias4).call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.shipping : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\" data-rate=\""
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.shipping : stack1)) != null ? stack1.method : stack1), depth0))
    + "\"><span>"
    + alias2((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias4).call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.shipping : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "</span></div>\n</div>\n\n"
    + ((stack1 = helpers["if"].call(alias3,(depth0 != null ? depth0.instance : depth0),{"name":"if","hash":{},"fn":container.program(20, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n\n\n"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.giftwrapping : stack1)) != null ? stack1.value : stack1),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.giftcardaccount : stack1)) != null ? stack1.value : stack1),{"name":"if","hash":{},"fn":container.program(24, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers["if"].call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.customerbalance : stack1)) != null ? stack1.value : stack1),{"name":"if","hash":{},"fn":container.program(27, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n<div class=\"grandtotal\">\n    <div><b>TOTAL</b>\n        "
    + ((stack1 = helpers.unless.call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.tax : stack1)) != null ? stack1.value : stack1),{"name":"unless","hash":{},"fn":container.program(30, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n        "
    + ((stack1 = helpers["if"].call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.tax : stack1)) != null ? stack1.value : stack1),{"name":"if","hash":{},"fn":container.program(32, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n    </div>\n    <div class=\"amount\" data-ajax-grandtotal data-show-val=\""
    + alias2((helpers.formatcurrencyNoSymbol || (depth0 && depth0.formatcurrencyNoSymbol) || alias4).call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.grand_total : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrencyNoSymbol","hash":{},"data":data}))
    + "\"><span>"
    + alias2((helpers.formatcurrency || (depth0 && depth0.formatcurrency) || alias4).call(alias3,((stack1 = ((stack1 = ((stack1 = (depth0 != null ? depth0.summary : depth0)) != null ? stack1.totals : stack1)) != null ? stack1.grand_total : stack1)) != null ? stack1.value : stack1),{"name":"formatcurrency","hash":{},"data":data}))
    + "</span></div>\n</div>\n\n"
    + ((stack1 = helpers.unless.call(alias3,(depth0 != null ? depth0.instance : depth0),{"name":"unless","hash":{},"fn":container.program(35, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "");
},"useData":true});