# smart-queue
A generic purpose FIFO queue with ticket system, inspired by real life.

## The `hows` and `whys` 

Most *queue modules*, at least those that I've been able to find, assume that
you have already ordered your data and are ready to push it into a storage,
which is not always the case, especially when asynchronous functions come into play.

The idea of a **ticket system** seems way easier to manage in many use cases. All
you have to do is request a `ticket` and store the data using the ticket whenever it
arrives (from other asynchronous sources), you don't have to worry about ordering
your data before hand. The queue and tickets do it for you.

## Download
smart-queue is installable via:

- [GitHub](https://github.com/Pupix/smart-queue) `git clone https://github.com/Pupix/smart-queue.git`
- [npm](https://www.npmjs.com/): `npm install smart-queue`

## Quick example

```js
    var Queue = require('smart-queue'),
        q = new Queue(),
        ticket;
    
    //Assume this is the queue of a club
    
    //A ticket is sold
    ticket = q.getTicket();
    
    //Jimmy arrives at the club
    q.join('Jimmmy');
    
    //Bob arrives at the club with the ticket that was sold earlier
    q.join(ticket, 'Bob');
    
    //The queue processing starts
    console.log(q.start());
    => {"1": "Bob"}
    
    console.log(q.next());
    => {"2": "Jimmy"}
    
    //Even if `Jimmy` arrived at the club before anyone else, whoever reserved
    //a ticket earlier got in before him. In this case, `Bob`.

```

## Getting started

### Queue(limit, handler)

Create and instance of `smart-queue`.

**Parameters**

1. **[limit = Infinity] {number}** The maximum number of possible clients in the queue.
2. **[handler] {Function}** Function that will be called when there's an error or the queue has emptied. Will be called with `(error)` as first and only argument.

## Properties

## queue

A simplified and easier to digest version of the actual queue.

It present the queue in an `object` with the `ticket` as key and the specified data as `value` of said `ticket`.

## Methods

### getTicket()

Returns a `ticket` with the next available queue position and creates a placeholder into the queue.

### join(ticket, data)

**Parameters**

1. **[ticket] {number | string | *}** The ticket number to be used for data storage.
2. **[data] {*}** The data to be stored.

### start()

Starts the queue processing and returns the first client in the queue.

### current()

Returns the current client in the queue.

### next()

Removes the current client from the queue and advances the queue.

### reset()

Resets all the `queue`'s data, except for the client `limit` and `handler`.