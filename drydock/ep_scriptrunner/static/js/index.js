/**
 * Via:
 *   https://github.com/ether/ep_copy_paste_select_all/blob/master/static/js/copy_paste_select_all.js
 */

//'use strict';

var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;
var script=null;
var scriptIndex=0;
var participants=null;
var currentCommand=null;
var useDomMethods=true;

/**
 *
 */
function isEmpty (str) {
  if(str === null || str === '') {
    return (true);
  }

  return (false);
}

/**
 * Via: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 */
function debugNodeType (aType) {
  if (aType==Node.ELEMENT_NODE) { console.log ("An Element node like <p> or <div>."); }
  if (aType==Node.ATTRIBUTE_NODE) { console.log ("An Attribute of an Element."); }
  if (aType==Node.TEXT_NODE) { console.log ("The actual Text inside an Element or Attr."); }
  if (aType==Node.CDATA_SECTION_NODE) { console.log ("A CDATASection, such as <!CDATA[[ … ]]>."); }
  if (aType==Node.PROCESSING_INSTRUCTION_NODE) { console.log ("A ProcessingInstruction of an XML document, such as <?xml-stylesheet … ?>."); }
  if (aType==Node.COMMENT_NODE) { console.log ("A Comment node, such as <!-- … -->."); }
  if (aType==Node.DOCUMENT_NODE) { console.log ("A Document node."); }
  if (aType==Node.DOCUMENT_TYPE_NODE) { console.log ("A DocumentType node, such as <!DOCTYPE html>."); }
  if (aType==Node.DOCUMENT_FRAGMENT_NODE) { console.log ("A DocumentFragment node."); }
}

/**
 *
 */
function selectAll () {
  console.log ("selectAll ()");
  
  window.myAce.ace.callWithAce((ace) => {
    const document = ace.ace_getDocument();
  
    const numberOfLines = $(document).find('body').contents().length;
  
    ace.ace_performSelectionChange([0, 0], [numberOfLines - 1, 0], false);
  }, 'selectAll', true);
}

/**
 *
 */
function parseTimestamp (aTimestamp) {
  //console.log ("parseTimestamp ("+aTimestamp+")");

  if (isEmpty (aTimestamp)==true) {
    return(-1);
  }

  if(aTimestamp.indexOf (":")==-1) {
    return (-1);
  }

  var splitter=aTimestamp.split (":");

  var milliseconds=(parseInt(splitter [0])*60*60*1000)+(parseInt(splitter[1])*60*1000)+(parseInt(splitter[2])*1000)+(parseInt(splitter [3])*1);

  return (milliseconds);
}

/**
 *
 */
function getIndicesOf(searchStr, str, caseSensitive) {
  var searchStrLen = searchStr.length;

  if (searchStrLen == 0) {
    return [];
  }

  var startIndex = 0, index, indices = [];

  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }

  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }

  return indices;
}

/**
 *
 */
function processParticipants (aParticipantList) {
  console.log ("processParticipants ()");

}

/**
 *
 */
function runScript () {
  console.log ("runScript ("+scriptIndex+")");

  scriptIndex=0;

  if (script==null) {
    return;
  }

  processParticipants (script ["participants"]);

  var anEntry=script [0];

  var command=anEntry.command;
  var arg1=anEntry.argument1;
  var timestamp=parseTimestamp (anEntry.timestamp);

  currentCommand=anEntry;

  if (window.parent) {
    window.parent.postMessage ({"index": 0, "command": "start"},"*");
  } else {
    console.log ("We're not running in the authoring environment");
  }

  console.log ("Waiting for command (" + command + ") to kick in in: " + timestamp + " milliseconds");

  setTimeout (nextScriptStep,timestamp);

  scriptIndex++;
}

/**
 *
 */
function nextScriptStep () {
  //console.log ("nextScriptStep ("+scriptIndex+")");

  if (script==null) {
    return;
  }

  // Executing current command

  if (currentCommand!=null) {
    executeCommand (currentCommand);
  }

  // Starting wait for next command

  if (scriptIndex<script.length) {
    var anEntry=script [scriptIndex];

    var command=anEntry.command;
    var arg1=anEntry.argument1;
    var timestamp=parseTimestamp (anEntry.timestamp);

    currentCommand=anEntry;

    //console.log ("Waiting for command (" + command + ") to kick in in: " + timestamp + " milliseconds");

    setTimeout (nextScriptStep,timestamp);

    scriptIndex++;
  } else {
    console.log ("Script finished");

    if (window.parent) {
      window.parent.postMessage ({"index": -1, "command": "finish"},"*");
    } else {
      console.log ("We're not running in the authoring environment");
    }

    currentCommand=null;
  }
}

/**
 *
 */
function getParticipant (aParticipant) {
  console.log("getParticipant (" + aParticipant + ")");

  if (participants==null) {
    console.log ("Error no participants array found in script");
    return (null);
  }

  for (var i=0;i<participants.length;i++) {
    var pTest=participants [i];

    console.log ("Comparing " + pTest.id + " to: " + aParticipant);
    if (pTest.id==aParticipant) {
      return (pTest);
    }
  }

  return (null);
}

/**
  e.g.:

    participant: "participant1",
    command: "setText",
    argument1: "Hello World"
    timestamp: "00:00:01:000"
 */
function executeCommand (aCommand) {
  console.log ("Executing: " + aCommand.command + " ...");

  var participant=aCommand.participant;

  var partObject=getParticipant (participant);

  if (partObject==null) {
    console.log ("Error: can't obtain participant object");
    return;
  }

  var command=aCommand.command;

  if (window.parent) {
    window.parent.postMessage ({"index": scriptIndex, "command": command},"*");
  } else {
    console.log ("We're not running in the authoring environment");
  }

  //>------------------------------------------------  

  if (command=="setText") {
    var text=aCommand.argument1;

    var current=padeditor.ace.exportText ();
    var length=current.length;

    console.log ("setText (0," + length + ")");

    window.myAce.callWithAce((ace) => {
      ace.ace_performDocumentReplaceCharRange(0,length,text);
    },'scriptrunner',true);
  }

  //>------------------------------------------------  

  if (command=="setChatText") {
    console.log ("NOP");
  }

  //>------------------------------------------------

  if (command=="replaceFirst") {
    console.log ("replaceFirst ()");

    var current=padeditor.ace.exportText ();

    var from=aCommand.argument1;
    var to=aCommand.argument2;

    if (useDomMethods==false) {
      var index=current.indexOf(from);

      if (index==-1) {
        console.log ("Text to be replaced (" + from + ") not found!");
      } else {
        window.myAce.callWithAce((ace) => {
          ace.ace_performDocumentReplaceCharRange(index,from.length,to);
        },'scriptrunner',true);    
      }
    } else {
      const HTMLLines = $('iframe[name="ace_outer"]').contents().find('iframe').contents().find('#innerdocbody').children('div');
      $(HTMLLines).each(function () { // For each line
        //findAndReplace(from, to, this, partObject.color);
        findAndReplaceOriginal(from, to, this, partObject.color);
      });      
    }
  }

  //>------------------------------------------------

  if (command=="deleteFirst") {
    console.log ("deleteFirst ()");

    var current=padeditor.ace.exportText ();

    var deleter=aCommand.argument1;

    var index=current.indexOf(deleter);

    if (index==-1) {
      console.log ("Text to be deleted (" + deleter + ") not found!");
    } else {
      window.myAce.callWithAce((ace) => {
        ace.ace_performDocumentReplaceCharRange(index,deleter.length,"");
      },'scriptrunner',true);    
    }
  }  

  //>------------------------------------------------

  if (command=="replaceAll") {
    console.log ("NOP");

    var from=aCommand.argument1;
    var to=aCommand.argument2;    
  }

  //>------------------------------------------------  

  if (command=="addTextAtEnd") {    
    var text=aCommand.argument1;

    var current=padeditor.ace.exportText ();
    var length=current.length;

    console.log ("addTextAtEnd (" + length + ")");

    window.myAce.callWithAce((ace) => {
      ace.ace_performDocumentReplaceCharRange(length,length,text);
    },'scriptrunner',true);    
  }

  //>------------------------------------------------  
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/URL#properties
 */
function load () {
  console.log ("load ()");

  var prot="http://";

  console.log ("Checking: " + window.location.href);

  if (window.location.href.indexOf ("https")!=-1) {
    prot="https://";
  }

  var urlParser=new URL (window.location.href);
  var searchParams=urlParser.searchParams;
  var fileName='sample-script.json';
  
  for (let p of searchParams) {
    console.log ("Inspecting param: " + p);
    if (p=="file") {      
      fileName=searchParams [p];
      console.log ("Setting filename to: " + filename);
    }
  }  

  var jsonURL=prot + urlParser.hostname + ":9000/loadscript?name=" + fileName;

  console.log ("Loading script from: " + jsonURL);
 
  $.getJSON(jsonURL,function (loadedData) {
    if (loadedData.error) {
      console.log ("Error loading script: " + loadedData.error);
    } else {
      console.log ("Data loaded, processing script ...");

      let data=loadedData.data;

      console.log (data.participants);
      console.log (data.script);

      processParticipants (data.participants);

      script=data.script;
      participants=data.participants;

      runScript ();
    }
  }).done(function() {
    console.log("done");
  })
  .fail(function(jqXHR, textStatus, errorThrown) { 
    console.log ('getJSON request failed! ' + textStatus);
    console.log (errorThrown);
  })
  .always(function() {
    console.log("complete");
  });
}

/**
 *
 */
exports.postAceInit = function(hook_name, args, cb) {
  console.log ("Scriptrunner booting (" + jQuery.fn.jquery + ")...");


  // Quick test to see if we can interact with Ace
  //padeditor.ace.setEditable(false);

  window.myEditor=padeditor;
  window.myAce=padeditor.ace;

  /*
  // Reset the text
  padeditor.ace.ace_setBaseText("This shit again");

 
  // Try a replace-range
  padeditor.ace.replaceRange(undefined, undefined, "Hello cruel world!");

  console.log (padeditor.ace.exportText ());
  */

  load ();
}

/*
const postAceInit = (hook, context) => {
  const $outer = $('iframe[name="ace_outer"]').contents().find('iframe');
  const $inner = $outer.contents().find('#innerdocbody');

  const spellcheck = {
    enable: () => {
      $inner.attr('spellcheck', 'true');
      $inner.find('div').each(function () {
        $(this).attr('spellcheck', 'true');
        $(this).find('div').each(function () {
          $(this).attr('spellcheck', 'true');
        });
      });
    },
    disable: () => {
      $inner.attr('spellcheck', 'false');
      $inner.find('div').each(function () {
        $(this).attr('spellcheck', 'false');
        $(this).find('span').each(function () {
          $(this).attr('spellcheck', 'false');
        });
      });
    },
  };

  // init
  if (padcookie.getPref('spellcheck') === false) {
    $('#options-spellcheck').val();
    $('#options-spellcheck').attr('checked', 'unchecked');
    $('#options-spellcheck').attr('checked', false);
  } else {
    $('#options-spellcheck').attr('checked', 'checked');
  }

  if ($('#options-spellcheck').is(':checked')) {
    spellcheck.enable();
  } else {
    spellcheck.disable();
  }

  // on click
  $('#options-spellcheck').on('click', () => {
    if ($('#options-spellcheck').is(':checked')) {
      padcookie.setPref('spellcheck', true);
      spellcheck.enable();
    } else {
      padcookie.setPref('spellcheck', false);
      spellcheck.disable();
    }
    if (window.browser.chrome) window.location.reload();
  });
};
*/

/**
 *
 */
function findAndReplaceOriginal (searchText, replacement, searchNode, aColor) {
  //console.log ("findAndReplaceOriginal ('" + searchText + "','" + replacement + "'') => " + aColor);

  if (!searchText || typeof replacement === 'undefined') {
    console.log ("Error: no search or replacement text provided!");
    return;
  }

  var regex = typeof searchText === 'string' ? new RegExp(searchText, 'gi') : searchText;
  var childNodes = (searchNode || document.body).childNodes;
  
  let cnLength = childNodes.length;

  //console.log ("Iterating over " + cnLength + " nodes ...");
  
  var excludes = ['html', 'head', 'style', 'title', 'meta', 'script', 'object', 'iframe', 'link'];

  while (cnLength--) {
    //console.log ("Iteration " + cnLength);

    var currentNode = childNodes[cnLength];

    //debugNodeType (currentNode.nodeType);

    if (currentNode.nodeType === 1) {
      if (excludes.indexOf(currentNode.nodeName.toLowerCase() === -1)) {
        //arguments.callee(searchText, replacement, currentNode, aColor);
        findAndReplace (searchText, replacement, currentNode, aColor);
      }
    }

    //console.log ("Testing: " + currentNode.data);

    if (currentNode.nodeType !== 3 || !regex.test(currentNode.data)) {
      //console.log ("Ding!");
      continue;
    }

    //console.log ("Node type is text type and we match");

    var parent = currentNode.parentNode;

    var frag = (() => {
      var html = currentNode.data.replace(regex, replacement);
      var wrap = document.createElement('div');
      wrap.style.backgroundColor = aColor;
      var frag = document.createDocumentFragment();
      wrap.innerHTML = html;
      while (wrap.firstChild) {
        frag.appendChild(wrap.firstChild);
      }
      return frag;
    })();

    //console.log ("Doing the actual replacing ...");

    parent.insertBefore(frag, currentNode);
    parent.removeChild(currentNode);

    //parent.classList.remove(parent.className);
  }

  console.log ("findAndReplace () done");
}


/**
 *
 */
function findAndReplace (searchText, replacement, searchNode, aColor) {
  //console.log ("findAndReplace ('" + searchText + "','" + replacement + "'') => " + aColor);

  if (!searchText || typeof replacement === 'undefined') {
    console.log ("Error: no search or replacement text provided!");
    return;
  }

  var regex = typeof searchText === 'string' ? new RegExp(searchText, 'gi') : searchText;
  var childNodes = (searchNode || document.body).childNodes;
  
  let cnLength = childNodes.length;

  //console.log ("Iterating over " + cnLength + " nodes ...");
  
  var excludes = ['html', 'head', 'style', 'title', 'meta', 'script', 'object', 'iframe', 'link'];

  while (cnLength--) {
    //console.log ("Iteration " + cnLength);

    var currentNode = childNodes[cnLength];

    //debugNodeType (currentNode.nodeType);

    if (currentNode.nodeType === 1) {
      if (excludes.indexOf(currentNode.nodeName.toLowerCase() === -1)) {
        //arguments.callee(searchText, replacement, currentNode, aColor);
        findAndReplace (searchText, replacement, currentNode, aColor);
      }
    }

    //console.log ("Testing: " + currentNode.data);

    if (currentNode.nodeType !== 3 || !regex.test(currentNode.data)) {
      //console.log ("Ding!");
      continue;
    }

    //console.log ("Node type is text type and we match");

    var span = currentNode.parentNode;

    var div = span.parentNode;
    var text = currentNode.data;
    var className = span.className;

    console.log ("Class verify: " + currentNode.className);
    console.log ("Class verify: " + span.className);
    console.log ("Class verify: " + div.className);

    var preIndex=currentNode.data.indexOf (searchText);

    var pre=currentNode.data.substring (0, preIndex);
    var cont=currentNode.data.substring(preIndex, searchText.length);
    var rest=currentNode.data.substring(preIndex + searchText.length, currentNode.data.length);

    console.log ("("+pre+"),("+cont+"),("+rest+")");

    var span1 = document.createElement('span');
    span1.className = className;
    span1.innerHTML = pre;

    var span2 = document.createElement('span');
    span2.style.backgroundColor = aColor;
    span2.innerHTML = replacement;

    var span3 = document.createElement('span');
    span3.className = className;
    span3.innerHTML = rest;

    var frag = document.createDocumentFragment();    

    frag.appendChild (span1);
    frag.appendChild (span2);
    frag.appendChild (span3);

    // Now remove the original and we should be good to go
    div.removeChild (span);

    div.appendChild (frag);
  }

  //console.log ("findAndReplace () done");
}
