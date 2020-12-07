'use strict';

const AWS = require('aws-sdk');
const Sharp = require('sharp');
const path = require('path');

const s3 = new AWS.S3({
	signatureVersion: 'v4',
});
const ddb = new AWS.DynamoDB({
	apiVersion: '2012-08-10'
});
// const format = process.env.IMAGE_FORMAT || 'jpg';
const mediumWidth = +process.env.SIZE_MEDIUM_WIDTH || 300;
const smallWidth = +process.env.SIZE_SMALL_WIDTH || 150;
const destBucket = process.env.DESTINATION_BUCKET;
const tableName = process.env.IMAGE_TABLE_NAME || '';
if (!tableName) {
	throw new Error('Variable for image table name is required');
}

exports.handler = async function (event, context, callback) {
	const eventBody = JSON.parse(event.Records[0].body);
	const srcBucket = eventBody.Records ? eventBody.Records[0].s3.bucket.name : '';
	if (!srcBucket) {
		const err = new Error('Invalid event');
		callback(err);
	}
	// Object key may have spaces or unicode non-ASCII characters.
	const srcKey = decodeURIComponent(
		eventBody.Records[0].s3.object.key.replace(/\+/g, ' ')
	);
	let originImage = {};
	let format;
	let fileName;
	let imageId;
	let authorEmail;
	let mediumImage = {
		size: 'medium'
	};
	mediumImage.width = mediumWidth;
	let smallImage = {
		size: 'small'
	};
	smallImage.width = smallWidth;

	// Download the origin image from the S3 source bucket
	try {
		const params = {
			Bucket: srcBucket,
			Key: srcKey,
		};

		originImage.buffer = (await s3.getObject(params).promise()).Body;
		const headObject = await s3.headObject(params).promise();
		const metadata = headObject.Metadata;
		originImage.width = +metadata.width;
		originImage.height = +metadata.height;
		format = metadata.format;
		fileName = metadata['filename'];
		imageId = metadata.imageid;
		authorEmail = metadata.authoremail;
		mediumImage.height = Math.floor((mediumImage.width * originImage.height) / originImage.width);
		smallImage.height = Math.floor((smallImage.width * originImage.height) / originImage.width);
	} catch (error) {
		console.log('Get origin error', error);
		return;
	}

	// Use the Sharp to resize the image and save in a buffer
	try {
		mediumImage.buffer = await Sharp(originImage.buffer)
			.toFormat(format)
			.resize(mediumImage.width, mediumImage.height)
			.toBuffer();
		smallImage.buffer = await Sharp(originImage.buffer)
			.toFormat(format)
			.resize(smallImage.width, smallImage.height)
			.toBuffer();
	} catch (error) {
		console.log('Resize error', error);
		return;
	}

	// Upload the resized image to the destination bucket
	try {
		const destParams = {
			Bucket: destBucket,
			ContentType: `image/${format}`,
		};
		await Promise.all([mediumImage, smallImage].map(image => {
			return s3.putObject({
				...destParams,
				Body: image.buffer,
				Key: `${imageId}-${image.size}.${format}`
			}).promise();
		}));
	} catch (error) {
		console.log('Upload to destination error', error);
		return;
	}

	// Put record to dynamodb
	try {
		const mappingRequests = [mediumImage, smallImage].map(image => {
			return {
				PutRequest: {
					Item: {
						imageId: {
							S: imageId
						},
						size: {
							S: image.size
						},
						name: {
							S: fileName
						},
						authorEmail: {
							S: authorEmail
						},
						format: {
							S: format
						},
						width: {
							N: `${image.width}`
						},
						height: {
							N: `${image.height}`
						},
						bucket: {
							S: destBucket
						}
					}
				}
			};
		});

		const params = {
			RequestItems: {
				[tableName]: mappingRequests
			}
		};
		await ddb.batchWriteItem(params).promise();
	} catch (error) {
		console.log('DynamoDB invoke error', error);
	}

	console.log('Successfully resize image and upload to destination bucket');
};
