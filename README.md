# jSQL

A work in progress, jSQL (or, javaScript Query Language,) is a Javascript based, user hosted database alternative (or accessory). It allows for easy querying of a dataset using a familiar subset of standard SQL.

### Features
 - Easier than alternatives
 - Support for SELECT statements
 - Method chaining alternative to SQL syntax
 - Data sorting via the ORDER BY clause
 - Support for cross-browser persistent storage
 - Able to store JS functions!
 
### Goals
 - Support for CREATE, UPDATE, INSERT  statements
 - Faster than alternatives
 - Storage and querying of all native javascript types
 - Finish LIKE queries
 - Add support for JOIN queries
 
### Sample Usage
```javascript
// Load data from internal storage, if it exists
jSQL.load(function(){

	// If the table didn't exist in internal storage, create it and save it to internal storage
	if(undefined === jSQL.tables.Products){
		var data = [
			{Name: "Delux Model", "ProductID": 0},
			{Name: "Supreme Model", "ProductID": 1},
			{Name: "Super Model", "ProductID": 2},
			{Name: "Regular Model", "ProductID": 3},
			{Name: "Small Model", "ProductID": 4},
		];
		jSQL.createTable("Products", data);
		jSQL.persist(); // Save the data internally
	}

	// Prompt user to enter a product ID
	var productID = prompt(" Product Name Lookup \n Please enter a Product ID#:");

	// Run a query for user's product
	var query = jSQL.query("SELECT `Name` FROM `Products` WHERE `ProductID` = '" +productID+ "'").execute();

	// Get the result and display it to the user
	var row = query.fetch("ASSOC");
	var message = !!row.length ? "Product name: " +row.Name : "Product not found.";
	alert(message);
});

```

@todo Post documentation after completed all goals

Stay tuned...
