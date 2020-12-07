const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const tableName = process.env.USER_TABLE_NAME || '';
if (!tableName) {
    throw new Error('Variable for table name is required');
}

exports.handler = (event, context, cb) => {
    const params = {
        TableName: tableName,
        Item: {
            email: {
                S: event.request.userAttributes.email
            },
            name: {
                S: event.userName
            }
        }
    };
    ddb.putItem(params, (err, data) => {
        if (err) {
            console.log('Error', err);
            context.done(err, event);
        } else {
            console.log('Success', data);
            context.done(null, event);
        }
    });
};
