

;window.calendar = function(elem, opts) {
	var self = this;
	var _eventGroups = [];
	var selectedDates = [];
	
	////////////////////////////////////////////////////////////////////////////
	// User config /////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	self.elem = elem;
	self.abbrDay = true;
	self.abbrMonth = true;
	self.abbrYear = true;
	self.onDayClick = function(){};
	self.onEventClick = function(){};
	self.events = [];
	self.month = (new Date()).getMonth();
	self.year = (new Date()).getFullYear();
	self.ellipse = true;
	
	////////////////////////////////////////////////////////////////////////////
	// Strings /////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////

	self.daysOfWeekFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	self.daysOfWeekAbbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	self.monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	self.monthsAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	////////////////////////////////////////////////////////////////////////////
	// Private methods /////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	// Constructor, called only when object is created
	var init = function(){
		if(undefined!==opts){
			if(undefined!==opts.events){
				for(var i=opts.events.length; i--;){
					var hasDesc = (opts.events[i].hasOwnProperty("desc"));
					var hasDate = (opts.events[i].hasOwnProperty("date"));
					var hasStartDate = (opts.events[i].hasOwnProperty("startDate"));
					var hasEndDate = (opts.events[i].hasOwnProperty("endDate"));
					if(hasDesc && (hasDate  || (hasStartDate && hasEndDate))){
						if(hasStartDate && hasEndDate){
							if(+opts.events[i].startDate <= +opts.events[i].endDate) self.events.push(opts.events[i]);
							else console.log("Start date must occur before end date.");
						}else self.events.push(opts.events[i]);
					}else console.log("All events must have a 'desc' property and either a 'date' property or a 'startDate' and 'endDate' property");
				}
			}
			if(undefined!==opts.abbrDay) self.abbrDay = opts.abbrDay;
			if(undefined!==opts.onDayClick) self.onDayClick = opts.onDayClick;
			if(undefined!==opts.onEventClick) self.onEventClick = opts.onEventClick;
			if(undefined!==opts.abbrMonth) self.abbrMonth = opts.abbrMonth;
			if(undefined!==opts.abbrYear) self.abbrMonth = opts.abbrYear;
			if(undefined!==opts.abbrMonth) self.abbrMonth = opts.abbrMonth;
			if(undefined!==opts.year) self.year = opts.year;
			if(undefined!==opts.month) self.month = opts.month-1;
		}
		var classes = self.elem.getAttribute("class");
		if(!classes) classes = "";
		classes += " CalendarJS";
		self.elem.setAttribute("class", classes);
		self.drawCalendar();
	};
	
	// Create a DOM element
	var makeEle = function(name, attrs){
		var ele = document.createElement(name);
		for(var i in attrs)
			if(attrs.hasOwnProperty(i))
				ele.setAttribute(i, attrs[i]);
		return ele;
	};
	
	// Attach an event handler
	var addEvent = function(el, type, handler) {
	    if (el.attachEvent) el.attachEvent('on'+type, handler); else el.addEventListener(type, handler);
	};
	
	// Remove an event handler
	var removeEvent = function(el, type, handler) {
	    if (el.detachEvent) el.detachEvent('on'+type, handler); else el.removeEventListener(type, handler);
	};
	
	// Event handler to show the next month
	var _loadNextMonth = function(){
		self.month = self.month-1>-1?self.month-1:11;
		if(self.month===11) self.year--;
		self.drawCalendar();
	};
	
	// Event handler for next month
	var _loadLastMonth = function(){
		self.month = self.month+1>11?0:self.month+1;
		if(self.month===0) self.year++;
		self.drawCalendar();
	};
	
	// Event handler for day clicked
	var _dayClicked = function(){
		var evtids = this.getAttribute('data-events').split(",");
		var evts = [];
		for(var i=0; i<evtids.length; i++) 
			if(self.events[evtids[i]]!==undefined) 
				evts.push(self.events[evtids[i]]);
		var date = new Date(self.year, self.month, this.getAttribute('data-day'));
		self.onDayClick(date, evts);
	};
	
	var _eventClicked = function(){
		var evtid = this.getAttribute('data-eventid');
		self.onEventClick(self.events[evtid]);
	};
	
	var positionEventGroups = function(){
		var eventPositions = {}; // available positions within the display area
		var otherEvents = {}; // events that don't fit in the display area
		for(var i=0; i<_eventGroups.length; i++){
			var e = _eventGroups[i];
			
			var ele = self.elem.getElementsByClassName('calEvent'+i)[0];
			
			var calHdrHt = self.elem.getElementsByClassName('calHeader')[0].getBoundingClientRect().height;
			var dayCellHt = self.elem.getElementsByClassName("dayCell")[0].getBoundingClientRect().height;
			var dayCellWd = self.elem.getElementsByClassName("dayCell")[0].getBoundingClientRect().width;
			var dayColHt = self.elem.getElementsByClassName("dayCol")[7].getBoundingClientRect().height;
			var dayColWd = self.elem.getElementsByClassName("dayCol")[7].getBoundingClientRect().width;
			var dateLabelHeight = self.elem.getElementsByClassName("dateLabel")[0].getBoundingClientRect().height;
			
			var evtHtOffset = ele.getBoundingClientRect().height+2;
			var hdrOffset = self.elem.getElementsByClassName("dayHeaderCell")[0].getBoundingClientRect().height;
			var paddingOffset = Math.floor((dayColHt-dayCellHt)/2);
			
			var hPaddingOffset = Math.floor((dayColWd-dayCellWd)/2);
			
			var top = 3+paddingOffset+dateLabelHeight;// 5+hdrOffset+paddingOffset+(dayColHt*e.week)+dateLabelHeight+4+calHdrHt;
			var left = 1+paddingOffset+(dayColWd*e.start);
			var width = ((e.end-e.start+1)*dayColWd)-(paddingOffset*3);
		
			// used calculate bottom of the display area
			var bottomBorder = dayColHt-paddingOffset;
			
			// get the lowest event position available for every date in event
			var posit = false;
			var allAvail = [];
			for(var n=e.startdayid; n<=e.enddayid; n++){
				if(!eventPositions.hasOwnProperty(n)) eventPositions[n]=[];
				// get the lowest available event position for this day
				for(var x=0; x<=eventPositions[n].length; x++){
					if(undefined===eventPositions[n][x]) eventPositions[n][x] = 0;
					if(eventPositions[n][x]===0){
						allAvail.push(x); 
						break;
					}
				}
			}
			for(var aa=allAvail.length;aa--;){
				if(posit===false) posit = allAvail[aa];
				if(allAvail[aa]>posit) posit = allAvail[aa];
			}
			
			// posit is now the lowest position available for every date
			// make sure it fits
			var eventBottom = top+(evtHtOffset*(1+posit))-2;
			if(eventBottom>bottomBorder){
				// event doesn't fit
				
				var newendid = e.startdayid;
				var newend=e.start;
				var lastPositAvailable = false;
				
				//see if event fits in any of the other cols
				// if so shrink this one, reset the starting pos
				//add "other events" counter to upper right of this date

				// there is a position above, check if it's available
				if(posit>0){

					// get the first available position for the first day of the event
					for(var p=posit;p--;) 
						if(eventPositions[e.startdayid][p]===0) 
						lastPositAvailable=p;

					// if a higher position is available for the first date
					if(lastPositAvailable!==false){

						// check subsequent dates to see if the same position is available
						// to figure out new end date
						for(var n=e.startdayid; n<=e.enddayid; n++){
							if(undefined===eventPositions[n][lastPositAvailable]) 
								eventPositions[n][lastPositAvailable] = 0;
							
							// if this position is available for this day too
							// increase the enddate, else break at the existing end date
							if(eventPositions[n][lastPositAvailable]===0){ 
								newendid++;
								newend++;
							}else{
								newendid--;
								newend--;
								break;
							}
						}

					}

				}
				
				// check newend and newposit and adjust event if possible
				// or else add a +1 to the "other events" counter for this day
				if(lastPositAvailable===false){
					// no positions are available for this day
					// add +1 to "other events" counter for this day ..check
					// and if the is another day in the event 
					// make the current _eventGroups start one day later 
					// and do i-- and continue the loop so it will be iterated over again
					
					if(undefined===otherEvents[e.startdayid]) 
						otherEvents[e.startdayid] = 0;
					otherEvents[e.startdayid]++;
					
					if(_eventGroups[i].startdayid<_eventGroups[i].enddayid){
						_eventGroups[i].startdayid++;
						_eventGroups[i].start++;
						i--;
					}else{
						// there are no more days to show, hide the event
						ele.classList.add('hidden');
					}
					continue;
				}else{
					// we have a partial fit
					// make the current _eventGroups end on the new end date (adjust the width, top)
					// then add a new event group starting one day later in case there are other spaces available
					// on the other side of the full day
					// also, update eventPositions to show taken dates
					
					if(ele.classList.contains('hidden'))
						ele.classList.remove('hidden');
					
					var oldendid = _eventGroups[i].enddayid;
					var oldend = _eventGroups[i].end;
					
					_eventGroups[i].enddayid=newendid;
					_eventGroups[i].end=newend;
					
					width = ((newend-e.start+1)*dayColHt)-(paddingOffset*3);
					posit = lastPositAvailable;
					
					var egid = _eventGroups.length;
					_eventGroups.push({
						enddayid: oldendid,
						end: oldend,
						startdayid: newendid+1,
						start: newend+1,
						event: _eventGroups[i].event,
						week: _eventGroups[i].week
					});
					
					var cls = (undefined===_eventGroups[i].event.type) ? "" : " "+_eventGroups[i].event.type;
					var desc = _eventGroups[i].event.desc;
					if(self.ellipse) desc = "<span>"+desc+"</span>", cls+=" ellipse";
					var evt = "<div class='calEvent"+egid+" calEvent"+cls+"' data-eventid='"+_eventGroups[egid].eventid+"'>"+desc+"</div>";
					var week = self.elem.getElementsByClassName("calweekid"+_eventGroups[i].week)[0];
					week.insertAdjacentHTML('beforeend', evt);
					
					e = _eventGroups[i];
					for(var n=e.startdayid; n<=e.enddayid; n++) 
						eventPositions[n][lastPositAvailable] = 1;
					
				}
				
			}else{
				// the event fits completely,
				// update eventPositions for every day in the eventgroup
				// no adjustmetns are needed
				
				if(ele.classList.contains('hidden'))
					ele.classList.remove('hidden');
				for(var n=e.startdayid; n<=e.enddayid; n++) 
					eventPositions[n][posit] = 1;
			}
			
			//adjust top position for other events
			if(posit!==0) top += (evtHtOffset*posit);
			
			var h = ele.parentNode.getBoundingClientRect().height; //self.elem.getBoundingClientRect().height;
			var w = ele.parentNode.getBoundingClientRect().width; //self.elem.getBoundingClientRect().width;
			
			ele.style.top = (top/h*100)+"%";
			ele.style.left = (left/w*100)+"%";
			ele.style.width = (width/w*100)+"%";
		}
		
		// Draw otherEvents for events that didnt fit in the display
		for(var date in otherEvents){
			if(!otherEvents.hasOwnProperty(date)) continue;
			var d = self.elem.getElementsByClassName("dayCell"+date)[0];
			d.insertAdjacentHTML('beforeend', '<div class="otherEvents">+'+otherEvents[date]+'</div>');
		}
	};
	
	// Set all calendar event handlers
	var setCalendarEvents = function(){
		var lastLink = self.elem.getElementsByClassName("lastLink")[0];
		removeEvent(lastLink, 'click', _loadNextMonth);
		addEvent(lastLink, 'click', _loadNextMonth);
		
		var nextLink = self.elem.getElementsByClassName("nextLink")[0];
		removeEvent(nextLink, 'click', _loadLastMonth);
		addEvent(nextLink, 'click', _loadLastMonth);
		
		var calDays = self.elem.getElementsByClassName("calDay");
		for(var i=calDays.length; i--;){
			removeEvent(calDays[i], 'click', _dayClicked);
			addEvent(calDays[i], 'click', _dayClicked);
		}
		
		var events = self.elem.getElementsByClassName('calEvent');
		for(var i=events.length; i--;){
			removeEvent(events[i], 'click', _eventClicked);
			addEvent(events[i], 'click', _eventClicked);
		}
	};
	
	////////////////////////////////////////////////////////////////////////////
	// Public methods //////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////
	
	// Get all events that occur during a certain day or date-range
	self.getEventsDuring = function(date1, date2){
		if(undefined === date2) date2 = date1;
		var lowdate = +date1>+date2 ? date2 : date1;
		var highdate = +date1>+date2 ? date1 : date2;
		
		var morn = +(new Date(lowdate.getFullYear(), lowdate.getMonth(), lowdate.getDate(), 0, 0, 0));
		var night = +(new Date(highdate.getFullYear(), highdate.getMonth(), highdate.getDate(), 23, 59, 59));
				
		var result = [];
		for(var i=0; i<self.events.length; i++){
			if(self.events[i].hasOwnProperty("startDate")){
				var eventStart = +self.events[i].startDate;
				var eventEnd = +self.events[i].endDate;
			}else{
				var eventStart = +self.events[i].date;
				var eventEnd = +self.events[i].date;
			}
			var startsToday = (eventStart>=morn && eventStart<=night);
			var endsToday = (eventEnd>=morn && eventEnd<=night);
			var continuesToday = (eventStart<morn && eventEnd>night);
			
			if(startsToday || endsToday || continuesToday) 
				result.push(self.events[i]);
		}
		return result;
	};
	
	// Clear selected dates
	self.clearSelection = function(){
		var active = self.elem.getElementsByClassName("active");
		for(var i=active.length; i--;)
			active[i].classList.remove('active');
		selectedDates = [];
	};
	
	// Select a date for use as a calendar picker
	self.selectDate = function(date){
		if(self.month !== date.getMonth()) return;
		if(self.year !== date.getFullYear()) return;
		self.elem.getElementsByClassName("dayCell"+(date.getDate()))[0]
			.parentNode.parentNode.parentNode.classList.add("active");
		selectedDates.push({
			day: date.getDate(),
			month: date.getMonth(),
			year: date.getFullYear()
		});
	};
	
	// Select a range of dates
	self.selectDateRange = function(date1, date2){
		if(self.month !== date1.getMonth()) return;
		if(self.year !== date1.getFullYear()) return;
		if(self.month !== date2.getMonth()) return;
		if(self.year !== date2.getFullYear()) return;

		var lowdate = +date1>+date2 ? date2.getDate() : date1.getDate();
		var highdate = +date1>+date2 ? date1.getDate() : date2.getDate();
		
		for(var i=lowdate; i<=highdate; i++)
			self.selectDate(new Date(self.year, self.month, i));
	};
	
	// Get all selected dates
	self.getSelection = function(){
		var sel = [];
		for(var i=0; i<selectedDates.length; i++) 
			sel.push(new Date(selectedDates[i].year, selectedDates[i].month, selectedDates[i].day));
		return sel;
	};
	
	// Draw month calendar
	self.drawCalendar = function(){ 
		// clear the element
		self.elem.innerHTML = "";
		_eventGroups = [];
		
		var firstDayofWeek = new Date(self.year, self.month, 1).getDay();
		var lastDate = new Date(self.year, self.month+1, 0).getDate();
		var currentDate = 1;
		var currentDay = 0;
		var currentWeek = 0;

		// draw title bar
		var year = self.abbrYear?"'"+(""+self.year).substr(2,2):self.year;
		var monthArrayName = !self.abbrMonth ? "monthsFull" : "monthsAbbr";
		var monthName = self[monthArrayName][self.month];
		var lastMo = self.monthsAbbr[self.month-1]?self.monthsAbbr[self.month-1]:self.monthsAbbr[11];
		var nextMo = self.monthsAbbr[self.month+1]?self.monthsAbbr[self.month+1]:self.monthsAbbr[0];
		self.elem.insertAdjacentHTML('beforeend', "<div class='weekRow calHeader'><div class='lastLink'>&vltri; "+lastMo+"</div><div class='nextLink'>"+nextMo+" &vrtri;</div><div class='moTitle'>"+monthName+" "+year+"</div></div>");

		// Draw day labels
		var dayArrayName = !self.abbrDay ? "daysOfWeekFull" : "daysOfWeekAbbr";
		var dayNames = makeEle("div", {class: "dayRow weekRow"});
		for(var i=0; i<self[dayArrayName].length; i++){ 
			var directionalClass = "";
			if(i===6) directionalClass = " right top-right";
			if(i===0) directionalClass += " top-left";
			dayNames.insertAdjacentHTML('beforeend', "<div class='dayCol left top bottom dayHeader"+directionalClass+"'><div class='dayHeaderCell'>"+self[dayArrayName][i]+"</div></div>");
		}
		self.elem.appendChild(dayNames);

		// Loop through weeks
		while(currentDate<=lastDate){
			currentDay = 0;

			// draw a div for the week
			var week = makeEle("div", {class: "weekRow calweekid"+currentWeek});

			// draw days before the 1st of the month
			while(currentDate===1&&currentDay<firstDayofWeek){
				week.insertAdjacentHTML('beforeend', "<div class='dayCol blankday bottom left'><div class='dayContent'><div class='dayTable'><div class='dayCell'></div></div></div></div>");
				currentDay++;
			}

			// Store the events
			var weekEvents = {};
			var dayEvents = {};
			
			// loop through days
			while(currentDay<7&&currentDate<=lastDate){

				// get events
				var evtids = [];
				for(var n=0; n<self.events.length; n++) {	
					if(!self.events[n].hasOwnProperty('date')){
						var morn = +(new Date(self.year, self.month, currentDate, 0, 0, 0));
						var night = +(new Date(self.year, self.month, currentDate, 23, 59, 59));
						var eventStart = +self.events[n].startDate;
						var eventEnd = +self.events[n].endDate;
						
						var startsToday = (eventStart>=morn && eventStart<=night);
						var endsToday = (eventEnd>=morn && eventEnd<=night);
						var continuesToday = (eventStart<morn && eventEnd>night);
						
						if(startsToday || endsToday || continuesToday){
							if(!weekEvents.hasOwnProperty(n)) weekEvents[n] = {event:self.events[n], eventid:n};
							if(startsToday){
								weekEvents[n].start=currentDay;
								weekEvents[n].startdayid=currentDate;
							}
							if(currentDay===6||endsToday){
								weekEvents[n].end=currentDay;
								weekEvents[n].enddayid=currentDate;
							}
							evtids.push(n);
						}
					}else{
						
						var yearMatches = (self.events[n].date.getFullYear()===self.year);
						var monthMatches = (self.events[n].date.getMonth()===self.month);
						var dayMatches = (self.events[n].date.getDate()===currentDate);
						
						if(yearMatches && monthMatches && dayMatches){
							if(!dayEvents.hasOwnProperty(n)) dayEvents[n] = {event:self.events[n], startdayid:currentDate, enddayid:currentDate, start:currentDay, end:currentDay, eventid:n};
							evtids.push(n);
						}
					}
				}
				var directionalClass = "";
				if(currentDay===6) directionalClass = " right";
				if((lastDate-currentDate)<7){
					if(currentDay===0) directionalClass += " bottom-left";
					if(currentDay===6&&currentDate===lastDate) directionalClass += " bottom-right";
				} 
				// draw day
				week.insertAdjacentHTML('beforeend', "<div class='dayCol bottom left"+directionalClass+"'><div class='dayContent'><div class='dayTable'><div class='dayCell calDay dayCell"+currentDate+"' data-day='"+currentDate+"' data-events='"+(evtids.join(","))+"'><span class='dateLabel'>"+currentDate+"</span> </div></div></div></div>");
				currentDate++;
				currentDay++;
			}

			// draw empty days after last day of month
			while(currentDay<7){
				var directionalClass = " left";
				if(currentDay===6) directionalClass += " right bottom-right";
				week.insertAdjacentHTML('beforeend', "<div class='dayCol blankday bottom"+directionalClass+"'><div class='dayContent'><div class='dayTable'><div class='dayCell'></div></div></div></div>");
				currentDay++;
			}
			
			self.elem.appendChild(week);
			
			// Draw weekEvents, dayEvents
			for(var eid in weekEvents){
				if(!weekEvents.hasOwnProperty(eid)) continue;
				
				if(!weekEvents[eid].hasOwnProperty("start")){
					weekEvents[eid].start = 0;
					weekEvents[eid].startdayid=weekEvents[eid].enddayid-weekEvents[eid].end;
				}
				weekEvents[eid].week = currentWeek;
				
				var egid = _eventGroups.length;
				_eventGroups.push(weekEvents[eid]);
				
				var cls = (undefined===self.events[eid].type) ? "" : " "+self.events[eid].type;
				var desc = self.events[eid].desc;
				if(self.ellipse) desc = "<span>"+desc+"</span>", cls+=" ellipse";
				var evt = "<div class='calEvent"+egid+" calEvent"+cls+"' style='top' data-eventid='"+_eventGroups[egid].eventid+"'>"+desc+"</div>";
				week.insertAdjacentHTML('beforeend', evt);
				
			}
			
			for(var eid in dayEvents){
				if(!dayEvents.hasOwnProperty(eid)) continue;

				dayEvents[eid].week = currentWeek;
				
				var egid = _eventGroups.length;
				_eventGroups.push(dayEvents[eid]);
				
				var cls = (undefined===self.events[eid].type) ? "" : " "+self.events[eid].type;
				var desc = self.events[eid].desc;
				if(self.ellipse) desc = "<span>"+desc+"</span>", cls+=" ellipse";
				var evt = "<div class='calEvent"+egid+" calEvent"+cls+"' style='top' data-eventid='"+_eventGroups[egid].eventid+"'>"+desc+"</div>";
				week.insertAdjacentHTML('beforeend', evt);
				
			}
			
			currentWeek++;
			
		}

		var wks = self.elem.getElementsByClassName("weekRow");
		for(var i=wks.length; i--;)
			wks[i].insertAdjacentHTML('beforeend', "<div class='clearfix'></div>");
		
		setCalendarEvents();
		positionEventGroups();
	};

	// Call the constructor
	init();
};