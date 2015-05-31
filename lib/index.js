/*jslint browser: true, devel: true, node: true, ass: true, nomen: true, unparam: true, indent: 4 */

(function () {
    "use strict";

    var XP = require('expandjs');

    /**
     * A generic purpose FIFO queue with ticket system, inspired by real life.
     *
     * @class SmartQueue
     * @type {Function}
     */
    module.exports = new XP.Class('SmartQueue', {

        /**
         * Initialize
         *
         * @param {number} [limit = Infinity] - The maximum number of possible clients in the queue.
         * @param {Function} [handler] - Function that will be called when there's an error
         * or the queue has emptied. Will be called with `error` as first and only argument.
         *
         * @constructs
         * @throws
         */
        initialize: function (limit, handler) {

            //Checking
            if (XP.isFunction(limit)) { handler = limit; limit = null; }
            XP.assertArgument(XP.isPositive(limit) || XP.isVoid, 1, 'positive number or void');
            XP.assertArgument(XP.isFunction(handler) || XP.isVoid, 1, 'Function or void');

            var self = this;

            self._clientLimit = limit || Infinity;
            self._handler = handler || XP.mock();
        },

        /**************************************************************/
        //PRIVATE UTILITY FUNCTIONS

        /**
         * Checks weather or not the queue has reached its client limit.
         *
         * @method _checkAvailability
         * @private
         */

        _checkAvailability: function () {
            var self = this;
            if (self._clientNumber >= self._clientLimit) {
                self._handler(new Error('Please stand by, the queue has reached its limit'));
            }
        },

        /**************************************************************/
        //PRIVATE PROPERTIES

        /**
         * The status of the queue.
         *
         * @property _status
         * @type {string}
         * @private
         */
        _status: {
            value: 'empty',
            configurable: false,
            enumerable: false
        },

        /**
         * The queue itself.
         *
         * @property _queue
         * @type {Object}
         * @private
         */
        _queue: {
            value: {},
            configurable: false,
            enumerable: false
        },

        /**
         * The number of clients still present in the queue.
         *
         * @property _clientNumber
         * @type {number}
         * @private
         */
        _clientNumber: {
            get: function () {
                return XP.keys(this._queue).length;
            },
            configurable: false,
            enumerable: false
        },

        /**
         * The maximum possible number of clients present in the queue at once.
         *
         * @property _clientLimit
         * @type {number | null}
         * @private
         */
        _clientLimit: {
            value: null,
            configurable: false,
            enumerable: false
        },

        /**
         * The number of the last issued ticket.
         *
         * @property _ticketNumber
         * @type {number}
         * @private
         */
        _ticketNumber: {
            value: 0,
            configurable: false,
            enumerable: false
        },

        /**
         * The ticket number of the current client.
         *
         * @property _currentTicket
         * @type {number}
         * @private
         */
        _currentTicket: {
            value: 0,
            configurable: false
        },

        /**
         * The handler function for error managing and other info.
         *
         * @property _handler
         * @type {Function | null}
         * @private
         */
        _handler: {
            value: null,
            configurable: false,
            enumerable: false
        },

        /**************************************************************/
        //PUBLIC PROPERTIES

        /**
         * A simpler version of the queue itself.
         *
         * @property queue
         * @type {Object}
         */
        queue: {
            get: function () {
                var self = this,
                    queue = {};

                XP.forEach(self._queue, function (client) {
                    queue[client.id] = client.value;
                });

                return queue;
            },
            configurable: false
        },

        /**************************************************************/
        //PUBLIC METHODS

        /**
         * Returns the current client in queue.
         *
         * @method current
         */
        current: {
            value: function () {
                var self = this;
                if (self._status !== 'finished') {
                    return self._queue[self._currentTicket];
                }
                self._handler(new Error('The queue is empty'));
            },
            configurable: false
        },

        /**
         * Removes the current client from the queue and sets the next one in line.
         *
         * @method next
         */
        next: {
            value: function () {
                var self = this,
                    current = self._queue[self._currentTicket],
                    next = self._queue[self._currentTicket += 1];

                if (current) {
                    XP.withdraw(self._queue, XP.toString(self._currentTicket));
                }

                if (!next) {
                    self._handler();
                    self._status = 'finished';
                } else {
                    next.status = 'working';
                    return next;
                }

            },
            configurable: false
        },

        /**
         * Returns a `ticket` with the next available queue position
         * and creates a placeholder into the queue.
         *
         * @method getTicket
         */
        getTicket: {
            value: function () {
                var self = this,
                    number;

                self._checkAvailability();
                number = (self._ticketNumber += 1);
                self._queue[number] = {status: 'missing', id: number, value: null};

                return number;
            },
            configurable: false
        },

        /**
         * Adds data to a specific point of the queue if a `ticket` is present,
         * otherwise it just appends the data in the queue.
         *
         * @method join
         * @param {number | string | *} ticket - The ticket number to be used for data storage.
         * @param {*} [data] [data] - The data to be stored.
         *
         */
        join: {
            value: function (ticket, data) {
                var self = this;

                if (XP.isNumeric(ticket) && !XP.isVoid(data)) {
                    self._queue[ticket].value = data;
                    self._queue[ticket].id = XP.toNumber(ticket);
                    self._queue[ticket].status = 'pending';
                } else {
                    self._checkAvailability();
                    self.join(self.getTicket(), ticket);
                }
            },
            configurable: false
        },

        /**
         * Starts the queue processing.
         *
         * @method start
         */
        start: {
            value: function () {
                var self = this,
                    missing = XP.mapOne(self._queue, function (client) {
                        if (client.status === 'missing') {
                            return client;
                        }
                    });

                if (!missing) {
                    return self.next();
                }

                self._handler(new Error('Queue can\'t start yet, client No. ' + missing.id + ' is missing'));
            }
        },

        /**
         * Resets all the queue's data, except for the client limit and `handler`.
         *
         * @method reset
         */
        reset: {
            value: function () {
                var self = this;

                self._status = 'empty';
                self._queue = {};
                self._ticketNumber = 0;
                self._currentTicket = 0;
            }
        }
    });

}());