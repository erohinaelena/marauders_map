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
var global_floor = 2;
var imageMap = container.selectAll("img");

imageMap.attr("width", width + "px");
imageMap.attr("height", height + "px");

var svg = container.select("svg");

var commonPath = {
    path: svg.append("path").classed("floor_0", true),
    path2: svg.append("path").classed("floor_2", true),
    path4: svg.append("path").classed("floor_4", true),
    path5: svg.append("path").classed("floor_5", true)
};

var startDiv = container.select("#start_label");
var finishDiv = container.select("#finish_label");

svg.attr("width", width + "px");
svg.attr("height", height + "px");

var isEvenClick = true;
var node1;
var node2;
function getFloorFromId(id) {
    if (!id) return
    return (id * 1 <= 111) ? 4 : (id.toString()[0] == "5") ? 5 : 2;
}

d3.xml("static/data/testdata.xml", function (xmlData) {
    xmlData = [].map.call(xmlData.querySelectorAll("node"), function (node) {
        var coords = node.querySelector("attvalues").querySelectorAll("attvalue");
        return {
            id: node.getAttribute("id"),
            aud: coords[2].getAttribute("value"),
            name: node.getAttribute("id") + " id, " + coords[2].getAttribute("value") + " name",
            coords: {x: coords[1].getAttribute("value"), y: coords[0].getAttribute("value")}
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
            var currentFloor = getFloorFromId(d.id);
            if (currentDist < distance && currentFloor == global_floor) {
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
    var date = new Date();
    date.setHours(10);
    date.setMinutes(46);
    var weekDay = "Friday"//weekDays[date.getDay() - 1];
    var hours = date.getHours() + date.getMinutes() / 60;
    //console.log(date.getHours());
    var node1 = 16;
    var node2 = 16;
    if (!weekDay) {

    }
    Object.keys(groupLabels).forEach(function (group) {
        var coords = 0;
        data[weekDay][group].forEach(function (item) {
            var start = item.Time_start.split(":");
            start = start[0] * 1 + start[1] / 60;
            var finish = item.Time_finish.split(":");
            finish = finish[0] * 1 + finish[1] / 60;

            if (hours >= start && hours >= finish) {
                //console.log(item.Aud_to, roomDict[item.Aud_to], group);
                if (item.Aud_to) {
                    coords = _.find(xmlData, function (d) {
                        return d.id == roomDict[item.Aud_to]
                    });
                } else {
                    coords = _.find(xmlData, function (d) {
                        return d.id == roomDict["434"]
                    });
                }

            }

            if (hours >= start && hours <= finish && item.Aud_from && item.Aud_to) {
                node1 = roomDict[item.Aud_from];
                node2 = roomDict[item.Aud_to];
                if (!node1 || !node2) {
                    console.log(item.Aud_from, item.Aud_to, node1, node2, group);
                } else {
                    getData(node1, node2, groupPathes[group]);
                }
            }

        });

        if (!coords) {
            coords = _.find(xmlData, function (d) {
                return d.id == roomDict["434"]
            });
        }
        coords = coords.coords;
        groupLabels[group].style({
            opacity: 1,
            top: yScale(coords.y) + "px",
            left: xScale(coords.x) + "px"
        });

        var global_finish = data[weekDay][group][data[weekDay][group].length - 1].Time_finish.split(":");
        global_finish = global_finish[0] * 1 + global_finish[1] / 60;
        var global_start = data[weekDay][group][0].Time_start.split(":");
        global_start = global_start[0] * 1 + global_start[1] / 60;
        if (hours > global_finish) {
            groupLabels[group]
                .style({"opacity": "1"})
                //.transition()
                //.duration(500)
                .style({
                    "opacity": "0.5",
                    top: "130px",
                    left: "310px"
                })
        }
        if (hours < global_start && global_start - hours < 0.3) {
            groupLabels[group]
                .style({"opacity": "0"})
                //.transition()
                //.duration(500)
                .style({"opacity": "1"})
        }

        //console.log(group, data[weekDay][group])
    })
}


function updateLabels(points) {
    //console.log(points, "points!");
    var startPoint = points.path[0];
    var finishPoint = points.path[points.path.length - 1];
    var startFloor = getFloorFromId(roomDict[startPoint.no_room]) || global_floor;
    var finishFloor = getFloorFromId(roomDict[finishPoint.no_room]) || global_floor;
    [startDiv, finishDiv].forEach(function(block) {
        [2,4,5].forEach(function(floor) {
            block.classed("floor_" + floor, false)
        })
    });

    startDiv
        .text(startPoint.no_room)
        .classed("floor_" + startFloor, true)
        .style({
            opacity: (global_floor == startFloor && startPoint.no_room)*1 ,
            left: (xScale(startPoint.x) - 5) + "px",
            top: (yScale(startPoint.y) - 15) + "px"
        });
    finishDiv
        .text(finishPoint.no_room)
        .classed("floor_" + finishFloor, true)
        .style({
            opacity: (global_floor == finishFloor && finishFloor.no_room)*1,
            left: (xScale(finishPoint.x) - 10) + "px",
            top: (yScale(finishPoint.y) - 15) + "px"
        });
}
var line = d3.svg.line()
    .x(function (d) {
        return xScale(d.x)
    })
    .y(function (d) {
        return yScale(d.y)
    });

function completePath(path, data) {
    if (!data) return;
    Object.keys(path).forEach(function(key) {
        path[key].attr("d", line(data[key]));
        path[key].attr("opacity", 0)
            .transition()
            .duration(1000)
            .attr("opacity", 1);
    })
}
function completeOnePath(data) {
    Object.keys(commonPath).forEach(function(key) {
        commonPath[key].attr("d", line(data[key]));
        commonPath[key].attr("opacity", 0)
            .transition()
            .duration(1000)
            .attr("opacity", 1);
    });
}

var groupLabels = {
    "504_SE": container.select("#group_504_SE"),
    "503_CS": container.select("#group_503_CS"),
    "504_BI": container.select("#group_504_BI"),
    "603_CS": container.select("#group_603_CS")
};

var groupPathes = {
    "504_SE": {
        path: svg.append("path").classed("group_504_SE floor_0", true),
        path2: svg.append("path").classed("group_504_SE floor_2", true),
        path4: svg.append("path").classed("group_504_SE floor_4", true),
        path5: svg.append("path").classed("group_504_SE floor_5", true)},
    "503_CS": {
        path: svg.append("path").classed("group_503_CS floor_0", true),
        path2: svg.append("path").classed("group_503_CS floor_2", true),
        path4: svg.append("path").classed("group_503_CS floor_4", true),
        path5: svg.append("path").classed("group_503_CS floor_5", true)},
    "504_BI": {
        path: svg.append("path").classed("group_504_BI floor_0", true),
        path2: svg.append("path").classed("group_504_BI floor_2", true),
        path4: svg.append("path").classed("group_504_BI floor_4", true),
        path5: svg.append("path").classed("group_504_BI floor_5", true)},
    "603_CS": {
        path: svg.append("path").classed("group_603_SE floor_0", true),
        path2: svg.append("path").classed("group_603_SE floor_2", true),
        path4: svg.append("path").classed("group_603_SE floor_4", true),
        path5: svg.append("path").classed("group_603_SE floor_5", true)}
};

function drawPath(data, custom_path) {
    data = {
        path: data.path.map(function (d) {
            return data[d]
        }),
        path2: data.path2.map(function (d) {
            return data[d]
        }),
        path4: data.path4.map(function (d) {
            return data[d]
        }),
        path5: data.path5.map(function (d) {
            return data[d]
        })
    };
    if (custom_path) {
        completePath(custom_path, data);
    } else {
        completeOnePath(data);
        updateLabels(data)
    }

}

function moveToPath(t,floor, data) {
    var currentPath = "path" + floor;

    Object.keys(data).forEach(function (key) {
        var gr = data[key];
        var curGr = groupLabels[gr[currentPath].name];
        var coords = gr[currentPath].path.getPointAtLength(t * gr[currentPath].total);
        curGr.style({
            top: coords.y + "px",
            left: coords.x + "px"
        })

    })
}
function updateGroupLabelsFloor(floor) {
    [2,4,5].forEach(function(f){Object.keys(groupLabels).forEach(function(label){
        groupLabels[label].classed("floor_" + f, false);
    })
    });
    Object.keys(groupLabels).forEach(function(label){
        groupLabels[label].classed("floor_" + floor, true);
    });
}
function moveTable(floorFrom, floorTo) {
    console.log(floorFrom, floorTo);
    var groups = Object.keys(groupPathes);
    var data = {};
    var maxLength = 0;
    groups.forEach(function(d) {
        var pathes = Object.keys(groupPathes[d]);
        data[d] = {};
        pathes.forEach(function(floor_path){
            var p = groupPathes[d][floor_path].node();
            var l = p.getTotalLength();
            if (l > maxLength) {
                maxLength = l
            }
            data[d][floor_path] = {
                path: p,
                total: l,
                name: d
            }
        });

    });
    console.log(maxLength);
    setFloor(floorFrom);
    updateGroupLabelsFloor(floorFrom)
    updateFloorPath();
    d3.transition()
        .ease("linear")
        .duration(3000)
        .tween("rotate", function () { return function (t) { moveToPath(t,floorFrom,data) } })
        .transition()
        .each("end", function () {
            if (floorFrom != floorTo) {
                setFloor(floorTo);
                updateGroupLabelsFloor(floorTo);
                updateFloorPath();
                d3.transition()
                    .ease("linear")
                    .duration(3000)
                    .tween("rotate", function () {
                        return function (t) { moveToPath(t,floorTo,data) } })
                    .transition()
                    .each("end", function () {
                        console.log("end")
                    })
            }
            console.log("end")
        })
}
function updateFloorPath(){
    d3.selectAll(".floor_" + global_floor + ":not(img)").style("opacity",1);
    d3.select(".button_floor_" + global_floor).classed("floor-active", true);
    d3.select("img.floor_" + global_floor)
        .transition()
        .duration(200)
        .style("opacity", 1);
    d3.select(".floor_header").text("Floor " + global_floor);
    [2,4,5].forEach(function(floor) {
        if (floor != global_floor) {
            d3.select(".button_floor_" + floor).classed("floor-active", false);
            d3.selectAll(".floor_" + floor).style("opacity", 0);
        }
    })
}
function setFloor(floor) {
    global_floor = floor;
    updateFloorPath();
}
setFloor(2);






