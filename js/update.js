function update(url,id,name){
	console.log(name);
   $('#updates').append('<div class="row"><div class="col-md-6">'+name+'</div><div id="'+id+'" class="col-md-6">Loading</div></div>');
	$.ajax(url, {
      success: function(data) {
         $('#'+id).text('Updated');
      },
      error: function(e,err) {
         $('#'+id).text('Error');
         console.log(e);
         console.log(err);
      }
   });	
}

var urls = [
	{'name':'activity','url':'https://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&strip-headers=on&format=html&filter01=cut&cut-include-tags01=adm3%2Bcode%2Creached%2Bhouseholds%2Cactivity%2Bdescription&cut-exclude-tags01=&filter02=count&count-tags02=%23adm3%2Bcode%2C%23activity%2Bdescription&count-aggregate-tag02=%23reached%2Bhouseholds&filter03=&filter04=&filter05=&filter06=&filter07='},
	{'name':'damage','url':'https://proxy.hxlstandard.org/data.json?filter_count=7&strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D975313202%26single%3Dtrue%26output%3Dcsv&format=html'}
];

urls.forEach(function(u){
	console.log(u);
	update(u.url+'&force=1',u.name,u.name);
});

var geom = topojson.feature(nepal_adm3,nepal_adm3.objects.nepal_adm3);

geom.features.forEach(function(f,i){
   console.log(i);
   var url = 'https://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&strip-headers=on&format=html&filter01=cut&cut-include-tags01=%23adm3%2Bcode%2C%23adm4%2Bcode%2C%23org%2Bimplementing%2C%23activity%2Bdescription%2C%23reached%2Bhouseholds%2C%23status&cut-exclude-tags01=&filter02=select&select-query02-01=%23adm3%2Bcode%3D'+f.properties.HLCIT_CODE+'&force=1';
   setTimeout(function(){update(url,f.properties.DISTRICT,f.properties.DISTRICT)},4000*i);
})

geom.features.forEach(function(f,i){
   console.log(i);
   var url = 'https://proxy.hxlstandard.org/data.json?filter01=select&strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D1857051232%26single%3Dtrue%26output%3Dcsv&force=1&select-query01-01=adm3%2Bcode%3D'+f.properties.HLCIT_CODE+'&force=1';
   setTimeout(function(){update(url,f.properties.DISTRICT+'gap',f.properties.DISTRICT + ' Gap Map')},4000*i);
})
