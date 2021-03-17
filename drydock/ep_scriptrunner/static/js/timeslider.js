'use strict';

// global clientVars

/**
 *
 */
function init(cb) {
  console.log ("init ()");
  
  // Can't have this, note that this is part of the normal behavior of the plugin
  padeditor.ace.setEditable(false);  
}

/**
 *
 */
function reset() {
  console.log ("reset ()");

  // Can't have this, note that this is part of the normal behavior of the plugin
  padeditor.ace.setEditable(true);
}

exports.init = init;
exports.reset = reset;
