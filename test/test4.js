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