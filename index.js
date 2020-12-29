'use strict';

const pageResults = require('graph-results-pager');

const { graphAPIEndpoints } = require('./constants')

const sushi = require('./queries/sushi');
const blocks = require('./queries/blocks');
const exchange = require('./queries/exchange');
const masterchef = require('./queries/masterchef');
const bar = require('./queries/bar')
const maker = require('./queries/maker')
const timelock =  require("./queries/timelock");

module.exports = {
	pageResults,
	graphAPIEndpoints,
	sushi,
	blocks,
	exchange,
	masterchef,
	bar,
	maker,
	timelock,
};
