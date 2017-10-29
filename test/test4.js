var expect = require('chai').expect;
var jSQL = require("../jSQL.js");


jSQL.load(function () {
	jSQL.reset();
	describe('ERROR tests', function () {
		
		it('Testing Error 0001', function(){
			jSQL.query("create table myfunct (f function, id int)").execute();
			var q = jSQL.query("insert into myfunct values (?)");
			var e_ = false;
			try{
				q.execute(["not a function"]);
			}catch(e){
				console.log(e.toString());
				e_ = e.error === "0001";
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0003', function(){
			var e_ = false;
			try{
				jSQL.types.add("poop");
			}catch(e){
				e_ = e.error === '0003';
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0004', function(){
			var e_ = false;
			try{
				jSQL.types.add({});
			}catch(e){
				e_ = e.error === '0004';
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0005', function(){
			var e_ = false;
			try{
				jSQL.types.add({type:"booty", serialize: "poop"});
			}catch(e){
				e_ = e.error === '0005';
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0006', function(){
			var e_ = false;
			try{
				jSQL.types.add({type:"booty", unserialize: "poop", serialize: function(){}});
			}catch(e){
				e_ = e.error === '0006';
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0007', function(){
			var e_ = false;
			try{
				jSQL.createTable({yerMom: [
					{name: 'poo', type: 'piddly'}
				]}).execute();
			}catch(e){
				console.log(e.toString());
				e_ = e.error === "0007";
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Error 0072', function(){
			jSQL.query("create table namesnstuff (id int not null, name varchar)").execute();
			var e_ = false;
			try{
				jSQL.query("insert into namesnstuff (name) values ('bob dole')").execute();
			}catch(e){
				console.log(e.toString());
				e_ = e.error === "0072";
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Lexer Error', function(){
			var e_ = false;
			try{
				jSQL.query("hi im bob ~~~~``~~~``~`~").execute();
				q.execute();
			}catch(e){
				console.log(e.toString());
				e_ = true;
			}
			expect(e_).to.be.true;
		});
		
		it('Testing Parser Error', function(){
			var e_ = false;
			try{
				jSQL.query("hi im bob").execute();
				q.execute();
			}catch(e){
				console.log(e.toString());
				e_ = true;
			}
			expect(e_).to.be.true;
		});
		
	});
});