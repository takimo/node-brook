/*npmnize code*/
var Namespace = require('../vendor/brook/lib/namespace');
/*npmnize code*/

/**
@fileOverview brook
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace*/


/**
@name brook
@namespace brookライブラリ群のルートとなる名前空間です。promiseの生成処理を持っています。
*/
Namespace('brook').define(function(ns){
    var VERSION = "0.01";
    /**
     * @class brook.promiseで生成されるインスタンスのインナークラス
     * @name _Promise
     * @memberOf brook
     * @description
     * 実行する前の次の処理をもつオブジェクトです。
     * Promiseインスタンスはbind関数で結合する事ができます。連続した非同期/同期の処理をデータの流れとして抽象化します。
     * subscribe/forEach/runなどの処理を実行するまでは、結合した処理が実行される事はありません。
     * また、コンストラクタは公開されていません。brook.promiseがファクトリとなっています。
     */
    var k       = function(next,val){ next(val); };
    var lift    = function(f){ return ( f instanceof Promise ) ? f : new Promise( f ); };
    var Promise = function(next,errorHandler){
        this.next = next || k;
        if (errorHandler)
            this.setErrorHandler(errorHandler);
    };
    (function(proto){
    /**#@+
     * @methodOf brook._Promise.prototype
     */

    /**
     * @name concat
     * @param {Promise} promise
     */
    proto.concat = function(after){
        var before = this;
        var next   = function(n,val){
            before.subscribe(after.ready(n),val);
        };
        return new Promise(next);
    };
    /**
     * @name bind
     * @param {Promise} promise
     */
    proto.bind = function(){
        var r = this;
        for( var i = 0,l = arguments.length;i<l;i++ ){
            r = r.concat( lift(arguments[i]) );
        }
        return r;
    };
    /**
     * @name ready
     * @param {Promise} promise
     */
    proto.ready = function(n){
        var promise = this;
        return function(val){
            promise.subscribe(n,val);
        };
    };
    /**
     * @name run
     * @param {Promise} promise
     */
    proto.run = function(val){
        this.subscribe( undefined , val );
    };
    /**
     * @name subscribe
     * @param {Promise} promise
     */
    var empty = function(){};
    proto.subscribe = function(_next,val){
        var next = _next || empty;
        if( !this.errorHandler )
            return this.next(next,val);
        
        try {
            this.next(next,val);
        }
        catch(e){
            this.onError(e);
        }
    };
    /**
     * @name forEach
     * @param {Promise} promise
     */
    proto.forEach = proto.subscribe;
    /**
     * @name setErrorHandler
     * @param {Promise} promise
     */
    proto.setErrorHandler = function(f){
        this.errorHandler = lift(f);
    };
    /**
     * @name onError
     */
    proto.onError = function(e){
        (this.errorHandler||new Promise()).run(e);
    };
    /**#@-*/
    })(Promise.prototype);
    /**
     * @name promise
     * @function
     * @memberOf brook
     * @param {function} next
     * @param {function} errorHandler
     * @return {Promise}
     * @description
     * プロミスを生成するファクトリメソッドです。nextは、さらに次の処理を第一引数に受け取り、第二引数に前回の処理の結果を受け取ります。
     * errorHandlerはnextで例外が発生した場合に呼ばれるpromiseか関数を受け付けます。
     * 引数が無い場合は、データをそのまま次の処理に送るpromiseを生成します。
     * @example
     * var p = ns.promise(function(next,value){ next(value+1)});
     * @example
     * var p = ns.promise();
     */
    var promise = function(next,errorHandler){return new Promise(next,errorHandler);};
    ns.provide({
        promise : promise,
        VERSION : VERSION
    });
});

/**
@fileOverview brook.util
@author daichi.hiroki<hirokidaichi@gmail.com>
*/

/*global Namespace setTimeout console setInterval clearInterval*/

/**
@name brook.util
@namespace details here
*/
Namespace('brook.util')
.use('brook promise')
.define(function(ns){
    /**#@+
     * @methodOf brook.util
     */
    /**
     * @name mapper
     * @param {Promise} promise
     */
    var mapper = function(f){
        return ns.promise(function(next,val){
            return next(f(val));
        });
    };
    /**
     * @name through
     * @param {Promise} promise
     */
    var through = function(f){
        return ns.promise(function(next,val){
            f(val);
            return next(val);
        });
    };
    /**
     * @name filter
     * @param {Promise} promise
     */
    var filter = function(f){
        return ns.promise(function(next,val){
            if( f(val) ) return next(val);
        });
    };
    /**
     * @name takeBy
     */
    var takeBy = function(by){
        var num = 1;
        var queue = [];
        return ns.promise(function(next,val){
            queue.push( val );
            if( num++ % (by) === 0){
                next(queue);
                queue = [];
            }
        });
    };
    var now = Date.now ? function() { return Date.now(); }
                       : function() { return +new Date(); };
    var _arrayWalk = function(list,func) {
        for (var i = 0, l = list.length; i < l; i++) {
            func(list[i]);
        }
    };
    var _arrayWalkWithLimit = function (list, func, limit) {
        var index = 0, length = list.length;
        (function() {
            var startTime = now();
            while (length > index && limit > (now() - startTime))
                func(list[index++]);

            if (length > index)
                setTimeout(arguments.callee, 10);
        })();
    };
    var _getArrayWalkWithLimit = function(limit) {
        return function (list, func) {
            _arrayWalkWithLimit(list, func, limit);
        };
    };
    /**
     * @name scatter
     */
    var scatter = function(limit){
        var func = limit ? _getArrayWalkWithLimit(limit) : _arrayWalk;
        return ns.promise(function(next,list){
            func(list,next);
        });
    };
    /**
     * @name wait
     */
    var wait = function(msec){
        var msecFunc
            = ( typeof msec == 'function' ) ?
                msec : function(){return msec;};
        return ns.promise(function(next,val){
            setTimeout(function(){
                next(val);
            },msecFunc());
        });
    };
    var waitUntil = function(f){
        var p = function(next,val){
            if( f() ){
                return next(val);
            }
            setTimeout(function(){ p(next,val);},100);
        };
        return ns.promise(p);
    };
    var debug = function(sig){
        sig = sig ? sig : "debug";
        return through(function(val) {
            console.log(sig + ":",val);
        });
    };
    var cond = function(f,promise){
        return ns.promise(function(next,val){
            if( !f(val) )
                return next( val );
            promise.subscribe(function(val){
                return next( val );
            },val);
        });
    };
    var match = function(dispatchTable, matcher){
        return ns.promise(function(next,val){
            var promise;
            if(matcher)
                promise = dispatchTable[matcher(val)];
            if(!promise)
                promise = dispatchTable[val] || dispatchTable.__default__ || ns.promise();
            promise.subscribe(function(v){
                next(v);
            },val);
        });
    };
    var LOCK_MAP = {};
    var unlock = function(name){
        return ns.promise(function(next,val){
            LOCK_MAP[name] = false;
            next(val);
        });
    };
    var lock = function(name){
        var tryLock = (function(next,val){
            if( !LOCK_MAP[name] ){
                LOCK_MAP[name] = true;
                return next(val);
            }
            setTimeout(function(){
                tryLock(next,val);
            },100);
        });
        return ns.promise(tryLock);
    };
    var from = function(value){
        if( value && value.observe ){
            return ns.promise(function(next,val){
                value.observe(ns.promise(function(n,v){
                    next(v);
                }));
            });
        }
        return ns.promise(function(next,val){
            next(value);
        });
    };
    var EMIT_INTERVAL_MAP = {};
    var emitInterval = function(msec, name){
        var msecFunc
            = ( typeof msec == 'function' ) ?
                msec : function(){return msec;};

        return ns.promise(function(next,val){
            var id = setInterval(function(){
                next(val);
            },msecFunc());
            if (name) {
                EMIT_INTERVAL_MAP[name] = id;
            }
        });
    };
    var stopEmitInterval = function(name) {
        return ns.promise(function(next, value) {
            clearInterval(EMIT_INTERVAL_MAP[name]);
            next(value);
        });
    };
    /**#@-*/
    ns.provide({
        mapper  : mapper,
        through : through,
        filter  : filter,
        scatter : scatter,
        takeBy  : takeBy,
        wait    : wait,
        cond    : cond,
        match   : match,
        debug   : debug,
        lock    : lock,
        unlock  : unlock,
        from    : from,
        waitUntil : waitUntil,
        emitInterval: emitInterval,
        stopEmitInterval: stopEmitInterval
    });
});

/*npmnize code*/
Namespace()
.use('brook promise,VERSION')
.use('brook.util mapper,through,filter,scatter,takeBy,wait,cond,match,debug,lock,unlock,from,waitUntil,emitInterval,stopEmitInterval')
.apply(function(ns){
    module.exports = {
        promise: ns.promise,
        util: {
            mapper  : ns.mapper,
            through : ns.through,
            filter  : ns.filter,
            scatter : ns.scatter,
            takeBy  : ns.takeBy,
            wait    : ns.wait,
            cond    : ns.cond,
            match   : ns.match,
            debug   : ns.debug,
            lock    : ns.lock,
            unlock  : ns.unlock,
            from    : ns.from,
            waitUntil : ns.waitUntil,
            emitInterval: ns.emitInterval,
            stopEmitInterval: ns.stopEmitInterval
        }
    };
});
/*npmnize code*/
