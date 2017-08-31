this["JST"] = this["JST"] || {};

this["JST"]["js/delivery-estimate/delivery-estimate.hbs"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "un";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {}, alias2=container.lambda, alias3=container.escapeExpression;

  return "        <p><strong>"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || helpers.helperMissing).call(alias1,((stack1 = (depth0 != null ? depth0.standard : depth0)) != null ? stack1.price : stack1),"==","0.00",{"name":"compare","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "Standard shipping ($"
    + alias3(alias2(((stack1 = (depth0 != null ? depth0.standard : depth0)) != null ? stack1.price : stack1), depth0))
    + ")</strong><br>\n            <span>Order "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.cutoff : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + " to get your goodies delivered on "
    + alias3(alias2(((stack1 = (depth0 != null ? depth0.standard : depth0)) != null ? stack1.date : stack1), depth0))
    + ".</span></p>\n";
},"4":function(container,depth0,helpers,partials,data) {
    return "FREE ";
},"6":function(container,depth0,helpers,partials,data) {
    var helper;

  return "before "
    + container.escapeExpression(((helper = (helper = helpers.cutoff || (depth0 != null ? depth0.cutoff : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"cutoff","hash":{},"data":data}) : helper)));
},"8":function(container,depth0,helpers,partials,data) {
    return "now";
},"10":function(container,depth0,helpers,partials,data) {
    return "        <p>Sorry, standard shipping is temporarily unavailable.</p>\n";
},"12":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "        <p><strong>Express shipping ($"
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.express : depth0)) != null ? stack1.price : stack1), depth0))
    + ")</strong><br>\n            <span>Order "
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.cutoff : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.program(8, data, 0),"data":data})) != null ? stack1 : "")
    + " to get your goodies delivered on "
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.express : depth0)) != null ? stack1.date : stack1), depth0))
    + ".</span></p>\n";
},"14":function(container,depth0,helpers,partials,data) {
    return "        <p>Sorry, express shipping is temporarily unavailable.</p>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {};

  return "<h3>Delivery estimate for "
    + container.escapeExpression(((helper = (helper = helpers.postcode || (depth0 != null ? depth0.postcode : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"postcode","hash":{},"data":data}) : helper)))
    + "</h3>\n<div class=\"standard "
    + ((stack1 = helpers.unless.call(alias1,((stack1 = (depth0 != null ? depth0.standard : depth0)) != null ? stack1.status : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "available\">\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.standard : depth0)) != null ? stack1.status : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.program(10, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>\n<div class=\"express "
    + ((stack1 = helpers.unless.call(alias1,((stack1 = (depth0 != null ? depth0.express : depth0)) != null ? stack1.status : stack1),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "available\">\n"
    + ((stack1 = helpers["if"].call(alias1,((stack1 = (depth0 != null ? depth0.express : depth0)) != null ? stack1.status : stack1),{"name":"if","hash":{},"fn":container.program(12, data, 0),"inverse":container.program(14, data, 0),"data":data})) != null ? stack1 : "")
    + "</div>";
},"useData":true});