# smart-queue
A generic purpose *"delayed"* FIFO queue with ticket system, inspired by real life.

## The `hows` and `whys` 

Most *queue modules*, at least those that I've been able to find, assume that
you have already ordered your data and are ready to push it into a storage,
which is not always the case, especially when asynchronous functions come into play.

The idea of a **ticket system** seems way easier to manage in many use cases. All
you have to do is request a `ticket` and store the data using the ticket whenever it
arrives (from other asynchronous sources), you don't have to worry about ordering
your data beforehand. The queue and tickets do it for you.

## Download
smart-queue is installable via:

- [GitHub](https://github.com/Pupix/smart-queue) `git clone https://github.com/Pupix/smart-queue.git`
- [npm](https://www.npmjs.com/): `npm install smart-queue`

## Quick example

```js
    var Queue = require('smart-queue'),
        bouncer = function (err, status) {
            console.log('The bouncer says: ' + (err || 'The queue has emptied'));
        },
        //We set a handler to be able to read errors and the queue status
        q = new Queue({handler: bouncer}),
        ticket,
        timedTicket;
    
    //Assume this is the queue of a club
    
    //A permanent ticket is sold.
    ticket = q.getTicket();
    
    //A temporary ticket is sold. It must be used within a second or it expires.
    timedTicket = q.getTicket(1000);
    
    //Jimmy arrives at the club.
    q.join('Jimmmy');
    
    //Bob arrives at the club with the ticket that was sold earlier.
    q.join(ticket, 'Bob');
    
    //After a minute the queue process starts.
    setTimeout(function () {
    
        console.log(q.next());
        => {id: 1, value: "Bob"}
        
        //As the queue is processing Megan tries to join with her ticket.
        q.join(timedTicket, 'Megan', function () {
        
            => "The bouncer says: Ticket No. 2 has expired."
            
            //Megan can still join the queue, but now she has to wait in line.
            q.join('Megan');
        });
        
        console.log(q.next());
        => {id: 3, value: "Jimmy"}
        
        console.log(q.next());
        => {id: 4, value: "Megan"}
        
        q.next();
        => "The bouncer says: The queue has emptied"
        
    }, 60000);
    
    //Even if `Jimmy` arrived at the club before anyone else, whoever reserved
    //a ticket earlier had the possibility to get in before him.

```

## Getting started

### Queue(opt)

Creates an instance of `smart-queue`.

**Parameters**

1. **[opt] {Object}** Configuration object
    * **[opt.limit = Infinity] {number}** The maximum number of possible clients in the queue.
    * **[opt.lifetime = Infinity] {number}** The amount of time (in milliseconds) tickets are valid for, after they has been issued.
    * **[opt.handler] {Function}** Function that will be called when there's an error or the queue has emptied. Will be called with `(error, queueStatus)` as arguments.

## Properties

## queue

A simplified and easier to digest version of the actual queue.

It present the queue in an `object` with the `ticket` as key and the specified data as `value` of said `ticket`.

## Methods

### getTicket(lifetime, cb)

Creates a placeholder into the next available queue position and returns its `ticket`.

**Parameters**

1. **[lifetime] {number}** The amount of time (in milliseconds) the ticket is valid for.
2. **[cb] {Function}** An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.

### join(ticket, data, cb)

**Parameters**

1. **[ticket] {number | string | \*}** The ticket number to be used for data storage.
2. **[data] {\*}** The data to be stored.
3. **[cb] {Function}** An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.

### current(cb)

Returns the current client in the queue.

**Parameters**

1. **[cb] {Function}** An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.

### next(cb)

The very first time it's ran it will start the queue processing.
Sequential call of next will remove the current client from the queue
and advance the queue.

**Parameters**

1. **[cb] {Function}** An optional callback for client related errors. Will be called with `(error, queueStatus)` as arguments.

### reset()

Resets all the `queue`'s data, except for the options passed through the Queue constructor.