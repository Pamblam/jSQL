


# jSQL 
v1.0

jSQL is a persistent client-side database and SQL engine. It uses various methods to save a database to the user's hard drive for cross-browser persistence.

----------


## Table of Contents

 - [Persistence Management](#persistence-management)
     - [`jSQL.load`](#jsqlloadonloadcallback)
     - [`jSQL.persist`](#jsqlpersist)
     - [`jSQL.tables`](#jsqltables)
 - [Querying the Database](#querying-the-database)
     - [`jSQL.query`](#jsqlquerysqlquery) 
     - [`jSQL.createTable`](#jsqlcreatetablename-columns)
     - [`jSQL.select`](#jsqlselectcolumns)
     - [`jSQL.insertInto`](#jsqlinsertintotablename)
     - [`jSQL.dropTable`](#jsqldroptabletablename)
     - [`jSQL.update`](#jsqlupdatetablename)
     - [`jSQL.deleteFrom`](#jsqldeletefromtablename)
 - [`jSQLTable` class](#jsqltable-class) 
     - [`jSQLTable.name`](#jsqltablename)
     - [`jSQLTable.columns`](#jsqltablecolumns)
     - [`jSQLTable.data`](#jsqltabledata)
     - [`jSQLTable.colmap`](#jsqltablecolmap)
     - [`jSQLTable.renameColumn`](#jsqltablerenamecolumnoldname-newname)
     - [`jSQLTable.addColumn`](#jsqltableaddcolumnname-defaultval)
     - [`jSQLTable.loadData`](#jsqltableloaddatadata)
     - [`jSQLTable.insertRow`](#jsqltableinsertrowdata)
 - [`jSQLQuery` interface](#jsqlquery-interface) 
     - [`jSQLQuery.ifNotExists`](#jsqlqueryifnotexists)
     - [`jSQLQuery.execute`](#jsqlqueryexecutepreparedvals)
     - [`jSQLQuery.fetch`](#jsqlqueryfetchmode)
     - [`jSQLQuery.fetchAll`](#jsqlqueryfetchallmode)
     - [`jSQLQuery.values`](#jsqlqueryvaluesdata)
     - [`jSQLQuery.set`](#jsqlquerysetdata)
     - [`jSQLQuery.where`](#jsqlquerywherecolumn)
     - [`jSQLQuery.from`](#jsqlqueryfromtable)
 - [`jSQLWhereClause` class](#jsqlwhereclause-class)
     - [`jSQLWhereClause.where`](#jsqlwhereclausewherecolumn)
     - [`jSQLWhereClause.equals`](#jsqlwhereclauseequalsvalue)
     - [`jSQLWhereClause.preparedLike`](#jsqlwhereclausepreparedlike)
     - [`jSQLWhereClause.doesNotEqual`](#jsqlwhereclausedoesnotequalvalue)
     - [`jSQLWhereClause.lessThan`](#jsqlwhereclauselessthanvalue)
     - [`jSQLWhereClause.contains`](#jsqlwhereclausecontainsvalue)
     - [`jSQLWhereClause.endsWith`](#jsqlwhereclauseendswithvalue)
     - [`jSQLWhereClause.beginsWith`](#jsqlwhereclausebeginswithvalue)
     - [`jSQLWhereClause.and`](#jsqlwhereclauseandcolumn)
     - [`jSQLWhereClause.or`](#jsqlwhereclauseorcolumn)
     - [`jSQLWhereClause.limit`](#jsqlwhereclauselimitlimit)
     - [`jSQLWhereClause.orderBy`](#jsqlwhereclauseorderbycolumn)
     - [`jSQLWhereClause.asc`](#jsqlwhereclauseasc)
     - [`jSQLWhereClause.desc`](#jsqlwhereclausedesc)
     - [`jSQLWhereClause.execute`](#jsqlwhereclauseexecute)
 - [jSQL Syntax](#jsql-syntax)
     - [SELECT Query syntax](#select-query-syntax)
     - [CREATE Query syntax](#create-query-syntax)
     - [UPDATE Query syntax](#update-query-syntax)
     - [INSERT Query syntax](#insert-query-syntax)
     - [DROP Query syntax](#drop-query-syntax)
     - [DELETE Query syntax](#delete-query-syntax)
 - [Examples](#examples)
 - [License](#license)

----------

### Persistence Management

jSQL databases are stored on the user's hard drive but are loaded into memory when jSQL is loaded. For query speed, all database operations are made in memory and are not saved to the user's hard drive until [`jSQL.persist()`](#jsqlpersist) is called.

[Back to Top](#jsql)

----------


#### `jSQL.load(onLoadCallback)`

Register a callback to be fired when the database has been loaded into memory and is ready to be queried.

##### Parameters

 - **onLoadCallback**: A function to be called when the database has been loaded.

##### Example

```
jSQL.load(function(){
    jSQL.createTable('Users', ['Name', `Age`]).ifNotExists().execute();
    var allUsers = jSQL.select('*').from('Users').execute().fetchAll('ASSOC');
});
```

[Back to Top](#jsql)

----------


#### `jSQL.persist()`

Commit any changes made to the database from memory to the user's hard drive.

##### Example

```
jSQL.dropTable('Users');
jSQL.persist();
```

[Back to Top](#jsql)

----------


#### `jSQL.tables`

An object containing a [`jSQLTable`](#jsqltable-class) object for each of your tables. If you have a table called `myTable`, it is located in `jSQL.tables.myTable`.

[Back to Top](#jsql)

----------


### Querying the Database

All queries are executed by a [`jSQLQuery`](#jsqlquery-interface) object. This object allows you to refine a query, provide values to a prepared statement, get the results of a query, etc. 

There are two ways to create any given query:

 1. Using the query constructor for the required query type ([`jSQL.createTable`](#jsqlcreatetablename-columns), [`jSQL.dropTable`](#jsqldroptabletablename), [`jSQL.select`](#jsqlselectcolumns),  [`jSQL.update`](#jsqlupdatetablename),  [`jSQL.deleteFrom`](#jsqldeletefromtablename), or [`jSQL.insertInto`](#jsqlinsertintotablename))
 2. Using the SQL Parser ([`jSQL.query`](#jsqlquerysqlquery)) Which will parse an SQL statement and return the [`jSQLQuery`](#jsqlquery-interface) object of the correct type. 

[Back to Top](#jsql)

----------


#### `jSQL.query(sqlQuery)`

Parse a raw query or prepared statement from an SQL string. This method understands a subset of standard SQL and returns a [`jSQLQuery`](#jsqlquery-interface) object.

##### Parameters

 - **sqlQuery**: A string. An SQL query to be parsed and executed on the database. jSQL understands a subset of standard SQL which is covered under the [jSQL Syntax](#jsql-syntax) header.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of the appropriate type: "CREATE", "UPDATE", "SELECT", "INSERT", "DROP", or "DELETE".

##### Example

```
jSQL.query('UPDATE `Users` SET Age = 0 WHERE Age <= 18').execute();
```

[Back to Top](#jsql)

----------


#### `jSQL.createTable(name, columns)`

Create a query that can create and populate a table new table in the database.

##### Parameters

 - **name**: The name of the new table (string).
 - **columns**: An array of column names for the new table.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "CREATE".

##### Example

```
var users = [];
users.push({Name: 'Bob', Age: 34, PhoneNumber: "888-999-0000"});
users.push({Name: 'Susan', Age: 37, PhoneNumber: "888-111-0000"});
jSQL.createTable('Users', ['Name', 'Age', 'PhoneNumber']).execute(users);
```

[Back to Top](#jsql)

----------

#### `jSQL.select(columns)`

Create a query that will gather a result set from a table to be fetched.

##### Parameters

 - **columns**: A column name (string) or an array of column names, or the special string `*` which will return all columns in the table.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "SELECT".

##### Example

```
var query = jSQL.select("*").from('Users').execute();
var users = query.fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQL.insertInto(tableName)`

Create a query that will insert rows into a table.

##### Parameters

 - **tableName**: The name of the table to insert rows to.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "INSERT".

##### Example

```
var query = jSQL.insertInto('Users').values({Name: 'Jill', Age: 25}).execute();
```

[Back to Top](#jsql)

----------

#### `jSQL.dropTable(tableName)`

Create a query that will delete a table.

##### Parameters

 - **tableName**: The name of the table to delete.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "DROP".

##### Example

```
var query = jSQL.dropTable('Users').execute();
```

[Back to Top](#jsql)

----------


#### `jSQL.update(tableName)`

Create a query that will alter records in a table.

##### Parameters

 - **tableName**: The name of the table to update.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "UPDATE".

##### Example

```
jSQL.update('Users')
    .set({Name:'Old Person'})
    .where('Age')
    .greaterThan(37)
    .execute();
```

[Back to Top](#jsql)

----------


#### `jSQL.deleteFrom(tableName)`

Create a query that will delete records in a table.

##### Parameters

 - **tableName**: The name of the table to delete records from.

##### Returns

 - A [`jSQLQuery`](#jsqlquery-interface) object of type "DELETE".

##### Example

```
// Without a WHERE clause, this will truncate the table.
jSQL.deleteFrom(`Users`).execute();
```

[Back to Top](#jsql)

----------


### `jSQLTable` class

This class represents a table in the database. The database is located in [`jSQL.tables`](#jsqltables) and is an object whos keys are table names and values are their respective [`jSQLTable`](#jsqltable-class) classes. 

These tables are altered and queried by [`jSQLQuery`](#jsqlquery-interface) objects, but may be interacted with directly if desired.

[Back to Top](#jsql)

----------


#### `jSQLTable.name`

The name of the table. (string)

[Back to Top](#jsql)

----------


#### `jSQLTable.columns`

An array of the table's column names.

[Back to Top](#jsql)

----------


#### `jSQLTable.data`

A 2D array of the table's data.

[Back to Top](#jsql)

----------

#### `jSQLTable.colmap`

An object whos keys are column names and values are their respective array index.

[Back to Top](#jsql)

----------


#### `jSQLTable.renameColumn(oldname, newname)`

Renames a column in the table.

##### Parameters

 - **oldname**: The name of the column to be changed. (string)
 - **newname**: The new name of the column. (string)

##### Example

```
jSQL.tables.Users.renameColumn('Name', 'FullName');
jSQL.persist();
```
[Back to Top](#jsql)

----------

#### `jSQLTable.addColumn(name, defaultVal)`

Adds a column to a table.

##### Parameters

 - **name**: The name of the column to be added. (string)
 - **newname**: The default value for this column. All existing rows will be assigned this value.

##### Example

```
jSQL.tables.Users.addColumn('FavoriteColor', 'Green');
jSQL.persist();
```
[Back to Top](#jsql)

----------


#### `jSQLTable.loadData(data)`

Adds multiple rows to a table.

##### Parameters

 - **data**: A 2D array of data to be added to the table.
 
##### Example

```
var data = [
    {Name: "Delux Model", "ProductID": 0},
    {Name: "Supreme Model", "ProductID": 1},
    {Name: "Super Model", "ProductID": 2},
    {Name: "Regular Model", "ProductID": 3},
    {Name: "Small Model", "ProductID": 4}
];
jSQL.tables.Products.loadData(data);
jSQL.persist();
```

[Back to Top](#jsql)

----------


#### `jSQLTable.insertRow(data)`

Adds a row to a table.

##### Parameters

 - **data**: An array of data to be added to the table.

##### Example

```
var data = ["Sooper Delux Model", 5];
jSQL.tables.Products.insertRow(data);
jSQL.persist();
```

[Back to Top](#jsql)

----------

### `jSQLquery` interface

This interface is the heart of jSQL and handles all database operations. There are 6 classes that implement this interface, depending on the query's `type` property. Query types are "CREATE", "UPDATE", "SELECT", "INSERT", "DROP", and "DELETE". 

While all the methods of this interface are available in all of the classes that implement it, some of these methods only apply to certain types and if building a query, these methods should be called in logical order.

For example, in SQL, you would NOT say `UPDATE USERS WHERE B = 3 SET C = 4`. Likewise, in jSQL you wouldn't say `jSQL.update(`users`).where('B').equals(3).set({C:4})` The correct SQL syntax is `UPDATE USERS SET C = 4 WHERE B = 3` and likewise, the correct jSQL syntax is `jSQL.update(`users`).set({C:4}).where('B').equals(3)`.

[Back to Top](#jsql)

----------

#### `jSQLQuery.ifNotExists()`

Used for "CREATE" queries to set a flag that will prevent overwriting this table if it already exists.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
jSQL.createTable('Users').ifNotExists().execute();
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.execute(preparedVals)`

Used for ALL query types. This function executes the query, setting the result set, if any, and performing the operation on the tables.

##### Parameters

 - **preparedVals**: Queries may substitute a question mark for a given value to create a prepared statement, when used, the question marks are replaced with the values provided in this array, in order.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
jSQL.query('UPDATE Users SET Name = ?').execute(['Frank']);
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.fetch(mode)`

Used for "SELECT" queries to return the first row in the result set.

##### Parameters

 - **mode**: This can be either "ASSOC" or "ARRAY" and defaults to "ASSOC". When "ARRAY" is provided, this function will return a flat array, else it will return the result as an object with column name keys.

##### Returns

 - An array or object of the first result in the query's result set.

##### Example

```
var query = 
    jSQL.select('*')
    .from('Users')
    .where('Name')
    .equals('Frank')
    .execute();
var Frank = query.fetch('ASSOC');
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.fetchAll(mode)`

Used for select queries to return the all rows in the result set.

##### Parameters

 - **mode**: This can be either "ASSOC" or "ARRAY" and defaults to "ASSOC". When "ARRAY" is provided, this function will return an array of flat array, else it will return the result as an array of objects with column name keys.

##### Returns

 - An array containing all records in the result set.

##### Example

```
var sql = 'SELECT `Name`, `Age` FROM `Users` WHERE `Age` > 32';
var query = jSQL.query(sql);
query.execute();
var oldPeople = query.fetchAll('ASSOC');
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.values(data)`

Used for "INSERT" queries to set the values to be inserted into the newly created row.

##### Parameters

 - **data**:  May be either a flat array of values or an object with column names as keys.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
var q = jSQL.insertInto('Users').values({Name: "?", Age: "?"});
q.execute(['Susan', 37]);
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.set(data)`

Used for "UPDATE" queries to set the columns and values to be altered.

##### Parameters

 - **data**:  An object with column names as keys.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
var q = jSQL.insertInto('Users').values({Name: "?", Age: "?"});
q.execute(['Susan', 37]);
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.where(column)`

Used for "DELETE", "SELECT", and "UPDATE" queries to refine the result set, or the set of results to be altered or deleted.

##### Parameters

 - **column**:  The first column name to add a condition to.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object that belongs to the current [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
jSQL.deleteFrom('Users').where('Age').greaterThan(37).execute();
```

[Back to Top](#jsql)

----------

#### `jSQLQuery.from(table)`

Used for ""SELECT" queries to define the table from which to pull the results.

##### Parameters

 - **table**:  The table from which to pull the results.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
var allUsers = jSQL.select('*').from('Users').execute().fetchAll();
```

[Back to Top](#jsql)

----------

### `jSQLWhereClause` class

For query types that have a where clause ("DELETE", "SELECT", and "UPDATE"), this method is accessed via the query's [`where()`](#jsqlwhereclausewherecolumn) method. This is used to filter and sort results in a "SELECT" query or the results to be edited or delete with "DELETE" and "UPDATE" queries.

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.where(column)`

Set a column to add a filter to.

##### Parameters

 - **column**:  The column to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var allSusans =
     jSQL.select('*')
    .from('Users')
    .where('Name')
    .equals('Susan')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.equals(value)`

Filter results to ones where the filtered column matches the given value

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var OldUsers =
     jSQL.select(['Name', 'Age'])
    .from('Users')
    .where('Age')
    .equals(37)
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.preparedLike()`

For use with "LIKE" modifiers which are used with a prepared query.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var PatrioticUsers =
     jSQL.select(['Name', 'Age'])
    .from('Users')
    .where('Name')
    .preparedLike()
    .execute(['%usa%'])
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.doesNotEqual(value)`

Filter results to ones where the filtered column does not match the given value

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var EveryoneButSusan =
     jSQL.select(['Name', 'Age'])
    .from('Users')
    .where('Name')
    .doesNotEqual('Susan')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.lessThan(value)`

Filter results to ones where the filtered column is less than the given value

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var hipsters =
     jSQL.select(['Name'])
    .from('Users')
    .where('Age')
    .lessThan(23)
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.contains(value)`

Filter results to ones where the filtered column contains the given substring.

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var UsersLikeBob =
     jSQL.select(['Name'])
    .from('Users')
    .where('Name')
    .contains('bob')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.endsWith(value)`

Filter results to ones where the filtered column ends with the given substring.

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var nameEndsWithB =
     jSQL.select(['Name'])
    .from('Users')
    .where('Name')
    .endsWith('b')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.beginsWith(value)`

Filter results to ones where the filtered column begins with the given substring.

##### Parameters

 - **value**:  The value to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var nameBeginsWithB =
     jSQL.select(['Name'])
    .from('Users')
    .where('Name')
    .beginsWith('b')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.and(column)`

Begin an additional condition. Results must match both this condition and the preceeding one.

##### Parameters

 - **column**:  The column to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var nameBeginsAndEndsWithB =
     jSQL.select(['Name'])
    .from('Users')
    .where('Name')
    .beginsWith('b')
    .and('Name')
    .endsWith('b')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.or(column)`

Begin an additional condition. Results must match either this condition or the preceeding one.

##### Parameters

 - **column**:  The column to be used in the filter.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var nameBeginsOrEndsWithB =
     jSQL.select(['Name'])
    .from('Users')
    .where('Name')
    .beginsWith('b')
    .or('Name')
    .endsWith('b')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.limit(limit)`

Limit the rows returned, deleted, or updated.

##### Parameters

 - **limit**:  The number of rows to limit to.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var first3Users =
     jSQL.select('Name')
    .from('Users')
    .limit(3)
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.orderBy(column)`

Sort the result set. Only useful for "SELECT" queries.

##### Parameters

 - **column**:  The column or columns to order results by

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var first3Users =
     jSQL.select('Name')
    .from('Users')
    .limit(3)
    .orderBy('Name')
    .asc()
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.asc()`

Sort the result set ASCENDING. Only useful for "SELECT" queries.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var first3Users =
     jSQL.select('*')
    .from('Users')
    .limit(3)
    .orderBy('Name')
    .asc()
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.desc()`

Sort the result set DESCENDING. Only useful for "SELECT" queries.

##### Returns

 - The [`jSQLWhereClause`](#jsqlwhereclause-class) object.

##### Example

```
var first3Users =
     jSQL.select('*')
    .from('Users')
    .limit(3)
    .orderBy('Name')
    .desc()
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

#### `jSQLWhereClause.execute()`

Builds the result set based on conditions and prepared values provided and then executes the query's [`execute`](#jsqlqueryexecutepreparedvals) method and returns the query itself rather than the query's where clause.

##### Returns

 - The [`jSQLQuery`](#jsqlquery-interface) object.

##### Example

```
var allUsers =
     jSQL.select('*')
    .from('Users')
    .execute()
    .fetchAll();
```

[Back to Top](#jsql)

----------

### jSQL Syntax

The [`jSQL.query`](#jsqlquerysqlquery) method understands a subset of mySQL. It can parse and execute basic CRUD queries as well as DROP table queries.

jSQL ignores whitespace.

jSQL handles Prepared Statements and will replace question marks with values passed to the query's [`execute`](#jsqlqueryexecutepreparedvals) method.

jSQL ignores case except when dealing with table or column names or values.

jSQL permits the use of backticks (`) around table and column names, but they are not required.


----------

####SELECT Query syntax
```
SELECT
    column_name [, column_name ...]
    FROM table
    [WHERE where_condition]
    [ORDER BY col_name [ASC | DESC], ...]
    [LIMIT row_count]
```


----------


####CREATE Query syntax
```
CREATE TABLE [IF NOT EXISTS] tbl_name
    (column name,...)
```

[Back to Top](#jsql)

----------


####UPDATE Query syntax
```
UPDATE table_name
    SET col_name1={expr1} [, col_name2={expr2] ...
    [WHERE where_condition]
    [ORDER BY ...]
    [LIMIT row_count]
```

[Back to Top](#jsql)

----------


####INSERT Query syntax
```
INSERT INTO tbl_name
    [(col_name,...)]
    VALUES (value,...)
```

[Back to Top](#jsql)

----------


####DROP Query syntax
```
DROP TABLE tbl_name
```

[Back to Top](#jsql)

----------

####DELETE Query syntax
```
DELETE FROM tbl_name
    [WHERE where_condition]
    [ORDER BY ...]
    [LIMIT row_count]
```

[Back to Top](#jsql)

----------

### Examples

#### CREATE Queries
Each of the following queries are identical
```javascript
jSQL.query('CREATE TABLE IF NOT EXISTS table (column1, column2)').execute();
jSQL.createTable('table', ['column1','column2']).ifNotExists().execute(); 
```

#### SELECT Queries
Each of the following queries are identical
```javascript
jSQL.query('SELECT * FROM table WHERE column1 = "value"').execute();
jSQL.query('SELECT * FROM table WHERE column1 = ?').execute(['value']);
jSQL.select('*').from('table').where('column1').equals("value").execute(); 
```

#### UPDATE Queries
Each of the following queries are identical
```javascript
jSQL.query('UPDATE table SET column = value').execute();
jSQL.query('UPDATE table SET column = ?').execute(['value']);
jSQL.update('table').set({column: 'value'}).execute();
jSQL.update('table').set({column: '?'}).execute(['value']);
```

#### DELETE Queries
Each of the following queries are identical
```javascript
jSQL.query('DELETE FROM table WHERE column = value').execute();
jSQL.query('DELETE FROM table WHERE column = ?').execute(['value']);
jSQL.deleteFrom('table').where('column').equals('value').execute();
jSQL.deleteFrom('table').where('column').equals('?').execute(['value']);
```

#### DROP Queries
Each of the following queries are identical
```javascript
jSQL.query('DROP TABLE `Users`').execute();
jSQL.dropTable('Users').execute();
```

[Back to Top](#jsql)

----------

### License

Copyright 2016 Rob Parham

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this software except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.

[Back to Top](#jsql)


