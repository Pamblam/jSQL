# jSQL 
v1.1

Too often web applications rely on server side databases to store state information, causing unnecessary strain on the server and longer load time for the end user. jSQL aims to solve the quandary of the stateless web by using various APIs to store serialized data structures on the user's hard drive. 

Under the hood, jSQL has 3 layers: 

 - **At the Lowest level**, jSQL automatically chooses the best method of storage to save state and interacts directly with it. This layer exposes a single method, [`jSQL.persist()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlpersist), which is called to serialize and store all data currently in the jSQL database on the user's hard drive. While the app is open and loaded in the browser, this data is serialized and stored within reach in the [`jSQL.tables`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqltables) object where the library is able to perform operations on it.
 - **In the middle**, a set of methods are used to build [`jSQLQuery` objects](https://github.com/Pamblam/jSQL/wiki/jSQLquery-interface) which execute CRUD commands on the jSQL database and it's tables. *(See: [`jSQL.createTable()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlcreatetableparams), [`jSQL.select()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlselectcolumns), [`jSQL.insertInto()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlinsertintotablename), [`jSQL.dropTable()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqldroptabletablename), [`jSQL.update()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlupdatetablename), and [`jSQL.deleteFrom()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqldeletefromtablename))*
 - **At the highest level**, jSQL is an SQL engine (hence the name: Javascript Query Language) which understands a subset of standard SQL passed to the [`jSQL.query()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlquerysqlquery) method, which parses a [jSQL statement](https://github.com/Pamblam/jSQL/wiki/jSQL-Syntax) and uses the above methods to create [`jSQLQuery` objects](https://github.com/Pamblam/jSQL/wiki/jSQLquery-interface) to perform operations on the database.

jSQL is written with flexibility, ease of use, and speed in mind. It supports prepared statements, column typing, and can store any kind of data you need it to, including functions and instances of custom objects. It's applications include caching server-sourced data, state persistence, data management and querying and more.

<hr>

## Quick Start

jSQL is implemented in a single JavaScript file. Save the `jSQL.js` or the `jSQL.min.js` file to your project folder and include it.

    <script src='jSQL.js'></script>
    
When the database has loaded into memory, you'll want to make sure you have a table to work with. Any database operations that are to be made immediately when the app loads should be called from within the [`jSQL.load()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlloadonloadcallback) callback.

    jSQL.load(function(){
        jSQL.query("create table if not exists users (name varchar(25), age int)").execute();
        
        // alternatively, the low level syntax is...
        // jSQL.createTable({users: {name: {type:varchar, args: 25}, age: {type: int}}}).ifNotExists().execute();
    });
    
At some point, you might want to put some data in that table.

    jSQL.query("insert into users ('bob', 34)").execute();
    
Alternatively, the low level syntax is...

    jSQL.insertInto('users').values({name:'bob',  age:34}).execute();
    
Prefer prepared statements? Just replace values with question marks and pass the values to the execute method in an array.
    
    jSQL.query("insert into users (?, ?)").execute(['bob', 34]);
    
You can use prepared statements in low level syntax too:

    jSQL.insertInto('users').values({name:'?',  age:'?'}).execute(['bob',34]);
    
Once you've got the data in there, you're probably going to want to get it back out.

    var users = jSQL.query("select * from users where name like '%ob'").execute().fetchAll("ASSOC");
    
The low level select sytax is easy too:

    var users = jSQL.select('*').from('users').where('name').like('%ob').execute().fetchAll("ASSOC");

When you've made changes or additions to the database, call [`jSQL.persist()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlpersist) to commit your changes. 

For more information and to read about other query types, see the [jSQL Documentation](https://github.com/Pamblam/jSQL/wiki#jsql-docs).

<hr>

## Documentation & Examples

Every aspect of jSQL is fully documented in the [jSQL Wiki](https://github.com/Pamblam/jSQL/wiki#jsql-docs), which includes [simple usage examples](https://github.com/Pamblam/jSQL/wiki/Examples) and anything else you would ever want to know about the library. The repository on GitHub also includes several more [complete and complex examples](https://github.com/Pamblam/jSQL/tree/master/examples).

<hr>

## Contributors

This project only has one contributor: me. No 3rd party libraries or software are used in this project, except possibly in the examples.

<hr>

## Change Log

  - December 11, 2016: Moved all documentation to the [Wiki Pages](https://github.com/Pamblam/jSQL/wiki#jsql-docs) as the readme was getting too long.
  - December 10, 2016: Implemented column typing with the release of version 1.1.
  
<hr>

## License & Legal

License info is available [here](https://github.com/Pamblam/jSQL/wiki/License).

<hr>
