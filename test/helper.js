'use strict';

var Helper = module.exports = {};

Helper.SANDBOX_DIR = require('fs').realpathSync(__dirname + '/..') + '/tmp/sandbox';
