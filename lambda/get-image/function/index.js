const AWS = require('aws-sdk');
const s3 = new AWS.S3({
	signatureVersion: 'v4',
});
const ddb = new AWS.DynamoDB({
	apiVersion: '2012-08-10'
});
const expiredTime = +process.env.SIGNED_URL_EXPIRED || 60;
const tableName = process.env.IMAGE_TABLE_NAME || '';
if (!tableName) {
	throw new Error('Variable for image table name is required');
}

exports.handler = async (event, context, callback) => {
    const queryParams = event.queryStringParameters;
    const imageId = queryParams.imageId;
    const imageSize = queryParams.size;
    const ddbParams = {
        TableName: tableName,
        Key: {
            imageId: {
                S: imageId
            },
            size: {
                S: imageSize
            }
        }
    };
    const data = await ddb.getItem(ddbParams).promise();
    const normalized = normalizeData(data);
    const params = {
		Bucket: normalized.bucket,
		Key: `${normalized.imageId}.${normalized.format}`,
		Expires: expiredTime
	};
	const url = await s3.getSignedUrlPromise('getObject', params).catch((err) => console.log('err', err));
    
    // TODO implement
    const response = {
        statusCode: 200,
        body: url,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        isBase64Encoded: false
    };
    callback(null, response);
};

// Normalize data that return from get item dynamoDB
const normalizeData = (data) => {
    const obj = {};
    for (const property in data.Item) {
        const subProperty = data.Item[property];
        obj[property] = subProperty['S'] ? subProperty['S'] : +subProperty['N'];
    }
    return obj;
}
