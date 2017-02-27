# VSTS DevOps Bot Using Botframework, nodejs SDK and VSTS REST APIs

## This is an enhancement of the [DevOps-Bot](https://github.com/manisbindra/devopsbot) solution, which had the following drawbacks
* Earlier bot was created prior to the Microsoft Bot Framework being released, and connected only to slack using the node-slack-client. This bot can now be linked to any channel supported by the Microsoft Bot Connector.
* Earlier slack bot used pattern recognition for intents, and was not very intutive. This bot understands natural language processing (using LUIS) to understand intents and entities 

## Configuration
### Following Environment Variables / Appsettings are needed for the application
1. API_URL : The VSTS base url in format "https://your-prefix.visualstudio.com"
2. API_TOKEN : API token in the format "username:password"
3. API_PROJECT : Name of the VSTS Project  
4. LUIS_MODEL_URL : The LUIS MODEL to recognize intents and entities 
5. MICROSOFT_APP_ID : The bot id from dev.botframework.com
6. MICROSOFT_APP_PASSWORD : The bot passport specified when registering bot at dev.botframework.com

### app.js is the entry point of the application
### vsts-bot-LUIS-model.json is the LUIS Model to recognize intents and entities associated with this application. This model can be imported when creating your application at luis.ai
