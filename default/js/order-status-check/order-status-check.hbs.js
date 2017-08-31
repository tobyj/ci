this["JST"] = this["JST"] || {};

this["JST"]["js/order-status-check/order-status-check.hbs"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : {};

  return "        "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.dispatch : depth0),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n        "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.delivery : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"dispatch-est hidden\"><span class=\"date-label\">Dispatch estimate:</span> <strong>"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.dispatch : depth0)) != null ? stack1.estimate : stack1), depth0))
    + "</strong></div>";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<div class=\"delivery-est\"><span class=\"date-label\">Delivery estimate:</span> <strong>"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.delivery : depth0)) != null ? stack1.estimate : stack1)) != null ? stack1.date : stack1), depth0))
    + "</strong></div>";
},"6":function(container,depth0,helpers,partials,data) {
    return "<div class=\"tracking\">Track your delivery:<ul>";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3=container.escapeExpression;

  return "        <li>"
    + alias3((helpers.tracking_link || (depth0 && depth0.tracking_link) || alias2).call(alias1,(depth0 != null ? depth0.tracking_number : depth0),(depth0 != null ? depth0.tracking_carrier : depth0),{"name":"tracking_link","hash":{},"data":data}))
    + "\n            <div>Shipped: <strong>"
    + alias3(((helper = (helper = helpers.shipped_date_pretty || (depth0 != null ? depth0.shipped_date_pretty : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"shipped_date_pretty","hash":{},"data":data}) : helper)))
    + "</strong></div>\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.delivery_estimate : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </li>\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression;

  return "                <div>Delivery Estimate ("
    + alias2(alias1(((stack1 = (depth0 != null ? depth0.delivery_estimate : depth0)) != null ? stack1.method : stack1), depth0))
    + "): <strong>"
    + alias2(alias1(((stack1 = ((stack1 = (depth0 != null ? depth0.delivery_estimate : depth0)) != null ? stack1.estimate : stack1)) != null ? stack1.date : stack1), depth0))
    + "</strong></div>\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "</ul></div>";
},"13":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<p class=\"no-tracking\">Your order does not "
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || helpers.helperMissing).call(depth0 != null ? depth0 : {},(depth0 != null ? depth0.status : depth0),"!==","complete",{"name":"compare","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "have tracking details.</p>";
},"14":function(container,depth0,helpers,partials,data) {
    return "yet ";
},"16":function(container,depth0,helpers,partials,data) {
    return "On Hold";
},"18":function(container,depth0,helpers,partials,data) {
    return "Processing";
},"20":function(container,depth0,helpers,partials,data) {
    var stack1;

  return " title=\"Dispatch estimate: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? depth0.dispatch : depth0)) != null ? stack1.date_pretty : stack1), depth0))
    + "\"";
},"22":function(container,depth0,helpers,partials,data) {
    var stack1;

  return " title=\"Delivery estimate: "
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = (depth0 != null ? depth0.delivery : depth0)) != null ? stack1.estimate : stack1)) != null ? stack1.date : stack1), depth0))
    + "\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda;

  return "<h2>Order #"
    + alias4(((helper = (helper = helpers.number || (depth0 != null ? depth0.number : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"number","hash":{},"data":data}) : helper)))
    + "</h2>\n<div class=\"l_two_thirds l_tablet_two_thirds l_mobile_full arrow-right\">\n    <div class=\"status\">Order Status: <strong>"
    + alias4((helpers.better_status || (depth0 && depth0.better_status) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),(depth0 != null ? depth0.tracking : depth0),{"name":"better_status","hash":{},"data":data}))
    + "</strong> <em>"
    + alias4((helpers.status_detail || (depth0 && depth0.status_detail) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),(depth0 != null ? depth0.tracking : depth0),{"name":"status_detail","hash":{},"data":data}))
    + "</em></div>\n    <div class=\"placed\"><span class=\"date-label\">Placed on:</span> <strong>"
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.placed : depth0)) != null ? stack1.date_pretty : stack1), depth0))
    + "</strong></div>\n"
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),"!=","holded",{"name":"compare","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.tracking : depth0),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = helpers.each.call(alias1,(depth0 != null ? depth0.tracking : depth0),{"name":"each","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "    <div class=\"tracking-warning\"><strong>Tracking number not working?</strong> Please allow 3-6 hours after dispatch (see \"Shipped\" date above) for your tracking number to be scanned and become active.</div>\n    "
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.tracking : depth0),{"name":"if","hash":{},"fn":container.program(11, data, 0),"inverse":container.program(13, data, 0),"data":data})) != null ? stack1 : "")
    + "\n</div>\n<div class=\"l_third l_tablet_third l_mobile_full l_last status-"
    + alias4(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"status","hash":{},"data":data}) : helper)))
    + "\">\n    <ul class=\"order-progress\">\n        <li title=\"Placed: "
    + alias4(alias5(((stack1 = (depth0 != null ? depth0.placed : depth0)) != null ? stack1.date_pretty : stack1), depth0))
    + "\"><i class=\"i_checkmark\"></i> Placed</li>\n        <li><i class=\"i_package\"></i> "
    + ((stack1 = (helpers.compare || (depth0 && depth0.compare) || alias2).call(alias1,(depth0 != null ? depth0.status : depth0),"==","holded",{"name":"compare","hash":{},"fn":container.program(16, data, 0),"inverse":container.program(18, data, 0),"data":data})) != null ? stack1 : "")
    + "</li>\n        <li"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.dispatch : depth0),{"name":"if","hash":{},"fn":container.program(20, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "><i class=\"i_van\"></i> In Transit</li>\n        <li"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.delivery : depth0),{"name":"if","hash":{},"fn":container.program(22, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "><i class=\"i_box\"></i> Complete</li>\n    </ul>\n</div>";
},"useData":true});