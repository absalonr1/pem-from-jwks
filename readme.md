# Steps

## [1] (test1@bx.cl / {sister}12345678 )
              
curl -i --request GET https://pool3.auth.us-west-2.amazoncognito.com/login?client_id=ji9boff7bbjjiuu13fab9bko8&response_type=code&scope=openid+email&redirect_uri=http://localhost

OR 

https://pool3.auth.us-west-2.amazoncognito.com/oauth2/authorize?client_id=ji9boff7bbjjiuu13fab9bko8&response_type=code&scope=openid+email&redirect_uri=http://localhost

RETURN --->

http://localhost/?code=c0ff3b96-eb2d-4c8a-936a-db567bfcb0f3

## [2]

curl --request POST https://pool3.auth.us-west-2.amazoncognito.com/oauth2/token \
--data-urlencode 'client_id=ji9boff7bbjjiuu13fab9bko8' \
--data-urlencode 'client_secret=19vnkvu2btrt0fo59m2oerdjq3d1ku9iupjhl0nh7brmtee2obam' \
--data-urlencode 'grant_type=authorization_code' \
--data-urlencode 'redirect_uri=http://localhost' \
--data-urlencode 'code=25761bfd-6682-4358-a7f1-397193b3238c' | jq '.access_token'

RETURN --->

{
"id_token":"eyJraWQiO...",
"access_token":"eyJraWQiOiJmWTl5T2..",
"refresh_token":"eyJj...",
"expires_in":3600,
"token_type":"Bearer"
}

------------------

https://cognito-idp.us-west-2.amazonaws.com/us-west-2_aqOYtMT8m/.well-known/jwks.json

RETURN --->

{
  "keys": [
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "tgw45PzUtZMTTD/feSXoxmnNmwcpevNDtWS3HDJC5aU=",
      "kty": "RSA",
      "n": "rSFTH44gFLmSlwzmBc1CHgfio-Db2u9FzCQlw1BojZfmgQiGLxXE2nBpdwfgR28pNI3XPMU2wdQPQH_iLSI40XUJC2yqT5M-2BFa4v89b0ZUJIMA78FgST-X-DtJDqYtki_sXvZmT7LL3hfVbEmSzD3OGQTpthye73aZ2Fm05pOGlsT0ogNdN_SXE9151SlLTHhH5YqPdGYViXIcBRTyMWWSLg3QyZ9je9dfqJgvuwSwb1Ajj_j1jIgcSVS-qDOnL73zogAfitSrVz_2PrZC8RtlSXJNBmAGpFRD4sVpgz6bTTlKrCHfDqNKQYVa6zaDuIennndaXGUb0qgcd76cuw",
      "use": "sig"
    },
    {
      "alg": "RS256",
      "e": "AQAB",
      "kid": "fY9yOnY3iz7gBJpIHjskwFWe9Fm/4J+AHyoikDNngpE=",
      "kty": "RSA",
      "n": "t7qNdit7UvzSxEFfPF2A0Ed7Rd6nmY5lEgIjg8d7WNFGxv-hGjXtT9z3F8-72b3shHFenkKiiKBHizFV5NUd-8dH7McLxVKVpkmvFn4-uOe6hNvWASAXV66hXD92ObOztiTXhrb9HDyJJD60qoy71wK57EJz7nPEjHDzBCNd596X1UYy5gs0-l-d-m8q1YyI3ssG1ZWqPG2bAetUBkypdQzMP8QjYNUOxuODA6DRnhjN7llvHO5FXRQ5Ok-8nXy9L41JDs_Xz6gq6lYh71RvWkWwjjCZsiLriWoqs4poI1MNw3ARXMXjjEjrx3UJ4dm4VF7jdfX5lMDi0Mezh6nmhw",
      "use": "sig"
    }
  ]
}

# Kong side

Kong will either proxy the request to your Upstream services if the token’s signature is verified, or discard the request if not

## [1] service
curl -i -f -X POST http://localhost:8001/services \
    --data "name=example-service" \
    --data "url=http://jsonplaceholder.typicode.com/todos/1"

#(service id: fd1d819f-a654-4f8a-a133-2cd335c60a9f)

## [2] route
curl -i -f -X POST http://localhost:8001/routes \
    --data "service.id=fd1d819f-a654-4f8a-a133-2cd335c60a9f" \
    --data "paths[]=/example_path"

(route id: 5744c075-5393-4d59-9e2f-2170a7337b58)

## [3] TEST (sin credenciales)
curl -i https://devapigw.bluex.cl/example_path

## Apply JWT
curl -i -X POST http://localhost:8001/routes/5744c075-5393-4d59-9e2f-2170a7337b58/plugins \
    --data "name=jwt"

{"config":{"secret_is_base64":false,"header_names":["authorization"],"uri_param_names":["jwt"],"run_on_preflight":true,"claims_to_verify":null,"maximum_expiration":0,"anonymous":null,"cookie_names":[],"key_claim_name":"iss"},"tags":null,"created_at":1651323546,"id":"04ad73bb-f11f-4c0c-88b1-67af032dabc9","service":null,"consumer":null,"name":"jwt","enabled":true,"route":{"id":"5744c075-5393-4d59-9e2f-2170a7337b58"},"protocols":["grpc","grpcs","http","https"]}%

curl -i -X PATCH http://localhost:8001/plugins/04ad73bb-f11f-4c0c-88b1-67af032dabc9 \
    --data "config.claims_to_verify=nbf"

## Este es !!!    
curl -i -X PATCH http://localhost:8001/plugins/04ad73bb-f11f-4c0c-88b1-67af032dabc9 \
    --data "config.claims_to_verify=exp"

## create consumer    
curl -i -X POST http://localhost:8001/consumers \
    --data "username=consumer-cognito" \
    --data "custom_id=consumer-cognito-id"

{"username":"consumer-cognito","tags":null,"created_at":1651325161,"custom_id":"consumer-cognito-id","id":"5372c686-67b8-47cf-b57f-fd5c1327e419"}%

#delete consumer 
curl -i -X DELETE http://localhost:8001/consumers/consumer-cognito

## apply JWT to consumer    
curl -i -X POST http://localhost:8001/consumers/consumer-cognito/jwt \
    -F "algorithm=RS256" \
    -F "rsa_public_key=@./cognito-poo3-pub-key.pem" \
    -F "key=https://cognito-idp.us-west-2.amazonaws.com/us-west-2_aqOYtMT8m"

{"key":"https://cognito-idp.us-west-2.amazonaws.com/us-west-2_aqOYtMT8m","algorithm":"RS256","tags":null,"created_at":1651325184,"id":"1d0ef821-4692-4b81-8d41-5766cf60079d","consumer":{"id":"5372c686-67b8-47cf-b57f-fd5c1327e419"},"rsa_public_key":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArSFTH44gFLmSlwzmBc1C\nHgfio+Db2u9FzCQlw1BojZfmgQiGLxXE2nBpdwfgR28pNI3XPMU2wdQPQH/iLSI4\n0XUJC2yqT5M+2BFa4v89b0ZUJIMA78FgST+X+DtJDqYtki/sXvZmT7LL3hfVbEmS\nzD3OGQTpthye73aZ2Fm05pOGlsT0ogNdN/SXE9151SlLTHhH5YqPdGYViXIcBRTy\nMWWSLg3QyZ9je9dfqJgvuwSwb1Ajj/j1jIgcSVS+qDOnL73zogAfitSrVz/2PrZC\n8RtlSXJNBmAGpFRD4sVpgz6bTTlKrCHfDqNKQYVa6zaDuIennndaXGUb0qgcd76c\nuwIDAQAB\n-----END PUBLIC KEY-----","secret":"IpipPqyxMSNp3w7A9uoJGF46ZhuUackL"}


## Send a request with the JWT
curl -i https://devapigw.bluex.cl/example_path \
    -H 'Authorization: Bearer eyJraWQiOiJmWTl5T25ZM2l6N2dCSnBJSGpza3dGV2U5Rm1cLzRKK0FIeW9pa0RObmdwRT0iLCJhbGciOiJSUzI1NiJ9.eyJvcmlnaW5fanRpIjoiYmQzNWY1MzItMDU5MC00MzY2LTgxNzctY2E3NWYyYTNjMjI0Iiwic3ViIjoiOTc5NmJlMGUtNGEzZC00MjI0LTlmZDAtMzMyMTAxNDFkNjk1IiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJvcGVuaWQgZW1haWwiLCJhdXRoX3RpbWUiOjE2NTEzMjc3NDYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy13ZXN0LTIuYW1hem9uYXdzLmNvbVwvdXMtd2VzdC0yX2FxT1l0TVQ4bSIsImV4cCI6MTY1MTMzMTM0NiwiaWF0IjoxNjUxMzI3NzQ3LCJ2ZXJzaW9uIjoyLCJqdGkiOiIwMzk0ZmM5Ny03Zjc4LTQ1YWUtODAyZi04OTBiYTRjN2RhNjUiLCJjbGllbnRfaWQiOiJqaTlib2ZmN2JiamppdXUxM2ZhYjlia284IiwidXNlcm5hbWUiOiI5Nzk2YmUwZS00YTNkLTQyMjQtOWZkMC0zMzIxMDE0MWQ2OTUifQ.N-rq3b47lqugySXo2vZRZT73YXyRgVL5bJudauE9oYtimWUf_2EWmestimvu8bwSOryRl_w1Vc9jJcHPn9LIxyDSrANNM3NjFS6ThrHUD96Ek0865ifOzv47i2v7OEnAGwGE3KvB2eQWX-TmVA_252ufCc6zE88YK5uf7tnObZmj0MhKwZH2KS5ylOxUaSlMLcvbirlgLye2mf7-37QkSerE2g6D-QJZHOF_u_auIMR6fOeNKC0PNtV1lbzNdfBnmpwIzZP-IikxDFpbeGzFIR5gfgY0WeTIi1qsmxhW9c5n9Frkn5QZqRaI6I98FKRXuLqMR9ZR1dM6WHTA69bACA'



## Si llamamos con token generado por keycloak

{"message":"No credentials found for given 'iss'"}%


















.
.
