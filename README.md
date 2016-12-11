# jSQL 
v1.1

Too often web applications rely on server side databases to store state information, causing unnecessary strain on the server and longer load time for the end user. jSQL aims to solve the quandary of the stateless web by using various APIs to store serialized data structures on the user's hard drive. 

Under the hood, jSQL has 3 layers. The bottom layer serializes and stores data on the user's hard drive. This layer only exposes a single method, [`jSQL.persist()`](https://github.com/Pamblam/jSQL/wiki/Persistence-Management#jsqlpersist). The middle layer exposes a set of methods which are used to make CRUD operations on the data. At the highest level, jSQL is an SQL engine (hence the name: Javascript Query Language) which understands a subset of standard SQL passed to the [`jSQL.query()`](https://github.com/Pamblam/jSQL/wiki/Querying-the-Database#jsqlquerysqlquery) method.

jSQL is written with flexibility, ease of use, and speed in mind. It supports prepared statements, column typing, and can store any kind of data you need it to, including functions and instances of custom objects. It's applications include caching server-sourced data, state persistence, data management and querying and more. jSQL is young, but is actively maintained and developed and is currently being used in enterprise level applications. 

<hr>

## Usage

jSQL is implemented in a single JavaScript file. Just save the `jSQL.js` or the `jSQL.min.js` file to your project folder and include it.

    <script src='jSQL.js'></script>

<hr>

## Documentation & Examples

jSQL is fully documented in the [jSQL Wiki](https://github.com/Pamblam/jSQL/wiki#jsql-docs), which includes usage examples and anything else you would ever want to know about the library. The repository on GitHub also includes several examples.

<hr>

## Contributors

This project only has one contributor: me, Pamblam. I wrote this from the ground up. No 3rd party libraries or software are used in this project, except possibly in the examples.

<hr>

## Change Log

  - December 11, 2016: Moved all documentation to the [Wiki Pages](https://github.com/Pamblam/jSQL/wiki#jsql-docs) as the readme was getting too long.
  - December 10, 2016: Implemented column typing with the release of version 1.1.
<hr>

## License & Legal

License info is available [here](https://github.com/Pamblam/jSQL/wiki/License).

<hr>
