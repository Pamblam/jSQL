
jSQL.onError(function(e){
	console.log(e);
});

jSQL.load(function(){
	
	jSQL.query("create table if not exists `events` ( `id` int primary key, `desc` varchar, `startDate` date, `endDate` date, `deleted` int )").execute();
	var allEvents = jSQL.query("select `id`, `desc`, `startDate`, `endDate` from `events`").execute().fetchAll("ASSOC");
	if(!Array.isArray(allEvents)) allEvents = [];
	
	$('#startTime').datetimepicker({
		mask: true
	});
	
	$('#endTime').datetimepicker({
		mask: true
	});
	
	drawCalendar();
	
	$("#addEvent").click(function(e){
		e.preventDefault();
		var sd = $('#startTime').datetimepicker('getValue');
		var ed = $('#endTime').datetimepicker('getValue');
		var desc = $('#desc').val().trim();
		if("____/__/__ __:__" == $('#endTime').val()
			|| "____/__/__ __:__" == $('#startTime').val()
			|| "" == desc
			|| sd.getTime() >= ed.getTime()){
			alert("You must enter two dates and a title/description and the start date must be before the end date.");
			return false;
		}
		var id = allEvents.length;
		var event = {id: id, desc: desc, startDate: sd, endDate: ed, deleted: 0};
		allEvents.push(event);
		$('#desc').val('');
		$('#endTime').val("____/__/__ __:__");
		$('#endTime').datetimepicker('reset');
		$('#startTime').val("____/__/__ __:__");
		$('#startTime').datetimepicker('reset');
		var p = [id, desc, sd, ed];
		console.log(p);
		jSQL.query("insert into `events` values (?, ?, ?, ?)").execute(p);
		jSQL.commit();
		drawCalendar();
		return false;
	});
	
	$("#reset").click(function(e){
		e.preventDefault();
		jSQL.reset();
		jSQL.query("create table if not exists `events` ( `id` int primary key, `desc` varchar, `startDate` date, `endDate` date, `deleted` int )").execute();
		drawCalendar();
		return false;
	});
	
	function drawCalendar(){
		var ele = document.getElementById('cal'),			
		opts = {
			events: jSQL.query("select `id`, `desc`, `startDate`, `endDate` from `events` where `deleted` = 0").execute().fetchAll("ASSOC"),
			abbrDay: true,
			abbrMonth:true, 
			onEventClick: function(event){
				var del = !confirm(event.desc+"\nStarts: "+formatDate(event.startDate, "m/d/y g:i a")+"\nEnds: "+formatDate(event.endDate, "m/d/y g:i a")+"\n\nTo cancel this event click \"Cancel\" else click \"Ok\".");
				if(del){
					jSQL.query("update `events` set `deleted` = 1 where `id` = ?").execute([event.id]);
					jSQL.commit();
					drawCalendar();
				}
			}
		},
		cal = new calendar(ele, opts);
	}
});

