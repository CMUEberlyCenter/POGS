var connect = require('connect');
var serveStatic = require('serve-static');
var api = require('etherpad-lite-client');

/**
 * https://etherpad.org/doc/v1.8.4/
 */
class EtherpadRig {

  /**
   *
   */
  constructor () {
    this.group="";
    this.etherpad = api.connect({
      apikey: '34dd399e601fc3abf93127ae209749d9def3ddc29187eaf8a4bcd745680b71d1',
      host: 'localhost',
      port: 9001
    });
  }

  /**
   *
   */
  createGroup () {
    console.log ("createGroup ()");

    this.etherpad.createGroup(function (error, data) {
      if (error) {
        console.error('Error creating group: ' + error.message);
      } else { 
        console.log('New group created: ' + data.groupID);
        etherpad.group=data.groupID;

        etherpad.listGroups ();
      }
    });
  }

  /**
   *
   */
  createAuthor (anAuthor) {
    console.log ("createAuthor ("+anAuthor+")");

    let args = {
      name: anAuthor
    }

    this.etherpad.createAuthor(function (error, data) {
      if (error) {
        console.error('Error creating group: ' + error.message);
      } else { 
        console.log('New author created: ' + data.authorID);
        
      }
    });
  }

  /**
   *
   */
  createPad (aPadName) {
    console.log ("createPad ("+aPadName+")");

    let args = {
      padName: aPadName,
      text: '',
    };

    this.etherpad.createPad(args, function(error, data) {
      if (error) { 
        console.error('Error creating pad: ' + error.message);
      } else {
        console.log('New pad created: ' + data.padID);
      }
    });
  }

  /**
   *
   */
  createGroupPad (aPadName) {
    console.log ("createGroupPad ("+aPadName+")");

    let args = {
      groupID: this.group,
      padName: aPadName,
      text: '',
    };

    this.etherpad.createGroupPad(args, function(error, data) {
      if (error) { 
        console.error('Error creating pad: ' + error.message);
      } else {
        console.log('New pad created: ' + data.padID);
      }
    });
  }  

  /**
   *
   */
  listGroups () {
    console.log ("listGroups ()");

    let args = {};

    this.etherpad.listAllGroups(args, function(error, data) {
      if (error) { 
        console.error('Error listing pads: ' + error.message);
      } else {
        console.log('Pad data: ' + JSON.stringify (data.groupIDs));
      }
    });
  }  

  /**
   *
   */
  listPads () {
    console.log ("listPads ()");

    let args = {
      groupID: this.group
    };

    this.etherpad.listPads(args, function(error, data) {
      if (error) { 
        console.error('Error listing pads: ' + error.message);
      } else {
        console.log('Pad data: ' + data);
      }
    });
  }

  /**
   *
   */
  init () {
    this.createGroup ();
  }
 
  /**
   *
   */
  run () {
    console.log ("run ()");

    this.init ();

    /*
    this.createPad ("Woolley");

    this.listPads ();
    */

    connect().use(serveStatic(__dirname)).listen(9000, function(){
      console.log('Server running on 9000...');
    });
  }
}

var etherpad=new EtherpadRig ();
etherpad.run();
