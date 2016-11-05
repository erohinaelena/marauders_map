var customTime = new Date();

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

var svg = container.select("#mapSvg");

var commonPath = {
    path: svg.append("path").classed("floor_0", true),
    path2: svg.append("path").classed("floor_2", true),
    path4: svg.append("path").classed("floor_4", true),
    path5: svg.append("path").classed("floor_5", true)
};

var startDiv = container.select("#start_label");
var finishDiv = container.select("#finish_label");
var hint = container.select(".hint");

svg.attr("width", width + "px");
svg.attr("height", height + "px");

var isEvenClick = true;
var node1;
var node2;
function getFloorFromId(id) {
    if (!id) return;
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
        console.log("click!");
        console.log(d3.event.offsetX, d3.event.offsetY);
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
        setInterval(function(){
            //console.log(mouse);
            //updateGroupBySchedule(data, xmlData);
        }, 1000);
        updateGroupBySchedule(data, xmlData);
        document.onkeydown = function(e) {
            console.log(e);
            if (e.keyCode == 39) {
                var prevHours = customTime.getHours();
                prevHours++;
                prevHours = prevHours > 23 ? 0 : prevHours;
                customTime.setHours(prevHours);
                updateGroupBySchedule(data, xmlData);

            } else if (e.keyCode == 37) {
                prevHours = customTime.getHours();
                prevHours--;
                prevHours = prevHours < 0 ? 23 : prevHours;
                customTime.setHours(prevHours);
                updateGroupBySchedule(data, xmlData);

            } else if (e.keyCode == 40) {
                var prevMinutes = customTime.getMinutes();
                prevMinutes--;
                prevMinutes = prevMinutes < 0 ? 59 : prevMinutes;
                customTime.setMinutes(prevMinutes);
                updateGroupBySchedule(data, xmlData);

            }else if (e.keyCode == 38) {
                prevMinutes = customTime.getMinutes();
                prevMinutes++;
                prevMinutes = prevMinutes > 59 ? 0 : prevMinutes;
                customTime.setMinutes(prevMinutes);
                updateGroupBySchedule(data, xmlData);

            }

        }
    });


});

var weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function updateGroupBySchedule(data, xmlData) {
    var date = new Date()//customTime;
    date.setHours(10);
    date.setMinutes(46);
    var weekDay = "Friday"//weekDays[date.getDay() - 1];
    var hours = date.getHours() + date.getMinutes() / 60;

    Object.keys(groupLabels).forEach(function (group) {//для каждой группы
        var coords;
        var currentAud = {};
        data[weekDay][group].forEach(function (item) { //для каждого пункта группы в сегодняшнем расписании
            var start = item.Time_start.split(":");
            start = start[0] * 1 + start[1] / 60;
            var finish = item.Time_finish.split(":");
            finish = finish[0] * 1 + finish[1] / 60;

            if (hours >= start && hours >= finish) { //если время перехода между парами уже прошло, группа сидит в аудитории, в которую до этого пришла
                if (item.Aud_to) {
                    currentAud = _.find(xmlData, function (d) {
                        return d.id == roomDict[item.Aud_to]
                    });
                } else {
                    currentAud = _.find(xmlData, function (d) { //если аудитория не указана, группа сидит в комнате отдыха
                        return d.id == roomDict["434"]
                    });
                }

            }

            if (hours >= start && hours <= finish && item.Aud_from && item.Aud_to) { //если сейчас им как раз пора переходить, то вое он, путь для анимации
                var node1 = roomDict[item.Aud_from];
                var node2 = roomDict[item.Aud_to];
                if (!node1 || !node2) {
                    console.log(item.Aud_from, item.Aud_to, node1, node2, group);
                } else {
                    console.log("move!",item.Aud_from, item.Aud_to, group);
                    getData(node1, node2, groupPathes[group], group);
                }
            }

        });

        if (!currentAud.coords) {
            currentAud = _.find(xmlData, function (d) {
                return d.aud == "434"
            });
        }
        coords = currentAud.coords;
        floorData[group].from = floorData[group].to = getFloorFromId(currentAud.id);

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
                .style({opacity: "1"})
                //.transition()
                //.duration(500)
                .style({
                    opacity: "0.5",
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
    });
    updateGroupLabelsFloor("from");
    updateFloorPath();
}

var startFloor;
var finishFloor;
function updateLabels(points) {
    var startPoint = points.path[0];
    var finishPoint = points.path[points.path.length - 1];
    startFloor = getFloorFromId(roomDict[startPoint.no_room]) || global_floor;
    finishFloor = getFloorFromId(roomDict[finishPoint.no_room]) || global_floor;
    [startDiv, finishDiv].forEach(function(block) {
        [2,4,5].forEach(function(floor) {
            block.classed("floor_" + floor, false)
        })
    });
    startDiv
        .text(startPoint.no_room)
        .classed("floor_" + startFloor, true)
        .style({
            opacity: (global_floor == startFloor && startPoint.no_room*1)*1 ,
            left: (xScale(startPoint.x)) + "px",
            top: (yScale(startPoint.y)) + "px"
        });
    finishDiv
        .text(finishPoint.no_room)
        .classed("floor_" + finishFloor, true)
        .style({
            opacity: (global_floor == finishFloor && finishPoint.no_room*1)*1,
            left: (xScale(finishPoint.x)) + "px",
            top: (yScale(finishPoint.y)) + "px"
        });
    if (startFloor != finishFloor) {
        var p = "path" + startFloor;
        var hintCoords = points[p][points[p].length - 1];
        console.log(hint, hintCoords);
        hint.style({
            opacity: 1,
            left: (xScale(hintCoords.x) - 50) + "px",
            top: (yScale(hintCoords.y)) + "px"
        });
    }
    updateHint();
    updateFloorPath();

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
        path2: svg.append("path").classed("group_504_SE", true),
        path4: svg.append("path").classed("group_504_SE", true),
        path5: svg.append("path").classed("group_504_SE", true)},
    "503_CS": {
        path: svg.append("path").classed("group_503_CS floor_0", true),
        path2: svg.append("path").classed("group_503_CS", true),
        path4: svg.append("path").classed("group_503_CS", true),
        path5: svg.append("path").classed("group_503_CS", true)},
    "504_BI": {
        path: svg.append("path").classed("group_504_BI floor_0", true),
        path2: svg.append("path").classed("group_504_BI", true),
        path4: svg.append("path").classed("group_504_BI", true),
        path5: svg.append("path").classed("group_504_BI", true)},
    "603_CS": {
        path: svg.append("path").classed("group_603_CS floor_0", true),
        path2: svg.append("path").classed("group_603_CS", true),
        path4: svg.append("path").classed("group_603_CS", true),
        path5: svg.append("path").classed("group_603_CS", true)}
};
var floorData = {
    "504_SE": {from: 2, to:2},
    "503_CS": {from: 2, to:2},
    "504_BI": {from: 2, to:2},
    "603_CS": {from: 2, to:2}
};

var groupOffsets = {
    "504_SE": {x: 5, y: 10, delay: 0.1},
    "503_CS": {x: -5, y: -10, delay: 0.2},
    "504_BI": {x: 5, y: 10, delay: 0},
    "603_CS": {x: 5, y: -5, delay: 0}
};

function drawPath(data, custom_path, group) {
    var fFrom = getFloorFromId(data.path[0]);
    var fTo = getFloorFromId(data.path[data.path.length - 1]);

    function getPathPoints(d,i) {
        if ((i == 0 || i == data.path.length - 1) && custom_path) {
            data[d].x += groupOffsets[group].x;
            data[d].y += groupOffsets[group].y;
            return data[d]
        }
        return data[d]
    }
    data = {
        path: data.path.map(getPathPoints),
        path2: data.path2.map(getPathPoints),
        path4: data.path4.map(getPathPoints),
        path5: data.path5.map(getPathPoints)
    };
    if (custom_path) {
        completePath(custom_path, data);
        floorData[group].from = fFrom;
        floorData[group].to = fTo;

        moveTable()
    } else {
        completeOnePath(data);
        updateLabels(data)
    }

}

function updateGroupLabelsFloor(field) {
    [2,4,5].forEach(function(f){Object.keys(groupLabels).forEach(function(label){
        groupLabels[label].classed("floor_" + f, false);
    })
    });
    Object.keys(groupLabels).forEach(function(label){
        groupLabels[label].classed("floor_" + floorData[label][field], true);
    });
}

function moveToPath(t,field,data) {

    Object.keys(data).forEach(function (key) {
        if (field == "to" && floorData[key].from == floorData[key].to) return;
        var gr = data[key];
        var currentPath = "path" + floorData[key][field];
        var curGr = groupLabels[key];
        var delay = groupOffsets[key].delay;
        var percent = (field == "from")? Math.max(0, t-delay) : (t < delay)? 0 : (t - delay)/(1 - delay);
        var coords = gr[currentPath].path.getPointAtLength(percent * gr[currentPath].total);
        if (gr[currentPath].total) {
            curGr.style({
                top: coords.y + "px",
                left: coords.x + "px"
            })
        }
    })
}
function moveTable() {
    //console.log(floorFrom, floorTo);
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
                floorFrom: floorData[d].from,
                floorTo: floorData[d].to
            }
        });

    });
    updateGroupLabelsFloor("from");
    updateFloorPath();
    d3.transition()
        .ease("linear")
        .duration(3000)
        .tween("rotate", function () { return function (t) { moveToPath(t,"from",data) } })
        .transition()
        .each("end", function () {
                updateGroupLabelsFloor("to");
                updateFloorPath();
                d3.transition()
                    .ease("linear")
                    .duration(3000)
                    .tween("rotate", function () {
                        return function (t) { moveToPath(t,"to",data) } })
                    .transition()
                    .each("end", function () {
                        console.log("end2")
                    });
            console.log("end1")
        })
}
var endings = {2:"nd",4:"th",5:"th"};

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
    });


}
function updateHint() {
    if (startFloor == finishFloor) {
        hint.style("opacity", 0);
        return;
    }
    if (global_floor == startFloor) {
        var arrow = (finishFloor > startFloor) ? "↑" : "↓";
        hint.text("to " + finishFloor + endings[finishFloor] + " floor " + arrow)
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1)
    } else if (global_floor == finishFloor) {
        arrow = (finishFloor < startFloor) ? "↑" : "↓";
        hint.text("to " + startFloor + endings[startFloor] + " floor " + arrow)
            .style("opacity", 0)
            .transition()
            .duration(200)
            .style("opacity", 1)
    } else {
        hint.style("opacity", 0)
    }
}
function setFloor(floor) {
    global_floor = floor;
    updateHint();
    updateFloorPath();
}
setFloor(2);

function drawLoggedUsers(data) {
    var users = svg.selectAll("circle.users").data(data);
    users.exit().remove();

    users.enter().append("circle")
        .attr("class", function(d) {
            return "users floor_" + getFloorFromId(roomDict[d.no_room])
        })
        .attr("r", 5)
        .attr("fill", "#000");

    users
        .attr("class", function(d) {
            return "users floor_" + getFloorFromId(roomDict[d.no_room])
        })
        .attr("cx", function(d){return xScale(d.x)})
        .attr("cy", function(d){return yScale(d.y)});

    var textUsers = svg.selectAll("text.users").data(data);
    textUsers.exit().remove();

    textUsers.enter().append("text")
        .attr("class", function(d) {
            return "users floor_" + getFloorFromId(roomDict[d.no_room])
        })
        .text(function(d){return d.name})
        .attr("fill", "#000");

    textUsers
        .attr("class", function(d) {
            return "users floor_" + getFloorFromId(roomDict[d.no_room])
        })
        .attr("x", function(d){
            var thisWidth = this.getBoundingClientRect().width;
            return xScale(d.x) - thisWidth / 2})
        .attr("y", function(d){return yScale(d.y) - 7})
}
setInterval(function(){
    getOnlineUsers();
    updateFloorPath();
}, 1000);
setInterval(function(){
    //getOnlineUsers();
    //updateFloorPath()
    getRandomPath5();
}, 10000);
getOnlineUsers();

var bigK = d3.select("#K");
var pathK = svg.append("path").style("opacity", 0);
var leftFoots = svg.append("g").classed("leftFoots", true);
var rightFoots = svg.append("g").classed("rightFoots", true);

function updateFoots() {
    var step = 20;
    var width = 20;
    var footCount = pathK.node().getTotalLength() / step;
    var footData = d3.range(0,footCount).map(function(d, i) {
        return pathK.node().getPointAtLength(i * step);
    });
    var foots = leftFoots.selectAll("image").data(footData);
    foots.exit().remove();
    foots.enter().append("image")
        .attr("xlink:href", "static/img/foot_r.svg")
        .attr("width", width)
        .attr("height", width);

    leftFoots.selectAll("image")
        .attr("x", function(d) {return d.x - width/2 - 4})
        .attr("y", function(d) {return d.y - width/2 - 4})
        .style("display", function(d,i) {return i%2 == 1 ? "block" : "none" })
        .attr("transform", function(d, i) {
            var angle = 0;
            if (i) {
                var prevPoint = footData[i - 1];
                angle = Math.atan2(prevPoint.y - d.y, prevPoint.x - d.x) * 180 / Math.PI
            }
            return "rotate(" + angle + "," + d.x + "," + d.y + ")"
        });

    foots = rightFoots.selectAll("image").data(footData);
    foots.exit().remove();
    foots.enter().append("image")
        .attr("xlink:href", "static/img/foot_l.svg")
        .attr("width", width)
        .attr("height", width)
    rightFoots.selectAll("image")
        .attr("x", function(d) {return d.x - width / 2 + 4})
        .attr("y", function(d) {return d.y - width / 2 + 4})
        .style("display", function(d,i) {return i%2 == 0 ? "block" : "none" })
        .attr("transform", function(d, i) {
            var angle = 0;
            if (i) {
                var prevPoint = footData[i - 1];
                angle = Math.atan2(prevPoint.y - d.y, prevPoint.x - d.x) * 180 / Math.PI
            }
            return "rotate(" + angle + "," + d.x + "," + d.y + ")"
        });
}

function draw5Path(data) {
    data = {
        path: data.path.map(function(d) {return data[d]})
    };
    pathK.attr("d", line(data.path));
    updateFoots();
    var total = pathK.node().getTotalLength();
    var dur = Math.floor(total * 10 +  Math.random() * 1000);
    d3.transition()
        .ease("linear")
        .duration(dur)
        .tween("rotate", function () { return function (t) {
            var coords = pathK.node().getPointAtLength(t * total);
            bigK.style({
                top: coords.y + "px",
                left: coords.x + "px"
            });
            [rightFoots, leftFoots].forEach(function(f){
                f.selectAll("image")
                    .attr("opacity", function(d,i) {
                        if (i > t * total / 20) {
                            return 0;
                        } else return 1 / (t * total / 20 - i)
                    })
            })

            }
        })
        .each("end", function () {
            [rightFoots, leftFoots].forEach(function(f){
                f.selectAll("image")
                    .transition()
                    .duration(200)
                    .attr("opacity", 0)
            })
        });
    //completeOnePath(data);

}
var startNode5 = 5066;
function getRandomPath5() {
    var next = nodes5[Math.floor(Math.random() * nodes5.length)];
    if (startNode5 != next) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "graph/" + startNode5 + "/" + next + "", true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) return;
            draw5Path(JSON.parse(xhr.responseText));
            startNode5 = next;
        }
    }

}






