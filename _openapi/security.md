
# Open API Security

## TL;DR

For each defined security provider in the OpenAPI source an OpenAPI Security Provider service must be registered. The service property `name` for this service must match the name of the service provider in the source.

To get started, use the security suite based on the OSGi User Admin service. This suite has an implementation for the different security provider types. For example, we need to configure the following security definition in the OpenAPI source:

     "basic": {
        "type": "basic"
      }
 
This translates to:

* Type is Basic Authentication
* Security definition name is `basic`

The following bundles are required to provide an OpenAPI Service Provider and Authority service based on User Admin.

* `biz.aQute.openapi.security.useradmin.provider` – Provides a configurable basic authentication provider. The key used in useradmin to find the given user name is configurable as is the salt and the hash used. It also provides a Gogo command to set and remove basic authentication ids and their hashed+salted password.
* `biz.aQute.useradmin.util` – Provides an implementation of the OSGi enRoute Authority based on the OSGi User Admin. Also here with a Gogo command to manipulate the users in User Admin. This authority provider supports a super set of [Apache Shiro] permission syntax.

### Configuring Basic Authentication



We can 
| PID                      | Key                   | Value                |
|--------------------------|-----------------------|----------------------|
| biz.aQute.openapi.ua.basic  | hash                  | { PLAIN, SHA, **SHA_256**,  SHA_512 } |
|                          | salt                  | byte[]               |
|                          | name                  | 'basic-auth'         |
|                          | idkey                 | 'aQute.ua.id'        |
|                          | pwkey                 | 'aQute.ua.pw'        |






## Specification Background

The Open API specification defines _security providers_. These providers are defined in the prolog, the `securityDefinitions` and then referred in each operation in the `security` section. The prolog can also define a `security` section, this is treated as the default security scheme when _no_ `security` section exists in the operation. (no security is providing an empty array in this section.)

The following authentication types are supported:

* Basic – Basic Authentication as defined in [RFC 2617]. 
* API Key – Is used to validate a header or parameter. Can be used to implement schemes like  [Amazon Signing Version 4] or other API key schemes.
* OAuth2 – Authentication through a third party like Google, Microsoft, Facebook. 

A _security_ section in an operation (or the default in the prolog) supports multiple security providers. These providers are arranged in _and/or_ combinations. Since evaluation this combination is non-trivial, there is need for some support from the service provider implementations. 

The OpenAPI specification does not provide authorization support although for OAuth2 providers it supports _scopes_. 

## Implementation

The OpenAPI provider implementation 



The Open API security consists of the _authentication_ and _authorization_. For the authentication the suite offers an `OpenAPISecurityProvider` service with a number of implementations. This service is used to associate a request with an identity. These security providers are listed in the spec file by their name. For each operation, the 



[RFC 2617]: https://www.ietf.org/rfc/rfc2617.txt
[Amazon Signing Version 4]: http://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
