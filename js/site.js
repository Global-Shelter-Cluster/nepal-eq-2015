//configuration object

var config = {
    title:"Nepal Earthquake Shelter Cluster 3W",
    description:"<p>Click the graphs or map to interact. - Date: 23/07/2015",
    data:"data/data.json",
    whoFieldName:"#org+implementing",
    whatFieldName:"#activity+description",
    whereFieldName:"#adm4+code",
    statusFieldName:"#status",
    groupFieldName:"#reached",
    districtlevelFieldName:"#indicator",
    geo:"data/nepal_adm3.json",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"VDC_NAME",
    color:"#A46465",
    colors:["#DDDDDD","#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"],
    colors2:["#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"]
};


function initDash(config,data,geom){

    $('#title').html(config.title);
    $('#description').html(config.description);

    map = L.map('rc-3W-where',{});

    L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var overlay = L.geoJson(geom,{
        style:{
            fillColor: "#000000",
            color: config.color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0
        },
        onEachFeature: onEachFeature
    }).addTo(map);
    map.scrollWheelZoom.disable();
    zoomToGeom(geom);

}

function onEachFeature(feature, layer) {
    layer.on('click', function (e){
        $.ajax({url: 'data/'+e.target.feature.properties.DISTRICT+'.json',
            success: function(result){
                var geom = topojson.feature(result,result.objects[e.target.feature.properties.DISTRICT]);
                var cf = crossfilter(data);
                var whereDimension = cf.dimension(function(d,i){return d['#adm3+code']; });
                generate3WComponent(config,whereDimension.filter(e.target.feature.properties.HLCIT_CODE).top(Infinity),geom,map);
            },
            error: function(error){
                console.log(error);
            }
        });        
    });
}

function generate3WComponent(config,data,geom,map){

    dc.chartRegistry.clear();
    $('#rc-3W-who').html('<p>Who | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-what').html('<p>What | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-status').html('<p>Status | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-districtlevel').html('<p>Declared at district level | Current filter: <span class="filter"></span></span></p>');
    $('.hdx-3w-info').remove();

    if(dcGeoLayer!=''){
        map.removeLayer(dcGeoLayer);
    }

    var whoChart = dc.rowChart('#rc-3W-who');
    var whatChart = dc.rowChart('#rc-3W-what');
    var statusChart = dc.pieChart('#rc-3W-status');
    var districtlevelChart = dc.pieChart('#rc-3W-districtlevel');
    var whereChart = dc.leafletChoroplethChart('#rc-3W-where');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    var statusDimension = cf.dimension(function(d){ return d[config.statusFieldName]; });
    var districtlevelDimension = cf.dimension(function(d){ return d[config.districtlevelFieldName];});

    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });

    var whoGroup = whoDimension.group().reduceSum(function(d) {return d[config.groupFieldName];});
    var whatGroup = whatDimension.group().reduceSum(function(d) {return d[config.groupFieldName];});
    var statusGroup = statusDimension.group().reduceSum(function(d) {return d[config.groupFieldName];});
    var districtlevelGroup = districtlevelDimension.group().reduceSum(function(d) {return d[config.groupFieldName];});
    var whereGroup = whereDimension.group().reduceSum(function(d) {return d[config.groupFieldName];});
    var all = cf.groupAll();

    whoChart.width($('#rc-3W-who').width()).height(300)
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

    whatChart.width($('#rc-3W-what').width()).height(400)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
            .labelOffsetY(13)
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })
            .xAxis().ticks(5);    
    
    statusChart.width($('#rc-3W-status').width()).height(300)
            .dimension(statusDimension)
            .group(statusGroup)
            .colors(config.colors2)
            .colorDomain([0, 4])
            .colorAccessor(function(d, i){return i;});

    districtlevelChart.width($('#rc-3W-districtlevel').width()).height(300)
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
                if(d>500){
                    c=5;
                } else if (d>250) {
                    c=4;
                } else if (d>100) {
                    c=3;
                } else if (d>50) {
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
                'color': 'black',
                'opacity':1,
                'fillOpacity': 0,
                'weight': 1
            })
            .createLeaflet(function(){
                return map;
            });
            //.renderlet(function(e){
            //    var html = "";
            //    e.filters().forEach(function(l){
            //        html += lookUpVDCCodeToName[l]+", ";
            //    });
            //    $('#mapfilter').html(html);
            //});             

    dc.renderAll();
    
    zoomToGeom(geom);

    dcGeoLayer = whereChart.geojsonLayer();  

    
    var g = d3.selectAll('#rc-3W-who').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-who').width()/2)
        .attr('y', 298)
        .text('Households Reached');

    var g = d3.selectAll('#rc-3W-what').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-what').width()/2)
        .attr('y', 398)
        .text('Households Reached');

}

function zoomToGeom(geom){
    var bounds = d3.geo.bounds(geom);
    map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
}
    
function genLookupVDCCodeToName(geojson,config){
    var lookup = {};
    geojson.features.forEach(function(e){
        lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
    });
    return lookup;
}

//load 3W data
var map;
var lookUpVDCCodeToName;
var data;
var dcGeoLayer = '';

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
    data = dataArgs[0];
    console.log(data);
    var geom = topojson.feature(geomArgs[0],geomArgs[0].objects.nepal_adm3);
    geom.features.forEach(function(e){
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
    });
    initDash(config,dataArgs[0],geom);
});