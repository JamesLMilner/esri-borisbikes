    var map
    var locationLayer
    
    require([
        "esri/map",
        "esri/layers/FeatureLayer",  
        "esri/InfoTemplate",   
        "esri/dijit/Geocoder",
        "esri/symbols/SimpleMarkerSymbol", 
        "esri/Color", 
        "esri/graphic", 
        "esri/geometry/Point",
        "esri/geometry/webMercatorUtils",
        "esri/renderers/SimpleRenderer",
        "esri/dijit/Legend"
    ], 
    function(Map, FeatureLayer, InfoTemplate, Geocoder, SimpleMarkerSymbol, Color, Graphic, Point, webMercatorUtils, SimpleRenderer, Legend) {

        // Get a reference to the ArcGIS Map class
        map = new Map("map",{
            basemap:"gray",
            center:[-0.1139583,51.506423],
            zoom: 15
        });

        geocoder = new Geocoder({ 
              map: map,
              autoComplete: true,
              sourceCountry: "GBR"
        }, "search");
        geocoder.startup();
        geocoder.on("select", showLocation);
    

       colorramp = [
                    new Color("#DADFE6"), 
                    new Color("#B5D0F1"), 
                    new Color("#83AEE2"), 
                    new Color("#518BD1"), 
                    new Color("#316AB0"), 
                    new Color("#1A4882"), 
                    new Color("#031327")
                   ]

        var bikelayer

        function getBikeData() {
            console.log("Getting data...");
            if (map.graphics) {
                map.graphics.clear();
            }
            layer = new FeatureLayer("http://geonode.geeknixta.com/citybikes/rest/services/barclays-cycle-hire/FeatureServer/0", {
                outFields: ["*"]
            });

            layer.on("load", function(){
                console.log("Layer loaded : ", layer);
                var renderer = new SimpleRenderer(new SimpleMarkerSymbol().setSize(9)); //size in pixels);
                renderer.setColorInfo({
                    field: "bikes",
                    stops: [
                        { value: 0, color: colorramp[0], opacity: 1  }, 
                        { value: 3, color: colorramp[1], opacity: 1 },  
                        { value: 6, color: colorramp[2],  opacity: 1 },
                        { value: 9, color: colorramp[3],  opacity: 1 },
                        { value: 12, color: colorramp[4],  opacity: 1 },
                        { value: 15, color: colorramp[5],  opacity: 1 },
                        { value: 18, color: colorramp[6],  opacity: 1 }
                    ]
                });

                layer.setRenderer(renderer);
                dojo.connect(layer, "onClick", graphicClick);
                console.log("Adding layer to :", map);
                map.addLayer(layer);

            }) // end of layer.on(load)

        }

        function graphicClick(event) {
            console.log("Graphic clicked")
            var ds = event.graphic
            var mp = webMercatorUtils.webMercatorToGeographic(event.mapPoint);
            var b = ds.attributes.bikes //bikes
            var e = ds.attributes.free //empty
            var t = ds.attributes.citybikesTimeString //Time string
            t = t.substring(10, t.length-5);
            t = t.replace("T", "Updated: ");
            var name = ds.attributes.name.substr(ds.attributes.name.indexOf("-") + 1)
            var title =  name ;
            var content = "<br> <div id='available'></div><b>Bikes Available: </b>" + b + "<br> <div id='empty'></div> <b> Empty Slots: </b>" + e + "<div id='donut'></div>" + "<div class='time'>" + t + "</div>";

            map.infoWindow.setTitle(title);
            map.infoWindow.setContent(content);
            map.infoWindow.resize(200, 200);
            donut(b, e, "#donut");
            map.infoWindow.show(mp);
        } //End of graphicClick()


        //Update Every 3 Minutes
        map.on("load", function() {
            setInterval(getBikeData(), 30000);
        });

        function showLocation(evt) {
              console.log(locationLayer);
              if (locationLayer !== undefined && locationLayer.graphics.length != 0 ) { locationLayer.clear(); }
              else {  locationLayer = new esri.layers.GraphicsLayer();  }
              while ( locationLayer.loaded === false ) {  } //Don't do anything until it's loaded
              p = evt.result.feature.geometry;
              s = new SimpleMarkerSymbol().setSize(9);
              g = new Graphic(p, s); 
              locationLayer.add(g);
              map.addLayer(locationLayer)  // Makes sure that map is loaded
              map.infoWindow.setTitle("<b>Search Result</b>");
              map.infoWindow.setContent(evt.result.name);
              map.infoWindow.show(evt.result.feature.geometry);
        }
        
        function donut(b, e, selector ) {
            console.log("donuting");
            var dataset = {
                  bikes: [b, e],
                };
            var width = 120,
                height = 113,
                radius = Math.min(width, height) / 2;
            var color = d3.scale.ordinal().range(["#031327", "#DADFE6"]);

            var pie = d3.layout.pie()
                .sort(null);

            var arc = d3.svg.arc()
                .innerRadius(radius - 50)
                .outerRadius(radius - 25);

            var svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            var path = svg.selectAll("path")
                .data(pie(dataset.bikes))
              .enter().append("path")
                .attr("fill", function(d, i) { return color(i); })
                .attr("d", arc);

        }

        function lineDistance( point1, point2 ) {
              xs = point2.x - point1.x;
              xs = xs * xs;

              ys = point2.y - point1.y;
              ys = ys * ys;

              return Math.sqrt( xs + ys );
        }


    }); //End of map function

    
