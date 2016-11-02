var container = d3.select("#map");

var width = 600;
var height = 570;

var realWidth = 1350;
var realHeight = 1250;

var xScale = d3.scale.linear()
    .domain([0, realWidth])
    .range([0, width]);

var yScale = d3.scale.linear()
    .domain([0, realHeight])
    .range([0, height]);

var imageMap = container.select("img");

imageMap.attr("width", width + "px");
imageMap.attr("height", height + "px");

var svg = container.select("svg");

var path = svg.append("path");
var startDiv = container.select("#start_label");
var finishDiv = container.select("#finish_label");

svg.attr("width", width + "px");
svg.attr("height", height + "px");

d3.json("static/data/testdata.json", function(data) {
    drawPath(data);
});

d3.xml("static/data/testdata.xml", function(data) {
    data = [].map.call(data.querySelectorAll("node"), function(node) {
        var coords = node.querySelector("attvalues").querySelectorAll("attvalue");
        //var x = coords[0]
        //console.log(coords[1].getAttribute("value"));
        return {
            name: node.getAttribute("id"),
            coords: {x: coords[1].getAttribute("value"), y: coords[1].getAttribute("value")}
        };

    });
    //console.log(data);
    svg.on("click", function() {
        var x = xScale.invert(d3.event.offsetX);
        var y = xScale.invert(d3.event.offsetY);
        console.log(x, y);
        var node = "";
        var distance = Infinity;

        data.forEach(function(d) {
            var nodeX = d.coords.x - x;
            var nodeY = d.coords.y - y;
            var currentDist = Math.sqrt(nodeX*nodeX + nodeY*nodeY);
            if (currentDist < distance) {
                distance = currentDist;
                node = d.name
            }
        });
        console.log(node);
        //console.log(d3.event.offsetX, d3.event.offsetY)

    });
});

function completePath(data) {
    var line = d3.svg.line()
        .x(function(d) { return xScale(d.x)})
        .y(function(d) { return yScale(d.y)});
    var points = data.path.map(function(d) {
       return data[d]
    });
    path.attr("d", line(points));
    path.attr("opacity", 0)
        .transition()
        .duration(2000)
        .attr("opacity", 1);
    console.log(points);

    var startPoint = points[0];
    var finishPoint = points[points.length-1];
    startDiv
        .text(startPoint.no_room)
        .style({
            left: (xScale(startPoint.x)-5)+ "px",
            top: (yScale(startPoint.y)-15) + "px"
        });
    finishDiv
        .text(finishPoint.no_room)
        .style({
            left: (xScale(finishPoint.x)-10) + "px",
            top: (yScale(finishPoint.y)-15) + "px"
        });

    if (navigator.geolocation) {
        console.log('Geolocation is supported!');
    }
    else {
        console.log('Geolocation is not supported for this Browser/OS version yet.');
    }

    var startPos;
    var geoOptions = {
        enableHighAccuracy: true
    };
    var defLat = 59.9806333;
    var defLon = 30.325898700000003;


    var geoSuccess = function(position) {
        startPos = position;
        document.getElementById('startLat').innerHTML = startPos.coords.latitude// - defLat;
        document.getElementById('startLon').innerHTML = startPos.coords.longitude// - defLon;
    };
    navigator.geolocation.getCurrentPosition(geoSuccess);

}

function drawPath(data) {
    console.log(data);
    completePath(data)
}



//console.log(Date.now())

