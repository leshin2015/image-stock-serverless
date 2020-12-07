const AWS = require('aws-sdk');
const decodeToken = require('./decode-token.js');
const { v4: uuid }  = require('uuid');

const s3 = new AWS.S3({
    signatureVersion: 'v4',
});
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const originBucket = process.env.ORIGIN_BUCKET;
const tableName = process.env.IMAGE_TABLE_NAME || '';
if (!tableName) {
    throw new Error('Variable for image table name is required');
}

exports.handler = async (event, context, callback) => {
    const token = event.headers['Authorization'];
    const eventBody = JSON.parse(event.body);
    const encodedImage = eventBody.image;
    const imageFormat = eventBody.format;
    const imageName = eventBody.imageName;
    const imageWidth = eventBody.width;
    const imageHeight = eventBody.height;
    const decodedImage = Buffer.from(encodedImage, 'base64');
    const decodedToken = await decodeToken(token);
    const authorEmail = decodedToken.email;
    const imageId = uuid();

    // Put image to origin bucket
    try {
        const params = {
            Body: decodedImage,
            Bucket: originBucket,
            ContentType: `image/${imageFormat}`,
            Key: `${imageId}.${imageFormat}`,
            Metadata: {
                width: imageWidth,
                height: imageHeight,
                fileName: imageName,
                format: imageFormat,
                authorEmail,
                imageId
            }
        };
        await s3.upload(params).promise();
    } catch (error) {
        console.log('S3 invoke error', error);
        callback(error);
    }

    // Put item record to dynamodb
    try {
        const params = {
            TableName: tableName,
            Item: {
                imageId: {
                    S: imageId
                },
                size: {
                    S: 'large'
                },
                name: {
                    S: imageName
                },
                authorEmail: {
                    S: authorEmail
                },
                format: {
                    S: imageFormat
                },
                width: {
                    N: `${imageWidth}`
                },
                height: {
                    N: `${imageHeight}`
                },
                bucket: {
                    S: originBucket
                }
            }
        };
        ddb.putItem(params, (err, data) => {
            if (err) {
                console.log('Error', err);
                callback(err);
            } else {
                console.log('Success', data);
            }
        });
    } catch (error) {
        console.log('DynamoDB invoke error', error);
    }

    const res = {
        statusCode: 200,
        body: 'Successfully push image to S3',
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        isBase64Encoded: false
    };
    callback(null, res);
}
