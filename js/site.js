//configuration object

var config = {
    title:"Nepal Earthquake Shelter Cluster 3W",
    description:"<p>Click the graphs or map to interact. - Date: 23/07/2015",
    data:"data/data.json",
    whoFieldName:"o",
    whatFieldName:"a",
    whereFieldName:"4",
    statusFieldName:"s",
    districtlevelFieldName:"i",
    geo:"data/nepal_adm4",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"VDC_NAME",
    color:"#03a9f4",
    colors:["#DDDDDD","#E1F5FE","#81D4FA","#29B6F6","#039BE5","#0277BD"],
    colors2:["#E1F5FE","#81D4FA","#29B6F6","#039BE5","#0277BD"]
};

//function to generate the 3W component
//data is the whole 3W Excel data set
//geom is geojson file

function generate3WComponent(config,data,geom){
    
    $('#title').html(config.title);
    $('#description').html(config.description);

    var lookup = genLookup(geom,config);

    var whoChart = dc.rowChart('#rc-3W-who');
    var whatChart = dc.rowChart('#rc-3W-what');
    var statusChart = dc.pieChart('#rc-3W-status');
    var districtlevelChart = dc.pieChart('#rc-3W-districtlevel');
    var whereChart = dc.leafletChoroplethChart('#rc-3W-where');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    var statusDimension = cf.dimension(function(d){ return d[config.statusFieldName]; });
    var districtlevelDimension = cf.dimension(function(d){ if(d[config.districtlevelFieldName]=="No"){
                                                                return "Yes";
                                                            } else {
                                                                return "No"
                                                            }
                                                        });
    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });
    
    var whoGroup = whoDimension.group();
    var whatGroup = whatDimension.group();
    var statusGroup = statusDimension.group();
    var districtlevelGroup = districtlevelDimension.group();
    var whereGroup = whereDimension.group();
    var all = cf.groupAll();

    whoChart.width($('#rc-3W-who').width()).height(270)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .xAxis().ticks(5);

    whatChart.width($('#rc-3W-what').width()).height(270)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .xAxis().ticks(5);    
    
    statusChart.width($('#rc-3W-status').width()).height(170)
            .dimension(statusDimension)
            .group(statusGroup)
            .colors(config.colors2)
            .colorDomain([0, 4])
            .colorAccessor(function(d, i){return i;});

    districtlevelChart.width($('#rc-3W-districtlevel').width()).height(170)
            .dimension(districtlevelDimension)
            .group(districtlevelGroup)
            .colors(config.colors2)
            .colorDomain([0, 4])
            .colorAccessor(function(d, i){return i;});            

    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all);

    whereChart.width($('#rc-3W-where').width()).height(300)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)    
            .geojson(geom)
            .colors(config.colors)
            .colorDomain([0, 5])
            .colorAccessor(function (d) {
                var c=0;
                if(d>100){
                    c=5;
                } else if (d>50) {
                    c=4;
                } else if (d>25) {
                    c=3;
                } else if (d>10) {
                    c=2;
                }  else if (d>0) {
                    c=1;
                } 
                return c;
            })           
            .featureKeyAccessor(function(feature){
                return feature.properties[config.joinAttribute];
            }).popup(function(feature){
                return feature.properties[config.nameAttribute];
            })
            .renderPopup(true)
            .featureOptions({
                'fillColor': 'black',
                'color': 'gray',
                'opacity':0.1,
                'fillOpacity': 0,
                'weight': 1
            }).renderlet(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += lookup[l]+", ";
                });
                $('#mapfilter').html(html);
            });

    dc.renderAll();
    
    var map = whereChart.map();
    map.scrollWheelZoom.disable();
    zoomToGeom(geom);
    
    var g = d3.selectAll('#rc-3W-who').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-who').width()/2)
        .attr('y', 268)
        .text('Sum of Activites per VDC');

    var g = d3.selectAll('#rc-3W-what').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-what').width()/2)
        .attr('y', 268)
        .text('Sum of Activites per VDC');

    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }
    
    function genLookup(geojson,config){
        var lookup = {};
        geojson.features.forEach(function(e){
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
        });
        return lookup;
    }
}

//load 3W data

var dataCall = $.ajax({ 
    type: 'GET', 
    url: config.data, 
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({ 
    type: 'GET', 
    url: config.geo, 
    dataType: 'json',
});

//when both ready construct 3W

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var geom = topojson.feature(geomArgs[0],geomArgs[0].objects.nepal_adm4_with_dis);
    geom.features.forEach(function(e){
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
    });
    generate3WComponent(config,dataArgs[0],geom);
});