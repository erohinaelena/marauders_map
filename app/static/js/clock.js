
var delta = {'minute': 0, 'hour': 0};
var last = {'minute': null, 'hour': null};
var den = {'minute': 10 * 955 *  60, 'hour': 10 * 955 *  60 * 60};
// var lastAngle = 0;

var margin = { top: 20, right: 10, bottom: 20, left: 15 };
var w = 200;
var h = 200;

// radius of entire figure
var r = Math.min(w, h)/2;

// drag behavior
var drag = d3.behavior.drag()
    .on('drag', dragMov)
    .on('dragend', function(){
        updateGroupBySchedule(scheduleData, xmlData)
    })

var date = new Date;
var outerTime = {hour: date.getHours(), minute: date.getMinutes()};

var starth = outerTime.hour - 3 < 0 ? outerTime.hour + 21 : outerTime.hour - 3;
var startm = outerTime.minute - 15 < 0 ? outerTime.minute + 45 : outerTime.minute - 15;

var time = {hour:starth, minute:startm};

function dragMov() {
    var mouse = Math.atan2(d3.event.y, d3.event.x);
    var deg = mouse / (Math.PI/ 180);
    deg = deg < 0 ? deg + 360 : deg;
    var which = d3.select(this).attr('class');
    if (which == "minute") {
        var dm = time["minute"] - deg/6;
        time["minute"] = deg / 6;
        if (dm > 50) {
            time["hour"]++;
        } else if (dm < -50) {
            time["hour"]--;
        }
    } else {
        //console.log(which, Math.floor(deg / 30));
        time["minute"] = (deg % 30)/30 * 60;
        var dh = time["hour"] - deg/30;
        time["hour"] = Math.floor(deg / 30);
        if (dh > 10) {
            time["hour"] = Math.floor(deg / 30) + 12;
        } else if (time["hour"] > 12) {
            time["hour"] = Math.floor(deg / 30) + 12;
        }
        if (time["hour"] > 24) {
            time["hour"] -= 24;
        }
    }
    //console.log(minuteScale(mouse))
    delta[which] = mouse;
    last[which] = new Date();
    //time[which] = which == "minute" ? deg / 6 : deg / 30;
    moveArrows(time);

}

var clock = {
    r: r - 50,
    faceColor: '#FCFFF5',
    tickColor: '#000',
    sliderR: 12,
    hands: [
        {
            type: 'minute',
            content: 'M',
            value: 0,
            length: r - 48,
            ringR: r, // radius of surrounding ring
            color: '#924b00',//'#91AA9D',
            width: 4,
            labels: d3.range(5,61,5),
            scale: d3.scale.linear().domain([0,59]).range([0,354])
        },
        {
            type: 'hour',
            content: 'H',
            value: 0,
            length: r - 70,
            ringR: r - 20,
            color: '#630',
            width: 6,
            ticks: d3.range(0, 60), // start, stop, step
            tickLength: 5,
            tickStrokeWidth: 1,
            scale: d3.scale.linear().domain([0,59]).range([0,354]),
            temp: 1
        }
    ]
};


// SVG -> G with margin convention
var svg = d3.select('.clock').append('svg');
var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Clock Face
var face = g.append('g')
    .datum(clock)
    .attr('transform', 'translate(' + w/2 + ',' + r + ')');

face.append('circle')
    .attr({
        r: function(d) { return d.r; },
        fill: function(d) { return d.faceColor; },
        stroke: function(d) { return d.tickColor; },
        'stroke-width': 2
    });

var ticks = face.selectAll('g')
    .data( function(d) { return d.hands; })
    .enter().append('g')
    // only get ticks for hour, minute
    .filter(function(d, i) { return i > 0; });

ticks.selectAll('.tick')
    .data( function(d) {
        return d.ticks.map(function(rangeValue) {
            return {
                location: d.scale(rangeValue),
                tickLength: d.tickLength,
                tickStrokeWidth: d.tickStrokeWidth
            }
        })
    })
    .enter().append('line')
    .classed('tick', true)
    .attr({
        "x1": 0,
        "y1": clock.r,
        "x2": 0,
        "y2": function(d) { return clock.r - d.tickLength; },
        "stroke": clock.tickColor,
        "stroke-width": function(d) { return d.tickStrokeWidth; },
        "transform": function(d) { return 'rotate(' + d.location + ')'; }
    });

face.selectAll('.tick-label')
    .data( function(d) {
        return d3.range(5, 61, 5).map(function(rangeValue) {
            return {
                location: d.hands[0].scale(rangeValue),
                scale: d.hands[0].scale,
                value: rangeValue/5,
                radius: clock.r + 10
            }
        })
    })
    .enter().append('text')
    .classed('.tick-label', true)
    .text(function(d) { return d.value; })
    .attr({
        'text-anchor': 'middle',
        'fill': clock.tickColor,
        'font-family': 'MountainsofChristmas-Regular',
        'font-size': 15,
        x: function(d) {
            return d.radius * Math.sin(d.location * (Math.PI / 180));
        },
        y: function(d) {
            return -d.radius * Math.cos(d.location * (Math.PI / 180)) + 4.5;
        }

    });


var hands = face.selectAll('.hand')
    .data( function(d) { return d.hands; })
    .enter().append('line')
    .attr('class', function(d) {
        return 'hands ' + d.type;
    })
    .attr({
        'x1': 0,
        'y1': 0,
        'x2': function(d) { return d.length * Math.cos(270 * (Math.PI / 180)); },
        'y2': function(d) { return d.length * Math.sin(270 * (Math.PI / 180)); },
        'stroke': function(d) { return d.color; },
        'stroke-width': function(d) { return d.width; },
        'stroke-linecap': 'round'
    });

// center circle
face.append('circle')
    .classed('center', true)
    .attr({
        r: r/20,
        fill: clock.hands[1].color
    });

var rings = face.selectAll('.outer-ring')
    .data( function(d) { return d.hands; })
    .enter().append('g')
    .classed('outer-ring', true);

// outer ring
rings.append('circle')
    .classed('ring', true)
    .attr({
        r: function(d) { return d.ringR; },
        fill: 'transparent',
        stroke: clock.tickColor,
        'stroke-width': 1
    });

var sliderGroup = rings.append('g')
    .attr('class', function(d) {
        return d.type;
    })
    .style('cursor', 'move')
    .call(drag);

sliderGroup.append('circle')
    .classed('slider', true)
    .attr({
        r: clock.sliderR,
        fill: function(d) { return d.color; },
        cx: function(d) { return d.ringR * Math.cos(270 * (Math.PI / 180)) },
        cy: function(d) { return d.ringR * Math.sin(270 * (Math.PI / 180)); }
    });

// slider content
sliderGroup.append('text')
    .classed('content', true)
    .text(function(d) { return d.content; })
    .attr({
        fill: 'white',
        'text-anchor': 'middle',
        'font-size': 16,
        'font-family': 'MountainsofChristmas-Regular',
        x: function(d) { return d.ringR * Math.cos(270 * (Math.PI / 180)) },
        y: function(d) {
            return d.ringR * Math.sin(270 * (Math.PI / 180)) + 5.5;
        }
    });

function moveArrows(time) {
    outerTime.hour = time.hour + 3 >= 24 ? time.hour - 21 : time.hour + 3;
    outerTime.minute = time.minute + 15 >= 60 ? time.minute - 45 : time.minute + 15;

    var minutes = time.minute;
    var hours = time.hour + minutes/60;
    var angle = {minute: minutes/60 * 2 * Math.PI, hour: hours/12 * 2 * Math.PI};
    console.log(outerTime);
    // move slider element
    ["minute", "hour"].forEach(function(witch) {
        var mouse = angle[witch];
        d3.select('g.' + witch).select('.slider-background').attr({
            cx: function(d) { return d.ringR * Math.cos(mouse); },
            cy: function(d) { return d.ringR * Math.sin(mouse); }
        });
        d3.select('g.' + witch).select('.slider').attr({
            cx: function(d) { return d.ringR * Math.cos(mouse) },
            cy: function(d) { return d.ringR * Math.sin(mouse); }
        });
        d3.select('g.' + witch).select('.content').attr({
            x: function(d) { return d.ringR * Math.cos(mouse) },
            y: function(d) { return d.ringR * Math.sin(mouse) + 5.5; }
        });

        // move hand element
        d3.select('line.' + witch)
            .attr({
                x2: function(d) { return d.length * Math.cos(mouse); },
                y2: function(d) { return d.length * Math.sin(mouse); }
            });
    })

}

moveArrows(time);
setInterval(function(){
    time["minute"]++;
    if(time["minute"] == 60) {
        time["minute"] = 0;
        time["hour"]++;
        if (time["hour"] == 24) {
            time["hour"] = 0;
        }
    }
    moveArrows(time);
}, 60000);
      