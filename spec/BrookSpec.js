var brook = require('../lib/brook');
console.log(brook);

var brook_exported_modules = [
  "promise"
];

var brook_util_exported_modules = [
  "mapper",
  "through",
  "filter",
  "scatter",
  "takeBy",
  "wait",
  "cond",
  "match",
  "debug",
  "lock",
  "unlock",
  "from",
  "waitUntil",
  "emitInterval",
  "stopEmitInterval"
];

describe("A Suite is export module", function() {

  brook_exported_modules.forEach(function(moduleName){
    it("[brook] defeined export " + moduleName, function(){
      expect(brook[moduleName]).toBeDefined();
    });
  });
  brook_util_exported_modules.forEach(function(moduleName){
    it("[brook.util] defeined export " + moduleName, function(){
      expect(brook.util[moduleName]).toBeDefined();
    });
  });

});

describe("A Suite is checked promise action", function() {

  it("create promise", function(){
    var promise = brook.promise(function(value, next){})
    expect(promise).toBeDefined();
    expect(promise.run).toBeDefined();
    expect(promise.subscribe).toBeDefined();
  });

  it("chain promise", function(){
    var promise1 = brook.promise(function(value, next){});
    var promise2 = brook.promise(function(value, next){});
    var cheinedPromise = promise1.bind(promise2);
    expect(cheinedPromise).toBeDefined();
  });

  it("run promise", function(){
    var promise1 = brook.promise(function(next, value){
      console.log("promise1");
      console.log(value);
      value = value * 2;
      next(value);
    });
    var promise2 = brook.promise(function(next, value){
      console.log(value);
      value = value + 1;
      next(value);
    });

    var defaultNumber = 5;
    var resultNumber = 11;
    promise1.bind(promise2).subscribe(defaultNumber, function(value){
      expect(value).toEqual(resultNumber);
    });
  });

});
