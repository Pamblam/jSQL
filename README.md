# jSQL

A work in progress, jSQL (or, javaScript Query Language,) is a Javascript based, user hosted database alternative (or accessory). It allows for easy querying of a dataset using a familiar subset of standard SQL.

### Features
 - Easier than alternatives
 - Support for SELECT statements
 - Method chaining alternative to SQL syntax
 - Data sorting via the ORDER BY clause
 
### Goals
 - Support for CREATE, UPDATE, INSERT  statements
 - Faster than alternatives
 - Support for (semi) persistent storage
 - Storage and querying of all native javascript types
 - Typecasting data depending on it's column type
 
### Sample Usage
```javascript
jSQL.createTable("Products", data);
var productID = prompt(" Product Name Lookup \n Please enter a Product ID#:");
var query = jSQL.query("SELECT `Name` FROM `Products` WHERE `ProductID` = '" +productID+ "'");
query.execute();
var row = query.fetch("ASSOC");
var message = !!row.length ? "Product name: " +row.Name : "Product not found.";
alert(message);
```

@todo Post documentation after completed all goals

Stay tuned...
