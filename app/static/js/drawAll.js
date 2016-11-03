var container = d3.select("#map");

var realWidth = 1396;
var realHeight = 1296;

var width = 700;
var height = realHeight * width / realWidth;

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

var commonPath = svg.append("path");

var startDiv = container.select("#start_label");
var finishDiv = container.select("#finish_label");

svg.attr("width", width + "px");
svg.attr("height", height + "px");

var isEvenClick = true;
var node1;
var node2;

d3.xml("static/data/testdata.xml", function (xmlData) {
    xmlData = [].map.call(xmlData.querySelectorAll("node"), function (node) {
        var coords = node.querySelector("attvalues").querySelectorAll("attvalue");
        return {
            id: node.getAttribute("id"),
            name: node.getAttribute("id") + " id, " + coords[0].getAttribute("value") + " name",
            coords: {x: coords[1].getAttribute("value"), y: coords[2].getAttribute("value")}
        };

    });
    svg.on("click", function () {
        var x = xScale.invert(d3.event.offsetX);
        var y = xScale.invert(d3.event.offsetY);
        console.log(x, y);
        var node = "";
        var distance = Infinity;

        xmlData.forEach(function (d) {
            var nodeX = d.coords.x - x;
            var nodeY = d.coords.y - y;
            var currentDist = Math.sqrt(nodeX * nodeX + nodeY * nodeY);
            if (currentDist < distance) {
                distance = currentDist;
                node = d
            }
        });
        console.log(node.name);
        isEvenClick = !isEvenClick;
        if (!isEvenClick) {
            node1 = node.id;
        } else {
            node2 = node.id;
            getData(node1, node2);
        }

    });

    d3.csv("static/data/schedule.csv", function (data) {
        data = _.groupBy(data, function (d) {
            return d.Weekday
        });
        Object.keys(data).forEach(function (key) {
            data[key] = _.groupBy(data[key], function (d) {
                return d.Group
            })

        });
        updateGroup(data, xmlData);
    });


});

var weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function updateGroup(data, xmlData) {
    console.log(xmlData);
    var date = new Date();
    //date.setHours(22);
    //date.setMinutes(48);
    var weekDay = weekDays[date.getDay() - 1];
    var hours = date.getHours() + date.getMinutes() / 60;
    //console.log(date.getHours());
    var node1 = 0;
    var node2 = 0;
    if (!weekDay) {

    }
    Object.keys(groupLabels).forEach(function(group) {
        data[weekDay][group].forEach(function(item){
            var start = item.Time_start.split(":");
            start = start[0]*1 + start[1]/60;
            var finish = item.Time_finish.split(":");
            finish = finish[0]*1 + finish[1]/60;
            if (hours >= start && hours >= finish && item.Aud_to) {
                console.log(item.Aud_to, group);
                var coords = _.find(xmlData, function(d) {
                    return d.id == roomDict["406"]
                }).coords;
                groupLabels[group].style({
                    top: yScale(coords.y) + "px",
                    left: xScale(coords.x) + "px"
                })
            }
            if (hours >= start && hours <= finish && item.Aud_from && item.Aud_to) {
                node1 = roomDict[item.Aud_from];
                node2 = roomDict[item.Aud_to];
                //console.log(item.Aud_from, item.Aud_to, node1, node2, group);
                getData(node1, node2, groupPathes[group]);
            }
        });
        var global_finish = data[weekDay][group][data[weekDay][group].length - 1].Time_finish.split(":");
        global_finish = global_finish[0]*1 + global_finish[1]/60;
        var global_start = data[weekDay][group][0].Time_start.split(":");
        global_start = global_start[0]*1 + global_start[1]/60;
        if (hours > global_finish) {
            groupLabels[group]
                .style({"opacity": "1"})
                .transition()
                .duration(500)
                .style({
                    "opacity": "0.5",
                    top: "130px",
                    left: "310px"
                })
        }
        if (hours < global_start && global_start - hours < 0.3) {
            groupLabels[group]
                .style({"opacity": "0"})
                .transition()
                .duration(500)
                .style({"opacity": "1"})
        }

        //console.log(group, data[weekDay][group])
    })
}


function updateLabels(points) {
    var startPoint = points[0];
    var finishPoint = points[points.length - 1];
    startDiv
        .text(startPoint.no_room)
        .style({
            left: (xScale(startPoint.x) - 5) + "px",
            top: (yScale(startPoint.y) - 15) + "px"
        });
    finishDiv
        .text(finishPoint.no_room)
        .style({
            left: (xScale(finishPoint.x) - 10) + "px",
            top: (yScale(finishPoint.y) - 15) + "px"
        });
}

function completePath(path, data) {
    if (!data) return;
    var line = d3.svg.line()
        .x(function (d) {
            return xScale(d.x)
        })
        .y(function (d) {
            return yScale(d.y)
        });

    path.attr("d", line(data));
    path.attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

}


var groupLabels = {
    "504_SE": container.select("#group_504_SE"),
    "503_CS": container.select("#group_503_CS"),
    "504_BI": container.select("#group_504_BI"),
    "603_CS": container.select("#group_603_CS")
};

var groupPathes = {
    "504_SE": svg.append("path").classed("group_504_SE", true),
    "503_CS": svg.append("path").classed("group_503_CS", true),
    "504_BI": svg.append("path").classed("group_504_BI", true),
    "603_CS": svg.append("path").classed("group_603_CS", true)
};

function drawPath(data, custom_path) {
    data = data.path.map(function (d) {
        return data[d]
    });
    if (custom_path) {
        completePath(custom_path, data);
    } else {
        completePath(commonPath, data);
        updateLabels(data)
    }

}


function moveTable() {
    var groups = Object.keys(groupPathes);
    var data = {};
    var maxLength = 0;
    groups.forEach(function (d) {
        var p = groupPathes[d].node();
        var l = p.getTotalLength();
        if (l > maxLength) {
            maxLength = l
        }
        data[d] = {
            path: p,
            total: l,
            name: d
        }
    });
    
    d3.transition()
        .duration(30 * maxLength)
        .tween("rotate", function () {
            return function (t) {
                Object.keys(data).forEach(function (key) {
                    var gr = data[key];
                    var coords = gr.path.getPointAtLength(t * gr.total);
                    groupLabels[gr.name].style({
                        top: coords.y + "px",
                        left: coords.x + "px"
                    });
                })

            }
        })
        .transition()
        .each("end", function () {
            console.log("end")
        })
}



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


var geoSuccess = function (position) {
    startPos = position;
    document.getElementById('startLat').innerHTML = startPos.coords.latitude// - defLat;
    document.getElementById('startLon').innerHTML = startPos.coords.longitude// - defLon;
};
navigator.geolocation.getCurrentPosition(geoSuccess);

//console.log(Date.now())

