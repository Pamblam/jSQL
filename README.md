# jSQL

A work in progress, jSQL (or, javaScript Query Language,) is a Javascript based, user hosted database alternative (or accessory). It allows for easy querying of a dataset using a familiar subset of standard SQL.

### Features
 - Easier than alternatives
 - Support for SELECT statements
 - Method chaining alternative to SQL syntax
 
### Goals
 - Support for CREATE, UPDATE, INSERT  statements
 - Faster than alternatives
 - Support for (semi) persistent storage
 - ORDER BY caluse on SELECT (Data sorting)
 - Storage and querying of all native javascript types
 - Typecasting data depending on it's column type
 
### Sample Usage
```javascript
jSQL.createTable("Products", data);
var productID = prompt(" Product Name Lookup \n Please enter a Product ID#:");
var query = jSQL.query("SELECT `Name` FROM `Products` WHERE `ProductID` = '" +productID+ "'");
var results = query.fetch();
var message = !!results.length ? "Product name: " +results[0].Name : "Product not found.";
alert(message);
```

@todo Post documentation after completed all goals

Stay tuned...
