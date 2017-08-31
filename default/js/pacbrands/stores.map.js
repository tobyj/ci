var pbStoresMap, circle;

(function ($) {
pbStoresMap = {

    defaultCountry: { 'country': 'au' },
    countries: {
        'au': {
            center: { lat: -25.3, lng: 133.8 },
            zoom: 4
        },
        'nz': {
            center: { lat: -40.9, lng: 174.9 },
            zoom: 5
        },
        'id': {
            center: { lat: 4.175, lng: 106.8283 },
            zoom: 5
        },
        'ie': {
            center: { lat: 52.8, lng: -7.5 },
            zoom: 6
        },
        'gb': {
            center: { lat: 53, lng: -3 },
            zoom: 6
        }
    },

    initialized: false,
    map: false,
    infoWindow:  false,
    markers: [],
    groups_loaded: [],

    initialize: function() {

        // Initialise
        pbStoresMap.markers = [];
        pbStoresMap.groups_loaded = [];
        pbStoresMap.initialized = false;

        // Check if mouse wheel scroll is disabled
        var attr = $('#map').attr('data-wheel');
        if (typeof attr !== 'undefined') {
            var wheelData = $('#map').data('wheel'), wheelScroll = ( wheelData = 'false' ) ? false : true;
        }

        // check to see if default country is defined via the blocks
        if( typeof($('#map').attr("data-default_country_iso2"))!='undefined' &&
            (defaultCountry = $('#map').attr("data-default_country_iso2").toString().trim().toLowerCase())!='' ) {
            pbStoresMap.defaultCountry.country = defaultCountry;
        }

        // Map Options
        var map_options = {
            zoom:   pbStoresMap.countries[pbStoresMap.defaultCountry.country].zoom,
            center: pbStoresMap.countries[pbStoresMap.defaultCountry.country].center,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
            scrollwheel: wheelScroll,
            zoomControlOptions: {
                style:    google.maps.ZoomControlStyle.SMALL,
                position: google.maps.ControlPosition.LEFT_TOP
            }
        };

        if ($('#map').hasClass('map_no_controls')) {
            map_options.disableDefaultUI = true;
            map_options.zoomControl = false;
        }

        // Create Map
        pbStoresMap.map = new google.maps.Map($("#map")[0], map_options);

        // Image Marker
        var imagepath = $('.btn_icon_target').data('icon');
        if (imagepath) {
            circle = new google.maps.Marker({
                map: pbStoresMap.map,
                icon: imagepath,
                labelClass: 'pulse'
            });
        }

        // Fancy Pulse Marker Circle
        circle = new MarkerWithLabel({
            position: pbStoresMap.map.getCenter(),
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 0
            },
            map: pbStoresMap.map,
            draggable: false,
            labelAnchor: new google.maps.Point(10, 10),
            labelClass: "pulse" // the CSS class for the label
        });

        // Infobox replacement for infowindow to allow further customisation, see:
        // http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/docs/reference.html#InfoBoxOptions
        pbStoresMap.infoWindow = new InfoBox({
             boxClass: "map-infobox",
             disableAutoPan: true,
             pixelOffset: new google.maps.Size(-250, -45),
             zIndex: 32,
             closeBoxMargin: "6px 6px 6px 6px",
             closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
             alignBottom: true,
             enableEventPropagation: true,
             infoBoxClearance: new google.maps.Size(10, 10)
        });

        // Re-size map & re-center info window on resize
        $(window).resize(function() {
            clearTimeout(window.resizedFinished);
            window.resizedFinished = setTimeout(function() {
                google.maps.event.trigger(pbStoresMap.map, 'resize');
                pbStoresMap.center_info();
            }, 250);
        });

        // URL Hash has groups to load
        if (window.location.hash) {
            var hash = window.location.hash;
            var matches = hash.match(/#(\d+)-(\d+)/);
            if (matches !== null) {
                $('#store-filter input:checkbox[value='+matches[1]+']').attr('checked', true);
            }
        }

        // Load Groups
        pbStoresMap.load();

        // Create Search Autocomplete
        if ($('#map-autocomplete').length) {
            autocomplete = new google.maps.places.Autocomplete($('#map-autocomplete')[0], {
                types: ['(regions)'],
                componentRestrictions: pbStoresMap.defaultCountry
            });
            places = new google.maps.places.PlacesService(pbStoresMap.map);
            autocomplete.addListener('place_changed', function() {
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    pbStoresMap.map.panTo(place.geometry.location);
                    pbStoresMap.map.setZoom(11);
                } else {
                    $('#map-autocomplete').prop('placeholder', 'Suburb or postcode');
                }
            });

            $('#map-autocomplete').focusin(function () {
                $(document).keypress(function (e) {
                    if (e.which == 13) {
                        var firstItem = $(".pac-container .pac-item:first > span"), firstResult = $(".pac-container .pac-item:first").text();
                        var geocoder = new google.maps.Geocoder();
                        geocoder.geocode({"address":firstResult }, function(results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                var lat = results[0].geometry.location.lat(),
                                    lng = results[0].geometry.location.lng(),
                                    placeName = results[0].address_components[0].long_name,
                                    latlng = new google.maps.LatLng(lat, lng);

                                    $(".pac-container .pac-item:first").addClass("pac-selected");
                                    $(".pac-container").css("display","none");
                                    $("#map-autocomplete").val(firstItem.eq(1).text() + ' ' + firstItem.eq(2).text());
                                    $(".pac-container").css("visibility","hidden");

                                    pbStoresMap.map.panTo(latlng);
                                    pbStoresMap.map.setZoom(11);

                            }
                        });
                    } else {
                        $(".pac-container").css("visibility","visible");
                    }

                });
            });

        }
    },

    load: function() {

        // Groups to display
        var groups = [];
        $('#store-filter input:checked').each(function() { groups.push($(this).val()); });

        // Hide info window if in group no longer visible
        if ((pbStoresMap.infoWindow.getVisible()) &&
            ($.inArray(pbStoresMap.infoWindow.marker.group, groups) == -1)) {
            pbStoresMap.infoWindow.close();
        }

        // Update Marker Visibility
        for(i = 0; i < pbStoresMap.markers.length; i++) {
            pbStoresMap.markers[i].setVisible($.inArray(pbStoresMap.markers[i].group, groups) != -1);
        }

        // Load Stores
        $('#store-filter input:checked').each(function() {

            // Group Markers already loaded
            if ($.inArray($(this).val(), pbStoresMap.groups_loaded) != -1) return;
            else pbStoresMap.groups_loaded.push($(this).val());

            // Load New Markers
            var loading = $(this).next().children('span');
            loading.addClass('loader');
            var map_marker = $(this).data('marker');
            var xhr = $.getJSON($(this).data('ajax'));
            xhr.done(function(data) {
                data.stores.each(function(item) {

                    // Place Marker
                    if (item.place) {
                        places.getDetails({
                            placeId: item.place,
                        }, function(place, status) {
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                var marker = new google.maps.Marker({
                                    id:      item.id,
                                    title:   place.name,
                                    map:     pbStoresMap.map,
                                    place: {
                                        location: place.geometry.location,
                                        query:    place.name
                                    },
                                    position: place.geometry.location,
                                    group: item.group,
                                    icon: {
                                        url:  map_marker,
                                        size: new google.maps.Size(32, 44),
                                    },
                                    favourite: item.favourite,
                                    website:   item.website
                                });

                                marker.addListener('click', function() {

                                    // Calculate open to
                                    if (place.opening_hours.open_now) {
                                        if (place.opening_hours.periods[1].close.time >= 1200)
                                             place.opening_hours.open_to = ((place.opening_hours.periods[1].close.time - 1200)/100).toFixed(2)+" pm";
                                        else place.opening_hours.open_to = (place.opening_hours.periods[1].close.time/100).toFixed(2)+" am";
                                    }

                                    // Use first image as the image
                                    if ((place.photos) && (place.photos.length))
                                         place.image = place.photos[0].getUrl({maxWidth:400, maxHeight:200});
                                    else place.image = item.image;

                                    // Show Info Window
                                    pbStoresMap.show_infowindow({ marker: marker, store: place, lat: this.position.lat(), lng: this.position.lng() });
                                });
                                pbStoresMap.markers.push(marker);
                            }
                        });

                    // Latitude/Longitude Marker
                    } else if (item.lat && item.lng) {
                        var marker = new google.maps.Marker({
                          id:       item.id,
                          title:    item.name,
                          map:      pbStoresMap.map,
                          position: { lat: Number(item.lat), lng: Number(item.lng) },
                          group:    item.group,
                          icon: {
                            url:  map_marker,
                            size: new google.maps.Size(32, 44),
                          },
                          favourite: item.favourite,
                          website:   item.website
                        });

                        // Show Info Window
                        marker.addListener('click', function() {
                            pbStoresMap.show_infowindow({ marker: marker, store: item, lat: this.position.lat(), lng: this.position.lng() });
                        });

                        pbStoresMap.markers.push(marker);
                    }
                });
                loading.removeClass('loader');

                // Show the Results
                pbStoresMap.show_results();

                // Initialize first display of the map
                if (!pbStoresMap.initialized) {

                    // First time we load the group, open the marker if its in this group
                    if (window.location.hash) {
                        var hash = window.location.hash;
                        var matches = hash.match(/#(\d+)-(\d+)/);
                        if ((matches !== null) && ((undefined == data.group) || (matches[1] == data.group))) {
                            pbStoresMap.markers.each(function(m) {
                                if (m.group == matches[1] && m.id == matches[2]) {
                                    pbStoresMap.map.setZoom(13);
                                    google.maps.event.trigger(m, 'click');
                                }
                            });
                            pbStoresMap.initialized = true;
                        }

                    // No URL Hash, single store
                    } else if (pbStoresMap.markers.length == 1) {
                        pbStoresMap.map.setZoom(13);
                        google.maps.event.trigger(pbStoresMap.markers[0], 'click');
                        pbStoresMap.initialized = true;

                    // No URL Hash, go geolocation
                    } else if (navigator.geolocation) {
                        $('.btn_icon_target').click();
                        pbStoresMap.initialized = true;
                    }
                }
            });
        });
    },

    show_infowindow: function(info) {

        // Info Window Template
        if ($("#map-info-template").length) {
            Handlebars.registerHelper('getimage', function(options) {
              return new Handlebars.SafeString('<div class="mybold">' + options.fn(this) + '</div>');
            });
            var source   = $("#map-info-template").html();
            var template = Handlebars.compile(source);
        }

        pbStoresMap.infoWindow.close();
        pbStoresMap.infoWindow.setContent(template({ store: info.store, lat: info.lat, lng: info.lng }));
        pbStoresMap.infoWindow.setOptions({boxClass:'map-infobox group-'+info.store.group_name.toLowerCase().replace(/ /g,"_") });
        pbStoresMap.infoWindow.marker = info.marker;
        pbStoresMap.infoWindow.open(pbStoresMap.map, info.marker);
        setTimeout(function() { pbStoresMap.center_info(); }, 250);
        window.location.hash = info.store.group + '-' + info.store.id;
    },

    center_info: function() {
        if (pbStoresMap.infoWindow.getVisible()) {
            var width = pbStoresMap.infoWindow.div_.getWidth();
            pbStoresMap.infoWindow.setOptions({ pixelOffset: new google.maps.Size(0 - (width/2), -45) });
            if (pbStoresMap.infoWindow.marker) {
                var marker = pbStoresMap.infoWindow.marker;
                pbStoresMap.map.panTo({lat: marker.position.lat(), lng: marker.position.lng()});
                pbStoresMap.map.panBy(0, 0 - (pbStoresMap.infoWindow.div_.getHeight() / 2));
            }
        }
    },

    show_results: function() {
        if ($('#store-results').length) {
            pbStoresMap.map.addListener('idle', function() {
                var results = '';
                for (var i = pbStoresMap.markers.length, bounds = pbStoresMap.map.getBounds(); i--;) {
                    var marker = pbStoresMap.markers[i];
                    if (bounds.contains(marker.getPosition())) {
                        results += '<li><a href="'+marker.website+'" class="store-favourite" data-ajax="'+marker.favourite+'" data-store-id="'+marker.id+'">'+marker.title+'</a></li>';
                    }
                }
                $('#store-results').html(results);
            });
        }
    }

}

$(document).on('ready', function(event) {

    // Google Maps
    if ($('#map').length) pbStoresMap.initialize();

    // Country Flags Select Dropdown
    $("ul.flags").on("click", "li.init", function() {
        $(this).closest("ul.flags").children('li:not(.init)').toggle();
    });

    var allOptions = $("ul.flags").children('li:not(.init)'); 
    $("ul.flags").on("click", "li:not(.init)", function() {
        allOptions.removeClass('selected');
        $(this).addClass('selected');
        $("ul.flags").children('.init').html($(this).html());
        allOptions.toggle();
        var country = $(this).find(">a").attr("data-value");
        if (country && country != 'all') {
            autocomplete.setComponentRestrictions({ 'country': country });
            pbStoresMap.map.panTo({ lat: pbStoresMap.countries[country].center.lat, lng: pbStoresMap.countries[country].center.lng });
            pbStoresMap.map.setZoom(pbStoresMap.countries[country].zoom);
        }
    });

    // Initialized to option 1 (aus)
    var option1 = $("ul.flags li.selected");
    if( option1.length==0 ) {
        option1 = $("ul.flags li:nth-child(2)");
    }

    $("ul.flags").children('.init').html(option1.html());
});


$(document).on('click', '.btn_icon_target', function(e) {
    e.preventDefault();
    var loader = $('.map-controls .loader');
    loader.addClass('show');

    // Navigate to Current Location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            circle.setPosition(pos);
            circle.setAnimation(google.maps.Animation.SCALE);
            pbStoresMap.map.setZoom(11);
            pbStoresMap.map.setCenter(pos);
            $('.pulse').show();
            loader.removeClass('show');

        },function() {
            $.addErrorMessage('Your location could not be determined. <a href="https://support.google.com/maps/answer/152197" target="_blank">Learn More</a>');
            loader.removeClass('show');
            $('.pulse').hide(); 
        });

        // If user cancels or does not select hide the loader after 7 | Firefox issue
        var t = setTimeout(function () {
            loader.removeClass('show');
        }, 7000);
    }
});

$(document).on('change', '#store-filter input', function(e) {
    pbStoresMap.load();
});

})(jQuery);
