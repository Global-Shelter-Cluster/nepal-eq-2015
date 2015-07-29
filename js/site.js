//configuration object

var config = {
    title:"Nepal Earthquake Shelter Cluster 3W",
    description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    data:"data/data.json",
    whoFieldName:"#org+implementing",
    whatFieldName:"#activity+description",
    whereFieldName:"#adm4+code",
    statusFieldName:"#status",
    groupFieldName:"#reached+use",
    districtlevelFieldName:"#indicator",
    geo:"data/nepal_adm3.json",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"VDC_NAME",
    color:"#A46465",
    colors:["#DDDDDD","#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"],
    colors2:["#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"]
};


function initDash(config,geom){

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
            weight: 3,
            opacity: 1,
            fillOpacity: 0
        },
        onEachFeature: onEachFeature
    }).addTo(map);

    var info = L.control();

    info.onAdd = function (map) {
        div = L.DomUtil.create('div', 'hdx-3w-info');
            return div;
        };


    info.addTo(map);
    
    $('.hdx-3w-info').html('Hover for name');
    
    map.scrollWheelZoom.disable();
    zoomToGeom(geom);

}

function onEachFeature(feature, layer) {
    layer.on('click', function (e){
        $('#modal').modal('show'); 

        var url = 'http://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/export%3Fformat%3Dcsv%26id%3D1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA%26gid%3D0&strip-headers=on&format=html&filter01=cut&cut-include-tags01=%23adm3%2Bcode%2C%23adm4%2Bcode%2C%23org%2Bimplementing%2C%23activity%2Bdescription%2C%23status%2C%23reached%2Buse%2C%23indicator&cut-exclude-tags01=&filter02=select&select-query02-01=adm3%2Bcode%3D'+e.target.feature.properties.HLCIT_CODE
        var dataCall = $.ajax({ 
            type: 'GET', 
            url: url, 
            dataType: 'json',
            error:function(e,exception){
                console.log(exception);
            }
        });

        //load geometry

        var geomCall = $.ajax({ 
            type: 'GET', 
            url: 'data/'+e.target.feature.properties.DISTRICT+'.json', 
            dataType: 'json',
        });

        $.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
            var data = hxlProxyToJSON(dataArgs[0])
            var geom = topojson.feature(geomArgs[0],geomArgs[0].objects[e.target.feature.properties.DISTRICT]);
            $('#modal').modal('hide');
            generate3WComponent(config,data,geom,map)
        });                    
    });

    layer.on('mouseover', function(e){
        $('.hdx-3w-info').html(e.target.feature.properties.DISTRICT);
    })

    layer.on('mouseout', function(e){
        $('.hdx-3w-info').html('Hover for name');
    })    
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

    lookUpVDCCodeToName = genLookupVDCCodeToName(geom,config);

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
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })            
            .xAxis().ticks(5);

    whatChart.width($('#rc-3W-what').width()).height(400)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .data(function(group) {
                return group.top(15);
            })
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
            })
            .on("renderlet",(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += lookUpVDCCodeToName[l]+", ";
                });
                $('#mapfilter').html(html);
            }));             

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

function hxlProxyToJSON(input){
    var input = stripIfNull(input);
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            keys = e;
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function stripIfNull(input){
    if(input[0][0]==null){
        input.shift();
        return input;
    }
    return input;
}

//load 3W data
var map;
var lookUpVDCCodeToName;
var data;
var dcGeoLayer = '';
var geom = topojson.feature(nepal_adm3,nepal_adm3.objects.nepal_adm3);
geom.features.forEach(function(e){
    e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
});

initDash(config,geom);