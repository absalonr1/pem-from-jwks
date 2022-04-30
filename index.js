const jwkToPem = require('jwk-to-pem');
const requestify = require('requestify');
var request = require('request');

// see : https://aws.amazon.com/blogs/mobile/integrating-amazon-cognito-user-pools-with-api-gateway/
//       https://aws.amazon.com/premiumsupport/knowledge-center/decode-verify-cognito-json-token/
//      https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html

/**
 * Get cognito's secret key
 * @param {String} region
 * @param {String} userPoolId
 * @returns {Promise}
 */
function getPem(region, userPoolId) {
    const jwkUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    var pems;

    request({
        url: jwkUrl,
        json: true
    }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            pems = {};
            var keys = body['keys'];
            for (var i = 0; i < keys.length; i++) {
                //Convert each key to PEM
                var key_id = keys[i].kid;
                var modulus = keys[i].n;
                var exponent = keys[i].e;
                var key_type = keys[i].kty;
                var jwk = { kty: key_type, n: modulus, e: exponent };
                var pem = jwkToPem(jwk);
                pems[key_id] = pem;
                console.log(key_id)
                console.log(pem)
            }


        } else {
            //Unable to download JWKs, fail the call
            console.log("Error")
        }
    });

    return requestify.request(jwkUrl, { method: 'get', dataType: 'json' })
        .then(res => res.getBody()['keys'].shift())
        .then(jwk => console.log(jwkToPem(jwk)));
}

const result = getPem("us-west-2", "us-west-2_aqOYtMT8m")
console.log(result)