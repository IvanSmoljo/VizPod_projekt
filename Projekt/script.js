//Width and height of map
var width = 900;
var height = 800;
var selection = "Black";

var minVal;
var minVal;
var dataArray = [];
var selectedPath = null;
var count = 0;

var tooltip = d3
  .select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("opacity", 0)
  .style("border-color", "black")
  .style("background-color", "#5CC09F")
  .style("border-radius", "10")
  .style("border-width", "3")
  .style("border-height", "10")
  .style("visibility", "hidden");

// D3 Projection
var projection = d3.geo
  .albersUsa()
  .translate([width / 2, height / 2]) // translate to center of screen
  .scale([1200]); // scale things down so see entire US

// Define path generator
var path = d3.geo
  .path() // path generator that will convert GeoJSON to SVG paths
  .projection(projection); // tell path generator to use albersUsa projection

d3.select("body").insert("h2", ":first-child");
//Create SVG element and append map to the SVG
var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("align", "center");

// Load in my states data!

d3.csv("crime.csv")
  .row(function (d) {
    return {
      state: d.State,
      ag: d.totalAggrevatedAssault,
      robberies: d.totalrobberies,
      murders: d.totalMurders,
      robberyFirearms: d.robberyFirearms,
      robberyKnives: d.robberyKnives,
      roberyOtherWeapons: d.roberyOtherWeapons,
      murderHandguns: d.murderHandguns,
      murderRfiles: d.murderRfiles,
      murderShotgun: d.murderShotgun,
      murderKnives: d.murderKnives,
    };
  })

  .get(function (error, data) {
    dataArray = [];
    for (var d = 0; d < data.length; d++) {
      dataArray.push(data[d].ag);
    }
    minVal = d3.min(dataArray);
    maxVal = d3.max(dataArray);

    // Load GeoJSON data and merge with states data
    d3.json("us-states.json", function (json) {
      // Loop through each state data value in the .csv file
      for (var i = 0; i < data.length; i++) {
        // Grab State Name
        var dataState = data[i].state;

        // Grab data value
        var dataAg = data[i].ag;
        var dataMurders = data[i].murders;
        var dataRobberies = data[i].robberies;
        var dataRobOtherWeapons = data[i].roberyOtherWeapons;
        var dataRobberyKnives = data[i].robberyKnives;
        var dataRobberyFirearms = data[i].robberyFirearms;
        var dataMurderHandguns = data[i].murderHandguns;
        var dataMurderShotgun = data[i].murderShotgun;
        var dataMurderKnives = data[i].murderKnives;
        var dataMurderRifles = data[i].murderRfiles;

        // Find the corresponding state inside the GeoJSON
        for (var j = 0; j < json.features.length; j++) {
          var jsonState = json.features[j].properties.name;

          if (dataState == jsonState) {
            // Copy the data value into the JSON
            json.features[j].properties.ag = dataAg;
            json.features[j].properties.murders = dataMurders;
            json.features[j].properties.robberies = dataRobberies;
            json.features[j].properties.roberyOtherWeapons =
              dataRobOtherWeapons;
            json.features[j].properties.robberyKnives = dataRobberyKnives;
            json.features[j].properties.robberyFirearms = dataRobberyFirearms;
            json.features[j].properties.murderHandguns = dataMurderHandguns;
            json.features[j].properties.murderShotgun = dataMurderShotgun;
            json.features[j].properties.murderKnives = dataMurderKnives;
            json.features[j].properties.murderRfiles = dataMurderRifles;

            // Stop looking through the JSON
            break;
          }
        }
      }

      // Bind the data to the SVG and create one path per GeoJSON feature
      svg
        .selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "#fff")
        .style("stroke-width", "0.6") //Boreders between states
        .style("fill-opacity", 0.55)
        .on("mouseover", function (d) {
          if (selectedPath !== this) {
            d3.select(this).style("fill-opacity", 0.4);
          }

          return tooltip
            .style("visibility", "visible")
            .style("opacity", 0.8)
            .html(
              "State: " +
                d.properties.name +
                "<br/>" +
                " Murders: " +
                d.properties.murders +
                "<br/>" +
                " Robberies: " +
                d.properties.robberies
            );
        })
        .on("mousemove", function () {
          return tooltip
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
        })
        .on("mouseout", function (d) {
          if (selectedPath !== this) {
            d3.select(this).style("fill-opacity", 0.55);
          }
          return tooltip.style("visibility", "hidden");
        })
        .on("mousedown", function (d) {
          if (selectedPath !== this) {
            // Reset the fill-opacity of the previously selected path
            if (selectedPath) {
              d3.select(selectedPath).style("fill-opacity", 0.55);
            }

            // Set the fill-opacity of the current path
            d3.select(this).style("fill-opacity", 0.2);

            // Update the selectedPath variable
            selectedPath = this;
          }
          d3.selectAll(".chart").remove();
          d3.selectAll(".pie").remove();

          // Store a reference to the clicked path element
          var clickedPath = d3.select(this);

          // Set the fill-opacity of the clicked path to a different value
          clickedPath.style("fill-opacity", 0.2);

          chart(
            d.properties.robberyFirearms,
            d.properties.robberyKnives,
            d.properties.roberyOtherWeapons
            // d.properties.robberies
          );
          pie(
            d.properties.murderHandguns,
            d.properties.murderRfiles,
            d.properties.murderShotgun,
            d.properties.murderKnives
          );
          count++;
        });
    });
  });

function chart(firearm, knives, other) {
  var data = [firearm, knives, other];

  var margin = { top: 10, bottom: 70, left: 80, right: 10 };
  var width = 400 - margin.left - margin.right;
  var height = 400 - margin.top - margin.bottom;
  var barPadding = 4;
  var barWidth = width / data.length - barPadding;
  var maxValue = d3.max(data);
  var x = d3.scale
    .ordinal()
    .domain(d3.range(data.length))
    .rangeRoundBands([0, width]);
  var y = d3.scale
    .linear()
    .domain([0, maxValue * 3])
    .range([height, 0]);

  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .attr("class", "chart")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("text")
    .attr("class", "chart-title")
    .attr("x", 100)
    .attr("y", 380)
    .attr("text-anchor", "middle")
    .attr("font-size", "17px")
    .attr("font-weight", "bold")
    .text("Robberies weapons"); // Add the title

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(function (d, i) {
      if (i == 0) {
        return "Firearm";
      } else if (i == 1) {
        return "Knives";
      } else {
        return "Other";
      }
    });

  var yAxis = d3.svg.axis().scale(y).orient("left");
  svg
    .append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "middle");
  svg
    .append("g")
    .attr("class", "yaxis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end");

  var barchart = svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .style("fill", function (d, i) {
      if (i == 0) {
        return "#c06d5c"; //Color of the 1st bar
      } else if (i == 1) {
        return "#c09f5c"; //Color of the 2nd bar
      }
    })
    .attr("x", function (d, i) {
      return x(i);
    })
    .attr("y", function (d) {
      return y(0);
    })
    .attr("height", function (d) {
      return height - y(0);
    })
    .attr("width", barWidth)
    .attr("fill", "#7d5cc0") //Color of the 3rd bar
    .attr("class", "chart");

  if (count == 0) {
    svg
      .selectAll("rect")
      .transition()
      .duration(800)
      .attr("y", function (d) {
        return y(d);
      })
      .attr("height", function (d) {
        return height - y(d);
      })
      .delay(function (d, i) {
        return i * 50;
      });
  } else {
    svg
      .selectAll("rect")
      .transition()
      .duration(800)
      .attr("y", function (d) {
        return y(d);
      })
      .attr("height", function (d) {
        return height - y(d);
      });
  }
  console.log(count);
}

function pie(handgun, rifle, shotgun, knives) {
  //http://bl.ocks.org/nadinesk/99393098950665c471e035ac517c2224
  total =
    parseFloat(handgun) +
    parseFloat(rifle) +
    parseFloat(shotgun) +
    parseFloat(knives);
  handgunper = (parseFloat(handgun) / total) * 100;
  shotgunper = (parseFloat(shotgun) / total) * 100;
  knivesper = (parseFloat(knives) / total) * 100;
  rifleper = (parseFloat(rifle) / total) * 100;
  var dataset = [
    { name: "Handgun", total: handgun, percent: handgunper },
    { name: "Knives", total: knives, percent: knivesper },
    { name: "Rifles", total: rifle, percent: rifleper },
    { name: "Shotgun", total: rifle, percent: shotgunper },
  ];

  var width = 800,
    height = 400,
    radius = Math.min(width, height) / 2;

  var color = d3.scale
    .ordinal()
    .range(["#ffbaba", "#ff5858", "#ff0a0a ", "#bb0000"]);

  var arc = d3.svg
    .arc()
    .outerRadius(radius - 10)
    .innerRadius(radius - 70);
  var getAngle = function (d) {
    return ((180 / Math.PI) * (d.startAngle + d.endAngle)) / 2 - 90;
  };

  var pie = d3.layout
    .pie()
    .sort(null)
    .startAngle(1.1 * Math.PI)
    .endAngle(3.1 * Math.PI)
    .value(function (d) {
      return d.total;
    });

  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "pie")
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  svg
    .append("text")
    .attr("transform", "translate(100,0)")
    .attr("x", 50)
    .attr("y", 150)
    .attr("font-size", "17px")
    .attr("font-weight", "bold")
    .text("Murder weapons");

  var g = svg
    .selectAll(".arc")
    .data(pie(dataset))
    .enter()
    .append("g")
    .attr("class", "arc");

  if (count == 0) {
    g.append("path")
      .style("fill", function (d) {
        return color(d.data.name);
      })
      .transition()
      .delay(function (d, i) {
        return i * 500;
      })
      .duration(500)
      .attrTween("d", function (d) {
        var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return arc(d);
        };
      });
  } else {
    g.append("path")
      .style("fill", function (d) {
        return color(d.data.name);
      })
      .transition()
      .delay(function (d, i) {
        return i * 0;
      })
      .duration(0)
      .attrTween("d", function (d) {
        var i = d3.interpolate(d.startAngle + 0.1, d.endAngle);
        return function (t) {
          d.endAngle = i(t);
          return arc(d);
        };
      });
  }

  function type(d) {
    d.total = +d.total;
    return d;
  }
  var legendRectSize = 13;
  var legendSpacing = 7;

  var legend = svg
    .selectAll(".legend")
    .data(color.domain())
    .enter()
    .append("g")
    .attr("class", "circle-legend")
    .attr("transform", function (d, i) {
      var height = legendRectSize + legendSpacing;
      var offset = (height * color.domain().length) / 2;
      var horz = -2 * legendRectSize - 13;
      var vert = i * height - offset;
      return "translate(" + horz + "," + vert + ")";
    });
  legend
    .append("circle")
    .style("fill", color)
    .style("stroke", color)
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", ".5rem");
  legend
    .append("text")
    .attr("x", legendRectSize + legendSpacing)
    .attr("y", legendRectSize - legendSpacing)
    .text(function (d) {
      return d;
    })
    .style("font-size", "15px")
    .style("font-weight", "bold");
}
