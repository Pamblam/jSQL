[![jSQL Logo](http://i.imgur.com/VQlJKOc.png)](http://pamblam.github.io/jSQL/)

jSQL (Official) - Version 2.9.1  - *Now gluten free!*

[![npm version](https://badge.fury.io/js/jsql-official.svg)](https://badge.fury.io/js/jsql-official) [![Build Status](https://travis-ci.org/Pamblam/jSQL.svg?branch=master)](https://travis-ci.org/Pamblam/jSQL) [![Inline docs](http://inch-ci.org/github/Pamblam/jSQL.svg?branch=master)](http://inch-ci.org/github/Pamblam/jSQL)

<hr>

jSQL is a state and data management tool as well as a robust SQL engine for both Node and the browser. For complete documentation, please see [the jSQL Wiki](https://github.com/Pamblam/jSQL/wiki). For plugins, live demos and other information see the [official website](http://pamblam.github.io/jSQL/).

![jSQL Layers](https://i.imgur.com/WKEmFdB.jpg)

# Under the hood, jSQL has 3 layers...

 - **At the Lowest level**, jSQL automatically chooses the best method of storage to save state and interacts directly with it. This layer exposes a persistence method, [`jSQL.commit()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlcommit), which is called to serialize and store all data currently in the jSQL database on the user's hard drive. While the app is open and loaded in the browser, this data is serialized and stored within reach in the [`jSQL.tables`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqltables) object where the library is able to perform operations on it.

 - **In the middle**, a set of methods are used to build [`jSQLQuery` objects](https://github.com/Pamblam/jSQL/wiki/jSQLquery-interface) which execute CRUD commands on the jSQL database and it's tables. *(See: [`jSQL.createTable()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlcreatetableparams), [`jSQL.select()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlselectcolumns), [`jSQL.insertInto()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlinsertintotablename), [`jSQL.dropTable()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqldroptabletablename), [`jSQL.update()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlupdatetablename), and [`jSQL.deleteFrom()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqldeletefromtablename))*

 - **At the highest level**, jSQL is an SQL engine (hence the name: Javascript Query Language) which understands a subset of MySQL passed to the [`jSQL.query()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlquerysqlquery) method, which parses a [jSQL statement](https://github.com/Pamblam/jSQL/wiki/jSQL-Syntax) and uses the above methods to create [`jSQLQuery` objects](https://github.com/Pamblam/jSQL/wiki/jSQLquery-interface) to perform operations on the database.

jSQL is written with flexibility, ease of use, and efficiency in mind. It supports prepared statements, column typing, and can store any kind of data you need it to, including functions and instances of custom objects. It's applications include caching server-sourced data, state persistence, data management and querying and more.

<hr>

## Quick Start

jSQL is implemented in a single JavaScript file. You only need either the [`jSQL.js`](https://github.com/Pamblam/jSQL/blob/master/jSQL.js) file or the minified [`jSQL.min.js`](https://github.com/Pamblam/jSQL/blob/master/jSQL.min.js) file. Feel free to download them directly or use [`npm`](https://www.npmjs.com/package/jsql-official/tutorial):

    npm install jsql-official

If you're running jSQL in a browser, include it in a script tag.

    <script src='jSQL.js'></script>

Or use the one hosted on the github.io site:

    http://pamblam.github.io/jSQL/scripts/jSQL.min.js

If you're running jSQL in Node, `require` the jSQL module.

    var jSQL = require("jSQL.js");

#### Create a table

When the database has loaded into memory, you'll want to make sure you have a table to work with. Any database operations that are to be made immediately when the app loads should be called from within the [`jSQL.load()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlloadonloadcallback) callback.

    jSQL.load(function(){
	    var sql = "create table if not exists users (name varchar(25), age int)";
        jSQL.query(sql).execute();
    });

#### Insert into table

At some point, you might want to put some data in that table.

    jSQL.query("insert into users ('bob', 34)").execute();

Prefer prepared statements? Just replace values with question marks and pass the values to the execute method in an array.

    jSQL.query("insert into users (?, ?)").execute(['bob', 34]);

#### Select from table

Once you've got the data in there, you're probably going to want to get it back out.

    var users = jSQL.query("select * from users where name like '%ob'").execute().fetchAll("ASSOC");

#### Persisting changes in the browser

When you've made changes or additions to the database, call [`jSQL.commit()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlcommit) to commit your changes.

For more information and to read about other update, delete and other operations, see the [jSQL Wiki](https://github.com/Pamblam/jSQL/wiki#jsql-docs).

<hr>

## Documentation & Examples

jSQL is fully documented in the [jSQL Wiki](https://github.com/Pamblam/jSQL/wiki#jsql-docs), which even includes more [simple usage examples](https://github.com/Pamblam/jSQL/wiki/Examples). You may also refer to the package's tests for more [complete and complex examples](https://github.com/Pamblam/jSQL/tree/master/tests). There is also a [live demo](http://pamblam.github.io/jSQL/demo.html) available on the official website.

<hr>

## Browser Support

Works in basically all browsers. jSQL degrades gracefully because it falls back on cookies for persistence if localStorage, IndexedDB and WebSQL are not available. To that end, the library itself does not take advantage of any ES6 features, if you want something that does, have a look at [alaSQL](https://github.com/agershun/alasql).

While jSQL will work in basically all browsers, these ones are preferred:

| **FireFox** | **Android** | **Safari** | **Chrome** | **Samsung** | **Blackberry** | **IE** | **Opera** | **Edge** |
|-------------|-------------|------------|------------|-------------|----------------|--------|-----------|----------|
| 2+ | 2.1+ | 3.1+ | 4+ | 4+ | 7+ | 8+ | 11.5+ | 12+ |

<hr>

## It's Official

In the same way Fedex is Federal. 

<hr>

:us: