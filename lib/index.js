/*jslint browser: true, devel: true, node: true, ass: true, nomen: true, unparam: true, indent: 4 */

(function () {
    "use strict";

    var XP = require('expandjs');

    /**
     * A generic purpose "delayed" FIFO queue with ticket system, inspired by real life.
     *
     * @class SmartQueue
     * @type {Function}
     */
    module.exports = new XP.Class('SmartQueue', {

        /**
         * Initialize
         *
         * @param {Object} [opt] - Configuration object
         *  @param {number} [opt.limit = Infinity] - The maximum number of possible clients in the queue.
         *  @param {number} [opt.lifetime = Infinity] - The amount of time
         *  (in milliseconds) tickets are valid for, after they have been issued.
         *  @param {Function} [opt.handler] - Function that will be called when
         *  there's an error or the queue has emptied. Will be called with `error`
         *  as first and only argument.
         *
         * @constructs
         * @throws
         */
        initialize: function (opt) {

            //Checking
            XP.assertArgument(XP.isObject(opt) || XP.isVoid(opt), 1, 'Object or void');
            XP.assertOption(XP.isPositive(opt.limit) || XP.isVoid(opt.limit), 'opt.limit', 'positive number or void');
            XP.assertOption(XP.isPositive(opt.lifetime) || XP.isVoid(opt.lifetime), 'opt.ticketTimeout', 'positive number or void');
            XP.assertOption(XP.isFunction(opt.handler) || XP.isVoid(opt.handler), 'opt.handler', 'positive number or void');

            var self = this;

            self._clientLimit    = opt.limit || self._clientLimit;
            self._ticketLifetime = opt.lifetime || self._ticketLifetime;
            self._handler        = opt.handler || self._handler;
        },

        /**************************************************************/
        //PRIVATE UTILITY FUNCTIONS

        /**
         * Checks weather or not the queue has reached its client limit.
         *
         * @method _checkAvailability
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         * @private
         */
        _checkAvailability: {
            value: function (cb) {
                var self = this;
                if (self._clientNumber >= self._clientLimit) {
                    self._status = 'full';
                    self._error('The queue has reached its limit.', cb);
                    return false;
                }
                return true;
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Adds a client entry to the queue using the specified ticket number.
         *
         * @method _createClient
         * @params {number} ticket - The ticket number of the client to be added.
         * @params {number} lifetime - The amount of time (in milliseconds) the ticket is valid for.
         * @private
         */
        _createClient: {
            value: function (ticket, lifetime) {
                var self = this,
                    timeout = lifetime;

                self._queue[ticket] = {
                    status: 'missing',
                    expiresAt: Date.now() + timeout,
                    id: ticket,
                    value: null
                };

                if (timeout !== Infinity) {
                    self._queue[ticket].expHandler = setTimeout(function () {
                        self._removeClient(ticket);
                    }, timeout);
                }
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Sets client's data to a specified ticket number.
         *
         * @method _setClient
         * @params {number} ticket - The ticket number of the client to be set.
         * @params {number} value - The client's data.
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         * @private
         */
        _setClient: {
            value: function (ticket, value, cb) {
                var self = this,
                    curr = self._queue[ticket];

                if (!self._validateTicket(ticket)) {
                    self._error('Ticket No. ' + ticket + ' has expired.', cb);
                    return false;
                }

                clearTimeout(curr.expHandler);
                self._status    = 'filling';
                curr.value      = value;
                curr.id         = XP.toNumber(ticket);
                curr.status     = 'pending';
                curr.expHandler = null;
                return true;
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Removes a client from the queue.
         *
         * @method _removeClient
         * @params {number} id - The ticket number of the client to be removed
         * @private
         */
        _removeClient: {
            value: function (id) {
                var self = this;
                XP.withdraw(self._queue, XP.toString(id));
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Returns a simplified version of a client.
         *
         * @method _simplifyClient
         * @params {Object} client - A `client` object
         * @private
         */
        _simplifyClient: {
            value: function (client) {
                return {id: client.id, value: client.value};
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Checks weather or not a client's ticket has expired.
         *
         * @method _validateTicket
         * @params {number} ticket - A client's ticket number
         * @private
         */
        _validateTicket: {
            value: function (ticket) {
                var self = this,
                    client = self._queue[ticket];

                if (client) {
                    return client.expiresAt >= Date.now();
                }
                return false;
            },
            configurable: false,
            enumerable: false
        },

        /**
         * Send out error through the provided handler.
         *
         * @method _error
         * @params {number} err - The error message to be sent.
         * @params {Function} [cb] - An optional callback to be called alongside the main handler. Will be called with `(error, queueStatus)` as arguments.
         * @private
         */
        _error: {
            value: function (err, cb) {
                var self = this;
                self._handler(new Error(err), self._status);
                if (cb) { cb(new Error(err), self._status); }
            },
            configurable: false,
            enumerable: false
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
            value: Infinity,
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
         * The time required for a ticket to expire.
         * If the ticket is not used withing the defined time frame it
         * will expire and its reference in the queue will be removed.
         *
         * @property _ticketLifetime
         * @type {number}
         * @private
         */
        _ticketLifetime: {
            value: Infinity,
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
            value: XP.mock(),
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
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         */
        current: {
            value: function (cb) {
                var self = this,
                    client;

                if (self._status !== 'finished') {
                    client = self._queue[self._currentTicket];
                    return self._simplifyClient(client);
                }
                self._error('The queue is empty', cb);
            },
            configurable: false
        },

        /**
         * Removes the current client from the queue and sets the next one in line.
         *
         * @method next
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         */
        next: {
            value: function (cb) {
                var self = this,
                    next = self._queue[self._currentTicket += 1];

                //Remove finished queue entry
                self._removeClient(self._currentTicket - 1);

                //Queue is empty
                if (self._clientNumber === 0) {
                    self._status = 'finished';
                    self._handler(null, self._status);
                    if (cb) { cb(null, self._status); }
                    self._status = 'empty';
                    return;
                }

                //The next client is not `currentTicket + 1`
                if (!next) {
                    return self.next(cb);
                }

                //The current client doesn't have a value, therefore is missing from the queue
                if (XP.isVoid(next.value)) {
                    self._error('Client No. ' + self._currentTicket + ' is missing.', cb);
                }

                return self._simplifyClient(next);
            },
            configurable: false
        },

        /**
         * Returns a `ticket` with the next available queue position
         * and creates a placeholder into the queue.
         *
         * @method getTicket
         * @param {number} [lifetime] The amount of time (in milliseconds) the ticket is valid for.
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         */
        getTicket: {
            value: function (lifetime, cb) {
                var self = this,
                    number;

                lifetime = XP.toNumber(lifetime) || self._ticketLifetime;

                if (self._checkAvailability(cb)) {
                    number = (self._ticketNumber += 1);
                    self._createClient(number, lifetime);
                    return number;
                }
            },
            configurable: false
        },

        /**
         * Adds data to a specific point of the queue if a `ticket` is present,
         * otherwise it just appends the data in the queue.
         *
         * @method join
         * @param {number | string | *} ticket - The ticket number to be used for data storage.
         * @param {*} [data] - The data to be stored.
         * @param {Function} [cb] - An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.
         *
         */
        join: {
            value: function (ticket, data, cb) {
                var self = this;

                if (XP.isNumeric(ticket) && !XP.isVoid(data)) {
                    return self._setClient(ticket, data, cb);
                }
                if (self._checkAvailability(cb)) {
                    return self.join(self.getTicket(), ticket, cb);
                }
            },
            configurable: false
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