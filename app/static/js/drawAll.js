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

var commonPath = svg.append("path");

var startDiv = container.select("#start_label");
var finishDiv = container.select("#finish_label");

svg.attr("width", width + "px");
svg.attr("height", height + "px");

var isEvenClick = true;
var node1;
var node2;
function getFloorFromId(id) {
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
        //console.log(node.name);
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
    var node1 = 0;
    var node2 = 0;
    if (!weekDay) {

    }
    Object.keys(groupLabels).forEach(function (group) {
        var coords = 0;
        data[weekDay][group].forEach(function (item) {
            var start = item.Time_start.split(":");
            start = start[0] * 1 + start[1] / 60;
            var finish = item.Time_finish.split(":");
            finish = finish[0] * 1 + finish[1] / 60;

            if (hours >= start && hours >= finish && item.Aud_to) {
                //console.log(item.Aud_to, roomDict[item.Aud_to], group);
                coords = _.find(xmlData, function (d) {
                    return d.id == roomDict[item.Aud_to]
                });
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
            //console.log("!coords", group);
            groupLabels[group].style("opacity", 0)
        } else {
            coords = coords.coords;
            groupLabels[group].style({
                opacity: 1,
                top: yScale(coords.y) + "px",
                left: xScale(coords.x) + "px"
            });
            console.log(coords,group, "moved")
        }

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
    console.log(points, "points!");
    var startPoint = points[0];
    var finishPoint = points[points.length - 1];
    startDiv
        .text(startPoint.no_room)
        .style({
            opacity: 1,
            left: (xScale(startPoint.x) - 5) + "px",
            top: (yScale(startPoint.y) - 15) + "px"
        });
    finishDiv
        .text(finishPoint.no_room)
        .style({
            opacity: 1,
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
    console.log(path);
    Object.keys(path).forEach(function(key) {
        path[key].attr("d", line(data[key]));
        path[key].attr("opacity", 0)
            .transition()
            .duration(1000)
            .attr("opacity", 1);
    })
}
function completeOnePath(data) {
    commonPath.attr("d", line(data));
    commonPath.attr("opacity", 0)
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
    if (custom_path) {
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
        completePath(custom_path, data);
    } else {
        data = data.path.map(function (d) {
            return data[d]});
        completeOnePath(data);
        updateLabels(data)
    }

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
    updateFloorPath();
    d3.transition()
        .ease("linear")
        .duration(3000)
        .tween("rotate", function () {
            return function (t) {
                Object.keys(data).forEach(function (key) {
                    var gr = data[key];
                    var currentPath = "path" + floorFrom;
                    var coords = gr[currentPath].path.getPointAtLength(t * gr[currentPath].total);
                    //console.log(groupLabels[gr.name]);
                    groupLabels[gr[currentPath].name].style({
                        top: coords.y + "px",
                        left: coords.x + "px"
                    });
                })

            }
        })
        .transition()
        .each("end", function () {
            if (floorFrom != floorTo) {
                setFloor(floorTo);
                updateFloorPath();
                d3.transition()
                    .ease("linear")
                    .duration(3000)
                    .tween("rotate", function () {
                        return function (t) {
                            Object.keys(data).forEach(function (key) {
                                var gr = data[key];
                                var currentPath = "path" + floorTo;
                                var coords = gr[currentPath].path.getPointAtLength(t * gr[currentPath].total);
                                //console.log(groupLabels[gr.name]);
                                groupLabels[gr[currentPath].name].style({
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
            console.log("end")
        })
}
function updateFloorPath(){
    svg.selectAll("path.floor_" + global_floor).style("opacity",1);
    if (global_floor == 5) {
        svg.selectAll("path.floor_4, path.floor_2").style("opacity",0)
    }
    if (global_floor == 4) {
        svg.selectAll("path.floor_2, path.floor_5").style("opacity",0)
    }
    if (global_floor == 2) {
        svg.selectAll("path.floor_4, path.floor_5").style("opacity",0)
    }
}
function setFloor(floor) {
    global_floor = floor;
    commonPath.attr("opacity", 0);
    startDiv.style("opacity", 0);
    finishDiv.style("opacity", 0);
    updateFloorPath();
    d3.select(".floor_header").text("Floor " + floor);
    if (floor == 2) {
        d3.selectAll("img.floor_4, img.floor_5")
            .style("opacity", 0);
        d3.select("img.floor_2")
            .transition()
            .duration(200)
            .style("opacity", 1);

        d3.selectAll(".button_floor_4, .button_floor_5").classed("floor-active", false);

        d3.select(".button_floor_2").classed("floor-active", true)
    }
    if (floor == 4) {
        d3.selectAll("img.floor_2, img.floor_5")
            .style("opacity", 0);
        d3.select("img.floor_4")
            .transition()
            .duration(200)
            .style("opacity", 1);

        d3.selectAll(".button_floor_2,.button_floor_5").classed("floor-active", false);

        d3.select(".button_floor_4").classed("floor-active", true)

    }
    if (floor == 5) {
        d3.selectAll("img.floor_2, img.floor_4")
            .style("opacity", 0);
        d3.select("img.floor_5")
            .transition()
            .duration(200)
            .style("opacity", 1);

        d3.selectAll(".button_floor_2, .button_floor_4").classed("floor-active", false);

        d3.select(".button_floor_5").classed("floor-active", true)

    }

}
setFloor(2);






