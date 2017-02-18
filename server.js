
var builder = require('botbuilder');
var restify = require('restify');
var request = require('request');

// setup vsts
// your collection url
// move to environment setting after initial testing
var collectionUrl = process.env.API_URL;
var token = process.env.API_TOKEN;



// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 4141, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
const LuisModelUrl = process.env.LUIS_MODEL_URL;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('greeting', (session, args) => {
       session.send('Hi There');
    })
     .matches('getticketdetails', (session, args) => {
    //    session.send('So you want details of a ticket');
       var taskNumber=builder.EntityRecognizer.findEntity(args.entities,'builtin.number');
       getItemDetails(session, taskNumber.entity);

    })
     .matches('executebuild', (session, args) => {
       session.send('so you want to execute a build');
       
    })
     .matches('userfacingissue',[
        function (session, args) {
            session.send('I think you want to create a work item'); 
            builder.Prompts.choice(session, 'Please select one of the choices', ['yes','no']);
            
        },
        function(session,result)
        {
            session.send(result.response.entity);
            if(result.response.entity == "yes" || result.response.entity == 1)
            {
              session.beginDialog('/raiseTicket');      
            }
            else
            {
             session.endDialog('Sorry I did not understand you intent');

            }

        } ,      
        function (session, result) {
            var ticketNumber = result.response;
            session.send("Your ticket number is %s", ticketNumber);
            session.endDialog();
        }
    ])
       
    
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
    });


bot.dialog('/', intents);

bot.dialog('/raiseTicket', function (session) {
    var tickerNumber = Math.ceil(Math.random() * 20000);
    session.endDialogWithResult({
        response: tickerNumber
    });
});

function getItemDetails(session, taskid) {
var auth, url;

url = collectionUrl + "/DefaultCollection/_apis/wit/workItems/" + taskid;

auth = 'Basic ' + new Buffer(token).toString('base64');

request.get({
  url: url,
  headers: {
    'Authorization': auth
  }
}, function(error, response, body) {
  var json;
  body = body.replace("System.TeamProject", "TeamProject");
  body = body.replace("System.State", "State");
  body = body.replace("System.CreatedBy", "CreatedBy");
  json = JSON.parse(body);
  if (json.fields !== void 0) {
    console.log("   <b>Task</b>: " + json.id + "\n Team Project Name: " + json.fields.TeamProject + "\n");
    session.send(" *Task* : " + json.id + ", *State*: " + json.fields.State + "\n *Project Name*: " + json.fields.TeamProject + ", *Created By*: " + json.fields.CreatedBy + "\n");
    session.send(" You can View / Edit this Task by clicking on the link : " + collectionUrl + "/DefaultCollection/" + (encodeURI(json.fields.TeamProject)) + "/_workitems/edit/" + taskid + "\n");
  } else {
    return session.send(">>> *No Task with Id '" + taskid + "' exists in the configured visual studio team services account*");
  }
});
}

// Helpers


