//configuration object

var config = {
    title:"Nepal Earthquake Shelter Cluster Gap Maps",
    description:"Shelter Cluster dashboard showing shelter activities in the 14 priority districts in response to Nepal 2015 Earthquakes. Select a district on the map to view gap maps for the VDCs. Data can be downloaded from <a target='_blank' href='https://data.hdx.rwlabs.org/dataset/scnepal-agency-data'>HDX</a>.  Click <a href='index.html'>here</a> to view the activities dashboard.",
    data:"data/data.json",
    whoFieldName:"#org+implementing",
    whatFieldName:"#activity+description",
    whereFieldName:"#adm4+code",
    statusFieldName:"#status",
    groupFieldName:"#reached+households",
    districtlevelFieldName:"#indicator+parent",
    geo:"data/nepal_adm3.json",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"VDC_NAME",
    color:"#B78C8D",
    colors:["#DDDDDD","#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"],
    colors2:["#CAB4B5","#B78C8D","#A46465","#913C3D","#7F1416"]
};

function initDash(config,geom){

    $('#title').html(config.title);
    $('#description').html(config.description);
    loadDatatable();
    map = L.map('rc-3W-where',{});

    /*L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.tileLayer('https://c.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);*/

    var baselayer = new L.StamenTileLayer("toner");

    map.addLayer(baselayer);

    overlay = L.geoJson(geom,{
        style: function(f){
            if(f.properties.HUB=='West'){
                var color = '#7F1416';
            } else if (f.properties.HUB=='Central') {
                var color = '#A46465';
            } else {
                var color = '#CAB4B5';
            }
            return {
            fillColor: color,
            color: "#7F1416",
            weight: 3,
            opacity: 1,
            fillOpacity: 0.5};
        },
        onEachFeature: onEachFeature
    }).addTo(map);

    var info = L.control();

    info.onAdd = function (map) {
        div = L.DomUtil.create('div', 'hdx-3w-info');
            return div;
        };

    info.addTo(map);
    
    $('.hdx-3w-info').html('Click a district to see district level data');
    $('#switch_att').click(function(){
        switchAtt();
    })
    
    map.scrollWheelZoom.disable();
    zoomToGeom(geom);
}

function onEachFeature(feature, layer) {
    layer.on('click', function (e){
            zoomToADM4(e.target.feature.properties.DISTRICT,e.target.feature.properties.HLCIT_CODE);
    });                    

    layer.on('mouseover', function(e){
        $('.hdx-3w-info').html('Click to view '+e.target.feature.properties.DISTRICT);
        $('.adm'+e.target.feature.properties['HLCIT_CODE'].replace(/ /g,'_')).addClass('highlight');
    })

    layer.on('mouseout', function(e){
        $('.hdx-3w-info').html('Click a district to see district level data');
        $('.adm'+e.target.feature.properties['HLCIT_CODE'].replace(/ /g,'_')).removeClass('highlight');
    })
}

function zoomToADM4(districtName,districtCode){
        $('#modal').modal('show'); 
        attName = districtName;
        attCode = districtCode;
        //suspect e.target.feature.properties.DISTRICT will not work on multi-polygons
        if(att=='er'){
            var text = 'Emergency Response (Tarps and Tents) Gap';
        } else {
            var text = 'Recovery (CGI and Cash) Gap';
        }
        $('#district_name').html(districtName + ' - ' + text);
        //var url = 'http://beta.proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/export%3Fformat%3Dcsv%26id%3D1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA%26gid%3D0&strip-headers=on&format=html&filter01=cut&cut-include-tags01=%23adm3%2Bcode%2C%23adm4%2Bcode%2C%23org%2Bimplementing%2C%23activity%2Bdescription%2C%23status%2C%23reached%2Buse%2C%23indicator&cut-exclude-tags01=&filter02=select&force=1&select-query02-01=adm3%2Bcode%3D'+e.target.feature.properties.HLCIT_CODE
        var url = 'https://proxy.hxlstandard.org/data.json?filter01=select&strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D1857051232%26single%3Dtrue%26output%3Dcsv&force=1&select-query01-01=adm3%2Bcode%3D'+districtCode;
        var dataCall = $.ajax({ 
            type: 'GET', 
            url: url, 
            dataType: 'json',
            error:function(e,exception){
                console.log(exception);
            }
        });
        overlay.setStyle({
            fillColor: "#7F1416",
            color: "#7F1416",
            weight: 3,
            opacity: 1,
            fillOpacity: 0
        });

        //load geometry

        var geomCall = $.ajax({ 
            type: 'GET', 
            url: 'data/'+districtName+'.json', 
            dataType: 'json',
        });

        $.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
            /*$('#leftcolumn').removeClass('col-sm-12');
            $('#leftcolumn').addClass('col-sm-8');
            $('#rightcolumn').removeClass('col-sm-0');
            $('#rightcolumn').addClass('col-sm-4');*/
            $('#overviewtable').hide();
            map.invalidateSize();
            $('#info_row').show();
            var data = hxlProxyToJSON(dataArgs[0])
            var geom = topojson.feature(geomArgs[0],geomArgs[0].objects[districtName]);
            $('#modal').modal('hide');
            geom = joinDataToADM4(geom,data);

            if(legendon==false){
                legendon=true;
                var legend = L.control({position: 'bottomright'});

                legend.onAdd = function (map) {

                    var div = L.DomUtil.create('div', 'info legend'),
                        labels = ['0','1% - 40%','41% - 70%','70% - 99%','100%'];

                    div.innerHTML = 'Percent (%) of<br />shelter need reached<br />';
                    for (var i = 0; i < labels.length; i++) {
                        div.innerHTML +=
                            '<i style="background:' + colors[i] + '"></i> ' + labels[i] +'<br />';
                    }

                    return div;
                };

                legend.addTo(map);   
            }

            generateGapComponent(config,data,geom,map);
        });    
}

function generateGapComponent(config,data,geom,map){

    

    if(overlay2!=''){
        map.removeLayer(overlay2);
    }

    overlay2 = L.geoJson(geom,{
        style: function(f){
            if(f.properties[att]>=1){
                var color = colors[4];
            } else if (f.properties[att]>0.7) {
                var color = colors[3];
            } else if (f.properties[att]>0.4) {
                var color = colors[2];
            } else if (f.properties[att]>0) {
                var color = colors[1];
            } else {
                var color = colors[0];
            }
            return {
            fillColor: color,
            color: "#7F1416",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5};
        },
        onEachFeature: onEachFeature
    }).addTo(map);

      

    zoomToGeom(geom);

    function onEachFeature(feature,layer){
        layer.on('mouseover',function(e){
            $('.hdx-3w-info').html(e.target.feature.properties.VDC_NAME+' - '+d3.format("%")(e.target.feature.properties[att]));
        })
        layer.on('mouseout',function(e){
            $('.hdx-3w-info').html('Hover VDC for gap info');
        })        
    }
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

function joinDataToADM4(geom,data){
    geom.features.forEach(function(f){
        f.properties[att] = 0;
        data.forEach(function(d){
            if(d['#adm4+code'] == f.properties['HLCIT_CODE']){
                f.properties[att] = d['#reached+'+att];
            }
        })
    });
    return geom;
}

function switchAtt(){
    if(att=='er'){
        att = 'recovery';
        $('#switch_att').html('Switch to Emergency Response Gap Map');
    } else {
        att = 'er';
        $('#switch_att').html('Switch to Recovery Gap Map');
    }
    zoomToADM4(attName,attCode);
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

function loadDatatable(){
    var activityurl = 'https://beta.proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&strip-headers=on&format=html&filter01=cut&cut-include-tags01=adm3%2Bcode%2Creached%2Bhouseholds%2Cactivity%2Bdescription&cut-exclude-tags01=&filter02=count&count-tags02=%23adm3%2Bcode%2C%23activity%2Bdescription&count-aggregate-tag02=%23reached%2Bhouseholds&filter03=&filter04=&filter05=&filter06=&filter07=';
    var damageurl ='https://beta.proxy.hxlstandard.org/data.json?filter_count=7&strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D975313202%26single%3Dtrue%26output%3Dcsv&format=html';

    var activityCall = $.ajax({ 
            type: 'GET', 
            url: activityurl, 
            dataType: 'json',
            error:function(e,exception){
                console.log(exception);
            }
        });

        //load geometry

        var damageCall = $.ajax({ 
            type: 'GET', 
            url: damageurl, 
            dataType: 'json',
        });

    $.when(damageCall, activityCall).then(function(damageArgs, activityArgs){
        var damage = hxlProxyToJSON(damageArgs[0]);
        var activitycf = crossfilter(hxlProxyToJSON(activityArgs[0]));
        var activityDimension = activitycf.dimension(function(d){return d['#activity+description'];});
        var geoDimension = activitycf.dimension(function(d){ return d['#adm3+code']});
        var activityGroup = activityDimension.group().reduceSum(function(d){return d['#meta+sum'];});
        var table = '<table><tr><th></th><th class="number damage">Damage</th>';
        var activitylist = [];
        activityGroup.top(5).forEach(function(d){
            if(d.value>0){
                activitylist.push(d.key)
                table+='<th class="number">'+d.key+'</th>';
            }
        });
        table +='</tr>';
        
        
        geom.features.forEach(function(f){
            table+='<tr class="datarow adm' + f.properties['HLCIT_CODE'].replace(/ /g,'_') + '"><td>'+f.properties.DISTRICT+'</td>';
            var damagevalue = 0;
            damage.forEach(function(d){
                if(d['#adm3+code']==f.properties['HLCIT_CODE']){
                    damagevalue = Math.round(d['#affected+households']);
                }
            })
            table+='<td class="number damage">'+damagevalue+'</td>';

            geoDimension.filter(f.properties['HLCIT_CODE']);
            activitylist.forEach(function(k){
                var value = 0;
                activityGroup.top(Infinity).forEach(function(d){
                    if(d.key==k){
                        value =Math.round(d.value);
                    }
                });
                table +='<td class="number">'+value+'</td>';
            });
            table+='</tr>';
        });
        table +='</table>';
        $('#overviewtable').html(table);
    });
}
//load 3W data
var map;
var lookUpVDCCodeToName;
var data;
var overlay2 = '';
var geom = topojson.feature(nepal_adm3,nepal_adm3.objects.nepal_adm3);
var overlay;
var att = 'recovery';
var atttName = '';
var attCode = '';
var colors = ['#FFFFFF','#DFC4C4','#BF898A','#9F4E50','#7F1416'];
var legendon = false;
geom.features.forEach(function(e){
    e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
});
$('#info_row').hide();
initDash(config,geom);
