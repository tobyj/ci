

(function($) {

// Backward compatability for jquery-ui and newer jquery -oo
if ( !jQuery.isFunction( jQuery.curCSS ) )
  jQuery.curCSS = jQuery.css;

var Stockists = {

    initialize: function() {

        $('div.noscript').hide();
        $('div.sidebar').show();
        if($('input.searchStockist').length > 0) Stockists.setupAddForm(STOCKISTS_CONFIGURATION);
        //Set & update width for google maps window on browser resize
        $(window).bind("resize", resizeWindow);
        resizeWindow();

        function resizeWindow() {
            var fullWidth = $("#stockistContent div.stockists").width();
			var sMapPadding = parseInt($('#s-map').css('padding-left')) + parseInt($('#s-map').css('padding-right'));
			var sMapMargin = parseInt($('#s-map').css('margin-left')) + parseInt($('#s-map').css('margin-right'));
            var sidebarWidth = $("#stockistContent div.stockists div.sidebar").innerWidth();
            var mapDiv = $("#s-map");
            mapDiv.width(fullWidth - sidebarWidth - sMapPadding - sMapMargin);
        }


        // Define global markers and stockists array
        markersArray = [];
        stockistsObject = {};
		markerCluster = {};

        // Set up geocoder
        geocoder = new google.maps.Geocoder();
        var initialLocation = new google.maps.LatLng(-29.24469, 145.19531);

        // Set up map options
        var options = {
            zoom: 4,
            center: initialLocation,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            scrollwheel: false,
            mapTypeControl: false
        };

        // Initialize map
        map = new google.maps.Map(document.getElementById("s-map"), options);
        infowindow = new google.maps.InfoWindow({
            maxWidth: 400
        });

        google.maps.event.addListener(infowindow, 'closeclick', function() {
            $('div.stockist').removeClass('selected');
        });

        Stockists.setupSearchForm();
        Stockists.getStockists();

    },

    setupSearchForm: function() {
        var countrybounds = new google.maps.LatLngBounds( new google.maps.LatLng('-48', '108'), new google.maps.LatLng('-9.4', '155') );

        $("input#searchStockist").autocomplete({

            // Append to id if available, otherwise default behaviour
            appendTo: ($('#stockistAutoCompleteContainer').length?'#stockistAutoCompleteContainer':'body'),

            source: function(request, response) {
                geocoder.geocode({
                    'bounds': countrybounds,
                    'region': 'au',
                    'address': request.term
                }, function(results, status) {

                    response($.map(results, function(item) {
                        // AT: we sometimes get blank entries, so skip these
                        if (!item.formatted_address) return;
                        var autopoint = new google.maps.LatLng(item.geometry.location.lat(), item.geometry.location.lng());
                        if ( countrybounds.contains( autopoint ) )
                        return {
                            label: item.formatted_address,
                            value: item.formatted_address,
                            latitude: item.geometry.location.lat(),
                            longitude: item.geometry.location.lng(),
                            bounds: item.geometry.bounds
                        }
                    }));
                })
            },

            //This bit is executed upon selection of an address
            select: function(event, ui) {
                var location = new google.maps.LatLng(ui.item.latitude, ui.item.longitude);
                map.setCenter(location);
                if(ui.item.bounds) {
                    map.fitBounds(ui.item.bounds);
                } else {
                    map.setZoom(14);
                }

                // TWW Random Mod
                var skinUrl  = $("input#skinUrl").val();
                var splitChk = skinUrl.split("/");
                if ((jQuery.inArray("totallyworkwear", splitChk) > -1) ||
                    (jQuery.inArray("tww", splitChk) > -1)) {
                    map.setZoom(10);
                }
            }

        });

        $("input#searchStockist").focus(function() {
            if($("input#searchStockist").val() == 'Suburb or postcode' ||
               $("input#searchStockist").val() == $("input#searchStockist").attr('defaulttext') )
                $("input#searchStockist").val('');
        });
        $("input#searchStockist").focusout(function() {
            if($("input#searchStockist").val().length == 0){
              $("input#searchStockist").val('Suburb or postcode');
              if ( $("input#searchStockist").attr('defaulttext') ) {
                $("input#searchStockist").val( $("input#searchStockist").attr('defaulttext') );
              }
            }
        });
        $('form.search').submit(function() {
            var search = $(this).find('input.searchStockist');
            switch(search.val()) {
                case STOCKISTS_CONFIGURATION['input']['message']:
                case "":
                    search.focus();
                    return false;
                    break;
            }

            Stockists.searchStockists(search.val());
            return false;
        });

    },    setupAddForm: function(CONFIGURATION) {    

        $.each(CONFIGURATION, function(key, value){
            $("." + value.formclass).addClass('fallback').val(value.message).focusin(function(){
                if($(this).val() == value.message) $(this).removeClass('fallback').val("");
            }).focusout(function(){
                if($(this).val() == "") $(this).addClass('fallback').val(value.message);
            });
        });

        if(CONFIGURATION['input']['class'] == 'signup') {
            $('form#SignupAddForm').submit(function() {
                var signup = $(this).find('input.signup');
                switch(signup.val()) {
                    case CONFIGURATION['input']['message']:
                    case "":
                        signup.focus();
                        return false;
                        break;
                }
            });
        }

    },

    searchStockists: function(search) {

        geocoder.geocode( {
            'address': search,
            'bounds': new google.maps.LatLngBounds(new google.maps.LatLng('-48', '108'), new google.maps.LatLng('-9.4', '155')),
            'region': 'au'
            }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                if(results[0].geometry.bounds) {
                    map.fitBounds(results[0].geometry.bounds);
                } else {
                    map.setZoom(14);
                }

                // TWW Random Mod
                var skinUrl  = $("input#skinUrl").val();
                var splitChk = skinUrl.split("/");
                if ((jQuery.inArray("totallyworkwear", splitChk) > -1) ||
                    (jQuery.inArray("tww", splitChk) > -1)) {
                    map.setZoom(10);
                }

            } else {

                var result  = '<div id="stockistContent">';

                switch(status) {
                    case google.maps.GeocoderStatus.ZERO_RESULTS:
                        result += '<h1>Location not found\n\n</h1>';
                        result += '<p>Please enter a suburb, city, state or postcode.</p>';
                        break;
                    case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                        result += '<h1>Service temporarily unavailable.\n\n</h1>';
                        result += '<p>Please wait before searching again.</p>';
                        break;
                    case google.maps.GeocoderStatus.REQUEST_DENIED:
                        result += '<h1>Service temporarily unavailble.\n\n</h1>';
                        result += '<p>Please contact us or try again later.</p>';
                        break;
                    case google.maps.GeocoderStatus.INVALID_REQUEST:
                        result += '<h1>Location not found.\n\n</h1>';
                        result += '<p>Please enter a suburb, city, state or postcode.</p>';
                        break;
                }

                result += '</div>';
                result1 = jQuery(result).text();
                alert(result1);
            }
        })

    },    displayModalWindow:function(content) {
        $.fancybox(content, {
            'width'            : 500,
            'height'        : 150,
            'transitionIn'    : 'elastic',
            'transitionOut'    : 'elastic',
            'easingIn'      : 'easeOutBack',
            'easingOut'     : 'easeInBack',
            'speedIn'        : 800,
            'autoDimensions': false,
            'overlayColor'    : '#000',
            'overlayOpacity': 0.5,
            'centerOnScroll': true,
            'titleShow'        : false,
            'scrolling'        : 'no'
        });
    },

    zoomToResults: function() {

        var latLng = [];
        $.each(markersArray, function(i, value) {
            if(markersArray[i].getVisible()) latLng.push(markersArray[i].getPosition());
        });

        var latLngBounds = new google.maps.LatLngBounds();
        $.each(latLng, function(i, value){
           latLngBounds.extend(value);
        });

        map.setCenter(latLngBounds.getCenter());
        map.fitBounds(latLngBounds);
    },

    getStockistsSearchURL: function() {
        return location.protocol
                + '//'
                + location.host
                + location.pathname
                + (location.pathname.charAt(location.pathname.length - 1) == '/' ? '' : '/')
                + 'index/search/';
    },

    getStockists: function() {

        $.ajax({
            type: 'GET',
            url: Stockists.getStockistsSearchURL(),
            dataType: 'json',
            success: function(data, textStatus){

                if($(data).length > 0)
                {
                    Stockists.storeAllStockists(data);
                } else {
                    var result  = '<div id="stockistContent">';
                        result += '<h1>Stockists not found.\n\n</h1>';
                        result += '<p>Stockists not found - please try again later, or contact us.</p>';
                        result += '</div>';
                        result1 = jQuery(result).text();
                        alert(result1);
                }
            },
            error: function(XMLHttpRequest){
                var result  = '<div id="stockistContent">';
                    result += '<h1>Stockists not found.\n\n</h1>';
                    result += '<p>An error has occured while retrieving the stockists - please try again later, or contact us.</p>';
                result += '</div>';
                result1 = jQuery(result).text();
                                alert(result1);
            }
        });

    },

    storeAllStockists: function(data) {

        stockistsObject = data;

        $.each(stockistsObject, function(index, value){
            Stockists.addMarker(index, new google.maps.LatLng(value['latitude'], value['longitude']),value);
        });


        var clusterStyles = STOCKISTS_CONFIGURATION['clusterStyles'];

        markerCluster = new MarkerClusterer(map, markersArray, {
            maxZoom: 9,
            styles: clusterStyles
        });

        Stockists.addStockistsToSidebar();

        var initialised = false;
        var boundsChanged = google.maps.event.addListener(map, 'bounds_changed', function() {
            if(!initialised) {
                google.maps.event.removeListener(boundsChanged);
            }
        })

        google.maps.event.addListener(map, 'dragend', Stockists.updateStockist);
        google.maps.event.addListener(map, 'zoom_changed', function() {
            setTimeout(Stockists.updateStockist, 500);
        });

        // Try W3C Geolocation (Preferred)
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
                map.setZoom(14);
            }, function() {});
        }

    },

    updateStockist: function() {

        $('div.stockist').hide();

        if(map.getZoom() >= 0) {

            $.each(markersArray, function(i, value){

                if(map.getBounds().contains(markersArray[i].getPosition())) {
                    $('div#sid-' + $(markersArray[i]).data('id')).show();        
                }

            });

            Stockists.checkStock();
            $('div.results').scrollTop(0);
        }
    },

    checkStockistHasStock: function(checked, value) {
        var hasStock = false;
        $.each($(value).find('div.swatches img'), function(j, subvalue){
            if($.inArray($(subvalue).attr('id'), checked) != -1) {
                hasStock = true;
            }
        });
        return hasStock;
    },

    checkStock: function() {
        checked = [];
        $.each($('div.ranges input:checkbox:checked'), function(i, value) {
            checked[i] = $(value).attr('name');
        });
		var tempMarkersArray = [];
        $.each($('div.stockist'), function(i, value) {
            if(Stockists.checkStockistHasStock(checked, value) && map.getBounds().contains($(value).data('marker').getPosition()) && map.getZoom() >= 0) {
                $(value).show();
                $(value).data('marker').setVisible(true);
				//add marker to new group
				var tempMarker = $(value).data('marker');
				tempMarkersArray.push(tempMarker);
            } else {
                $(value).hide();
                $(value).data('marker').setVisible(false);
            }
        });
		//refresh group markers
		var clusterStyles = STOCKISTS_CONFIGURATION['clusterStyles'];
		markerCluster.clearMarkers();
        markerCluster = new MarkerClusterer(map, tempMarkersArray, {
            maxZoom: 9,
            styles: clusterStyles
        });
    },

    addStockistsToSidebar: function() {
        $('div.ranges input:checkbox').attr('checked', true)
        $('div.ranges input:checkbox').change(function(e) {
            $('div.stockist').removeClass('selected');
            infowindow.close();
            Stockists.updateStockist();
        });

        var stockists = "";
        $.each(markersArray, function(i, data){
            var marker = $(markersArray[i]).data('data');
            var stockist = "<div class='stockist clearfix' id='" + "sid-" + $(markersArray[i]).data('id') + "'>";
                stockist += "<span class='marker'>Marker</span>";
                stockist += "<h3><a class='anchor' href='javascript:;'>" + marker['title'] + "</a></h3>";
                stockist += "<div class='clearfix'></div>";
                stockist += "<ul>";
                    if(marker['address'])   stockist += '<li class="address">' + marker['address'] + "</li>";
                    if(marker['address1'])  stockist += '<li class="address1">' + marker['address1'] + "</li>";
                    if(marker['city'])      stockist += '<li class="city">' + marker['city'] + "</li>";
                    stockist += '<li class="locality">';
                    if (marker['suburb'])   stockist += '<span class="suburb">' + marker['suburb'] + '</span>';
                    if (marker['state'])    stockist += ', <span class="state">' + marker['state'] + '</span>';
                    if (marker['postcode']) stockist += ', <span class="postcode">' + marker['postcode'] + '</span>';
                    stockist += "</li>";
                    if(marker['country'])   stockist += "<li>" + marker['country'] + "</li> ";
                    if(marker['phone'])     stockist += '<li class="phone">' + marker['phone'] + "</li>";
                    if(marker['fax'])       stockist += '<li class="fax">' + marker['fax'] + "</li>";
                stockist += "</ul>";

                    stockist += "<a class='anchor' href='javascript:;'>" + 'Show on map' + "</a>" + '<br/>';
                    if(marker['url'])       stockist += '<a href="' + marker['url'] + '">' + 'Go to store page' + '</a>';


                var meta = "height='15' src='/bonds/skin/frontend/pacbrands/default/images/stockists/logo/'";
                stockist += "<div class='colours'>";
                    stockist += "<div class='swatches'>";
                    if(marker['stockistsgroup_id'] > 0) stockist += "<img id='"+marker['stockistsgroup_id']+"' alt='' " + meta + "/>";
                    stockist += "</div>";
                    stockist += "<div class='clearfix'></div>";
                stockist += "</div>";
                stockist += "</div>";
                stockists += stockist;
        });

        $('div.results').html(stockists);

        $.each($('div.stockist'), function(i, value) {
            $(this).data('marker', markersArray[$(this).attr('id').split('-')[1]]);
        });

        $('div.stockist').hover(function() {
            $(this).addClass('hover');
            $(this).data('marker').setAnimation(google.maps.Animation.BOUNCE);
            $(this).data('marker').setAnimation(null);
        }, function() {
            $(this).removeClass('hover');
            $(this).data('marker').setAnimation(null);
        });

        $('div.stockist a.anchor').click(function() {
            var marker = $(this).closest('div.stockist').data('marker');
            marker.setAnimation(google.maps.Animation.BOUNCE);
            Stockists.clickMarker(marker);
        });

    },

    clickMarker: function(marker) {

        map.setCenter(marker.getPosition());
        var contentString = '';
        var directionAddressString = '';
                    if($(marker).data('data')['address1']) directionAddressString += $(marker).data('data')['address1'] + " ";
                    if($(marker).data('data')['suburb']) directionAddressString += $(marker).data('data')['suburb'] +" ";
                    if($(marker).data('data')['city']) directionAddressString += $(marker).data('data')['city'] +" ";
                    if($(marker).data('data')['state']) directionAddressString += $(marker).data('data')['state']+" ";
                    if($(marker).data('data')['country']) directionAddressString += $(marker).data('data')['country']+" ";
                    if($(marker).data('data')['postcode']) directionAddressString += $(marker).data('data')['postcode'];
		var longlatString = '';
					if($(marker).data('data')['latitude'] && $(marker).data('data')['longitude']) {
						longlatString += $(marker).data('data')['latitude'] + ',' + $(marker).data('data')['longitude'];
					}
            contentString += '<div id="infowindow" style="height:150px;">';
                if ($(marker).data('data')['url']) 
                     contentString += '<h4><a href="'+$(marker).data('data')['url']+'">' + $(marker).data('data')['title'] + '</a></h4>';
                else contentString += '<h4>' + $(marker).data('data')['title'] + '</h4>';
                contentString += '<ul>';
                    //if($(marker).data('data')['title']) contentString += "<li>" + $(marker).data('data')['title'] + "</li>";
                    if($(marker).data('data')['address']) contentString += "<li>" + $(marker).data('data')['address'] + "</li>";
                    if($(marker).data('data')['address1']) contentString += "<li>" + $(marker).data('data')['address1'] + "</li>";
                    if($(marker).data('data')['suburb']) contentString += "<li>" + $(marker).data('data')['suburb'] + "</li>";
                    if($(marker).data('data')['city']) contentString += "<li>" + $(marker).data('data')['city'] + "</li>";
                    if($(marker).data('data')['state']) contentString += "<li>" + $(marker).data('data')['state'];
                    if($(marker).data('data')['country']) contentString += ", " + $(marker).data('data')['country'];
                    if($(marker).data('data')['postcode']) contentString += ", " + $(marker).data('data')['postcode'] + "</li>";
                    if($(marker).data('data')['phone']) contentString += "<li class='phone'>" + $(marker).data('data')['phone'] + "</li>";
                    if($(marker).data('data')['fax']) contentString += "<li class='fax'>" + $(marker).data('data')['fax'] + "</li>";
                contentString += '</ul>';
                if ($(marker).data('data')['url']) 
                     contentString += '<a href="'+$(marker).data('data')['url']+'">' + 'Go to store page' + '</a>' + '<br/>';
              if ( directionAddressString ) {
				contentString += '<a class="directions" href="http://maps.google.com/maps?daddr='
                              +  encodeURIComponent(directionAddressString) + '&ll='+longlatString+'" target="_blank">Get directions</a>';
                }              
            contentString += '</div>';

        infowindow.setContent(contentString);
        infowindow.open(map, marker);
        if(map.getZoom() < 10) map.setZoom(7);

        $('div.stockist').removeClass('selected');
        $('div#sid-' + $(marker).data('id')).addClass('selected');

        $.each(markersArray, function(i, value) {
            markersArray[i].setAnimation(null);
        });
    },

    addMarker: function(id, loc, data) {

             skinUrl = STOCKISTS_CONFIGURATION['skinUrl'];

        marker = new google.maps.Marker({
            position: loc,
            map: map,
            icon: new google.maps.MarkerImage(skinUrl+'images/stockists/map-marker-icon.png', new google.maps.Size(32, 44), new google.maps.Point(0,0), new google.maps.Point(16, 44)),
            shadow: new google.maps.MarkerImage(skinUrl+'images/stockists/map-marker-shadow.png', new google.maps.Size(20, 15), new google.maps.Point(0,0), new google.maps.Point(8, 15)),
            visible: false
        });

        $(marker).data('id', id);
                $(marker).data('data', data);

        google.maps.event.addListener(marker, 'click', function(){
            Stockists.clickMarker(this);
        });
        markersArray.push(marker);
    }

}

$(document).ready(function(){

     var skinUrl = $("input#skinUrl").val();
     var clusterStyles = [];
     splitChk = skinUrl.split("/");

    clusterStyles = [
        { url: skinUrl+'images/stockists/map-marker-group.png',
          'background-position': '0 0', 'background-size': '32 56', textStyle: 'bold', textColor: 'white', cursor: 'pointer', textFont: '"Arial Black",sans-serif', textSize: 12, fontStyle: 'normal', textWeight: 'bold', height: 56, left: 492.706, lineHeight: 56, position: 'absolute', textAlign: 'center', textDecoration: 'none', top: '123.898', width: 32 },
        { url: skinUrl+'images/stockists/map-marker-group.png',
          'background-position': '0 0', 'background-size': '32 56', textStyle: 'bold', textColor: 'white', cursor: 'pointer', textFont: '"Arial Black",sans-serif', textSize: 12, fontStyle: 'normal', textWeight: 'bold', height: 56, left: 492.706, lineHeight: 56, position: 'absolute', textAlign: 'center', textDecoration: 'none', top: '123.898', width: 32 },
        { url: skinUrl+'images/stockists/map-marker-group.png',
          'background-position': '0 0', 'background-size': '32 56', textStyle: 'bold', textColor: 'white', cursor: 'pointer', textFont: '"Arial Black",sans-serif', textSize: 12, fontStyle: 'normal', textWeight: 'bold', height: 56, left: 492.706, lineHeight: 56, position: 'absolute', textAlign: 'center', textDecoration: 'none', top: '123.898', width: 32 }
    ];

    STOCKISTS_CONFIGURATION = {
        "input"         : { "formclass": "search", "message": "Suburb or postcode" },
        "filter"        : { "formclass": "filter", "message": "Filter results..." },
        "skinUrl"       : skinUrl,
        "clusterStyles" : clusterStyles
    }

  Stockists.initialize();
});
}(jQuery));


