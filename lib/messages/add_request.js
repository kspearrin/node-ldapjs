// Copyright 2011 Mark Cavage, Inc.  All rights reserved.

var assert = require('assert');
var util = require('util');

var asn1 = require('asn1');

var LDAPMessage = require('./message');
var LDAPResult = require('./result');

var dn = require('../dn');
var Attribute = require('../attribute');
var Protocol = require('../protocol');

///--- Globals

var Ber = asn1.Ber;



///--- API

function AddRequest(options) {
  if (options) {
    if (typeof(options) !== 'object')
      throw new TypeError('options must be an object');
    if (options.entry && !(options.entry instanceof dn.DN))
      throw new TypeError('options.entry must be a DN');
    if (options.attributes) {
      if (!Array.isArray(options.attributes))
        throw new TypeError('options.attributes must be [Attribute]');
      options.attributes.forEach(function(a) {
        if (!Attribute.isAttribute(a))
          throw new TypeError('options.attributes must be [Attribute]');
      });
    }
  } else {
    options = {};
  }

  options.protocolOp = Protocol.LDAP_REQ_ADD;
  LDAPMessage.call(this, options);

  this.entry = options.entry || null;
  this.attributes = options.attributes ? options.attributes.slice(0) : [];

  var self = this;
  this.__defineGetter__('type', function() { return 'AddRequest'; });
  this.__defineGetter__('_dn', function() { return self.entry; });
}
util.inherits(AddRequest, LDAPMessage);
module.exports = AddRequest;


AddRequest.prototype._parse = function(ber) {
  assert.ok(ber);

  this.entry = dn.parse(ber.readString());

  ber.readSequence();

  var end = ber.offset + ber.length;
  while (ber.offset < end) {
    var a = new Attribute();
    a.parse(ber);
    this.attributes.push(a);
  }

  return true;
};


AddRequest.prototype._toBer = function(ber) {
  assert.ok(ber);

  ber.writeString(this.entry.toString());
  ber.startSequence();
  this.attributes.forEach(function(a) {
    a.toBer(ber);
  });
  ber.endSequence();

  return ber;
};


AddRequest.prototype._json = function(j) {
  assert.ok(j);

  j.entry = this.entry.toString();
  j.attributes = [];

  this.attributes.forEach(function(a) {
    j.attributes.push(a.json);
  });

  return j;
};