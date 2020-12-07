const promisify = require('util').promisify;
const Axios = require('axios');
const jsonwebtoken = require('jsonwebtoken');

const jwtToPem = require('jwk-to-pem');
const cognitoPoolId = process.env.COGNITO_POOL_ID || '';
if (!cognitoPoolId) {
    throw new Error('env required for cognito pool id');
}
const cognitoIssuer = `https://cognito-idp.us-east-1.amazonaws.com/${cognitoPoolId}`;

let cacheKeys;

const getPublicKeys = async () => {
    if (!cacheKeys) {
        const url = `${cognitoIssuer}/.well-known/jwks.json`;
        const publicKeys = await Axios.default.get(url);
        cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
            const pem = jwtToPem(current);

            agg[current.kid] = { instance: current, pem };

            return agg;
        }, {});

        return cacheKeys;
    } else {
        return cacheKeys;
    }
};

const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

const decodeToken = async (token) => {
    let result;

    try {
        const tokenSections = (token || '').split('.');
        if (tokenSections.length < 2) {
            throw new Error('Token is invalid');
        }

        const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
        const header = JSON.parse(headerJSON);
        const keys = await getPublicKeys();
        const key = keys[header.kid];
        if (key === undefined) {
            throw new Error('Claim made for unknown kid');
        }
        const claim = await verifyPromised(token, key.pem);
        const currentSeconds = Math.floor((new Date()).valueOf() / 1000);
        if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
            throw new Error('Claim is expired or invalid');
        }
        if (claim.iss !== cognitoIssuer) {
            throw new Error('Claim issuer is invalid');
        }
        result = {
            userName: claim['cognito:username'],
            email: claim.email,
            isValid: true
        }
    } catch (error) {
        result = {
            error,
            isValid: false
        };
    }

    return result;
}

module.exports = decodeToken;