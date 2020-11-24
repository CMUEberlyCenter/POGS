'use strict';

var finalhandler = require('finalhandler');
var connect = require('connect');
var serveStatic = require('serve-static');
var api = require('etherpad-lite-client');
var fs = require('fs');
var http = require('http');

var settings = {};
var serve = serveStatic(__dirname, { 'index': ['index.html', 'index.htm'] });
var etherData={
  "groups": {},
  "authors": {}
};

/**
 * https://etherpad.org/doc/v1.8.4/
 * https://blog.etherpad.org/2019/03/18/updating-etherpad-for-modern-javascript/
 * https://github.com/expressjs/serve-static
 * https://stackabuse.com/reading-and-writing-json-files-with-node-js/
 */
class EtherpadRig {

  /**
   *
   */
  constructor () {
    this.padsInitialized=false;
  }

  /**
   *
   */
  createGroup (aGroupName) {
    console.log ("createGroup ()");

    return new Promise ((resolve, reject) => {
      this.etherpad.createGroup(function (error, data) {
        if (error) {
          console.error('Error creating group: ' + error.message);
          reject (error.message);
        } else { 
          console.log('New group created: ' + data.groupID);
          etherData.groups [data.groupID]={
            "name": aGroupName,
            "id": data.groupID,
            "pads": []
          };
          resolve(data);
        }
      });
    });
  }

  /**
   *
   */
  getDefaultGroupID () {
    for (var groupName in etherData.groups) {
      if (etherData.groups.hasOwnProperty(groupName)) {
        let group=etherData.groups [groupName];
        if (group.name) {
          if (group.name=="Default") {
            return (group.id);
          }
        }      
      }
    }

    return (null);
  }

  /**
   *
   */
  createAuthor (anAuthor) {
    console.log ("createAuthor ("+anAuthor+")");

    return new Promise ((resolve, reject) => {
      let args = {
        name: anAuthor
      }

      this.etherpad.createAuthor(function (error, data) {
        if (error) {
          console.error('Error creating group: ' + error.message);
          reject (error.message);
        } else { 
          console.log('New author created: ' + data.authorID);
          etherData.authors [data.authorID]={
            "name": anAuthor
          };
          resolve (data);
        }
      });
    });
  }

  /**
   *
   */
  createPad (aPadName) {
    console.log ("createPad ("+this.getDefaultGroupID ()+","+aPadName+")");

    return new Promise ((resolve, reject) => {
      let args = {
        groupID: this.getDefaultGroupID (),
        padID: aPadName,
        text: '',
      };

      this.etherpad.createPad(args, function(error, data) {
        if (error) { 
          console.error('Error creating pad: ' + error.message);
          reject (error.message);;
        } else {
          //console.log('New pad created: ' + JSON.stringify (data));
          resolve (data);
        }
      });
    });
  }

  /**
   *
   */
  createGroupPad (aGroupName,aPadName) {
    console.log ("createGroupPad ("+aPadName+")");

    return new Promise ((resolve, reject) => {
      let args = {
        groupID: aGroupName,
        padName: aPadName,
        text: '',
      };

      this.etherpad.createGroupPad(args, function(error, data) {
        if (error) { 
          console.error('Error creating pad: ' + error.message);
          reject (error.message);
        } else {
          //console.log('New pad created: ' + JSON.stringify (data));
          resolve(data);
        }
      });
    });
  }  

  /**
   *
   */
  listGroups () {
    console.log ("listGroups ()");

    return new Promise ((resolve, reject) => {
      let args = {};

      this.etherpad.listAllGroups(args, function(error, data) {
        if (error) { 
          console.error('Error listing groups: ' + error.message);
          reject (null);
        } else {
          //console.log('Pad data: ' + JSON.stringify (data.groupIDs));

          for (let i=0;i<data.groupIDs.length;i++) {
            // Create an object for every group we find, assuming it doesn't already exist
            let groupID=data.groupIDs [i];

            if (etherData.groups.hasOwnProperty(groupID)==false) {
              etherData.groups [groupID] = {
                "pads": {}
              };
            }
          }
          
          resolve (data);
        }
      });
    });
  }  

  /**
   *
   */
  listPads (aGroup) {
    console.log ("listPads ("+aGroup+")");

    return new Promise ((resolve, reject) => {
      if (aGroup) {
        let args = {};

        args = {
          groupID: aGroup
        };

        this.etherpad.listPads(args, function(error, data) {
          if (error) { 
            console.error('Error listing pads: ' + error.message);
            reject (error.message);
          } else {
            console.log('Pad data: ' + JSON.stringify (data));

            resolve (data);
          }
        });
      } else {
         let args = {};
         this.etherpad.listAllPads(args, function(error, data) {
          if (error) { 
            console.error('Error listing pads: ' + error.message);
            reject (error.message);
          } else {
            console.log('Pad data: ' + JSON.stringify (data));

            resolve (data);
          }
        });
      }
    });
  }

  /**
   *
   */
  initPads () {
    if (this.padsInitialized==false) {
      console.log ("initPads ()");
      etherpad.createPad ("Default").catch (() => {});
      this.padsInitialized=true;
    }
  }

  /**
   *
   */
  initGroups () {
    console.log ("initGroups ()");

    this.listGroups ().then (() => {
      for (var group in etherData.groups) {
        if (etherData.groups.hasOwnProperty(group)) {           
          etherpad.listPads (group).then (() => {
            etherpad.initPads ();
          });
        }
      }
    }).catch((error) => { console.log (error); });
  }

  /**
   *
   */
  init () {
    console.log ("init ()");

    let rawSettings = fs.readFileSync('settings.json');
    settings = JSON.parse(rawSettings);

    console.log (settings);
    
    this.etherpad = api.connect({
      apikey: settings.apikey,
      host: settings.host,
      port: settings.port
    });

    this.createAuthor ("Monitor").then (() => {
      this.createGroup ("Default").then (() => {
        etherpad.initGroups ();
      }).catch (() => {
        // This is most likely an error indicating the group already exists, we should proceed anyway
        etherpad.initGroups ();
      });
    }).catch(()=>{
      this.createGroup ("Default").then (() => {
        etherpad.initGroups ();
      }).catch (() => {
        // This is most likely an error indicating the group already exists, we should proceed anyway
        etherpad.initGroups ();
      });      
    });
  }

  /**
   *
   */
  writeDefault (req,res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write("<html><body>Default Page</body></html>");
    res.end();
  }
 
  /**
   *
   */
  run () {
    console.log ("run ()");

    this.init ();

    http.createServer(function (req, res) {
      console.log (req.url);

      if (req.url=="/settings") {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(settings));
        res.end();
        return;  
      }  

      if (req.url=="/data") {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(etherData));
        res.end();
        return;  
      }  

      if (req.url=="/pads") {
        etherpad.listPads(null).then ((data) => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.write(JSON.stringify(data));
          res.end();
        });
        return;  
      }      
      
      serve(req, res, finalhandler(req, res));
    }).listen(9000);
  }
}

var etherpad=new EtherpadRig ();
etherpad.run();
