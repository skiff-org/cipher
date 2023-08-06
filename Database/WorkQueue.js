"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));
var _common = require("../utils/common");
/* eslint-disable no-use-before-define */
var ReaderInterfaceImpl = /*#__PURE__*/function () {
  function ReaderInterfaceImpl(queue, item) {
    this.__workQueue = queue;
    this.__workItem = item;
  }
  var _proto = ReaderInterfaceImpl.prototype;
  _proto.__validateQueue = function __validateQueue() {
    (0, _common.invariant)(this.__workQueue._queue[0] === this.__workItem, 'Illegal call on a reader/writer that should no longer be running');
  };
  _proto.callReader = function callReader(reader) {
    this.__validateQueue();
    return this.__workQueue.subAction(reader);
  };
  return ReaderInterfaceImpl;
}();
var WriterInterfaceImpl = /*#__PURE__*/function (_ReaderInterfaceImpl) {
  (0, _inheritsLoose2.default)(WriterInterfaceImpl, _ReaderInterfaceImpl);
  function WriterInterfaceImpl() {
    return _ReaderInterfaceImpl.apply(this, arguments) || this;
  }
  var _proto2 = WriterInterfaceImpl.prototype;
  _proto2.callWriter = function callWriter(writer) {
    this.__validateQueue();
    return this.__workQueue.subAction(writer);
  };
  _proto2.batch = function batch(...records) {
    this.__validateQueue();
    return this.__workQueue._db.batch(records);
  };
  return WriterInterfaceImpl;
}(ReaderInterfaceImpl);
var actionInterface = function (queue, item) {
  return item.isWriter ? new WriterInterfaceImpl(queue, item) : new ReaderInterfaceImpl(queue, item);
};
var WorkQueue = /*#__PURE__*/function () {
  function WorkQueue(db) {
    this._queue = [];
    this._subActionIncoming = false;
    this._db = db;
  }
  var _proto3 = WorkQueue.prototype;
  _proto3.enqueue = function enqueue(work, description, isWriter) {
    var _this = this;
    // If a subAction was scheduled using subAction(), database.write/read() calls skip the line
    if (this._subActionIncoming) {
      this._subActionIncoming = false;
      var currentWork = this._queue[0];
      if (!currentWork.isWriter) {
        (0, _common.invariant)(!isWriter, 'Cannot call a writer block from a reader block');
      }
      return work(actionInterface(this, currentWork));
    }
    return new Promise(function (resolve, reject) {
      var workItem = {
        work: work,
        isWriter: isWriter,
        resolve: resolve,
        reject: reject,
        description: description
      };
      if ('production' !== process.env.NODE_ENV && _this._queue.length) {
        setTimeout(function () {
          var queue = _this._queue;
          var current = queue[0];
          if (current === workItem || !queue.includes(workItem)) {
            return;
          }
          var enqueuedKind = isWriter ? 'writer' : 'reader';
          var currentKind = current.isWriter ? 'writer' : 'reader';
          _common.logger.warn("The ".concat(enqueuedKind, " you're trying to run (").concat(description || 'unnamed', ") can't be performed yet, because there are ").concat(queue.length, " other readers/writers in the queue.\n\nCurrent ").concat(currentKind, ": ").concat(current.description || 'unnamed', ".\n\nIf everything is working fine, you can safely ignore this message (queueing is working as expected). But if your readers/writers are not running, it's because the current ").concat(currentKind, " is stuck.\nRemember that if you're calling a reader/writer from another reader/writer, you must use callReader()/callWriter(). See docs for more details."));
          _common.logger.log("Enqueued ".concat(enqueuedKind, ":"), work);
          _common.logger.log("Running ".concat(currentKind, ":"), current.work);
        }, 1500);
      }
      _this._queue.push(workItem);
      if (1 === _this._queue.length) {
        _this._executeNext();
      }
    });
  };
  _proto3.subAction = function subAction(work) {
    try {
      this._subActionIncoming = true;
      var promise = work();
      (0, _common.invariant)(!this._subActionIncoming, 'callReader/callWriter call must call a reader/writer synchronously');
      return promise;
    } catch (error) {
      this._subActionIncoming = false;
      return Promise.reject(error);
    }
  };
  _proto3._executeNext = function _executeNext() {
    return new Promise(function ($return, $error) {
      var _this2, workItem, work, resolve, reject, isWriter, workPromise;
      _this2 = this;
      workItem = this._queue[0];
      ({
        work: work,
        resolve: resolve,
        reject: reject,
        isWriter: isWriter
      } = workItem);
      var $Try_2_Post = function () {
        try {
          this._queue.shift();
          if (this._queue.length) {
            setTimeout(function () {
              return _this2._executeNext();
            }, 0);
          }
          return $return();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this);
      var $Try_2_Catch = function (error) {
        try {
          reject(error);
          return $Try_2_Post();
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };
      try {
        workPromise = work(actionInterface(this, workItem));
        if ('production' !== process.env.NODE_ENV) {
          (0, _common.invariant)(workPromise instanceof Promise, "The function passed to database.".concat(isWriter ? 'write' : 'read', "() or a method marked as @").concat(isWriter ? 'writer' : 'reader', " must be asynchronous (marked as 'async' or always returning a promise) (in: ").concat(workItem.description || 'unnamed', ")"));
        }
        return Promise.resolve(workPromise).then(function ($await_3) {
          try {
            resolve($await_3);
            return $Try_2_Post();
          } catch ($boundEx) {
            return $Try_2_Catch($boundEx);
          }
        }, $Try_2_Catch);
      } catch (error) {
        $Try_2_Catch(error)
      }
    }.bind(this));
  };
  _proto3._abortPendingWork = function _abortPendingWork() {
    (0, _common.invariant)(1 <= this._queue.length, '_abortPendingWork can only be called from a reader/writer');
    var workToAbort = this._queue.splice(1); // leave only the caller on the queue
    workToAbort.forEach(function ({
      reject: reject
    }) {
      reject(new Error('Reader/writer has been aborted because the database was reset'));
    });
  };
  (0, _createClass2.default)(WorkQueue, [{
    key: "isWriterRunning",
    get: function get() {
      var [item] = this._queue;
      return Boolean(item && item.isWriter);
    }
  }]);
  return WorkQueue;
}();
exports.default = WorkQueue;