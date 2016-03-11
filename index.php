<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title></title>
    </head>
    <body>
		<script>
			
			window.onload = function(){
				
				function idb(dbname){
					var self = this;
					self.dbname = dbname;
					self.db = 0;
					
					self.init = function(){
						window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
						window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
						window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

						if (!window.indexedDB)
							window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
						
						var request = window.indexedDB.open(self.dbname, 3);
						
						request.onerror = function(event) {
							console.log(event);
							alert("error check console");
						};
						
						request.onsuccess = function(event) {
							self.db = event.target.result;
							console.log(event);
							alert("success");
						};
						
						request.onupgradeneeded = function(event) { 
							self.db = event.target.result;
						};
					};
					
					self.addShit = function(table, data){
						var transaction = self.db.transaction([table], "readwrite");

						transaction.oncomplete = function(event) {
							console.log(event);
							alert("All done! cehck console for event object..,.,.,");
						};

						transaction.onerror = function(event) {
							console.log(event);
							alert("error, chck console..");
						};

						var objectStore = transaction.objectStore(table);
							for (var i in data) {
								var request = objectStore.add(data[i]);
							request.onsuccess = function(event) {
								console.log(event);
								alert("success again, check console.");
							};
						}
					};
					
					self.deleteAllTheShit = function(table, cb){
						var transaction = db.transaction([table], "readwrite");
						transaction.oncomplete = function(event) {
							alert("opened the database");
						};
						transaction.onerror = function(event) {
							alert("Error up in this bitch");
						};
						var objectStore = transaction.objectStore(table);
						var objectStoreRequest = objectStore.clear();
						objectStoreRequest.onsuccess = function(event) {
							console.log(event);
							alert("deleted the shit");
						};
					};
					
					self.getAllTheShit = function(table, cb){
						var trans = self.db.transaction(table, "readwrite");
						var store = trans.objectStore(table);
						var items = [];

						trans.oncomplete = function(evt) {  
							cb(items);
						};

						var cursorRequest = store.openCursor();

						cursorRequest.onerror = function(error) {
							console.log(error);
						};

						cursorRequest.onsuccess = function(evt) {                    
							var cursor = evt.target.result;
							if (cursor) {
								items.push(cursor.value);
								cursor.continue();
							}
						};	
					};
					
					self.init();
				}
				
				var data = [
					{ ssn: "444-44-4444", name: "Bill", age: 35, email: "bill@company.com" },
					{ ssn: "555-55-5555", name: "Donna", age: 32, email: "donna@home.org" }
				];
				
				var youmom = new idb("cookiemonster");
				setTimeout(function(){ youmom.addShit("yourface", data); }, 3000);
				setTimeout(function(){ 
					youmom.getAllTheShit("yourface", function(items){ 
						console.log(items); alert("bang bang"); 
					}); 
				}, 6000);
			};
			
		</script>
    </body>
</html>
